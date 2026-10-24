import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import BackButton from "../components/BackButton";
import "./EditProduct.css";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    quantity: "",
    state: "",
    district: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const [cropName, setCropName] = useState("");
  const [currentMsp, setCurrentMsp] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch existing product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`);

        const product = response.data.product;

        setCropName(product.cropName || "");

        setCurrentMsp(product.currentMsp || null);

        setFormData({
          quantity: product.quantity || "",
          state: product.state || "",
          district: product.district || "",
          latitude: product.location?.latitude || "",
          longitude: product.location?.longitude || "",
          description: product.description || "",
        });
      } catch (error) {
        console.error(
          "Failed to fetch product:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Unable to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(`/products/${id}`, {
        quantity: Number(formData.quantity),
        state: formData.state,
        district: formData.district,
        location: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        },
        description: formData.description,
      });

      console.log("Product updated:", response.data);

      setCurrentMsp(response.data.currentMsp);

      setSuccess("Product updated successfully!");

      setTimeout(() => {
        navigate("/my-products");
      }, 1000);
    } catch (error) {
      console.error(
        "Failed to update product:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-product-message">
        <div className="edit-product-back-row">
          <BackButton
            fallback="/my-products"
            label="Back to My Products"
          />
        </div>

        Loading product...
      </div>
    );
  }

  if (error && !cropName) {
    return (
      <div className="edit-product-message error">
        <div className="edit-product-back-row">
          <BackButton
            fallback="/my-products"
            label="Back to My Products"
          />
        </div>

        {error}
      </div>
    );
  }

  return (
    <div className="edit-product-page">

      {/* BACK BUTTON */}
      <div className="edit-product-back-row">
        <BackButton
          fallback="/my-products"
          label="Back to My Products"
        />
      </div>

      <div className="edit-product-container">

        {/* HEADER */}
        <div className="edit-product-header">

          <p className="edit-product-label">
            FARMER PANEL
          </p>

          <h1>
            Edit Product ✏️
          </h1>

          <p>
            Update your agricultural product details.
          </p>

        </div>

        {/* PRODUCT SUMMARY */}
        <div className="edit-product-summary">

          <div className="edit-product-icon">
            {cropName?.charAt(0)}
          </div>

          <div>
            <span>Editing Product</span>

            <h2>
              {cropName}
            </h2>

            {currentMsp && (
              <p>
                Current MSP: ₹{currentMsp.price}
                {" / "}
                {currentMsp.unit}
              </p>
            )}
          </div>

        </div>

        {/* FORM */}
        <form
          className="edit-product-form"
          onSubmit={handleSubmit}
        >

          {/* QUANTITY */}
          <div className="edit-product-field">

            <label>
              Quantity
            </label>

            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />

          </div>

          {/* LOCATION */}
          <div className="edit-product-row">

            <div className="edit-product-field">

              <label>
                State
              </label>

              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />

            </div>

            <div className="edit-product-field">

              <label>
                District
              </label>

              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          {/* COORDINATES */}
          <div className="edit-location-section">

            <h3>
              📍 Product Location
            </h3>

            <p>
              Location is used to calculate transportation
              costs for buyers.
            </p>

            <div className="edit-product-row">

              <div className="edit-product-field">

                <label>
                  Latitude
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  required
                />

              </div>

              <div className="edit-product-field">

                <label>
                  Longitude
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                  required
                />

              </div>

            </div>

          </div>

          {/* DESCRIPTION */}
          <div className="edit-product-field">

            <label>
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Describe your crop..."
            />

          </div>

          {/* MESSAGES */}
          {error && (
            <div className="edit-product-error">
              {error}
            </div>
          )}

          {success && (
            <div className="edit-product-success">
              {success}
            </div>
          )}

          {/* BUTTONS */}
          <div className="edit-product-actions">

            <button
              type="button"
              className="edit-cancel-button"
              onClick={() =>
                navigate("/my-products")
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditProduct;