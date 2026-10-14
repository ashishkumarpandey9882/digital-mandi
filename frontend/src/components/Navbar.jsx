import { Link } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <Link
        to="/"
        className="navbar-logo"
      >
        🌾 Digital Mandi
      </Link>

      {/* NAVIGATION */}
      <div className="navbar-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/products">
          Marketplace
        </Link>

        {/* LOGGED IN USER */}
        {isLoggedIn ? (
          <>
            {/* DASHBOARD */}
            {user?.role === "farmer" && (
              <Link to="/farmer-dashboard">
                Dashboard
              </Link>
            )}

            {user?.role === "buyer" && (
              <Link to="/buyer-dashboard">
                Dashboard
              </Link>
            )}

            {/* USER INFO */}
            <div className="navbar-user">

              <span className="navbar-user-name">
                👤 {user?.name}
              </span>

              <span className="navbar-user-role">
                {user?.role}
              </span>

            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="navbar-logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="navbar-login"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="navbar-register"
            >
              Register
            </Link>
          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;