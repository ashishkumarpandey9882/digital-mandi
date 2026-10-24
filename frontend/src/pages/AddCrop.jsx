import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import "./AddCrop.css";

function AddCrop() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cropName: "",
    quantity: "",
    state: user?.state || "",
    district: user?.district || "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.post("/products", {
        cropName: formData.cropName,
        quantity: Number(formData.quantity),

        state: formData.state,
        district: formData.district,

        location: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        },

        description: formData.description,
      });

      console.log("Product added:", response.data);

      setSuccess("Crop added successfully!");

      setTimeout(() => {
        navigate("/farmer-dashboard");
      }, 1000);

    } catch (error) {
      console.error("Failed to add crop:", error);

      setError(
        error.response?.data?.message ||
        "Failed to add crop"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-crop-page">

      {/* BACK BUTTON */}
      <div className="add-crop-back-row">
        <BackButton
          fallback="/farmer-dashboard"
          label="Back to Dashboard"
        />
      </div>

      <div className="add-crop-container">

        {/* HEADER */}
        <div className="add-crop-header">
          <p className="add-crop-label">
            FARMER PANEL
          </p>

          <h1>
            Add New Crop 🌾
          </h1>

          <p>
            List your agricultural product on Digital Mandi.
          </p>
        </div>


        {/* FORM */}
        <form
          className="add-crop-form"
          onSubmit={handleSubmit}
        >

          {/* CROP NAME */}
          <div className="add-crop-field">

            <label>
              Crop Name
            </label>

            <input
              type="text"
              name="cropName"
              value={formData.cropName}
              onChange={handleChange}
              placeholder="e.g. Wheat"
              required
            />

            <small>
              MSP will be automatically applied.
            </small>

          </div>


          {/* QUANTITY */}
          <div className="add-crop-field">

            <label>
              Quantity
            </label>

            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              min="1"
              required
            />

          </div>


          {/* STATE + DISTRICT */}
          <div className="add-crop-row">

            <div className="add-crop-field">

              <label>
                State
              </label>

              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Haryana"
                required
              />

            </div>


            <div className="add-crop-field">

              <label>
                District
              </label>

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


          {/* LOCATION */}
          <div className="location-section">

            <h3>
              📍 Farmer Location
            </h3>

            <p>
              Location is required to calculate transportation
              cost for buyers.
            </p>

            <div className="add-crop-row">

              <div className="add-crop-field">

                <label>
                  Latitude
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="29.1492"
                  step="any"
                  required
                />

              </div>


              <div className="add-crop-field">

                <label>
                  Longitude
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="75.7217"
                  step="any"
                  required
                />

              </div>

            </div>

          </div>


          {/* DESCRIPTION */}
          <div className="add-crop-field">

            <label>
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your crop..."
              rows="4"
            />

          </div>


          {/* ERROR */}
          {error && (
            <div className="add-crop-error">
              {error}
            </div>
          )}


          {/* SUCCESS */}
          {success && (
            <div className="add-crop-success">
              {success}
            </div>
          )}


          {/* BUTTON */}
          <button
            type="submit"
            className="add-crop-button"
            disabled={loading}
          >
            {loading
              ? "Adding Crop..."
              : "Add Crop"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default AddCrop;