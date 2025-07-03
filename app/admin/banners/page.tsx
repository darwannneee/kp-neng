"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Lora } from "next/font/google"
import NavbarAdmin from "@/components/NavbarAdmin"
import Image from "next/image"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faPenToSquare, 
  faTrash,
  faArrowUp,
  faArrowDown,
  faImages
} from '@fortawesome/free-solid-svg-icons'

const LoraFontBold = Lora({
  weight: '400',
  subsets: ['latin']
})

interface Banner {
  id: string;
  type: 'header' | 'swimwear' | 'favorite_places';
  position: number;
  product_id: string;
  title?: string;
  subtitle?: string;
  custom_text?: string;
  created_at: string;
  updated_at?: string;
  created_by_id?: string;
  created_by?: {
    id: string;
    username: string;
    image_url?: string;
  };
  product: {
    id: string;
    name: string;
    image_url: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface Product {
  id: string;
  name: string;
  image_url: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
  };
}

export default function AdminBanners() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    type: 'header' as Banner['type'],
    position: 1,
    productId: '',
    title: '',
    subtitle: '',
    custom_text: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      router.push("/admin/login");
      return;
    }
    
    fetchBanners();
    fetchProducts();
  }, [router]);

  const fetchBanners = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        throw new Error("Admin not authenticated");
      }

      const res = await fetch("/api/admin/banners", {
        headers: {
          'x-admin-id': adminId
        }
      });
      if (!res.ok) throw new Error("Gagal mengambil banner");
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      setError("Gagal memuat banner");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        throw new Error("Admin not authenticated");
      }

      const res = await fetch("/api/admin/products?include=admin,category", {
        headers: {
          'x-admin-id': adminId
        }
      });
      if (!res.ok) throw new Error("Gagal mengambil produk");
      const data = await res.json();
      console.log('Fetched Products:', data);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Gagal memuat produk");
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    const initialType = 'header';
    const availablePositions = getAvailablePositions(initialType);
    setFormData({
      id: '',
      type: initialType,
      position: availablePositions[0] || 1,
      productId: '',
      title: '',
      subtitle: '',
      custom_text: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setIsEditing(true);
    setFormData({
      id: banner.id,
      type: banner.type,
      position: banner.position,
      productId: banner.product_id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      custom_text: banner.custom_text || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        throw new Error("Admin not authenticated");
      }

      const res = await fetch(`/api/admin/banners?id=${id}`, {
        method: "DELETE",
        headers: {
          'x-admin-id': adminId
        }
      });

      if (!res.ok) throw new Error("Gagal menghapus banner");

      await fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      setError("Gagal menghapus banner");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        throw new Error("Admin not authenticated");
      }

      const method = isEditing ? "PUT" : "POST";
      const url = "/api/admin/banners";
      
      // Get selected product
      const selectedProduct = products.find(p => p.id === formData.productId);
      console.log('Selected Product:', selectedProduct);
      
      if (!selectedProduct) throw new Error("Produk tidak ditemukan");

      // Debug logs
      console.log('Form Data Position:', formData.position);
      console.log('Form Data Position Type:', typeof formData.position);
      
      // Ensure position is a number
      const position = Number(formData.position);
      console.log('Converted Position:', position);
      console.log('Converted Position Type:', typeof position);

      // Get available positions
      const availablePositions = getAvailablePositions(formData.type);
      console.log('Available Positions:', availablePositions);

      // Validate position availability
      if (!availablePositions.includes(position)) {
        throw new Error(`Posisi ${position} tidak tersedia untuk banner ${formData.type}. Posisi tersedia: ${availablePositions.join(', ')}`);
      }

      // Prepare body based on banner type
      const body = {
        ...formData,
        position: position,
        // For header type, use product name as title and category name as subtitle
        title: formData.type === 'header' ? selectedProduct.name : formData.title,
        subtitle: formData.type === 'header' 
          ? (selectedProduct.category?.name || '') 
          : formData.subtitle,
      };

      console.log('Request Body:', body);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          'x-admin-id': adminId
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Gagal ${isEditing ? "memperbarui" : "menambah"} banner`);
      }

      await fetchBanners();
      setIsModalOpen(false);
    } catch (error) {
      console.error(`Error ${isEditing ? "memperbarui" : "menambah"} banner:`, error);
      setError(error instanceof Error ? error.message : `Gagal ${isEditing ? "memperbarui" : "menambah"} banner`);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    try {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        throw new Error("Admin not authenticated");
      }

      const banner = banners.find(b => b.id === id);
      if (!banner) return;

      const currentIndex = banners.findIndex(b => b.id === id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= banners.length) return;

      const targetBanner = banners[targetIndex];
      
      // Swap positions
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-admin-id': adminId
        },
        body: JSON.stringify({
          id: banner.id,
          position: targetBanner.position,
          type: banner.type,
          productId: banner.product_id,
        }),
      });

      if (!res.ok) throw new Error("Gagal memindahkan banner");

      const res2 = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'x-admin-id': adminId
        },
        body: JSON.stringify({
          id: targetBanner.id,
          position: banner.position,
          type: targetBanner.type,
          productId: targetBanner.product_id,
        }),
      });

      if (!res2.ok) throw new Error("Gagal memindahkan banner");

      await fetchBanners();
    } catch (error) {
      console.error("Error moving banner:", error);
      setError("Gagal memindahkan banner");
    }
  };

  // Get available positions for each banner type
  const getAvailablePositions = (type: string) => {
    // Get all positions used by existing banners of this type
    const usedPositions = banners
      .filter(b => b.type === type)
      .map(b => Number(b.position));

    console.log('Used Positions:', usedPositions);

    // Define max positions for each type
    const maxPositions = {
      header: 3,
      swimwear: 2,
      favorite_places: 2
    };

    // If editing, exclude current banner's position from used positions
    if (isEditing && formData.id) {
      const currentBanner = banners.find(b => b.id === formData.id);
      if (currentBanner) {
        const index = usedPositions.indexOf(Number(currentBanner.position));
        if (index > -1) {
          usedPositions.splice(index, 1);
        }
      }
    }

    // Return available positions (1 to maxPositions[type])
    const availablePositions = Array.from(
      { length: maxPositions[type as keyof typeof maxPositions] },
      (_, i) => i + 1
    ).filter(pos => !usedPositions.includes(pos));

    console.log('Final Available Positions:', availablePositions);
    return availablePositions;
  };

  // Handle type change
  const handleTypeChange = (newType: Banner['type']) => {
    const availablePositions = getAvailablePositions(newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
      position: availablePositions[0] || 1
    }));
  };

  return (
    <>
      <NavbarAdmin />
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOC00IDQtNC0xLjgtNC00IDQtMS44LTQtNC00IDQtNC0xLjgtNC00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>
          <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
            <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Kelola Banner
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
              Sesuaikan banner halaman utama dan produk unggulan Anda
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add Banner Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Banner List</h2>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Banner
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Banners List */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gambar
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posisi
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produk
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Judul
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subjudul
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teks Kustom
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat Oleh
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibuat Pada
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {banners.map((banner) => (
                      <tr key={banner.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative h-16 w-16">
                            <Image
                              src={banner.product.image_url}
                              alt={banner.product.name}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {banner.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {banner.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {banner.product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {banner.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {banner.subtitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {banner.custom_text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {banner.created_by ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                                {banner.created_by.image_url ? (
                                  <img src={banner.created_by.image_url} alt="Admin" className="h-full w-full object-cover" />
                                ) : (
                                  <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{banner.created_by.username}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {banner.created_at ? (
                            new Date(banner.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMove(banner.id, 'up')}
                              className="text-gray-400 hover:text-gray-500"
                              title="Move Up"
                            >
                              <FontAwesomeIcon icon={faArrowUp} />
                            </button>
                            <button
                              onClick={() => handleMove(banner.id, 'down')}
                              className="text-gray-400 hover:text-gray-500"
                              title="Move Down"
                            >
                              <FontAwesomeIcon icon={faArrowDown} />
                            </button>
                            <button
                              onClick={() => handleEdit(banner)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              onClick={() => handleDelete(banner.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Banner" : "Add Banner"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipe
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as Banner['type'])}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="header">Header</option>
                    <option value="swimwear">Swimwear</option>
                    <option value="favorite_places">Favorite Places</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Posisi
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: Number(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    {getAvailablePositions(formData.type).map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Produk
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => {
                      const product = products.find(p => p.id === e.target.value);
                      console.log('Selected Product on Change:', product);
                      setFormData(prev => ({
                        ...prev,
                        productId: e.target.value,
                        ...(prev.type === 'header' && product ? {
                          title: product.name,
                          subtitle: product.category?.name || ''
                        } : {})
                      }));
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih produk</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type === 'swimwear' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teks Kustom
                    </label>
                    <input
                      type="text"
                      value={formData.custom_text}
                      onChange={(e) => setFormData({ ...formData, custom_text: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                {formData.type === 'favorite_places' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Judul
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isEditing ? "Perbarui" : "Tambah"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}