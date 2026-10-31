# Bijoy Sarkar — Portfolio & Intelligent Systems Showcase

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10.1-2d3748?logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)](https://www.docker.com/)

A modern, full-stack portfolio for **Bijoy Sarkar**, Software Engineer and AI Developer. The application showcases machine learning systems, secure engineering projects, and full-stack applications with high-performance scroll-driven sequence animation, interactive retro intermission puzzles, and a private administration portal with Indian Standard Time (IST) audit tracking.

---

## 🌟 Key Highlights & Enhancements

### 1. 🎞️ High-Performance 300-Frame Scroll Canvas

- Smooth scroll animation rendering all 300 sequence frames from `My_photo_portfolio` (`frame_0001.jpg` to `frame_0300.jpg`).
- **Edge-to-Edge Full Bleed & Centered Subject Framing**: Dynamically scaled and clamped to completely eliminate black bars or letterboxing above, below, or on either side across all viewport aspect ratios. On mobile and portrait tablets, the canvas dynamically centers on Bijoy's head (focal center `X ≈ 0.422`, `Y ≈ 0.23`), ensuring facial framing is never shifted or clipped on narrow screens.
- Time-based exponential smoothing (LERP) with predictive preloading queue and adaptive cache management.
- Dynamic atmosphere gradient transitioning smoothly based on user scroll position.

### 2. 🖱️ Custom Animated Scrollbar & High-Fidelity CV Document Viewer

- **Native Scrollbar Hidden**: Default browser scrollbars are hidden cleanly across Chrome, Firefox, Safari, and Edge.
- **Floating Neon Track**: A custom indicator tracks exact page progress with a glowing orange thumb that appears on scroll and auto-hides after 1 second of inactivity.
- **Embedded CV Viewer with Interactive Orange Scrollbar & Numeric Zoom**:
  - Crisp vector document rendering that fits the card placeholder cleanly on every device (mobile phones, iPads, tablets, laptops, TVs).
  - Custom glowing orange scrollbar anchored to the viewer container with hardware pointer tracking and smooth dragging.
  - Zoom percentage is displayed in **ONE place** in the toolbar via an editable numeric input box with an automatic `%` suffix.
  - Accepts **numerical values only** (`0-9`) and automatically opens the device's native number pad keyboard on iPhones, iPads, and Android devices.
  - Zoom level varies strictly from **10% to 500%**.
  - Zoom In (`+`) and Zoom Out (`-`) buttons modify zoom level in increments of **10%**.
  - 100% deterministic SSR eliminating any hydration mismatch.

### 3. 📱 Contact Form Validation, Google Sheets Sync & Inbox Integration

- **Strict Country Code Requirement**: Visitors must select a country code (with India first and alphabetical search), explicitly choose `None`, or enter a `Custom` code.
- **Removed `(optional)` Label**: Clear required indicators and validation feedback.
- **Country-Specific Digit Validation**: Enforces exact 10-digit validation for India (`+91`), national format validation for international countries, and custom dial code validation before submission.
- **Device-Native Number Keyboards**: Uses `inputMode="numeric"` and `pattern="[0-9]*"` to trigger numeric dial pads on iOS, iPadOS, and Android devices.
- **Google Sheets Webhook & Live Spreadsheet Linking**:
  - Direct Google Sheets link opens the designated live spreadsheet: [`Portfolio Inquiries Google Sheet`](https://docs.google.com/spreadsheets/d/1bkxAetgAqLrk0MM_17Ia2VVDzUrugcaQEhFy8WjiIQQ/edit?gid=0#gid=0).
  - Deployed Apps Script Web App Deployment ID: `AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw`.
  - Live Webhook URL: `https://script.google.com/macros/s/AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw/exec`.
  - Submissions automatically append to the sheet and trigger instant alert emails to `bijoysarkar7252@gmail.com`.
  - Dedicated Admin Messages workspace (`/admin-admin/dashboard/messages`) with one-click Google Sheets sync, CSV export, and Direct Reply via Gmail for `bijoysarkar7252@gmail.com`.
  - Direct email links open Gmail Web Compose prefilled for `bijoysarkar7252@gmail.com` and copy the email to clipboard.

### 3. 🎮 Enhanced Intermission Games (2048 & Signal Pairs)

- **Bounded How-to-Play Overlay (Hover Trigger)**:
  - An `(i)` button above each game reveals complete game rules on hover.
  - **Strictly Contained**: Bounded strictly within the dimensions of the game card box (no page overflowing).
  - **Visual Diagram Illustrations**: Custom diagrams illustrating arrow keys, swipe controls, card flips, and tile merge progressions.
  - Explains: Objective, How to Play, Controls, How to Finish/Win, Game Over rules, and Pro Strategy tips.
- **Live Match Timer**: Starts counting seconds on the first tap/click or key press.
- **10-Second Idle Coach**: Generates helpful contextual strategic suggestions whenever the player pauses for 10 seconds.

### 4. 🛡️ Comprehensive Admin CMS & Content Management

- **Dedicated Admin Isolation**: Completely decoupled from public portfolio headers and canvas elements (clean, dark workspace).
- **One-Click Undo Engine**: Revert any administrative mutation (creations, edits, deletions, deactivations, settings) directly from the Activity Dataset or instant toast alerts.
- **Work Experience CRUD**: Add, edit, reorder, or delete work experiences and internships. Changes update the public timeline and metrics in real time.
- **Skills & Languages CRUD**: Full management of technical categories (Programming, AI/ML, Web, Mobile, Data, Security) and spoken languages (English, Hindi, Bengali).
- **CV / Resume Management**: Upload new PDF resumes, preview active documents, toggle active versions, download, and use **"Remove Current CV"** to gracefully take down resumes.
- **Site Settings Manager**: Real-time configuration of hero titles, subheadings, bio summary, contact email, location, status pills, accent presets, and feature flags.
- **Indian Standard Time (IST - Asia/Kolkata) Activity Dataset**:
  - Every administrative action (`CREATE`, `UPDATE`, `DELETE`, `UPLOAD`, `ACTIVATE`, `DEACTIVATE`) is recorded with an audit event.
  - Displays dates and times in **Indian Standard Time (IST, UTC+05:30)**: e.g. `30 Oct 2026, 06:45:10 PM IST`.
  - Export audit datasets as **CSV** or structured **JSON** with one click.
  - Live Indian Time clock in the admin navigation bar.

### 5. ⚡ Advanced Interactive Experience

- **Cyber Glassmorphic Mobile Drawer Navigation**: Overhauled mobile navigation into a modern cyber drawer featuring backdrop glassmorphism, cascading staggered entry transitions (`01`, `02`, `03`...), active indicator badges, and smooth entrance/exit animations.
- **Dynamic Slide Transitions at Scroll Boundaries**: Hardware-accelerated spring slide effects (`translateY`) smoothly trigger when overscrolling at the starting top and ending bottom of the page.
- **Symmetric CV Bezel Framing**: CV viewer utilizes uniform 4-sided thin framing (`padding: 6px`) eliminating uneven side margins and delivering a clean 92% bezel-less look.
- **Tactile Web Audio Synthesizer**: Pure browser Web Audio synthesis providing micro-clicks, 2048 tile merge chimes, card flip sounds, and victory fanfare without loading audio files. Includes a mute toggle button with animated wave indicator.
- **Developer Command Palette (Ctrl+K / ⌘K)**: Power-user modal for rapid section jumps, project links, terminal launch, and sound controls.
- **Cyber Hacker Terminal (`~`)**: Interactive zsh-style shell featuring commands (`about`, `skills`, `projects`, `contact`, `matrix`, `resume`, `clear`).
- **"Upcoming on his way" Area Fallbacks**: Whenever any public section (Work Experience, Skills, Projects, or CV) contains no published content, it cleanly renders `"Upcoming on his way"`.
- **Multi-Device & Apple Compatibility**: Responsive layout optimized across mobile phones (with iOS notch safe-areas and font-zoom prevention), tablets, desktops, and large 4K TVs.

---

## 🔒 Security Hardening & Penetration Testing Review

### Thinking Like a Hacker — Proactive Defense-in-Depth Implementation

| Threat / Attack Vector | Risk | Mitigation Implemented |
| :--- | :--- | :--- |
| **Clickjacking** | An attacker embeds the admin panel in a transparent iframe to steal clicks. | Enforced `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'` across all routes. |
| **Cross-Site Scripting (XSS)** | Malicious scripts injected via project URLs or form fields. | Strict `Content-Security-Policy`, input sanitization via `cleanText`, and Zod URL validation prohibiting `javascript:` and `data:` schemes. |
| **MIME Confusion Attacks** | Executing malicious uploads as scripts. | `X-Content-Type-Options: nosniff` header enforced. |
| **Broken Access Control** | Unauthorized callers accessing `/api/admin/*` or `/admin-admin/dashboard/*`. | Multi-tier defense: Edge Middleware (`proxy.ts`) blocks unauthenticated requests before route execution + server-side JWT verification in every handler. |
| **Brute-Force Login Attacks** | Credential stuffing on `/admin-admin` sign-in. | Salted SHA-256 IP sliding-window rate limiter in `lib/auth-rate-limit.ts` (locks out IPs after 5 failed attempts within 15 minutes). |
| **Contact Form Flooding** | Attacker spamming contact form or SMTP. | Salted SHA-256 IP rate limiter with sliding window, reCAPTCHA v3 verification, and strict origin validation. |
| **Spectre & Window Tampering** | Malicious windows attempting cross-origin access. | Enforced `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and `X-Permitted-Cross-Domain-Policies: none`. |
| **Path Traversal** | Attacker manipulating filenames to escape upload directories. | Upload paths are sanitized with strict alphanumeric replacement and restricted to `/uploads/*.pdf`. |
| **Sensitive Data Exposure** | Leaking database hashes or credentials in client bundles. | `.env` strictly ignored by `.gitignore` and `.dockerignore`. Database credentials remain strictly on the Node.js server. |

---

## 🚀 Getting Started

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/BijoySarkar19/Bijoy-Sarkar-portfolio.git
   cd Bijoy-Sarkar-portfolio
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Configure your admin credentials and application secrets:

   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-generated-random-secret"
   NEXTAUTH_URL="http://localhost:4173"
   ADMIN_USERNAME="Bijoy19"
   ADMIN_EMAIL="bijoysarkar7252@gmail.com"
   ADMIN_PASSWORD="YourSecurePassword"
   CONTACT_EMAIL="bijoysarkar7252@gmail.com"
   RATE_LIMIT_SALT="your-unique-salt"
   NEXT_PUBLIC_SITE_URL="http://localhost:4173"
   ```

4. **Initialize database & seed:**

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:4173](http://localhost:4173) in your browser.

---

## 🐳 Docker Deployment

The project includes an optimized multi-stage `Dockerfile` and `docker-compose.yml` configured for production.

### Using Docker Compose (Recommended)

```bash
# Build and start container in detached mode
docker compose up --build -d

# View logs
docker compose logs -f

# Stop container
docker compose down
```

The container runs on port **4173** with persistent volumes for database records and uploaded resume documents.

---

## 📂 Project Structure

```text
Portfolio/
├── app/
│   ├── admin-admin/             # Private admin dashboard & subpages
│   │   ├── dashboard/
│   │   │   ├── projects/        # Project CRUD management
│   │   │   ├── experience/      # Work experience CRUD
│   │   │   ├── skills/          # Skills & languages CRUD
│   │   │   ├── resume/          # CV upload & management
│   │   │   └── audit/           # Indian Time (IST) audit dataset viewer
│   ├── api/
│   │   ├── admin/               # Secure admin API routes
│   │   ├── auth/                # NextAuth credential handlers
│   │   ├── contact/             # Contact form delivery & rate limiting
│   │   └── projects/            # Public project endpoints
│   ├── globals.css              # Dark theme styling, animations & custom scrollbar
│   ├── layout.tsx               # Root layout with Canvas, Navbar & CustomScrollbar
│   └── page.tsx                 # Dynamic server-rendered homepage
├── components/
│   ├── about/                   # About & Skills dynamic components
│   ├── admin/                   # Admin CRUD managers & forms
│   ├── games/                   # 2048 & Signal Pairs with in-box instructions
│   ├── hero/                    # Hero headline & ScrollCanvas (300 frames)
│   ├── navigation/              # Public Navbar & mobile navigation
│   ├── resume/                  # Dynamic PDF Resume viewer
│   └── ui/                      # Custom scrollbar, icons, and buttons
├── lib/
│   ├── audit.ts                 # Indian Standard Time (IST) logging & formatting
│   ├── auth.ts                  # NextAuth options & JWT session handling
│   ├── prisma.ts                # Prisma client singleton with SQLite adapter
│   └── validation.ts            # Zod validation schemas
├── prisma/
│   ├── schema.prisma            # Schema (Admin, Project, Experience, Skills, Resume, Audit)
│   └── seed.ts                  # Database seeder
├── public/
│   ├── frames/                  # 300 photo animation frames
│   ├── projects/                # Project preview screenshots
│   └── Bijoy_Sarkar_CV.pdf      # Resume PDF document
├── Dockerfile                   # Multi-stage production container
└── docker-compose.yml           # Compose orchestration
```

---

## 📜 Database Management Commands

```bash
# Generate Prisma Client
npm run db:generate

# Sync schema with local SQLite database
npm run db:push

# Run seed script
npm run db:seed

# Launch visual Prisma Studio
npm run db:studio
```

---

## 📄 License

This repository is private and proprietary to **Bijoy Sarkar**. All rights reserved.
