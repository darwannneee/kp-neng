"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Lora } from "next/font/google"
import NavbarAdmin from "@/components/NavbarAdmin"
import Image from "next/image"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBox, 
  faPlus, 
  faPenToSquare, 
  faTrash, 
  faSearch
} from '@fortawesome/free-solid-svg-icons'
import { VariantType, VariantOption } from '@/utils/types'
import React from "react"

const LoraFontBold = Lora({
  weight: '400',
  subsets: ['latin']
})

interface Product {
  id: number;
  name: string;
  price: string; // Produk masih memiliki harga, hanya varian yang tidak
  description: string;
  image_url: string;
  category_id: string;
  admin_id: string;
  created_at?: string; // Added created_at property
  admin?: {
    username: string;
    id: string;
    image_url?: string;
  };
}

interface Categories {
  id: number;
  name: string;
}

interface VariantSize {
  size_id: string;
  // stock field removed as it's not needed
}

type FormInputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface FormData {
  name: string;
  price: string;
  description: string;
  image: File | null;
  existingImage: string;
  admin_id: string;
  category_id: string;
}

interface VariantFormData {
  id?: string;
  name: string;
  image: File | null;
  image_url?: string | null;
  sizes: VariantSize[];
  price?: string;
  stock?: string;
  optionIds?: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Categories[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: "",
    description: "",
    image: null,
    existingImage: "",
    admin_id: "",
    category_id: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sizes, setSizes] = useState<{ id: string; name: string }[]>([]);
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const router = useRouter();

  // Fetch products when the component mounts
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSizes();

    // Add scroll event listener for header animation
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsHeaderVisible(scrollPosition < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter products when search term or category changes
  useEffect(() => {
    if (products.length) {
      let filtered = [...products];
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter(product => 
          product.category_id === selectedCategory
        );
      }
      
      setFilteredProducts(filtered);
    }
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products?include=admin")
  
      if (!res.ok) {
        console.error("Failed to fetch products", res.status)
        return
      }
  
      const data = await res.json()
  
      // Pastikan data adalah array
      if (Array.isArray(data)) {
        setProducts(data)
        setFilteredProducts(data)
      } else {
        console.error("Expected array but got:", data)
        setProducts([]) // fallback kosong
        setFilteredProducts([])
      }
    } catch (err) {
      console.error("Network or parsing error:", err)
      setProducts([])
      setFilteredProducts([])
    } finally {
      setIsLoading(false);
    }
  }
  
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')

      if(!res.ok) {
        console.error("Failed to fetch categories", res.status)
      }

      const data = await res.json()

      if(Array.isArray(data)) {
        setCategories(data)
      } else {
        console.error("Expected array but got:", data)
      }
    } catch(err) {
      console.error("Network or parsing error:", err)
      setCategories([])
    }
  }

  const fetchSizes = async () => {
    try {
      // Get admin ID from localStorage and include it in the request header
      const adminId = localStorage.getItem("adminId");
      
      const res = await fetch('/api/variant-sizes', {
        headers: {
          'x-admin-id': adminId || ''  // Include admin authentication header
        }
      });

      if(!res.ok) {
        console.error("Failed to fetch sizes", res.status);
        if (res.status === 401) {
          console.error("Admin authentication required");
        }
      }

      const data = await res.json();

      if(Array.isArray(data)) {
        setSizes(data);
      } else {
        console.error("Expected array but got:", data);
      }
    } catch(err) {
      console.error("Network or parsing error:", err);
      setSizes([]);
    }
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    
    if (target instanceof HTMLInputElement && target.type === "file") {
      const files = target.files;
      if (files && files[0]) {
        const file = files[0];
        setFormData(prev => ({
          ...prev,
          image: file,
          existingImage: prev.existingImage,
        }));
        
        // Create preview URL for the new image
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [target.name]: target.value
      }));
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    };
  }, [imagePreview]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        alert("Please login first");
        router.push("/admin/login");
        return;
      }

      // Prepare variants data with proper structure
      const processedVariants = variants.map((variant: VariantFormData) => {
        // Hanya sertakan image jika benar-benar File object dengan ukuran > 0
        const isValidImage = variant.image instanceof File && variant.image.size > 0;
        
        console.log(`Processing variant data for: ${variant.name}`, {
          hasImage: !!variant.image,
          isFileInstance: variant.image instanceof File,
          imageSize: variant.image instanceof File ? variant.image.size : 0,
          imageType: variant.image instanceof File ? variant.image.type : null,
          imageName: variant.image instanceof File ? variant.image.name : null,
          isValidImage: isValidImage,
          existingImageUrl: variant.image_url
        });

        return {
          id: variant.id,
          name: variant.name,
          image: isValidImage ? variant.image : null,
          image_url: variant.image_url || null,
          sizes: variant.sizes.map((size: VariantSize) => ({
            size_id: size.size_id
          }))
        };
      });

      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("price", formData.price);
      formDataObj.append("description", formData.description);
      formDataObj.append("category_id", formData.category_id);
      formDataObj.append("admin_id", adminId);
      
      // Tambahkan gambar produk utama jika ada
      if (formData.image) {
        formDataObj.append("image", formData.image);
      }
      if (formData.existingImage) {
        formDataObj.append("existingImage", formData.existingImage);
      }
      
      // Tambahkan data varian sebagai JSON string terpisah dari file varian
      const variantsData = processedVariants.map(v => ({
        id: v.id,
        name: v.name,
        image_url: v.image_url,
        sizes: v.sizes
      }));
      formDataObj.append('variants', JSON.stringify(variantsData));
      
      // Tambahkan file gambar varian secara terpisah dengan nama yang jelas
      processedVariants.forEach((variant, index) => {
        if (variant.image instanceof File && variant.image.size > 0) {
          console.log(`Appending variant image file for ${variant.name}`, {
            fileName: variant.image.name,
            fileSize: variant.image.size
          });
          // Gunakan format nama yang jelas: variantImage_[index]
          formDataObj.append(`variantImage_${index}`, variant.image);
        }
      });

      console.log('Submitting form data:', {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category_id: formData.category_id,
        adminId: adminId,
        hasImage: !!formData.image,
        existingImage: formData.existingImage,
        hasVariantsData: processedVariants.length > 0
      });

      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct 
        ? `/api/admin/products/${editingProduct.id}` 
        : "/api/admin/products";

      const res = await fetch(url, {
        method,
        body: formDataObj,
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error('Server error:', data);
        alert(`Error: ${data.error || 'Failed to save product'}`);
        return;
      }

      console.log('Success:', data);
      
      // Reset form and state
      setFormData({
        name: "",
        price: "",
        description: "",
        image: null,
        existingImage: "",
        admin_id: "",
        category_id: ""
      });
      setVariants([]);
      setIsModalOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
      
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save product. Please try again. error = '+ error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle variant edit
  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      image: null,
      existingImage: product.image_url,
      admin_id: product.admin_id,
      category_id: product.category_id
    });
    
    // Fetch product variants
    console.log(`Fetching variants for product ID ${product.id}`);
    try {
      const res = await fetch(`/api/products/${product.id}/variants`);
      
      if (!res.ok) {
        console.error('Failed to fetch product variants', res.status);
        throw new Error(`Failed to fetch variants: ${res.status}`);
      }
      
      const variantData = await res.json();
      console.log('Loaded variants:', variantData);
      
      if (Array.isArray(variantData)) {
        // Transform API variant data to match our form variant data structure
        const formattedVariants = variantData.map(variant => ({
          id: variant.id,
          name: variant.name,
          image: null,
          image_url: variant.image_url,
          sizes: Array.isArray(variant.sizes) ? variant.sizes.map((sizeData: { id: string; size_id: string }) => ({
            id: sizeData.id,
            size_id: sizeData.size_id
          })) : []
        }));
        
        setVariants(formattedVariants);
        console.log('Variants loaded for editing:', formattedVariants);
      }
    } catch (error) {
      console.error('Error fetching product variants:', error);
      setVariants([]);
    }
    
    setIsModalOpen(true);
  };

  // Handle product deletion
  const handleDelete = async (id: string) => {
    if (confirm("Hapus produk ini?")) {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        fetchProducts();
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // Helper to generate cartesian product of options
  function cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>((a, b) => a.flatMap(d => b.map(e => [ ...d, e ])), [[]]);
  }

  return (
    <>
      <NavbarAdmin />
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>

          <div className="relative py-16 px-6 mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                <h1 className="text-4xl font-bold mb-4">Kelola Produk</h1>
                <p className="text-lg opacity-90 max-w-lg">
                  Tambahkan dan kelola produk-produk Anda dengan mudah.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setFormData({
                        name: "",
                        price: "",
                        description: "",
                        image: null,
                        existingImage: "",
                        admin_id: "",
                        category_id: ""
                      });
                      setIsModalOpen(true);
                    }}
                    className="bg-white text-blue-600 px-5 py-3 rounded-full font-medium hover:bg-opacity-90 shadow-md transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Tambah Produk
                  </button>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center md:justify-end">
                <div className="w-44 h-44 relative flex items-center justify-center bg-white bg-opacity-20 rounded-full p-2">
                  <FontAwesomeIcon icon={faBox} className="text-white text-6xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and filter section */}
          <div className={`mb-8 transition-all duration-300 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full text-blue-600">
                <FontAwesomeIcon icon={faBox} className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tidak ada produk</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Belum ada produk yang ditambahkan. Silakan tambahkan produk baru.
              </p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    name: "",
                    price: "",
                    description: "",
                    image: null,
                    existingImage: "",
                    admin_id: "",
                    category_id: ""
                  });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Tambah Produk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="relative pt-[150%]"> {/* This creates a 2:3 aspect ratio container */}
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-medium">{product.name}</h3>
                        <p className="text-xs text-gray-500">{getCategoryName(product.category_id)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id.toString())}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-blue-600">Rp {product.price}</span>
                    </div>
                    
                    {/* Created By information */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-1">Dibuat oleh:</span>
                        {product.admin ? (
                          <div className="flex items-center">
                            <div className="relative w-5 h-5 mr-1 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                              {product.admin.image_url ? (
                                <img src={product.admin.image_url} alt="Admin" className="h-full w-full object-cover" />
                              ) : (
                                <svg className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-gray-600">{product.admin.username}</span>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      
                      {/* Created At information */}
                      {product.created_at && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span className="mr-1">Pada:</span>
                          <span>
                            {new Date(product.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding/editing products */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Produk <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Masukkan nama produk"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                        <input
                          type="text"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="xxx.xxx"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Masukkan deskripsi produk"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Produk <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors duration-200">
                        <div className="space-y-1 text-center">
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload gambar</span>
                              <input
                                id="file-upload"
                                name="image"
                                type="file"
                                className="sr-only"
                                onChange={handleInputChange}
                                accept="image/*"
                              />
                            </label>
                            <p className="pl-1">atau drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF sampai 10MB
                          </p>
                          
                          {/* Show preview for new image */}
                          {imagePreview && (
                              <div className="mt-4">
                                  <p className="text-sm text-gray-500 mb-2">Preview gambar:</p>
                                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                      <Image
                                          src={imagePreview}
                                          alt="Preview"
                                          fill
                                          className="object-cover"
                                      />
                                  </div>
                              </div>
                          )}
                          
                          {/* Show existing image */}
                          {formData.existingImage && !imagePreview && (
                              <div className="mt-4">
                                  <p className="text-sm text-gray-500 mb-2">Gambar saat ini:</p>
                                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                      <Image
                                          src={formData.existingImage}
                                          alt="Current product image"
                                          fill
                                          className="object-cover"
                                      />
                                  </div>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Variants Produk</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Tambahkan varian produk (contoh: warna, motif) beserta ukuran yang tersedia untuk setiap varian.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <VariantList
                      variants={variants}
                      setVariants={setVariants}
                      sizes={sizes}
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? "Simpan Perubahan" : "Tambah Produk"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VariantList({ variants, setVariants, sizes }: { 
  variants: VariantFormData[], 
  setVariants: (v: VariantFormData[]) => void, 
  sizes: { id: string, name: string }[] 
}) {
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{[key: number]: string}>({});
  
  useEffect(() => {
    // Create preview URLs for existing variant images
    const previewUrls: {[key: number]: string} = {};
    variants.forEach((variant, idx) => {
      if (variant.image instanceof File) {
        previewUrls[idx] = URL.createObjectURL(variant.image);
      }
    });
    
    setImagePreviewUrls(previewUrls);
    
    // Store current URLs to clean up in the closure
    const currentUrls = {...previewUrls};
    
    // Cleanup function to revoke object URLs
    return () => {
      Object.values(currentUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [variants]);

  const handleAdd = () => setVariants([
    ...variants, 
    { 
      name: '', 
      image: null, 
      image_url: null,
      sizes: [] 
    }
  ]);

  const handleRemove = (idx: number) => {
    // Remove image preview if exists
    if (imagePreviewUrls[idx]) {
      URL.revokeObjectURL(imagePreviewUrls[idx]);
      const newPreviews = {...imagePreviewUrls};
      delete newPreviews[idx];
      setImagePreviewUrls(newPreviews);
    }
    
    // Remove variant from array
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: string, value: string | File | null) => {
    const newVariants = [...variants];
    newVariants[idx] = { ...newVariants[idx], [field]: value };
    
    // Handle image file changes
    if (field === 'image' && value instanceof File) {
      // Revoke old preview URL if exists
      if (imagePreviewUrls[idx]) {
        URL.revokeObjectURL(imagePreviewUrls[idx]);
      }
      
      // Create new preview URL
      const newPreviews = {...imagePreviewUrls};
      newPreviews[idx] = URL.createObjectURL(value);
      setImagePreviewUrls(newPreviews);
    }
    
    setVariants(newVariants);
  };

  const handleSizeChange = (variantIdx: number, sizeId: string, checked: boolean) => {
    const newVariants = [...variants];
    const variant = newVariants[variantIdx];
    
    if (checked) {
      variant.sizes = [...variant.sizes, { size_id: sizeId }];
    } else {
      variant.sizes = variant.sizes.filter(size => size.size_id !== sizeId);
    }
    
    setVariants(newVariants);
  };
  
  // Stock functions removed as they're not needed anymore

  return (
    <div className="space-y-6">
      {variants.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Belum ada varian produk. Klik tombol di bawah untuk menambahkan varian.</p>
        </div>
      )}
      
      {variants.map((variant, idx) => (
        <div key={variant.id || idx} className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">{variant.name || `Varian ${idx + 1}`}</h4>
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Hapus Varian
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Left column - Basic variant info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Varian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={e => handleChange(idx, 'name', e.target.value)}
                  placeholder="Contoh: Merah, Putih, dll"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Bagian harga varian dihapus karena tidak dibutuhkan */}

              {/* Bagian stok varian dihapus karena tidak dibutuhkan */}
            </div>
            
            <div className="space-y-4">
              {/* Right column - Image and sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gambar Varian
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="flex-shrink-0 h-24 w-24 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {imagePreviewUrls[idx] ? (
                      <img src={imagePreviewUrls[idx]} alt="Preview" className="h-full w-full object-cover" />
                    ) : variant.image_url ? (
                      <img src={variant.image_url} alt="Variant" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm text-center p-2">No image</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <input
                      type="file"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        console.log('File selected for variant:', {
                          name: variant.name,
                          hasFile: !!file,
                          fileName: file?.name,
                          fileSize: file?.size,
                          fileType: file?.type
                        });
                        // Hanya set image jika file valid
                        if (file && file.size > 0) {
                          handleChange(idx, 'image', file);
                        } else {
                          console.log('Empty or invalid file selected');
                          handleChange(idx, 'image', null);
                        }
                      }}
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Unggah gambar untuk varian ini</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ukuran yang Tersedia
                </label>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {sizes.map(size => (
                      <label key={size.id} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variant.sizes.some(s => s.size_id === size.id)}
                          onChange={e => handleSizeChange(idx, size.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{size.name}</span>
                      </label>
                    ))}
                  </div>
                  
                  {variant.sizes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 border-t border-gray-200 pt-3">Ukuran yang Dipilih</h5>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {variant.sizes.map(size => (
                            <div key={size.size_id} className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
                              <span className="text-sm font-medium text-blue-600">
                                {sizes.find(s => s.id === size.size_id)?.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Tambah Varian
      </button>
    </div>
  );
}