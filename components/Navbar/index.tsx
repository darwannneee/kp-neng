"use client"
import Logo from "@/public/img/Logo Ecoute.png"
import { useState, useEffect } from "react"
import { Lora } from "next/font/google"
import Search from "@/public/img/search.png"

const LoraFont = Lora({
    weight: '400',
    subsets: ['latin']
})

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

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

    return (
        <nav className={`${LoraFont.className} w-full fixed z-50 ${isScrolled ? 'bg-white' : 'bg-transparent'}`}>
            <div className="flex flex-col gap-y-1 bg-gray-100">
                <h1 className="text-center text-xs">Sign up for our newsletter and get 10% off one order.</h1>
                <hr className="border-t-[0.2px] border-gray-300" />
            </div>
            <div className="w-full px-4 h-12 grid grid-cols-3 items-center sm:px-10">
                <div className="flex gap-x-5 justify-start sm:gap-x-5">
                    <button className="sm:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <div className={`sm:block ${isMenuOpen ? 'block' : 'hidden'} absolute sm:relative w-full sm:w-auto`}>
                        <ul className="flex flex-col sm:flex-row gap-y-2 sm:gap-x-5 text-sm">
                            <li className="hover:underline"><a href="#">Men</a></li>
                            <li className="hover:underline"><a href="#">Women</a></li>
                            <li className="hover:underline"><a href="#">Kids</a></li>
                            <li className="hover:underline"><a href="#">Discount</a></li>
                        </ul>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <img src={Logo.src} className="w-16" alt="Logo Ecoute" />
                </div>
                <div className="flex justify-end items-center">
                    <img src={Search.src} className="w-5" alt="Search Icon" />
                </div>
            </div>
        </nav>
    )
}