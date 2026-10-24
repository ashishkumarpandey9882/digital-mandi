
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import BackButton from "../components/BackButton";
import "./PlaceOrder.css";

function PlaceOrder() {
  const location = useLocation();
  const navigate = useNavigate();

  const { product, quantity } = location.state || {};

  const [deliveryLocation, setDeliveryLocation] = useState({
    latitude: "",
    longitude: "",
  });

  const [distanceData, setDistanceData] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // PRODUCT CHECK
  if (!product) {
    return (
      <div className="place-order-message">
        <div className="place-order-message-back">
          <BackButton
            fallback="/products"
            label="Back to Marketplace"
          />
        </div>

        <h2>Order information not found</h2>

        <button onClick={() => navigate("/products")}>
          Back to Marketplace
        </button>
      </div>
    );
  }

  // PRODUCT DATA
  const mspPrice = Number(product.currentMsp?.price || 0);
  const orderQuantity = Number(quantity || 0);
  const availableQuantity = Number(product.quantity || 0);
  const cropAmount = orderQuantity * mspPrice;

  // VALIDATE QUANTITY
  const validateQuantity = () => {
    if (orderQuantity <= 0) {
      setError("Order quantity must be greater than 0.");
      return false;
    }

    if (orderQuantity > availableQuantity) {
      setError(`Only ${availableQuantity} units are available.`);
      return false;
    }

    return true;
  };

  // VALIDATE LOCATION
  const validateLocation = () => {
    const latitude = Number(deliveryLocation.latitude);
    const longitude = Number(deliveryLocation.longitude);

    if (
      deliveryLocation.latitude === "" ||
      deliveryLocation.longitude === ""
    ) {
      setError("Please enter both latitude and longitude.");
      return false;
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setError("Please enter valid latitude and longitude.");
      return false;
    }

    if (latitude < -90 || latitude > 90) {
      setError("Latitude must be between -90 and 90.");
      return false;
    }

    if (longitude < -180 || longitude > 180) {
      setError("Longitude must be between -180 and 180.");
      return false;
    }

    return true;
  };

  // CALCULATE DELIVERY DISTANCE
  const calculateOrderDistance = async () => {
    setError("");
    setSuccess("");

    if (!validateQuantity()) return;
    if (!validateLocation()) return;

    try {
      setLoadingDistance(true);

      const response = await api.post(
        "/orders/calculate-distance",
        {
          productId: product._id,
          deliveryLocation: {
            latitude: Number(deliveryLocation.latitude),
            longitude: Number(deliveryLocation.longitude),
          },
        }
      );

      console.log("Distance response:", response.data);
      setDistanceData(response.data);
    } catch (error) {
      console.error("Distance calculation failed:", error);

      setDistanceData(null);

      setError(
        error.response?.data?.message ||
          "Unable to calculate delivery cost."
      );
    } finally {
      setLoadingDistance(false);
    }
  };

  // HANDLE LOCATION CHANGE
  const handleChange = (e) => {
    setDeliveryLocation({
      ...deliveryLocation,
      [e.target.name]: e.target.value,
    });

    setDistanceData(null);
    setError("");
    setSuccess("");
  };

  // PLACE ORDER
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateQuantity()) return;
    if (!validateLocation()) return;

    if (!distanceData) {
      setError(
        "Please calculate delivery cost before placing the order."
      );
      return;
    }

    try {
      setLoadingOrder(true);

      const response = await api.post("/orders", {
        productId: product._id,
        quantity: orderQuantity,
        deliveryLocation: {
          latitude: Number(deliveryLocation.latitude),
          longitude: Number(deliveryLocation.longitude),
        },
      });

      console.log("Order placed:", response.data);

      setSuccess("Order placed successfully!");

      setTimeout(() => {
        navigate("/buyer-orders");
      }, 1200);
    } catch (error) {
      console.error("Failed to place order:", error);

      setError(
        error.response?.data?.message ||
          "Failed to place order."
      );
    } finally {
      setLoadingOrder(false);
    }
  };

  // CALCULATED VALUES
  const distance = distanceData?.distance || 0;
  const transportationCost =
    distanceData?.transportationCost || 0;
  const buyerTransportShare =
    distanceData?.buyerTransportShare || 0;
  const finalAmount = cropAmount + buyerTransportShare;

  // UI
  return (
    <div className="place-order-page">
      {/* BACK BUTTON */}
      <div className="place-order-back-row">
        <BackButton
          fallback={`/product/${product._id}`}
          label="Back to Product"
        />
      </div>

      <div className="place-order-container">
        {/* HEADER */}
        <div className="place-order-header">
          <p>BUYER PANEL</p>

          <h1>Place Your Order 🛒</h1>

          <span>
            Review your order details before placing the order.
          </span>
        </div>

        <div className="place-order-grid">
          {/* PRODUCT SUMMARY */}
          <div className="order-product-card">
            <div className="order-product-icon">
              {product.cropName?.charAt(0)}
            </div>

            <div className="order-product-details">
              <span>PRODUCT</span>

              <h2>{product.cropName}</h2>

              <p>
                📍 {product.district}, {product.state}
              </p>

              <div className="order-product-info">
                <div>
                  <span>Quantity</span>
                  <strong>{orderQuantity} units</strong>
                </div>

                <div>
                  <span>Available</span>
                  <strong>{availableQuantity} units</strong>
                </div>

                <div>
                  <span>MSP Price</span>
                  <strong>₹{mspPrice.toLocaleString("en-IN")}</strong>
                </div>

                <div>
                  <span>MSP Unit</span>
                  <strong>
                    {product.currentMsp?.unit || "quintal"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER FORM */}
          <form
            className="place-order-form"
            onSubmit={handleSubmit}
          >
            {/* DELIVERY LOCATION */}
            <div className="form-section">
              <h2>Delivery Location 📍</h2>

              <p>
                Enter your delivery coordinates.
                Transportation cost will be calculated based
                on the distance from the farmer.
              </p>

              <div className="location-fields">
                <div className="form-field">
                  <label>Latitude</label>

                  <input
                    type="number"
                    name="latitude"
                    value={deliveryLocation.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 29.1492"
                    step="any"
                    min="-90"
                    max="90"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Longitude</label>

                  <input
                    type="number"
                    name="longitude"
                    value={deliveryLocation.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 75.7217"
                    step="any"
                    min="-180"
                    max="180"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                className="calculate-distance-button"
                onClick={calculateOrderDistance}
                disabled={loadingDistance}
              >
                {loadingDistance
                  ? "Calculating..."
                  : "Calculate Delivery Cost"}
              </button>
            </div>

            {/* ORDER SUMMARY */}
            <div className="price-summary">
              <h2>Order Summary</h2>

              <div className="price-row">
                <span>Crop Amount</span>
                <strong>
                  ₹{cropAmount.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="price-row">
                <span>Distance</span>
                <strong>
                  {distanceData ? `${distance} km` : "—"}
                </strong>
              </div>

              <div className="price-row">
                <span>Transportation</span>
                <strong>
                  {distanceData
                    ? `₹${transportationCost.toLocaleString("en-IN")}`
                    : "—"}
                </strong>
              </div>

              <div className="price-row">
                <span>Your Transport Share</span>
                <strong>
                  {distanceData
                    ? `₹${buyerTransportShare.toLocaleString("en-IN")}`
                    : "—"}
                </strong>
              </div>

              <div className="price-divider"></div>

              <div className="price-row total-row">
                <span>Final Amount</span>
                <strong>
                  {distanceData
                    ? `₹${finalAmount.toLocaleString("en-IN")}`
                    : "Calculate Delivery Cost"}
                </strong>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="place-order-error">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="place-order-success">
                {success}
              </div>
            )}

            {/* PLACE ORDER BUTTON */}
            <button
              type="submit"
              className="place-order-button"
              disabled={loadingOrder || !distanceData}
            >
              {loadingOrder
                ? "Placing Order..."
                : "Place Order →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PlaceOrder;
