import React, { useState, useEffect, useRef } from 'react';
import FilterSidebar from '../components/products/FilterSidebar';
import ProductCard from '../components/products/ProductCard';
import VirtualTryOnModal from '../components/products/VirtualTryOnModal';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [modelKey, setModelKey] = useState(null);
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null); // keep stable ref for cleanup
  const [tryonResults, setTryonResults] = useState({});

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:8000/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Clean up websocket if component unmounts
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch(e){/*ignore*/ }
        wsRef.current = null;
      }
    };
  }, []);

  // WebSocket message handler (attached when ws is set)
  useEffect(() => {
    if (!ws) return;

    // prefer addEventListener to avoid wiping out handlers set elsewhere
    const onMessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("ProductsPage WS message:", msg);

        if (msg.status === "done" && msg.garment_id && msg.url) {
          const urlWithTs = `${msg.url}?t=${Date.now()}`;
          setTryonResults((prev) => ({
            ...prev,
            [msg.garment_id]: urlWithTs,
          }));
        } else if (msg.status === "error") {
          console.warn("Try-on error for garment:", msg.garment_id, msg.error || msg);
        } else {
          console.debug("WS progress:", msg);
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err, event.data);
      }
    };

    const onClose = () => console.log("ProductsPage: WebSocket closed (useEffect)");
    const onError = (err) => console.error("ProductsPage: WebSocket error", err);

    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", onClose);
    ws.addEventListener("error", onError);

    // don't set ws.onopen here (we don't want to overwrite any existing open handlers)

    // store ref for cleanup
    wsRef.current = ws;

    return () => {
      try {
        ws.removeEventListener("message", onMessage);
        ws.removeEventListener("close", onClose);
        ws.removeEventListener("error", onError);
      } catch (e) { /* ignore */ }
    };
  }, [ws]);

  // Parent handler: receives files from modal and performs upload + websocket + start_tryon
  const handleEnableTryOn = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      // 1) upload model
      const uploadRes = await fetch("http://localhost:8000/upload_model", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.model_key) {
        console.error("upload_model returned no model_key:", uploadData);
        return;
      }
      const newModelKey = uploadData.model_key;
      setModelKey(newModelKey);

      // 2) open websocket and WAIT for open before starting tryon
      const socket = new WebSocket(`ws://localhost:8000/ws?model_key=${newModelKey}`);

      // Use addEventListener so we DON'T overwrite other handlers
      const onOpen = async () => {
        console.log("Socket open - starting tryon request");

        const garments = products.map((p) => ({
          id: p.id,
          url: p.image_path,
          photo_type: p.photo_type || "flat-lay",
        }));

        try {
          const startRes = await fetch("http://localhost:8000/start_tryon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model_key: newModelKey, garments }),
          });
          if (!startRes.ok) {
            console.error("start_tryon failed:", await startRes.text());
          } else {
            console.log("start_tryon accepted");
            setIsTryOnModalOpen(false);
            setUploadedPhotos(files);
            setIsTryOnMode(true);
          }
        } catch (err) {
          console.error("Failed to call start_tryon:", err);
        }
      };
      socket.addEventListener("open", onOpen);

      // add message listener too (we will still have the ws useEffect, but add here for immediate logs)
      const onMessage = (e) => {
        console.log("Socket temp message:", e.data);
      };
      socket.addEventListener("message", onMessage);

      socket.addEventListener("error", (err) => {
        console.error("Socket error (parent):", err);
      });

      // save socket and leave actual processing to the ws useEffect (which handles .onmessage)
      setWs(socket);

      // cleanup: if component unmounts you should remove listeners; the wsRef cleanup handles that
    } catch (err) {
      console.error("Error in handleEnableTryOn:", err);
    }
  };

  const handleDisableTryOn = () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch(e){}
      wsRef.current = null;
    }
    if (ws) {
      try { ws.close(); } catch(e){}
      setWs(null);
    }
    setModelKey(null);
    setTryonResults({});
    setIsTryOnMode(false);
    setUploadedPhotos([]);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Dresses</h1>
        <p className="mt-2 text-base text-gray-500">Discover our latest collection of timeless styles.</p>
      </div>

      {/* Virtual Try-On Button */}
      <div className="flex justify-end mb-6">
        {isTryOnMode ? (
          <Button
            onClick={handleDisableTryOn}
            variant="outline"
            className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Camera size={16} />
            Disable Try-On
          </Button>
        ) : (
          <Button
            onClick={() => setIsTryOnModalOpen(true)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Camera size={16} />
            Virtual Try-On
          </Button>
        )}
      </div>

      {isTryOnMode && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Virtual Try-On Active</p>
                <p className="text-sm text-purple-700">
                  Viewing products with your uploaded photos • {uploadedPhotos.length} photo
                  {uploadedPhotos.length !== 1 ? "s" : ""} uploaded
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="md:hidden flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal size={16} /> Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter Products</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <FilterSidebar />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="hidden md:block">
          <FilterSidebar />
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {isLoading
              ? Array.from({ length: 20 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="aspect-[3/4] w-full rounded-md" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isTryOnMode={isTryOnMode}
                    tryonResults={tryonResults}
                  />
                ))}
          </div>
        </div>
      </div>

      <VirtualTryOnModal
        isOpen={isTryOnModalOpen}
        products={products}
        onClose={() => setIsTryOnModalOpen(false)}
        onEnableTryOn={handleEnableTryOn} // modal will call this with selected files
      />
    </div>
  );
}
