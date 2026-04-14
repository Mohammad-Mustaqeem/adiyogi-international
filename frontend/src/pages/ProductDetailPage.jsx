import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/formatters";
import api from "@/lib/api-client";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selImg, setSelImg] = useState(0);
  const [imgZoom, setImgZoom] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((r) => {
        if (!cancelled) {
          setProduct(r.data);
          setSelImg(0);
        }
      })
      .catch(() => {
        if (!cancelled) navigate("/");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, navigate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cartItem = product ? cart.find((i) => i.productId === product._id) : null;
  const inCart = !!cartItem;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
      </div>
    );

  if (!product) return null;

  const salesPrice = product.salesPrice ?? product.price ?? 0;
  const conversion = product.unitConversionRate ?? 10;
  const images = product.images?.length ? product.images : [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {/* Image Zoom Overlay */}
      {imgZoom && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setImgZoom(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selImg]}
              alt={product.name}
              className="w-full h-auto rounded-2xl shadow-2xl max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setImgZoom(false)}
              className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow-lg hover:bg-gray-100"
            >
              ✕
            </button>
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelImg(i)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      selImg === i
                        ? "bg-champagne-400 scale-125"
                        : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => {
              const page = sessionStorage.getItem("adiyogi_page") || "1";
              const collection = sessionStorage.getItem("adiyogi_collection") || "all";
              const url = page !== "1" || collection !== "all" 
                ? `/?page=${page}&collection=${collection}#products` 
                : "/#products";
              navigate(url, { replace: true });
            }}
            className="flex items-center gap-2 text-navy-600 hover:text-navy-800 font-semibold transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" /> Back to Products
          </button>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => navigate("/")}
            className="hover:text-navy-700 transition-colors"
          >
            Home
          </button>
          <span>›</span>
          {product.collections?.[0] && (
            <>
              <button
                onClick={() => navigate("/#products")}
                className="hover:text-navy-700 transition-colors"
              >
                {product.collections[0].name}
              </button>
              <span>›</span>
            </>
          )}
          <span className="text-navy-700 font-medium line-clamp-1">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* ── LEFT: Image Gallery ── */}
          <div className="space-y-3">
            <div
              className="relative bg-white rounded-2xl overflow-hidden shadow-sm aspect-square cursor-zoom-in group"
              onClick={() => images.length > 0 && setImgZoom(true)}
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selImg]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 sm:p-8 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    🔍 Click to zoom
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <svg
                    className="w-24 h-24"
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
                  <p className="text-sm mt-2">No Image</p>
                </div>
              )}

              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelImg(i)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selImg === i
                        ? "border-champagne-500 shadow-md scale-105"
                        : "border-gray-200 hover:border-navy-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="space-y-5">
            {product.collections?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.collections.map((c) => (
                  <span
                    key={c._id}
                    className="inline-block bg-navy-100 text-navy-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="bg-gray-100 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400 font-medium">Item Code</p>
                <p className="font-mono font-bold text-gray-700 text-sm">
                  {product.itemCode}
                </p>
              </div>
              {product.hsnCode && (
                <div className="bg-gray-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 font-medium">HSN Code</p>
                  <p className="font-mono font-bold text-gray-700 text-sm">
                    {product.hsnCode}
                  </p>
                </div>
              )}
              {product.standardPacking && (
                <div className="bg-champagne-50 border border-champagne-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-champagne-500 font-medium">Standard Packing</p>
                  <p className="font-bold text-champagne-700 text-sm">
                    {product.standardPacking}
                  </p>
                </div>
              )}
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-navy-800 leading-tight">
              {product.name}
            </h1>

            {/* Price Block */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="font-display font-black text-3xl sm:text-4xl text-navy-700">
                  ₹{formatCurrency(salesPrice)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                {product.gstRate && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                    GST {product.gstRate}% included
                  </span>
                )}
              </div>
            </div>

            {/* Unit Info */}
            <div className="bg-navy-50 rounded-2xl p-4 border border-navy-100">
              <h3 className="font-semibold text-navy-800 text-sm mb-3">
                📦 Unit Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Base Unit</p>
                  <p className="font-display font-bold text-navy-700 text-lg">
                    PAC
                  </p>
                  <p className="text-xs text-gray-500">Packs</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">
                    1 Pack Contains
                  </p>
                  <p className="font-display font-bold text-champagne-600 text-lg">
                    {conversion}
                  </p>
                  <p className="text-xs text-gray-500">NOS (Numbers)</p>
                </div>
              </div>
            </div>

            {/* Add to Cart — Vyapar 2-state */}
            <div className="space-y-3">
              {inCart ? (
                <>
                  <div className="flex items-center justify-between bg-white border border-blue-500 rounded-2xl px-5 py-3">
                    <button
                      onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                      className="w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-blue-50 font-bold text-2xl rounded-full transition-colors"
                    >
                      −
                    </button>
                    <div className="text-center">
                      <span className="text-xl font-bold text-blue-700">{cartItem.quantity}</span>
                      <p className="text-xs text-gray-400">{cartItem.quantity * conversion} NOS</p>
                    </div>
                    <button
                      onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-blue-50 font-bold text-2xl rounded-full transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="bg-navy-50 rounded-xl px-4 py-2.5 text-sm">
                    <span className="text-gray-600">Subtotal: </span>
                    <span className="font-bold text-navy-700 text-base">
                      ₹{formatCurrency(salesPrice * cartItem.quantity)}
                    </span>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => addToCart(product, 1)}
                  className="w-full py-4 rounded-2xl font-bold text-base border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <CartIcon className="w-5 h-5" /> + Add to Cart
                </button>
              )}

              <button
                onClick={() => {
                  if (!inCart) addToCart(product, 1);
                  navigate("/checkout");
                }}
                className="w-full py-4 rounded-2xl font-bold text-base border-2 border-champagne-500 text-champagne-600 hover:bg-champagne-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3"
              >
                <BoltIcon className="w-5 h-5" /> Buy Now
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-display font-bold text-navy-800 text-base mb-3">
                  Product Description
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
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
const BoltIcon = ({ className }) => (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);
const ArrowLeftIcon = ({ className }) => (
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
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);
