# Quick Deployment Checklist

Use this checklist to deploy the Math Times Tables app to Vercel.

## Pre-Deployment

- [ ] All code changes committed to git
- [ ] Supabase project created
- [ ] Database migrations run (see DEPLOYMENT.md)
- [ ] Supabase credentials ready:
  - [ ] Project URL
  - [ ] Anon key

## Push to GitHub

```bash
# If not already initialized
git init
git add .
git commit -m "Standalone app ready for deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/Manueltnc/learningboltz-math-app.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click "Add New Project"
3. [ ] Import your GitHub repository
4. [ ] Framework should auto-detect as "Vite"
5. [ ] Configure settings:
   - [ ] Root Directory: `./` (leave empty)
   - [ ] Build Command: `npm run build` (should be auto-detected)
   - [ ] Output Directory: `dist` (should be auto-detected)
   - [ ] Install Command: `npm install` (should be auto-detected)
6. [ ] Add Environment Variables:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
7. [ ] Click "Deploy"
8. [ ] Wait for deployment to complete

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

## Post-Deployment

- [ ] Visit your Vercel URL
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Complete a placement test
- [ ] Start a practice session
- [ ] Verify progress is saved
- [ ] Check browser console (should be no errors)
- [ ] Test on mobile device
- [ ] Verify database is updating

## Troubleshooting

If deployment fails:

1. **Check Build Logs**
   - Look for TypeScript errors
   - Verify all imports are correct
   - Check for missing dependencies

2. **Check Environment Variables**
   - Ensure they start with `VITE_`
   - Verify Supabase credentials are correct
   - Redeploy after adding variables

3. **Check Database**
   - Verify all migrations ran successfully
   - Check RLS policies are in place
   - Test direct Supabase connection

4. **Local Test Build**
   ```bash
   npm run build
   npm run preview
   ```

## Success Criteria

✅ Build completes without errors
✅ App loads without console errors
✅ Users can sign up and log in
✅ Placement test works
✅ Practice sessions save progress
✅ Grid updates correctly
✅ No 404 errors on navigation
✅ Mobile responsive

## Need Help?

- See `STANDALONE-DEPLOYMENT.md` for detailed instructions
- See `CHANGES.md` for what changed during conversion
- Check Vercel deployment logs for errors
- Verify Supabase dashboard for data

---

**Ready to deploy!** 🚀

