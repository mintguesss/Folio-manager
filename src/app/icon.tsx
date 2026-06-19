import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        borderRadius: 40,
        border: "2px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          color: "#e4e4e7",
          fontSize: 100,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: "-4px",
        }}
      >
        F
      </div>
    </div>,
    { width: 512, height: 512 }
  );
}
