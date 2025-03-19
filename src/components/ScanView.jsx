import { isSubscriber } from "@stevederico/skateboard-ui/Utilities";
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import badArray from "@root/bad_ingredients.json"
import * as Dialog from '@radix-ui/react-dialog';

export default function ScanView() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [ingredientsList, setIngredientsList] = useState("");
  const [message, setMessage] = useState("scan a barcode to get started");
  const [product, setProduct] = useState({ product_name: "", image_url: "" });
  const [open, setOpen] = useState(false);

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
      const cleanIngredient = ing.toLowerCase().replace(/\([^)]*\)/g, '').trim();
      const ingredient = badArray.find(bad => {
        if (!bad) return false;
        const propertyToUse = bad.name || bad.title;
        if (!propertyToUse) return false;
        const cleanBadName = propertyToUse.toLowerCase().replace(/\([^)]*\)/g, '').trim();
        return cleanIngredient === cleanBadName;
      });
      const colorClasses = {
        red: "text-red-500",
        yellow: "text-yellow-500",
        green: "text-green-500"
      };
      // Capitalize first letter of each word
      const formattedIngredient = ing.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      return (
        <span key={index} className={`${ingredient ? colorClasses[ingredient.color] : "text-gray-800"} mr-1`}>
          {formattedIngredient},
        </span>
      );
    });
  }

  const startScan = async () => {
    const video = videoRef.current;
    if (readerRef.current && video) {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      await readerRef.current.decodeFromConstraints(constraints, video, (res) => {
        if (res) {
          fetchProductInfo(res.getText());
        }
      });
    }
  };

  function reset() {
    setProduct({ product_name: "", image_url: "" });
    setIngredientsList("");
    setMessage("scan a barcode to get started");
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

  useEffect(() => {
    if (product.image_url !== "") {
      setOpen(true);
    }
  }, [product.image_url]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" />
      
      <Dialog.Root open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-md max-h-[85vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-semibold mb-4 text-black">{product.product_name}</Dialog.Title>
            <div className="flex flex-wrap mb-4 capitalize">{renderIngredients(ingredientsList)}</div>
            <img className="w-full object-contain max-h-64" src={product.image_url} alt="Product" />
            <div className="mt-6 flex ">
              <button
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() =>{ setOpen(false); reset();}}
              >
                Scan Again
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
