import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/formatters";
import { INDIAN_STATES } from "@/constants";
import api from "@/lib/api-client";
import { checkoutSchema, validateFields } from "@/lib/validators";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const grandTotal = cartTotal;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const fieldErrors = validateFields(checkoutSchema, form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0]);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        customer: { ...form },
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMode: "Credit",
      });
      clearCart();
      navigate("/order-success", {
        state: {
          order: data.order,
          autoSent: data.autoSent,
          pdfUrl: data.pdfUrl,
        },
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to place order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4">🛒</div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-gray-700 mb-4">
            Your cart is empty
          </h2>
          <button onClick={() => navigate("/")} className="btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-ivory pt-20 sm:pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-navy-800">
            Checkout
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Complete your order details below
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8"
        >
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-5 sm:space-y-6">
            {/* Personal Info */}
            <FormSection title="Dealer Name" step="1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Label>Full Name *</Label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`input ${errors.name ? "border-red-400" : ""}`}
                    placeholder="John Doe"
                  />
                  <FieldError msg={errors.name} />
                </div>
                <div>
                  <Label>Dealer Code (optional)</Label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="9876543210"
                  />
                  <FieldError msg={errors.phone} />
                </div>
                <div>
                  <Label>
                    WhatsApp Number *
                    <span className="ml-2 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      REQUIRED
                    </span>
                  </Label>
                  <div className="relative">
                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      className={`input pr-8 ${errors.whatsapp ? "border-red-400" : ""}`}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-base">
                      <WhatsAppIcon className="w-4 h-4" />
                    </span>
                  </div>
                  <FieldError msg={errors.whatsapp} />
                  {!errors.whatsapp && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      📄 Invoice PDF will be sent here automatically
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label>Email (optional)</Label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`input ${errors.email ? "border-red-400" : ""}`}
                    type="email"
                    placeholder="john@example.com"
                  />
                  <FieldError msg={errors.email} />
                </div>
              </div>
            </FormSection>

            {/*      
            
            <FormSection title="Delivery Address" step="2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <Label>District Address</Label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`input resize-none ${errors.address ? "border-red-400" : ""}`}
                    rows={3}
                    placeholder="House/Flat No., Street, Area..."
                  />
                  <FieldError msg={errors.address} />
                </div>
                <div>
                  <Label>City</Label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={`input ${errors.city ? "border-red-400" : ""}`}
                    placeholder="Mumbai"
                  />
                  <FieldError msg={errors.city} />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className={`input ${errors.pincode ? "border-red-400" : ""}`}
                    placeholder="400001"
                    maxLength={6}
                  />
                  <FieldError msg={errors.pincode} />
                </div>
                <div className="sm:col-span-2">
                  <Label>State</Label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className={`input ${errors.state ? "border-red-400" : ""}`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.state} />
                </div>
              </div>
            </FormSection>  
            */}                
          </div>
           

          {/* Right: Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm sticky top-20 sm:top-24">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="font-display font-semibold text-lg sm:text-xl text-navy-800">
                  Order Summary
                </h2>
              </div>
              <div className="p-4 sm:p-6 max-h-64 sm:max-h-80 overflow-y-auto space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} PAC × ₹{formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-navy-700 flex-shrink-0">
                      ₹{formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-100 space-y-2 sm:space-y-3">
                <Row
                  label="Subtotal"
                  value={`₹${formatCurrency(cartTotal)}`}
                />
                <div className="border-t border-gray-100 pt-2 sm:pt-3 flex justify-between font-bold">
                  <span className="font-display text-base sm:text-lg text-navy-800">
                    Total
                  </span>
                  <span className="font-display text-lg sm:text-xl text-navy-700">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6 pt-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60"
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {loading ? "Placing Order..." : "Place Order via WhatsApp"}
                </button>
                <p className="text-xs text-center text-gray-400 mt-2 sm:mt-3">
                  Invoice PDF auto-sent to your WhatsApp
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;
const Label = ({ children }) => (
  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5 flex items-center gap-1">
    {children}
  </label>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
const FormSection = ({ title, step, children }) => (
  <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
    <h2 className="font-display font-semibold text-base sm:text-xl text-navy-800 mb-4 sm:mb-5 flex items-center gap-2">
      <span className="w-7 h-7 sm:w-8 sm:h-8 bg-navy-100 text-navy-700 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
        {step}
      </span>
      {title}
    </h2>
    {children}
  </div>
);
const Spinner = () => (
  <svg
    className="animate-spin w-4 h-4 sm:w-5 sm:h-5"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);
const WhatsAppIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);
