
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, ArrowLeft, Truck, RotateCcw, Shield, Camera } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import VirtualTryOnModal from '../components/products/VirtualTryOnModal';

// Mock product data - moved outside component to avoid re-creation on re-renders
const mockProduct = {
  name: "Crinkle Gauze Tiered Mini Dress",
  price: 79.99,
  originalPrice: 99.99,
  isNew: true,
  colors: [
    { name: "White", hex: "#ffffff" },
    { name: "Black", hex: "#000000" }
  ],
  sizes: ["S", "M"],
  category: "dresses",
  rating: 4.5,
  reviewCount: 127,
  description: "This effortlessly chic mini dress features a relaxed fit with a tiered silhouette in soft crinkle gauze fabric. Perfect for warm weather occasions, it offers comfort and style in equal measure.",
  details: [
    "100% Cotton crinkle gauze",
    "Relaxed fit through body",
    "Tiered mini silhouette", 
    "Pull-on styling",
    "Unlined",
    "Machine wash cold"
  ],
  features: [
    { icon: Truck, text: "Free shipping on orders over $50" },
    { icon: RotateCcw, text: "30-day return policy" },
    { icon: Shield, text: "1-year warranty included" }
  ]
};

// Recommended products (3 rows of 4 = 12 products)
const recommendedProducts = [
  { id: 101, name: "Ribbed Knit Tank Dress", price: 59.99, colors: [{ name: "Gray", hex: "#808080" }], category: "dresses", sizes: ["M"] },
  { id: 102, name: "Satin Slip Midi Dress", price: 79.95, colors: [{ name: "Champagne", hex: "#f7e7ce" }], category: "dresses", sizes: ["XS", "S"] },
  { id: 103, name: "Crochet Knit Mini Dress", price: 99.99, isNew: true, colors: [{ name: "Cream", hex: "#fffdd0" }], category: "dresses", sizes: ["S", "M"] },
  { id: 104, name: "Poplin A-Line Midi Dress", price: 89.95, colors: [{ name: "White", hex: "#ffffff" }], category: "dresses", sizes: ["M", "L"] },
  { id: 105, name: "Pleated Halter Maxi Dress", price: 148.00, isNew: true, colors: [{ name: "Emerald", hex: "#50c878" }], category: "dresses", sizes: ["S"] },
  { id: 106, name: "Tie-Shoulder Mini Dress", price: 69.95, colors: [{ name: "Yellow", hex: "#ffff00" }], category: "dresses", sizes: ["XS", "S"] },
  { id: 107, name: "Floral Print Wrap Dress", price: 98.00, isNew: true, colors: [{ name: "Red Floral", hex: "#d9534f" }], category: "dresses", sizes: ["M", "L"] },
  { id: 108, name: "Sweater-Knit Midi Dress", price: 118.00, colors: [{ name: "Oatmeal", hex: "#e4d5b7" }], category: "dresses", sizes: ["L"] },
  { id: 109, name: "Tiered Poplin Maxi Dress", price: 128.00, isNew: true, colors: [{ name: "Black", hex: "#000000" }], category: "dresses", sizes: ["S", "M"] },
  { id: 110, name: "Gauze Button-Front Dress", price: 89.99, colors: [{ name: "Sky Blue", hex: "#87ceeb" }], category: "dresses", sizes: ["M", "L"] },
  { id: 111, name: "Ruffle Strap Sundress", price: 79.95, isNew: true, colors: [{ name: "Gingham", hex: "#d3d3d3" }], category: "dresses", sizes: ["S"] },
  { id: 112, name: "One-Shoulder Knit Dress", price: 74.00, colors: [{ name: "Black", hex: "#000000" }], category: "dresses", sizes: ["S", "M"] }
];

export default function ProductDetailPage() {
  const location = useLocation();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Get product from URL params or location state
  const urlParams = new URLSearchParams(location.search);
  const productId = urlParams.get('id');
  
  // Use mock data with the product ID
  const product = { ...mockProduct, id: productId };

  useEffect(() => {
    // Set initial selected color from the mockProduct data
    if (mockProduct.colors.length > 0) {
      setSelectedColor(mockProduct.colors[0].name);
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleEnableTryOn = async (photos) => {
    setUploadedPhotos(photos);
    setIsProcessing(true);
    setProcessingProgress(0);
    setIsTryOnModalOpen(false); // Close the modal once processing starts
    
    // Simulate processing time: 3 seconds per photo
    const totalTime = photos.length * 3000;
    const intervalTime = 100; // Update progress every 100ms
    const progressIncrement = (intervalTime / totalTime) * 100;
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + progressIncrement;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setIsProcessing(false);
          setIsTryOnMode(true);
          return 100;
        }
        return newProgress;
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
    // Add to bag logic here
    alert(`Added ${quantity} x ${product.name} (${selectedSize}, ${selectedColor}) to bag`);
  };

  // Generate a try-on image URL
  const getTryOnImage = (productId) => {
    return `https://placehold.co/600x800/e3f2fd/1976d2?text=Try-On+${productId}`;
  };

  // The actual product image would ideally come from the mockProduct data.
  // For now, we use a placeholder that matches the original design's spirit.
  const defaultProductImage = 'https://placehold.co/600x800/f1f5f9/f1f5f9?text=Product+Image'; 

  const imageUrl = isTryOnMode 
    ? getTryOnImage(product.id)
    : defaultProductImage;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Try-On Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to={createPageUrl('Products')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={16} />
            Back to Dresses
          </Link>
        </div>
        
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
          <Button
            onClick={() => setIsTryOnModalOpen(true)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Camera size={16} />
            Virtual Try-On
          </Button>
        )}
      </div>
      
      {(isTryOnMode || isProcessing) && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">
                  {isProcessing ? 'Processing Virtual Try-On...' : 'Virtual Try-On Active'}
                </p>
                <p className="text-sm text-purple-700">
                  {isProcessing 
                    ? `Processing ${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} • ${Math.round(processingProgress)}% complete`
                    : `Viewing products with your uploaded photos • ${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} uploaded`
                  }
                </p>
              </div>
            </div>
          </div>
          {isProcessing && (
            <div className="mt-3">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <AspectRatio ratio={3 / 4} className="bg-gray-100 rounded-lg relative">
            <img 
              src={imageUrl} 
              alt={product.name}
              className="object-cover w-full h-full rounded-lg"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Creating Virtual Try-On</p>
                  <p className="text-sm opacity-90">{Math.round(processingProgress)}% complete</p>
                </div>
              </div>
            )}
            {isTryOnMode && !isProcessing && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-purple-600 text-white shadow-lg">
                  Virtual Try-On
                </Badge>
              </div>
            )}
          </AspectRatio>
          
          {/* Thumbnail images */}
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
          {/* Header */}
          <div>
            {product.isNew && (
              <Badge className="mb-2 bg-green-100 text-green-800">New Arrival</Badge>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({product.reviewCount})</span>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Color: {selectedColor}
            </h3>
            <div className="flex gap-2">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color.name ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
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

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 border border-gray-300 rounded hover:border-gray-400"
              >
                -
              </button>
              <span className="px-4 py-1 border border-gray-300 rounded bg-gray-50">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 border border-gray-300 rounded hover:border-gray-400"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Bag */}
          <div className="flex gap-3">
            <Button 
              onClick={handleAddToBag}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3"
              size="lg"
            >
              Add to Bag
            </Button>
            <Button variant="outline" size="lg" className="px-4">
              <Heart size={20} />
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-2 pt-4 border-t">
            {product.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                <feature.icon size={16} />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Product Description */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
            
            <h4 className="text-md font-medium mt-4 mb-2">Product Details</h4>
            <ul className="space-y-1">
              {product.details.map((detail, index) => (
                <li key={index} className="text-gray-600 text-sm flex items-start gap-2">
                  <span className="text-gray-400 mt-1.5 w-1 h-1 bg-current rounded-full flex-shrink-0"></span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          </div>

          {/* Review Summary */}
          <div className="flex flex-col md:flex-row items-start gap-8 bg-gray-50 p-6 rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{product.rating}</div>
              <div className="flex justify-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">{product.reviewCount} reviews</div>
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
                    ></div>
                  </div>
                  <span className="w-8 text-right text-gray-600">
                    {stars === 5 ? '65%' : stars === 4 ? '25%' : stars === 3 ? '6%' : stars === 2 ? '3%' : '1%'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Reviews */}
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
                          <Star
                            key={i}
                            size={14}
                            className={i < (index === 4 ? 4 : 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {index === 0 ? '3 days ago' : index === 1 ? '1 week ago' : index === 2 ? '2 weeks ago' : index === 3 ? '1 month ago' : '1 month ago'}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {index === 0 && "Love this dress! The fabric is so comfortable and the fit is perfect. I used the try-on feature which was actually pretty helpful - made me feel more confident about ordering online. The tiered style is very flattering and the quality exceeded my expectations for the price."}
                    {index === 1 && "Really happy with this purchase. The dress is cute and versatile - I can dress it up or down. The virtual try-on thing worked better than I expected, helped me pick the right size. Only wish it came in more colors but overall very satisfied."}
                    {index === 2 && "Beautiful dress and great fit! I was hesitant to order online but the try-on feature gave me a better idea of how it would look. The gauze fabric is perfect for summer and it's not see-through which I was worried about. Would definitely buy from this brand again."}
                    {index === 3 && "This dress is adorable! The virtual try-on was surprisingly accurate - the fit matched exactly what I saw in the preview. The material is soft and breathable. My only complaint is that it wrinkles easily but that's expected with this type of fabric. Great for vacations!"}
                    {index === 4 && "Good quality dress, fits as expected. The try-on tool was neat to use and probably saved me from having to return/exchange. The dress is a bit shorter than I typically prefer but it works. Nice for casual outings and the price was reasonable. Shipping was fast too."}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>Helpful? Yes ({index === 0 ? 25 : index === 1 ? 18 : index === 2 ? 32 : index === 3 ? 15 : 9}) No ({index > 2 ? 2 : 1})</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" className="px-8">
              Load More Reviews
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} isTryOnMode={isTryOnMode} />
          ))}
        </div>
      </div>
      
      {/* Virtual Try-On Modal */}
      <VirtualTryOnModal
        isOpen={isTryOnModalOpen}
        onClose={() => setIsTryOnModalOpen(false)}
        onEnableTryOn={handleEnableTryOn}
      />
    </div>
  );
}
