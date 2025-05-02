"use client";
import { useEffect, useState } from "react";
import { Lora } from "next/font/google";
import NavbarAdmin from "@/components/NavbarAdmin";
import supabase from "@/utils/supabase/client"; // Supabase client masih diperlukan untuk fetch status admin
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faTag, 
  faUsers, 
  faChartLine, 
  faCircleCheck,
  faGaugeHigh,
  faAngleRight
} from '@fortawesome/free-solid-svg-icons';

const LoraFontBold = Lora({
  weight: "400",
  subsets: ["latin"],
});

// Definisi admin untuk cek status superadmin
interface Admin {
    id: string;
    username: string;
    is_superadmin: boolean;
}

// Definisi interface untuk statistik yang akan diterima dari API
interface DashboardStats {
  productCount: number | null;
  categoryCount: number | null;
  adminCount: number | null;
  showAdminCount?: boolean;
}

export default function AdminDashboard() {
  // Mengelola state admin yang sedang login
  const [admin, setAdmin] = useState<Admin | null>(null);
  // State untuk menyimpan data statistik
  const [stats, setStats] = useState<DashboardStats>({ 
    productCount: null, 
    categoryCount: null, 
    adminCount: null
  });
  
  // State untuk indikator loading
  const [isLoading, setIsLoading] = useState(true);
  // State untuk menyimpan pesan error jika ada
  const [statsError, setStatsError] = useState<string | null>(null);
  // State untuk animasi header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  // Hook router untuk navigasi
  const router = useRouter();

  // Helper function untuk mendapatkan ID admin dari localStorage
  const getAdminId = () => localStorage.getItem("adminId");

  // Effect hook untuk memuat data saat komponen dimuat
  useEffect(() => {
    // Periksa apakah admin_id ada untuk basic authentication check
    const loggedInAdminId = getAdminId();
    if (!loggedInAdminId) {
      router.push("/admin/login"); // Redirect jika tidak ada adminId
      return; // Hentikan eksekusi effect lebih lanjut
    }

    // Fetch data admin untuk mendapatkan status superadmin
    const fetchAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('id, username, is_superadmin')
          .eq('id', loggedInAdminId)
          .single();

        // Jika ada error atau data tidak valid, anggap sesi tidak berlaku
        if (error || !data) {
          console.error("Failed to fetch logged in admin status:", error);
          localStorage.removeItem("adminId"); // Bersihkan adminId yang mungkin invalid
          router.push("/admin/login"); // Redirect ke login
          return null; // Kembalikan null untuk menandakan gagal fetch status
        }
        setAdmin(data); // Set state admin
        return data; // Kembalikan data admin yang berhasil diambil

      } catch (err) {
        console.error("Error fetching logged in admin status:", err);
        setStatsError("Gagal memuat status admin."); // Set pesan error UI
        return null;
      }
    };

    // Fungsi asinkron untuk memuat semua data dashboard
    const fetchData = async () => {
      // Ambil status admin terlebih dahulu
      const currentAdmin = await fetchAdminStatus();
      // Jika gagal mendapatkan status admin, hentikan fetching data lain
      if(!currentAdmin) {
        setIsLoading(false); // Hentikan indikator loading stats
        return;
      }

      // Fetch statistik dashboard
      setIsLoading(true); // Mulai loading stats
      setStatsError(null); // Bersihkan error sebelumnya

      try {
        // Panggil API route yang baru untuk statistik
        const statsRes = await fetch("/api/admin/stats", {
          headers: {
            // Kirim admin ID agar API bisa menyesuaikan response (misal: adminCount)
            'x-admin-id': currentAdmin.id
          }
        });

        // Cek jika response dari API tidak OK
        if (!statsRes.ok) {
          const errorData = await statsRes.json(); // Ambil error message dari response API
          console.error("Failed to fetch stats:", statsRes.status, errorData);
          setStatsError(errorData.error || "Gagal memuat statistik."); // Set error message dari API atau default
          
          // Handle case where adminCount is hidden by API for non-superadmins
          if (statsRes.status === 403 && !currentAdmin.is_superadmin) {
            console.log("Admin is not a superadmin, admin count is likely excluded by API.");
            setStatsError(null); // Hapus error umum jika issue hanya terkait adminCount hidden
            setStats({...stats, adminCount: null}); // Pastikan adminCount null di state
          }

          // Return agar tidak melanjutkan ke setStats di bawah jika fetch gagal total
          return;
        }

        // Jika response OK, parse JSON data
        const statsData = await statsRes.json();
        
        // Set data from API
        setStats({
          productCount: statsData.productCount,
          categoryCount: statsData.categoryCount,
          adminCount: statsData.adminCount,
        });

      } catch (err: any) {
        // Tangani error jaringan atau parsing
        console.error("Network or parsing error fetching stats:", err);
        setStatsError(`Terjadi kesalahan jaringan: ${err.message}`); // Set error message jaringan
      } finally {
        // Set loading stats menjadi false setelah fetch selesai (baik sukses maupun gagal)
        setIsLoading(false);
      }
    };

    // Panggil fungsi fetchData untuk memulai proses pengambilan data
    fetchData();

    // Add scroll event listener for header animation
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsHeaderVisible(scrollPosition < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router]); // Dependensi effect hook pada 'router'

  return (
    <>
      <NavbarAdmin /> {/* Komponen Navbar */}
      {/* Wrapper untuk konten utama, menyesuaikan dengan tinggi navbar dan lebar sidebar */}
      <div className={`${LoraFontBold.className} pt-16 md:pl-64 min-h-screen bg-gray-50`}>
        {/* Hero section with animated background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMyLjIgMCA0IDEuOCA0IDRzLTEuOCA0LTQgNC00LTEuOC00LTQgMS44LTQgNC00em0wIDMyYzIuMiAwIDQgMS44IDQgNHMtMS44IDQtNCA0LTQtMS44LTQtNCAxLjgtNCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-center"></div>
          </div>

          <div className={`relative py-16 px-6 mx-auto max-w-5xl transition-all duration-500 ${isHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
                <p className="text-lg opacity-90 max-w-lg">
                  Selamat datang, {admin?.username || 'Admin'}! Lihat ringkasan aktivitas dan statistik toko Anda di sini.
                </p>
              </div>
              <div className="md:w-1/3 flex justify-center md:justify-end">
                <div className="w-44 h-44 relative flex items-center justify-center bg-white bg-opacity-20 rounded-full p-2">
                  <FontAwesomeIcon icon={faGaugeHigh} className="text-white text-6xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Key Metrics Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FontAwesomeIcon icon={faChartLine} className="mr-2 text-purple-600" />
              <span>Key Metrics</span>
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : statsError ? (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{statsError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Kartu Jumlah Produk */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-blue-500 group hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Jumlah Produk</p>
                      <h3 className="text-3xl font-bold text-gray-800">
                        {stats.productCount !== null ? stats.productCount : '-'}
                      </h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <FontAwesomeIcon icon={faBox} className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Produk aktif di sistem
                    </span>
                    <button 
                      onClick={() => router.push('/admin/products')}
                      className="text-blue-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center"
                    >
                      Lihat detail <FontAwesomeIcon icon={faAngleRight} className="ml-1 text-xs" />
                    </button>
                  </div>
                </div>
                
                {/* Kartu Jumlah Kategori */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-green-500 group hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Jumlah Kategori</p>
                      <h3 className="text-3xl font-bold text-gray-800">
                        {stats.categoryCount !== null ? stats.categoryCount : '-'}
                      </h3>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 group-hover:scale-110 transition-transform duration-300">
                      <FontAwesomeIcon icon={faTag} className="text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Kategori produk tersedia
                    </span>
                    <button 
                      onClick={() => router.push('/admin/categories')}
                      className="text-green-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center"
                    >
                      Lihat detail <FontAwesomeIcon icon={faAngleRight} className="ml-1 text-xs" />
                    </button>
                  </div>
                </div>
                 
                {/* Kartu Jumlah Admin (Hanya tampil jika admin adalah superadmin) */}
                {admin?.is_superadmin && (
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-purple-500 group hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Jumlah Admin</p>
                        <h3 className="text-3xl font-bold text-gray-800">
                          {stats.adminCount !== null ? stats.adminCount : '-'}
                        </h3>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg text-purple-600 group-hover:scale-110 transition-transform duration-300">
                        <FontAwesomeIcon icon={faUsers} className="text-xl" />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Admin aktif di sistem
                      </span>
                      <button 
                        onClick={() => router.push('/admin/admins')}
                        className="text-purple-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center"
                      >
                        Lihat detail <FontAwesomeIcon icon={faAngleRight} className="ml-1 text-xs" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Quick Action Cards */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FontAwesomeIcon icon={faCircleCheck} className="mr-2 text-green-600" />
              <span>Aksi Cepat</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => router.push('/admin/products')} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all hover:translate-y-[-4px] cursor-pointer p-6 border-b-2 border-blue-500">
                <div className="flex items-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4">
                    <FontAwesomeIcon icon={faBox} className="text-blue-600 text-lg" />
                  </div>
                  <h3 className="text-lg font-medium">Tambah Produk Baru</h3>
                </div>
                <p className="text-sm text-gray-500 pl-16">Tambahkan produk baru ke katalog anda</p>
              </div>
              
              <div onClick={() => router.push('/admin/categories')} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all hover:translate-y-[-4px] cursor-pointer p-6 border-b-2 border-green-500">
                <div className="flex items-center mb-3">
                  <div className="p-3 bg-green-100 rounded-xl mr-4">
                    <FontAwesomeIcon icon={faTag} className="text-green-600 text-lg" />
                  </div>
                  <h3 className="text-lg font-medium">Kelola Kategori</h3>
                </div>
                <p className="text-sm text-gray-500 pl-16">Atur dan tambahkan kategori produk</p>
              </div>
              
              {admin?.is_superadmin && (
                <div onClick={() => router.push('/admin/admins')} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all hover:translate-y-[-4px] cursor-pointer p-6 border-b-2 border-purple-500">
                  <div className="flex items-center mb-3">
                    <div className="p-3 bg-purple-100 rounded-xl mr-4">
                      <FontAwesomeIcon icon={faUsers} className="text-purple-600 text-lg" />
                    </div>
                    <h3 className="text-lg font-medium">Kelola Admin</h3>
                  </div>
                  <p className="text-sm text-gray-500 pl-16">Tambah atau atur akses admin</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}