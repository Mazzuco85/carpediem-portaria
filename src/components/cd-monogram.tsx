export function CdMonogram({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="CarpeDiem Residences">
      <defs>
        <linearGradient id="gold" x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7DFA2" />
          <stop offset="1" stopColor="#B7873D" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="#101316" stroke="url(#gold)" strokeWidth="2" />
      <path d="M24 20C16 20 12 25.4 12 32C12 38.6 16 44 24 44C28.2 44 31.2 42.8 33.6 40.3L30.8 36.8C29.1 38.4 27.2 39.2 24.8 39.2C20.4 39.2 17.8 36 17.8 32C17.8 27.9 20.4 24.8 24.9 24.8C27.3 24.8 29 25.6 30.7 27.2L33.6 23.7C31.3 21.3 28.2 20 24 20Z" fill="url(#gold)" />
      <path d="M35 20H43.2C52.5 20 57 25.5 57 32C57 38.5 52.5 44 43.2 44H35V20ZM40.7 24.8V39.2H43C48.6 39.2 51.1 36 51.1 32C51.1 27.8 48.6 24.8 43 24.8H40.7Z" fill="url(#gold)" />
    </svg>
  );
}
