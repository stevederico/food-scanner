//! Food scans: the Open Food Facts lookup and the ingredient rating behind
//! `POST /api/scan`.
//!
//! Both run on the server so the paid feature (a rated product) only leaves
//! the backend after the usage gate admits the caller. The browser never calls
//! Open Food Facts and never receives the ingredient list (`bad_ingredients.json`
//! is compiled into this binary, not the frontend bundle).

use std::collections::HashMap;
use std::sync::OnceLock;

use crate::httpc;
use crate::json::{self, Json};

/// Default Open Food Facts origin; `PRODUCT_API_URL` overrides it (tests point
/// it at a local stub).
pub const DEFAULT_PRODUCT_API_URL: &str = "https://us.openfoodfacts.org";

/// Per-request timeout for the Open Food Facts calls, in milliseconds.
const LOOKUP_TIMEOUT_MS: i64 = 8000;

/// Open Food Facts asks API clients to name themselves in the User-Agent.
const USER_AGENT: &str = "BXFood/1.0 (https://food.bixbyapps.com)";

/// An ingredient whose badness score is above this fails the approval check.
const BADNESS_THRESHOLD: f64 = 5.0;

/// Longest barcode accepted by [`ScanTarget::parse`].
const MAX_CODE_LEN: usize = 64;

/// Longest name search accepted by [`ScanTarget::parse`].
const MAX_QUERY_LEN: usize = 200;

/// What the caller asked to scan.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ScanTarget {
    /// A barcode (ASCII letters and digits only, so it is safe in a URL path).
    Code(String),
    /// A product-name search; the first match is used.
    Query(String),
}

impl ScanTarget {
    /// Read `{"code": "..."}` or `{"query": "..."}` from a request body.
    ///
    /// # Errors
    /// A readable message when neither field holds a valid value.
    pub fn parse(body: &Json) -> Result<ScanTarget, &'static str> {
        if let Some(code) = body.get_str("code") {
            let code = code.trim();
            let valid = !code.is_empty()
                && code.len() <= MAX_CODE_LEN
                && code.bytes().all(|b| b.is_ascii_alphanumeric());
            return if valid {
                Ok(ScanTarget::Code(code.to_string()))
            } else {
                Err("Invalid barcode")
            };
        }
        if let Some(query) = body.get_str("query") {
            let query = query.trim();
            if query.is_empty() || query.chars().count() > MAX_QUERY_LEN {
                return Err("Invalid search");
            }
            // An all-digit search is a barcode, as the search box always treated it.
            if query.len() <= MAX_CODE_LEN && query.bytes().all(|b| b.is_ascii_digit()) {
                return Ok(ScanTarget::Code(query.to_string()));
            }
            return Ok(ScanTarget::Query(query.to_string()));
        }
        Err("Send a barcode or a search")
    }
}

/// Why a lookup produced no product.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LookupError {
    /// Open Food Facts has no such product.
    NotFound,
    /// Open Food Facts could not be reached or answered with an error.
    Unavailable(String),
}

/// A rated ingredient as sent to the browser.
#[derive(Debug, Clone, PartialEq)]
pub struct RatedIngredient {
    /// Ingredient text as Open Food Facts lists it.
    pub text: String,
    /// `red`, `yellow` or `green` when the ingredient is on the list.
    pub color: Option<String>,
}

/// One entry of `bad_ingredients.json`.
struct Rating {
    color: String,
    score: f64,
}

/// The ingredient list keyed by [`normalize`]d name, parsed once.
fn ratings() -> &'static HashMap<String, Rating> {
    static RATINGS: OnceLock<HashMap<String, Rating>> = OnceLock::new();
    RATINGS.get_or_init(|| {
        let parsed = json::parse(include_bytes!("bad_ingredients.json"))
            .expect("bad_ingredients.json is valid JSON");
        let mut map = HashMap::new();
        for entry in parsed.as_arr().unwrap_or(&[]) {
            let Some(name) = entry.get_str("name").or_else(|| entry.get_str("title")) else {
                continue;
            };
            map.insert(
                normalize(name),
                Rating {
                    color: entry.get_str("color").unwrap_or("").to_string(),
                    score: entry
                        .get("baddness_score")
                        .and_then(Json::as_f64)
                        .unwrap_or(0.0),
                },
            );
        }
        map
    })
}

/// Lowercase, drop `(...)` groups and trim: the key the list is matched on.
fn normalize(name: &str) -> String {
    let mut out = String::with_capacity(name.len());
    let mut depth = 0usize;
    for c in name.chars() {
        match c {
            '(' => depth += 1,
            ')' if depth > 0 => depth -= 1,
            _ if depth == 0 => out.extend(c.to_lowercase()),
            _ => {}
        }
    }
    out.trim().to_string()
}

/// Split a product's ingredients into rated entries.
///
/// Matches the old browser logic: the ingredient texts are joined with commas,
/// split on commas, trimmed, and each piece is looked up in the list.
pub fn rate_ingredients(product: &Json) -> Vec<RatedIngredient> {
    let texts: Vec<&str> = product
        .get("ingredients")
        .and_then(Json::as_arr)
        .unwrap_or(&[])
        .iter()
        .filter_map(|i| i.get_str("text"))
        .filter(|t| !t.is_empty())
        .collect();
    let joined = texts.join(", ");
    joined
        .split(',')
        .map(str::trim)
        .filter(|t| !t.is_empty())
        .map(|text| RatedIngredient {
            text: text.to_string(),
            color: ratings()
                .get(&normalize(text))
                .map(|r| r.color.clone())
                .filter(|c| !c.is_empty()),
        })
        .collect()
}

/// True when no ingredient is red or scores above the badness threshold.
pub fn is_approved(ingredients: &[RatedIngredient]) -> bool {
    !ingredients.iter().any(|ing| {
        ratings()
            .get(&normalize(&ing.text))
            .is_some_and(|r| r.color == "red" || r.score > BADNESS_THRESHOLD)
    })
}

/// GET a JSON document from Open Food Facts. A 404 is [`LookupError::NotFound`].
fn get_json(url: &str) -> Result<Json, LookupError> {
    let res = httpc::get(url, &[("User-Agent", USER_AGENT)], LOOKUP_TIMEOUT_MS)
        .map_err(|e| LookupError::Unavailable(e.to_string()))?;
    if res.status == 404 {
        return Err(LookupError::NotFound);
    }
    if !res.ok() {
        return Err(LookupError::Unavailable(format!("HTTP {}", res.status)));
    }
    json::parse(&res.body).map_err(|e| LookupError::Unavailable(format!("JSON: {e}")))
}

/// Fetch one product by barcode.
fn product_by_code(base: &str, code: &str) -> Result<Json, LookupError> {
    let url =
        format!("{base}/api/v3/product/{code}.json?fields=code,product_name,image_url,ingredients");
    let data = get_json(&url)?;
    if data.get_str("status") == Some("failure") {
        return Err(LookupError::NotFound);
    }
    match data.get("product") {
        Some(p @ Json::Obj(_)) => Ok(p.clone()),
        _ => Err(LookupError::NotFound),
    }
}

/// Find a product for `target` on the Open Food Facts API at `base`.
///
/// # Errors
/// [`LookupError::NotFound`] when nothing matches, [`LookupError::Unavailable`]
/// when the API cannot be reached or answers with an error.
pub fn lookup(base: &str, target: &ScanTarget) -> Result<Json, LookupError> {
    let base = base.trim_end_matches('/');
    match target {
        ScanTarget::Code(code) => product_by_code(base, code),
        ScanTarget::Query(query) => {
            let url = format!(
                "{base}/cgi/search.pl?search_terms={}&json=true&page_size=1&fields=code",
                httpc::form_encode(query)
            );
            let data = get_json(&url)?;
            let code = data
                .get("products")
                .and_then(Json::as_arr)
                .and_then(|p| p.first())
                .and_then(|p| p.get_str("code"))
                .map(str::to_string)
                .ok_or(LookupError::NotFound)?;
            match ScanTarget::parse(&json::obj([("code", json::s(code))])) {
                Ok(ScanTarget::Code(code)) => product_by_code(base, &code),
                _ => Err(LookupError::NotFound),
            }
        }
    }
}

/// The scan result sent to the browser: product, rated ingredients, verdict.
pub fn result_json(product: &Json) -> Json {
    let ingredients = rate_ingredients(product);
    let approved = is_approved(&ingredients);
    let field = |k: &str| product.get_str(k).map(json::s).unwrap_or(Json::Null);
    json::obj([
        (
            "product",
            json::obj([
                ("code", field("code")),
                ("product_name", field("product_name")),
                ("image_url", field("image_url")),
            ]),
        ),
        (
            "ingredients",
            Json::Arr(
                ingredients
                    .iter()
                    .map(|i| {
                        json::obj([
                            ("text", json::s(i.text.clone())),
                            ("color", i.color.clone().map(json::s).unwrap_or(Json::Null)),
                        ])
                    })
                    .collect(),
            ),
        ),
        ("approved", Json::Bool(approved)),
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn product(texts: &[&str]) -> Json {
        json::obj([(
            "ingredients",
            Json::Arr(
                texts
                    .iter()
                    .map(|t| json::obj([("text", json::s(*t))]))
                    .collect(),
            ),
        )])
    }

    #[test]
    fn parse_accepts_a_barcode_or_a_search() {
        let code = json::obj([("code", json::s(" 0123456789 "))]);
        assert_eq!(
            ScanTarget::parse(&code),
            Ok(ScanTarget::Code("0123456789".into()))
        );
        let query = json::obj([("query", json::s("peanut butter"))]);
        assert_eq!(
            ScanTarget::parse(&query),
            Ok(ScanTarget::Query("peanut butter".into()))
        );
        let digits = json::obj([("query", json::s("737628064502"))]);
        assert_eq!(
            ScanTarget::parse(&digits),
            Ok(ScanTarget::Code("737628064502".into()))
        );
    }

    #[test]
    fn parse_refuses_empty_or_unsafe_input() {
        assert!(ScanTarget::parse(&json::obj([])).is_err());
        assert!(ScanTarget::parse(&json::obj([("code", json::s(""))])).is_err());
        assert!(ScanTarget::parse(&json::obj([("code", json::s("../../x"))])).is_err());
        assert!(ScanTarget::parse(&json::obj([("code", json::s("1".repeat(65)))])).is_err());
        assert!(ScanTarget::parse(&json::obj([("query", json::s("  "))])).is_err());
        assert!(ScanTarget::parse(&json::obj([("query", json::s("a".repeat(201)))])).is_err());
    }

    #[test]
    fn rating_matches_the_list_ignoring_case_and_brackets() {
        let rated = rate_ingredients(&product(&[
            "Ace-K (sweetener), Acacia gum",
            "unlisted thing",
        ]));
        let colors: Vec<_> = rated
            .iter()
            .map(|r| (r.text.as_str(), r.color.as_deref()))
            .collect();
        assert_eq!(
            colors,
            vec![
                ("Ace-K (sweetener)", Some("red")),
                ("Acacia gum", Some("green")),
                ("unlisted thing", None),
            ]
        );
        assert!(!is_approved(&rated));
    }

    #[test]
    fn a_product_without_flagged_ingredients_is_approved() {
        assert!(is_approved(&rate_ingredients(&product(&[
            "acacia gum",
            "water"
        ]))));
        assert!(is_approved(&rate_ingredients(&product(&[]))));
    }

    #[test]
    fn the_list_is_compiled_in() {
        assert!(ratings().len() > 300);
    }
}
