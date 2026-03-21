import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/formatters";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [imgErr, setImgErr] = useState(false);
  const [adding, setAdding] = useState(false);

  const salesPrice = product.salesPrice ?? product.price ?? 0;
  const purchasePrice = product.purchasePrice ?? product.originalPrice;
  const conversion = product.unitConversionRate ?? product.packSize ?? 10;
  const discount = purchasePrice
    ? Math.round((1 - salesPrice / purchasePrice) * 100)
    : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    setAdding(true);
    addToCart(product, qty);
    toast.success(`${product.name} added!`, {
      style: {
        background: "#1B3A6B",
        color: "white",
        fontFamily: "DM Sans",
        fontSize: "14px",
      },
      iconTheme: { primary: "#C9A84C", secondary: "#fff" },
    });
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div
      className="card group relative flex flex-col h-full cursor-pointer"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {discount > 0 && (
          <span className="badge bg-red-500 text-white text-[9px] sm:text-[10px]">
            {discount}% OFF
          </span>
        )}
        {product.stock === 0 && (
          <span className="badge bg-gray-500 text-white text-[9px] sm:text-[10px]">
            Out of Stock
          </span>
        )}
      </div>

      {/* Image */}
      <div className="product-img-wrap aspect-square bg-gray-50 flex-shrink-0 overflow-hidden">
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
        {/* View detail hint */}
        <div className="absolute inset-0 bg-navy-900/0 group-hover:bg-navy-900/10 transition-all duration-300 flex items-center justify-center">
          <span className="bg-white text-navy-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
            View Details
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-[9px] sm:text-[10px] font-mono text-gray-400 mb-1">
          {product.itemCode}
        </p>
        <h3 className="font-display font-semibold text-gray-800 text-xs sm:text-sm leading-snug mb-1 line-clamp-2 flex-1">
          {product.name}
        </h3>

        {product.collection && (
          <span className="text-[9px] sm:text-[10px] text-navy-600 font-semibold uppercase tracking-wide">
            {product.collection.name}
          </span>
        )}

        {/* Unit info */}
        <div className="mt-2 bg-navy-50 rounded-lg px-2 py-1.5 border border-navy-100">
          <p className="text-[10px] text-navy-700 font-semibold">
            1 PAC = {conversion} NOS
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-2 sm:mt-3 flex-wrap">
          <span className="font-display font-bold text-base sm:text-lg lg:text-xl text-navy-700">
            ₹{formatCurrency(salesPrice)}
          </span>
          {purchasePrice && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through">
              ₹{formatCurrency(purchasePrice)}
            </span>
          )}
          <span className="text-[9px] sm:text-[10px] text-gray-400">/PAC</span>
        </div>

        {/* Qty + Add */}
        {product.stock !== 0 ? (
          <div
            className="flex items-center gap-1.5 sm:gap-2 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQty((q) => Math.max(1, q - 1));
                }}
                className="px-2 py-1.5 sm:px-3 sm:py-2 text-navy-700 hover:bg-navy-50 font-bold text-sm transition-colors"
              >
                −
              </button>
              <span className="px-2 text-xs sm:text-sm font-semibold min-w-[1.5rem] text-center">
                {qty}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQty((q) => q + 1);
                }}
                className="px-2 py-1.5 sm:px-3 sm:py-2 text-navy-700 hover:bg-navy-50 font-bold text-sm transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={adding}
              className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                adding
                  ? "bg-champagne-500 text-white scale-95"
                  : "bg-navy-600 hover:bg-navy-700 text-white hover:shadow-md"
              }`}
            >
              {adding ? "✓ Added!" : "Add to Cart"}
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full mt-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs sm:text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            Out of Stock
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
