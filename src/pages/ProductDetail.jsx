
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, ArrowLeft, Truck, RotateCcw, Shield, Camera } from 'lucide-react';
import VirtualTryOnModal from '../components/products/VirtualTryOnModal';
import { useTryOn } from "@/utils/TryOnContext";

const HOST = import.meta.env.VITE_API_HOST;

const PLACEHOLDER_IMG = 'https://placehold.co/600x800/f1f5f9/f1f5f9?text=Product+Image';

const STATIC_FEATURES = [
  { icon: Truck, text: "Free shipping on orders over $50" },
  { icon: RotateCcw, text: "30-day return policy" },
  { icon: Shield, text: "1-year warranty included" },
];

// Static rating/review data until a reviews API is available
const STATIC_RATING = 4.5;
const STATIC_REVIEW_COUNT = 127;

export default function ProductDetailPage() {
  const location = useLocation();
  const { isTryOnMode, setIsTryOnMode, uploadedPhotos, setUploadedPhotos } = useTryOn();

  const urlParams = new URLSearchParams(location.search);
  const productId = urlParams.get('id');

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(PLACEHOLDER_IMG);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }
    const fetchProduct = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      try {
        const res = await fetch(`${HOST}/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setProduct(data);
        if (data.colors?.length > 0) setSelectedColor(data.colors[0].name);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    if (isTryOnMode) {
      const { tryonImage } = location.state || {};
      setImageUrl(tryonImage || product.image_url || PLACEHOLDER_IMG);
    } else {
      setImageUrl(product.image_url || PLACEHOLDER_IMG);
    }
  }, [isTryOnMode, product]);

  const handleEnableTryOn = async (photos) => {
    setUploadedPhotos(photos);
    setIsProcessing(true);
    setProcessingProgress(0);
    setIsTryOnModalOpen(false);

    const totalTime = photos.length * 3000;
    const intervalTime = 100;
    const progressIncrement = (intervalTime / totalTime) * 100;

    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const next = prev + progressIncrement;
        if (next >= 100) {
          clearInterval(progressInterval);
          setIsProcessing(false);
          setIsTryOnMode(true);
          return 100;
        }
        return next;
      });
    }, intervalTime);
  };

  const handleDisableTryOn = () => {
    setIsTryOnMode(false);
    setUploadedPhotos([]);
    setIsProcessing(false);
    setProcessingProgress(0);
  };

  const handleAddToBag = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    alert(`Added ${quantity} x ${product.name} (${selectedSize}, ${selectedColor}) to bag`);
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4 pt-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <Link to={createPageUrl('Products')} className="text-purple-600 hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Try-On Button */}
      <div className="flex justify-between items-center mb-6">
        <Link to={createPageUrl('Products')} className="hover:text-gray-900 flex items-center gap-1 text-sm text-gray-600">
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        {isTryOnMode || isProcessing ? (
          <Button
            onClick={handleDisableTryOn}
            variant="outline"
            className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            disabled={isProcessing}
          >
            <Camera size={16} />
            {isProcessing ? 'Processing...' : 'Disable Try-On'}
          </Button>
        ) : (
          <Button onClick={() => setIsTryOnModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Camera size={16} />
            Virtual Try-On
          </Button>
        )}
      </div>

      {(isTryOnMode || isProcessing) && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">
                {isProcessing ? 'Processing Virtual Try-On...' : 'Virtual Try-On Active'}
              </p>
              <p className="text-sm text-purple-700">
                {isProcessing
                  ? `Processing ${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} • ${Math.round(processingProgress)}% complete`
                  : `Viewing products with your uploaded photos • ${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} uploaded`}
              </p>
            </div>
          </div>
          {isProcessing && (
            <div className="mt-3">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <AspectRatio ratio={3 / 4} className="bg-gray-100 rounded-lg relative">
            <img src={imageUrl} alt={product.name} className="object-cover w-full h-full rounded-lg" />
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                  <p className="text-lg font-medium">Creating Virtual Try-On</p>
                  <p className="text-sm opacity-90">{Math.round(processingProgress)}% complete</p>
                </div>
              </div>
            )}
            {isTryOnMode && !isProcessing && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-purple-600 text-white shadow-lg">Virtual Try-On</Badge>
              </div>
            )}
          </AspectRatio>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <AspectRatio key={index} ratio={3 / 4} className="bg-gray-100 rounded border-2 border-transparent hover:border-gray-300 cursor-pointer">
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  View {index + 1}
                </div>
              </AspectRatio>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.is_new && <Badge className="mb-2 bg-green-100 text-green-800">New Arrival</Badge>}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-baseline gap-2">
                {product.price != null && (
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                )}
                {product.original_price != null && product.original_price !== product.price && (
                  <span className="text-lg text-gray-500 line-through">${product.original_price}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < Math.floor(STATIC_RATING) ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({STATIC_REVIEW_COUNT})</span>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          {product.colors?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Color: {selectedColor}</h3>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 ${selectedColor === color.name ? 'border-gray-900' : 'border-gray-300'}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-2 border text-sm font-medium rounded ${
                      selectedSize === size
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-300 text-gray-900 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 border border-gray-300 rounded hover:border-gray-400">-</button>
              <span className="px-4 py-1 border border-gray-300 rounded bg-gray-50">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 border border-gray-300 rounded hover:border-gray-400">+</button>
            </div>
          </div>

          {/* Add to Bag */}
          <div className="flex gap-3">
            <Button onClick={handleAddToBag} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3" size="lg">
              Add to Bag
            </Button>
            <Button variant="outline" size="lg" className="px-4">
              <Heart size={20} />
            </Button>
          </div>

          {/* Static Features */}
          <div className="space-y-2 pt-4 border-t">
            {STATIC_FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                <feature.icon size={16} />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start gap-8 bg-gray-50 p-6 rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{STATIC_RATING}</div>
              <div className="flex justify-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={20} className={i < Math.floor(STATIC_RATING) ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                ))}
              </div>
              <div className="text-sm text-gray-600">{STATIC_REVIEW_COUNT} reviews</div>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(stars => (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{stars}</span>
                  <Star size={12} className="text-yellow-400 fill-current" />
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-yellow-400 rounded"
                      style={{ width: `${stars === 5 ? 65 : stars === 4 ? 25 : stars === 3 ? 6 : stars === 2 ? 3 : 1}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600">
                    {stars === 5 ? '65%' : stars === 4 ? '25%' : stars === 3 ? '6%' : stars === 2 ? '3%' : '1%'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Customer {index + 1}</span>
                        <Badge variant="outline" className="text-xs">Verified Purchase</Badge>
                      </div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < (index === 4 ? 4 : 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {index === 0 ? '3 days ago' : index === 1 ? '1 week ago' : index === 2 ? '2 weeks ago' : '1 month ago'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {index === 0 && "Love this dress! The fabric is so comfortable and the fit is perfect. I used the try-on feature which was actually pretty helpful - made me feel more confident about ordering online."}
                    {index === 1 && "Really happy with this purchase. The dress is cute and versatile - I can dress it up or down. The virtual try-on thing worked better than I expected, helped me pick the right size."}
                    {index === 2 && "Beautiful dress and great fit! I was hesitant to order online but the try-on feature gave me a better idea of how it would look. The gauze fabric is perfect for summer."}
                    {index === 3 && "This dress is adorable! The virtual try-on was surprisingly accurate - the fit matched exactly what I saw in the preview. The material is soft and breathable."}
                    {index === 4 && "Good quality dress, fits as expected. The try-on tool was neat to use and probably saved me from having to return/exchange. Nice for casual outings and the price was reasonable."}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>Helpful? Yes ({index === 0 ? 25 : index === 1 ? 18 : index === 2 ? 32 : index === 3 ? 15 : 9}) No ({index > 2 ? 2 : 1})</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" className="px-8">Load More Reviews</Button>
          </div>
        </div>
      </div>

      <VirtualTryOnModal
        isOpen={isTryOnModalOpen}
        onClose={() => setIsTryOnModalOpen(false)}
        onEnableTryOn={handleEnableTryOn}
      />
    </div>
  );
}
