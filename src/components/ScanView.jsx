import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import * as Dialog from '@radix-ui/react-dialog';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { fetchProduct, addToRecentScans } from '../services/ProductService';
import IngredientRenderer, { checkIsApproved } from './IngredientRenderer';

export default function ScanView() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [ingredientsList, setIngredientsList] = useState("");
  const [product, setProduct] = useState({ product_name: "", image_url: "" });
  const [open, setOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleProductScan(productID) {
    try {
      const product = await fetchProduct(productID);
      setProduct(product);
      addToRecentScans(product);
      const ingredientsString = product.ingredients
        ?.map(ingredient => ingredient.text)
        .join(', ') || '';
      setIngredientsList(ingredientsString);
      setIsApproved(checkIsApproved(ingredientsString));
      setErrorMessage("");
      setOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Product not found. Try scanning again.");
      setOpen(true);
    }
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
          handleProductScan(res.getText());
        }
      });
    }
  };

  function reset() {
    setProduct({ product_name: "", image_url: "" });
    setIngredientsList("");
    if (readerRef.current) {
      readerRef.current.reset();
      startScan();
    }
  }

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    startScan();
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" />

      <Dialog.Root open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg p-6 w-[90vw] max-w-md max-h-[85vh] overflow-y-auto">
            {errorMessage ? (
              <>
                <Dialog.Title className="text-xl font-semibold text-center mb-4">{errorMessage}</Dialog.Title>
                <button
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => { setOpen(false); reset(); }}
                >
                  Scan Again
                </button>
              </>
            ) : (
              <>
                <div className="relative w-full flex justify-center mb-4">
                  <div className="h-64 w-full bg-background" />
                  <img className="w-full object-contain max-h-64 absolute inset-0" src={product.image_url} alt="Product" />
                  <div className="absolute inset-0 bg-white/25" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {ingredientsList ? (
                      isApproved ?
                        <div className="flex flex-col items-center">
                          <ThumbsUp className="size-24 text-green-500" />
                          <div className="bg-green-500 px-3 py-2 text-white rounded-full my-4">Approved</div>
                        </div>
                        :
                        <div className="flex flex-col items-center">
                          <ThumbsDown className="size-24 text-red-500" />
                          <div className="bg-red-500 px-3 py-2 text-white rounded-full my-4">Not Approved</div>
                        </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold">{product.product_name}</Dialog.Title>
                </div>
                <div className="flex flex-wrap mb-4 capitalize">
                  <IngredientRenderer ingredients={ingredientsList} />
                </div>
                <div className="mt-6 flex">
                  <button
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => { setOpen(false); reset(); }}
                  >
                    Scan Again
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
