"use client";
import { useEffect, useState } from "react";
import { Lora } from "next/font/google";
import NavbarAdmin from "@/components/NavbarAdmin";
import supabase from "@/utils/supabase/client"; // Impor supabase client
import { useRouter } from "next/navigation";
import Image from "next/image";

const LoraFontBold = Lora({
  weight: "400",
  subsets: ["latin"],
});

interface Admin {
  id: string;
  username: string;
  email: string;
  image_url: string | null;
  is_superadmin: boolean;
  created_at: string;
}

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    image: null as File | null,
    existingImage: "",
    is_superadmin: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if the current admin is a superadmin
  const [isCurrentAdminSuperadmin, setIsCurrentAdminSuperadmin] = useState(false);

  useEffect(() => {
    const checkSuperadmin = async () => {
      const adminId = localStorage.getItem("adminId");
      if (!adminId) {
        router.push("/admin/login"); // Redirect if not logged in
        return;
      }

      try {
        const { data, error } = await supabase
          .from("admins")
          .select("is_superadmin")
          .eq("id", adminId)
          .single();

        if (error || !data || !data.is_superadmin) {
          // If not a superadmin, redirect to dashboard or show error
          alert("Anda tidak memiliki akses untuk mengelola admin.");
          router.push("/admin/dashboard"); // Redirect to a different page
          return;
        }
        setIsCurrentAdminSuperadmin(true);
        fetchAdmins(); // Fetch admins only if superadmin
      } catch (err) {
        console.error("Error checking superadmin status:", err);
        router.push("/admin/dashboard"); // Redirect on error
      }
    };

    if (typeof window !== "undefined") {
      checkSuperadmin();
    }
  }, [router]);


  const fetchAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // We'll fetch directly using supabase for simplicity here
      const { data, error } = await supabase.from("admins").select("*");

      if (error) {
        console.error("Failed to fetch admins:", error);
        setError("Gagal mengambil data admin.");
        setAdmins([]);
      } else if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        console.error("Expected array but got:", data);
        setAdmins([]);
        setError("Format data admin tidak sesuai.");
      }
    } catch (err) {
      console.error("Network or parsing error while fetching admins:", err);
      setError("Terjadi kesalahan jaringan atau parsing.");
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, files, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "file"
          ? files?.[0] || null
          : type === "checkbox"
          ? checked
          : value,
      existingImage: name === "image" ? prev.existingImage : prev.existingImage,
    }));
    // Clear validation error for the current field if any
    if (error && error.includes(name)) {
        setError(null);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (!isCurrentAdminSuperadmin) {
      alert("Anda tidak memiliki izin untuk melakukan aksi ini.");
      return;
    }

    // Basic validation (can be expanded)
    if (!formData.username || !formData.email || (!editingAdmin && !formData.password)) {
        setError("Username, Email, dan Password (untuk admin baru) wajib diisi.");
        return;
    }

    // Prepare data for API
    const dataToSend = new FormData();
    dataToSend.append("username", formData.username);
    dataToSend.append("email", formData.email);
    if (formData.password && formData.password.length > 0) { // Only send password if it's not empty (allows updating other fields without changing password)
        dataToSend.append("password", formData.password);
    }
    dataToSend.append("is_superadmin", String(formData.is_superadmin));

    if (formData.image) {
      dataToSend.append("image", formData.image);
    } else if (editingAdmin && formData.existingImage) {
      // Send existing image URL if no new image is uploaded and we are editing
      dataToSend.append("existingImage", formData.existingImage);
    }


    const method = editingAdmin ? "PUT" : "POST";
    const url = editingAdmin
      ? `/api/admin/admins/${editingAdmin.id}`
      : "/api/admin/admins/add";

    try {
      const res = await fetch(url, {
        method,
        body: dataToSend,
      });

      const result = await res.json();

      if (res.ok) {
        fetchAdmins(); // Refresh the list
        setIsModalOpen(false);
        setFormData({
          username: "",
          email: "",
          password: "",
          image: null,
          existingImage: "",
          is_superadmin: false,
        });
        setEditingAdmin(null); // Clear editing state
      } else {
         // Handle API errors (e.g., email already exists)
         setError(result.error || `Gagal ${editingAdmin ? "mengupdate" : "menambah"} admin. Status: ${res.status}`);
      }
    } catch (err: any) {
       console.error("Submission error:", err);
       setError(`Terjadi kesalahan: ${err.message}`);
    }
  };

  const handleEdit = (admin: Admin) => {
    if (!isCurrentAdminSuperadmin) {
        alert("Anda tidak memiliki izin untuk melakukan aksi ini.");
        return;
    }
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email,
      password: "", // Don't pre-fill password for security
      image: null,
      existingImage: admin.image_url || "",
      is_superadmin: admin.is_superadmin,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isCurrentAdminSuperadmin) {
        alert("Anda tidak memiliki izin untuk melakukan aksi ini.");
        return;
    }
     // Prevent superadmin from deleting themselves
     const currentAdminId = localStorage.getItem("adminId")
     if (id === currentAdminId) {
         alert("Anda tidak bisa menghapus akun admin Anda sendiri.");
         return;
     }

    if (confirm("Hapus admin ini?")) {
        setError(null);
        try {
          const url = `/api/admin/admins/${id}`;
          const res = await fetch(url, { method: "DELETE" });

          if (res.ok) {
            fetchAdmins(); // Refresh the list
          } else {
              const result = await res.json();
              setError(result.error || `Gagal menghapus admin. Status: ${res.status}`);
          }
      } catch (err: any) {
          console.error("Deletion error:", err);
          setError(`Terjadi kesalahan saat menghapus: ${err.message}`);
      }
    }
  };

  if (!isCurrentAdminSuperadmin && !isLoading) {
      return (
        <>
           <NavbarAdmin />
            <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50 flex items-center justify-center`}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Akses ditolak</h1>
                    <p className="text-gray-600">Anda tidak memiliki izin untuk melihat halaman ini.</p>
                </div>
            </div>
        </>
      );
  }


  return (
    <>
      <NavbarAdmin />
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold">Kelola Admin</h1>
            <button
              onClick={() => {
                setEditingAdmin(null);
                setFormData({
                  username: "",
                  email: "",
                  password: "",
                  image: null,
                  existingImage: "",
                  is_superadmin: false,
                });
                setIsModalOpen(true);
                setError(null);
              }}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Tambah Admin Baru
            </button>
          </div>

          {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
              </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <p>Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">Belum ada admin. Silakan tambahkan admin baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Foto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Superadmin
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
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {admin.id.substring(0, 6)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden border">
                                {admin.image_url ? (
                                    <Image 
                                        src={admin.image_url}
                                        alt={admin.username}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                        {admin.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {admin.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.email}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {/* Admin cannot downgrade themselves */}
                            {admin.is_superadmin ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ya</span>
                            ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Tidak</span>
                            )}
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {/* Format timestamp if needed */}
                            {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                                onClick={() => handleEdit(admin)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                                Edit
                            </button>
                             {/* Disable delete if it's the current admin */}
                            <button
                                onClick={() => handleDelete(admin.id)}
                                className={`text-red-600 hover:text-red-900 ${localStorage.getItem("adminId") === admin.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={localStorage.getItem("adminId") === admin.id}
                            >
                                Hapus
                            </button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingAdmin ? "Edit Admin" : "Tambah Admin Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
              </div>
           )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 focus:ring-1 focus:ring-black focus:border-black"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 focus:ring-1 focus:ring-black focus:border-black"
                  required
                />
              </div>
              <div className="mb-4">
                 <label htmlFor="password" className="block text-sm font-medium mb-1">Password {editingAdmin && <span className="text-gray-500 text-xs">(Kosongkan jika tidak diubah)</span>}</label>
                 <input
                   id="password"
                   type="password"
                   name="password"
                   value={formData.password}
                   onChange={handleInputChange}
                   className="w-full border rounded-md p-2 focus:ring-1 focus:ring-black focus:border-black"
                   required={!editingAdmin} // Password is required for new admin
                 />
               </div>

              <div className="mb-4">
                <label htmlFor="image" className="block text-sm font-medium mb-1">Foto Profil (Opsional)</label>
                <input
                  id="image"
                  type="file"
                  name="image"
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2"
                  accept="image/*"
                />
                {formData.existingImage && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Gambar saat ini:</p>
                    {/* Use img tag instead of Image component for external URLs without next.config.js config */}
                    {/* If you have configured image domains in next.config.js, you can use Image */}
                    <img
                       src={formData.existingImage}
                       alt="Current admin image"
                       className="h-16 w-16 object-cover rounded-full border"
                    />
                  </div>
                )}
              </div>

              {editingAdmin && editingAdmin.id !== localStorage.getItem("adminId") && ( // Prevent superadmin from changing their own status via this form
                 <div className="mb-4 flex items-center">
                     <input
                         id="is_superadmin"
                         type="checkbox"
                         name="is_superadmin"
                         checked={formData.is_superadmin}
                         onChange={handleInputChange}
                         className="mr-2 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                     />
                     <label htmlFor="is_superadmin" className="block text-sm font-medium">Jadikan Superadmin</label>
                 </div>
              )}


              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {setIsModalOpen(false); setError(null);}} // Clear error on close
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  {editingAdmin ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}