//! Hrana-over-HTTP client for the shared `sqlite-shared` libSQL server.
//!
//! Prod sets `DB_TYPE=libsql` plus `LIBSQL_URL` / `LIBSQL_ADMIN_URL`. The
//! namespace is `config.database.db` (`BXFood`), selected with `x-namespace`.
//! Zero-crate: outbound HTTP is [`crate::httpc`].

use std::sync::Mutex;

use crate::db::{Changes, DbError, Row, Value};
use crate::httpc;
use crate::json::{self, Json};

const TIMEOUT_MS: i64 = 30_000;

/// One HTTP-backed libSQL connection (namespace + optional Hrana baton).
pub struct Client {
    url: String,
    namespace: String,
    baton: Mutex<Option<String>>,
}

impl Clone for Client {
    fn clone(&self) -> Self {
        Client {
            url: self.url.clone(),
            namespace: self.namespace.clone(),
            baton: Mutex::new(None),
        }
    }
}

impl Client {
    /// `url` is the sqld HTTP base (`http://sqlite-shared.railway.internal:8080`).
    pub fn new(url: &str, namespace: &str) -> Client {
        Client {
            url: url.trim_end_matches('/').to_string(),
            namespace: namespace.to_string(),
            baton: Mutex::new(None),
        }
    }

    /// Create the namespace via the admin API. "already exists" is success.
    pub fn ensure_namespace(admin_url: &str, namespace: &str) -> Result<(), DbError> {
        let base = admin_url.trim_end_matches('/');
        let url = format!("{base}/v1/namespaces/{namespace}/create");
        let res = httpc::post_json(&url, &[], "{}", TIMEOUT_MS)
            .map_err(|e| DbError::local(format!("libsql admin: {e}")))?;
        if res.ok() {
            return Ok(());
        }
        let detail = res.text();
        if detail.to_ascii_lowercase().contains("exist") {
            return Ok(());
        }
        Err(DbError::local(format!(
            "Failed to create namespace '{namespace}' ({}): {detail}",
            res.status
        )))
    }

    /// Run SQL with no result rows.
    pub fn exec(&self, sql: &str) -> Result<(), DbError> {
        self.pipeline(sql, &[]).map(|_| ())
    }

    /// Run a parameterized query and collect rows.
    pub fn query(&self, sql: &str, params: &[Value]) -> Result<Vec<Row>, DbError> {
        self.pipeline(sql, params).map(|out| out.rows)
    }

    /// Run a parameterized write and report rows touched.
    pub fn run(&self, sql: &str, params: &[Value]) -> Result<Changes, DbError> {
        self.pipeline(sql, params).map(|out| out.changes)
    }

    /// Send one statement over Hrana HTTP.
    ///
    /// Outside a transaction every statement is its own stream (sent with a
    /// `close`). A `BEGIN` keeps the stream open and stores its baton, every
    /// statement after it reuses that baton, and `COMMIT` / `ROLLBACK` closes
    /// it. Without this each of `BEGIN`, the writes and `COMMIT` ran on its own
    /// stream: the writes autocommitted and `COMMIT` failed with "no
    /// transaction is active", so every `Pool::transaction` answered an error
    /// after its writes had landed (signup 500, usage gate 500).
    fn pipeline(&self, sql: &str, params: &[Value]) -> Result<ExecOut, DbError> {
        let mut baton = self.baton.lock().unwrap_or_else(|e| e.into_inner());
        let keep_open = stream_stays_open(sql, baton.is_some());
        let mut requests = vec![execute_request(sql, params)];
        if !keep_open {
            requests.push(json::obj([("type", json::s("close"))]));
        }
        let mut body_map = std::collections::BTreeMap::new();
        if let Some(b) = baton.as_ref() {
            body_map.insert("baton".to_string(), json::s(b.clone()));
        }
        body_map.insert("requests".to_string(), Json::Arr(requests));
        let body = json::stringify(&Json::Obj(body_map));

        let url = format!("{}/v2/pipeline", self.url);
        let headers = [("x-namespace", self.namespace.as_str())];
        // A transport failure leaves the stream unusable: drop the baton so
        // this connection does not keep sending it, and let the next
        // statement start a fresh stream.
        let res = match httpc::post_json(&url, &headers, &body, TIMEOUT_MS) {
            Ok(res) => res,
            Err(e) => {
                *baton = None;
                return Err(DbError::local(format!("libsql: {e}")));
            }
        };
        if !res.ok() {
            *baton = None;
            return Err(DbError::local(format!(
                "libsql HTTP {} {}",
                res.status,
                res.text()
            )));
        }
        let parsed = match json::parse(&res.body) {
            Ok(parsed) => parsed,
            Err(e) => {
                *baton = None;
                return Err(DbError::local(format!("libsql JSON: {e}")));
            }
        };

        if keep_open {
            *baton = parsed.get_str("baton").map(str::to_string);
        } else {
            *baton = None;
        }

        let results = parsed
            .get("results")
            .and_then(Json::as_arr)
            .ok_or_else(|| DbError::local("libsql pipeline missing results"))?;
        let first = results
            .first()
            .ok_or_else(|| DbError::local("libsql pipeline empty results"))?;
        if first.get_str("type") == Some("error") {
            let message = first
                .path("error.message")
                .and_then(Json::as_str)
                .unwrap_or("libsql error")
                .to_string();
            return Err(DbError {
                code: 19,
                message,
            });
        }
        let result = first
            .path("response.result")
            .ok_or_else(|| DbError::local("libsql execute missing result"))?;
        Ok(parse_execute(result)?)
    }
}

/// Whether the Hrana stream stays open after `sql`.
///
/// `in_transaction` is true when a baton from an earlier `BEGIN` is held.
/// `BEGIN` opens the stream, `COMMIT` / `END` / `ROLLBACK` (but not
/// `ROLLBACK TO` a savepoint) closes it, and anything else keeps whatever
/// state it found.
fn stream_stays_open(sql: &str, in_transaction: bool) -> bool {
    let words: Vec<String> = sql
        .split_whitespace()
        .take(2)
        .map(str::to_ascii_uppercase)
        .collect();
    match words.first().map(String::as_str) {
        Some("BEGIN") => true,
        Some("COMMIT") | Some("END") => false,
        Some("ROLLBACK") => in_transaction && words.get(1).map(String::as_str) == Some("TO"),
        _ => in_transaction,
    }
}

struct ExecOut {
    rows: Vec<Row>,
    changes: Changes,
}

fn execute_request(sql: &str, params: &[Value]) -> Json {
    let args: Vec<Json> = params.iter().map(arg_json).collect();
    let stmt = json::obj([("sql", json::s(sql)), ("args", Json::Arr(args))]);
    json::obj([("type", json::s("execute")), ("stmt", stmt)])
}

fn arg_json(v: &Value) -> Json {
    match v {
        Value::Null => json::obj([("type", json::s("null"))]),
        Value::Int(n) => json::obj([
            ("type", json::s("integer")),
            ("value", json::s(n.to_string())),
        ]),
        Value::Real(x) => json::obj([("type", json::s("float")), ("value", Json::Num(*x))]),
        Value::Text(s) => json::obj([("type", json::s("text")), ("value", json::s(s.clone()))]),
    }
}

fn parse_execute(result: &Json) -> Result<ExecOut, DbError> {
    let cols: Vec<String> = result
        .get("cols")
        .and_then(Json::as_arr)
        .unwrap_or(&[])
        .iter()
        .map(|c| c.get_str("name").unwrap_or("").to_string())
        .collect();
    let mut rows = Vec::new();
    if let Some(raw_rows) = result.get("rows").and_then(Json::as_arr) {
        for raw in raw_rows {
            let cells = match raw.as_arr() {
                Some(vals) => cols
                    .iter()
                    .enumerate()
                    .map(|(i, name)| {
                        let v = vals.get(i).map(hrana_value).unwrap_or(Value::Null);
                        (name.clone(), v)
                    })
                    .collect(),
                None => Vec::new(),
            };
            rows.push(Row::from_cells(cells));
        }
    }
    let changes = result.get_i64("affected_row_count").unwrap_or(0);
    let last = match result.get("last_insert_rowid") {
        Some(Json::Str(s)) => s.parse().unwrap_or(0),
        Some(Json::Num(n)) => *n as i64,
        _ => 0,
    };
    Ok(ExecOut {
        rows,
        changes: Changes {
            changes,
            last_insert_rowid: last,
        },
    })
}

fn hrana_value(v: &Json) -> Value {
    match v.get_str("type") {
        Some("null") => Value::Null,
        Some("integer") => {
            if let Some(n) = v.get_i64("value") {
                Value::Int(n)
            } else if let Some(s) = v.get_str("value") {
                Value::Int(s.parse().unwrap_or(0))
            } else {
                Value::Null
            }
        }
        Some("float") => Value::Real(v.get("value").and_then(Json::as_f64).unwrap_or(0.0)),
        Some("text") => Value::Text(v.get_str("value").unwrap_or("").to_string()),
        _ => {
            if v.is_null() {
                Value::Null
            } else if let Some(s) = v.as_str() {
                Value::Text(s.to_string())
            } else if let Some(n) = v.as_i64() {
                Value::Int(n)
            } else {
                Value::Null
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::stream_stays_open;

    #[test]
    fn begin_opens_and_commit_or_rollback_closes_the_stream() {
        assert!(stream_stays_open("BEGIN IMMEDIATE", false));
        assert!(stream_stays_open("  begin", false));
        assert!(stream_stays_open("UPDATE Users SET x = 1", true));
        assert!(!stream_stays_open("COMMIT", true));
        assert!(!stream_stays_open("END", true));
        assert!(!stream_stays_open("ROLLBACK", true));
        assert!(stream_stays_open("ROLLBACK TO sp1", true));
    }

    #[test]
    fn statements_outside_a_transaction_close_their_stream() {
        assert!(!stream_stays_open("SELECT 1", false));
        assert!(!stream_stays_open("INSERT INTO t VALUES (1)", false));
        assert!(!stream_stays_open("ROLLBACK", false));
    }
}
