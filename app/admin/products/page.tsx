"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Lora, Montserrat } from "next/font/google"
import NavbarAdmin from "@/components/NavbarAdmin"
import Image from "next/image"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBox, 
  faPlus, 
  faPenToSquare, 
  faTrash, 
  faSearch,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons'

const LoraFontBold = Lora({
  weight: '400',
  subsets: ['latin']
})

const MonsterratFont = Montserrat({
  weight: '400',
  subsets: ['latin']
})

interface Product {
  id: number;
  name: string;
  colours: number;
  price: string;
  description: string;
  image_url: string;
  category_id: string;
  admin_id: string;
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

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Categories[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    colours: 0,
    price: "",
    description: "",
    image: null,
    existingImage: "",
    admin_id: "",
    category_id: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const router = useRouter();

  // Fetch products when the component mounts
  useEffect(() => {
    fetchProducts();
    fetchCategories();

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

  // Handle input changes
  const handleInputChange = (e: any) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
      existingImage: name === "image" ? prev.existingImage : prev.existingImage,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: any) => {
    e.preventDefault()
  
    const adminId = localStorage.getItem("adminId")
    if (!adminId) {
      alert("Admin ID tidak ditemukan")
      return
    }
  
    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        formDataObj.append(key, (value as File))
      } else if (value != null) {
        formDataObj.append(key, String(value))
      }
    })
  
    // Tambahkan admin_id di formData
    formDataObj.set("admin_id", adminId)
  
    const method = editingProduct ? "PUT" : "POST"
    const url = editingProduct 
      ? `/api/admin/products/${editingProduct.id}` 
      : "/api/admin/products/add"
  
    const res = await fetch(url, {
      method,
      body: formDataObj,
    })
  
    if (res.ok) {
      fetchProducts()
      setIsModalOpen(false)
      setFormData({ 
        name: "", 
        colours: 0, 
        price: "", 
        description: "",
        image: null, 
        existingImage: "", 
        admin_id: "",
        category_id: ""
      })
    }
  }

  // Handle product edit
  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      colours: product.colours,
      price: product.price,
      description: product.description || "",
      image: null,
      existingImage: product.image_url,
      admin_id: product.admin_id,
      category_id: product.category_id || ""
    });
    setIsModalOpen(true);
  };

  // Handle product deletion
  const handleDelete = async (id: any) => {
    if (confirm("Hapus produk ini?")) {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      fetchProducts();
    }
  };

  // Use useEffect to set admin_id from localStorage after mounting
  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    if (adminId) {
      setFormData((prev) => ({ ...prev, admin_id: adminId }));
    }
  }, []);

  // Function to get category name by id
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : 'Tidak ada kategori';
  };

  return (
    <>
      <NavbarAdmin />
      {/* Main content - Positioned correctly with sidebar and navbar */}
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section with animated background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>

          <div className={`relative py-16 px-6 mx-auto max-w-5xl transition-all duration-500 ${isHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                <h1 className="text-4xl font-bold mb-4">Kelola Produk</h1>
                <p className="text-lg opacity-90 max-w-lg">
                  Tambahkan, edit, dan kelola semua produk Anda. Buat koleksi produk yang menarik untuk pelanggan Anda.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setFormData({
                        name: "",
                        colours: 0,
                        price: "",
                        description: "",
                        image: null,
                        existingImage: "",
                        admin_id: localStorage.getItem("adminId") || "",
                        category_id: ""
                      });
                      setIsModalOpen(true);
                    }}
                    className="bg-white text-blue-600 px-5 py-3 rounded-full font-medium hover:bg-opacity-90 shadow-md transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Tambah Produk Baru
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

        {/* Search and Filter section */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative min-w-[200px]">
                <FontAwesomeIcon icon={faLayerGroup} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
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
                {searchTerm || selectedCategory ? 
                  "Tidak ada produk yang sesuai dengan filter Anda." : 
                  "Belum ada produk yang ditambahkan. Silakan tambahkan produk baru."}
              </p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    name: "",
                    colours: 0,
                    price: "",
                    description: "",
                    image: null,
                    existingImage: "",
                    admin_id: localStorage.getItem("adminId") || "",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border border-gray-100">
                  <div className="relative h-56 w-full overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(product)}
                          className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium line-clamp-1">{product.name}</h3>
                        <p className="text-gray-600 mt-1">{product.price}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium py-1 px-2 rounded-full">
                        {getCategoryName(product.category_id)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-3 text-sm text-gray-500 flex justify-between items-center">
                      <span>
                        {product.colours > 0 ? (
                          <span>{product.colours} warna</span>
                        ) : (
                          <span>Tidak ada variasi warna</span>
                        )}
                      </span>
                      {product.admin && (
                        <span className="text-xs italic text-gray-500">
                          Added by: {product.admin.username || "Unknown"}
                        </span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="Masukkan nama produk"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="Rp xxx.xxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah Warna <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="colours"
                        value={formData.colours}
                        onChange={handleInputChange}
                        required
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="0"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id.toString()}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi Produk
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="Masukkan deskripsi produk yang detail untuk meningkatkan penjualan..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Produk <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          {(formData.existingImage || formData.image) ? (
                            <div className="relative w-full h-48 mb-4">
                              <img
                                src={formData.existingImage || (formData.image ? URL.createObjectURL(formData.image as File) : '')}
                                alt="Product Preview"
                                className="h-full w-full object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="text-center p-4 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2">Format: JPG, PNG, GIF</p>
                            </div>
                          )}
                          
                          <label className="mt-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer text-center inline-block">
                            {formData.existingImage || formData.image ? "Ganti Gambar" : "Pilih Gambar"}
                            <input
                              type="file"
                              name="image"
                              onChange={handleInputChange}
                              className="hidden"
                              accept="image/*"
                            />
                          </label>
                          {formData.image && (
                            <p className="mt-2 text-xs text-gray-500">
                              File: {(formData.image as File).name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
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