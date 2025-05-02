"use client";
import { useEffect, useState } from "react";
import { Lora } from "next/font/google";
import NavbarAdmin from "@/components/NavbarAdmin";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImages, 
  faPlus, 
  faPenToSquare, 
  faTrash, 
  faSearch,
  faSort
} from '@fortawesome/free-solid-svg-icons';

const LoraFontBold = Lora({
  weight: "400",
  subsets: ["latin"],
});

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  type: string;
  position: number;
  admin_id?: string;
  created_at: string;
  updated_at?: string;
  admin?: {
    username: string;
    id: string;
  };
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    type: "hero", // Default type
    position: 1,
    image: null,
    existingImage: "",
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
        fetchBanners();
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

  // Filter banners when search term changes
  useEffect(() => {
    if (banners.length) {
      if (searchTerm) {
        const filtered = banners.filter(banner => 
          banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          banner.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          banner.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBanners(filtered);
      } else {
        setFilteredBanners(banners);
      }
    }
  }, [searchTerm, banners]);

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/banners");

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to fetch banners:", res.status, errorData);
        setError(errorData.error || "Gagal mengambil data banner.");
        setBanners([]);
        setFilteredBanners([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setBanners(data);
        setFilteredBanners(data);
      } else {
        console.error("Expected array but got:", data);
        setBanners([]);
        setFilteredBanners([]);
        setError("Format data banner tidak sesuai.");
      }
    } catch (err) {
      console.error("Network or parsing error:", err);
      setBanners([]);
      setFilteredBanners([]);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
      existingImage: name === "image" ? prev.existingImage : prev.existingImage,
    }));
    // Clear validation error for the current field if any
    if (error && error.includes(name)) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Judul banner wajib diisi.");
      return;
    }

    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      setError("Admin ID tidak ditemukan");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("subtitle", formData.subtitle);
    formDataToSend.append("buttonText", formData.buttonText);
    formDataToSend.append("buttonLink", formData.buttonLink);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("position", formData.position.toString());
    formDataToSend.append("admin_id", adminId);

    if (formData.image) {
      formDataToSend.append("image", formData.image as any);
    }
    
    if (editingBanner && !formData.image) {
      formDataToSend.append("existingImage", formData.existingImage);
    }

    try {
      const method = editingBanner ? "PUT" : "POST";
      const url = editingBanner
        ? `/api/banners/${editingBanner.id}`
        : "/api/banners";

      const res = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || `Gagal ${editingBanner ? "mengupdate" : "menambah"} banner.`);
        return;
      }

      fetchBanners();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(`Terjadi kesalahan: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      buttonText: "",
      buttonLink: "",
      type: "hero",
      position: 1,
      image: null,
      existingImage: "",
    });
    setEditingBanner(null);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.button_text,
      buttonLink: banner.button_link,
      type: banner.type,
      position: banner.position,
      image: null,
      existingImage: banner.image_url,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus banner ini?")) {
      setError(null);
      try {
        const res = await fetch(`/api/banners/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          fetchBanners();
        } else {
          const result = await res.json();
          setError(result.error || `Gagal menghapus banner.`);
        }
      } catch (err: any) {
        console.error("Deletion error:", err);
        setError(`Terjadi kesalahan saat menghapus: ${err.message}`);
      }
    }
  };

  const getBannerTypeName = (type: string) => {
    switch(type) {
      case 'hero': return 'Hero Banner';
      case 'promo': return 'Promosi';
      case 'category': return 'Kategori';
      case 'section': return 'Bagian';
      default: return type;
    }
  };

  return (
    <>
      <NavbarAdmin />
      {/* Main content - Positioned correctly with sidebar and navbar */}
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section with animated background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>

          <div className={`relative py-16 px-6 mx-auto max-w-5xl transition-all duration-500 ${isHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                <h1 className="text-4xl font-bold mb-4">Kelola Banner</h1>
                <p className="text-lg opacity-90 max-w-lg">
                  Atur dan kelola banner pada halaman utama website untuk menarik perhatian pengunjung.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      resetForm();
                      setIsModalOpen(true);
                    }}
                    className="bg-white text-purple-600 px-5 py-3 rounded-full font-medium hover:bg-opacity-90 shadow-md transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Tambah Banner Baru
                  </button>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center md:justify-end">
                <div className="w-44 h-44 relative flex items-center justify-center bg-white bg-opacity-20 rounded-full p-2">
                  <FontAwesomeIcon icon={faImages} className="text-white text-6xl" />
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
                placeholder="Cari banner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-purple-100 rounded-full text-purple-600">
                <FontAwesomeIcon icon={faImages} className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tidak ada banner</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm ? 
                  "Tidak ada banner yang sesuai dengan pencarian Anda." : 
                  "Belum ada banner yang ditambahkan. Silakan tambahkan banner baru."}
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Tambah Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBanners.map((banner) => (
                <div key={banner.id} className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border border-gray-100">
                  <div className="relative h-48 w-full overflow-hidden">
                    {banner.image_url ? (
                      <img 
                        src={banner.image_url} 
                        alt={banner.title} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">Tidak ada gambar</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
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
                        <h3 className="text-lg font-medium line-clamp-1">{banner.title}</h3>
                        <p className="text-gray-600 mt-1 line-clamp-1">{banner.subtitle}</p>
                      </div>
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium py-1 px-2 rounded-full">
                        {getBannerTypeName(banner.type)}
                      </span>
                    </div>
                    <div className="mt-3 text-sm flex justify-between items-center">
                      <span className="text-gray-500">
                        Posisi: {banner.position}
                      </span>
                      {banner.admin && (
                        <span className="text-xs italic text-gray-500">
                          Dibuat oleh: {banner.admin.username || "Unknown"}
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

      {/* Modal for adding/editing banners */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">
                  {editingBanner ? "Edit Banner" : "Tambah Banner Baru"}
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
                        Judul Banner <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        placeholder="Masukkan judul banner"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subjudul
                      </label>
                      <input
                        type="text"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        placeholder="Masukkan subjudul"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teks Tombol
                      </label>
                      <input
                        type="text"
                        name="buttonText"
                        value={formData.buttonText}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        placeholder="Contoh: Belanja Sekarang"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link Tombol
                      </label>
                      <input
                        type="text"
                        name="buttonLink"
                        value={formData.buttonLink}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        placeholder="Contoh: /products"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="flex gap-6">
                      <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipe Banner <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none transition-colors"
                        >
                          <option value="hero">Hero Banner</option>
                          <option value="promo">Promosi</option>
                          <option value="category">Kategori</option>
                          <option value="section">Bagian</option>
                        </select>
                      </div>
                      <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Posisi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Banner <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          {(formData.existingImage || formData.image) ? (
                            <div className="relative w-full h-48 mb-4">
                              <img
                                src={formData.existingImage || (formData.image ? URL.createObjectURL(formData.image as any) : '')}
                                alt="Banner Preview"
                                className="h-full w-full object-contain rounded"
                              />
                            </div>
                          ) : (
                            <div className="text-center p-4 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-2">Format: JPG, PNG, GIF</p>
                              <p className="text-xs text-gray-400">Rekomendasi: 1920x600 pixels</p>
                            </div>
                          )}
                          
                          <label className="mt-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors cursor-pointer text-center inline-block">
                            {formData.existingImage || formData.image ? "Ganti Gambar" : "Pilih Gambar"}
                            <input
                              type="file"
                              name="image"
                              onChange={handleInputChange}
                              className="hidden"
                              accept="image/*"
                              required={!editingBanner}
                            />
                          </label>
                          {formData.image && (
                            <p className="mt-2 text-xs text-gray-500">
                              File: {(formData.image as any).name}
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
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    {editingBanner ? "Simpan Perubahan" : "Tambah Banner"}
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