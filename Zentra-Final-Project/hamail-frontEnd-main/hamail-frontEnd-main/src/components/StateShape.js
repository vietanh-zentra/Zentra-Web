"use client";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const colors = fullConfig.theme.colors;

// Simple SVG shapes for each state with gradients
export default function StateShape({ gradient, shape, size = 160 }) {
  const gradientId = `gradient-${shape}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const shapes = {
    circle: (
      <>
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          opacity="0.4"
        />
        <circle
          cx="60"
          cy="60"
          r="20"
          fill={`url(#${gradientId})`}
          opacity="0.8"
        />
      </>
    ),
    square: (
      <>
        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          opacity="0.4"
        />
        <rect
          x="40"
          y="40"
          width="40"
          height="40"
          fill={`url(#${gradientId})`}
          opacity="0.8"
        />
      </>
    ),
    triangle: (
      <>
        <path
          d="M60 10 L110 105 L10 105 Z"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          opacity="0.4"
        />
        <path
          d="M60 45 L85 90 L35 90 Z"
          fill={`url(#${gradientId})`}
          opacity="0.8"
        />
      </>
    ),
    diamond: (
      <>
        <path
          d="M60 10 L110 60 L60 110 L10 60 Z"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          opacity="0.4"
        />
        <path
          d="M60 40 L85 60 L60 80 L35 60 Z"
          fill={`url(#${gradientId})`}
          opacity="0.8"
        />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradient.start} stopOpacity="1" />
          <stop offset="100%" stopColor={gradient.end} stopOpacity="1" />
        </linearGradient>
      </defs>
      {shapes[shape]}
    </svg>
  );
}

