"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Montserrat } from "next/font/google";

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image_url: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

const MontserratFont = Montserrat({
  weight: '400',
  subsets: ['latin']
});

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Sync selectedCategory with query string
  useEffect(() => {
    const categoryFromQuery = searchParams.get("category") || "";
    setSelectedCategory(categoryFromQuery);
  }, [searchParams]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch (err) {
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products (filtered)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let url = "/api/products";
        if (selectedCategory) {
          url += `?category=${selectedCategory}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  // Handle filter change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    // Update URL query
    if (value) {
      router.push(`/products?category=${value}`);
    } else {
      router.push(`/products`);
    }
  };

  return (
    <div className="py-24 px-4 md:px-10 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Produk</h1>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <label htmlFor="category" className="font-medium text-gray-700">
          Filter Kategori:
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="border px-3 py-2 rounded-md min-w-[200px]"
          disabled={isLoadingCategories}
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <h3 className="text-xl font-semibold mb-2">Tidak ada produk</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {selectedCategory
              ? "Tidak ada produk untuk kategori ini."
              : "Belum ada produk yang ditambahkan."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="group relative cursor-pointer"
              onClick={() => router.push(`/productdetails/${product.id}`)}
            >
              <div className={`group relative ${MontserratFont.className}`}>
                <div className="w-full overflow-hidden bg-gray-200 lg:aspect-none group-hover:opacity-75 h-[420px] relative transition-all duration-300">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                </div>
                <div className="mt-4 flex flex-col h-[100px] justify-between">
                  <h3 className="text-gray-700 font-bold text-md truncate w-full">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </h3>
                  <div className="flex flex-col">
                    <p className="text-gray-500 line-clamp-2 overflow-hidden break-words text-xs">
                      {product.description}
                    </p>
                    <p className="font-medium text-gray-900 text-sm pt-2">
                      Rp {product.price}
                    </p>
                  </div> 
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <main className={`${MontserratFont.className} min-h-screen`}>
      <Navbar />
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      }>
        <ProductsContent />
      </Suspense>
      <Footer />
    </main>
  );
} 