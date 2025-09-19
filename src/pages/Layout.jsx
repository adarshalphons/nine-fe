

import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Heart, ShoppingBag, Menu, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'New', href: '#' },
    { name: 'Dresses', href: '#' },
    { name: 'Tops', href: '#' },
    { name: 'Jeans', href: '#' },
    { name: 'Sale', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-800 antialiased">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
        {/* Top bar */}
        <div className="hidden md:flex justify-end items-center px-6 py-1 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors flex items-center gap-1">
                <MapPin size={12} /> Find a Store
            </a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-gray-900 transition-colors">Customer Support</a>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <div className="flex items-center gap-6">
            <Link to={createPageUrl("Products")} className="text-2xl font-black tracking-wider text-gray-900">
              BRAND
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <ShoppingBag size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsMenuOpen(false)}>
                <div className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-xl font-bold">Menu</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                            <X size={24} />
                        </Button>
                    </div>
                    <nav className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <a key={link.name} href={link.href} className="text-lg font-medium text-gray-700 hover:bg-gray-100 p-2 rounded-md">
                                {link.name}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">About Us</h3>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="text-base text-gray-600 hover:text-gray-900">Our Story</a></li>
                        <li><a href="#" className="text-base text-gray-600 hover:text-gray-900">Careers</a></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Customer Service</h3>
                    <ul className="mt-4 space-y-2">
                        <li><a href="#" className="text-base text-gray-600 hover:text-gray-900">Help</a></li>
                        <li><a href="#" className="text-base text-gray-600 hover:text-gray-900">Shipping</a></li>
                         <li><a href="#" className="text-base text-gray-600 hover:text-gray-900">Returns</a></li>
                    </ul>
                </div>
                 <div className="col-span-2 md:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Stay Connected</h3>
                    <p className="text-gray-600 mt-4">Get 10% off your first order.</p>
                </div>
            </div>
            <div className="mt-12 border-t border-gray-200 pt-8">
                <p className="text-base text-gray-500 text-center">&copy; 2024 BRAND Inc. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

