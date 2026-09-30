import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen">
            <Navbar />
            <main>
              <Routes>
                {/* Public - browsing the catalog needs no account */}
                <Route path="/" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Private - the API rejects these without a token anyway */}
                <Route
                  path="/products/new"
                  element={
                    <ProtectedRoute>
                      <ProductForm mode="create" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products/:id/edit"
                  element={
                    <ProtectedRoute>
                      <ProductForm mode="edit" />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
