
import { useEffect, useState } from "react";
import api from "../services/api";
import "./FarmerOrders.css";

function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // ================= FETCH ORDERS =================
  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/orders/farmer-orders");

      console.log("Farmer Orders:", response.data);

      setOrders(
        response.data.orders ||
          response.data.data ||
          []
      );
    } catch (error) {
      console.error("Failed to fetch farmer orders:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= ACCEPT ORDER =================
  const handleAccept = async (orderId) => {
    try {
      setActionLoading(orderId);
      setError("");

      await api.put(`/orders/${orderId}/accept`);

      await fetchOrders();
    } catch (error) {
      console.error("Accept order failed:", error);

      setError(
        error.response?.data?.message ||
          "Failed to accept order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= REJECT ORDER =================
  const handleReject = async (orderId) => {
    try {
      setActionLoading(orderId);
      setError("");

      await api.put(`/orders/${orderId}/reject`);

      await fetchOrders();
    } catch (error) {
      console.error("Reject order failed:", error);

      setError(
        error.response?.data?.message ||
          "Failed to reject order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= ORDER STATUS CLASS =================
  const getStatusClass = (status) => {
    return `farmer-order-status ${
      status?.toLowerCase() || "pending"
    }`;
  };

  // ================= PAYMENT STATUS =================
  const getPaymentStatus = (order) => {
    const rawStatus =
      order.paymentStatus ??
      order.payment?.status ??
      order.payment?.paymentStatus ??
      "";

    const status = String(rawStatus).toLowerCase();

    if (
      [
        "paid",
        "completed",
        "success",
        "successful",
        "captured",
      ].includes(status)
    ) {
      return {
        label: "✓ Paid",
        className: "payment-done",
      };
    }

    if (
      ["failed", "failure"].includes(status)
    ) {
      return {
        label: "✕ Failed",
        className: "payment-failed",
      };
    }

    if (
      ["refunded", "refund"].includes(status)
    ) {
      return {
        label: "Refunded",
        className: "payment-refunded",
      };
    }

    return {
      label: "⏳ Pending",
      className: "payment-pending",
    };
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="farmer-orders-page">
        <div className="farmer-orders-loading">
          <div className="farmer-orders-spinner"></div>

          <h2>Loading orders...</h2>

          <p>Please wait while we fetch your orders.</p>
        </div>
      </div>
    );
  }

  // ================= STATS =================
  const pendingOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() === "pending"
  ).length;

  const acceptedOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() === "accepted"
  ).length;

  const rejectedOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() === "rejected"
  ).length;

  // ================= UI =================
  return (
    <div className="farmer-orders-page">
      {/* HEADER */}
      <div className="farmer-orders-header">
        <div>
          <span className="farmer-orders-eyebrow">
            FARMER PANEL
          </span>

          <h1>Customer Orders 📦</h1>

          <p>
            Review buyer orders and manage your incoming
            requests.
          </p>
        </div>

        <button
          className="farmer-orders-refresh"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="farmer-orders-error">
          <span>⚠️</span>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button onClick={() => fetchOrders(true)}>
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      {!error && (
        <div className="farmer-orders-stats">
          <div className="farmer-order-stat">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="farmer-order-stat">
            <span>Pending</span>
            <strong>{pendingOrders}</strong>
          </div>

          <div className="farmer-order-stat">
            <span>Accepted</span>
            <strong>{acceptedOrders}</strong>
          </div>

          <div className="farmer-order-stat">
            <span>Rejected</span>
            <strong>{rejectedOrders}</strong>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!error && orders.length === 0 && (
        <div className="farmer-orders-empty">
          <div className="farmer-orders-empty-icon">
            📦
          </div>

          <h2>No Orders Yet</h2>

          <p>
            When buyers place orders for your crops,
            they will appear here.
          </p>
        </div>
      )}

      {/* ORDERS */}
      {!error && orders.length > 0 && (
        <div className="farmer-orders-list">
          {orders.map((order) => {
            const product = order.product || {};

            const cropName =
              product.cropName ||
              order.cropName ||
              "Agricultural Product";

            const quantity = order.quantity || 0;

            const mspPrice =
              order.mspPrice ||
              product.currentMsp?.price ||
              0;

            const distance = order.distance || 0;

            const totalAmount = order.totalAmount || 0;

            const status =
              order.status?.toLowerCase() || "pending";

            const payment = getPaymentStatus(order);

            const isProcessing =
              actionLoading === order._id;

            return (
              <div
                className="farmer-order-card"
                key={order._id}
              >
                {/* ORDER HEADER */}
                <div className="farmer-order-top">
                  <div className="farmer-order-product">
                    <div className="farmer-order-icon">
                      {cropName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <span>PRODUCT</span>

                      <h2>{cropName}</h2>

                      <p>Order ID: {order._id}</p>
                    </div>
                  </div>

                  <div className={getStatusClass(status)}>
                    {status}
                  </div>
                </div>

                {/* ORDER DETAILS */}
                <div className="farmer-order-details">
                  <div>
                    <span>Quantity</span>
                    <strong>{quantity} units</strong>
                  </div>

                  <div>
                    <span>MSP Price</span>
                    <strong>
                      ₹
                      {Number(mspPrice).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Distance</span>
                    <strong>
                      {Number(distance).toFixed(2)} km
                    </strong>
                  </div>

                  <div>
                    <span>Order Amount</span>
                    <strong>
                      ₹
                      {Number(totalAmount).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                </div>

                {/* BUYER DETAILS */}
                <div className="farmer-order-buyer">
                  <div>
                    <span>BUYER</span>
                    <strong>
                      {order.buyer?.name || "Buyer"}
                    </strong>
                  </div>

                  <div>
                    <span>EMAIL</span>
                    <strong>
                      {order.buyer?.email || "—"}
                    </strong>
                  </div>
                </div>

                {/* ACCEPT / REJECT ACTIONS */}
                {status === "pending" && (
                  <div className="farmer-order-actions">
                    <button
                      className="reject-order-btn"
                      onClick={() => handleReject(order._id)}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Reject Order"}
                    </button>

                    <button
                      className="accept-order-btn"
                      onClick={() => handleAccept(order._id)}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Accept Order"}
                    </button>
                  </div>
                )}

                {/* ACCEPTED ORDER + PAYMENT STATUS */}
                {status === "accepted" && (
                  <div className="farmer-order-message accepted-message">
                    <p>
                      ✅ This order has been accepted.
                    </p>

                    <div className="payment-status-row">
                      <strong>Payment Status</strong>

                      <span
                        className={`payment-status ${payment.className}`}
                      >
                        {payment.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* REJECTED ORDER */}
                {status === "rejected" && (
                  <div className="farmer-order-message rejected-message">
                    ❌ This order has been rejected.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FarmerOrders;
