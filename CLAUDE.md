# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VaxInsight is a public health dashboard that visualizes vaccine efficacy data and analyzes HHS guideline changes using Google Gemini AI. It displays vaccine immunity duration, disease mortality rates, and recommendation statuses through interactive bubble charts and data tables.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build with Vite
npm run preview      # Preview production build
```

## Environment Setup

Create `.env.local` with your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

The API key is injected via Vite's `define` config in `vite.config.ts`.

## Architecture

### Data Flow
1. **Baseline data** defined in `constants.ts` (INITIAL_VACCINE_DATA)
2. **State persistence** via localStorage in App.tsx (keys: `vax_data`, `vax_analysis`)
3. **Live updates** from Gemini API via `services/geminiService.ts` - returns analysis summary and `updatedDataHints` that patch vaccine statuses
4. **Visualization** through Chart.js bubble chart (`components/VaccineChart.tsx`) and data table (`components/DataTable.tsx`)

### Key Types (types.ts)
- `VaccineData`: Core vaccine record with id, immunityDurationYears, deathsPerMillion, contagiousnessR0, status
- `AnalysisResult`: AI response containing summary, sources, and updatedDataHints

### Component Structure
- `App.tsx`: Main dashboard with admin authentication (password: hardcoded), state management, and layout
- `components/VaccineChart.tsx`: Bubble chart with toggleable Y-axis (deaths vs R0)
- `components/DataTable.tsx`: Sortable table with CSV export

### Gemini Integration
The `analyzeHHSChanges()` function in `services/geminiService.ts`:
- Uses Google Search grounding tool
- Returns structured JSON with `responseMimeType: "application/json"` and defined schema
- Extracts grounding sources from `groundingMetadata.groundingChunks`

## Styling

Uses Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`). No build-time CSS processing.

## Path Aliases

`@/*` maps to project root (configured in tsconfig.json).
