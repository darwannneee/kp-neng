import Instragram from "@/public/img/instagram.png"

export default function Footer() {
    return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-between">
          <div className="px-5 py-2">
            <h2 className="text-xl font-medium text-gray-500">Get in touch</h2>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Contact us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Store locator
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Affiliates
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Career
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Press
                </a>
              </li>
            </ul>
          </div>
          <div className="px-5 py-2">
            <h2 className="text-xl font-medium text-gray-500">About</h2>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Sustainability
                </a>
              </li>
            </ul>
          </div>
          <div className="px-5 py-2">
            <h2 className="text-xl font-medium text-gray-500">Subscribe to our newsletter</h2>
            <p className="mt-4 text-sm text-gray-500">
              Subscribe to our newsletter to keep up with our world and receive 10% off your next order.
            </p>
            <button className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Sign up
            </button>
          </div>
        </nav>
        <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <img src={Instragram.src} className="w-6" alt="" />
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2025 & Ecoute
            </p>
          </div>
        </div>
      </div>
    </footer>

    )
}