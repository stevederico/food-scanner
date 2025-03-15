import { isSubscriber } from "@stevederico/skateboard-ui/Utilities";
import React, { useEffect, useRef, useState } from "react";
import Header from "@stevederico/skateboard-ui/Header";
import { BrowserMultiFormatReader } from "@zxing/library";
import badObj from "@root/ingredients.json"

export default function HomeView() {
  const videoRef = useRef(null);
  const [scan, setScan] = useState("");
  const [product, setProduct] = useState("");


  async function fetchProductInfo(productID) {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v3/product/${productID}.json`
      );
      const data = await response.json();

      const ingredientsString = data.product.ingredients
.map(ingredient => ingredient.text)
.join(', ');
console.log(ingredientsString);

      // let badArray = badObj.bad_ingredients
      // console.log(badArray)
      setProduct(ingredientsString)
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
        if (res){
          let pid = res.getText()
          setScan(pid);
          fetchProductInfo(pid);
        } 
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
        <p>Scan a product to get started.</p>
        <p>UPC: {scan}</p>
        <p>Product: {product}</p>
        
      </div>
    </>
  );
}
