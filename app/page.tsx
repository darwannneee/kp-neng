import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Lora, Lacquer, Montserrat } from "next/font/google";
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
    id: 4,
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
  return (
    // Menggunakan LoraFontBold sebagai default untuk body, bisa di-override per elemen
    <main className={`${LoraFontBold.className}`}>
      <Navbar />
      {/* Section 1 */}
      <div className="w-full items-center pt-7">
        <div
          className="w-full md:w-[100%] h-[400px] md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center relative" // Added relative for potential button inside
          style={{ backgroundImage: 'url("https://lp.stories.com/app005prod?set=key%5Bresolve.pixelRatio%5D,value%5B2%5D&set=key%5Bresolve.width%5D,value%5B1650%5D&set=key%5Bresolve.height%5D,value%5B10000%5D&set=key%5Bresolve.imageFit%5D,value%5Bcontainerwidth%5D&set=key%5Bresolve.allowImageUpscaling%5D,value%5B0%5D&set=key%5Bresolve.format%5D,value%5Bwebp%5D&set=key%5Bresolve.quality%5D,value%5B80%5D&source=url%5Bhttps%3A%2F%2Fwww.stories.com%2Fcontent%2Fdam%2FStories%2FImages%2F2025%2Fcampaign%2F2513-101%2FIM_25_13_062_16x9.jpg%5D&scale=options%5Blimit%5D,size%5B1650x10000%5D&sink=format%5Bwebp%5D,quality%5B80%5D")' }}
        >
          {/* Added text shadow for better readability on image */}
          <h1 className={`${MontserratFont.className} text-white text-shadow-md`}>VERSATILE ELEGANCE</h1>
          <h1 className="text-5xl text-white text-shadow-md">Do-it all dressed.</h1>
          <button className="w-40 py-2 bg-white text-black">Shop Now</button>
        </div>
      </div>

      {/* Section 3 - Two Images */}
      <div className="w-full md:flex items-center"> {/* Reduced gap */}
          <div
              className="w-full md:w-1/2 h-[400px] md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center mb-4 md:mb-0 relative"
              style={{ backgroundImage: 'url("https://www.stories.com/static-images/sb/2142x3000/7552da1ad7/im_25_17_019_5x7.jpg?imwidth=1920")' }}
            >
              <h1 className={`${MontserratFont.className} text-white text-shadow-md`}>VERSATILE ELEGANCE</h1>
              <h1 className="text-5xl text-white text-shadow-md">Do-it all dressed.</h1>
              <button className="w-40 py-2 bg-white text-black">Shop Now</button>
          </div>
          <div
              className="w-full md:w-1/2 h-[400px] md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center relative"
              style={{ backgroundImage: 'url("https://www.stories.com/static-images/sb/2143x3000/217cffba4d/im_25_17_020_5x7.jpg?imwidth=1920")' }}
            >
              <h1 className={`${MontserratFont.className} text-white text-shadow-md`}>VERSATILE ELEGANCE</h1>
              <h1 className="text-5xl text-white text-shadow-md">Do-it all dressed.</h1>
              <button className="w-40 py-2 bg-white text-black">Shop Now</button>
          </div>
      </div>

      {/* --- New Product Section --- */}
      <div className="px-5 md:py-16"> {/* Added padding top/bottom */}
        <h2 className={`${MontserratFont.className} text-sm`}>
          FIND YOUR FAVORITES
        </h2>
        <h2 className={`${MontserratFont.className} text-3xl pt-1`}>
          New Arrivals
        </h2>
        {/* Grid layout for products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 pt-8">
          {newProducts.map((product) => (
            <div key={product.id} className="group relative"> {/* Added group for potential hover effects */}
              <div className="w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80 relative">
                {/* Use next/image */}
                <Image
                  src={product.image}
                  alt={product.name}
                  layout="fill" // Fills the parent container
                  objectFit="cover" // Covers the container, might crop
                  className="h-full w-full"
                />
                 {/* Optional: Add Heart Icon */}
                 {/* <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow">
                    <HeartIcon className="h-5 w-5 text-gray-500" />
                 </button> */}
              </div>
              <div className="mt-4 flex flex-col text-sm"> {/* Changed main text font for product details */}
                <h3 className={`${MontserratFont.className} text-gray-700`}>
                  {/* Optional: Link to product page */}
                  {/* <a href="#"> */}
                    <span aria-hidden="true" className="absolute inset-0" /> {/* Makes the whole card clickable */}
                    {product.name}
                  {/* </a> */}
                </h3>
                <p className={`${MontserratFont.className} text-gray-500 mt-1`}>Colours ({product.colours})</p>
                <p className={`${MontserratFont.className} font-medium text-gray-900 mt-1`}>{product.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="py-14">
            <h1 className="text-center">View More</h1>
        </div>
      </div>

      {/* Section 3 - Two Images */}
      <div className="w-full md:flex items-center"> {/* Reduced gap */}
          <div
              className="w-full md:w-1/2 h-[400px] md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center mb-4 md:mb-0 relative"
              style={{ backgroundImage: 'url("https://www.stories.com/static-images/sb/2142x3000/7552da1ad7/im_25_17_019_5x7.jpg?imwidth=1920")' }}
            >
              <h1 className={`${MontserratFont.className} text-white text-shadow-md`}>VERSATILE ELEGANCE</h1>
              <h1 className="text-5xl text-white text-shadow-md">Do-it all dressed.</h1>
              <button className="w-40 py-2 bg-white text-black">Shop Now</button>
          </div>
          <div
              className="w-full md:w-1/2 h-[400px] md:h-[600px] bg-cover flex flex-col justify-center gap-y-7 items-center relative"
              style={{ backgroundImage: 'url("https://www.stories.com/static-images/sb/2143x3000/217cffba4d/im_25_17_020_5x7.jpg?imwidth=1920")' }}
            >
              <h1 className={`${MontserratFont.className} text-white text-shadow-md`}>VERSATILE ELEGANCE</h1>
              <h1 className="text-5xl text-white text-shadow-md">Do-it all dressed.</h1>
              <button className="w-40 py-2 bg-white text-black">Shop Now</button>
          </div>
      </div>

      {/* --- New Product Section --- */}
      <div className="px-5 md:py-16"> {/* Added padding top/bottom */}
        <h2 className={`${MontserratFont.className} text-sm text-center`}>
          FIND YOUR FAVORITES
        </h2>
        <h2 className={`${MontserratFont.className} text-3xl pt-1 text-center`}>
          New Arrivals
        </h2>
        {/* Grid layout for products */}
        <div className="mx-auto container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-10 pt-8">
            {trendingProducts.map((product) => (
              <div key={product.id} className="group relative">
                <div className="overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-96 relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover "
                    className="h-full w-full bg-center bg-cover"
                  />
                </div>
                <div className="mt-4 flex flex-col text-sm">
                  <h3 className={`${MontserratFont.className} text-gray-700`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </h3>
                  <p className={`${MontserratFont.className} text-gray-500 mt-1`}>Colours ({product.colours})</p>
                  <p className={`${MontserratFont.className} font-medium text-gray-900 mt-1`}>{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        

        <div className="py-14">
            <h1 className="text-center">View More</h1>
        </div>
      </div>

    </main>
  );
}