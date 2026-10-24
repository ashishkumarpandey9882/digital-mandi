
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import BackButton from "../components/BackButton";
import "./Products.css";

const PAGE_SIZE = 9;

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");
      setProducts(response.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get unique states from actual product data.
  const states = useMemo(
    () =>
      [...new Set(products.map((p) => p.state).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [products]
  );

  // Get districts based on the selected state.
  const districts = useMemo(
    () =>
      [
        ...new Set(
          products
            .filter((p) => !selectedState || p.state === selectedState)
            .map((p) => p.district)
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [products, selectedState]
  );

  // Search, location filtering and sorting.
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.cropName,
          product.state,
          product.district,
          product.description,
          product.farmer?.name,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesState =
        !selectedState || product.state === selectedState;

      const matchesDistrict =
        !selectedDistrict || product.district === selectedDistrict;

      const matchesStatus =
        String(product.status || "").toLowerCase() === "available";

      return (
        matchesSearch &&
        matchesState &&
        matchesDistrict &&
        matchesStatus
      );
    });

    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return String(a.cropName || "").localeCompare(
          String(b.cropName || "")
        );
      }

      if (sortBy === "name-desc") {
        return String(b.cropName || "").localeCompare(
          String(a.cropName || "")
        );
      }

      if (sortBy === "quantity-high") {
        return Number(b.quantity || 0) - Number(a.quantity || 0);
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    });

    return result;
  }, [products, search, selectedState, selectedDistrict, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset pagination whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [search, selectedState, selectedDistrict, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setSelectedState("");
    setSelectedDistrict("");
    setSortBy("newest");
    setPage(1);
  };

  // Loading state.
  if (loading) {
    return (
      <div className="products-message">
        <div className="products-message-back">
          <BackButton fallback="/" />
        </div>

        <div className="loading-icon">🌾</div>
        <h2>Loading Marketplace</h2>
        <p>Fetching fresh produce from farmers...</p>
      </div>
    );
  }

  // Error state.
  if (error) {
    return (
      <div className="products-message error">
        <div className="products-message-back">
          <BackButton fallback="/" />
        </div>

        <div className="loading-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>

        <button className="details-btn" onClick={fetchProducts}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="marketplace">
      {/* Back button */}
      <div className="marketplace-back-row">
        <BackButton fallback="/" />
      </div>

      {/* Marketplace Header */}
      <header className="marketplace-header">
        <div>
          <p className="brand-small">DIGITAL MANDI</p>
          <h1>Fresh Produce Marketplace</h1>
          <p className="subtitle">
            Discover agricultural produce directly from farmers.
          </p>
        </div>

        <div className="product-count">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "Product" : "Products"}
        </div>
      </header>

      {/* Search and Filters */}
      <section
        className="marketplace-toolbar"
        aria-label="Product search and filters"
      >
        <div className="marketplace-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            placeholder="Search crop, farmer, state or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>

        <div className="marketplace-filters">
          <label>
            <span>State</span>

            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
            >
              <option value="">All states</option>

              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>District</span>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">All districts</option>

              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Sort by</span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="name-asc">Crop name: A–Z</option>
              <option value="name-desc">Crop name: Z–A</option>
              <option value="quantity-high">
                Quantity: high to low
              </option>
            </select>
          </label>

          <button
            type="button"
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      </section>

      {/* Empty state: no products in database */}
      {products.length === 0 ? (
        <div className="products-empty">
          <div className="products-empty-icon">🌾</div>
          <h2>No Products Available</h2>
          <p>Farmers have not listed any products yet.</p>

          <button
            className="details-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty state: no search results */
        <div className="products-empty">
          <div className="products-empty-icon">🔎</div>
          <h2>No Matching Products</h2>
          <p>Try another search term or clear your filters.</p>

          <button
            className="details-btn"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="marketplace-results">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(
              currentPage * PAGE_SIZE,
              filteredProducts.length
            )}{" "}
            of {filteredProducts.length} products
          </div>

          {/* Product Cards */}
          <section className="products-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product._id}>
                <div className="crop-image">
                  <span>
                    {product.cropName?.charAt(0)?.toUpperCase() || "🌾"}
                  </span>
                </div>

                <div className="product-content">
                  <div className="product-top">
                    <h2>{product.cropName}</h2>

                    <span
                      className={`status ${
                        String(product.status).toLowerCase() !== "available"
                          ? "status-sold"
                          : ""
                      }`}
                    >
                      {product.status || "Available"}
                    </span>
                  </div>

                  <p className="location">
                    📍 {product.district}, {product.state}
                  </p>

                  <div className="product-info">
                    <div>
                      <span>Available quantity</span>
                      <strong>{product.quantity} units</strong>
                    </div>

                    <div>
                      <span>Current MSP</span>

                      <strong>
                        {product.currentMsp?.price != null
                          ? `₹${product.currentMsp.price}`
                          : "N/A"}
                      </strong>

                      {product.currentMsp?.unit && (
                        <small>{product.currentMsp.unit}</small>
                      )}
                    </div>
                  </div>

                  <p className="description">
                    {product.description ||
                      "Quality agricultural produce from a local farmer."}
                  </p>

                  <div className="product-farmer">
                    <span>Farmer</span>
                    <strong>
                      {product.farmer?.name || "Verified Farmer"}
                    </strong>
                  </div>

                  <button
                    className="details-btn"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    View Details →
                  </button>
                </div>
              </article>
            ))}
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="marketplace-pagination"
              aria-label="Product pages"
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
              >
                ← Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

export default Products;
