import React, { useState, useEffect } from 'react';
import FilterSidebar from '../components/products/FilterSidebar';
import ProductCard from '../components/products/ProductCard';
import VirtualTryOnModal from '../components/products/VirtualTryOnModal';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTryOn } from "@/utils/TryOnContext";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [modelKey, setModelKey] = useState(null);

  // Login modal states
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const {
    isTryOnMode,
    uploadedPhotos,
    tryonResults,
    enableTryOn,
    disableTryOn,
    attachWebSocket
  } = useTryOn();

  const HOST = import.meta.env.VITE_API_HOST;
  const WEBSOCKETHOST = import.meta.env.VITE_WEBSOCKETHOST;

  // --------------------------
  // Login & Auth handling
  // --------------------------

const checkAuthAndFetch = async () => {
  try {
    setIsLoading(true);
    const finalToken = localStorage.getItem("authToken");

    if (!finalToken) {
      setLoginModalOpen(true);
      return;
    }

    const res = await fetch(HOST + "/api/products", {
      headers: { Authorization: `Bearer ${finalToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    } else {
      localStorage.removeItem("authToken");
      setLoginModalOpen(true);
    }
  } catch (err) {
    console.error(err);
    setLoginModalOpen(true);
  } finally {
    setIsLoading(false);
  }
};

// ✅ New function to handle validating any token (from login or URL param)
const validateAndStoreToken = async (tempToken) => {
  try {
    const validateRes = await fetch(HOST + "/api/auth/validate-temp-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tempToken }),
    });

    if (!validateRes.ok) throw new Error("Token validation failed");

    const validateData = await validateRes.json();
    const finalToken = validateData?.token;

    if (!finalToken) throw new Error("No final token returned");

    localStorage.setItem("authToken", finalToken);
    const url = new URL(window.location.href);
    url.searchParams.delete("authToken");
    window.history.replaceState({}, document.title, url.toString());
    // refresh data
    await checkAuthAndFetch();
    setLoginModalOpen(false);
    setPasscode("");
    setPasscodeError("");
  } catch (error) {
    console.error("Token validation error:", error);
    setPasscodeError("Token validation failed. Please log in again.");
    setLoginModalOpen(true);
  }
};

// ✅ Check URL params for authToken on mount
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("authToken");

  if (urlToken) {
    // if URL has authToken, validate it immediately
    validateAndStoreToken(urlToken);
  } else {
    checkAuthAndFetch();
  }
}, []);

// ✅ Handle login modal flow
const handlePasscodeCheck = async (e) => {
  e.preventDefault();
  try {
    // Step 1: Login to get temp token
    const response = await fetch(HOST + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!response.ok) throw new Error("Invalid login");

    const data = await response.json();
    const tempToken = data?.token;
    if (!tempToken) {
      setPasscodeError("No temp token received from server");
      return;
    }

    // Step 2: Validate and store final token
    await validateAndStoreToken(tempToken);
  } catch (error) {
    console.error("Login failed:", error);
    setPasscodeError("Passcode incorrect or validation failed. Please re-enter");
  }
};



  // --------------------------
  // Try-On handling
  // --------------------------
  const handleEnableTryOn = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const uploadRes = await fetch(HOST + "/upload_model", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.model_key) return console.error("No model_key returned");

      const newModelKey = uploadData.model_key;
      const cacheId = uploadData.cache_id;
      console.log("Uploaded model_key:", newModelKey, "cache_id:", cacheId);
      setModelKey(newModelKey);
      
      const socket = new WebSocket(`${WEBSOCKETHOST}/ws?model_key=${newModelKey}`);
      attachWebSocket(socket);

      socket.addEventListener("open", async () => {
        const garments = products.map(p => ({
          id: p.id,
          url: p.image_path,
          category: p.category || "auto",
          photo_type: p.photo_type || "flat-lay"
        }));

        const startRes = await fetch(HOST + "/start_tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model_key: newModelKey,cache_id:cacheId, garments }),
        });
        
        if (startRes.ok) enableTryOn(files);
        else console.error("start_tryon failed");
        setIsTryOnModalOpen(false)
      });

    } catch (err) {
      console.error("EnableTryOn error:", err);
    }
  };

  const handleDisableTryOn = () => {
    setModelKey(null);
    disableTryOn();
  };

  // --------------------------
  // Render
  // --------------------------
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Dresses</h1>
        <p className="mt-2 text-base text-gray-500">Discover our latest collection of timeless styles.</p>
      </div>

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Secure layer</DialogTitle>
            <DialogDescription>Enter passcode</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasscodeCheck} className="space-y-6 pt-4">
            <div className="flex flex-col items-center">
              <Input
                type="text"
                maxLength={6}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="******"
                className="text-center text-lg tracking-[0.3em]"
              />
              {passcodeError && <p className="text-sm text-red-500 mt-2">{passcodeError}</p>}
            </div>
            <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-700">
              Enter
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Try-On Toggle */}
      <div className="flex justify-end mb-6">
        {isTryOnMode ? (
          <Button onClick={handleDisableTryOn} variant="outline" className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
            <Camera size={16} /> Disable Try-On
          </Button>
        ) : (
          <Button onClick={() => setIsTryOnModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Camera size={16} /> Virtual Try-On
          </Button>
        )}
      </div>

      {isTryOnMode && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">Virtual Try-On Active</p>
              <p className="text-sm text-purple-700">
                Viewing products with your uploaded photos • {uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="md:hidden flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><SlidersHorizontal size={16} /> Filter</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Filter Products</DialogTitle></DialogHeader>
              <div className="py-4"><FilterSidebar /></div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="hidden md:block"><FilterSidebar /></div>

        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {isLoading
              ? Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[3/4] w-full rounded-md" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ))
              : products.map(product => (
                  <ProductCard key={product.id} product={product} isTryOnMode={isTryOnMode} tryonResults={tryonResults} />
                ))
            }
          </div>
        </div>
      </div>

      <VirtualTryOnModal
        isOpen={isTryOnModalOpen}
        products={products}
        onClose={() => setIsTryOnModalOpen(false)}
        onEnableTryOn={handleEnableTryOn}
      />
    </div>
  );
}
