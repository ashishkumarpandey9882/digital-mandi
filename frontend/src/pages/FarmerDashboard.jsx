import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import BackButton from "../components/BackButton";
import "./FarmerDashboard.css";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
};

const getStatus = (value) => String(value || "").toLowerCase();

const getPaymentStatus = (order) =>
  getStatus(order.payment?.status || order.paymentStatus || "pending");

const isPaid = (order) =>
  ["paid", "completed", "success", "successful", "captured"].includes(
    getPaymentStatus(order)
  );

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

function FarmerDashboard() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const farmerName = user?.name?.trim() || "Farmer";
  const firstName = farmerName.split(/\s+/)[0];
  const farmerId = getId(user?._id || user?.id);

  const location = [user?.district, user?.state]
    .filter(Boolean)
    .join(", ");

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");

    try {
      const response = await api.get("/products");
      const allProducts = response.data?.products || [];

      // Count only products that can be matched to this farmer.
      const ownedProducts = allProducts.filter(
        (product) => getId(product.farmer) === farmerId
      );

      setProducts(ownedProducts);

      if (!farmerId) {
        setProductsError(
          "Your account ID is unavailable. Product statistics cannot be verified."
        );
      } else if (
        allProducts.length > 0 &&
        ownedProducts.length === 0 &&
        !allProducts.some((product) => product.farmer)
      ) {
        setProductsError(
          "Product ownership was not included by the API. Product statistics are unavailable."
        );
      }
    } catch (error) {
      console.error("Farmer dashboard products error:", error);
      setProductsError(
        error.response?.data?.message || "Unable to load product statistics."
      );
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [farmerId]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await api.get("/orders/farmer-orders");
      setOrders(response.data?.orders || response.data?.data || []);
    } catch (error) {
      console.error("Farmer dashboard orders error:", error);
      setOrdersError(
        error.response?.data?.message || "Unable to load order statistics."
      );
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProducts(), fetchOrders()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const stats = useMemo(() => {
    const availableProducts = products.filter(
      (product) => getStatus(product.status) === "available"
    );

    const pendingOrders = orders.filter(
      (order) => getStatus(order.status) === "pending"
    );

    const acceptedOrders = orders.filter(
      (order) => getStatus(order.status) === "accepted"
    );

    const paidOrders = orders.filter(isPaid);

    // Count earnings only for orders whose payment is marked as paid.
    const paidEarnings = paidOrders.reduce((sum, order) => {
      const cropAmount =
        Number(order.cropAmount) ||
        Number(order.mspPrice || order.price || 0) *
          Number(order.quantity || 0);

      return sum + cropAmount + Number(order.farmerTransportShare || 0);
    }, 0);

    const stock = availableProducts.reduce(
      (sum, product) => sum + Math.max(0, Number(product.quantity) || 0),
      0
    );

    return {
      totalProducts: products.length,
      availableProducts: availableProducts.length,
      stock,
      pendingOrders: pendingOrders.length,
      acceptedOrders: acceptedOrders.length,
      paidOrders: paidOrders.length,
      paidEarnings,
    };
  }, [products, orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
        )
        .slice(0, 5),
    [orders]
  );

  const actions = [
    {
      icon: "＋",
      title: "List a new crop",
      description: "Add crop details and available quantity.",
      to: "/add-crop",
      className: "fd-action-primary",
    },
    {
      icon: "▦",
      title: "Manage products",
      description: "Review your listings and remaining stock.",
      to: "/my-products",
      className: "",
    },
    {
      icon: "↗",
      title: "Manage orders",
      description: "Review requests and respond to buyers.",
      to: "/farmer-orders",
      className: "",
    },
  ];

  const loading = productsLoading || ordersLoading;

  return (
    <main className="fd-page">

      {/* BACK BUTTON */}
      <div className="fd-back-row">
        <BackButton
          fallback="/"
          label="Back to Home"
        />
      </div>

      <section className="fd-hero">
        <div className="fd-hero-content">
          <span className="fd-eyebrow">
            <span className="fd-live-dot" />
            DIGITAL MANDI / FARMER WORKSPACE
          </span>

          <h1>
            Welcome back, {firstName}
            <span className="fd-wave" role="img" aria-label="wheat">
              {" "}🌾
            </span>
          </h1>

          <p>
            Your farm, your products, your business. Manage your listings,
            track buyer orders and keep your marketplace activity in one place.
          </p>

          <div className="fd-hero-actions">
            <Link to="/add-crop" className="fd-btn fd-btn-light">
              + List a new crop
            </Link>
            <Link to="/farmer-orders" className="fd-btn fd-btn-outline">
              View orders <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="fd-hero-meta">
            <span>◷ Live account overview</span>
            {location && <span>⌖ {location}</span>}
          </div>
        </div>

        <div className="fd-hero-art" aria-hidden="true">
          <div className="fd-orbit fd-orbit-one" />
          <div className="fd-orbit fd-orbit-two" />
          <div className="fd-hero-plant">🌾</div>
          <div className="fd-floating-card">
            <span className="fd-floating-icon">↗</span>
            <div>
              <strong>Grow with confidence</strong>
              <small>Manage your farm business</small>
            </div>
          </div>
        </div>
      </section>

      <div className="fd-section-heading">
        <div>
          <span className="fd-kicker">YOUR PERFORMANCE</span>
          <h2>Farm at a glance</h2>
          <p>Key figures from your products and incoming orders.</p>
        </div>

        <button
          type="button"
          className="fd-refresh"
          onClick={refreshDashboard}
          disabled={refreshing}
        >
          <span aria-hidden="true">↻</span>{" "}
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </div>

      <section className="fd-stats-grid" aria-label="Farm statistics">
        <article className="fd-stat-card">
          <div className="fd-stat-top">
            <span className="fd-stat-icon fd-green">▦</span>
            <span className="fd-stat-label">PRODUCTS</span>
          </div>
          <strong className="fd-stat-value">
            {productsLoading ? "—" : productsError ? "N/A" : stats.totalProducts}
          </strong>
          <span className="fd-stat-foot">
            {productsLoading
              ? "Loading..."
              : `${stats.availableProducts} currently available`}
          </span>
        </article>

        <article className="fd-stat-card">
          <div className="fd-stat-top">
            <span className="fd-stat-icon fd-amber">♧</span>
            <span className="fd-stat-label">AVAILABLE STOCK</span>
          </div>
          <strong className="fd-stat-value">
            {productsLoading || productsError ? "—" : stats.stock.toLocaleString("en-IN")}
          </strong>
          <span className="fd-stat-foot">Units across available listings</span>
        </article>

        <article className="fd-stat-card">
          <div className="fd-stat-top">
            <span className="fd-stat-icon fd-blue">◷</span>
            <span className="fd-stat-label">PENDING ORDERS</span>
          </div>
          <strong className="fd-stat-value">
            {ordersLoading ? "—" : ordersError ? "N/A" : stats.pendingOrders}
          </strong>
          <Link to="/farmer-orders" className="fd-stat-link">
            Review requests →
          </Link>
        </article>

        <article className="fd-stat-card">
          <div className="fd-stat-top">
            <span className="fd-stat-icon fd-purple">₹</span>
            <span className="fd-stat-label">PAID EARNINGS</span>
          </div>
          <strong className="fd-stat-value fd-money">
            {ordersLoading || ordersError ? "—" : money(stats.paidEarnings)}
          </strong>
          <span className="fd-stat-foot">
            {ordersLoading ? "Loading..." : `${stats.paidOrders} paid orders`}
          </span>
        </article>
      </section>

      {(productsError || ordersError) && (
        <div className="fd-error" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Some dashboard data could not be verified</strong>
            {productsError && <p>Products: {productsError}</p>}
            {ordersError && <p>Orders: {ordersError}</p>}
          </div>
          <button type="button" onClick={refreshDashboard}>
            Retry
          </button>
        </div>
      )}

      <section className="fd-main-grid">
        <div className="fd-panel fd-orders-panel">
          <div className="fd-panel-heading">
            <div>
              <span className="fd-kicker">LATEST ACTIVITY</span>
              <h2>Recent orders</h2>
            </div>
            <Link to="/farmer-orders" className="fd-view-all">
              View all →
            </Link>
          </div>

          {ordersLoading ? (
            <div className="fd-empty">
              <span className="fd-loading-spinner" />
              <p>Loading your orders...</p>
            </div>
          ) : ordersError ? (
            <div className="fd-empty">
              <p>Order data is currently unavailable.</p>
              <button type="button" onClick={fetchOrders}>Try again</button>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="fd-empty">
              <span className="fd-empty-icon">📦</span>
              <strong>No orders yet</strong>
              <p>Orders from buyers will appear here.</p>
              <Link to="/my-products">Review your listings →</Link>
            </div>
          ) : (
            <div className="fd-order-list">
              {recentOrders.map((order) => {
                const crop = order.product?.cropName || order.cropName || "Crop order";
                const status = getStatus(order.status) || "pending";

                return (
                  <article className="fd-order-row" key={order._id}>
                    <div className="fd-crop-avatar">
                      {crop.charAt(0).toUpperCase()}
                    </div>

                    <div className="fd-order-info">
                      <strong>{crop}</strong>
                      <span>
                        {order.buyer?.name || "Buyer"} · {order.quantity || 0} units
                      </span>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>

                    <div className="fd-order-right">
                      <strong>
                        {money(
                          order.cropAmount ??
                          Number(order.mspPrice || order.price || 0) *
                            Number(order.quantity || 0)
                        )}
                      </strong>
                      <span className={`fd-status fd-status-${status}`}>
                        {status}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="fd-panel fd-profile-panel">
          <div className="fd-panel-heading">
            <div>
              <span className="fd-kicker">YOUR ACCOUNT</span>
              <h2>Farmer profile</h2>
            </div>
            <span className="fd-profile-mark">✓</span>
          </div>

          <div className="fd-profile-identity">
            <div className="fd-avatar">
              {farmerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{farmerName}</strong>
              <span>Farmer account</span>
            </div>
          </div>

          <div className="fd-profile-details">
            <div>
              <span>Email address</span>
              <strong>{user?.email || "Not provided"}</strong>
            </div>
            <div>
              <span>Farm location</span>
              <strong>{location || "Not provided"}</strong>
            </div>
          </div>

          <div className="fd-profile-note">
            <span>🌱</span>
            <p>Keep your profile details up to date to help buyers connect with you.</p>
          </div>
        </aside>
      </section>

      <section className="fd-actions-section">
        <div className="fd-section-heading">
          <div>
            <span className="fd-kicker">QUICK ACCESS</span>
            <h2>What would you like to do?</h2>
            <p>Get to the tools you use most, without extra steps.</p>
          </div>
        </div>

        <div className="fd-actions-grid">
          {actions.map((action, index) => (
            <Link
              to={action.to}
              className={`fd-action-card ${action.className}`}
              key={action.to}
            >
              <div className="fd-action-top">
                <span className="fd-action-icon">{action.icon}</span>
                <span className="fd-action-index">0{index + 1}</span>
              </div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <span className="fd-action-link">Open workspace <span>→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="fd-footer">
        <span>🌱</span>
        <p>Digital Mandi · Helping farmers connect with buyers.</p>
        <span className="fd-footer-tag">FARMER WORKSPACE</span>
      </footer>
    </main>
  );
}

export default FarmerDashboard;