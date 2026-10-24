
import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isLoggedIn } = useAuth();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(
    Number(location.state?.quantity) || 1
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH PRODUCT
  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/products/${id}`);

      setProduct(response.data.product);
    } catch (error) {
      console.error("Failed to fetch product:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH EFFECT
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // LOADING
  if (loading) {
    return (
      <div className="product-details-message">
        <div className="product-message-back">
          <BackButton
            fallback="/products"
            label="Back to Marketplace"
          />
        </div>

        <div className="product-loading-icon">🌾</div>

        <h2>Loading Product</h2>

        <p>Fetching product details...</p>
      </div>
    );
  }

  // ERROR
  if (error && !product) {
    return (
      <div className="product-details-message error">
        <div className="product-message-back">
          <BackButton
            fallback="/products"
            label="Back to Marketplace"
          />
        </div>

        <div className="product-loading-icon">⚠️</div>

        <h2>Unable to Load Product</h2>

        <p>{error}</p>

        <div className="product-error-actions">
          <button
            className="product-retry-button"
            onClick={fetchProduct}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // PRODUCT NOT FOUND
  if (!product) {
    return (
      <div className="product-details-message error">
        <div className="product-message-back">
          <BackButton
            fallback="/products"
            label="Back to Marketplace"
          />
        </div>

        <div className="product-loading-icon">🔍</div>

        <h2>Product Not Found</h2>

        <p>
          This product may have been removed or is no longer
          available.
        </p>
      </div>
    );
  }

  // PRODUCT DATA
  const mspPrice = Number(product.currentMsp?.price || 0);
  const maxQuantity = Number(product.quantity || 0);
  const cropAmount = Number(quantity) * mspPrice;

  // QUANTITY CHANGE
  const handleQuantityChange = (e) => {
    const value = Number(e.target.value);

    if (value < 1) {
      setQuantity(1);
      return;
    }

    if (value > maxQuantity) {
      setQuantity(maxQuantity);
      return;
    }

    setQuantity(value);
  };

  // BUY NOW
  const handleBuyNow = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (user?.role !== "buyer") {
      setError("Only buyers can place orders.");
      return;
    }

    if (quantity <= 0) {
      setError("Please select a valid quantity.");
      return;
    }

    if (quantity > maxQuantity) {
      setError("Requested quantity is not available.");
      return;
    }

    setError("");

    navigate(`/place-order/${product._id}`, {
      state: {
        product,
        quantity,
      },
    });
  };

  // UI
  return (
    <div className="product-details-page">
      {/* BACK BUTTON */}
      <div className="product-details-back-row">
        <BackButton
          fallback="/products"
          label="Back to Marketplace"
        />
      </div>

      {/* PRODUCT */}
      <div className="product-details-container">
        {/* IMAGE */}
        <div className="product-details-image">
          <span>{product.cropName?.charAt(0)}</span>
          <p>Agricultural Produce</p>
        </div>

        {/* CONTENT */}
        <div className="product-details-content">
          {/* TOP */}
          <div className="product-details-top">
            <div>
              <p className="product-details-label">
                DIGITAL MANDI
              </p>

              <h1>{product.cropName}</h1>

              <p className="product-details-location">
                📍 {product.district}, {product.state}
              </p>
            </div>

            <span className="product-details-status">
              {product.status}
            </span>
          </div>

          {/* PRODUCT INFO */}
          <div className="product-details-info">
            <div>
              <span>Available Quantity</span>
              <strong>{product.quantity} units</strong>
            </div>

            <div>
              <span>Current MSP</span>
              <strong>
                ₹{mspPrice.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>MSP Unit</span>
              <strong>
                {product.currentMsp?.unit || "quintal"}
              </strong>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="product-description">
            <h2>About this Product</h2>

            <p>
              {product.description ||
                "Quality agricultural produce listed directly by the farmer."}
            </p>
          </div>

          {/* FARMER */}
          <div className="farmer-details">
            <div className="farmer-details-icon">👨‍🌾</div>

            <div>
              <span>Listed by Farmer</span>

              <strong>
                {product.farmer?.name || "Farmer"}
              </strong>

              <p>
                {product.farmer?.district || product.district},{" "}
                {product.farmer?.state || product.state}
              </p>
            </div>
          </div>

          {/* BUY SECTION */}
          <div className="buy-section">
            <div className="quantity-section">
              <label>Quantity</label>

              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={maxQuantity <= 0}
              />
            </div>

            <div className="order-price">
              <span>Estimated Crop Amount</span>

              <strong>
                ₹{cropAmount.toLocaleString("en-IN")}
              </strong>
            </div>

            <button
              className="buy-now-button"
              onClick={handleBuyNow}
              disabled={
                product.status !== "available" ||
                maxQuantity <= 0
              }
            >
              {product.status === "available"
                ? "Proceed to Order →"
                : "Product Unavailable"}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="product-details-error">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
