# Vriksha Tracker – The Sapling Guardian System 🌿

**Vriksha Tracker** is an AI‑enhanced web app to monitor the lifecycle of planted saplings: unique IDs, GPS tagging, photo timelines, AI health analysis, forecasts, and a gamified community.

## ✨ Core Features

### For Volunteers
- **Sapling Registration**: GPS, species, and photos
- **AI Smart Updates**: Health status + recommendations
- **7‑Day Forecast**: Predicted health change
- **Gamification**: Eco Points, ranks, leaderboard
- **Social Feed**: Share updates, AI captions
- **AI Chatbot**: Ask plant care questions
- **Notifications**: Reminders and success alerts

### For Coordinators
- **Admin Dashboard**: AI insights
- **Charts**: Health distribution, trends, rainfall vs survival, top contributors
- **Map View**: Real‑time markers by health status
- **Searchable List**: Filterable sapling table
- **Export**: CSV/PDF

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Styling**: Tailwind CSS (CDN)
- **AI/ML**: Google Gemini API (`@google/genai`)
- **Maps**: Leaflet.js
- **Charts**: Recharts
- **Animations**: Framer Motion

## 🚀 Run on any laptop (Windows / macOS / Linux)

Prereqs:
- Node.js 18+ (LTS recommended) and npm
- Internet connection (CDN assets + Gemini API)
- A Google Gemini API key

### 1) Clone or unzip the project
Place the folder anywhere (e.g., Desktop or Documents).

### 2) Create `.env` in the project root
Put your Gemini API key:
```env
GEMINI_API_KEY=your_api_key_here
```
Notes:
- The app reads this through Vite’s define in `vite.config.ts` and uses it in `services/geminiService.ts`.
- Without a key, the app still runs, but AI features will show a “not configured” message.

### 3) Install dependencies
```bash
npm install
```

### 4) Start the dev server
```bash
npm run dev
```
- Open the printed URL (default `http://localhost:3000`).

### 5) Build and preview (optional)
```bash
npm run build
npm run preview
```

## 📂 Project Structure
