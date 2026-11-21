[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/arash2105/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/arash2105/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A free offline web app that turns your photo and a caption into multi-panel GTA-style poster cover art, exported as a PNG to share. Made for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on [make.fun](https://make.fun).

Six poster layouts (four-panel grid, hero + three, full bleed, nine-panel, tilted snapshots, three strips) and five colour grades (Vice Sunset, Neon Night, Palm Gold, Teal Noir, Hot Pink). Every panel keeps its own crop: pick a focal point — a face, a car, a sunset — then drag and zoom the photo inside the panel. Load one photo or several, write your title, subtitle and badge, and export 1080 × 1080, 1080 × 1350 or 1920 × 1080. Everything runs in your browser from static files; photos never leave your machine. All art and lettering are original — no Rockstar Games logo, artwork or font. Display type is Anton and Pacifico, both under the SIL Open Font License (see `app/fonts/OFL.txt`).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Add photos, choose a layout and grade, crop each panel, edit the caption, and export a PNG.
