import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import "./Login.css";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      // API call
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // Save user + JWT through AuthContext
      login(
        response.data.user,
        response.data.token
      );

      console.log("Login successful:", response.data);

      if (response.data.user.role === "farmer") {
            navigate("/farmer-dashboard");
        } else {
            navigate("/products");
        }

    } catch (error) {
      console.error("Login failed:", error);

      setError(
        error.response?.data?.message || "Login failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-wrapper">

        {/* LEFT SIDE */}
        <div className="login-info">

          <div className="login-logo">
            🌾
          </div>

          <h2>
            Welcome to
            <br />
            Digital Mandi
          </h2>

          <p>
            Connect directly with farmers and access
            agricultural products with transparent pricing.
          </p>

          <div className="login-points">

            <div className="login-point">
              <span className="login-point-icon">
                🌾
              </span>

              Direct farmer connection
            </div>

            <div className="login-point">
              <span className="login-point-icon">
                📊
              </span>

              Transparent MSP pricing
            </div>

            <div className="login-point">
              <span className="login-point-icon">
                🚚
              </span>

              Reliable transportation
            </div>

          </div>

        </div>


        {/* RIGHT SIDE */}
        <div className="login-form-section">

          <h1>Login</h1>

          <p className="login-subtitle">
            Login to continue to your Digital Mandi account
          </p>

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* EMAIL */}
            <div className="login-field">

              <label>
                Email Address
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  ✉️
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div className="login-field">

              <label>
                Password
              </label>

              <div className="login-input-wrapper">

                <span className="login-input-icon">
                  🔒
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  required
                />

              </div>

            </div>


            {/* ERROR */}
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}


            {/* LOGIN BUTTON */}
            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login to Digital Mandi"}
            </button>

          </form>


          {/* REGISTER LINK */}
          <p className="login-register">

            Don't have an account?{" "}

            <Link to="/register">
              Create an account
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;