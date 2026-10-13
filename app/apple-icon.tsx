import { ImageResponse } from "next/og";

// iOS home-screen icon (PNG). Same mark as app/icon.svg, without rounded corners (iOS masks them).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#42243e" }}>
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
          <circle cx="24" cy="32" r="13" stroke="#fbf7f2" strokeWidth="4.5" />
          <circle cx="40" cy="32" r="13" stroke="#e3887c" strokeWidth="4.5" />
          <path d="M32 21.75A13 13 0 0 1 32 42.25" stroke="#fbf7f2" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
