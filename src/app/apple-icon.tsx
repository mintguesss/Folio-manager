import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        borderRadius: 38,
      }}
    >
      <div
        style={{
          color: "#e4e4e7",
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: "-4px",
        }}
      >
        F
      </div>
    </div>,
    { width: 180, height: 180 }
  );
}
