"use client"
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Lora, Lacquer, Montserrat } from "next/font/google";
import Footer from "@/components/Footer";
import { useEffect, useRef, useState } from "react";
// Import icon if you want to add the heart icon
// import { HeartIcon } from '@heroicons/react/24/outline'; // Example using Heroicons

const LoraFontBold = Lora({
  weight: '500',
  subsets: ['latin']
});
const LacquerFont = Lacquer({
  weight: '400',
  subsets: ['latin']
});
const MontserratFont = Montserrat({
  weight: '400',
  subsets: ['latin']
})

// --- Define Product Data ---
// In a real application, this data would likely come from an API
const newProducts = [
  {
    id: 1,
    name: 'Ruffle Maxi Dress',
    colours: 2,
    price: '$179',
    image: 'https://www.stories.com/static-images/products/assets/005/09/36/0936c4ae2e3335be1ae01edbb474ff5ce09b4a0a_xxl-1.jpg?imwidth=2560', // Example image URL structure from the site
  },
  {
    id: 2,
    name: 'Buckled Strappy Slingback Ballerinas',
    colours: 2,
    price: '$159',
    image: 'https://www.stories.com/static-images/products/assets/005/3c/49/3c49cabc773d6ba0336bbf92ac0c114ef0952e07_xxl-1.jpg?imwidth=2560',
  },
  {
    id: 3,
    name: 'Draped Sleeveless Midi Dress',
    colours: 3,
    price: '$99',
    image: 'https://www.stories.com/static-images/products/assets/005/a6/26/a626ef5f8cdc902ff2fd1e373fc65f5e24c63ba5_xxl-1.jpg?imwidth=2560',
  },
  {
    id: 5,
    name: 'Relaxed Drawstring Trousers',
    colours: 4,
    price: '$119',
    image: 'https://www.stories.com/static-images/products/assets/005/8f/9c/8f9caa5986dab88089d522b53366831e4da337a7_xxl-1.jpg?imwidth=2560',
  },
  {
    id: 6,
    name: 'Relaxed Drawstring Trousers',
    colours: 4,
    price: '$119',
    image: 'https://www.stories.com/static-images/products/assets/005/8f/9c/8f9caa5986dab88089d522b53366831e4da337a7_xxl-1.jpg?imwidth=2560',
  },
  {
    id: 7,
    name: 'Relaxed Drawstring Trousers',
    colours: 4,
    price: '$119',
    image: 'https://www.stories.com/static-images/products/assets/005/8f/9c/8f9caa5986dab88089d522b53366831e4da337a7_xxl-1.jpg?imwidth=2560',
  },
  {
    id: 8,
    name: 'Relaxed Drawstring Trousers',
    colours: 4,
    price: '$119',
    image: 'https://www.stories.com/static-images/products/assets/005/8f/9c/8f9caa5986dab88089d522b53366831e4da337a7_xxl-1.jpg?imwidth=2560',
  },
  // Add more products if needed
];


const trendingProducts = [
  {
    id: 1,
    name: 'Ruffle Maxi Dress',
    colours: 2,
    price: '$179',
    image: 'https://www.stories.com/static-images/products/assets/005/09/36/0936c4ae2e3335be1ae01edbb474ff5ce09b4a0a_xxl-1.jpg?imwidth=2560', // Example image URL structure from the site
  },
  {
    id: 2,
    name: 'Buckled Strappy Slingback Ballerinas',
    colours: 2,
    price: '$159',
    image: 'https://www.stories.com/static-images/products/assets/005/3c/49/3c49cabc773d6ba0336bbf92ac0c114ef0952e07_xxl-1.jpg?imwidth=2560',
  }
  // Add more products if needed
];
// --- End Product Data ---


export default function Home() {
  const scrollContainer = useRef<HTMLDivElement | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredSide, setHoveredSide] = useState<string | null>(null);


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
  }, []);

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
  const handleMouseDown = (e: { pageX: number; }) => {
    if (!scrollContainer.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainer.current.offsetLeft);
    setScrollLeft(scrollContainer.current.scrollLeft);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollContainer.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainer.current.offsetLeft);
    setScrollLeft(scrollContainer.current.scrollLeft);
  };

  const handleMouseMove = (e: { preventDefault: () => void; pageX: number; }) => {
    if (!isDragging || !scrollContainer.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scrolling speed
    scrollContainer.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainer.current) return;
    const x = e.touches[0].pageX - scrollContainer.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainer.current.scrollLeft = scrollLeft - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    // Menggunakan LoraFontBold sebagai default untuk body, bisa di-override per elemen
    <main className={`${LoraFontBold.className}`}>
      <Navbar />
      {/* Section 1 */}
      <div className="w-full items-center">
        <div
          className="w-full md:w-[100%] h-screen md:h-[600px] bg-cover flex flex-col justify-center gap-y-4 md:gap-y-7 items-center relative" // Added relative for potential button inside
          style={{ backgroundImage: 'url("https://lp.stories.com/app005prod?set=key%5Bresolve.pixelRatio%5D,value%5B2%5D&set=key%5Bresolve.width%5D,value%5B1650%5D&set=key%5Bresolve.height%5D,value%5B10000%5D&set=key%5Bresolve.imageFit%5D,value%5Bcontainerwidth%5D&set=key%5Bresolve.allowImageUpscaling%5D,value%5B0%5D&set=key%5Bresolve.format%5D,value%5Bwebp%5D&set=key%5Bresolve.quality%5D,value%5B80%5D&source=url%5Bhttps%3A%2F%2Fwww.stories.com%2Fcontent%2Fdam%2FStories%2FImages%2F2025%2Fcampaign%2F2513-101%2FIM_25_13_062_16x9.jpg%5D&scale=options%5Blimit%5D,size%5B1650x10000%5D&sink=format%5Bwebp%5D,quality%5B80%5D")' }}
        >
          {/* Added text shadow for better readability on image */}
          <h1 className={`${MontserratFont.className} text-white font-bold text-shadow-md`}>VERSATILE ELEGANCE</h1>
          <h1 className="md:text-5xl text-xl text-white text-shadow-md">Do-it all dressed.</h1>
          <button className="w-40 py-2 bg-white text-black">Shop Now</button>
        </div>
      </div>

      {/* Section 3 - Two Images */}
      <div className="w-full md:flex items-center"> {/* Reduced gap */}
          <div
              className="w-full md:w-1/2 h-screen md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center relative"
              style={{ backgroundImage: 'url("https://www.stories.com/static-images/sb/2142x3000/7552da1ad7/im_25_17_019_5x7.jpg?imwidth=1920")' }}
            >
                <h1 className={`${MontserratFont.className} text-white font-bold text-shadow-md`}>VERSATILE ELEGANCE</h1>
                <h1 className="md:text-5xl text-xl text-white text-shadow-md">Do-it all dressed.</h1>
                <button className="w-40 py-2 bg-white text-black">Shop Now</button>
          </div>
          <div
              className="w-full md:w-1/2 h-screen md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center relative"
              style={{ backgroundImage: 'url("https://www.stories.com/static-images/sb/2143x3000/217cffba4d/im_25_17_020_5x7.jpg?imwidth=1920")' }}
            >
                <h1 className={`${MontserratFont.className} text-white font-bold text-shadow-md`}>VERSATILE ELEGANCE</h1>
                <h1 className="md:text-5xl text-xl text-white text-shadow-md">Do-it all dressed.</h1>
                <button className="w-40 py-2 bg-white text-black">Shop Now</button>
          </div>
      </div>

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
      <div 
        ref={scrollContainer}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
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
        {newProducts.map((product) => (
          <div 
            key={product.id} 
            className="flex-none w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 snap-start"
          >
            <div className="group relative">
              <div className="w-full overflow-hidden bg-gray-200 lg:aspect-none group-hover:opacity-75 h-[420px] relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  layout="fill"
                  objectFit="cover"
                  className="h-full w-full"
                />
              </div>
              <div className="mt-4 flex flex-col text-sm">
                <h3 className="text-gray-700 font-medium">
                  <span aria-hidden="true" className="absolute inset-0" />
                  {product.name}
                </h3>
                <p className="text-gray-500 mt-1">Colours ({product.colours})</p>
                <p className="font-medium text-gray-900 mt-1">{product.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile indicator */}
      <div className="mt-6 flex justify-center space-x-2">
        {newProducts.map((_, index) => (
          <div 
            key={index} 
            className={`h-1 rounded-full ${
              Math.floor(scrollPosition / (maxScroll / newProducts.length)) === index 
                ? 'w-4 bg-gray-800' 
                : 'w-1 bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="py-10">
        <button className="block mx-auto px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition">
          View More
        </button>
      </div>
    </div>

    <div className="w-full px-4 sm:px-8 md:px-20 lg:px-32 xl:px-52 py-12">
      {/* Two side-by-side images container */}
      <div className="w-full flex flex-col md:flex-row">
        {/* Left image */}
        <div 
          className="w-full md:w-1/2 relative group cursor-pointer overflow-hidden"
          onMouseEnter={() => setHoveredSide('left')}
          onMouseLeave={() => setHoveredSide(null)}
        >
          <div 
            className="h-[300px] md:h-[500px] lg:h-[600px] bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-105"
            style={{ 
              backgroundImage: 'url("https://www.stories.com/static-images/sb/2142x3000/7552da1ad7/im_25_17_019_5x7.jpg?imwidth=1920")'
            }}
          />
          
          {/* Hover overlay with button */}
          <div className={`absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            <button className="px-6 py-3 bg-white text-gray-900 font-medium shadow-md hover:bg-gray-100 transition-all">
              Shop Now
            </button>
          </div>
        </div>
        
        {/* Right image */}
        <div 
          className="w-full md:w-1/2 relative group cursor-pointer overflow-hidden"
          onMouseEnter={() => setHoveredSide('right')}
          onMouseLeave={() => setHoveredSide(null)}
        >
          <div 
            className="h-[300px] md:h-[500px] lg:h-[600px] bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-105"
            style={{ 
              backgroundImage: 'url("https://www.stories.com/static-images/sb/2143x3000/217cffba4d/im_25_17_020_5x7.jpg?imwidth=1920")'
            }}
          />
          
          {/* Hover overlay with button */}
          <div className={`absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            <button className="px-6 py-3 bg-white text-gray-900 font-medium shadow-md hover:bg-gray-100 transition-all">
              Shop Now
            </button>
          </div>
        </div>
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

      <div className="px-5 md:py-16 ">
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
          {trendingProducts.map((place) => (
            <div 
              key={place.id} 
              className="group relative transition-all duration-300 ease-in-out"
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div 
                className={`overflow-hidden shadow-sm transition-transform duration-500 ${
                  hoveredItem === place.id ? 'transform scale-[1.02]' : ''
                }`}
              >
                <div className="relative h-72 sm:h-80 md:h-96 w-full">
                  <Image
                    src={place.image}
                    alt={place.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-700 ease-in-out group-hover:scale-105"
                  />
                  
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
                  
                  {/* Place details positioned at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl md:text-2xl font-semibold">
                      {place.name}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-lg font-medium">{place.price}</p>
                      <span className="text-sm opacity-90">Room types: {place.colours}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hidden button that appears on hover */}
              <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                <button className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-md hover:bg-gray-100 transition-all transform translate-y-2 group-hover:translate-y-0">
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