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
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  admin_id: string;
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  // Properly unwrap params with React.use() as recommended by Next.js 14+
  // We need to cast the unwrapped params to maintain TypeScript type safety
  const unwrappedParams = use(params as unknown as Promise<{ id: string }>);
  const id = unwrappedParams.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      // Fetch product
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch product');
      }
      const productData = await res.json();
      setProduct(productData);
      setCurrentImage(productData.image_url);

      // Fetch variants
      const variantsRes = await fetch(`/api/products/${id}/variants`);
      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        
        // Add random stock values to each variant
        const variantsWithRandomStock = variantsData.map(variant => {
          // Generate random stock between 0 and 20
          const randomStock = Math.floor(Math.random() * 21); // 0 to 20
          return {
            ...variant,
            stock: randomStock,
            // Also add random stock to sizes if they exist
            sizes: variant.sizes ? variant.sizes.map(size => ({
              ...size,
              stock: Math.floor(Math.random() * 21) // 0 to 20
            })) : []
          };
        });
        
        setVariants(variantsWithRandomStock);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

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
    setSelectedSize(null);
    
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
  
  const getAvailableSizes = () => {
    if (!selectedVariant) return [];
    if (!selectedVariant.sizes) return []; // Handle case where sizes is undefined
    return selectedVariant.sizes.map(size => {
      // Add safety check for size.size which might be undefined
      if (!size.size) {
        return { id: 'unknown', name: 'Unknown', stock: size.stock || 0 };
      }
      return {
        id: size.size.id,
        name: size.size.name,
        stock: size.stock
      };
    });
  };

  // When adding new sizes, use this function to ensure admin authentication
  const addNewSize = async (sizeName) => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        console.error("Admin authentication required");
        return null;
      }

      const res = await fetch('/api/variant-sizes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId // Include admin ID in header
        },
        body: JSON.stringify({ name: sizeName })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Failed to add size:', errorData.error);
        return null;
      }

      return await res.json();
    } catch (error) {
      console.error('Error adding size:', error);
      return null;
    }
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
            {variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
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
                        <span className={`block text-xs mt-1 ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variant.stock > 0 ? `${variant.stock} in stock` : 'Sold out'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedVariant && getAvailableSizes() && getAvailableSizes().length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Size</h3>
                <div className="grid grid-cols-5 gap-2">
                  {getAvailableSizes().map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.stock === 0}
                      className={`py-2 text-sm border rounded-md ${
                        selectedSize?.id === size.id
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
            {selectedVariant && selectedVariant.stock > 0 ? (
              <button 
                className="w-full py-4 rounded-full transition duration-200 bg-black text-white hover:bg-gray-800"
              >
                Add to Cart ({selectedVariant.stock} Available)
              </button>
            ) : (
              <button 
                className="w-full py-4 rounded-full transition duration-200 bg-gray-300 text-gray-600 cursor-not-allowed"
                disabled
              >
                Sold Out
              </button>
            )}

            {/* Additional Information */}
            <div className="mt-8 space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Product Details</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
              {product.category_id && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Category</h3>
                  <p className="text-gray-600">{product.category_id}</p>
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