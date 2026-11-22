import { useEffect, useState } from 'react';
import { URGENCY_LABELS, formatCountdown, remainingMs, urgencyOf } from './expiry';

interface CountdownBadgeProps {
  pickupBefore: string;
}

export default function CountdownBadge({ pickupBefore }: CountdownBadgeProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = remainingMs(pickupBefore, now);
  const urgency = urgencyOf(remaining);
  const text = formatCountdown(remaining);

  return (
    <>
      <span className={`urgency-badge urgency-badge--${urgency}`}>
        <span className="urgency-dot" aria-hidden="true" />
        {URGENCY_LABELS[urgency]}
      </span>
      <span className="countdown" role="timer" aria-live="off" aria-label={`Time remaining: ${text}`}>
        {text}
      </span>
    </>
  );
}
