"use client"
import { useEffect, useState } from 'react';
import NavbarAdmin from '@/components/NavbarAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faSearch, faPalette, faShirt } from '@fortawesome/free-solid-svg-icons';
import { Lora } from 'next/font/google';

const LoraFontBold = Lora({
  weight: "400",
  subsets: ["latin"],
});

interface VariantType {
  id: string;
  name: string;
  created_at: string;
  created_by?: {
    id: string;
    username: string;
    image_url?: string;
  };
  products?: Array<{
    id: string;
    name: string;
    image_url?: string;
  }>;
  product_count?: number;
  image_url?: string;
  image?: File;
}

export default function AdminVariantTypes() {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<VariantType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all variant types
  const fetchVariantTypes = async () => {
    setLoading(true);
    try {
      // Get the admin ID from local storage for the API call
      const adminId = localStorage.getItem('adminId');
      if (!adminId) {
        setError('Admin ID is missing. Please log in again.');
        return;
      }

      const res = await fetch('/api/variant-types', {
        headers: {
          'x-admin-id': adminId
        }
      });
      const data = await res.json();
      if (res.ok) {
        setVariantTypes(data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
      setVariantTypes([])
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariantTypes();
  }, []);

  // Add new variant type
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Get the admin ID from local storage for the API call
      const adminId = localStorage.getItem('adminId');
      if (!adminId) {
        setError('Admin ID is missing. Please log in again.');
        return;
      }

      const res = await fetch('/api/variant-types', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify({ name: newTypeName.trim() })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Tipe variant berhasil ditambahkan');
        setNewTypeName('');
        fetchVariantTypes();
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
    } finally {
      setLoading(false);
    }
  };

  // Update variant type
  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editingType.name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Get the admin ID from local storage for the API call
      const adminId = localStorage.getItem('adminId');
      if (!adminId) {
        setError('Admin ID is missing. Please log in again.');
        return;
      }

      const res = await fetch('/api/variant-types', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify({ 
          id: editingType.id, 
          name: editingType.name.trim()
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Tipe variant berhasil diperbarui');
        setEditingType(null);
        setIsModalOpen(false);
        fetchVariantTypes();
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
    } finally {
      setLoading(false);
    }
  };

  // Delete variant type
  const handleDeleteType = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tipe variant ini?')) return;

    setLoading(true);
    setError(null);
    try {
      // Get the admin ID from local storage for the API call
      const adminId = localStorage.getItem('adminId');
      if (!adminId) {
        setError('Admin ID is missing. Please log in again.');
        return;
      }

      const res = await fetch(`/api/variant-types?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-id': adminId
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Tipe variant berhasil dihapus');
        fetchVariantTypes();
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarAdmin />
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>
          <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
            <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Kelola Tipe Variant
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-center text-xl text-white sm:max-w-3xl">
              Mengelola tipe variant untuk produk (seperti Warna, Ukuran, dsb)
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add Variant Type Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Daftar Tipe Variant</h2>
            <button
              onClick={() => {
                setEditingType(null);
                setNewTypeName('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Tambah Tipe Variant
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-medium">Sukses</p>
              <p>{success}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold mb-2">Memuat data...</h3>
            </div>
          ) : variantTypes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-teal-100 rounded-full text-teal-600">
                <FontAwesomeIcon icon={faPalette} className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tidak ada tipe variant</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Belum ada tipe variant yang ditambahkan. Silakan tambahkan tipe variant baru.
              </p>
              <button
                onClick={() => {
                  setEditingType(null);
                  setNewTypeName('');
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Tambah Tipe Variant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {variantTypes.map((type) => (
                <div key={type.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faPalette} className="text-xl text-teal-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {type.id ? `ID: ${type.id.substring(0, 6)}...` : 'ID: -'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingType(type);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors"
                          title="Edit tipe variant"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-md transition-colors"
                          title="Hapus tipe variant"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FontAwesomeIcon icon={faShirt} className="text-sm text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Digunakan pada {type.product_count || 0} produk
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Terakhir diperbarui: {new Date(type.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {type.products && type.products.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs uppercase text-gray-500 mb-3 font-medium">Produk yang menggunakan tipe ini:</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {type.products.slice(0, 8).map(product => (
                              <div key={product.id} className="group relative">
                                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                  {product.image_url ? (
                                    <img 
                                      src={product.image_url} 
                                      alt={product.name} 
                                      className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <FontAwesomeIcon icon={faShirt} className="text-gray-400 text-2xl" />
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                </div>
                              </div>
                            ))}
                            {type.product_count && type.product_count > 8 && (
                              <div className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">+{type.product_count - 8} lainnya</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">Dibuat oleh:</span>
                        {type.created_by ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-6 w-6 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                              {type.created_by.image_url ? (
                                <img src={type.created_by.image_url} alt="Admin" className="h-full w-full object-cover" />
                              ) : (
                                <svg className="h-4 w-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="ml-2 text-gray-900 font-medium">{type.created_by.username}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingType ? 'Edit Tipe Variant' : 'Tambah Tipe Variant Baru'}
            </h2>
            
            <form onSubmit={editingType ? handleUpdateType : handleAddType}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Tipe Variant
                  </label>
                  <input
                    id="typeName"
                    type="text"
                    value={editingType ? editingType.name : newTypeName}
                    onChange={(e) => 
                      editingType 
                        ? setEditingType({...editingType, name: e.target.value})
                        : setNewTypeName(e.target.value)
                    }
                    placeholder="Contoh: Warna, Ukuran, Pola"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    disabled={loading}
                    required
                  />
                </div>

                {editingType && (
                  <>
                    <div>
                      <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 mb-1">
                        ID Tipe Variant
                      </label>
                      <input
                        id="typeId"
                        type="text"
                        value={editingType.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">ID tidak dapat diubah</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dibuat Oleh
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                          {editingType.created_by?.image_url ? (
                            <img 
                              src={editingType.created_by.image_url} 
                              alt={editingType.created_by.username} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <svg className="h-4 w-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-900">
                          {editingType.created_by?.username || '-'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Dibuat
                      </label>
                      <p className="text-sm text-gray-900">
                        {new Date(editingType.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jumlah Produk
                      </label>
                      <p className="text-sm text-gray-900">
                        {editingType.product_count || 0} produk
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingType(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:bg-teal-300"
                  disabled={loading || (editingType ? !editingType.name.trim() : !newTypeName.trim())}
                >
                  {editingType ? 'Simpan Perubahan' : 'Tambah Tipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 