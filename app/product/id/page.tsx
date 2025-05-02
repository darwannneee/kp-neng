'use client'; // Tambahkan ini di baris paling atas file Anda

import { SetStateAction, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';

// Import Font Awesome CSS
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

const productsData = [
  {
    id: '1',
    name: 'Two-Toned Stone Pendant Earrings',
    price: 59,
    colors: ['METAL/GREEN'],
    images: [
      '/images/earrings1.jpg',
      '/images/earrings2.jpg',
      '/images/earrings3.jpg',
    ],
    description:
      "These earrings are fashioned from two interlinked, silver-toned discs featuring an irregular form and a textured finish. Each disc is adorned with a faceted stone, surrounded by a gold-toned trim. The contrasting tones create a bold look when worn alone, while also offering versatility when paired with other jewellery.",
    details: [
      { title: 'Details & Fit', content: 'Some details about fit...' },
      { title: 'Material', content: 'Information about the material...' },
      { title: 'Shipping & Payment', content: 'Shipping and Payment details...' },
    ],
    features: ['Nickel tested', 'Butterfly backings'],
    width: '2.7cm / 1"',
    totalLength: '7cm / 2.8"',
    modelHeight: '175 cm',
    styleWithImage: '/images/top.jpg',
  },
  {
    id: '2',
    name: 'Another Product',
    price: 99,
    colors: ['BLACK', 'WHITE'],
    images: [
      '/images/top.jpg',
      '/images/earrings2.jpg'
    ],
    description: 'This is another product\'s description.',
    details: [
      { title: 'Care Instructions', content: 'Machine wash cold.' },
    ],
    features: ['Sustainable material'],
    width: '5cm',
    totalLength: '10cm',
    modelHeight: '180 cm',
    styleWithImage: '/images/top.jpg',
  },
];

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  const [selectedColor, setSelectedColor] = useState('METAL/GREEN');

  const product = productsData.find((p) => p.id === id);

  if (!product) {
    return <div>Product not found</div>;
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleColorSelect = (color: SetStateAction<string>) => {
    setSelectedColor(color);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <button
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          
          <Image
            src={product.images[currentImageIndex]}
            alt={`Product Image ${currentImageIndex + 1}`}
            width={600}
            height={700}
            className="w-full h-auto object-cover"
          />
          

          <button
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentImageIndex ? 'bg-gray-800' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-gray-600 mt-2">${product.price}</p>

          <div className="mt-6">
            <h3 className="text-lg font-medium">Color</h3>
            
              <div className="flex items-center mt-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`ml-2 px-4 py-2 rounded-full border border-gray-300 hover:border-gray-500 focus:outline-none ${
                      selectedColor === color ? 'ring-2 ring-gray-500' : ''
                    }`}
                    onClick={() => handleColorSelect(color)}
                  >
                  {color}
                  
                  </button>
                  ))}
                   </div>
          </div>

          <div className="mt-8 flex">
            <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 focus:outline-none">
              Add to Bag
            </button>
            <button className="ml-4 border border-gray-300 rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-100 focus:outline-none">
                <FontAwesomeIcon icon={faHeart} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-gray-700">{product.description}</p>
        
        <ul className="list-disc list-inside mt-4">
          {product.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>

        <p className="mt-2">Width: {product.width}</p>
        <p>Total length: {product.totalLength}</p>
        <p>The model is {product.modelHeight} cm.</p>
      </div>

      <div className="mt-10">
        {product.details.map((detail, index) => (
          <Accordion key={index} title={detail.title} content={detail.content} />
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Style With</h2>
        <div>
          <Image
            src={product.styleWithImage} 
            alt="Style With"
            width={150}
            height={200}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
};

// Accordion Component
const Accordion = ({ title, content }: { title: string; content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-300 rounded mb-2">
      <button
        className="w-full text-left py-3 px-4 font-medium flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <svg
          className={`w-4 h-4 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="py-2 px-4 text-gray-700">{content}</div>}
    </div>
  );
};

export default ProductDetail;