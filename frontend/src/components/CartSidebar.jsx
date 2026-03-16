import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar() {
  const { cart, cartTotal, cartCount, updateQuantity, removeFromCart, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer — full width on xs, capped at md */}
      <div className={`fixed top-0 right-0 h-full w-full xs:w-[22rem] sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-navy-700">
          <div>
            <h2 className="font-display font-bold text-white text-lg sm:text-xl">Your Cart</h2>
            <p className="text-navy-300 text-xs sm:text-sm">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 sm:py-4 sm:px-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-display font-semibold text-gray-500 text-base sm:text-lg">Cart is empty</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Add some products to get started</p>
              <button onClick={() => setIsCartOpen(false)} className="mt-5 btn-primary">Browse Products</button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {cart.map(item => (
                <div key={item.productId} className="flex gap-2 sm:gap-3 bg-gray-50 rounded-xl p-2.5 sm:p-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs sm:text-sm line-clamp-2">{item.name}</p>
                    <p className="text-navy-600 font-bold text-xs sm:text-sm">₹{item.price.toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-navy-700 hover:bg-navy-50 text-xs font-bold rounded-l-lg">−</button>
                        <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-navy-700 hover:bg-navy-50 text-xs font-bold rounded-r-lg">+</button>
                      </div>
                      <span className="text-xs text-gray-500 font-semibold ml-auto">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)}
                    className="text-red-400 hover:text-red-600 p-1 self-start flex-shrink-0">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-4 sm:p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium text-sm sm:text-base">Subtotal</span>
              <span className="font-display font-bold text-lg sm:text-xl text-navy-700">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <button onClick={handleCheckout} className="w-full btn-primary text-center">
              Proceed to Checkout →
            </button>
            <button onClick={() => setIsCartOpen(false)}
              className="w-full text-center text-xs sm:text-sm text-gray-500 hover:text-navy-600 font-medium">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
