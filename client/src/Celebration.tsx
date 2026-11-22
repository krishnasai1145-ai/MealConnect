import { useEffect, useRef } from 'react';

interface CelebrationProps {
  show: boolean;
  message: string;
  onDone: () => void;
}

const SPARKS = Array.from({ length: 12 }, (_, i) => ({
  left: `${6 + i * 7.5}%`,
  delay: `${i * 70}ms`,
}));

export default function Celebration({ show, message, onDone }: CelebrationProps) {
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => onDoneRef.current(), 2600);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div role="status" aria-live="polite" className="celebration">
      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className="celebration-spark"
          style={{ left: spark.left, animationDelay: spark.delay }}
        />
      ))}
      {message}
    </div>
  );
}
