# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zentra is a trading psychology analytics platform built with Next.js 15 and React 19. It analyzes trader behavior and psychological states to provide insights that help traders improve their mental edge and performance.

## Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint

## Architecture

### Frontend Stack
- **Next.js 15** with App Router (all routes in `src/app/`)
- **React 19** with client components (`"use client"` directive)
- **Tailwind CSS** for styling with custom theme colors (primary: navy, accent: teal)
- **Framer Motion** for animations
- **Supabase** for authentication and image storage

### Backend Communication
The app connects to a separate backend API (v1 and v2 endpoints):
- API client singleton at `src/utils/api.js` handles all backend requests
- JWT auth with access/refresh token flow stored in localStorage
- V1 endpoints: auth, trades, trading-plan, dashboard, MT5 integration
- V2 endpoints: Zentra analytics (mental battery, behavior heatmap, psychological radar, etc.)

### Key Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Login, signup, password reset flows
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── layout.js      # Dashboard wrapper with auth, sidebar, context providers
│   │   ├── trades/        # Trade history view
│   │   ├── plan/          # Trading plan management
│   │   └── connect/       # MT5 broker connection
│   └── hooks/             # Custom React hooks for API data fetching
├── components/
│   └── dashboard/widgets/ # Dashboard widget components (heatmaps, charts, cards)
├── context/               # React contexts (PsychologicalState, TradingPlan)
├── utils/
│   └── api.js            # ApiClient class - all backend communication
└── config/
    └── supabase.js       # Supabase client configuration
```

### State Management
- **PsychologicalStateContext**: Provides psychological state data to dashboard components
- **TradingPlanContext**: Manages trading plan status and onboarding flow
- Dashboard layout (`src/app/dashboard/layout.js`) wraps children with both providers

### Authentication Flow
1. JWT tokens stored in localStorage (`accessToken`, `refreshToken`)
2. ApiClient handles automatic token refresh on 401 responses
3. Dashboard layout checks auth and redirects to `/auth/login` if unauthenticated
4. New users without a trading plan are redirected to `/dashboard/plan`

### Custom Hooks Pattern
Hooks in `src/app/hooks/` follow a consistent pattern:
- `useState` for data, loading, error, errorStatus
- `useRef` for in-flight request tracking
- `useCallback` for fetch functions with deduplication
- Return object with `{ data, loading, error, errorStatus, refetch }`

### Psychological States
Four trader psychological states with color coding:
- Stable (teal #00bfa6)
- Overtrading (red #dc2626)
- Hesitant (purple #8b5cf6)
- Aggressive (orange #f97316)

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/v1`)
