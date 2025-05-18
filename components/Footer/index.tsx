import { useEffect, useState } from 'react';
import Image from 'next/image';
import InstagramIcon from '@/public/img/instagram.png';
import Link from 'next/link';

// Define the section type
type FooterSection = 'about' | 'help' | 'contact';

export default function EnhancedFooter() {
  // State for accordion functionality on mobile
  const [openSection, setOpenSection] = useState<FooterSection | null>(null);
  // State to track if viewport is mobile size
  const [isMobile, setIsMobile] = useState(false);
  
  // Toggle section visibility for mobile accordion
  const toggleSection = (section: FooterSection) => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    // This runs only on the client after component mounts
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Get in touch section */}
          <div className="border-b md:border-0 pb-4 md:pb-0">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => toggleSection('contact')}
            >
              <h2 className="text-lg font-semibold text-gray-800">Hubungi Kami</h2>
              <svg 
                className={`w-5 h-5 md:hidden transition-transform duration-300 ${openSection === 'contact' ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            <ul className={`mt-4 space-y-3 ${openSection === 'contact' || !isMobile ? 'block' : 'hidden md:block'}`}>
              {[
                {name: 'Kontak kami', link: '/contact'},
                {name: 'Lokasi toko', link: '/stores'}, 
                {name: 'Afiliasi', link: '/affiliate'}, 
                {name: 'Karir', link: '/careers'}, 
                {name: 'Media', link: '/press'}
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.link}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 inline-block border-b border-transparent hover:border-gray-900"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* About section */}
          <div className="border-b md:border-0 pb-4 md:pb-0">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => toggleSection('about')}
            >
              <h2 className="text-lg font-semibold text-gray-800">Tentang</h2>
              <svg 
                className={`w-5 h-5 md:hidden transition-transform duration-300 ${openSection === 'about' ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            <ul className={`mt-4 space-y-3 ${openSection === 'about' || !isMobile ? 'block' : 'hidden md:block'}`}>
              {[
                {name: 'Tentang kami', link: '/about'}, 
                {name: 'Keberlanjutan', link: '/sustainability'}, 
                {name: 'Nilai-nilai kami', link: '/values'}, 
                {name: 'Kebijakan Privasi', link: '/privacy'}
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.link}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 inline-block border-b border-transparent hover:border-gray-900"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Berlangganan newsletter kami</h2>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Berlangganan newsletter kami untuk mendapatkan informasi terbaru dan diskon 10% untuk pembelian berikutnya.
            </p>
            
            {/* Email input with button */}
            <div className="mt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Alamat email Anda"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 flex-grow"
                />
                <button className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors duration-200">
                  Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Social media and copyright section */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-6">
            {/* Copyright */}
            <div>
              <p className="text-sm text-gray-500">
                &copy; 2025 & Ecoute. Hak cipta dilindungi.
              </p>
            </div>
            
            {/* Social media links */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Ikuti kami:</span>
              <div className="flex space-x-4">
                {['instagram'].map((social) => (
                  <a 
                    key={social}
                    href={social === 'instagram' ? 'https://instagram.com/ecoute_id' : 'https://tiktok.com/@ecoute_id'}
                    className="text-gray-400 hover:text-gray-800 transition-colors duration-200"
                    aria-label={`Ikuti kami di ${social}`}
                  >
                    <div className="w-6 h-6 relative">
                      <Image 
                        src={InstagramIcon.src}
                        alt={social.charAt(0).toUpperCase() + social.slice(1)}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}