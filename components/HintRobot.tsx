/*
 * Little trash-compactor-style robot used as the HINT button icon.
 * An original design (boxy body, binocular eyes, tank treads),
 * not a copy of any movie character.
 */
export default function HintRobot({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
    >
      {/* Treads */}
      <rect x="3" y="35" width="17" height="10" rx="5" fill="#374151" />
      <rect x="28" y="35" width="17" height="10" rx="5" fill="#374151" />
      <circle cx="8" cy="40" r="2.2" fill="#9ca3af" />
      <circle cx="15" cy="40" r="2.2" fill="#9ca3af" />
      <circle cx="33" cy="40" r="2.2" fill="#9ca3af" />
      <circle cx="40" cy="40" r="2.2" fill="#9ca3af" />

      {/* Arms */}
      <rect x="6" y="25" width="7" height="4" rx="1.5" fill="#6b7280" />
      <rect x="35" y="25" width="7" height="4" rx="1.5" fill="#6b7280" />

      {/* Boxy body */}
      <rect x="12" y="19" width="24" height="17" rx="2" fill="#e0a526" stroke="#8a5a14" strokeWidth="1.5" />
      <rect x="15" y="22" width="11" height="5" rx="1" fill="#8a5a14" opacity="0.45" />
      <circle cx="31" cy="24.5" r="1.8" fill="#facc15" stroke="#8a5a14" strokeWidth="0.8" />
      <rect x="15" y="30" width="18" height="2" rx="1" fill="#8a5a14" opacity="0.35" />

      {/* Neck */}
      <rect x="22" y="13" width="4" height="7" fill="#6b7280" />

      {/* Binocular eyes */}
      <rect x="11" y="5" width="12" height="10" rx="4.5" fill="#9ca3af" stroke="#4b5563" strokeWidth="1.2" />
      <rect x="25" y="5" width="12" height="10" rx="4.5" fill="#9ca3af" stroke="#4b5563" strokeWidth="1.2" />
      <circle cx="17" cy="10" r="3.2" fill="#111827" />
      <circle cx="31" cy="10" r="3.2" fill="#111827" />
      <circle cx="18" cy="9" r="1" fill="#e5e7eb" />
      <circle cx="32" cy="9" r="1" fill="#e5e7eb" />
    </svg>
  );
}
