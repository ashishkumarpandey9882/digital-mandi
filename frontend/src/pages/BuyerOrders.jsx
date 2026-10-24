import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import api from "../services/api";
import "./BuyerOrders.css";

function BuyerOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [payingOrderId, setPayingOrderId] = useState(null);

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ================= FETCH ORDERS =================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/my-orders");

      setOrders(
        response.data.orders ||
          response.data.data ||
          []
      );
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= RAZORPAY PAYMENT =================

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });

  const handlePayment = async (order) => {
    setPaymentError("");
    setPayingOrderId(order._id);

    try {
      const sdkLoaded = await loadRazorpayScript();

      if (!sdkLoaded) {
        throw new Error(
          "Unable to load Razorpay Checkout. Check your internet connection and try again."
        );
      }

      const createResponse = await api.post(
        `/payments/create-order/${order._id}`
      );

      const payment = createResponse.data.payment;

      if (!payment?.keyId || !payment?.gatewayOrderId) {
        throw new Error(
          "Payment setup response is incomplete. Please check the backend configuration."
        );
      }

      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Digital Mandi",
        description: `Payment for ${
          order.product?.cropName ||
          order.cropName ||
          "agricultural order"
        }`,
        order_id: payment.gatewayOrderId,

        notes: {
          digitalMandiOrderId: order._id,
        },

        handler: async (checkoutResponse) => {
          try {
            const verifyResponse = await api.post(
              "/payments/verify",
              {
                orderId: order._id,
                razorpay_order_id:
                  checkoutResponse.razorpay_order_id,
                razorpay_payment_id:
                  checkoutResponse.razorpay_payment_id,
                razorpay_signature:
                  checkoutResponse.razorpay_signature,
              }
            );

            if (verifyResponse.data.success) {
              window.alert("Payment verified successfully!");
              await fetchOrders();
            } else {
              setPaymentError(
                verifyResponse.data.message ||
                  "Payment verification failed."
              );
            }
          } catch (verificationError) {
            console.error(
              "Payment verification failed:",
              verificationError
            );

            setPaymentError(
              verificationError.response?.data?.message ||
                "Payment was submitted, but verification failed. Refresh your orders before retrying."
            );
          } finally {
            setPayingOrderId(null);
          }
        },

        modal: {
          ondismiss: () => setPayingOrderId(null),
        },

        theme: {
          color: "#166534",
        },
      });

      checkout.on("payment.failed", (event) => {
        console.error(
          "Razorpay payment failed:",
          event.error
        );

        setPaymentError(
          event.error?.description ||
            "Payment failed. Please try again."
        );

        setPayingOrderId(null);
      });

      checkout.open();
    } catch (paymentRequestError) {
      console.error(
        "Unable to initiate payment:",
        paymentRequestError
      );

      setPaymentError(
        paymentRequestError.response?.data?.message ||
          paymentRequestError.message ||
          "Unable to start payment. Please try again."
      );

      setPayingOrderId(null);
    }
  };

  // ================= HELPERS =================

  const getStatusClass = (status) =>
    `order-status ${status?.toLowerCase() || "pending"}`;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCropName = (order) =>
    order.product?.cropName ||
    order.cropName ||
    "Agricultural Product";

  const getPaymentStatus = (order) =>
    String(
      order.payment?.status ||
        order.paymentStatus ||
        "pending"
    ).toLowerCase();

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  // ================= SEARCH AND FILTER =================

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const cropName = getCropName(order).toLowerCase();
      const orderId = String(order._id || "").toLowerCase();

      const matchesSearch =
        !query ||
        orderId.includes(query) ||
        cropName.includes(query);

      const orderStatus = String(
        order.status || "pending"
      ).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        orderStatus === statusFilter;

      const paymentStatus = getPaymentStatus(order);

      const matchesPayment =
        paymentFilter === "all" ||
        paymentStatus === paymentFilter;

      let matchesStartDate = true;
      let matchesEndDate = true;

      if (startDate || endDate) {
        if (!order.createdAt) {
          matchesStartDate = false;
          matchesEndDate = false;
        } else {
          const createdDate = new Date(order.createdAt);

          if (Number.isNaN(createdDate.getTime())) {
            matchesStartDate = false;
            matchesEndDate = false;
          } else {
            const orderDate = [
              createdDate.getFullYear(),
              String(createdDate.getMonth() + 1).padStart(2, "0"),
              String(createdDate.getDate()).padStart(2, "0"),
            ].join("-");

            if (startDate) {
              matchesStartDate = orderDate >= startDate;
            }

            if (endDate) {
              matchesEndDate = orderDate <= endDate;
            }
          }
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
    startDate,
    endDate,
  ]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  // ================= STATISTICS =================

  const pendingOrders = orders.filter(
    (order) => order.status?.toLowerCase() === "pending"
  ).length;

  const acceptedOrders = orders.filter(
    (order) => order.status?.toLowerCase() === "accepted"
  ).length;

  const totalOrderValue = orders.reduce(
    (total, order) =>
      total + Number(order.totalAmount || 0),
    0
  );

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="buyer-orders-page">
        <div className="buyer-orders-back-row">
          <BackButton
            fallback="/buyer-dashboard"
            label="Back to Dashboard"
          />
        </div>

        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <h2>Loading your orders...</h2>
          <p>Please wait while we fetch your order history.</p>
        </div>
      </div>
    );
  }

  // ================= MAIN PAGE =================

  return (
    <div className="buyer-orders-page">

      {/* BACK BUTTON */}

      <div className="buyer-orders-back-row">
        <BackButton
          fallback="/buyer-dashboard"
          label="Back to Dashboard"
        />
      </div>

      {/* HEADER */}

      <div className="buyer-orders-header">
        <div>
          <span className="orders-eyebrow">BUYER PANEL</span>
          <h1>My Orders 📦</h1>
          <p>
            Track your purchases and view complete order details.
          </p>
        </div>

        <button
          className="orders-marketplace-btn"
          onClick={() => navigate("/products")}
        >
          ← Continue Shopping
        </button>
      </div>

      {/* ORDER FETCH ERROR */}

      {error && (
        <div className="orders-error">
          <span>⚠️</span>

          <div>
            <strong>Unable to load orders</strong>
            <p>{error}</p>
          </div>

          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {/* PAYMENT ERROR */}

      {paymentError && (
        <div
          className="orders-error payment-error"
          role="alert"
        >
          <span>⚠️</span>

          <div>
            <strong>Payment update</strong>
            <p>{paymentError}</p>
          </div>

          <button onClick={() => setPaymentError("")}>
            Dismiss
          </button>
        </div>
      )}

      {/* STATISTICS */}

      {!error && (
        <div className="orders-stats">
          <div className="order-stat-card">
            <div className="stat-icon">📦</div>
            <div>
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>
          </div>

          <div className="order-stat-card">
            <div className="stat-icon">⏳</div>
            <div>
              <span>Pending</span>
              <strong>{pendingOrders}</strong>
            </div>
          </div>

          <div className="order-stat-card">
            <div className="stat-icon">✅</div>
            <div>
              <span>Accepted</span>
              <strong>{acceptedOrders}</strong>
            </div>
          </div>

          <div className="order-stat-card">
            <div className="stat-icon">₹</div>
            <div>
              <span>Total Order Value</span>
              <strong>₹{formatAmount(totalOrderValue)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* NO ORDERS */}

      {!error && orders.length === 0 && (
        <div className="orders-empty">
          <div className="empty-icon">🛒</div>
          <h2>No Orders Yet</h2>

          <p>
            You haven't placed any orders yet. Explore the marketplace
            and find products directly from farmers.
          </p>

          <button onClick={() => navigate("/products")}>
            Explore Marketplace →
          </button>
        </div>
      )}

      {/* ORDER HISTORY */}

      {!error && orders.length > 0 && (
        <div className="orders-list">
          <div className="orders-list-heading">
            <div>
              <span>ORDER HISTORY</span>
              <h2>Your Purchases</h2>
            </div>

            <button onClick={fetchOrders} disabled={loading}>
              ↻ Refresh
            </button>
          </div>

          {/* FILTER PANEL */}

          <div className="buyer-order-filters">
            <div className="buyer-filter-search">
              <label htmlFor="buyer-order-search">
                Search orders
              </label>

              <input
                id="buyer-order-search"
                type="search"
                placeholder="Search order ID or crop..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="buyer-filter-field">
              <label htmlFor="buyer-order-status">
                Order status
              </label>

              <select
                id="buyer-order-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="buyer-filter-field">
              <label htmlFor="buyer-payment-status">
                Payment status
              </label>

              <select
                id="buyer-payment-status"
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(event.target.value)
                }
              >
                <option value="all">All payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="buyer-filter-field">
              <label htmlFor="buyer-order-start-date">
                From date
              </label>

              <input
                id="buyer-order-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="buyer-filter-field">
              <label htmlFor="buyer-order-end-date">
                To date
              </label>

              <input
                id="buyer-order-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>

            <button
              type="button"
              className="buyer-clear-filters"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>

            <p
              className="buyer-filter-count"
              aria-live="polite"
            >
              Showing <strong>{filteredOrders.length}</strong> of{" "}
              <strong>{orders.length}</strong> orders
            </p>
          </div>

          {/* NO FILTER MATCHES */}

          {filteredOrders.length === 0 && (
            <div className="buyer-filter-empty">
              <div>🔎</div>
              <h3>No matching orders found</h3>

              <p>
                Try changing your search or adjusting the filters.
              </p>

              <button onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          )}

          {/* ORDER CARDS */}

          {filteredOrders.map((order) => {
            const cropName = getCropName(order);
            const quantity = order.quantity || 0;

            const mspPrice =
              order.mspPrice ||
              order.price ||
              order.product?.currentMsp?.price ||
              0;

            const distance = order.distance || 0;

            const transportationCost =
              order.transportationCost ||
              order.transportCost ||
              0;

            const buyerTransportShare =
              order.buyerTransportShare || 0;

            const totalAmount = order.totalAmount || 0;

            const status =
              order.status?.toLowerCase() || "pending";

            const paymentStatus = getPaymentStatus(order);

            return (
              <div
                className="buyer-order-card"
                key={order._id}
              >
                {/* ORDER HEADER */}

                <div className="buyer-order-top">
                  <div className="buyer-order-product">
                    <div className="order-crop-icon">
                      {cropName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <span>PRODUCT</span>
                      <h3>{cropName}</h3>
                      <p>Order ID: {order._id}</p>
                    </div>
                  </div>

                  <div className={getStatusClass(status)}>
                    {status}
                  </div>
                </div>

                {/* ORDER DETAILS */}

                <div className="buyer-order-details">
                  <div className="order-detail">
                    <span>Quantity</span>
                    <strong>{quantity} units</strong>
                  </div>

                  <div className="order-detail">
                    <span>MSP Price</span>
                    <strong>₹{formatAmount(mspPrice)}</strong>
                  </div>

                  <div className="order-detail">
                    <span>Distance</span>
                    <strong>
                      {Number(distance).toFixed(2)} km
                    </strong>
                  </div>

                  <div className="order-detail">
                    <span>Transport Cost</span>
                    <strong>
                      ₹{formatAmount(transportationCost)}
                    </strong>
                  </div>

                  <div className="order-detail">
                    <span>Your Transport Share</span>
                    <strong>
                      ₹{formatAmount(buyerTransportShare)}
                    </strong>
                  </div>

                  <div className="order-detail">
                    <span>Order Date</span>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </div>
                </div>

                {/* ORDER TOTAL AND PAYMENT */}

                <div className="buyer-order-bottom">
                  <div>
                    <span>FINAL AMOUNT</span>
                    <strong>
                      ₹{formatAmount(totalAmount)}
                    </strong>
                  </div>

                  <div className="order-info">
                    {status === "pending" &&
                      "⏳ Waiting for farmer approval"}

                    {status === "accepted" &&
                      "✅ Order accepted by farmer"}

                    {status === "rejected" &&
                      "❌ Order rejected by farmer"}
                  </div>

                  <div className="order-payment-actions">
                    {paymentStatus === "paid" ? (
                      <span className="payment-status-paid">
                        ✓ Payment completed
                      </span>
                    ) : status === "accepted" ? (
                      <button
                        className="pay-now-btn"
                        onClick={() => handlePayment(order)}
                        disabled={payingOrderId !== null}
                      >
                        {payingOrderId === order._id
                          ? "Opening checkout..."
                          : `Pay ₹${formatAmount(totalAmount)}`}
                      </button>
                    ) : status === "pending" ? (
                      <span className="payment-status-note">
                        Payment available after farmer approval
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BuyerOrders;