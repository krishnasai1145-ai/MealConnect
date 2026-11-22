interface VerificationBadgeProps {
  verified: boolean;
}

export default function VerificationBadge({ verified }: VerificationBadgeProps) {
  return (
    <span className={`verify-badge ${verified ? 'verify-badge--verified' : 'verify-badge--pending'}`}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
        {verified && <path d="M8.5 12l2.5 2.5 4.5-5" />}
      </svg>
      <span>{verified ? '✅ Verified NGO' : 'Verification pending'}</span>
    </span>
  );
}
