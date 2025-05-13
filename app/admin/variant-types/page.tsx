"use client"
import { useEffect, useState } from 'react';
import NavbarAdmin from '@/components/NavbarAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';

interface VariantType {
  id: string;
  name: string;
}

export default function AdminVariantTypes() {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<VariantType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all variant types
  const fetchVariantTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/variant-types');
      const data = await res.json();
      if (res.ok) {
        setVariantTypes(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch variant types');
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
      const res = await fetch('/api/variant-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim() })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Variant type added successfully');
        setNewTypeName('');
        fetchVariantTypes();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to add variant type');
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
      const res = await fetch('/api/variant-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingType.id, name: editingType.name.trim() })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Variant type updated successfully');
        setEditingType(null);
        fetchVariantTypes();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update variant type');
    } finally {
      setLoading(false);
    }
  };

  // Delete variant type
  const handleDeleteType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant type?')) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/variant-types?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Variant type deleted successfully');
        fetchVariantTypes();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete variant type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarAdmin />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Variant Types</h1>

        {/* Add new variant type form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Variant Type</h2>
          <form onSubmit={handleAddType} className="flex gap-4">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Enter variant type name (e.g., Color, Pattern)"
              className="flex-1 px-4 py-2 border rounded"
              disabled={loading}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading || !newTypeName.trim()}
            >
              Add Type
            </button>
          </form>
        </div>

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

        {/* List of variant types */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variantTypes.map((type) => (
                <tr key={type.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingType?.id === type.id ? (
                      <input
                        type="text"
                        value={editingType.name}
                        onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    ) : (
                      type.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingType?.id === type.id ? (
                      <>
                        <button
                          onClick={handleUpdateType}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingType(null)}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingType(type)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {variantTypes.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                    No variant types found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 