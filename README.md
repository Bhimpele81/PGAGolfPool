# ⛳ PGA Golf Major Pool

**Bill vs Don** — A real-time PGA Major tournament pool tracker built with React, Supabase, and the ESPN API.

🔗 **Live App:** [pgagolfpool.onrender.com](https://pgagolfpool.onrender.com)

---

## 🏆 Features

### 🎯 Pick Management
- Each player (Bill & Don) selects up to **8 golfers** from the live ESPN field
- **Draft Mode** toggle controls all pick editing:
  - **ON** — Draft Board appears with golfers sorted A-Z, search bar to find golfers by name, checkboxes to add golfers, and ✕ remove buttons on each team panel
  - **OFF** — Hides the draft board and shows the clean scoring view
- Search bar includes a clear ✕ button for quick resets
- Picks are saved to **Supabase** cloud database — visible across all devices instantly
- Picks are also **cached in localStorage** so they load instantly on every visit with zero blank screens

### 📊 Live Scoring
- Pulls **live leaderboard data from the ESPN API** every 60 seconds automatically
- Leaderboard data is **cached in localStorage** — always shows the most recent scores even during refresh
- A floating **🔄 Updating scores...** banner appears during background refreshes so scores never disappear
- Displays: Golfer name, strokes (vs par), current place, holes completed (Thru)
- Each player's **best 3 golfers** are automatically identified and highlighted with ⭐
- Scores shown in color: 🟢 under par, 🔴 over par, white for even

### 💰 Net Total Win Banner
- Color-coded banner shows who is currently **leading overall** and by how much
- Calculates the full net result across all three scoring components:
  - 🏅 **Golfer Win** — $20 to the player whose golfer wins the tournament
  - 📊 **Cumulative Score Win** — $20 to the player with the better combined best-3 score
  - 💰 **Stroke Differential** — $2 per stroke difference between best-3 totals
- Banner turns **blue** when Bill leads, **red** when Don leads, neutral when tied

### 🖥️ UI & Navigation
- Clean dark navy theme built for desktop and mobile
- **Dashboard** tab — live picks and scoring
- **Rules** tab — pool rules and payout structure
- **NASCAR Pool** link in header → [nascarpool.onrender.com](https://nascarpool.onrender.com)
- Compact card headers to maximize screen real estate
- Status bar shows last updated time and saving state

### ☁️ Backend & Infrastructure
- **Supabase** PostgreSQL database stores picks per tournament
- `picks` table with `tournament`, `player`, `golfers[]` columns
- **No login required** — open the app and go
- Hosted on **Render** (free tier) with auto-deploy from GitHub
- `/health` endpoint for UptimeRobot monitoring to prevent cold starts

---

## 🗄️ Supabase Setup

Create the `picks` table with this SQL:

```sql
CREATE TABLE picks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament  text NOT NULL,
  player      text NOT NULL,
  golfers     text[] DEFAULT '{}',
  locked      boolean DEFAULT false,
  UNIQUE (tournament, player)
);
```

---

## 🚀 Local Development

```bash
npm install
npm start
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Database | Supabase (PostgreSQL) |
| Scores API | ESPN Golf API |
| Hosting | Render |
| Styling | Custom CSS (dark navy theme) |
