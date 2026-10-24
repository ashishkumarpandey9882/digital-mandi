
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Register.css";
import BackButton from "../components/BackButton";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
    state: "",
    district: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        "/auth/register",
        formData
      );

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Registration failed:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-wrapper">
        {/* BACK BUTTON */}
        <div className="register-back-row">
          <BackButton
            fallback="/"
            label="Back to Home"
          />
        </div>

        {/* LEFT SIDE */}
        <div className="register-info">
          <div className="register-logo">
            🌾
          </div>

          <h2>
            Join Digital Mandi
          </h2>

          <p>
            Create your account and become a part
            of India's digital agricultural marketplace.
          </p>

          <div className="register-points">
            <div className="register-point">
              <span>🌾</span>
              Sell your agricultural products
            </div>

            <div className="register-point">
              <span>🛒</span>
              Buy directly from farmers
            </div>

            <div className="register-point">
              <span>📊</span>
              Transparent MSP-based pricing
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="register-form-section">
          <h1>Create Account</h1>

          <p className="register-subtitle">
            Register to get started with Digital Mandi
          </p>

          <form
            className="register-form"
            onSubmit={handleRegister}
          >
            {/* NAME */}
            <div className="register-field">
              <label>Full Name</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* EMAIL */}
            <div className="register-field">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="register-field">
              <label>Password</label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            {/* ROLE */}
            <div className="register-field">
              <label>Account Type</label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="buyer">
                  Buyer
                </option>

                <option value="farmer">
                  Farmer
                </option>
              </select>
            </div>

            {/* STATE + DISTRICT */}
            <div className="register-row">
              <div className="register-field">
                <label>State</label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Haryana"
                  required
                />
              </div>

              <div className="register-field">
                <label>District</label>

                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Hisar"
                  required
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="register-field">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            {/* ERROR */}
            {error && (
              <p className="register-error">
                {error}
              </p>
            )}

            {/* SUCCESS */}
            {success && (
              <p className="register-success">
                {success}
              </p>
            )}

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          {/* LOGIN LINK */}
          <p className="register-login">
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
