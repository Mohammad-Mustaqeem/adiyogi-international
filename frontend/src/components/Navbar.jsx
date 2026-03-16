import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const location  = useLocation();
  const isHome    = location.pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => setMenuOpen(false), [location]);

  const solid = scrolled || !isHome;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      solid ? 'bg-white/95 backdrop-blur-md shadow-md py-2 sm:py-3' : 'bg-transparent py-4 sm:py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">

        {/* Logo — transparent PNG works on any background now */}
        <Link to="/" className="flex-shrink-0">
          <img src="/logo.png" alt="Adiyogi International" className="h-9 sm:h-11 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {[['/', 'Home'], ['/#products', 'Products'], ['/#collections', 'Collections'], ['/#how-to-order', 'How to Order']].map(([to, label]) => (
            <a key={to} href={to} className={`font-body font-medium text-sm transition-colors hover:text-champagne-500 ${
              solid ? 'text-gray-700' : 'text-white'
            }`}>{label}</a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative flex items-center gap-1.5 font-semibold px-3 py-2 sm:px-4 rounded-xl transition-all duration-300 text-sm ${
              solid ? 'bg-navy-50 text-navy-700 hover:bg-navy-100' : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-champagne-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          <button onClick={() => setMenuOpen(v => !v)}
            className={`md:hidden p-2 rounded-xl transition-colors ${solid ? 'text-navy-700 hover:bg-navy-50' : 'text-white hover:bg-white/10'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {[['/', 'Home'], ['/#products', 'Products'], ['/#collections', 'Collections'], ['/#how-to-order', 'How to Order']].map(([to, label]) => (
              <a key={to} href={to} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-navy-50 hover:text-navy-700 transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
