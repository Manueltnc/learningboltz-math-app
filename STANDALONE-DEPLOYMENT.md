# Standalone Math App - Deployment Guide

This is the standalone version of the Math Times Tables app, ready for independent deployment.

## Changes Made for Standalone Deployment

1. **Localized Dependencies**: 
   - Created `src/types/index.ts` with all shared type definitions
   - Created `src/lib/api-client.ts` with the unified API client
   - All imports updated to use local files instead of monorepo packages

2. **Updated package.json**:
   - Removed `@education-apps/shared-types` and `@education-apps/api-client` dependencies
   - Renamed package to `math-app-standalone`
   - All dependencies are now standard npm packages

## Prerequisites

- Node.js 18 or higher
- A Supabase project with the database schema set up
- Environment variables configured

## Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

This will:
1. Run TypeScript compilation with `tsconfig.build.json`
2. Build the Vite production bundle
3. Output to the `dist/` directory

## Deployment to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. Push this code to your GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

7. Click "Deploy"

### Option 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Database Setup

Before deploying, ensure your Supabase database has the required schema. Run the migration files in order:

1. `supabase-migrations/000_SIMPLIFIED_AUTH.sql`
2. `supabase-migrations/001_analytics_schema.sql`
3. `supabase-migrations/002_reconciliation_job.sql`
4. `supabase-migrations/004_role_utilities.sql`

See `DEPLOYMENT.md` for detailed database setup instructions.

## Vercel Configuration

The `vercel.json` file is already configured with the correct settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

## Troubleshooting

### Build Fails with TypeScript Errors

1. Ensure all imports use `@/` prefix for local files
2. Check that `src/types/index.ts` and `src/lib/api-client.ts` exist
3. Run `npm run lint` to check for issues

### Environment Variables Not Working

1. In Vercel, environment variables must be prefixed with `VITE_`
2. After adding environment variables, redeploy the project
3. Check Vercel deployment logs for any errors

### 404 Errors on Routes

Add this to your `vercel.json` if not already present:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## File Structure

```
math-app/
├── src/
│   ├── types/              # Local type definitions (NEW)
│   │   └── index.ts
│   ├── lib/
│   │   ├── api-client.ts   # Local API client (NEW)
│   │   ├── supabase.ts
│   │   ├── config.ts
│   │   └── utils.ts
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── main.tsx
├── dist/                   # Build output
├── package.json           # Standalone dependencies
├── tsconfig.json
├── tsconfig.build.json
├── vite.config.ts
└── vercel.json
```

## Testing the Deployment

After deployment:

1. Visit your Vercel URL
2. Sign up for a new account
3. Complete the placement test
4. Verify that:
   - Progress is saved
   - Grid updates correctly
   - Session tracking works
   - No console errors

## Support

For issues specific to this deployment:
- Check Vercel deployment logs
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure Supabase database schema is up to date

