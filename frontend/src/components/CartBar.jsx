import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/formatters";

export default function CartBar() {
  const { cart, cartCount, cartTotal } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide on checkout, order-success, and admin pages
  const hidden = ["/checkout", "/order-success", "/admin"].some((p) =>
    pathname.startsWith(p),
  );

  if (hidden || cartCount === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 cursor-pointer"
      onClick={() => navigate("/checkout")}
    >
      <div className="bg-[#1B3A6B] text-white flex items-center justify-between px-5 py-3.5 safe-area-bottom">
        {/* Left: items + total */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">
            {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}
          </span>
          <span className="text-blue-300">•</span>
          <span className="font-bold text-sm">₹{formatCurrency(cartTotal)}</span>
        </div>

        {/* Right: cart icon + view cart */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <CartIcon className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#C9A84C] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          </div>
          <span className="font-bold text-sm">View cart</span>
          <span className="text-blue-300 text-lg">›</span>
        </div>
      </div>
    </div>
  );
}

const CartIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);
