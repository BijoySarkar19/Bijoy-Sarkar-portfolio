<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Guidelines for Bijoy Sarkar Portfolio

## Core Architecture Principles

1. **Port & Server Configuration**:
   - The application runs on port `4173` via `npm run dev` and `npm run start`.
   - Never change the default port from 4173 unless explicitly requested.

2. **300-Frame Scroll Canvas & Zero Edge Gaps**:
   - Scroll sequence uses 300 JPEG images stored in `/public/frames/frame_0001.jpg` to `frame_0300.jpg`.
   - Frame count is constant `300`.
   - Images are drawn with cover scaling (`zoom = 1.20` and 4-way clamped coordinates) to guarantee zero black bars, edge gaps, or letterboxing on any screen size or aspect ratio (ultrawide, 21:9, 32:9, tablets, mobile).
   - On mobile and tablet portrait displays (`width / height < 1.3`), the canvas aligns Bijoy's head dynamically in the horizontal center of the screen (focal center `X ≈ 0.422`, `Y ≈ 0.23`) so his face is never cropped or shifted to edges.
   - Includes top starting aura glow and bottom ending aura overscroll indicators.
   - Canvas is hidden on all `/admin-admin` routes to keep the administration workspace cleanly isolated.

3. **Custom Scrollbar & Native Scrollbar Removal**:
   - Browser default scrollbars are strictly disabled (`scrollbar-width: none !important; ::-webkit-scrollbar { display: none !important; }`).
   - Page scroll progress is tracked via `components/ui/CustomScrollbar.tsx` which renders a floating glowing orange indicator that appears on scroll and auto-hides after 1 second of inactivity.
   - CV Document preview in `components/resume/ResumeViewer.tsx` features a fully interactive custom glowing orange scrollbar anchored to the viewer container with hardware pointer tracking.

4. **CV Document Viewer & Numeric Zoom Engine**:
   - Renders high-fidelity responsive document pages that fit the placeholder frame on any device or display without native browser PDF plugin scrollbars.
   - Zoom percentage is presented in ONE place within the header toolbar via an editable numeric input with an automatic `%` suffix.
   - Supports ONLY numerical input and automatically opens the native number pad on phones, tablets, iPhones, and iPads (`inputMode="numeric"`, `pattern="[0-9]*"`).
   - Zoom level varies strictly from **10% to 500%**.
   - Zoom In (`+`) and Zoom Out (`-`) buttons modify zoom level in increments of **10%**.

5. **Contact Us Validation, Google Sheets Sync & Inbox Integration**:
   - Enforces country selection: users MUST select a country code, choose `None`, or enter `Custom`.
   - The word `(optional)` is prohibited on the phone field.
   - If a country code is selected, phone number is mandatory. India (`+91`) enforces **strictly 10 digits**. Custom codes require country code first.
   - Mobile and tablet inputs invoke device-native numeric dial pads (`inputMode="numeric"`, `pattern="[0-9]*"`).
   - All contact submissions are saved to the database (`ContactMessage`), logged with Indian Standard Time (`IST`), appended to `/public/downloads/contact-submissions.csv` for Google Sheets, and can be managed directly in the Admin Portal under `/admin-admin/dashboard/messages`.
   - Clicking email links opens directly in Gmail Web Compose for `bijoysarkar7252@gmail.com` and copies the address to the clipboard.

6. **Projects Organization & Admin Deploy Engine**:
   - Features an **Active Development / Currently Working On** subsection for ongoing projects (e.g., CivicLens Core).
   - **Main Projects Showcase Limit (Top 5)**: At most 5 main projects can be featured on the Home page (`featuredOnHome === true && !isOngoing`). When 5 are selected, an existing one must be removed before adding another.
   - **Ongoing Projects Showcase Limit (Top 2)**: At most 2 ongoing projects can be featured on the Home page (`featuredOnHome === true && isOngoing`). When 2 are selected, one must be removed before adding another.
   - Admin CMS enables one-click deployment from ongoing to main projects, and toggling projects between Home Top 5 / Ongoing Top 2 and Browse Index.

7. **Game Intermission Rules**:
   - Interactive game instructions (objective, rules, controls, tips, and visual diagrams) must remain strictly contained within the `.game-card` container boundary. Never let instruction overlays spill outside the card border.
   - Timers trigger on first game input/interaction.
   - Idle suggestions trigger when no input is received for 10 seconds.

8. **Admin CMS, Audit Logging (IST) & Undo Engine**:
   - All content modifications (Projects, Work Experience, Skills & Languages, CV Resumes, Site Settings) must pass through server-side authorization checking `session?.user?.role === "ADMIN"`.
   - Every mutating action must record an audit event in `AuditLog` via `logAuditEvent()`, storing `previous` and `current` snapshots in `changes`.
   - The `/api/admin/undo` endpoint enables full one-click reversal of additions, updates, deletions, and status changes.
   - Display timestamps must always be formatted in Indian Standard Time (`IST` / `Asia/Kolkata`) using `formatIndianTime()`.
   - Admin UI must remain completely decoupled from public site navbar and canvas backgrounds.
   - Admin CV management supports removing/deactivating the current active CV and automatically regenerates preview pages.

9. **Empty Area Fallbacks ("Upcoming on his way")**:
   - When any public section (Work Experience, Skills & Languages, Projects, or Resume) contains no published content, it must gracefully display the exact indicator: `"Upcoming on his way"`.

10. **Multi-Device & Apple Compatibility**:
    - Support iOS Safari safe-areas (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
    - Ensure mobile input fields enforce `font-size: 16px` to prevent iOS viewport auto-zooming.
    - Support touch-action manipulation, smooth mobile drawers, and TV max-width clamping.

11. **Cyber Glassmorphic Mobile Drawer Navigation**:
    - Mobile menu utilizes a modern glassmorphic cyber drawer with dark backdrop blur, cascading staggered entry animations (`01`, `02`, `03`...), subtle index chips, and animated smooth close interaction.
    - Full-screen backdrop overlay prevents underlying click bleed-through.

12. **Uniform CV Bezel & Top/Bottom Slide Transitions**:
    - CV Document preview maintains strict 4-sided symmetrical thin bezels (`padding: 6px`, uniform framing) across all device aspect ratios.
    - Page overscroll integrates hardware-accelerated spring slide animations at the starting top and ending bottom boundaries.

13. **Google Sheets Webhook & Direct Spreadsheet Linking**:
    - Direct Google Sheets link opens the designated live spreadsheet (`https://docs.google.com/spreadsheets/d/1bkxAetgAqLrk0MM_17Ia2VVDzUrugcaQEhFy8WjiIQQ/edit?gid=0#gid=0`).
    - Apps Script Web App Deployment ID: `AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw`.
    - Webhook URL: `https://script.google.com/macros/s/AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw/exec`.
    - Every contact submission dispatches to the webhook and syncs directly to the user's Google Drive.

14. **Mobile & Tablet Administration Support**:
    - Complete mobile/tablet touch support for the `/admin-admin` portal with horizontal swipeable tab navigation (`scrollbar-width: none`).
    - Enforces `font-size: 16px` on all mobile input/textarea elements to prevent iOS viewport auto-zooming.
    - Responsive action buttons and safe-area insets.

15. **Next-Level Security Architecture**:
    - Edge Middleware Route Protection in `proxy.ts`: all `/api/admin/*` and dashboard routes are blocked at the edge unless valid admin JWT session exists.
    - Brute-Force Password Protection in `lib/auth-rate-limit.ts`: limits failed admin sign-ins to 5 attempts per 15-minute sliding window with salted SHA-256 IP hashes.
    - Advanced Security Headers: CSP, HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and `X-Permitted-Cross-Domain-Policies: none`.
    - Sanitize all strings with `cleanText` and validate schemas with Zod. Prohibit `javascript:` or `data:` URLs.
    - Never commit `.env` or SQLite `dev.db` to version control. Maintain `.env.example` as the clean template.

16. **Hero Meta & Contact Details Formatting**:
    - Hero metadata (`Agartala, India | Open to opportunities` and `ICFAI University Tripura | B.Tech . Computer Science and Engineering`) are aligned side-by-side (`display: flex; flex-direction: row;`) across all screen widths including desktop, tablet, and mobile.
    - Contact section details (`bijoysarkar7252@gmail.com` and `Agartala, Tripura, India`) are stacked vertically one below another in `.contact-details-list`.

17. **Production & Administration Dedicated Endpoints**:
    - **Public Production Website**: `https://bijoy-sarkar-portfolio.vercel.app` (Hero canvas sequence, intelligent systems showcase, ongoing builds, CV viewer, intermission games, and contact inquiry dispatch).
    - **Admin CMS Management Workspace**: `https://bijoy-sarkar-portfolio.vercel.app/admin-admin` (Protected administration workspace for projects curation, work experience, skills & languages, CV uploads/deactivations, copywriting, messages inbox, and IST audit datasets with one-click undo engine).
    - Canvas background animations are strictly isolated to public routes and hidden from `/admin-admin/*`.
