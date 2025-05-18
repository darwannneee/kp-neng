"use client"
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Lora, Montserrat } from "next/font/google";
import Footer from "@/components/Footer";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LoraFontBold = Lora({
  weight: '500',
  subsets: ['latin']
});
const MontserratFont = Montserrat({
  weight: '400',
  subsets: ['latin']
})

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  image_url: string;
  category_id: string;
  admin_id: string;
  admin?: {
    username: string;
    id: string;
    image_url?: string;
  };
}

interface Banner {
  id: string;
  type: 'header' | 'swimwear' | 'favorite_places';
  position: number;
  product_id: string;
  title?: string;
  subtitle?: string;
  custom_text?: string;
  product: {
    id: string;
    name: string;
    image_url: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Home() {
  const router = useRouter();
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchBanners();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products?include=admin");
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners");
      if (!res.ok) throw new Error("Failed to fetch banners");
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  useEffect(() => {
    const container = scrollContainer.current;
    if (container) {
      setMaxScroll(container.scrollWidth - container.clientWidth);
    }

    const handleResize = () => {
      if (container) {
        setMaxScroll(container.scrollWidth - container.clientWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [products]);

  const handleScrollUpdate = () => {
    if (scrollContainer.current) {
      setScrollPosition(scrollContainer.current.scrollLeft);
    }
  };

  const scrollPrev = () => {
    if (scrollContainer.current) {
      const newPosition = Math.max(scrollPosition - 300, 0);
      scrollContainer.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollNext = () => {
    if (scrollContainer.current) {
      const newPosition = Math.min(scrollPosition + 300, maxScroll);
      scrollContainer.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainer.current?.offsetLeft || 0));
    setScrollLeft(scrollContainer.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainer.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainer.current) {
      scrollContainer.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollContainer.current?.offsetLeft || 0));
    setScrollLeft(scrollContainer.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollContainer.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainer.current) {
      scrollContainer.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Get banners by type
  const getBannersByType = (type: string) => {
    return banners.filter(banner => banner.type === type);
  };

  return (
    // Menggunakan LoraFontBold sebagai default untuk body, bisa di-override per elemen
    <main className={`${LoraFontBold.className}`}>
      <Navbar />
      
      {/* Header Banner Hero (position 1) */}
      {(() => {
        const headerBanners = getBannersByType('header').sort((a, b) => a.position - b.position);
        const heroBanner = headerBanners.find(b => b.position === 1);
        const otherBanners = headerBanners.filter(b => b.position !== 1);
        return (
          <>
            {heroBanner && (
              <div
                key={heroBanner.id}
                className="w-full md:w-[100%] h-screen bg-cover flex flex-col justify-center gap-y-4 md:gap-y-7 items-center relative"
                style={{ backgroundImage: `url(\"${heroBanner.product.image_url}\")` }}
              >
                <h1 className={`${MontserratFont.className} text-white font-bold text-shadow-md`}>
                  {heroBanner.product.category?.name || 'CATEGORY NAME'}
                </h1>
                <h1 className="md:text-5xl text-xl text-white text-shadow-md">
                  {heroBanner.product.name || 'PRODUCT NAME'}
                </h1>
                <button 
                  className="w-40 py-2 bg-white text-black"
                  onClick={() => router.push(`/productdetails?id=${heroBanner.product.id}`)}
                >
                  Shop Now
                </button>
              </div>
            )}
            {/* Grid for position 2 & 3 */}
            {otherBanners.length > 0 && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2">
                {otherBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="h-80 h-screen bg-cover bg-center flex flex-col justify-center items-center relative"
                    style={{ backgroundImage: `url('${banner.product.image_url}')` }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                      <h1 className={`${MontserratFont.className} text-white font-bold text-shadow-md`}>
                        {heroBanner.product.category?.name || 'CATEGORY NAME'}
                      </h1>
                      <h1 className="md:text-5xl text-xl text-white text-shadow-md">
                              {banner.product.name || 'PRODUCT NAME'}
                      </h1> 
                      <button
                        className="w-32 py-2 mt-5 bg-white text-black"
                        onClick={() => router.push(`/productdetails?id=${banner.product.id}`)}
                      >
                        Shop Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      <div className="px-5 py-10 md:py-16 relative">
        {/* Section heading */}
        <h2 className="text-sm text-center md:text-left font-medium tracking-wider">FIND YOUR FAVOURITES</h2>
        <h2 className="text-3xl pt-1 text-center md:text-left font-medium">New arrivals</h2>
        
        {/* Navigation buttons */}
        <div className="flex justify-end mb-4 mt-2 space-x-2">
          <button 
            onClick={scrollPrev}
            disabled={scrollPosition <= 0}
            className={`p-2 border rounded-full ${scrollPosition <= 0 ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={scrollNext}
            disabled={scrollPosition >= maxScroll}
            className={`p-2 border rounded-full ${scrollPosition >= maxScroll ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        
        {/* Carousel container */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[420px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div 
            ref={scrollContainer}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-x-6"
            style={{ scrollBehavior: 'smooth', cursor: isDragging ? 'grabbing' : 'grab'}}
            onScroll={handleScrollUpdate}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-none w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 snap-start cursor-pointer"
                onClick={() => router.push(`/productdetails/${product.id}`)}
              >
                <div className="group relative">
                  <div className="w-full overflow-hidden bg-gray-200 lg:aspect-none group-hover:opacity-75 h-[420px] relative">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex flex-col h-[100px] justify-between">
                    <h3 className="text-gray-700 font-bold text-md truncate w-full">
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </h3>
                    <div className="flex flex-col">
                      <p className="text-gray-500 line-clamp-2 overflow-hidden break-words text-xs">
                        {product.description}
                      </p>
                      <p className="font-medium text-gray-900 text-sm pt-2">
                        Rp {product.price}
                      </p>
                    </div> 
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Mobile indicator */}
        <div className="mt-6 flex justify-center space-x-2">
          {products.map((_, index) => (
            <div 
              key={index} 
              className={`h-1 rounded-full ${
                Math.floor(scrollPosition / (maxScroll / products.length)) === index 
                  ? 'w-4 bg-gray-800' 
                  : 'w-1 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="py-10">
          <a href="http://localhost:3000/products">
            <button className="block mx-auto px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition">View More</button>
          </a>
        </div>
      </div>

      {/* Products Section */}
      <div className="w-full px-4 sm:px-8 md:px-20 lg:px-32 xl:px-52 py-12">
        {/* Two side-by-side images container */}
        <div className="w-full flex flex-col md:flex-row">
          {getBannersByType('swimwear').map((banner, index) => (
            <div 
              key={banner.id}
              className="w-full md:w-1/2 relative group cursor-pointer overflow-hidden"
              onMouseEnter={() => setHoveredItem(index + 1)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div 
                className="h-[300px] md:h-[500px] lg:h-[600px] bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-105"
                style={{ backgroundImage: `url("${banner.product.image_url}")` }}
              />
              
              {/* Hover overlay with button */}
              <div className={`absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                <button 
                  className="px-6 py-3 bg-white text-gray-900 font-medium shadow-md hover:bg-gray-100 transition-all"
                  onClick={() => router.push(`/productdetails?id=${banner.product.id}`)}
                >
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Text content below images */}
        <div className="mt-6 md:mt-8">
          <h2 className="text-sm font-medium tracking-wider uppercase">
            THIS JUST IN
          </h2>
          <h1 className="text-3xl md:text-4xl font-medium mt-2">
            Swimwear
          </h1>
          <button className="mt-2 text-base font-medium hover:underline">
            SHOP NOW
          </button>
        </div>
      </div>

      {/* Favorite Places Section */}
      <div className="px-5 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Section heading - centered */}
          <h2 className="text-sm font-medium tracking-wider text-center uppercase">
            FIND YOUR FAVORITES
          </h2>
          <h2 className="text-3xl md:text-4xl pt-1 font-medium text-center mb-8">
            Favorite Places
          </h2>
          
          {/* Two products in a centered layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {getBannersByType('favorite_places').map((banner) => (
              <div 
                key={banner.id} 
                className="group relative transition-all duration-300 ease-in-out"
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className={`overflow-hidden shadow-sm transition-transform duration-500 ${
                    hoveredItem === banner.id ? 'transform scale-[1.02]' : ''
                  }`}
                >
                  <div className="relative h-72 sm:h-80 md:h-96 w-full">
                    <Image
                      src={banner.product.image_url}
                      alt={banner.title || ''}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                    
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
                    
                    {/* Place details positioned at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl md:text-2xl font-semibold">
                        {banner.title}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-medium">{banner.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hidden button that appears on hover */}
                <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  <button 
                    className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-md hover:bg-gray-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                    onClick={() => router.push(`/productdetails?id=${banner.product.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* View more button with refined styling */}
          <div className="mt-12 text-center">
            <button className="block mx-auto px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition">
              Explore All Destinations
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}