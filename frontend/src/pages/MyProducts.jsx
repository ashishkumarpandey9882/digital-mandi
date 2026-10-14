import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./MyProducts.css";

function MyProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch farmer's products
  useEffect(() => {
    const fetchMyProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products");

        const allProducts = response.data.products;

        const myProducts = allProducts.filter(
          (product) => product.farmer?._id === user?.id
        );

        setProducts(myProducts);
      } catch (error) {
        console.error(
          "Failed to fetch products:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load your products"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchMyProducts();
    }
  }, [user]);

  // Delete Product
  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");

      await api.delete(`/products/${productId}`);

      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) => product._id !== productId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete product:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete product"
      );
    }
  };

  // Search
  const filteredProducts = products.filter((product) =>
    product.cropName
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // Loading
  if (loading) {
    return (
      <div className="my-products-message">
        Loading your products...
      </div>
    );
  }

  // Error
  if (error && products.length === 0) {
    return (
      <div className="my-products-message error">
        {error}
      </div>
    );
  }

  // Total quantity
  const totalQuantity = products.reduce(
    (total, product) =>
      total + Number(product.quantity || 0),
    0
  );

  // Available products
  const availableProducts = products.filter(
    (product) => product.status === "available"
  ).length;

  return (
    <div className="my-products-page">

      {/* HEADER */}
      <div className="my-products-header">

        <div>
          <p className="my-products-label">
            FARMER PANEL
          </p>

          <h1>
            My Products 🌾
          </h1>

          <p>
            Manage your listed crops and agricultural inventory.
          </p>
        </div>

        <Link
          to="/add-crop"
          className="add-product-button"
        >
          + Add New Crop
        </Link>

      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto 20px",
            padding: "12px 15px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="product-stats">

        <div className="stat-card">
          <div className="stat-icon">
            🌾
          </div>

          <div>
            <span>
              Total Products
            </span>

            <strong>
              {products.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            📦
          </div>

          <div>
            <span>
              Total Quantity
            </span>

            <strong>
              {totalQuantity} units
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>
              Available
            </span>

            <strong>
              {availableProducts}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            📍
          </div>

          <div>
            <span>
              Location
            </span>

            <strong>
              {user?.district}
            </strong>
          </div>
        </div>

      </div>

      {/* PRODUCTS SECTION */}
      <section className="products-section">

        {/* SECTION HEADER */}
        <div className="products-section-header">

          <div>
            <h2>
              Your Listed Products
            </h2>

            <p>
              Crops currently listed on Digital Mandi
            </p>
          </div>

          {/* SEARCH */}
          <div className="product-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search crop..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        {/* EMPTY STATE */}
        {filteredProducts.length === 0 ? (

          <div className="empty-products">

            <div className="empty-icon">
              🌾
            </div>

            <h2>
              {search
                ? "No matching products"
                : "No Products Yet"}
            </h2>

            <p>
              {search
                ? "Try searching for another crop."
                : "Start selling by adding your first crop."}
            </p>

            {!search && (
              <Link
                to="/add-crop"
                className="empty-add-button"
              >
                + Add Your First Crop
              </Link>
            )}

          </div>

        ) : (

          /* PRODUCT GRID */
          <div className="my-products-grid">

            {filteredProducts.map((product) => (

              <div
                className="my-product-card"
                key={product._id}
              >

                {/* PRODUCT IMAGE */}
                <div className="my-product-image">

                  <span>
                    {product.cropName?.charAt(0)}
                  </span>

                  <div className="crop-image-label">
                    Agricultural Produce
                  </div>

                </div>

                {/* PRODUCT CONTENT */}
                <div className="my-product-content">

                  {/* TOP */}
                  <div className="my-product-top">

                    <div>

                      <h2>
                        {product.cropName}
                      </h2>

                      <p className="my-product-location">
                        📍 {product.district},{" "}
                        {product.state}
                      </p>

                    </div>

                    <span className="my-product-status">
                      {product.status}
                    </span>

                  </div>

                  {/* INFO */}
                  <div className="my-product-info">

                    <div>
                      <span>
                        Available Quantity
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
                  <p className="my-product-description">
                    {product.description ||
                      "Quality agricultural produce listed by the farmer."}
                  </p>

                  {/* FOOTER */}
                  <div className="my-product-footer">

                    <span className="product-listed">
                      Listed on Digital Mandi
                    </span>

                    <div className="my-product-actions">

                      {/* EDIT BUTTON */}
                      <button
                        className="edit-product-btn"
                        onClick={() =>
                          navigate(
                            `/edit-product/${product._id}`
                          )
                        }
                      >
                        Edit
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        className="delete-product-btn"
                        onClick={() =>
                          handleDelete(product._id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default MyProducts;