import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/formatters";

export default function ProductCard({ product }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);

  const salesPrice = product.salesPrice ?? product.price ?? 0;
  const conversion = product.unitConversionRate ?? product.packSize ?? 10;

  const cartItem = cart.find((i) => i.productId === product._id);
  const inCart = !!cartItem;

  return (
    <div className="card group relative flex flex-col h-full">
      {/* ── Clickable area: image + name ── */}
      <div
        className="flex flex-col flex-1 cursor-pointer"
        onClick={() => navigate(`/product/${product._id}`)}
      >
        {/* Image */}
        <div className="product-img-wrap aspect-square bg-gray-50 flex-shrink-0 overflow-hidden relative">
          {!imgErr && product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <PackageIcon className="w-10 h-10 sm:w-14 sm:h-14 text-gray-200" />
              <p className="text-[9px] sm:text-xs text-gray-300 mt-2 font-mono text-center break-all">
                {product.itemCode}
              </p>
            </div>
          )}

          {/* Logo — top-left corner */}
          <div className="absolute top-1 left-1 pointer-events-none select-none">
            <img src="/logo.png" alt="" style={{
              height: 'clamp(50px, 13vw, 100px)',
              width:  'clamp(50px, 13vw, 100px)',
              objectFit: 'contain',
              objectPosition: 'left center',
            }} />
          </div>

          {/* Diagonal phone watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span style={{
              transform: 'rotate(-35deg)',
              fontSize: 'clamp(18px, 5vw, 42px)',
              fontWeight: '700',
              fontFamily: 'monospace',
              color: 'rgba(15, 32, 64, 0.18)',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}>
              7975198804
            </span>
          </div>

          <div className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/10 transition-all duration-300 flex items-center justify-center">
            <span className="bg-white text-navy-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
              View Details
            </span>
          </div>
        </div>

        {/* Name + code */}
        <div className="px-3 sm:px-4 pt-3">
           <p className="text-[9px] sm:text-[12px] font-mono font-black text-black-700 mb-1">
            ITEM CODE : {product.itemCode}
          </p>
          {product.standardPacking && (
            <p className="text-[9px] sm:text-[12px] font-semibold mb-1" style={{ color: '#a8872f' }}>
              Standard Packing: {product.standardPacking}
            </p>
          )}
          <h6 className="font-display font-bold font-mono text-black-100 text-xs sm:text-sm leading-snug line-clamp-2">
            {product.name}
          </h6>
        </div>
      </div>

      {/* ── Non-clickable area: price + add/stepper ── */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex items-center justify-between">
        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-2 sm:mt-3 flex-wrap">
          <span className="font-display font-bold text-base sm:text-lg lg:text-xl text-navy-700">
            ₹{formatCurrency(salesPrice)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-gray-400">/PAC</span>
        </div>

        {/* Add / Stepper */}
        {inCart ? (
          <div className="flex items-center border border-blue-500 rounded-full overflow-hidden">
            <button
              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 font-bold text-base transition-colors"
              onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold text-blue-700">
              {cartItem.quantity}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 font-bold text-base transition-colors"
              onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
            >
              +
            </button>
          </div>
        ) : (
          <button
            className="border border-blue-500 text-blue-600 rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-blue-50 transition-colors"
            onClick={() => addToCart(product, 1)}
          >
            +Add
          </button>
        )}
      </div>
    </div>
  );
}

const PackageIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);
