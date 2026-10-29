import React from "react";

interface AwazLogoProps {
  variant?: "full" | "icon";
  theme?: "light" | "dark";
  className?: string;
  size?: number; // Height in px, default 36 for full, 36 for icon
}

export default function AwazLogo({
  variant = "full",
  theme = "light",
  className = "",
  size,
}: AwazLogoProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#FFFFFF" : "#17212F";
  const subtextColor = isDark ? "#94A3B8" : "#5B6573";
  const defaultHeight = variant === "icon" ? 36 : 40;
  const height = size || defaultHeight;

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 64 64"
        width={height}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Awaz Icon"
      >
        <defs>
          <linearGradient id="awaz-icon-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="awaz-teal-accent" x1="40" y1="12" x2="45" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#087E8B" />
          </linearGradient>
        </defs>

        {/* Squircle Background */}
        <rect width="64" height="64" rx="16" fill="url(#awaz-icon-bg)" />
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="62.5"
          rx="15.25"
          stroke="white"
          strokeOpacity="0.15"
          strokeWidth="1.5"
        />

        {/* Dynamic Voice & Evidence Soundwave Bars */}
        <rect x="15" y="27" width="5.5" height="15" rx="2.75" fill="#93C5FD" />
        <rect x="23.5" y="19" width="5.5" height="27" rx="2.75" fill="#FFFFFF" />
        <rect x="32" y="14" width="5.5" height="34" rx="2.75" fill="#FFFFFF" />
        <rect x="40.5" y="22" width="5.5" height="22" rx="2.75" fill="url(#awaz-teal-accent)" />
        <circle cx="43.25" cy="14" r="2.75" fill="#2DD4BF" />
      </svg>
    );
  }

  // Full Horizontal Lockup
  // Native aspect ratio: 240 x 48 (5:1)
  const width = Math.round((height / 48) * 240);

  return (
    <svg
      viewBox="0 0 240 48"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Awaz - Public Consumer Evidence"
    >
      <defs>
        <linearGradient id="awaz-full-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="awaz-full-teal" x1="30" y1="9" x2="34" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#087E8B" />
        </linearGradient>
      </defs>

      {/* 48x48 Icon mark */}
      <g transform="translate(0, 0)">
        <rect width="48" height="48" rx="12" fill="url(#awaz-full-bg)" />
        <rect
          x="0.75"
          y="0.75"
          width="46.5"
          height="46.5"
          rx="11.25"
          stroke="white"
          strokeOpacity="0.15"
          strokeWidth="1.5"
        />
        <rect x="11.25" y="20.25" width="4.125" height="11.25" rx="2.06" fill="#93C5FD" />
        <rect x="17.625" y="14.25" width="4.125" height="20.25" rx="2.06" fill="#FFFFFF" />
        <rect x="24" y="10.5" width="4.125" height="25.5" rx="2.06" fill="#FFFFFF" />
        <rect x="30.375" y="16.5" width="4.125" height="16.5" rx="2.06" fill="url(#awaz-full-teal)" />
        <circle cx="32.43" cy="10.5" r="2.06" fill="#2DD4BF" />
      </g>

      {/* Wordmark */}
      <text
        x="60"
        y="27"
        fontFamily="var(--font-inter), system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="800"
        letterSpacing="-0.5"
        fill={textColor}
      >
        Awaz
      </text>

      {/* Descriptor */}
      <text
        x="60"
        y="41"
        fontFamily="var(--font-inter), system-ui, -apple-system, sans-serif"
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="1.2"
        fill={subtextColor}
      >
        PUBLIC CONSUMER EVIDENCE
      </text>
    </svg>
  );
}
