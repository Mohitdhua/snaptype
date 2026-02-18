<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SnapType

This project is a Vite + React app for OCR-based typing tests.

## Run locally

1. Install dependencies: `npm install`
2. Create `.env.local` with:
   `GEMINI_API_KEY=your_gemini_api_key`
3. Start with Vercel dev server (required for `/api` routes): `npx vercel dev`
4. Type-check: `npm run typecheck`
5. Build frontend bundle: `npm run build`

## Deploy to Vercel

1. Import this repo in Vercel.
2. Keep framework preset as `Vite`.
3. Add environment variable:
   `GEMINI_API_KEY=your_gemini_api_key`
4. Deploy.
