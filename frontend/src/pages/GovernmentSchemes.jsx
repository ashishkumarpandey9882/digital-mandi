import { useState } from "react";
import BackButton from "../components/BackButton";
import "./GovernmentSchemes.css";

const schemes = [
  {
    name: "PM-KISAN",
    description:
      "Eligible landholding farmer families ke liye income-support scheme.",
    benefit:
      "Scheme guidelines ke anusaar eligible beneficiaries ko ₹6,000 per year, teen instalments mein.",
    eligibility:
      "Eligibility land records, beneficiary category aur applicable exclusion rules par depend karti hai.",
    link: "https://pmkisan.gov.in/",
    label: "Visit official PM-KISAN website",
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana",
    description:
      "Notified crops aur eligible farmers ke liye crop insurance scheme.",
    benefit:
      "Covered risks aur policy conditions ke anusaar crop-loss insurance protection.",
    eligibility:
      "Notified area, crop, season aur current scheme rules ke hisaab se eligibility check karein.",
    link: "https://pmfby.gov.in/",
    label: "Visit official PMFBY website",
  },
  {
    name: "Kisan Credit Card",
    description:
      "Agricultural aur eligible allied activities ke liye institutional credit facility.",
    benefit:
      "Eligible borrowers ko applicable banking terms ke anusaar credit access.",
    eligibility:
      "Eligibility bank, farming activity, documentation aur current lending rules par depend karti hai.",
    link: "https://www.myscheme.gov.in/",
    label: "Check official scheme information",
  },
  {
    name: "Soil Health Card",
    description:
      "Soil testing aur nutrient-management recommendations se judi government initiative.",
    benefit:
      "Soil health aur suitable fertiliser use ke baare mein recommendations.",
    eligibility:
      "Apne area mein soil testing aur card services ki availability official agriculture department se check karein.",
    link: "https://soilhealth.dac.gov.in/",
    label: "Visit official Soil Health portal",
  },
];

function GovernmentSchemes() {
  const [search, setSearch] = useState("");

  const filteredSchemes = schemes.filter((scheme) =>
    `${scheme.name} ${scheme.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <main className="schemes-page">

      {/* BACK BUTTON */}
      <div className="schemes-back-row">
        <BackButton
          fallback="/farmer-dashboard"
          label="Back to Dashboard"
        />
      </div>

      <section className="schemes-hero">
        <span>FARMER RESOURCES</span>
        <h1>Government Schemes</h1>
        <p>
          Explore agricultural support programmes and verify the latest
          eligibility and application details through official sources.
        </p>
      </section>

      <section className="schemes-content">
        <div className="schemes-heading">
          <div>
            <span>INFORMATION DIRECTORY</span>
            <h2>Schemes for farmers</h2>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search schemes..."
            aria-label="Search government schemes"
          />
        </div>

        <div className="schemes-grid">
          {filteredSchemes.map((scheme) => (
            <article className="scheme-card" key={scheme.name}>
              <div className="scheme-card-mark" aria-hidden="true">✳</div>
              <h3>{scheme.name}</h3>
              <p>{scheme.description}</p>

              <div className="scheme-detail">
                <strong>Potential benefit</strong>
                <p>{scheme.benefit}</p>
              </div>

              <div className="scheme-detail">
                <strong>Eligibility</strong>
                <p>{scheme.eligibility}</p>
              </div>

              <a href={scheme.link} target="_blank" rel="noreferrer">
                {scheme.label} ↗
              </a>
            </article>
          ))}
        </div>

        {filteredSchemes.length === 0 && (
          <p className="schemes-empty">No matching schemes found.</p>
        )}

        <p className="schemes-disclaimer">
          This page is an information directory, not an eligibility decision
          or application service. Scheme rules and benefits may change. Verify
          current details on the linked official website before applying.
        </p>
      </section>
    </main>
  );
}

export default GovernmentSchemes;