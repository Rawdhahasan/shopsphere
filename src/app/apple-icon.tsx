import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the ShopSphere mark on the store's warm canvas colour. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf8f5",
      }}
    >
      <svg viewBox="0 0 32 32" width="132" height="132">
        <circle cx="16" cy="16" r="14.25" fill="none" stroke="#1c1a17" strokeWidth="1.6" />
        <path d="M11 24.5V14.75a5 5 0 0 1 10 0V24.5Z" fill="#9a5b3c" />
        <path d="M4.4 24.5h23.2" stroke="#1c1a17" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>,
    size,
  );
}
