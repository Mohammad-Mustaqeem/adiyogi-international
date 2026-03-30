import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;
  const pdfUrl = state?.pdfUrl;
  const autoSent = state?.autoSent;

  const [step, setStep] = useState(0);
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    if (!order) navigate("/");
  }, [order, navigate]);

  // Staggered animation steps
  useEffect(() => {
    if (!order) return;
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 900);
    const t3 = setTimeout(() => setStep(3), 1500);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [order]);

  // Auto-open invoice PDF in new tab
  useEffect(() => {
    if (!pdfUrl || !order) return;
    const timer = setTimeout(() => {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      setPdfReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [pdfUrl, order]);

  if (!order) return null;

  const waConnected = autoSent?.waReady;
  const adminSent = autoSent?.admin;
  const custSent = autoSent?.customer;

  const statusSteps = [
    { icon: "✅", label: "Order confirmed & saved", done: step >= 1 },
    { icon: "📄", label: "Invoice PDF generated", done: step >= 2 },
    {
      icon: "📱",
      label: waConnected
        ? "WhatsApp sent automatically"
        : "WhatsApp links ready",
      done: step >= 3,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 pt-20 pb-12 px-4 relative overflow-hidden">
      {/* Decorative dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full animate-bounce opacity-30"
            style={{
              left: `${5 + i * 6}%`,
              top: `${10 + (i % 5) * 18}%`,
              backgroundColor: ["#C9A84C", "#fff", "#6B9BD2", "#86efac"][
                i % 4
              ],
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.2 + (i % 4) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Celebration header */}
        <div className="text-center mb-8">
          <div
            className={`transition-all duration-700 ${
              step >= 1
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50"
            }`}
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-champagne-400 to-champagne-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-champagne-500/40 text-5xl sm:text-6xl">
              🎉
            </div>
          </div>
          <h1 className="font-display font-black text-white text-3xl sm:text-4xl lg:text-5xl mb-3">
            Order Placed!
          </h1>
          <p className="text-champagne-300 text-base sm:text-lg font-medium">
            Thank you for choosing Adiyogi International 🦅
          </p>
          <p className="text-navy-300 text-sm mt-1">
            Order{" "}
            <span className="font-mono font-bold text-champagne-400">
              {order.orderId}
            </span>
          </p>
        </div>

        {/* Auto-process progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/20">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-4 text-center">
            ⚡ Processing Automatically
          </p>
          <div className="space-y-3">
            {statusSteps.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  s.done ? "opacity-100" : "opacity-30"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all duration-500 ${
                    s.done
                      ? "bg-green-400 text-white shadow-lg shadow-green-400/30"
                      : "bg-white/20"
                  }`}
                >
                  {s.done ? "✓" : s.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    s.done ? "text-white" : "text-white/50"
                  }`}
                >
                  {s.label}
                </span>
                {s.done && (
                  <span className="ml-auto text-green-400 text-xs font-bold">
                    ✓ Done
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main info card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* PDF auto-download banner */}
          {pdfUrl && (
            <div className="bg-gradient-to-r from-champagne-500 to-champagne-600 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  📄
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="font-display font-bold text-white text-sm sm:text-base">
                    {pdfReady
                      ? "✅ Invoice PDF Downloaded!"
                      : "⏳ Downloading Invoice PDF..."}
                  </p>
                  <p className="text-champagne-100 text-xs sm:text-sm">
                    {pdfReady
                      ? "Check your downloads folder."
                      : "Your invoice is being downloaded automatically."}
                  </p>
                </div>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-champagne-50 text-champagne-700 font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  <DownloadIcon className="w-4 h-4" />
                  {pdfReady ? "Open Again" : "Open PDF"}
                </a>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8">
            {/* WhatsApp auto-send status */}
            <div
              className={`rounded-2xl p-4 mb-5 border-2 ${
                waConnected
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    waConnected ? "bg-green-500" : "bg-blue-500"
                  }`}
                >
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p
                    className={`font-bold text-sm ${
                      waConnected ? "text-green-800" : "text-blue-800"
                    }`}
                  >
                    {waConnected
                      ? "✅ WhatsApp Sent Automatically"
                      : "📱 WhatsApp Notifications"}
                  </p>
                  <p
                    className={`text-xs ${
                      waConnected ? "text-green-600" : "text-blue-600"
                    }`}
                  >
                    {waConnected
                      ? "Order details & PDF sent to admin and your number — no action needed!"
                      : "Connect WhatsApp in Admin Panel for fully automatic notifications"}
                  </p>
                </div>
              </div>

              {waConnected && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl px-3 py-2 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">
                      Admin Notified
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        adminSent ? "text-green-600" : "text-orange-500"
                      }`}
                    >
                      {adminSent ? "✓ Sent" : "⚠ Failed"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl px-3 py-2 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Your Copy</p>
                    <p
                      className={`text-sm font-bold ${
                        custSent ? "text-green-600" : "text-orange-500"
                      }`}
                    >
                      {custSent ? "✓ Sent" : "⚠ Failed"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="bg-navy-50 rounded-xl p-4 mb-5 border border-navy-100">
              <div className="flex justify-between items-center mb-3">
                <p className="font-mono text-xs text-navy-600 font-bold">
                  ORDER {order.orderId}
                </p>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  ✓ Confirmed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Customer</p>
                  <p className="font-semibold text-gray-700">
                    {order.customer?.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">WhatsApp</p>
                  <p className="font-semibold text-green-600 text-sm">
                    {order.customer?.whatsapp}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Payment</p>
                  <p className="font-semibold text-gray-700">
                    {order.paymentMode}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total</p>
                  <p className="font-bold text-navy-700 text-base">
                    ₹{order.total?.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs">Delivery</p>
                  <p className="font-semibold text-gray-700 text-xs">
                    {order.customer?.address}, {order.customer?.city},{" "}
                    {order.customer?.state} – {order.customer?.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <h3 className="font-display font-semibold text-navy-800 mb-3">
              Items Ordered
            </h3>
            <div className="space-y-2 mb-6">
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0 gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-700 text-sm line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.itemCode} · {item.quantity} PAC × ₹{item.price}
                    </p>
                  </div>
                  <p className="font-semibold text-navy-700 text-sm flex-shrink-0">
                    ₹{formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-bold">
                <span className="text-navy-800">Total</span>
                <span className="text-navy-700">
                  ₹{order.total?.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full btn-primary text-center"
            >
              🛍️ Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const DownloadIcon = ({ className }) => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const WhatsAppIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);
