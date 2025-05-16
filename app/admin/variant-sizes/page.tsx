"use client"

import { useEffect, useState } from 'react';
import { Lora } from "next/font/google";
import NavbarAdmin from '@/components/NavbarAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRuler, 
  faPlus, 
  faPenToSquare, 
  faTrash, 
  faSearch
} from '@fortawesome/free-solid-svg-icons';

const LoraFontBold = Lora({
  weight: "400",
  subsets: ["latin"],
});

interface Size {
  id: string;
  name: string;
  created_at?: string;
}

export default function AdminVariantSizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [filteredSizes, setFilteredSizes] = useState<Size[]>([]);
  const [newSize, setNewSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const fetchSizes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/variant-sizes');
      const data = await res.json();
      if (res.ok) {
        setSizes(data);
        setFilteredSizes(data);
      }
      else setError(data.error || 'Gagal memuat data ukuran');
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
    
    // Add scroll event listener for header animation
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsHeaderVisible(scrollPosition < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter sizes when search term changes
  useEffect(() => {
    if (sizes.length) {
      if (searchTerm) {
        const filtered = sizes.filter(size => 
          size.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSizes(filtered);
      } else {
        setFilteredSizes(sizes);
      }
    }
  }, [searchTerm, sizes]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newSize.trim()) {
      setError("Nama ukuran wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/variant-sizes', {
        method: editingSize ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingSize?.id,
          name: newSize.trim() 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Ukuran berhasil ${editingSize ? 'diperbarui' : 'ditambahkan'}`);
        setNewSize('');
        setIsModalOpen(false);
        setEditingSize(null);
        fetchSizes();
      } else {
        setError(data.error || `Gagal ${editingSize ? 'memperbarui' : 'menambah'} ukuran`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (size: Size) => {
    setEditingSize(size);
    setNewSize(size.name);
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus ukuran ini? Ukuran yang sudah digunakan pada produk tidak dapat dihapus.')) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/api/variant-sizes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Ukuran berhasil dihapus');
        fetchSizes();
      } else {
        setError(data.error || 'Gagal menghapus ukuran');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarAdmin />
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section with animated background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>

          <div className={`relative py-16 px-6 mx-auto max-w-5xl transition-all duration-500 ${isHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                <h1 className="text-4xl font-bold mb-4">Kelola Ukuran Produk</h1>
                <p className="text-lg opacity-90 max-w-lg">
                  Atur dan kelola ukuran produk untuk setiap varian yang tersedia dalam toko Anda.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setEditingSize(null);
                      setNewSize("");
                      setIsModalOpen(true);
                      setError(null);
                    }}
                    className="bg-white text-amber-600 px-5 py-3 rounded-full font-medium hover:bg-opacity-90 shadow-md transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Tambah Ukuran Baru
                  </button>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center md:justify-end">
                <div className="w-44 h-44 relative flex items-center justify-center bg-white bg-opacity-20 rounded-full p-2">
                  <FontAwesomeIcon icon={faRuler} className="text-white text-6xl" />
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
                placeholder="Cari ukuran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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

          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : filteredSizes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-amber-100 rounded-full text-amber-600">
                <FontAwesomeIcon icon={faRuler} className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tidak ada ukuran</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm ? 
                  "Tidak ada ukuran yang sesuai dengan pencarian Anda." : 
                  "Belum ada ukuran yang ditambahkan. Silakan tambahkan ukuran baru."}
              </p>
              <button
                onClick={() => {
                  setEditingSize(null);
                  setNewSize("");
                  setIsModalOpen(true);
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Tambah Ukuran
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
                        Nama Ukuran
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSizes.map((size) => (
                      <tr key={size.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{size.id.substring(0, 6)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faRuler} className="text-amber-600 text-xs" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{size.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(size)}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-md transition-colors"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              onClick={() => handleDelete(size.id)}
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

      {/* Modal for adding/editing size */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingSize ? "Edit Ukuran" : "Tambah Ukuran Baru"}
              </h2>
              <form onSubmit={handleAdd}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Ukuran
                  </label>
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="Contoh: S, M, L, XL, 38, 40, 42"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                    disabled={loading || !newSize.trim()}
                  >
                    {editingSize ? "Simpan Perubahan" : "Tambah Ukuran"}
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