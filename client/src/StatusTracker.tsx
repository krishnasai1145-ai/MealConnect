import type { FoodStatus } from './api';

const STEPS: FoodStatus[] = ['Posted', 'Claimed', 'Collected', 'Delivered'];

interface StatusTrackerProps {
  status: FoodStatus;
}

export default function StatusTracker({ status }: StatusTrackerProps) {
  const current = STEPS.indexOf(status);
  return (
    <ol className="status-tracker" aria-label="Pickup progress">
      {STEPS.map((step, index) => {
        const reached = index <= current;
        return (
          <li key={step} className={`status-tracker-step${reached ? ' is-reached' : ''}`}>
            <span aria-hidden="true">{reached ? '✅' : '⬜'}</span>
            <span>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
