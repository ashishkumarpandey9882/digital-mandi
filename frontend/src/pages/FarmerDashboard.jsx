import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./FarmerDashboard.css";

function FarmerDashboard() {
  const { user } = useAuth();

  return (
    <div className="farmer-dashboard">

      {/* ================= HEADER ================= */}
      <div className="farmer-header">

        <div>
          <p className="farmer-label">
            FARMER PANEL
          </p>

          <h1>
            Welcome, {user?.name} 🌾
          </h1>

          <p className="farmer-subtitle">
            Manage your agricultural products and orders
            from one place.
          </p>
        </div>

        <div className="farmer-role">
          🌾 Farmer
        </div>

      </div>


      {/* ================= PROFILE CARD ================= */}
      <section className="farmer-profile">

        <div className="profile-icon">
          👤
        </div>

        <div className="profile-info">

          <h2>
            {user?.name}
          </h2>

          <p>
            {user?.district}, {user?.state}
          </p>

          <span>
            {user?.email}
          </span>

        </div>

      </section>


      {/* ================= ACTIONS ================= */}
      <section className="farmer-actions">

        <h2>
          Farmer Actions
        </h2>

        <div className="action-grid">

          {/* ================= ADD CROP ================= */}
          <Link
            to="/add-crop"
            className="action-card"
          >

            <div className="action-icon">
              🌾
            </div>

            <div>
              <h3>
                Add Crop
              </h3>

              <p>
                List a new agricultural product
              </p>
            </div>

            <span className="action-arrow">
              →
            </span>

          </Link>


          {/* ================= MY PRODUCTS ================= */}
          <Link
            to="/my-products"
            className="action-card"
          >

            <div className="action-icon">
              📦
            </div>

            <div>
              <h3>
                My Products
              </h3>

              <p>
                View and manage your products
              </p>
            </div>

            <span className="action-arrow">
              →
            </span>

          </Link>


          {/* ================= ORDERS ================= */}
          <Link
            to="/farmer-orders"
            className="action-card"
          >

            <div className="action-icon">
              🛒
            </div>

            <div>
              <h3>
                Orders
              </h3>

              <p>
                Manage incoming buyer orders
              </p>
            </div>

            <span className="action-arrow">
              →
            </span>

          </Link>

        </div>

      </section>

    </div>
  );
}

export default FarmerDashboard;