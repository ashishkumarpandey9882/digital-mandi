import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Register from "./pages/Register";

import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";

import AddCrop from "./pages/AddCrop";
import MyProducts from "./pages/MyProducts";
import EditProduct from "./pages/EditProduct";
import FarmerOrders from "./pages/FarmerOrders";

import ProductDetails from "./pages/ProductDetails";
import PlaceOrder from "./pages/PlaceOrder";
import BuyerOrders from "./pages/BuyerOrders";

// New feature pages
import MspRates from "./pages/MspRates";
import FarmerSupport from "./pages/FarmerSupport";
import GovernmentSchemes from "./pages/GovernmentSchemes";

import { AuthProvider } from "./context/AuthContext";
import AIAssistant from "./pages/AIAssistant";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          {/* PUBLIC ROUTES */}

          <Route path="/" element={<Home />} />

          <Route path="/products" element={<Products />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/product/:id" element={<ProductDetails />} />

          {/* NEW FEATURE ROUTES */}

          <Route path="/msp-rates" element={<MspRates />} />

          <Route
            path="/farmer-support"
            element={<FarmerSupport />}
          />

          <Route
            path="/schemes"
            element={<GovernmentSchemes />}
          />

          {/* FARMER ROUTES */}

          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute role="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-crop"
            element={
              <ProtectedRoute role="farmer">
                <AddCrop />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-products"
            element={
              <ProtectedRoute role="farmer">
                <MyProducts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-product/:id"
            element={
              <ProtectedRoute role="farmer">
                <EditProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer-orders"
            element={
              <ProtectedRoute role="farmer">
                <FarmerOrders />
              </ProtectedRoute>
            }
          />

          {/* BUYER ROUTES */}

          <Route
            path="/buyer-dashboard"
            element={
              <ProtectedRoute role="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/buyer-orders"
            element={
              <ProtectedRoute role="buyer">
                <BuyerOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/place-order/:id"
            element={
              <ProtectedRoute role="buyer">
                <PlaceOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
              <AIAssistant />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;