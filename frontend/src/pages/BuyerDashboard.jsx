import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import BackButton from "../components/BackButton";
import "./BuyerDashboard.css";

const navItems = [
  { label: "Overview", to: "/buyer-dashboard", icon: "▦", end: true },
  { label: "Marketplace", to: "/products", icon: "▤" },
  { label: "My Orders", to: "/buyer-orders", icon: "▣" },
  { label: "MSP Rates", to: "/msp-rates", icon: "₹" },
];

const categories = [
  { name: "All Crops", icon: "🌾", color: "green" },
  { name: "Wheat", icon: "🌾", color: "gold" },
  { name: "Rice", icon: "🍚", color: "blue" },
  { name: "Pulses", icon: "🫘", color: "orange" },
  { name: "Vegetables", icon: "🥬", color: "lime" },
];

function BuyerDashboard() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [productError, setProductError] = useState("");
  const [search, setSearch] = useState("");

  const buyerName = user?.name || "Buyer";
  const firstName = buyerName.trim().split(/\s+/)[0] || "Buyer";
  const location = [user?.district, user?.state].filter(Boolean).join(", ");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setOrderError("");
      setProductError("");

      const results = await Promise.allSettled([
        api.get("/orders/my-orders"),
        api.get("/products"),
      ]);

      if (!active) return;

      const orderResult = results[0];
      const productResult = results[1];

      if (orderResult.status === "fulfilled") {
        const data = orderResult.value.data;
        const list = data.orders || data.data || [];
        setOrders(Array.isArray(list) ? list : []);
      } else {
        console.error("Buyer orders could not be loaded:", orderResult.reason);
        setOrderError(
          orderResult.reason?.response?.data?.message ||
            "Your orders are temporarily unavailable."
        );
      }

      if (productResult.status === "fulfilled") {
        const data = productResult.value.data;
        const list = data.products || data.data || [];
        setProducts(Array.isArray(list) ? list : []);
      } else {
        console.error("Products could not be loaded:", productResult.reason);
        setProductError(
          productResult.reason?.response?.data?.message ||
            "Marketplace listings are temporarily unavailable."
        );
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const statusOf = (order) =>
    String(order.status || "pending").toLowerCase();

  const paymentStatusOf = (order) =>
    String(
      order.paymentStatus ??
        order.payment?.status ??
        order.payment?.paymentStatus ??
        "pending"
    ).toLowerCase();

  const amountOf = (order) => {
    const value = Number(
      order.totalAmount ?? order.amount ?? order.cropAmount ?? 0
    );
    return Number.isFinite(value) ? value : 0;
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "—";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "—";

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          String(product.status || "available").toLowerCase() === "available" &&
          Number(product.quantity) > 0
      ),
    [products]
  );

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => statusOf(order) === "pending"
    ).length;

    const accepted = orders.filter(
      (order) => statusOf(order) === "accepted"
    ).length;

    const completed = orders.filter((order) =>
      ["completed", "delivered"].includes(statusOf(order))
    ).length;

    const paidAmount = orders.reduce((sum, order) => {
      const paid = [
        "paid",
        "completed",
        "success",
        "successful",
        "captured",
      ].includes(paymentStatusOf(order));

      return paid ? sum + amountOf(order) : sum;
    }, 0);

    return {
      total: orders.length,
      pending,
      accepted,
      completed,
      paidAmount,
    };
  }, [orders]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableProducts.slice(0, 4);

    return availableProducts
      .filter((product) => {
        const text = [
          product.cropName,
          product.state,
          product.district,
          product.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      })
      .slice(0, 4);
  }, [availableProducts, search]);

  const recentOrders = orders.slice(0, 5);

  const orderStatusClass = (status) => {
    const safeStatus = String(status || "pending")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");

    return `buyer-status-pill status-${safeStatus}`;
  };

  const getProductPrice = (product) => {
    const price = Number(
      product.pricePerQuintal ?? product.price ?? product.pricePerKg ?? 0
    );
    return Number.isFinite(price) && price > 0 ? formatMoney(price) : "View price";
  };

  const getProductLocation = (product) =>
    [product.district, product.state, product.location]
      .filter(Boolean)
      .slice(0, 2)
      .join(", ") || "Location not listed";

  const cropEmoji = (cropName = "") => {
    const name = cropName.toLowerCase();

    if (name.includes("rice") || name.includes("paddy")) return "🍚";
    if (name.includes("wheat")) return "🌾";
    if (name.includes("maize") || name.includes("corn")) return "🌽";
    if (name.includes("potato")) return "🥔";
    if (name.includes("tomato")) return "🍅";
    if (name.includes("onion")) return "🧅";
    if (name.includes("pulse") || name.includes("lentil") || name.includes("dal")) return "🫘";
    if (name.includes("vegetable") || name.includes("spinach")) return "🥬";

    return "🌱";
  };

  return (
    <>
      {/* BACK BUTTON: keep it outside the dashboard flex layout */}
      <div className="buyer-back-row">
        <BackButton
          fallback="/"
          label="Back to Home"
        />
      </div>

      <main className="buyer-app">
      <aside className="buyer-sidebar">
        <Link to="/buyer-dashboard" className="buyer-brand">
          <span className="buyer-brand-mark">🌱</span>
          <span>
            <strong>KisanFlow</strong>
            <small>Digital Mandi</small>
          </span>
        </Link>

        <div className="buyer-sidebar-label">WORKSPACE</div>

        <nav className="buyer-sidebar-nav" aria-label="Buyer navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `buyer-nav-link${isActive ? " active" : ""}`
              }
            >
              <span className="buyer-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "My Orders" && stats.pending > 0 && (
                <span className="buyer-nav-count">{stats.pending}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="buyer-sidebar-bottom">
          <div className="buyer-sidebar-help-icon">?</div>
          <strong>Need assistance?</strong>
          <p>Find support for your marketplace purchases.</p>
          <Link to="/farmer-support">Visit support →</Link>
        </div>

        <div className="buyer-sidebar-user">
          <div className="buyer-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="buyer-sidebar-user-info">
            <strong>{buyerName}</strong>
            <span>Buyer account</span>
          </div>
        </div>
      </aside>

      <section className="buyer-main">
        <header className="buyer-topbar">
          <div className="buyer-breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>Overview</strong>
          </div>

          <div className="buyer-topbar-right">
            <span className="buyer-topbar-location">
              <span>⌖</span> {location || "India"}
            </span>
            <div className="buyer-topbar-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="buyer-content">
          <section className="buyer-welcome-row">
            <div>
              <span className="buyer-overline">BUYER WORKSPACE</span>
              <h1>Welcome back, {firstName} <span>👋</span></h1>
              <p>Find quality crops, connect with farmers and manage your purchases.</p>
            </div>
            <Link to="/buyer-orders" className="buyer-outline-action">
              <span>▣</span> My Orders
            </Link>
          </section>

          <section className="buyer-promo">
            <div className="buyer-promo-content">
              <span className="buyer-promo-tag">DIRECT FROM FARMERS</span>
              <h2>Better sourcing starts here.</h2>
              <p>Explore agricultural produce and make informed buying decisions.</p>
              <Link to="/products" className="buyer-promo-button">
                Explore marketplace <span>→</span>
              </Link>
            </div>
            <div className="buyer-promo-art" aria-hidden="true">
              <div className="buyer-promo-sun" />
              <span className="buyer-promo-grain">🌾</span>
              <span className="buyer-promo-leaf">🌿</span>
              <span className="buyer-promo-stamp">FARM<br />FRESH</span>
            </div>
          </section>

          <section className="buyer-stat-grid" aria-label="Purchase statistics">
            <article className="buyer-stat-card">
              <div className="buyer-stat-heading">
                <span>Total Orders</span>
                <span className="buyer-stat-icon green">▣</span>
              </div>
              <strong>{loading ? "—" : stats.total}</strong>
              <small>All orders placed</small>
            </article>

            <article className="buyer-stat-card">
              <div className="buyer-stat-heading">
                <span>Pending Orders</span>
                <span className="buyer-stat-icon amber">◷</span>
              </div>
              <strong>{loading ? "—" : stats.pending}</strong>
              <small>Awaiting farmer response</small>
            </article>

            <article className="buyer-stat-card">
              <div className="buyer-stat-heading">
                <span>Accepted Orders</span>
                <span className="buyer-stat-icon blue">✓</span>
              </div>
              <strong>{loading ? "—" : stats.accepted}</strong>
              <small>Approved by farmers</small>
            </article>

            <article className="buyer-stat-card">
              <div className="buyer-stat-heading">
                <span>Paid Amount</span>
                <span className="buyer-stat-icon purple">₹</span>
              </div>
              <strong className="buyer-stat-money">
                {loading ? "—" : formatMoney(stats.paidAmount)}
              </strong>
              <small>Orders marked as paid</small>
            </article>
          </section>

          <div className="buyer-dashboard-columns">
            <div className="buyer-center-column">
              <section className="buyer-panel">
                <div className="buyer-panel-heading">
                  <div>
                    <span className="buyer-overline">FIND YOUR NEXT PURCHASE</span>
                    <h2>Browse marketplace</h2>
                  </div>
                  <Link to="/products" className="buyer-panel-link">View all →</Link>
                </div>

                <div className="buyer-market-search">
                  <span>⌕</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search crops or locations..."
                    aria-label="Search crops or locations"
                  />
                  <Link to="/products" aria-label="Open all products">↗</Link>
                </div>

                <div className="buyer-category-list">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      to="/products"
                      className="buyer-category"
                    >
                      <span className={`buyer-category-icon ${category.color}`}>
                        {category.icon}
                      </span>
                      <strong>{category.name}</strong>
                    </Link>
                  ))}
                </div>

                <div className="buyer-panel-subheading">
                  <h3>{search ? "Matching crops" : "Available crops"}</h3>
                  <span>{loading ? "Loading..." : `${availableProducts.length} listings`}</span>
                </div>

                {productError ? (
                  <div className="buyer-inline-message">
                    <p>{productError}</p>
                    <Link to="/products">Browse marketplace →</Link>
                  </div>
                ) : loading ? (
                  <div className="buyer-product-loading">
                    <span className="buyer-spinner" />
                    <span>Loading marketplace listings...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="buyer-empty-products">
                    <span>🌱</span>
                    <strong>No matching crops found</strong>
                    <p>Try another search or view all marketplace listings.</p>
                    <Link to="/products">View marketplace →</Link>
                  </div>
                ) : (
                  <div className="buyer-product-grid">
                    {filteredProducts.map((product) => (
                      <Link
                        to={`/product/${product._id}`}
                        className="buyer-product-card"
                        key={product._id}
                      >
                        <div className="buyer-product-image">
                          {product.imageUrl || product.image ? (
                            <img
                              src={product.imageUrl || product.image}
                              alt={product.cropName || "Agricultural crop"}
                              loading="lazy"
                            />
                          ) : (
                            <span>{cropEmoji(product.cropName)}</span>
                          )}
                          <span className="buyer-product-available">Available</span>
                        </div>
                        <div className="buyer-product-info">
                          <strong>{product.cropName || "Agricultural Product"}</strong>
                          <span className="buyer-product-location">
                            ⌖ {getProductLocation(product)}
                          </span>
                          <span className="buyer-product-price">
                            {getProductPrice(product)}
                          </span>
                          <small>
                            Stock: {product.quantity ?? "—"} {product.unit || "units"}
                          </small>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="buyer-panel buyer-recent-panel">
                <div className="buyer-panel-heading">
                  <div>
                    <span className="buyer-overline">YOUR ACTIVITY</span>
                    <h2>Recent orders</h2>
                  </div>
                  <Link to="/buyer-orders" className="buyer-panel-link">View all →</Link>
                </div>

                {orderError ? (
                  <div className="buyer-inline-message">
                    <p>{orderError}</p>
                    <Link to="/buyer-orders">Open My Orders →</Link>
                  </div>
                ) : loading ? (
                  <div className="buyer-product-loading">
                    <span className="buyer-spinner" />
                    <span>Loading your orders...</span>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="buyer-empty-orders">
                    <span>📦</span>
                    <strong>Your orders will appear here</strong>
                    <p>Browse crops and place your first order directly from the marketplace.</p>
                    <Link to="/products">Find crops →</Link>
                  </div>
                ) : (
                  <div className="buyer-orders-list">
                    {recentOrders.map((order) => {
                      const status = statusOf(order);
                      const cropName =
                        order.product?.cropName ||
                        order.cropName ||
                        "Agricultural Product";

                      return (
                        <div className="buyer-order-row" key={order._id}>
                          <div className="buyer-order-crop-icon">
                            {cropEmoji(cropName)}
                          </div>
                          <div className="buyer-order-main">
                            <strong>{cropName}</strong>
                            <span>
                              #{String(order._id || "").slice(-7).toUpperCase()} · {formatDate(order.createdAt || order.orderDate)}
                            </span>
                          </div>
                          <div className="buyer-order-right">
                            <strong>{formatMoney(amountOf(order))}</strong>
                            <span className={orderStatusClass(status)}>
                              {status.replace(/[-_]/g, " ")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="buyer-right-column">
              <section className="buyer-side-panel buyer-account-card">
                <div className="buyer-side-panel-heading">
                  <h2>Your account</h2>
                  <span className="buyer-account-check">✓</span>
                </div>
                <div className="buyer-account-profile">
                  <div className="buyer-account-avatar">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <strong>{buyerName}</strong>
                  <span>{user?.email || "Email not available"}</span>
                  <small><span /> Registered buyer</small>
                </div>
                <div className="buyer-account-details">
                  <div><span>Location</span><strong>{location || "Not provided"}</strong></div>
                  <div><span>Completed orders</span><strong>{loading ? "—" : stats.completed}</strong></div>
                </div>
              </section>

              <section className="buyer-side-panel">
                <div className="buyer-side-panel-heading">
                  <h2>Order summary</h2>
                  <Link to="/buyer-orders">Details →</Link>
                </div>
                <div className="buyer-summary-row">
                  <span className="buyer-summary-dot pending-dot" />
                  <span>Pending</span>
                  <strong>{loading ? "—" : stats.pending}</strong>
                </div>
                <div className="buyer-summary-row">
                  <span className="buyer-summary-dot accepted-dot" />
                  <span>Accepted</span>
                  <strong>{loading ? "—" : stats.accepted}</strong>
                </div>
                <div className="buyer-summary-row">
                  <span className="buyer-summary-dot completed-dot" />
                  <span>Completed</span>
                  <strong>{loading ? "—" : stats.completed}</strong>
                </div>
                <Link to="/buyer-orders" className="buyer-summary-button">
                  Manage all orders <span>→</span>
                </Link>
              </section>

              <section className="buyer-side-panel buyer-tip-panel">
                <span className="buyer-tip-illustration">💡</span>
                <span className="buyer-overline">BUYER TIP</span>
                <h2>Buy with confidence</h2>
                <p>
                  Compare crop prices, check available stock and review
                  transportation charges before ordering.
                </p>
                <Link to="/msp-rates">Check MSP rates →</Link>
              </section>
            </aside>
          </div>

          <footer className="buyer-dashboard-footer">
            <strong>KisanFlow <span>·</span> Digital Mandi</strong>
            <span>Connecting buyers directly with farmers.</span>
          </footer>
        </div>
      </section>
      </main>
    </>
  );
}

export default BuyerDashboard;