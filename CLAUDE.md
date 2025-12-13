# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **kiln management application** for ceramic studios (gestion des cuissons). Practitioners (students/users) submit their ceramic pieces for firing, and administrators manage the firing process. The app tracks pieces through two firing stages: **biscuit** (first firing) and **emaillage** (glazing/second firing).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Neon Auth (`@neondatabase/neon-js`)
- **Storage**: Vercel Blob (for piece photos)
- **UI**: Tailwind CSS 4 + Radix UI + shadcn/ui components
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

### App Structure (Next.js App Router)

```
app/
  page.tsx              # Root - redirects to /auth/sign-in or /admin based on session
  layout.tsx            # Root layout with NeonAuthUIProvider
  auth/[path]/page.tsx  # Auth pages (sign-in, sign-out, etc.)
  admin/page.tsx        # Admin dashboard - manage all pieces
  admin/mes-pieces/     # Admin's own pieces
  practician/page.tsx   # Practitioner view - submit & track personal pieces
  api/
    auth/[...path]/     # Neon Auth API routes
    pieces/             # CRUD for pieces
    pieces/[id]/        # Individual piece operations (DELETE)
    pieces/complete/    # Mark biscuit/emaillage as done
    pieces/firing/      # Request firing with date
    upload-photo/       # Vercel Blob upload
```

### Role-Based Access

- **Admin**: Full access to view/manage all pieces. Role determined by `user.role` or `user.metadata.role` in Neon session.
- **Practitioner**: Can only view and manage their own pieces.

### Database Schema

The `pieces` table contains:
- `user_email`, `user_first_name` - owner info
- `photo_url` - Vercel Blob URL
- `temperature_type` - "Haute temperature" or "Basse temperature"
- `clay_type` - "Gres", "Faience", or "Porcelaine"
- `biscuit_requested`, `biscuit_completed`, `biscuit_date`, `biscuit_completed_date`
- `emaillage_requested`, `emaillage_completed`, `emaillage_date`, `emaillage_completed_date`
- `submitted_date`, `notes`

### Key Libraries

- `lib/db.ts` - Neon SQL client (`neon()` from `@neondatabase/serverless`)
- `lib/auth/client.ts` - Neon Auth client (client-side, `'use client'`)
- `lib/utils.ts` - `cn()` helper for Tailwind class merging
- `lib/types.ts` - TypeScript interfaces (Piece, User, etc.)

### UI Components

All shadcn/ui components are in `components/ui/`. Custom components:
- `components/student-form.tsx` - Piece submission form
- `components/admin-piece-card.tsx` - Admin piece display
- `components/admin-filters.tsx` - Filtering UI

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (for photo uploads)

## Development Notes

- The app is in French (UI labels, comments)
- Path alias `@/*` maps to project root
- TypeScript build errors are currently ignored in `next.config.mjs`
- Images are unoptimized in Next.js config