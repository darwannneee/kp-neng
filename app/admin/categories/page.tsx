"use client";
import { useEffect, useState } from "react";
import { Lora } from "next/font/google";
import NavbarAdmin from "@/components/NavbarAdmin";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLayerGroup, 
  faPlus, 
  faPenToSquare, 
  faTrash, 
  faSearch,
  faTag
} from '@fortawesome/free-solid-svg-icons';

const LoraFontBold = Lora({
  weight: "400",
  subsets: ["latin"],
});

interface Category {
  id: string;
  name: string;
  created_at: string;
  created_by_id?: string;
  created_by?: {
    id: string;
    username: string;
    image_url?: string;
  };
}

interface ApiError {
  error: string;
  message?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Basic check for authentication before fetching
    if (typeof window !== "undefined") {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        router.push("/admin/login");
      } else {
        fetchCategories(); // Fetch categories through the API
      }
    }

    // Add scroll event listener for header animation
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsHeaderVisible(scrollPosition < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router]);

  // Filter categories when search term changes
  useEffect(() => {
    if (categories.length) {
      if (searchTerm) {
        const filtered = categories.filter(category => 
          category.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categories);
      }
    }
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories?include=admin");

      if (!res.ok) {
        const errorData = await res.json() as ApiError;
        console.error("Failed to fetch categories from API:", res.status, errorData);
        setError(errorData.error || "Gagal mengambil data kategori.");
        setCategories([]);
        setFilteredCategories([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setCategories(data);
        setFilteredCategories(data);
      } else {
        console.error("Expected array but got:", data);
        setCategories([]);
        setFilteredCategories([]);
        setError("Format data kategori tidak sesuai dari API.");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Network or parsing error while fetching categories from API:", err);
      setCategories([]);
      setFilteredCategories([]);
      setError("Terjadi kesalahan jaringan atau parsing API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for the current field if any
    if (error && error.includes(name)) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }

    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      setError("Admin ID tidak ditemukan");
      return;
    }

    const dataToSend = {
      name: formData.name.trim(),
      admin_id: adminId,
    };

    const method = editingCategory ? "PUT" : "POST";
    const url = editingCategory
      ? `/api/admin/categories/${editingCategory.id}`
      : "/api/admin/categories";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await res.json() as ApiError;

      if (res.ok) {
        fetchCategories();
        setIsModalOpen(false);
        setFormData({
          name: "",
        });
        setEditingCategory(null);
      } else {
        setError(result.error || `Gagal ${editingCategory ? "mengupdate" : "menambah"} kategori. Status: ${res.status}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Submission error to API:", err);
      setError(`Terjadi kesalahan: ${err.message}`);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus kategori ini? Menghapus kategori akan menghapus semua produk yang terkait dengan kategori ini.")) {
      setError(null);
      try {
        const url = `/api/admin/categories/${id}`;
        const res = await fetch(url, {
          method: "DELETE",
        });

        if (res.ok) {
          fetchCategories();
        } else {
          const result = await res.json() as ApiError;
          setError(result.error || `Gagal menghapus kategori. Status: ${res.status}`);
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Deletion error to API:", err);
        setError(`Terjadi kesalahan saat menghapus: ${err.message}`);
      }
    }
  };

  return (
    <>
      <NavbarAdmin />
      {/* Main content - Positioned correctly with sidebar and navbar */}
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section with animated background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>

          <div className={`relative py-16 px-6 mx-auto max-w-5xl transition-all duration-500 ${isHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                <h1 className="text-4xl font-bold mb-4">Kelola Kategori</h1>
                <p className="text-lg opacity-90 max-w-lg">
                  Atur dan kelola kategori produk untuk memudahkan pelanggan dalam menemukan produk yang mereka cari.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setFormData({
                        name: "",
                      });
                      setIsModalOpen(true);
                      setError(null);
                    }}
                    className="bg-white text-green-600 px-5 py-3 rounded-full font-medium hover:bg-opacity-90 shadow-md transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Tambah Kategori Baru
                  </button>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center md:justify-end">
                <div className="w-44 h-44 relative flex items-center justify-center bg-white bg-opacity-20 rounded-full p-2">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-white text-6xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search section */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="relative flex-grow max-w-md mx-auto md:mx-0">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-green-100 rounded-full text-green-600">
                <FontAwesomeIcon icon={faTag} className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tidak ada kategori</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm ? 
                  "Tidak ada kategori yang sesuai dengan pencarian Anda." : 
                  "Belum ada kategori yang ditambahkan. Silakan tambahkan kategori baru."}
              </p>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({
                    name: "",
                  });
                  setIsModalOpen(true);
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Tambah Kategori
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Kategori
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal Dibuat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat Oleh
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{category.id.substring(0, 6)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faTag} className="text-green-600 text-xs" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.created_by ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                                {category.created_by.image_url ? (
                                  <img src={category.created_by.image_url} alt="Admin" className="h-full w-full object-cover" />
                                ) : (
                                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{category.created_by.username}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding/editing category */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama kategori"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingCategory ? "Simpan Perubahan" : "Tambah Kategori"}
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