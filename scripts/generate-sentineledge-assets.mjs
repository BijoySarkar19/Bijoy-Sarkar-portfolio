import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const outDir = join(process.cwd(), "public", "projects", "sentineledge");
mkdirSync(outDir, { recursive: true });

function getSvg1() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1280" y2="720" gradientUnits="userSpaceOnUse">
        <stop stop-color="#080c14" />
        <stop offset="0.5" stop-color="#0b121e" />
        <stop offset="1" stop-color="#06090e" />
      </linearGradient>
      <radialGradient id="cyanGlow" cx="0" cy="0" r="1" gradientTransform="translate(260 140) rotate(45) scale(540 400)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#00f2fe" stop-opacity="0.16" />
        <stop offset="1" stop-color="#00f2fe" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="orangeGlow" cx="0" cy="0" r="1" gradientTransform="translate(1050 480) rotate(120) scale(400 320)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ff5e2c" stop-opacity="0.18" />
        <stop offset="1" stop-color="#ff5e2c" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
      </pattern>
      <filter id="blurFilter" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="8" />
      </filter>
    </defs>

    <!-- Base Canvas Backgrounds -->
    <rect width="1280" height="720" fill="url(#bg)" />
    <rect width="1280" height="720" fill="url(#cyanGlow)" />
    <rect width="1280" height="720" fill="url(#orangeGlow)" />
    <rect width="1280" height="720" fill="url(#grid)" />

    <!-- Top Navigation / Telemetry Header -->
    <rect x="40" y="32" width="1200" height="64" rx="14" fill="#0f1726" fill-opacity="0.85" stroke="#1f2d45" stroke-width="1.5" />
    
    <!-- SentinelEdge Brand -->
    <rect x="58" y="48" width="32" height="32" rx="8" fill="#ff5e2c" fill-opacity="0.18" stroke="#ff5e2c" stroke-width="1.5" />
    <circle cx="74" cy="64" r="6" fill="#ff5e2c" />
    <circle cx="74" cy="64" r="10" stroke="#ff5e2c" stroke-width="1.2" stroke-dasharray="3 3" />
    
    <text x="102" y="62" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="1.2">SENTINELEDGE</text>
    <text x="102" y="75" fill="#7d8a9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" letter-spacing="1">EDGE-TO-CLOUD INCIDENT INTELLIGENCE</text>

    <!-- Status Badges in Header -->
    <rect x="520" y="49" width="112" height="30" rx="7" fill="#0c1e18" stroke="#10b981" stroke-opacity="0.4" stroke-width="1" />
    <circle cx="536" cy="64" r="4" fill="#10b981" />
    <text x="548" y="68" fill="#34d399" font-family="monospace" font-size="11" font-weight="600">EDGE LIVE</text>

    <rect x="644" y="49" width="136" height="30" rx="7" fill="#161b2e" stroke="#00f2fe" stroke-opacity="0.3" stroke-width="1" />
    <text x="656" y="68" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="600">LATENCY · 12.4ms</text>

    <rect x="792" y="49" width="124" height="30" rx="7" fill="#161b2e" stroke="#253552" stroke-width="1" />
    <text x="804" y="68" fill="#94a3b8" font-family="monospace" font-size="11" font-weight="600">FPS · 60.0 STABLE</text>

    <rect x="928" y="49" width="144" height="30" rx="7" fill="#161b2e" stroke="#253552" stroke-width="1" />
    <text x="940" y="68" fill="#94a3b8" font-family="monospace" font-size="11" font-weight="600">ZERO-TRUST · E2EE</text>

    <rect x="1084" y="49" width="138" height="30" rx="7" fill="#2d140e" stroke="#ff5e2c" stroke-opacity="0.5" stroke-width="1" />
    <circle cx="1098" cy="64" r="4" fill="#ff5e2c" />
    <text x="1110" y="68" fill="#ff8c69" font-family="monospace" font-size="11" font-weight="700">ALERT ENGINE ON</text>

    <!-- Main Workspace Layout: Left Primary Video Feed (740px), Right Telemetry Panel (440px) -->
    
    <!-- Primary Video Neural Stream Viewport -->
    <rect x="40" y="116" width="760" height="440" rx="14" fill="#05080e" stroke="#1f2d45" stroke-width="1.5" />
    
    <!-- Viewport Top Overlay Bar -->
    <rect x="40" y="116" width="760" height="42" rx="14" fill="#0d1522" fill-opacity="0.9" />
    <circle cx="64" cy="137" r="4" fill="#ff4444" />
    <text x="76" y="141" fill="#f87171" font-family="monospace" font-size="11" font-weight="700">CAM-04 · PERIMETER GATEWAY NORTH</text>
    <text x="640" y="141" fill="#64748b" font-family="monospace" font-size="11">RTSP://EDGE-NODE-01:8554</text>
    <line x1="40" y1="158" x2="800" y2="158" stroke="#1e293b" stroke-width="1" />

    <!-- Simulated Scene Vectors (Camera POV with perspective street / warehouse) -->
    <path d="M40 480L340 320L480 320L800 480" fill="#090f1a" fill-opacity="0.6" />
    <line x1="340" y1="320" x2="480" y2="320" stroke="#1e293b" stroke-width="1" />
    <line x1="380" y1="320" x2="280" y2="556" stroke="#152136" stroke-width="1" stroke-dasharray="4 4" />
    <line x1="440" y1="320" x2="560" y2="556" stroke="#152136" stroke-width="1" stroke-dasharray="4 4" />

    <!-- Neural Detection Box 1: Authorized Security Personnel (with Privacy Redaction) -->
    <rect x="180" y="240" width="130" height="240" rx="4" fill="#00f2fe" fill-opacity="0.04" stroke="#00f2fe" stroke-width="1.8" />
    <!-- Bounding Box Corners Accent -->
    <path d="M180 252V240H192 M310 252V240H298 M180 468V480H192 M310 468V480H298" stroke="#00f2fe" stroke-width="2.5" />
    <!-- Label -->
    <rect x="180" y="216" width="130" height="24" rx="4" fill="#00f2fe" />
    <text x="188" y="232" fill="#06121e" font-family="monospace" font-size="11" font-weight="700">PERSON · 99.2%</text>
    <!-- Privacy Face Redaction Mask at Edge -->
    <rect x="220" y="255" width="48" height="52" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-dasharray="3 3" />
    <text x="223" y="284" fill="#38bdf8" font-family="monospace" font-size="8" font-weight="700">REDACTED</text>
    <text x="225" y="296" fill="#64748b" font-family="monospace" font-size="7">PRIVACY</text>

    <!-- Neural Detection Box 2: Critical Incident Detected (Unattended Perimeter Breach) -->
    <rect x="470" y="210" width="190" height="270" rx="4" fill="#ff5e2c" fill-opacity="0.06" stroke="#ff5e2c" stroke-width="2" />
    <!-- Bounding Box Corners Accent -->
    <path d="M470 224V210H484 M660 224V210H646 M470 466V480H484 M660 466V480H646" stroke="#ff5e2c" stroke-width="3" />
    <!-- Label -->
    <rect x="470" y="184" width="190" height="26" rx="4" fill="#ff5e2c" />
    <text x="478" y="201" fill="#ffffff" font-family="monospace" font-size="11" font-weight="800">ALERT: PERIMETER BREACH</text>
    <!-- Privacy License Plate / ID Redaction -->
    <rect x="520" y="380" width="90" height="34" rx="4" fill="#0c121e" stroke="#ff5e2c" stroke-dasharray="3 3" />
    <text x="526" y="401" fill="#ff7a50" font-family="monospace" font-size="9" font-weight="700">PLATE REDACTED</text>

    <!-- Live Telemetry Sub-overlay inside Viewport -->
    <rect x="56" y="494" width="380" height="48" rx="8" fill="#080d16" fill-opacity="0.92" stroke="#1f2d45" stroke-width="1" />
    <text x="70" y="514" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">EDGE INFERENCE: 14.1ms · TENSORRT ENGINE</text>
    <text x="70" y="531" fill="#94a3b8" font-family="monospace" font-size="10">REDACTION ON DEVICE · ZERO RAW FRAME LEAKAGE</text>

    <!-- Right Sidebar: Real-time Incident Feed & Telemetry (440px wide) -->
    <rect x="820" y="116" width="420" height="440" rx="14" fill="#0c1322" stroke="#1f2d45" stroke-width="1.5" />
    
    <!-- Sidebar Header -->
    <rect x="820" y="116" width="420" height="46" rx="14" fill="#111c2e" />
    <text x="840" y="144" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" letter-spacing="1">LIVE INCIDENT &amp; TELEMETRY STREAM</text>
    <circle cx="1216" cy="139" r="4" fill="#10b981" />
    <line x1="820" y1="162" x2="1240" y2="162" stroke="#1e293b" stroke-width="1" />

    <!-- Incident Item 1 (Critical) -->
    <rect x="836" y="174" width="388" height="74" rx="8" fill="#1a141d" stroke="#ef4444" stroke-opacity="0.4" stroke-width="1" />
    <rect x="848" y="186" width="60" height="20" rx="4" fill="#ef4444" fill-opacity="0.2" />
    <text x="856" y="200" fill="#f87171" font-family="monospace" font-size="9" font-weight="700">CRITICAL</text>
    <text x="918" y="200" fill="#cbd5e1" font-family="monospace" font-size="10">01:08:14 IST · CAM-04</text>
    <text x="848" y="222" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="12" font-weight="600">Perimeter Intrusion Detected</text>
    <text x="848" y="238" fill="#94a3b8" font-family="monospace" font-size="10">Sub-second dispatch sent to Cloud Cluster (8ms)</text>

    <!-- Incident Item 2 (Warning) -->
    <rect x="836" y="258" width="388" height="74" rx="8" fill="#1c1917" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="1" />
    <rect x="848" y="270" width="64" height="20" rx="4" fill="#f59e0b" fill-opacity="0.2" />
    <text x="856" y="284" fill="#fbbf24" font-family="monospace" font-size="9" font-weight="700">WARNING</text>
    <text x="922" y="284" fill="#cbd5e1" font-family="monospace" font-size="10">01:07:52 IST · CAM-02</text>
    <text x="848" y="306" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="12" font-weight="600">Unattended Object in Transit Corridor</text>
    <text x="848" y="322" fill="#94a3b8" font-family="monospace" font-size="10">Neural persistence threshold reached (45s)</text>

    <!-- Incident Item 3 (Info / Redaction Log) -->
    <rect x="836" y="342" width="388" height="74" rx="8" fill="#101a28" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="1" />
    <rect x="848" y="354" width="70" height="20" rx="4" fill="#3b82f6" fill-opacity="0.2" />
    <text x="856" y="368" fill="#60a5fa" font-family="monospace" font-size="9" font-weight="700">REDACTED</text>
    <text x="928" y="368" fill="#cbd5e1" font-family="monospace" font-size="10">01:07:30 IST · CAM-01</text>
    <text x="848" y="390" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="12" font-weight="600">Privacy Mask Applied to 14 Identifiers</text>
    <text x="848" y="406" fill="#94a3b8" font-family="monospace" font-size="10">Zero unredacted PII committed to storage</text>

    <!-- Incident Item 4 (Audit / Sync) -->
    <rect x="836" y="426" width="388" height="74" rx="8" fill="#0d1b18" stroke="#10b981" stroke-opacity="0.3" stroke-width="1" />
    <rect x="848" y="438" width="56" height="20" rx="4" fill="#10b981" fill-opacity="0.2" />
    <text x="856" y="452" fill="#34d399" font-family="monospace" font-size="9" font-weight="700">SYNCED</text>
    <text x="914" y="452" fill="#cbd5e1" font-family="monospace" font-size="10">01:07:01 IST · CLUSTER</text>
    <text x="848" y="474" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="12" font-weight="600">Telemetry Batch Synced (1,240 frames)</text>
    <text x="848" y="490" fill="#94a3b8" font-family="monospace" font-size="10">SHA-256: e8b94f...9c1a · Verified</text>

    <!-- Bottom Metrics & Tech Stack Strip -->
    <rect x="40" y="574" width="1200" height="114" rx="14" fill="#0e1524" stroke="#1f2d45" stroke-width="1.5" />

    <!-- Stat 1 -->
    <text x="68" y="612" fill="#718096" font-family="monospace" font-size="11" font-weight="600">EDGE INFERENCE SPEED</text>
    <text x="68" y="648" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="28" font-weight="800">12.4<tspan font-size="16" fill="#ff5e2c"> ms</tspan></text>
    <text x="68" y="670" fill="#34d399" font-family="monospace" font-size="10">↑ Sub-second SLA</text>

    <line x1="300" y1="588" x2="300" y2="674" stroke="#1f2d45" stroke-width="1" />

    <!-- Stat 2 -->
    <text x="330" y="612" fill="#718096" font-family="monospace" font-size="11" font-weight="600">ON-DEVICE PRIVACY RATE</text>
    <text x="330" y="648" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="28" font-weight="800">100<tspan font-size="16" fill="#00f2fe">%</tspan></text>
    <text x="330" y="670" fill="#38bdf8" font-family="monospace" font-size="10">Zero-leakage edge masking</text>

    <line x1="570" y1="588" x2="570" y2="674" stroke="#1f2d45" stroke-width="1" />

    <!-- Stat 3 -->
    <text x="600" y="612" fill="#718096" font-family="monospace" font-size="11" font-weight="600">BANDWIDTH EFFICIENCY</text>
    <text x="600" y="648" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="28" font-weight="800">87.4<tspan font-size="16" fill="#10b981">%</tspan></text>
    <text x="600" y="670" fill="#34d399" font-family="monospace" font-size="10">Saved via event telemetry</text>

    <line x1="840" y1="588" x2="840" y2="674" stroke="#1f2d45" stroke-width="1" />

    <!-- Tech Stack Tags in Stat 4 Area -->
    <text x="870" y="612" fill="#718096" font-family="monospace" font-size="11" font-weight="600">CORE ARCHITECTURE</text>
    <g transform="translate(870, 626)">
      <rect x="0" y="0" width="76" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="10" y="16" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">Edge AI</text>
      
      <rect x="84" y="0" width="78" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="94" y="16" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">PyTorch</text>

      <rect x="170" y="0" width="76" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="180" y="16" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">FastAPI</text>

      <rect x="254" y="0" width="76" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="264" y="16" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">WebRTC</text>

      <rect x="0" y="30" width="76" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="10" y="46" fill="#ff7a50" font-family="monospace" font-size="10" font-weight="600">Docker</text>

      <rect x="84" y="30" width="94" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="94" y="46" fill="#ff7a50" font-family="monospace" font-size="10" font-weight="600">Zero-Trust</text>

      <rect x="186" y="30" width="144" height="24" rx="5" fill="#182338" stroke="#253552" />
      <text x="196" y="46" fill="#34d399" font-family="monospace" font-size="10" font-weight="600">Incident Engine</text>
    </g>
  </svg>`;
}

function getSvg2() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="none">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1280" y2="720" gradientUnits="userSpaceOnUse">
        <stop stop-color="#080c14" />
        <stop offset="0.5" stop-color="#0a1220" />
        <stop offset="1" stop-color="#05080e" />
      </linearGradient>
      <radialGradient id="purpleGlow" cx="0" cy="0" r="1" gradientTransform="translate(300 200) rotate(50) scale(500 400)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8b5cf6" stop-opacity="0.16" />
        <stop offset="1" stop-color="#8b5cf6" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="cyanGlow2" cx="0" cy="0" r="1" gradientTransform="translate(1000 400) rotate(130) scale(450 350)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#00f2fe" stop-opacity="0.16" />
        <stop offset="1" stop-color="#00f2fe" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
      </pattern>
    </defs>

    <rect width="1280" height="720" fill="url(#bg2)" />
    <rect width="1280" height="720" fill="url(#purpleGlow)" />
    <rect width="1280" height="720" fill="url(#cyanGlow2)" />
    <rect width="1280" height="720" fill="url(#grid2)" />

    <!-- Header -->
    <rect x="40" y="32" width="1200" height="64" rx="14" fill="#0f1726" fill-opacity="0.85" stroke="#1f2d45" stroke-width="1.5" />
    <text x="64" y="68" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700" letter-spacing="1.2">SENTINELEDGE · NEURAL ARCHITECTURE PIPELINE</text>
    <text x="880" y="68" fill="#00f2fe" font-family="monospace" font-size="12" font-weight="600">ZERO-LEAK PRIVACY REDACTION AT EDGE</text>

    <!-- Architectural Pipeline Cards: 4 Stages -->
    
    <!-- Stage 1: Ingestion -->
    <rect x="40" y="126" width="270" height="400" rx="12" fill="#0d1524" stroke="#1e2d44" stroke-width="1.5" />
    <rect x="40" y="126" width="270" height="44" rx="12" fill="#141f33" />
    <text x="56" y="153" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="700">01 · INGESTION LAYER</text>
    
    <text x="56" y="200" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="14" font-weight="700">Multi-Stream Video Ingest</text>
    <text x="56" y="224" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="11" line-height="1.4">Continuous hardware-accelerated RTSP, WebRTC, and MIPI CSI-2 camera feeds.</text>
    
    <rect x="56" y="270" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="68" y="291" fill="#cbd5e1" font-family="monospace" font-size="10">RTSP / WebRTC / H.264 / H.265</text>
    
    <rect x="56" y="316" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="68" y="337" fill="#cbd5e1" font-family="monospace" font-size="10">Zero-copy DMA Frame Ring Buffer</text>
    
    <rect x="56" y="362" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="68" y="383" fill="#cbd5e1" font-family="monospace" font-size="10">Adaptive Bitrate &amp; Jitter Queue</text>

    <rect x="56" y="440" width="238" height="60" rx="8" fill="#08101a" stroke="#00f2fe" stroke-opacity="0.3" />
    <text x="68" y="462" fill="#38bdf8" font-family="monospace" font-size="9" font-weight="700">LATENCY BENCHMARK</text>
    <text x="68" y="484" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="18" font-weight="800">2.1 ms <tspan font-size="10" fill="#94a3b8">Ingest Delay</tspan></text>

    <!-- Arrow 1 to 2 -->
    <path d="M316 326h28m-10-8l10 8l-10 8" stroke="#ff5e2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Stage 2: Neural Inference -->
    <rect x="350" y="126" width="270" height="400" rx="12" fill="#0d1524" stroke="#1e2d44" stroke-width="1.5" />
    <rect x="350" y="126" width="270" height="44" rx="12" fill="#141f33" />
    <text x="366" y="153" fill="#ff7a50" font-family="monospace" font-size="11" font-weight="700">02 · NEURAL INFERENCE</text>
    
    <text x="366" y="200" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="14" font-weight="700">On-Device Edge Models</text>
    <text x="366" y="224" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="11">Quantized PyTorch and TensorRT engine running locally on edge GPU/NPU.</text>
    
    <rect x="366" y="270" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="378" y="291" fill="#cbd5e1" font-family="monospace" font-size="10">Spatial Object Detection (YOLO-v10)</text>
    
    <rect x="366" y="316" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="378" y="337" fill="#cbd5e1" font-family="monospace" font-size="10">Temporal Incident Tracking</text>
    
    <rect x="366" y="362" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="378" y="383" fill="#cbd5e1" font-family="monospace" font-size="10">Anomaly &amp; Intrusion Classifier</text>

    <rect x="366" y="440" width="238" height="60" rx="8" fill="#190e09" stroke="#ff5e2c" stroke-opacity="0.4" />
    <text x="378" y="462" fill="#ff7a50" font-family="monospace" font-size="9" font-weight="700">INFERENCE SPEED</text>
    <text x="378" y="484" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="18" font-weight="800">10.3 ms <tspan font-size="10" fill="#94a3b8">TensorRT FP16</tspan></text>

    <!-- Arrow 2 to 3 -->
    <path d="M626 326h28m-10-8l10 8l-10 8" stroke="#ff5e2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Stage 3: Privacy Redaction -->
    <rect x="660" y="126" width="270" height="400" rx="12" fill="#0d1524" stroke="#1e2d44" stroke-width="1.5" />
    <rect x="660" y="126" width="270" height="44" rx="12" fill="#141f33" />
    <text x="676" y="153" fill="#34d399" font-family="monospace" font-size="11" font-weight="700">03 · PRIVACY REDACTION</text>
    
    <text x="676" y="200" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="14" font-weight="700">Zero-Leak Edge Anonymizer</text>
    <text x="676" y="224" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="11">Real-time facial and license plate pixelation before any network transmission.</text>
    
    <rect x="676" y="270" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="688" y="291" fill="#cbd5e1" font-family="monospace" font-size="10">Facial Geometric Masking</text>
    
    <rect x="676" y="316" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="688" y="337" fill="#cbd5e1" font-family="monospace" font-size="10">License Plate Morphological Blur</text>
    
    <rect x="676" y="362" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="688" y="383" fill="#cbd5e1" font-family="monospace" font-size="10">Hardware Keystore PII Hash</text>

    <rect x="676" y="440" width="238" height="60" rx="8" fill="#081712" stroke="#10b981" stroke-opacity="0.4" />
    <text x="688" y="462" fill="#34d399" font-family="monospace" font-size="9" font-weight="700">PII RETENTION</text>
    <text x="688" y="484" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="18" font-weight="800">0.00 % <tspan font-size="10" fill="#94a3b8">Zero Raw Frames</tspan></text>

    <!-- Arrow 3 to 4 -->
    <path d="M936 326h28m-10-8l10 8l-10 8" stroke="#ff5e2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Stage 4: Cloud Telemetry -->
    <rect x="970" y="126" width="270" height="400" rx="12" fill="#0d1524" stroke="#1e2d44" stroke-width="1.5" />
    <rect x="970" y="126" width="270" height="44" rx="12" fill="#141f33" />
    <text x="986" y="153" fill="#a78bfa" font-family="monospace" font-size="11" font-weight="700">04 · CLOUD SYNC</text>
    
    <text x="986" y="200" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="14" font-weight="700">Encrypted Telemetry Dispatch</text>
    <text x="986" y="224" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="11">Only encrypted incident metadata and redacted evidence are dispatched to cloud.</text>
    
    <rect x="986" y="270" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="998" y="291" fill="#cbd5e1" font-family="monospace" font-size="10">TLS 1.3 mTLS Authentication</text>
    
    <rect x="986" y="316" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="998" y="337" fill="#cbd5e1" font-family="monospace" font-size="10">SQLite Offline Buffer / Failover</text>
    
    <rect x="986" y="362" width="238" height="34" rx="6" fill="#111c2e" stroke="#233550" />
    <text x="998" y="383" fill="#cbd5e1" font-family="monospace" font-size="10">Cloud Cluster Incident Ingest</text>

    <rect x="986" y="440" width="238" height="60" rx="8" fill="#140f24" stroke="#a78bfa" stroke-opacity="0.4" />
    <text x="998" y="462" fill="#c084fc" font-family="monospace" font-size="9" font-weight="700">SYNC EFFICIENCY</text>
    <text x="998" y="484" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="18" font-weight="800">&lt; 50 ms <tspan font-size="10" fill="#94a3b8">Cloud Sync SLA</tspan></text>

    <!-- Bottom Architecture Banner -->
    <rect x="40" y="556" width="1200" height="130" rx="14" fill="#0f1726" stroke="#1f2d45" stroke-width="1.5" />
    <text x="64" y="594" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="15" font-weight="700">Edge Hardware &amp; Deployment Topology</text>
    <text x="64" y="618" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="12">Designed for high-throughput edge nodes (NVIDIA Jetson Orin, Intel Xeon Edge, Raspberry Pi 5 + Hailo AI) with Docker containerization and Kubernetes edge management.</text>
    
    <g transform="translate(64, 638)">
      <rect x="0" y="0" width="130" height="28" rx="6" fill="#162238" stroke="#233550" />
      <text x="12" y="18" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">NVIDIA JETSON ORIN</text>

      <rect x="142" y="0" width="144" height="28" rx="6" fill="#162238" stroke="#233550" />
      <text x="154" y="18" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">DOCKER CONTAINERIZED</text>

      <rect x="298" y="0" width="126" height="28" rx="6" fill="#162238" stroke="#233550" />
      <text x="310" y="18" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="600">SUB-SECOND ALERT</text>

      <rect x="436" y="0" width="140" height="28" rx="6" fill="#162238" stroke="#233550" />
      <text x="448" y="18" fill="#ff7a50" font-family="monospace" font-size="10" font-weight="600">ZERO-TRUST SECURE</text>

      <rect x="588" y="0" width="134" height="28" rx="6" fill="#162238" stroke="#233550" />
      <text x="600" y="18" fill="#34d399" font-family="monospace" font-size="10" font-weight="600">100% PRIVACY FIRST</text>
    </g>
  </svg>`;
}

function getSvg3() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="none">
    <defs>
      <linearGradient id="bg3" x1="0" y1="0" x2="1280" y2="720" gradientUnits="userSpaceOnUse">
        <stop stop-color="#080c14" />
        <stop offset="0.5" stop-color="#0e1728" />
        <stop offset="1" stop-color="#06090e" />
      </linearGradient>
      <radialGradient id="alertGlow" cx="0" cy="0" r="1" gradientTransform="translate(640 180) rotate(90) scale(450 600)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ff5e2c" stop-opacity="0.14" />
        <stop offset="1" stop-color="#ff5e2c" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid3" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" stroke="#ffffff" stroke-opacity="0.03" stroke-width="1" />
      </pattern>
    </defs>

    <rect width="1280" height="720" fill="url(#bg3)" />
    <rect width="1280" height="720" fill="url(#alertGlow)" />
    <rect width="1280" height="720" fill="url(#grid3)" />

    <!-- Top Navigation -->
    <rect x="40" y="32" width="1200" height="64" rx="14" fill="#0f1726" fill-opacity="0.85" stroke="#1f2d45" stroke-width="1.5" />
    <text x="64" y="68" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700" letter-spacing="1.2">SENTINELEDGE · CLUSTER MONITOR &amp; INCIDENT MATRIX</text>
    <rect x="1080" y="48" width="140" height="32" rx="8" fill="#142132" stroke="#253552" />
    <text x="1094" y="69" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="600">8 NODES ACTIVE</text>

    <!-- Node Matrix Grid: 4 Nodes -->
    <g transform="translate(40, 120)">
      <!-- Node 1 -->
      <rect x="0" y="0" width="285" height="180" rx="12" fill="#0d1524" stroke="#10b981" stroke-opacity="0.5" stroke-width="1.5" />
      <circle cx="24" cy="28" r="5" fill="#10b981" />
      <text x="38" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="13" font-weight="700">NODE 01 · INDUSTRIAL GATEWAY</text>
      <text x="24" y="62" fill="#94a3b8" font-family="monospace" font-size="11">CAMERAS: 4 FEEDS · 240 FPS</text>
      <text x="24" y="82" fill="#94a3b8" font-family="monospace" font-size="11">INFERENCE: 11.8ms</text>
      <text x="24" y="102" fill="#94a3b8" font-family="monospace" font-size="11">MEMORY: 3.4GB / 8GB</text>
      <rect x="24" y="124" width="237" height="32" rx="6" fill="#091b15" stroke="#10b981" stroke-opacity="0.3" />
      <text x="36" y="144" fill="#34d399" font-family="monospace" font-size="10" font-weight="600">✓ OPTIMAL · ZERO ALERTS</text>

      <!-- Node 2 -->
      <rect x="305" y="0" width="285" height="180" rx="12" fill="#0d1524" stroke="#ff5e2c" stroke-width="1.5" />
      <circle cx="329" cy="28" r="5" fill="#ff5e2c" />
      <text x="343" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="13" font-weight="700">NODE 02 · PERIMETER NORTH</text>
      <text x="329" y="62" fill="#94a3b8" font-family="monospace" font-size="11">CAMERAS: 2 FEEDS · 120 FPS</text>
      <text x="329" y="82" fill="#94a3b8" font-family="monospace" font-size="11">INFERENCE: 13.2ms</text>
      <text x="329" y="102" fill="#94a3b8" font-family="monospace" font-size="11">MEMORY: 4.1GB / 8GB</text>
      <rect x="329" y="124" width="237" height="32" rx="6" fill="#22110c" stroke="#ff5e2c" stroke-opacity="0.4" />
      <text x="341" y="144" fill="#ff7a50" font-family="monospace" font-size="10" font-weight="700">⚠ INCIDENT DISPATCHED (01:08:14)</text>

      <!-- Node 3 -->
      <rect x="610" y="0" width="285" height="180" rx="12" fill="#0d1524" stroke="#1f2d45" stroke-width="1.5" />
      <circle cx="634" cy="28" r="5" fill="#10b981" />
      <text x="648" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="13" font-weight="700">NODE 03 · WAREHOUSE DOCK</text>
      <text x="634" y="62" fill="#94a3b8" font-family="monospace" font-size="11">CAMERAS: 6 FEEDS · 360 FPS</text>
      <text x="634" y="82" fill="#94a3b8" font-family="monospace" font-size="11">INFERENCE: 14.6ms</text>
      <text x="634" y="102" fill="#94a3b8" font-family="monospace" font-size="11">MEMORY: 5.2GB / 8GB</text>
      <rect x="634" y="124" width="237" height="32" rx="6" fill="#091b15" stroke="#10b981" stroke-opacity="0.3" />
      <text x="646" y="144" fill="#34d399" font-family="monospace" font-size="10" font-weight="600">✓ OPTIMAL · 100% REDACTED</text>

      <!-- Node 4 -->
      <rect x="915" y="0" width="285" height="180" rx="12" fill="#0d1524" stroke="#1f2d45" stroke-width="1.5" />
      <circle cx="939" cy="28" r="5" fill="#10b981" />
      <text x="953" y="32" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="13" font-weight="700">NODE 04 · TRANSIT CORRIDOR</text>
      <text x="939" y="62" fill="#94a3b8" font-family="monospace" font-size="11">CAMERAS: 3 FEEDS · 180 FPS</text>
      <text x="939" y="82" fill="#94a3b8" font-family="monospace" font-size="11">INFERENCE: 12.1ms</text>
      <text x="939" y="102" fill="#94a3b8" font-family="monospace" font-size="11">MEMORY: 3.8GB / 8GB</text>
      <rect x="939" y="124" width="237" height="32" rx="6" fill="#091b15" stroke="#10b981" stroke-opacity="0.3" />
      <text x="951" y="144" fill="#34d399" font-family="monospace" font-size="10" font-weight="600">✓ OPTIMAL · SYNCED</text>
    </g>

    <!-- Incident Timeline Chart & Analytics -->
    <rect x="40" y="324" width="1200" height="360" rx="14" fill="#0c1322" stroke="#1f2d45" stroke-width="1.5" />
    <rect x="40" y="324" width="1200" height="46" rx="14" fill="#111c2e" />
    <text x="64" y="352" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">REAL-TIME INCIDENT RESOLUTION TIMELINE &amp; TELEMETRY</text>

    <!-- Synthetic Chart Area -->
    <path d="M70 540 Q 200 480, 340 510 T 600 440 T 850 490 T 1150 420" fill="none" stroke="#00f2fe" stroke-width="3" stroke-linecap="round" />
    <path d="M70 580 Q 200 560, 340 570 T 600 520 T 850 560 T 1150 500" fill="none" stroke="#ff5e2c" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4" />
    
    <!-- Chart Data Points -->
    <circle cx="600" cy="440" r="6" fill="#00f2fe" />
    <circle cx="600" cy="440" r="12" stroke="#00f2fe" stroke-opacity="0.3" stroke-width="1.5" />
    <text x="600" y="420" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="700" text-anchor="middle">PEAK 840 FPS</text>

    <circle cx="850" cy="560" r="6" fill="#ff5e2c" />
    <circle cx="850" cy="560" r="12" stroke="#ff5e2c" stroke-opacity="0.3" stroke-width="1.5" />
    <text x="850" y="590" fill="#ff7a50" font-family="monospace" font-size="10" font-weight="700" text-anchor="middle">INCIDENT RESOLVED</text>

    <!-- Bottom Chart Legend -->
    <rect x="70" y="630" width="16" height="4" rx="2" fill="#00f2fe" />
    <text x="94" y="636" fill="#94a3b8" font-family="monospace" font-size="11">Neural Ingest Throughput (FPS)</text>

    <rect x="360" y="630" width="16" height="4" rx="2" fill="#ff5e2c" />
    <text x="384" y="636" fill="#94a3b8" font-family="monospace" font-size="11">Incident Verification Latency (ms)</text>

    <text x="1170" y="636" fill="#64748b" font-family="monospace" font-size="11" text-anchor="end">Live Telemetry Synchronized</text>
  </svg>`;
}

async function run() {
  console.log("Generating SVG assets for SentinelEdge...");
  const svg1 = getSvg1();
  const svg2 = getSvg2();
  const svg3 = getSvg3();

  writeFileSync(join(outDir, "hero.svg"), svg1, "utf8");
  writeFileSync(join(outDir, "01.svg"), svg1, "utf8");
  writeFileSync(join(outDir, "02.svg"), svg2, "utf8");
  writeFileSync(join(outDir, "03.svg"), svg3, "utf8");

  console.log("Rendering WebP and PNG assets via Sharp...");
  const svgs = [
    { svg: svg1, name: "01" },
    { svg: svg2, name: "02" },
    { svg: svg3, name: "03" },
    { svg: svg1, name: "hero" },
  ];

  for (const { svg, name } of svgs) {
    const buf = Buffer.from(svg);
    await sharp(buf)
      .webp({ quality: 90 })
      .toFile(join(outDir, `${name}.webp`));

    await sharp(buf)
      .png({ quality: 90 })
      .toFile(join(outDir, `${name}.png`));

    console.log(`Generated ${name}.webp & ${name}.png`);
  }

  console.log("All SentinelEdge assets generated successfully!");
}

run().catch(err => {
  console.error("Error generating SentinelEdge assets:", err);
  process.exit(1);
});
