import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Products.css";

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="products-message">
        <div className="loading-icon">🌾</div>

        <h2>Loading Marketplace</h2>

        <p>
          Fetching fresh produce from farmers...
        </p>
      </div>
    );
  }

  // ================= ERROR =================

  if (error) {
    return (
      <div className="products-message error">
        <div className="loading-icon">⚠️</div>

        <h2>Something went wrong</h2>

        <p>{error}</p>

        <button
          className="details-btn"
          onClick={fetchProducts}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="marketplace">

      {/* ================= HEADER ================= */}

      <header className="marketplace-header">

        <div>
          <p className="brand-small">
            DIGITAL MANDI
          </p>

          <h1>
            Fresh Produce Marketplace
          </h1>

          <p className="subtitle">
            Buy directly from farmers at transparent
            prices.
          </p>
        </div>

        <div className="product-count">
          {products.length} Products
        </div>

      </header>


      {/* ================= PRODUCTS ================= */}

      {products.length === 0 ? (

        <div className="products-empty">

          <div className="products-empty-icon">
            🌾
          </div>

          <h2>
            No Products Available
          </h2>

          <p>
            Farmers have not listed any products yet.
          </p>

          <button
            className="details-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>

        </div>

      ) : (

        <section className="products-grid">

          {products.map((product) => (

            <div
              className="product-card"
              key={product._id}
            >

              {/* ================= IMAGE ================= */}

              <div className="crop-image">
                <span>
                  {product.cropName?.charAt(0)}
                </span>
              </div>


              {/* ================= CONTENT ================= */}

              <div className="product-content">

                <div className="product-top">

                  <h2>
                    {product.cropName}
                  </h2>

                  <span className="status">
                    {product.status}
                  </span>

                </div>


                {/* LOCATION */}

                <p className="location">
                  📍 {product.district},{" "}
                  {product.state}
                </p>


                {/* INFO */}

                <div className="product-info">

                  <div>
                    <span>
                      Available
                    </span>

                    <strong>
                      {product.quantity} units
                    </strong>
                  </div>


                  <div>
                    <span>
                      Current MSP
                    </span>

                    <strong>
                      ₹
                      {product.currentMsp?.price ||
                        "N/A"}
                    </strong>
                  </div>

                </div>


                {/* DESCRIPTION */}

                <p className="description">
                  {product.description ||
                    "Quality agricultural produce."}
                </p>


                {/* FARMER */}

                <div className="product-farmer">

                  <span>
                    Farmer
                  </span>

                  <strong>
                    {product.farmer?.name ||
                      "Verified Farmer"}
                  </strong>

                </div>


                {/* DETAILS BUTTON */}

                <button
                  className="details-btn"
                  onClick={() =>
                    navigate(
                      `/product/${product._id}`
                    )
                  }
                >
                  View Details →
                </button>

              </div>

            </div>

          ))}

        </section>

      )}

    </div>
  );
}

export default Products;