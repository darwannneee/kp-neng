"use client"

import { useEffect, useState } from 'react';
import NavbarAdmin from '@/components/NavbarAdmin';

interface Size {
  id: string;
  name: string;
}

export default function AdminVariantSizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [newSize, setNewSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSizes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/variant-sizes');
      const data = await res.json();
      if (res.ok) setSizes(data);
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
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newSize.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/variant-sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSize.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Ukuran berhasil ditambahkan');
        setNewSize('');
        fetchSizes();
      } else {
        setError(data.error || 'Gagal menambah ukuran');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus ukuran ini?')) return;
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
      <div className="pt-16 md:pl-64 min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold mb-6">Manajemen Ukuran Produk</h1>
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSize(e.target.value)}
              placeholder="Nama ukuran (misal: S, M, L, XL)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              disabled={loading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              disabled={loading || !newSize.trim()}
            >
              Tambah
            </button>
          </form>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          {success && <div className="mb-4 text-green-600">{success}</div>}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Daftar Ukuran</h2>
            {loading ? (
              <div>Loading...</div>
            ) : sizes.length === 0 ? (
              <div className="text-gray-500">Belum ada ukuran.</div>
            ) : (
              <ul>
                {sizes.map(size => (
                  <li key={size.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span>{size.name}</span>
                    <button
                      onClick={() => handleDelete(size.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={loading}
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 