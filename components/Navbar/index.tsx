"use client"
import Logo from "@/public/img/Logo Ecoute.png"
import { useState, useEffect } from "react"
import { Lora } from "next/font/google"
import Search from "@/public/img/search.png"
import Image from "next/image"
import Link from "next/link"

const LoraFont = Lora({
    weight: '400',
    subsets: ['latin']
})

interface Category {
    id: string;
    name: string;
}

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        // Fetch categories from API
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/admin/categories');
                if (!res.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCategories();
    }, []);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <nav className={`${LoraFont.className} w-full fixed z-50 ${isScrolled ? 'bg-white' : 'bg-transparent'}`}>
            <div className="flex flex-col gap-y-1 bg-gray-100">
                <h1 className="text-center text-xs">Daftar untuk newsletter kami dan dapatkan diskon 10% untuk pembelian pertama.</h1>
                <hr className="border-t-[0.2px] border-gray-300" />
            </div>
            <div className="w-full px-4 h-12 grid grid-cols-3 items-center sm:px-10">
                <div className="flex gap-x-5 justify-start sm:gap-x-5">
                    <button className="sm:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <div className={`sm:flex ${isMenuOpen ? 'block' : 'hidden'} absolute sm:relative top-12 left-0 sm:top-0 bg-white sm:bg-transparent w-full sm:w-auto shadow-md sm:shadow-none z-50`}>
                        <ul className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-8 text-sm p-3 sm:p-0">
                            {isLoading ? (
                                <li className="text-gray-400">Loading...</li>
                            ) : categories.length > 0 ? (
                                categories.map(category => (
                                    <li key={category.id} className="hover:underline">
                                        <Link href={`/products?category=${category.id}`}>
                                            {category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase()}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li className="hover:underline"><Link href="/products?category=pria">Pria</Link></li>
                                    <li className="hover:underline"><Link href="/products?category=wanita">Wanita</Link></li>
                                    <li className="hover:underline"><Link href="/products?category=anak">Anak</Link></li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <Link href="/">
                        <Image src={Logo} alt="Logo Ecoute" width={64} height={24} className="w-16" />
                    </Link>
                </div>
                <div className="flex justify-end items-center gap-3">
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="relative"
                    >
                        <Image src={Search} alt="Cari" width={20} height={20} />
                    </button>
                    
                    {isSearchOpen && (
                        <form onSubmit={handleSearch} className="absolute top-12 right-4 sm:right-10 bg-white shadow-md p-2 rounded">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="border rounded px-2 py-1 text-sm focus:outline-none"
                            />
                            <button 
                                type="submit"
                                className="ml-1 text-sm text-blue-600"
                            >
                                Cari
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </nav>
    )
}