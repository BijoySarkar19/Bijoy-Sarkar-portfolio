import { ImageResponse } from "next/og";

export const alt = "Bijoy Sarkar — Software Engineer & AI Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", flexDirection: "column", justifyContent: "center", padding: "78px", background: "radial-gradient(circle at 78% 30%, #08152e, #160b2e 43%, #000 88%)", color: "#f5f5f5", fontFamily: "Arial" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#d4d4d8", fontSize: 17, fontWeight: 700, letterSpacing: "2px" }}><span style={{ display: "flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", border: "1px solid #ff5e2c", borderRadius: 12, color: "#ff5e2c" }}>BS</span> SOFTWARE ENGINEER · AI DEVELOPER</div>
      <div style={{ display: "flex", marginTop: 55, color: "#fff", fontSize: 100, fontWeight: 700, letterSpacing: "-7px" }}>Bijoy Sarkar</div>
      <div style={{ display: "flex", marginTop: 13, color: "#d4d4d8", fontSize: 28 }}>Building intelligent systems and full-stack solutions.</div>
      <div style={{ display: "flex", width: "100%", marginTop: 53, borderTop: "1px solid rgba(255,255,255,.2)" }} />
      <div style={{ display: "flex", marginTop: 28, color: "#ff5e2c", fontSize: 14, fontWeight: 700, letterSpacing: "3px" }}>AI / FULL-STACK / CYBERSECURITY</div>
    </div>,
    size,
  );
}
