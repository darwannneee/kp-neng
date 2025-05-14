"use client"
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Lora, Lacquer, Montserrat } from "next/font/google";
import Footer from "@/components/Footer";
import { useState } from "react";
import Link from "next/link";

// Import fonts
const LoraFontBold = Lora({
  weight: '500',
  subsets: ['latin']
});
const LacquerFont = Lacquer({
  weight: '400',
  subsets: ['latin']
});
const MontserratFont = Montserrat({
  weight: '400',
  subsets: ['latin']
});

// Contoh data produk (ambil dari newProducts)
const product = {
  id: 1,
  name: 'Ruffle Maxi Dress',
  colours: 2,
  price: '$179',
  image: 'https://rvfvqtugsptkfkmdfhnv.supabase.co/storage/v1/object/sign/ecoute/product/parfum.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzI4NTliMWI5LTBjNzctNDAxMS1iODQ3LTIxM2M2OGI5ZjMwNyJ9.eyJ1cmwiOiJlY291dGUvcHJvZHVjdC9wYXJmdW0ucG5nIiwiaWF0IjoxNzQ1NzI5NTk5LCJleHAiOjE3NzcyNjU1OTl9.-8wIQ78HpXx6mXTYPlpjA5xlIfy1qmdjJiv9lohE9zg',
  description: "A timeless piece that combines elegance with comfort. The Ruffle Maxi Dress features a flattering V-neckline, delicate ruffle detailing, and a flowing silhouette that moves beautifully with every step.",
  details: {
    material: "100% Premium Cotton",
    fit: "Regular Fit",
    care: "Machine wash cold, tumble dry low",
    features: [
      "Adjustable straps",
      "Side slit for ease of movement",
      "Lined bodice"
    ]
  }
};

const newProducts = [
    {
      id: 1,
      name: 'Ruffle Maxi Dress',
      colours: 2,
      price: '$179',
      image: 'https://rvfvqtugsptkfkmdfhnv.supabase.co/storage/v1/object/sign/ecoute/product/parfum.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzI4NTliMWI5LTBjNzctNDAxMS1iODQ3LTIxM2M2OGI5ZjMwNyJ9.eyJ1cmwiOiJlY291dGUvcHJvZHVjdC9wYXJmdW0ucG5nIiwiaWF0IjoxNzQ1NzI5NTk5LCJleHAiOjE3NzcyNjU1OTl9.-8wIQ78HpXx6mXTYPlpjA5xlIfy1qmdjJiv9lohE9zg',
    },
    {
      id: 2,
      name: 'Buckled Strappy Slingback Ballerinas',
      colours: 2,
      price: '$159',
      image: 'https://rvfvqtugsptkfkmdfhnv.supabase.co/storage/v1/object/sign/ecoute/product/parfum2.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzI4NTliMWI5LTBjNzctNDAxMS1iODQ3LTIxM2M2OGI5ZjMwNyJ9.eyJ1cmwiOiJlY291dGUvcHJvZHVjdC9wYXJmdW0yLnBuZyIsImlhdCI6MTc0NTcyOTYyMiwiZXhwIjoxNzc3MjY1NjIyfQ.LFwNsdZcN_ykva28APIEpgckltXeJtcFD-UqVFI1VrM',
    },
    {
      id: 3,
      name: 'Draped Sleeveless Midi Dress',
      colours: 3,
      price: '$99',
      image: 'https://rvfvqtugsptkfkmdfhnv.supabase.co/storage/v1/object/sign/ecoute/product/parfum3.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzI4NTliMWI5LTBjNzctNDAxMS1iODQ3LTIxM2M2OGI5ZjMwNyJ9.eyJ1cmwiOiJlY291dGUvcHJvZHVjdC9wYXJmdW0zLnBuZyIsImlhdCI6MTc0NTcyOTYzNywiZXhwIjoxNzc3MjY1NjM3fQ.WdYdrl28e8ney230kt9JGGudOMEfPvtmfQgzozerA4M',
    }
]

export default function ProductDetail() {
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');

  return (
    <main className={`${LoraFontBold.className}`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:underline">Home</Link> / 
          <Link href="/products" className="hover:underline"> Products</Link> / 
          <span className="text-gray-900"> {product.name}</span>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Product Image */}
          <div className="relative h-[400px] md:h-[500px]">
            <Image
              src={product.image}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-medium mb-2">{product.name}</h1>
            <p className="text-gray-500 mb-4">Product ID: {product.id}</p>
            <p className="text-2xl font-medium mb-6">{product.price}</p>
            
            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Colors ({product.colours})</h3>
              <div className="flex space-x-3">
                {[...Array(product.colours)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === index 
                        ? 'border-black' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: index === 0 ? '#F5F5DC' : '#2E2E2E' }}
                    aria-label={`Color option ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Size</h3>
              <div className="grid grid-cols-4 gap-2">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 px-4 border rounded-md text-sm ${
                      selectedSize === size
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Quantity</h3>
              <div className="flex items-center border rounded-md w-32">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border-r"
                >
                  -
                </button>
                <span className="px-3 py-1 w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 border-l"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-8">
              <button className="flex-1 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
                Add to Cart
              </button>
              <button className="p-3 border rounded-md hover:bg-gray-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.716-1.607-2.378-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>

            {/* Product Description */}
            <div className="border-t border-b py-6">
              <h3 className="text-lg font-medium mb-3">Product Details</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Material & Care</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  <li>{product.details.material}</li>
                  <li>{product.details.care}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        <div className="mt-16">
          <h2 className="text-2xl font-medium mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Contoh produk terkait (ambil dari newProducts) */}
            {newProducts.slice(1, 5).map((relatedProduct) => (
              <div key={relatedProduct.id} className="group">
                <div className="relative h-64 bg-gray-100 overflow-hidden mb-3 rounded">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-sm font-medium">{relatedProduct.name}</h3>
                <p className="text-gray-500 text-sm">Colours ({relatedProduct.colours})</p>
                <p className="font-medium">{relatedProduct.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}