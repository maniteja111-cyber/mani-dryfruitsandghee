import Link from 'next/link'

interface FooterProps {
  settings: Record<string, string>
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">
            {settings.siteName || 'Mani Dry Fruits & Ghee Stores'}
          </h3>
          <p className="text-gray-300">Healthy Shopping Starts Here</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-300 hover:text-white">Home</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white">Products</Link></li>
              <li><Link href="/cart" className="text-gray-300 hover:text-white">Cart</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div className="text-center">
            <h4 className="text-md font-semibold mb-4">Contact</h4>
            <div className="text-sm text-gray-300 space-y-2">
              <p>📞 {settings.phone || '+91 XXXXX XXXXX'}</p>
              <p>📍 {settings.address ? settings.address.split(',')[0] : 'Hyderabad'}</p>
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-md font-semibold mb-4">Follow Us</h4>
            <p className="text-sm text-gray-300">Stay connected for updates and offers</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} {settings.siteName || 'Mani Dry Fruits & Ghee Stores'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}