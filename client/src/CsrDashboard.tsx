import { useState } from "react";
import { SPONSORS, totals } from "./csrMock";
import type { Sponsor, SponsorshipType } from "./csrMock";

function pillClass(type: SponsorshipType): string {
  return type === "Delivery" ? "status-pill status-pill--available" : "status-pill status-pill--completed";
}

export default function CsrDashboard(): JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(SPONSORS[0].id);
  const [status, setStatus] = useState<string>("");

  const summary = totals(SPONSORS);
  const selected: Sponsor | undefined = SPONSORS.find((s) => s.id === selectedId) ?? SPONSORS[0];

  return (
    <div>
      <div className="volunteer-kpis">
        <div className="glass-card">
          <span>Meals sponsored</span>
          <strong>{summary.meals.toLocaleString()}</strong>
        </div>
        <div className="glass-card">
          <span>NGOs supported</span>
          <strong>{summary.ngos}</strong>
        </div>
        <div className="glass-card">
          <span>Impact generated</span>
          <strong>{summary.kg.toLocaleString() + " kg rescued"}</strong>
        </div>
      </div>

      <p className="hint">Sample sponsor data for demonstration. Not real company figures.</p>

      <div role="radiogroup" aria-label="Choose a sponsor">
        {SPONSORS.map((s) => {
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={active ? "chip chip--active" : "chip"}
              onClick={() => setSelectedId(s.id)}
            >
              {s.company}
            </button>
          );
        })}
      </div>

      <div className="listing-grid">
        {SPONSORS.map((s) => {
          const isActive = selected !== undefined && s.id === selected.id;
          return (
            <article
              key={s.id}
              className={isActive ? "listing-card glass-card csr-card csr-card--active" : "listing-card glass-card csr-card"}
            >
              <h3>{s.company}</h3>
              <span className="csr-sector">{s.sector}</span>

              <div className="csr-stats">
                <div className="discover-stat">
                  <span className="discover-label">Deliveries</span>
                  <span className="discover-value">{s.deliveriesSponsored}</span>
                </div>
                <div className="discover-stat">
                  <span className="discover-label">Campaigns</span>
                  <span className="discover-value">{s.campaignsSponsored}</span>
                </div>
                <div className="discover-stat">
                  <span className="discover-label">Meals</span>
                  <span className="discover-value">{s.mealsSponsored.toLocaleString()}</span>
                </div>
                <div className="discover-stat">
                  <span className="discover-label">Kg rescued</span>
                  <span className="discover-value">{s.kgRescued.toLocaleString()}</span>
                </div>
              </div>

              <div className="csr-pledge">
                <span>Pledged</span>
                <strong>{"$" + s.pledgedUsd.toLocaleString()}</strong>
              </div>

              <ul className="csr-list">
                {s.sponsorships.map((sp, i) => (
                  <li key={i}>
                    <span className={pillClass(sp.type)}>{sp.type === "Delivery" ? "Delivery" : "Campaign"}</span>{" "}
                    {sp.label} ({sp.meals.toLocaleString()} meals)
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <section>
        <h2>Sponsor a campaign</h2>
        <p className="page-subtitle">
          Companies can sponsor deliveries or food rescue campaigns. Mock flow: no payment is taken.
        </p>
        <button
          type="button"
          className="primary small"
          onClick={() => setStatus("Delivery sponsorship selected for " + (selected?.company ?? ""))}
        >
          Sponsor a delivery
        </button>{" "}
        <button
          type="button"
          className="secondary small"
          onClick={() => setStatus("Campaign sponsorship selected for " + (selected?.company ?? ""))}
        >
          Sponsor a campaign
        </button>
        <div aria-live="polite">{status}</div>
      </section>
    </div>
  );
}
