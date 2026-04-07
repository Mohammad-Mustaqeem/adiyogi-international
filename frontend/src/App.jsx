import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import CartSidebar from "@/components/CartSidebar";
import CartBar from "@/components/CartBar";
import Footer from "@/components/Footer";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("@/pages/OrderSuccessPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <CartSidebar />
      {children}
      <CartBar />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
              <Route path="/product/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />
              <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
              <Route path="/order-success" element={<MainLayout><OrderSuccessPage /></MainLayout>} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={
                <MainLayout>
                  <div className="min-h-screen flex items-center justify-center pt-20">
                    <div className="text-center">
                      <div className="text-8xl mb-4">404</div>
                      <h2 className="font-display font-bold text-3xl text-gray-700 mb-4">Page not found</h2>
                      <a href="/" className="btn-primary inline-block">Go Home</a>
                    </div>
                  </div>
                </MainLayout>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  );
}
