# Asset request: backdrop_workstation

- **Destination:** `public/assets/tiers/backdrop_workstation.png` (installed via `npm run assets:intake -- backdrop_workstation <raw.png>`)
- **Semantic object:** wide isometric empty premium studio office interior: dark stone floor, polished gold wall inlays, warm amber accent lighting, floor-to-ceiling window showing night city, large open center space for game sprites, no people, no text
- **Material tier:** t3 — high-polish mirror gold and radiant brass chassis with glowing warm amber core
- **Accent:** #FFC857
- **Target size:** 1600x900
- **Transparency:** none (full-frame scene)
- **Camera / light:** 30° isometric, cool white key top-left, soft AO, subtle cyan rim
- **Acceptance:** bold silhouette readable at 24px; no text; no background card; passes intake (alpha + min 512px)
- **Prompt:** run `python3 scripts/asset_pipeline/prompt.py backdrop_workstation`
