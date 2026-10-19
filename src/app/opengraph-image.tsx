import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Preview card shown when the site is shared on social media or in chat apps. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#faf8f5",
        color: "#1c1a17",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 44 }}>
        <svg viewBox="0 0 32 32" width="64" height="64">
          <circle cx="16" cy="16" r="14.25" fill="none" stroke="#1c1a17" strokeWidth="1.6" />
          <path d="M11 24.5V14.75a5 5 0 0 1 10 0V24.5Z" fill="#9a5b3c" />
          <path d="M4.4 24.5h23.2" stroke="#1c1a17" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {siteConfig.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 88, lineHeight: 1.05, maxWidth: 900 }}>{siteConfig.tagline}</div>
        <div style={{ fontSize: 30, color: "#6b655c", fontFamily: "Helvetica, Arial, sans-serif" }}>
          Furniture · Lighting · Tableware · Textiles · Decor
        </div>
      </div>
      <div
        style={{ display: "flex", height: 10, width: 160, background: "#9a5b3c", borderRadius: 5 }}
      />
    </div>,
    size,
  );
}
