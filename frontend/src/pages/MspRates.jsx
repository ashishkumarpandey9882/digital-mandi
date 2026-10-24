import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton";
import "./MspRates.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://digital-mandi-cl0x.onrender.com"
).replace(/\/$/, "");

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MspRates() {
  const [rates, setRates] = useState([]);
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState("all");
  const [year, setYear] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRates() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/api/msp`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch MSP rates.");
        }

        if (!Array.isArray(data.msps)) {
          throw new Error("Unexpected response from the MSP API.");
        }

        setRates(data.msps);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message ||
              "MSP rates could not be loaded. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRates();

    return () => controller.abort();
  }, []);

  const years = useMemo(
    () =>
      [...new Set(rates.map((item) => item.year).filter(Boolean))].sort(
        (a, b) => b - a
      ),
    [rates]
  );

  const seasons = useMemo(
    () => [...new Set(rates.map((item) => item.season).filter(Boolean))].sort(),
    [rates]
  );

  const filteredRates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rates.filter((item) => {
      const matchesSearch =
        !query ||
        item.cropName?.toLowerCase().includes(query) ||
        item.governmentSource?.toLowerCase().includes(query);

      const matchesSeason = season === "all" || item.season === season;
      const matchesYear = year === "all" || String(item.year) === year;

      return matchesSearch && matchesSeason && matchesYear;
    });
  }, [rates, search, season, year]);

  return (
    <main className="msp-page">
      <div className="msp-back-row">
        <BackButton fallback="/" label="Back to Home" />
      </div>

      <section className="msp-hero">
        <div className="msp-hero-content">
          <span className="msp-eyebrow">PRICE TRANSPARENCY</span>
          <h1>Minimum Support Price</h1>
          <p>
            Explore crop-wise MSP records, agricultural seasons and their
            published sources in one place.
          </p>
          <div className="msp-hero-note">
            <span aria-hidden="true">ⓘ</span>
            <span>
              Rates shown here come from the records currently available in
              Digital Mandi. Check the government source before making a
              financial decision.
            </span>
          </div>
        </div>
      </section>

      <section className="msp-content">
        <div className="msp-section-heading">
          <div>
            <span className="msp-eyebrow">GOVERNMENT PRICE RECORDS</span>
            <h2>Crop-wise MSP rates</h2>
          </div>
          <span className="msp-count">
            {loading ? "Loading…" : `${filteredRates.length} records`}
          </span>
        </div>

        <div className="msp-filters">
          <label className="msp-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search crop name or source..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="msp-filter">
            <span>Season</span>
            <select
              value={season}
              onChange={(event) => setSeason(event.target.value)}
            >
              <option value="all">All seasons</option>
              {seasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="msp-filter">
            <span>Year</span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              <option value="all">All years</option>
              {years.map((item) => (
                <option key={item} value={String(item)}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <div className="msp-state" role="status">
            <span className="msp-spinner" />
            <h3>Loading MSP records</h3>
            <p>Connecting to Digital Mandi...</p>
          </div>
        )}

        {!loading && error && (
          <div className="msp-state msp-error" role="alert">
            <h3>Could not load MSP rates</h3>
            <p>{error}</p>
            <button
              type="button"
              className="msp-retry"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredRates.length === 0 && (
          <div className="msp-state">
            <h3>No matching MSP records</h3>
            <p>Try another crop name, season or year.</p>
            <button
              type="button"
              className="msp-retry"
              onClick={() => {
                setSearch("");
                setSeason("all");
                setYear("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredRates.length > 0 && (
          <>
            <div className="msp-table-wrap">
              <table className="msp-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>MSP price</th>
                    <th>Season</th>
                    <th>Year</th>
                    <th>Effective period</th>
                    <th>Government source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRates.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong className="msp-crop-name">
                          {item.cropName}
                        </strong>
                      </td>
                      <td>
                        <strong className="msp-price">
                          {formatPrice(item.mspPrice)}
                        </strong>
                        <small className="msp-unit">
                          per {item.unit || "quintal"}
                        </small>
                      </td>
                      <td>
                        <span className="msp-season">{item.season}</span>
                      </td>
                      <td>{item.year}</td>
                      <td>
                        <span className="msp-date">
                          {formatDate(item.effectiveFrom)}
                        </span>
                        <small className="msp-unit">
                          to {formatDate(item.effectiveTo)}
                        </small>
                      </td>
                      <td>
                        <a
                          className="msp-source"
                          href={item.governmentSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View source ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="msp-mobile-list">
              {filteredRates.map((item) => (
                <article className="msp-rate-card" key={item._id}>
                  <div className="msp-card-top">
                    <div>
                      <h3>{item.cropName}</h3>
                      <span className="msp-season">{item.season}</span>
                    </div>
                    <div className="msp-card-price">
                      <strong>{formatPrice(item.mspPrice)}</strong>
                      <small>per {item.unit || "quintal"}</small>
                    </div>
                  </div>
                  <div className="msp-card-details">
                    <span>Year</span>
                    <strong>{item.year}</strong>
                    <span>Effective from</span>
                    <strong>{formatDate(item.effectiveFrom)}</strong>
                    <span>Effective to</span>
                    <strong>{formatDate(item.effectiveTo)}</strong>
                  </div>
                  <a
                    className="msp-source"
                    href={item.governmentSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View government source ↗
                  </a>
                </article>
              ))}
            </div>
          </>
        )}

        <p className="msp-disclaimer">
          Digital Mandi displays stored MSP records for reference. Availability
          of a record does not independently verify its authenticity or
          guarantee that it is the latest official rate.
        </p>
      </section>
    </main>
  );
}

export default MspRates;