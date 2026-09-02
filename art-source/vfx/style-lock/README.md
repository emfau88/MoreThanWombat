# VFX Style-Lock Source Provenance

Stand: 2026-09-02

Diese sechs PNGs sind die hochaufgelösten Source-Master für BULK 4.0. Sie wurden mit dem eingebauten OpenAI-ImageGen-Modus als neue Rasterbilder erzeugt. Die final verwendeten Varianten wurden ohne Bildreferenz generiert; fehlerhafte Zwischenresultate mit eingebettetem Schachbrett oder brauner Boden-Aura wurden verworfen und nicht in dieses Verzeichnis übernommen.

## Gemeinsamer Prompt-Vertrag

Der folgende Block gehört zu jedem Einzelprompt:

> Single isolated reusable 2D arcade-brawler VFX sprite, transparent RGBA background, no character, no arena, no floor plane, no scenery, no UI, no text, no shadow, no rectangular backdrop, no checkerboard. Punchy hand-drawn high-resolution comic style inspired by the instant readability and compact timing of classic arcade beat-em-ups, but not pixel art and not a copy of any existing game. Bold dark contour, few decisive shapes, mobile-readable silhouette, centered with generous transparent padding.

## Finaler Prompt-Satz

### `physical-light-a-source.png`

> A compact asymmetrical radial light-hit starburst. Warm white core, golden-yellow main wedges, orange-brown dark accents, five to seven uneven impact rays, sharp compressed contact silhouette. No smoke or glow cloud.

### `physical-light-b-source.png`

> A compact directional light-hit wedge travelling left-to-right. Warm white contact core, golden-yellow forward burst, orange-brown outline and a few tiny debris ticks. Strong horizontal attack vector, smaller and cleaner than a heavy hit.

### `magic-light-a-source.png`

> A compact magical light-hit rosette with a white core, violet petals and short cyan curling energy strokes. Rounded and fluid but strongly outlined, visibly different from a physical starburst, with only a few controlled fragments.

### `magic-light-b-source.png`

> A very compact four-lobed wizard magic impact. White center, violet main lobes, cyan side accents and a few small diamond sparks. Clear readable silhouette, minimal glow, no aura field.

### `ground-impact-a-source.png`

> A neutral circular ground-impact ring made only from abstract broken orange-brown shock arcs, beige comic dust puffs and a few small generic debris stones. Wide and low, center left open for a fighter, no painted terrain, no ground patch.

### `ground-impact-b-source.png`

> A compact low horizontal ground impact made only from two outward orange shock crescents, small beige dust puffs and a few neutral debris chips. The center stays open, the silhouette remains close to the ground, no halo, no soil, no grass, no asphalt, no floor plate.

## Reproduzierbarer Export

Die Source-Master werden nicht direkt vom Spiel geladen. Runtime-Dateien entstehen deterministisch aus `config/vfx-style-lock.json`:

```powershell
npm.cmd run vfx:refresh
```

Der Befehl trimmt die Alpha-Fläche, skaliert premultiplied-alpha-sicher auf die Zielzelle und führt anschließend die Transparenz-/Randprüfung aus.

