import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";

export default function ProductCard({ product, isTryOnMode = false, tryonResults = {} }) {
  // Use try-on image if available, otherwise default image
  const imageUrl = isTryOnMode && tryonResults[product.id]
  ? tryonResults[product.id]
  : (product.image_path || 'https://placehold.co/600x800/f1f5f9/f1f5f9');

  // Only show try-on badge if try-on image exists
  const showTryOnBadge = isTryOnMode && tryonResults[product.id];

  return (
    <Link
  to={createPageUrl(`ProductDetail?id=${product.id}`)}
  state={{ tryonImage: tryonResults[product.id] || null }}
  className="block"
>

      <Card className="border-none shadow-none bg-transparent group overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <AspectRatio ratio={3 / 4} className="bg-gray-100 rounded-md">
              <img
                src={imageUrl}
                alt={product.name}
                className="object-cover w-full h-full rounded-md group-hover:opacity-80 transition-opacity duration-300"
              />
              {showTryOnBadge && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-purple-600 text-white shadow-lg">
                    Virtual Try-On
                  </Badge>
                </div>
              )}
            </AspectRatio>
            {product.isNew && (
              <Badge className="absolute top-3 left-3 bg-white text-gray-900 shadow">
                New
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="pt-3 text-left">
            <div className="flex mt-1.5 gap-1.5">
              {product.colors?.map((color) => (
                <div
                  key={color.hex}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                ></div>
              ))}
            </div>

            <h3 className="font-medium text-sm mt-2 truncate group-hover:underline">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2 mt-1">
              <p className="font-semibold text-gray-900">${product.price.toFixed(2)}</p>
              {product.originalPrice && (
                <p className="text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </p>
              )}
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Available in:</p>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 transition-colors"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
