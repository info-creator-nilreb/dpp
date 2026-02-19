"use client";

/**
 * Shared chevron for expandable UI.
 * Same size, weight, and 200ms rotation when expanded.
 * Use CSS to rotate 180° when expanded (e.g. data-expanded or class).
 */
export default function ChevronIcon({
  expanded = false,
  size = 16,
  className = "",
  style = {},
  "aria-hidden": ariaHidden,
}: {
  expanded?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        flexShrink: 0,
        transition: "transform 200ms ease",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        ...style,
      }}
      aria-hidden={ariaHidden}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
