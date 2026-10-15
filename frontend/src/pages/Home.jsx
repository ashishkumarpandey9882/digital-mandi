import { Link } from "react-router-dom";
import { useContext } from "react";
import "./Home.css";
import { AuthContext } from "../context/AuthContext";

const quickLinks = [
  {
    icon: "▣",
    title: "Marketplace",
    subtitle: "Browse and buy",
    to: "/products",
  },
  {
    icon: "▥",
    title: "MSP Rates",
    subtitle: "Crop-wise rates",
    to: "/msp-rates",
  },
  {
    icon: "▤",
    title: "Orders",
    subtitle: "View your orders",
    to: null,
  },
  {
    icon: "♧",
    title: "Farmer Support",
    subtitle: "Get help",
    to: "/farmer-support",
  },
  {
    icon: "♧",
    title: "Schemes",
    subtitle: "Government schemes",
    to: "/schemes",
  },
  {
    icon: "▱",
    title: "Delivery",
    subtitle: "Logistics & transport",
    to: "#why-digital-mandi",
  },
];

const benefits = [
  {
    icon: "🌱",
    title: "Direct Farmer Connection",
    text: "Connect buyers directly with farmers and reduce unnecessary middlemen.",
  },
  {
    icon: "📊",
    title: "MSP Transparency",
    text: "View available MSP information for more informed buying decisions.",
  },
  {
    icon: "🚚",
    title: "Smart Logistics",
    text: "Explore transportation options between farmers and buyers.",
  },
];

function Home() {
  const auth = useContext(AuthContext);
  const user = auth?.user || auth?.currentUser || null;
  const role = String(user?.role || user?.user?.role || "").toLowerCase();

  const ordersPath =
    role === "farmer"
      ? "/farmer-orders"
      : role === "buyer"
        ? "/buyer-orders"
        : "/login";

  const resolvedLinks = quickLinks.map((item) =>
    item.title === "Orders" ? { ...item, to: ordersPath } : item
  );

  return (
    <main className="home">
      <section className="hero-section">
        <div className="hero-backdrop" />

        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-label">
              <span>✳</span> For India's Farmers
            </span>

            <h1>
              Har Kisan.
              <br />
              <span>Behtar Bazaar.</span>
            </h1>

            <p className="hero-text">
              Buy and sell agricultural products directly with
              transparent, MSP-informed pricing.
            </p>

            <div className="hero-actions">
              <Link to="/products" className="hero-button">
                Explore Marketplace <span>→</span>
              </Link>

              <a href="#why-digital-mandi" className="hero-secondary">
                <span className="play-icon">▶</span>
                How It Works
              </a>
            </div>

            <div className="hero-trust">
              <span><b>♧</b> Direct from Farmers</span>
              <i />
              <span><b>♢</b> Transparent Pricing</span>
              <i />
              <span><b>♧</b> Safe &amp; Trusted</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Agricultural marketplace">
            <div className="hero-photo" />

            <div className="floating-cards">
              <Link to="/msp-rates" className="floating-card">
                <span className="floating-icon wheat-icon">🌾</span>
                <div>
                  <strong>MSP Reference</strong>
                  <p>Wheat · View rates</p>
                </div>
                <span className="card-arrow">›</span>
              </Link>

              <Link to="/products" className="floating-card">
                <span className="floating-icon market-icon">🛒</span>
                <div>
                  <strong>Marketplace</strong>
                  <p>Browse farm produce</p>
                </div>
                <span className="card-arrow">›</span>
              </Link>

              <Link to="/schemes" className="floating-card">
                <span className="floating-icon trust-icon">✓</span>
                <div>
                  <strong>Farmer Resources</strong>
                  <p>Schemes and support</p>
                </div>
                <span className="card-arrow">›</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-decoration" aria-hidden="true">🌿</div>
      </section>

      <section className="quick-links" aria-label="Quick access">
        {resolvedLinks.map((item) => (
          <Link
            to={item.to}
            className="quick-link"
            key={item.title}
          >
            <span className="quick-link-icon">{item.icon}</span>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
          </Link>
        ))}
      </section>

      <section className="features" id="why-digital-mandi">
        <div className="section-heading">
          <span>OUR ADVANTAGES</span>
          <h2>Why Digital Mandi?</h2>
          <p>
            A simpler, more transparent way to connect India's farmers and buyers.
          </p>
        </div>

        <div className="feature-grid">
          {benefits.map((benefit) => (
            <article className="feature-card" key={benefit.title}>
              <div className="feature-icon">{benefit.icon}</div>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
