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

## Recent Changes
- Removed Banner slider from homepage
- Added Rewards button (star icon with points badge)
- WhatsApp button for inquiries (green, below rewards button)
- Points display in header dropdown
- Escape key closes all popups