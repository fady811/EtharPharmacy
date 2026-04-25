'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Derive count directly from items — this subscribes to the items array,
  // so any add/remove/quantity change anywhere in the app immediately updates the badge.
  const totalItems = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const _hasHydrated = useCartStore((state) => state._hasHydrated);


  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <img src="/logo.png" alt="Ethar Pharmacy" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-primary-600">Ethar Pharmacy</span>
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                <AnimatePresence>
                  {_hasHydrated && totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1 -right-1 bg-accent-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </Link>

            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
