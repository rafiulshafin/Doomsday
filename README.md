# Doomsday Ready 🎬🍿

> **Blinto Talent Accelerator 2027 — Full-Stack Developer Internship Assessment**  
> A full-stack application designed to help Marvel Cinematic Universe (MCU) fans plan their rewatch ahead of *Avengers: Doomsday* and optimize opening-night watch-party seat bookings.

---

## 📌 Project Overview
1. **Feature 1: Movies & Rewatch Order**
   - Manage MCU movies and their prerequisite watch dependencies.
   - Self-dependency and transitive circular dependency detection with `409 CIRCULAR_DEPENDENCY`.
   - Custom topological ordering algorithm to output an exact rewatch roadmap, watched count, and unwatched runtime.
2. **Feature 2: Cinemas & Watch-Party Booking**
   - Manage cinema locations with custom opening-night seat bundle sizes (1–10 bundles, 1–500 seats each).
   - Custom unbounded knapsack / coin-change algorithm calculating the minimum number of seat bundles required to exactly match a party size (1–10,000 seats) with no empty seats.
3. **Feature 3: Interactive Frontend**
   - Modern React application with three dedicated views: *Movies*, *Rewatch Plan*, and *Watch-Party Booking*.
4. **DevOps & Architecture**:
   - Single-command orchestration via Docker Compose (`docker compose up`).
   - PostgreSQL database with Prisma ORM.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Vitest.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Infrastructure**: Docker, Docker Compose.
