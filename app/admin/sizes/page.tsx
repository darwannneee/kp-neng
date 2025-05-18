"use client"
import { useEffect, useState } from 'react';
import NavbarAdmin from '@/components/NavbarAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faRulerCombined } from '@fortawesome/free-solid-svg-icons';

interface Size {
  id: string;
  size_id: string;
  created_at: string;
  created_by_id?: string;
  created_by?: {
    id: string;
    username: string;
    image_url?: string;
  };
}

export default function AdminSizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [newSizeId, setNewSizeId] = useState('');
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all sizes
  const fetchSizes = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const adminId = localStorage.getItem("adminId");
      const res = await fetch('/api/variant-sizes', {
        headers: {
          'x-admin-id': adminId || ''
        }
      });
      const data = await res.json();

      // Debug log: Check data received from API
      console.log('Fetched sizes data:', data);

      if (res.ok) {
        // Optional: Add validation if data structure is critical
        if (Array.isArray(data)) {
           // Map data to ensure created_at is treated as string if needed
          const processedData = data.map((item: any) => ({
            ...item,
            created_at: typeof item.created_at === 'string' ? item.created_at : '', // Ensure created_at is string
            created_by_id: typeof item.created_by_id === 'string' ? item.created_by_id : null // Ensure created_by_id is string or null
          }));
           console.log('Processed sizes data:', processedData);
          setSizes(processedData);
        } else {
           console.error("API returned non-array data:", data);
           setError('Format data dari server tidak sesuai.');
           setSizes([]);
        }
      } else {
        console.error("Failed to fetch sizes API error:", data.error);
        setError(data.error || 'Failed to fetch sizes');
        setSizes([]);
      }
    } catch (error) {
      console.error("Network or parsing error during fetchSizes:", error)
      setError('Terjadi kesalahan jaringan saat mengambil ukuran.');
      setSizes([])
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  // Add new size
  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const adminId = localStorage.getItem("adminId");
      const res = await fetch('/api/variant-sizes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId || ''
        },
        body: JSON.stringify({ size_id: newSizeId.trim() })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Size added successfully');
        setNewSizeId('');
        setIsModalOpen(false);
        fetchSizes();
      } else {
        setError(data.error || 'Failed to add size');
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
      setError('Failed to add size');
    } finally {
      setLoading(false);
    }
  };

  // Update size
  const handleUpdateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSize || !editingSize.size_id.trim() || !editingSize.id) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/variant-sizes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': localStorage.getItem("adminId") || ''
        },
        body: JSON.stringify({ 
          id: String(editingSize.id), 
          size_id: editingSize.size_id.trim() 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Size updated successfully');
        setEditingSize(null);
        fetchSizes();
      } else {
        setError(data.error || 'Failed to update size');
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
      setError('Failed to update size');
    } finally {
      setLoading(false);
    }
  };

  // Delete size
  const handleDeleteSize = async (id: string) => {
    if (!id || !confirm('Are you sure you want to delete this size?')) return;

    setLoading(true);
    setError(null);
    try {
      // Debug log
      console.log('Attempting to delete size with ID:', id);
      
      // Send ID in request body instead of URL params
      const res = await fetch('/api/variant-sizes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': localStorage.getItem("adminId") || ''
        },
        body: JSON.stringify({ id })
      });
      
      // Debug log
      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        setSuccess('Size deleted successfully');
        fetchSizes();
      } else {
        setError(data.error || 'Failed to delete size');
      }
    } catch (error) {
      console.error("Network or parsing error:", error)
      setError('Failed to delete size');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdmin />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
        </div>
        <div className="relative py-16 px-6 mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
              <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faRulerCombined} className="text-white text-3xl" />
                Kelola Ukuran Produk
              </h1>
              <p className="text-lg opacity-90 max-w-lg">
                Tambahkan, edit, dan hapus ukuran produk yang dapat dipilih pada varian produk.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingSize(null);
                    setNewSizeId('');
                    setIsModalOpen(true);
                  }}
                  className="bg-white text-blue-600 px-5 py-3 rounded-full font-medium hover:bg-opacity-90 shadow-md transition duration-200 flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Tambah Ukuran
                </button>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <div className="w-44 h-44 relative flex items-center justify-center bg-white bg-opacity-20 rounded-full p-2">
                <FontAwesomeIcon icon={faRulerCombined} className="text-white text-6xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* List of sizes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Ukuran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat Oleh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat Pada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && !sizes.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sizes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Tidak ada ukuran
                  </td>
                </tr>
              ) : (
                sizes.map((size) => (
                  <tr key={size.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {size.id.substring(0, 6)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {size.size_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.created_by ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            {size.created_by.image_url ? (
                              <img src={size.created_by.image_url} alt="Admin" className="h-full w-full object-cover" />
                            ) : (
                              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{size.created_by.username}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {size.created_at ? new Date(size.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingSize?.id === size.id ? (
                        <form onSubmit={handleUpdateSize} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editingSize.size_id}
                            onChange={(e) => setEditingSize({ ...editingSize, size_id: e.target.value })}
                            className="w-full px-2 py-1 border rounded"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            disabled={loading}
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSize(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                            disabled={loading}
                          >
                            Batal
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingSize(size);
                              setNewSizeId('');
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSize(size.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding new size */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Tambah Ukuran Baru</h2>
              <form onSubmit={handleAddSize} className="space-y-4">
                <input
                  type="text"
                  value={newSizeId}
                  onChange={(e) => setNewSizeId(e.target.value)}
                  placeholder="Masukkan nama ukuran (misal: S, M, L, XL, XXL)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                    disabled={loading || !newSizeId.trim()}
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" /> Tambah Ukuran
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 