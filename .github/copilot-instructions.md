# Copilot Instructions for Salon Booking Platform UI (Next.js)

## Project Overview
- **Architecture:** Next.js app using the `/src/app` directory for routing and page structure. UI is mobile-first, styled with Tailwind CSS, and inspired by Booksy.com for the Indian market.
- **Core Flows:** Homepage, salon listing, salon profile, booking flow, reviews, and owner dashboard (placeholder). All data is static/dummy for MVP.

## Key Directories & Files
- `src/app/` — Next.js app directory. Main pages: `page.js` (homepage), `layout.js` (global layout), `globals.css` (global styles).
- `public/` — Static assets (SVGs, images).
- `components/` — (To be created) Reusable UI components: Navbar, SalonCard, BookingModal, ReviewSection, etc.
- `pages/` — (To be created) For Next.js page files if needed (e.g., `salon/[id].tsx`, `dashboard.tsx`).
- `styles/` — (To be created) For custom styles or Tailwind config.

## UI/UX Patterns
- **Navigation:** Use Next.js routing for navigation between homepage, salon profile, booking, and dashboard.
- **Styling:** Use Tailwind CSS for all styling. Responsive design is required for mobile and desktop.
- **Data:** Use placeholder/dummy data for salons, staff, reviews, and bookings. No API integration yet.
- **Components:** Follow the structure in `ins.txt` for component/page responsibilities. Example: SalonCard displays image, name, location, rating, price, and links to profile/booking.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`).
- **Edit Pages:** Main entry is `src/app/page.js`. Use hot reload for changes.
- **Add Components:** Place reusable components in `components/`. Import into pages as needed.
- **Styling:** Use Tailwind classes. Global styles in `src/app/globals.css`.
- **Static Assets:** Place images/icons in `public/`.

## Conventions & Patterns
- **File Naming:** Use PascalCase for components, camelCase for variables/functions.
- **Pages:** Use Next.js file-based routing. For dynamic routes (e.g., salon profile), use `[id].js` or `[id].tsx`.
- **Dummy Data:** Store static data in files or as JS objects/arrays within components/pages.
- **No API/Backend:** All data and flows are static for MVP.

## Example: Adding a Salon Card
- Create `components/SalonCard.js` with props for image, name, location, rating, price, and booking link.
- Use Tailwind for styling. Import and use in `src/app/page.js` for featured salons grid.

## References
- See `ins.txt` for detailed UI instructions and feature breakdown.
- See `README.md` for Next.js basics and dev workflow.

---
**Agents: Follow the above structure and patterns. Use placeholder data. Focus on UI/UX and static flows for MVP.**
