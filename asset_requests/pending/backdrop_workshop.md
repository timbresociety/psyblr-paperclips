# Asset request: backdrop_workshop

- **Destination:** `public/assets/tiers/backdrop_workshop.png` (installed via `npm run assets:intake -- backdrop_workshop <raw.png>`)
- **Semantic object:** wide isometric empty hardware workshop loft interior: brushed gunmetal wall panels, tool racks, server crate stacks, cool white strip lighting, dark graphite floor with large open center space for game sprites, no people, no text
- **Material tier:** t2 — brushed gunmetal titanium aerospace alloy with micro-chamfers and specular silver rim
- **Accent:** #58D9FF
- **Target size:** 1600x900
- **Transparency:** none (full-frame scene)
- **Camera / light:** 30° isometric, cool white key top-left, soft AO, subtle cyan rim
- **Acceptance:** bold silhouette readable at 24px; no text; no background card; passes intake (alpha + min 512px)
- **Prompt:** run `python3 scripts/asset_pipeline/prompt.py backdrop_workshop`
