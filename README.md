# Domo

A responsive housing website with 11 routes, scroll animations, striped page transitions, a home configurator, FAQ videos, a generated architectural FAQ background, and enquiry forms.

## Run locally

Requires Node.js 24.x and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create the production build. |
| `npm start` | Serve the production build after building. |
| `npm run lint` | Check project JavaScript and TypeScript. |
| `npm run typecheck` | Check TypeScript. |
| `npm run check` | Run lint, type checking, and production build. |
| `npm run test:navigation` | Check all 11 page-fragment endpoints against a running server. |

## Project structure

```text
src/app/                 Next.js route handlers and framework fallback layout
src/data/pages.json      Generated Domo page documents
public/                  Website styles, scripts, fonts, images, videos, captions and icons
scripts/                 Page preparation and verification tools
tools/media/             Optional image, logo and FAQ-video authoring tools
docs/research/           Source captures needed for page preparation and design notes
docs/design-references/  Original generated FAQ artwork
```

The site preserves its browser animation engine and serves HTML through `src/app/[[...path]]/route.ts`. Internal requests to `/html/<build>/<page-id>/slot.html` return only the page subtree. This keeps the document shell alive, plays the striped wipe, and avoids restarting the initial preloader on each link.

To regenerate page documents after editing the branding or source transforms:

```sh
node scripts/prepare-domo.mjs
```

The checked-in public assets are complete. Running or building the website does not require downloading the reference site, YouTube videos, or new images.

## Enquiries

Registration, trades and home-builder enquiries post to `/api/enquiries`. In development, submissions are stored privately in `.data/enquiries.ndjson` when no webhook is configured. This folder is ignored by Git and is not publicly served.

Production uses `ENQUIRIES_WEBHOOK_URL`, an HTTPS endpoint that saves enquiries or forwards them to your inbox/CRM. Optional `ENQUIRIES_WEBHOOK_TOKEN` is sent as a Bearer token. The server posts `{ id, receivedAt, data }`, where `data` contains the submitted form fields. Your endpoint should return a 2xx status after accepting the enquiry. Delivery times out after 10 seconds; redirects are not followed. No secret is exposed in browser code.

Production without a webhook returns HTTP 503 rather than reporting a submission as saved. Delivery failures return HTTP 502. Honeypot and email validation remain enabled. `npm run test:enquiries` checks validation, authenticated delivery, missing configuration and failed delivery without sending real enquiries.

The legal pages currently describe the local demonstration. A business release needs its own verified contact information, agreements and pricing.

## Deploy to Vercel

1. Push this folder to a Git repository and import it as a Vercel project. Set the root directory to the folder containing `package.json`.
2. Use the Next.js framework preset and Node.js **24.x**. `vercel.json` sets installation to `npm ci` and build to `npm run build`. Leave the output directory at the framework default.
3. Add `ENQUIRIES_WEBHOOK_URL` and, if needed, `ENQUIRIES_WEBHOOK_TOKEN` in Vercel's Environment Variables for Production. Configure Preview separately if preview forms should deliver enquiries too. `.env.example` documents the variables; do not commit secrets.
4. Deploy, then open the home page, `/faqs`, `/home-builder` and a nonexistent URL. Check the intro, page transitions, mobile layout and video playback. Send a test enquiry and confirm it arrives at your configured destination.
5. Add your custom domain in Vercel and follow its DNS instructions. Redeploy after changing environment variables.

For CLI deployments from this folder, run `npx vercel` for a preview or `npx vercel --prod` for production. Sign in and select your own project when prompted. No project or account identifiers are hardcoded.

All runtime media is included in `public/`; no external asset download or media-generation step is needed during deployment. `.vercelignore` excludes research captures, media-authoring dependencies, local enquiries and generated caches from CLI uploads. The deployment preserves the catch-all HTML route, page-fragment endpoints and enquiry API; no SPA rewrite or static export should be added.

## Optional media authoring

Media editing dependencies are separate from the website installation. Install them only when regenerating the logo, image exports, or FAQ clips:

```sh
npm install --prefix tools/media
node tools/media/create-brand-media.mjs --logo-only
```

Run media scripts from the project root. The FAQ image exporter accepts the path to a newly generated image:

```sh
node tools/media/prepare-faq-image.mjs /absolute/path/to/generated-image.png
```

`tools/media/narrate-faq.ps1` uses the Windows speech engine to regenerate intermediate WAV files. `tools/media/mux-faq-narration.mjs` combines them with the answer clips. WAV files are disposable once the WebM files are generated.

The FAQ artwork and its prompt are recorded in `docs/research/domo-faq-image.md`.

## Folder size and deployment

The cleanup removed roughly 405 MB (36%) of the measured working folder, including unused template packages, npm cache, old brand previews and intermediate audio. Live page documents and retained runtime assets were checked byte-for-byte. Installed dependencies and generated builds remain available so the website can still run immediately.

Normal dependencies contain only Next.js, React, and the development checks. Keep `public/` intact: its motion graphics, image variants, captions and fonts are referenced by the animation engine, including assets not immediately visible on the homepage.

`node_modules/`, `.next/`, npm caches and TypeScript build-info files are generated and excluded from Git. They can be recreated from `package-lock.json` and the source. Install optional media tools separately rather than bundling FFmpeg into every website installation.

Use `npm run build` followed by `npm start` for production. The project also retains a production Dockerfile and GitHub Actions quality checks. The original scaffold's MIT license is preserved in `LICENSE`.
