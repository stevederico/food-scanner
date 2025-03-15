import { isSubscriber } from "@stevederico/skateboard-ui/Utilities";
import React, { useEffect, useRef, useState } from "react";
import Header from "@stevederico/skateboard-ui/Header";
import { BrowserMultiFormatReader } from "@zxing/library";

export default function HomeView() {
  const videoRef = useRef(null);
  const [result, setResult] = useState("");

  async function fetchProductInfo() {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v3/product/${result}.json`
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    // Subscriber check
    isSubscriber().then((s) => {
      // Handle subscriber status if needed
    });

    // UPC Scanner
    const reader = new BrowserMultiFormatReader();
    const video = videoRef.current;

    const startScan = async () => {
      await reader.decodeFromVideoDevice(null, video, (res) => {
        if (res) setResult(res.getText());
      });
    };

    startScan();
    return () => reader.reset();
  }, []);

  return (
    <>
      <Header buttonClass="" title="Home" />
      <div>
        <video ref={videoRef} width="640" height="480" />
        <p>UPC: {result}</p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={fetchProductInfo}
        >
          Fetch Product Info
        </button>
      </div>
    </>
  );
}
