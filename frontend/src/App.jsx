import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AdminPage from './pages/AdminPage';
import ProductDetailPage from './pages/ProductDetailPage';

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <CartSidebar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/"              element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/product/:id"   element={<MainLayout><ProductDetailPage /></MainLayout>} />
          <Route path="/checkout"      element={<MainLayout><CheckoutPage /></MainLayout>} />
          <Route path="/order-success" element={<MainLayout><OrderSuccessPage /></MainLayout>} />
          <Route path="/admin"         element={<AdminPage />} />
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
      </BrowserRouter>
    </CartProvider>
  );
}
