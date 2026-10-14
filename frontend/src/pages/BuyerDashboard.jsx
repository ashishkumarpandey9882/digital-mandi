import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./BuyerDashboard.css";

function BuyerDashboard() {
  const { user } = useAuth();

  return (
    <div className="buyer-dashboard">

      <div className="buyer-header">
        <div>
          <p className="buyer-label">BUYER PANEL</p>

          <h1>
            Welcome, {user?.name} 🛒
          </h1>

          <p className="buyer-subtitle">
            Discover agricultural products and manage your
            purchases from one place.
          </p>
        </div>

        <div className="buyer-role">
          🛒 Buyer
        </div>
      </div>


      <section className="buyer-profile">

        <div className="buyer-profile-icon">
          👤
        </div>

        <div className="buyer-profile-info">

          <h2>{user?.name}</h2>

          <p>
            {user?.district}, {user?.state}
          </p>

          <span>
            {user?.email}
          </span>

        </div>

      </section>


      <section className="buyer-actions">

        <h2>Buyer Actions</h2>

        <div className="buyer-action-grid">

          <Link
            to="/products"
            className="buyer-action-card"
          >
            <div className="buyer-action-icon">
              🌾
            </div>

            <div>
              <h3>Marketplace</h3>

              <p>
                Browse agricultural products
                from farmers.
              </p>
            </div>

            <span className="buyer-action-arrow">
              →
            </span>
          </Link>


          <Link
            to="/buyer-orders"
            className="buyer-action-card"
          >
            <div className="buyer-action-icon">
              📦
            </div>

            <div>
              <h3>My Orders</h3>

              <p>
                Track your placed orders and
                order status.
              </p>
            </div>

            <span className="buyer-action-arrow">
              →
            </span>
          </Link>


          <Link
            to="/products"
            className="buyer-action-card"
          >
            <div className="buyer-action-icon">
              🔍
            </div>

            <div>
              <h3>Find Products</h3>

              <p>
                Find crops available from
                verified farmers.
              </p>
            </div>

            <span className="buyer-action-arrow">
              →
            </span>
          </Link>

        </div>

      </section>

    </div>
  );
}

export default BuyerDashboard;