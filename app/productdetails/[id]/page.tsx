"use client"
import { useEffect, useState, use } from "react";
import Image from "next/image";
import { Lora } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LoraFont = Lora({
  weight: '400',
  subsets: ['latin']
});

interface Size {
  id: string;
  name: string;
  stock: number;
}

interface Variant {
  id: string;
  name: string;
  price: string | null;
  image_url: string | null;
  stock: number;
  sizes: {
    id: string;
    size_id: string;
    stock: number;
    size: Size;
  }[];
}

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image_url: string;
  category_id: string;
  admin_id: string;
  category?: {
    name: string;
  };
  admin?: {
    username: string;
    id: string;
    image_url?: string;
  };
  variants?: Variant[];
}

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (product) {
      console.log('Product data loaded:', {
        id: product.id,
        name: product.name,
        mainImage: product.image_url,
        variantsCount: product.variants?.length || 0,
        variants: product.variants?.map(v => ({
          id: v.id,
          name: v.name,
          hasImage: !!v.image_url,
          image: v.image_url
        }))
      });
      
      // Always set the main product image on load
      setCurrentImage(product.image_url || null);
      
      // Don't auto-select any variant
      // Log variant info for debugging
      if (product.variants && product.variants.length > 0) {
        console.log('Found variants:', product.variants.length);
        product.variants.forEach((variant, index) => {
          console.log(`Variant ${index + 1}:`, {
            id: variant.id,
            name: variant.name,
            hasImage: !!variant.image_url,
            imageUrl: variant.image_url
          });
        });
      }
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch product");
      }
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariantSelect = (variant: Variant) => {
    console.log('Variant selected:', {
      id: variant.id,
      name: variant.name,
      hasImage: !!variant.image_url,
      imageUrl: variant.image_url
    });
    
    // Set the selected variant
    setSelectedVariant(variant);
    
    // Reset size selection
    setSelectedSize("");
    
    // Force rerender with a new image by creating a temporary variable
    const newImage = variant.image_url || product?.image_url || null;
    console.log('Changing main image to:', newImage);
    
    // Update the current image
    setCurrentImage(newImage);
    
    // For debugging: Check DOM update after state change
    setTimeout(() => {
      console.log('Current image after state update:', currentImage);
    }, 100);
  };
  
  // Function to handle hover on variant for Shopee-like preview
  const handleVariantHover = (variant: Variant) => {
    // Preview the variant image on hover
    if (variant.image_url) {
      setCurrentImage(variant.image_url);
    }
  };
  
  // Function to reset image when mouse leaves variant (if not selected)
  const handleVariantLeave = () => {
    // Only reset if there's a selected variant
    if (selectedVariant) {
      setCurrentImage(selectedVariant.image_url || product?.image_url || null);
    } else {
      setCurrentImage(product?.image_url || null);
    }
  };

  const getAvailableSizes = () => {
    if (!selectedVariant) return [];
    return selectedVariant.sizes.map(size => ({
      id: size.size.id,
      name: size.size.name,
      stock: size.stock
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Product not found</p>
      </div>
    );
  }

  return (
    <main className={LoraFont.className}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative h-[500px] md:h-[600px]">
            {currentImage && (
              <Image
                src={currentImage}
                alt={product?.name || 'Product image'}
                fill
                className="object-cover rounded-lg"
                priority
              />
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-medium mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <p className="text-2xl font-medium mb-6">
              Rp {selectedVariant?.price || product.price}
            </p>

            {/* Simple Variant Selection Row - Shopee Style */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      className={`relative flex items-center justify-center px-4 py-2 border rounded-md transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-2 border-black'
                          : 'border border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {/* If variant has an image, show a small preview */}
                      {variant.image_url && (
                        <div className="relative w-6 h-6 mr-2 rounded-full overflow-hidden">
                          <Image 
                            src={variant.image_url} 
                            alt="" 
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium">{variant.name}</span>
                        {variant.price && (
                          <span className="block text-xs mt-1">
                            Rp {variant.price}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedVariant && getAvailableSizes().length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Size</h3>
                <div className="grid grid-cols-5 gap-2">
                  {getAvailableSizes().map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      disabled={size.stock === 0}
                      className={`py-2 text-sm border rounded-md ${
                        selectedSize === size.id
                          ? 'border-black bg-black text-white'
                          : size.stock === 0
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size.name}
                      {size.stock === 0 && (
                        <span className="block text-xs mt-1">Out of stock</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400"
                >
                  -
                </button>
                <span className="text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-400"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button 
              className={`w-full py-4 rounded-full transition duration-200 ${
                (!selectedVariant || (selectedVariant.sizes.length > 0 && !selectedSize))
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-900'
              }`}
              disabled={!selectedVariant || (selectedVariant.sizes.length > 0 && !selectedSize)}
            >
              {!selectedVariant 
                ? 'Please select a variant'
                : selectedVariant.sizes.length > 0 && !selectedSize
                ? 'Please select a size'
                : 'Add to Cart'
              }
            </button>

            {/* Additional Information */}
            <div className="mt-8 space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Product Details</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
              {product.category && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Category</h3>
                  <p className="text-gray-600">{product.category.name}</p>
                </div>
              )}
              {selectedVariant && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Stock Information</h3>
                  <p className="text-gray-600">
                    {selectedVariant.stock > 0 
                      ? `Available: ${selectedVariant.stock} items`
                      : 'Out of stock'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
} 