# Asset request: backdrop_ethereal

- **Destination:** `public/assets/tiers/backdrop_ethereal.png` (installed via `npm run assets:intake -- backdrop_ethereal <raw.png>`)
- **Semantic object:** wide isometric ethereal sky campus: monumental iridescent liquid-metal architecture floating in pale cyan lavender blush clouds, soft fog, reflective mirror floor platform with large open center space for game sprites, aspirational and weightless, no people, no text
- **Material tier:** t5 — physically convincing iridescent liquid-metal mercury with subtle cosmic pearl spectral shift, form-preserving dark reflections, NOT rainbow foil or glitter
- **Accent:** #E9D5FF
- **Target size:** 1600x900
- **Transparency:** none (full-frame scene)
- **Camera / light:** 30° isometric, cool white key top-left, soft AO, subtle cyan rim
- **Acceptance:** bold silhouette readable at 24px; no text; no background card; passes intake (alpha + min 512px)
- **Prompt:** run `python3 scripts/asset_pipeline/prompt.py backdrop_ethereal`
