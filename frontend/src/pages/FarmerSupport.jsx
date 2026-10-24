import { useState } from "react";
import BackButton from "../components/BackButton";
import "./FarmerSupport.css";

function FarmerSupport() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    category: "Order issue",
    message: "",
  });
  const [status, setStatus] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(
      "Support request abhi submit nahi hui hai. Backend ticket API connect karna baaki hai."
    );
  }

  return (
    <main className="support-page">

      {/* BACK BUTTON */}
      <div className="support-back-row">
        <BackButton
          fallback="/farmer-dashboard"
          label="Back to Dashboard"
        />
      </div>

      <section className="support-hero">
        <span>WE ARE HERE TO HELP</span>
        <h1>Farmer Support</h1>
        <p>Digital Mandi se judi problem ya query humein batayein.</p>
      </section>

      <section className="support-content">
        <div className="support-intro">
          <h2>How can we help you?</h2>
          <p>
            Apni details aur problem share karein. Is form ko backend ticket
            system se connect karne ke baad requests database mein save hongi.
          </p>
          <div className="support-info">
            <strong>Before submitting</strong>
            <p>Apna sahi contact number aur problem ka clear description dein.</p>
          </div>
        </div>

        <form className="support-form" onSubmit={handleSubmit}>
          <h2>Submit a query</h2>

          <label>
            Full name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              maxLength={100}
            />
          </label>

          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your mobile number"
              pattern="[0-9]{10}"
              title="Enter a 10-digit mobile number"
              required
            />
          </label>

          <label>
            Query category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option>Order issue</option>
              <option>Payment issue</option>
              <option>Product listing</option>
              <option>Account or login</option>
              <option>MSP information</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Describe your problem
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Explain your query..."
              rows={5}
              required
              minLength={10}
              maxLength={2000}
            />
          </label>

          <button type="submit">Submit support request</button>

          {status && (
            <p className="support-status" role="status">
              {status}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default FarmerSupport;