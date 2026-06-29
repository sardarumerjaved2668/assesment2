import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div>
            <Link href="/" className="text-xl font-bold text-indigo-600">
              ShopNext
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Discover amazing products at unbeatable prices.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
              Shop
            </Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ShopNext. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
