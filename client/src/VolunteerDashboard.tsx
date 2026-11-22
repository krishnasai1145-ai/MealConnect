import { useState } from "react";
import { makeSamplePickups, nextStatus, type VolunteerPickup, type VolunteerStatus } from "./volunteerSample";

const FILTERS: ("all" | VolunteerStatus)[] = ["all", "Available", "Accepted", "Completed"];

function pillClass(status: VolunteerStatus): string {
  if (status === "Available") return "status-pill status-pill--available";
  if (status === "Accepted") return "status-pill status-pill--claimed";
  return "status-pill status-pill--completed";
}

export default function VolunteerDashboard() {
  const [pickups, setPickups] = useState<VolunteerPickup[]>(() => makeSamplePickups(new Date()));
  const [filter, setFilter] = useState<"all" | VolunteerStatus>("all");
  const [message, setMessage] = useState<string | null>(null);

  const visible = filter === "all" ? pickups : pickups.filter((p) => p.status === filter);
  const countOf = (status: VolunteerStatus) => pickups.filter((p) => p.status === status).length;

  function advance(id: string) {
    const target = pickups.find((p) => p.id === id);
    if (!target) return;
    const next = nextStatus(target.status);
    if (!next) return;
    setPickups((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    setMessage(next === "Accepted" ? `Accepted: ${target.foodName}` : `Marked complete: ${target.foodName}`);
  }

  return (
    <>
      <div className="chip-row" role="radiogroup" aria-label="Filter by status">
        {FILTERS.map((f) => {
          const selected = filter === f;
          const label = f === "all" ? "All" : f;
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={selected}
              className={"chip" + (selected ? " chip--active" : "")}
              onClick={() => setFilter(f)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="volunteer-kpis">
        <div className="glass-card">
          <strong>{countOf("Available")}</strong>
          <span>Available</span>
        </div>
        <div className="glass-card">
          <strong>{countOf("Accepted")}</strong>
          <span>Accepted</span>
        </div>
        <div className="glass-card">
          <strong>{countOf("Completed")}</strong>
          <span>Completed</span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">No pickups in this status</div>
      ) : (
        <div className="listing-grid">
          {visible.map((p) => (
            <article key={p.id} className="listing-card glass-card volunteer-card">
              <h3>{p.foodName}</h3>
              <span className={pillClass(p.status)}>{p.status}</span>

              <div className="volunteer-route">
                <div className="volunteer-stop">
                  <span className="volunteer-label">Pickup location</span>
                  <span>{p.pickupLocation}</span>
                </div>
                <span className="volunteer-arrow" aria-hidden="true">→</span>
                <div className="volunteer-stop">
                  <span className="volunteer-label">Drop location</span>
                  <span>{p.dropLocation}</span>
                </div>
              </div>

              <div className="volunteer-meta">
                <span>Food quantity: {p.quantity} {p.unit}</span>
                <span>
                  Pickup by {new Date(p.pickupBefore).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {p.status === "Available" && (
                <button type="button" className="primary small" onClick={() => advance(p.id)}>
                  Accept pickup
                </button>
              )}
              {p.status === "Accepted" && (
                <button type="button" className="primary small" onClick={() => advance(p.id)}>
                  Mark pickup complete
                </button>
              )}
              {p.status === "Completed" && <span className="volunteer-done">Completed</span>}
            </article>
          ))}
        </div>
      )}

      {message !== null && <div aria-live="polite">{message}</div>}
    </>
  );
}
