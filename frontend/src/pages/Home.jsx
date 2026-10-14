import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <main className="home">
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-label">DIGITAL MANDI</p>

          <h1>
            Connecting Farmers
            <br />
            With Better Markets
          </h1>

          <p className="hero-text">
            Buy agricultural products directly from farmers
            with transparent and MSP-based pricing.
          </p>

          <Link to="/products" className="hero-button">
            Explore Marketplace
          </Link>
        </div>
      </section>

      <section className="features">
        <h2>Why Digital Mandi?</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>🌾 Direct Farmer Connection</h3>
            <p>
              Connect buyers directly with farmers and reduce
              unnecessary middlemen.
            </p>
          </div>

          <div className="feature-card">
            <h3>📊 MSP Transparency</h3>
            <p>
              View current MSP information while placing
              agricultural orders.
            </p>
          </div>

          <div className="feature-card">
            <h3>🚚 Smart Logistics</h3>
            <p>
              Calculate transportation distance and cost
              between farmer and buyer.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;