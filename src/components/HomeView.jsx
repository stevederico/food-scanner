import { isSubscriber } from "@stevederico/skateboard-ui/Utilities";
import React, { useEffect, useRef, useState } from "react";
import Header from "@stevederico/skateboard-ui/Header";
import { BrowserMultiFormatReader } from "@zxing/library";
import badArray from "@root/bad_ingredients.json"

export default function HomeView() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [scan, setScan] = useState("");
  const [ingredientsList, setIngredientsList] = useState("");
  const [message, setMessage] = useState("scan a barcode to get started");
  const [product, setProduct] = useState({ product_name: "", image_url: "" });

  async function fetchProductInfo(productID) {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v3/product/${productID}.json`
      );
      const data = await response.json();
      setProduct(data.product);
      console.log(data);

      const ingredientsString = data.product.ingredients
        .map(ingredient => ingredient.text)
        .join(', ');
      console.log(ingredientsString);
      setIngredientsList(ingredientsString);
    } catch (error) {
      console.error(error);
    }
  }

  function renderIngredients(ingredients) {
    if (!ingredients) return null;
    return ingredients.split(',').map((ing, index) => {
      ing = ing.trim();
      const isBad = badArray.some(bad => new RegExp(`^${bad.name}$`, "i").test(ing));
      return (
        <span key={index} className={`${isBad ? "text-red-500" : "text-gray-800"} mr-2`}>
          {ing}
        </span>
      );
    });
  }

  const startScan = async () => {
    const video = videoRef.current;
    if (readerRef.current && video) {
      await readerRef.current.decodeFromVideoDevice(null, video, (res) => {
        if (res) {
          let pid = res.getText();
          setScan(pid);
          setMessage(`Product ID: ${pid}`);
          fetchProductInfo(pid);
        }
      });
    }
  };

  function reset() {
    setProduct({ product_name: "", image_url: "" });
    setIngredientsList("");
    setMessage("scan a barcode to get started");
    setScan("");
    if (readerRef.current) {
      readerRef.current.reset();
      startScan();
    }
  }

  useEffect(() => {
    isSubscriber().then((s) => {
      // Handle subscriber status if needed
    });
    readerRef.current = new BrowserMultiFormatReader();
    startScan();
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  return (
    <>

      <div className="overflow-y-scroll pb-44">
      <video ref={videoRef} width="640" height="480" />
        {product.image_url === "" ? (
          <>
            <div className="text-center m-3 font-semibold">{message}</div>
          </>
        ) : (
        <>
          <div className="mx-4 flex flex-col items-center">
         
            <div className="my-4 font-semibold text-xl">{product.product_name}</div>
            <div className="flex flex-wrap">{renderIngredients(ingredientsList)}</div>
            <img className="mt-8" onClick={reset} src={product.image_url} alt="Product" />
          </div>
        </>)}

      </div>
    </>
  );
}
