import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import api from "../services/api";
import "./FarmerOrders.css";

function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

      setOrders(
        response.data.orders ||
          response.data.data ||
          []
      );
    } catch (err) {
      console.error("Failed to fetch farmer orders:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load orders. Please try again."
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
        value: "paid",
        label: "✓ Paid",
        className: "payment-done",
      };
    }

    if (["failed", "failure"].includes(status)) {
      return {
        value: "failed",
        label: "✕ Failed",
        className: "payment-failed",
      };
    }

    if (["refunded", "refund"].includes(status)) {
      return {
        value: "refunded",
        label: "Refunded",
        className: "payment-refunded",
      };
    }

    return {
      value: "pending",
      label: "Pending",
      className: "payment-pending",
    };
  };

  // ================= FILTER ORDERS =================
  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const product = order.product || {};

      const cropName =
        product.cropName ||
        order.cropName ||
        "Agricultural Product";

      const orderId = String(order._id || "").toLowerCase();

      const buyerName = String(
        order.buyer?.name || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        orderId.includes(query) ||
        String(cropName).toLowerCase().includes(query) ||
        buyerName.includes(query);

      const status = String(
        order.status || "pending"
      ).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const paymentStatus = getPaymentStatus(order).value;

      const matchesPayment =
        paymentFilter === "all" ||
        paymentStatus === paymentFilter;

      const orderDate = order.createdAt
        ? new Date(order.createdAt)
        : null;

      const validDate =
        orderDate &&
        !Number.isNaN(orderDate.getTime());

      const matchesStartDate =
        !startDate ||
        (
          validDate &&
          orderDate >= new Date(`${startDate}T00:00:00`)
        );

      const matchesEndDate =
        !endDate ||
        (
          validDate &&
          orderDate <= new Date(`${endDate}T23:59:59.999`)
        );

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
    searchTerm,
    statusFilter,
    paymentFilter,
    startDate,
    endDate,
  ]);

  // ================= CLEAR FILTERS =================
  const clearOrderFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // ================= ACCEPT ORDER =================
  const handleAccept = async (orderId) => {
    try {
      setActionLoading(orderId);
      setError("");

      await api.put(`/orders/${orderId}/accept`);

      await fetchOrders(true);
    } catch (err) {
      console.error("Accept order failed:", err);

      setError(
        err.response?.data?.message ||
          "Failed to accept order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= REJECT ORDER =================
  const handleReject = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this order?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(orderId);
      setError("");

      await api.put(`/orders/${orderId}/reject`);

      await fetchOrders(true);
    } catch (err) {
      console.error("Reject order failed:", err);

      setError(
        err.response?.data?.message ||
          "Failed to reject order."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ================= STATUS CLASS =================
  const getStatusClass = (status) => {
    return `farmer-order-status ${
      String(status || "pending").toLowerCase()
    }`;
  };

  // ================= DATE FORMAT =================
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

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="farmer-orders-page">
        <div className="farmer-orders-back-row">
          <BackButton
            fallback="/farmer-dashboard"
            label="Back to Dashboard"
          />
        </div>

        <div className="farmer-orders-loading">
          <div className="farmer-orders-spinner" />

          <h2>Loading orders...</h2>

          <p>
            Please wait while we fetch your orders.
          </p>
        </div>
      </div>
    );
  }

  // ================= STATISTICS =================
  const pendingOrders = orders.filter(
    (order) =>
      String(order.status || "").toLowerCase() === "pending"
  ).length;

  const acceptedOrders = orders.filter(
    (order) =>
      String(order.status || "").toLowerCase() === "accepted"
  ).length;

  const rejectedOrders = orders.filter(
    (order) =>
      String(order.status || "").toLowerCase() === "rejected"
  ).length;

  const paidOrders = orders.filter(
    (order) => getPaymentStatus(order).value === "paid"
  ).length;

  // ================= UI =================
  return (
    <div className="farmer-orders-page">

      {/* BACK BUTTON */}
      <div className="farmer-orders-back-row">
        <BackButton
          fallback="/farmer-dashboard"
          label="Back to Dashboard"
        />
      </div>

      {/* HEADER */}
      <header className="farmer-orders-header">
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
          type="button"
          className="farmer-orders-refresh"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {/* ERROR */}
      {error && (
        <div className="farmer-orders-error" role="alert">
          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <section className="farmer-orders-stats">
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

        <div className="farmer-order-stat">
          <span>Paid Orders</span>
          <strong>{paidOrders}</strong>
        </div>
      </section>

      {/* SEARCH AND FILTERS */}
      {orders.length > 0 && (
        <section className="order-filters">
          <div className="order-filter-search">
            <label htmlFor="farmer-order-search">
              Search orders
            </label>

            <input
              id="farmer-order-search"
              type="search"
              placeholder="Order ID, crop or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="order-filter-field">
            <label htmlFor="farmer-order-status">
              Order status
            </label>

            <select
              id="farmer-order-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="order-filter-field">
            <label htmlFor="farmer-payment-status">
              Payment status
            </label>

            <select
              id="farmer-payment-status"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="order-filter-field">
            <label htmlFor="farmer-order-start">
              From date
            </label>

            <input
              id="farmer-order-start"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="order-filter-field">
            <label htmlFor="farmer-order-end">
              To date
            </label>

            <input
              id="farmer-order-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="clear-order-filters"
            onClick={clearOrderFilters}
          >
            Clear filters
          </button>

          <p className="order-filter-count" aria-live="polite">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </section>
      )}

      {/* NO ORDERS */}
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

      {/* NO FILTER RESULTS */}
      {!error &&
        orders.length > 0 &&
        filteredOrders.length === 0 && (
          <div className="farmer-orders-empty">
            <div className="farmer-orders-empty-icon">
              🔎
            </div>

            <h2>No Matching Orders</h2>

            <p>
              Try changing your search or filters.
            </p>

            <button
              type="button"
              className="clear-order-filters"
              onClick={clearOrderFilters}
            >
              Clear filters
            </button>
          </div>
        )}

      {/* ORDERS LIST */}
      {!error && filteredOrders.length > 0 && (
        <section className="farmer-orders-list">
          {filteredOrders.map((order) => {
            const product = order.product || {};

            const cropName =
              product.cropName ||
              order.cropName ||
              "Agricultural Product";

            const quantity = order.quantity || 0;

            const mspPrice =
              order.mspPrice ||
              order.price ||
              product.currentMsp?.price ||
              0;

            const distance = order.distance || 0;

            const totalAmount = order.totalAmount || 0;

            const status = String(
              order.status || "pending"
            ).toLowerCase();

            const payment = getPaymentStatus(order);

            const isProcessing =
              actionLoading === order._id;

            return (
              <article
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

                      <p>
                        Order Date: {formatDate(order.createdAt)}
                      </p>
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
                      ₹{Number(mspPrice).toLocaleString("en-IN")}
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
                      ₹{Number(totalAmount).toLocaleString("en-IN")}
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

                {/* ACCEPT / REJECT */}
                {status === "pending" && (
                  <div className="farmer-order-actions">
                    <button
                      type="button"
                      className="reject-order-btn"
                      onClick={() => handleReject(order._id)}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Reject Order"}
                    </button>

                    <button
                      type="button"
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

                {/* ACCEPTED ORDER */}
                {status === "accepted" && (
                  <div className="farmer-order-message accepted-message">
                    <p>✓ This order has been accepted.</p>

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
                    ✕ This order has been rejected.
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default FarmerOrders;