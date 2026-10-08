import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2dd4bf",
          borderRadius: "8px",
          fontWeight: "bold",
          border: "1px solid #1e293b",
        }}
      >
        M
      </div>
    ),
    {
      ...size,
    }
  );
}
