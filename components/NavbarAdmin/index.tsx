'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";
// Import logo
import Logo from "@/public/img/Logo Ecoute.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faBox, 
  faTag, 
  faUsers, 
  faRightFromBracket, 
  faBars,
  faChartPie,
  faGear
} from '@fortawesome/free-solid-svg-icons';

interface Admin {
  id: string;
  username: string;
  email: string;
  image_url: string;
  is_superadmin: boolean;
}

export default function NavbarAdmin() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if running in browser environment
    if (typeof window !== 'undefined') {
      const checkAuth = async () => {
        const adminId = localStorage.getItem("adminId");
        if (!adminId) {
          router.push("/admin/login");
          return;
        }

        try {
          // Select is_superadmin property
          const { data, error } = await supabase
            .from("admins")
            .select("*, is_superadmin")
            .eq("id", adminId)
            .single();

          if (error) {
            console.error("Failed to fetch admin data:", error);
            localStorage.removeItem("adminId");
            router.push("/admin/login");
            return;
          }
          setAdmin(data);
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setLoading(false);
        }
      };
      checkAuth();
    }
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="fixed top-0 left-0 w-full h-16 bg-white shadow-sm z-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">Loading admin info...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="fixed top-0 left-0 w-full h-16 bg-white shadow-sm z-50 flex items-center justify-center">
        <span className="text-gray-600">Not logged in</span>
      </div>
    );
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-sm z-40 h-16">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src={Logo}
                  alt="Ecoute Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-semibold hidden md:block">Ecoute Admin</span>
            </div>
          </div>
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <span className="text-sm sm:inline font-medium">{admin.username}</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm">
              {admin.image_url ? (
                <Image
                  src={admin.image_url}
                  alt={admin.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-full h-full flex items-center justify-center text-white">
                  {admin.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation - Overlay on mobile, fixed on desktop */}
      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white shadow-md transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <nav className="p-4 h-full flex flex-col">
          <div className="space-y-1 flex-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600">
                <FontAwesomeIcon icon={faChartPie} className="w-4 h-4" />
              </div>
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
              </div>
              <span className="font-medium">Products</span>
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600">
                <FontAwesomeIcon icon={faTag} className="w-4 h-4" />
              </div>
              <span className="font-medium">Categories</span>
            </Link>

            {/* Admin section only if superadmin */}
            {admin.is_superadmin && (
              <div>
                <div className="px-4 py-2 mt-4 text-xs font-semibold uppercase text-gray-500">Admin Management</div>
                <Link
                  href="/admin/admins"
                  className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Admins</span>
                </Link>
              </div>
            )}

            <div className="px-4 py-2 mt-4 text-xs font-semibold uppercase text-gray-500">System</div>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600">
                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
              </div>
              <span className="font-medium">Settings</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem("adminId");
                router.push("/admin/login");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-red-100 text-red-600">
                <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
              </div>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}