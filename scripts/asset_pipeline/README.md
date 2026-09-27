# SoloUnicorn asset pipeline

Turns image-gen output into installed game assets on the canonical registry
paths, honoring `docs/ASSET_CATALOG.md` (materials, camera, silhouette, alpha).

## The loop

1. **Prompt** — `python3 scripts/asset_pipeline/prompt.py <asset-id>` prints the
   generation prompt for a catalog entry (`--all` dumps the whole pack).
2. **Generate** — paste the prompt into an image generator
   (ChatGPT Images / Gemini Nano Banana Pro). Icons need a genuinely
   transparent background; scene backdrops (`"scene": true`) do not.
3. **Share** — in ChatGPT, share the conversation (Share → Create link). The
   public share URL is the transfer handle; no download on the generating
   machine is needed.
4. **Pull** — `npm run assets:pull -- <shareUrl> /tmp/raw.png [--index N]`
   renders the public share page in local headless Chrome and downloads the
   full-resolution PNG.
5. **Intake** — `npm run assets:intake -- <asset-id> /tmp/raw.png` verifies
   (real alpha for icons, minimum source size), trims transparent margins,
   centers onto the exact target canvas, optimizes, installs to the entry's
   `dest`, and writes a `<dest>.generated` marker distinguishing a generated
   final from a legacy procedural file at the same path.
6. **Report** — `npm run assets:report` lists installed vs pending catalog ids.

Every catalog id still pending after a generation session gets a brief in
`asset_requests/pending/<id>.md` (see `docs/context/archive/master-context-v1/references/ASSET_BRIEFS.md`
for the escalation contract).

## Adding assets

Add an entry to `catalog.json`: `id`, `dest` (repo-relative, must match the
path consumers already use — e.g. `src/engine/assets.ts` registry strings),
`size` (target canvas), `alpha`, `tier` (material t1–t5), `accent`, `object`
(the contextual-object description), and `"scene": true` for full-frame
backdrops. Materials follow the five-tier journey: charcoal → gunmetal →
gold → liquid glass → Ethereal iridescent liquid metal (never CSS-rainbow).
