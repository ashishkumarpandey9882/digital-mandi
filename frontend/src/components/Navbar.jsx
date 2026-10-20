
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const dashboardPath =
    user?.role === "farmer"
      ? "/farmer-dashboard"
      : "/buyer-dashboard";

  const displayName = user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const navLinkClass = ({ isActive }) =>
    `navbar-link${isActive ? " active" : ""}`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <nav className="navbar">
        {/* BRAND */}
        <Link
          to="/"
          className="navbar-brand"
          aria-label="Digital Mandi home"
          onClick={closeMenu}
        >
          <span className="brand-icon" aria-hidden="true">
            🌾
          </span>

          <span className="brand-copy">
            <span className="brand-name">Digital Mandi</span>
            <span className="brand-tagline">
              Farm to Market, Made Simple
            </span>
          </span>
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="navbar-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        {/* NAVIGATION */}
        <div className={`navbar-content ${menuOpen ? "menu-open" : ""}`}>
          <div className="navbar-links">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={closeMenu}
            >
              Home
            </NavLink>

            <NavLink
              to="/products"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Marketplace
            </NavLink>

            {isLoggedIn && (
              <>
                <NavLink
                  to={dashboardPath}
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/ai-assistant"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  <span aria-hidden="true">🤖 </span>
                  AI Assistant
                </NavLink>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {isLoggedIn ? (
              <>
                {/* USER PROFILE */}
                <div className="navbar-profile">
                  <div className="profile-avatar" aria-hidden="true">
                    {initial}
                  </div>

                  <div className="profile-details">
                    <span className="profile-name" title={displayName}>
                      {displayName}
                    </span>

                    <span className="profile-role">
                      <span className="profile-role-dot" />
                      {user?.role || "Member"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="navbar-logout"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="navbar-login"
                  onClick={closeMenu}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="navbar-register"
                  onClick={closeMenu}
                >
                  Get Started <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
