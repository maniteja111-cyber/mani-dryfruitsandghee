<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: MANI DRY FRUITS & GHEE STORE

## Quick Reference

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **DB**: MySQL on Hostinger - `DATABASE_URL` in `.env`

## Key Features

### Loyalty Rewards System
- Daily login bonus (5 points)
- 10 points per ₹100 spent
- 50 points first purchase bonus
- 100 points per referral
- 15% welcome coupon for referred users

### Product Management
- Per-product flags: `isFeatured`, `isTodayOffer`, `isVisible`
- Admin at `/admin/products`

### Image Upload
- Auto-compression: Resize to 1200px max, compress to ~100kb
- Uses sharp library
- **Cloudinary integration:** Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env` to store images on Cloudinary instead of local storage
- Without Cloudinary config, images are stored locally in `public/uploads/`

## Recent Changes
- Removed Banner slider from homepage
- Added Rewards button (star icon with points badge)
- WhatsApp button for inquiries (green, below rewards button)
- Points display in header dropdown
- Escape key closes all popups
- Added Google OAuth login with NextAuth.js
- Added address management (saved addresses in DB)
- Added `/account` page for profile/addresses
- Updated checkout with address selection

## Google OAuth Implementation
- Implemented Google OAuth login with NextAuth.js
- Added "Continue with Google" button to login page and rewards popup
- Created account page (`/account`) for profile management
- Added address management API (`/api/user/addresses`)
- Updated checkout with saved address selection
- Added auth method column (Google/Phone) in admin users panel
- Fixed header colors - now uses fixed yellow (#f59e0b) instead of settings.themeColor
- Fixed daily bonus issue - Google OAuth no longer updates lastLoginDate
- Pushed all changes to GitHub main branch

## Constraints & Preferences
- Keep existing OTP login working
- Use existing database schema (no migrations possible on production)
- Header colors visible on both light and dark mobile themes

## Key Decisions
- Google OAuth stores email as `phone` field (since Google doesn't provide phone)
- Admin detects Google users by checking if `email` field is populated
- Addresses stored as JSON in `addressBook` column

## Next Steps
- (none)