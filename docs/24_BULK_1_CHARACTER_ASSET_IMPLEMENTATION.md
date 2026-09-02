# 24 — BULK 1 Character Asset Implementation

**Stand:** 2026-09-02
**Status:** Abgeschlossen und visuell abgenommen.

## Ergebnis

BULK 1 ersetzt instabile Laufzeitkorrekturen durch reproduzierbare Body-Sheets, prüfbare Exporte und einen neu aufgebauten Discount Wizard.

- Alle 5 produktiven Body-Sheets werden deterministisch als Runtime-Sheets erzeugt.
- Alle 10 Idle-/Walk-Gruppen bestehen die harten Gates für Fußlinie, Root-Proxy und Clipping.
- Ein Whole-Sheet-Gate prüft zusätzlich alle 108 Rasterzellen des produktiven Rosters auf unerwartet leere oder angeschnittene Frames.
- Die alten Idle-Offsets für Wombat, Wizard und Pigeon sind entfernt.
- Barbarian-Laufzeitskalierungen bis 1,7× und große Attack-Scale-Pops sind entfernt.
- Dauerhafte Ganzkörper-Tints für Hitstun und Air Attack sind entfernt; nur der kurze Hitflash bleibt.
- Body-Animation und Wizard-Cast-/Impact-FX bleiben getrennte Runtime-Layer.
- Der Wizard-Miscast ist im Combat Gym direkt anwählbar und damit deterministisch prüfbar.

## Discount Wizard v2

Der alte Wizard wurde nicht weiter mit Farbmasken und Offsets repariert. Er wurde aus einem kanonischen Master neu aufgebaut.

### Visuelles Master-Brief

- gedrungener, älterer Comedy-Wizard in klarer Seitenansicht
- türkisfarbener Hut und Mantel
- exakt ein magentafarbener Flicken am Hut
- gelber Stern am Hutende
- zwei violette Schuhe
- weißgrauer Bart, warmer Hautton und brauner Holzstab
- keine wechselnden Ärmel-/Mantelflicken
- keine eingebrannten Treffer-, Cast- oder Kontakt-VFX
- stabile Silhouette, Blickrichtung und Kostümidentität über alle Posen

Das Masterbild und die fünf generierten, unverkleinerten Reihen bleiben als nachvollziehbare Quellen erhalten:

```text
public/assets/characters/discount-wizard/source/discount_wizard_master_v2.png
public/assets/characters/discount-wizard/source/discount_wizard_idle_v2_raw.png
public/assets/characters/discount-wizard/source/discount_wizard_walk_v2_raw.png
public/assets/characters/discount-wizard/source/discount_wizard_attack_v2_raw.png
public/assets/characters/discount-wizard/source/discount_wizard_miscast_v2_raw.png
public/assets/characters/discount-wizard/source/discount_wizard_damage_v2_raw.png
```

`scripts/build-discount-wizard-sheet.mjs` entfernt den verbundenen hellen Hintergrund, sucht robuste Trennlinien zwischen den vier Posen, skaliert die Figuren auf eine gemeinsame Standhöhe und setzt sie auf dieselbe Ground Line. Die dichtebasierte Trennung ist absichtlich toleranter als eine starre Viertelung: So werden breite Angriffsposen und vereinzelte Antialiasing-Pixel nicht als abgerissene Stabteile in den Nachbarframe geschnitten.

Erzeugte Runtime-Kette:

```text
source rows
  -> discount_wizard_spritesheet_v2_128.png
  -> discount_wizard_spritesheet_v2_128_normalized.png
  -> PreloadScene / CharacterAnimationRegistry
```

## Verbindlicher Workflow

Generierte Dateien mit `_normalized` sowie das zusammengesetzte Wizard-v2-Sheet werden nicht manuell editiert.

```powershell
npm.cmd run assets:refresh
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

`assets:refresh` führt in dieser Reihenfolge aus:

1. Wizard-v2-Quellreihen zusammensetzen.
2. Alle fünf produktiven Sheets normalisieren.
3. vergrößerte Idle-/Walk-Loop-Vorschauen erzeugen.
4. harte Asset-Gates und Review-Metriken ausführen.

### Relevante Dateien

- `config/character-sheets.json` — Raster, Quellen, Runtime-Ziele, Loop-Gruppen und Ausnahmen
- `scripts/build-discount-wizard-sheet.mjs` — Wizard-v2-Sheetbau
- `scripts/normalize-character-sheets.mjs` — Runtime-Normalisierung
- `scripts/render-character-loop-previews.mjs` — ungeflippte und gespiegelte Review-Loops
- `scripts/character-asset-qa.mjs` — Loop- und Whole-Sheet-Gates
- `scripts/character-sheet-tools.mjs` — gemeinsame PNG-, Root-, Palette-, Margin- und Clipping-Logik
- `docs/qa/discount-wizard-build-latest.json` — Wizard-Buildprotokoll
- `docs/qa/character-normalization-latest.json` — angewandte Transformationen
- `docs/qa/character-assets-latest.md` — lesbarer QA-Bericht
- `docs/qa/character-loop-previews/` — vergrößerte Loop-Vorschauen

## Harte Gates

- erwartete Sheet-Abmessungen stimmen
- erwartete Frames sind nicht leer
- Idle-/Walk-Fußlinien-Drift höchstens 1 px
- Idle-/Walk-Root-Proxy-Drift höchstens 2 px
- keine sichtbaren Alphapixel am Zellrand
- keine unerwartet leeren oder angeschnittenen Frames im gesamten produktiven Sheet

Die Root-Messung ist eine reproduzierbare Näherung. Der spätere native Art-Workflow sollte zusätzlich explizite Root-/Fußmarker exportieren.

## Review-Warnungen und Entscheidung

Warnungen sind keine stillen Fehler, sondern bewusst dokumentierte Pose-/Materialentscheidungen:

| Figur | Warnung | Entscheidung |
|---|---|---|
| Discount Wizard | frühere Palette und starker Jitter | durch v2-Neuaufbau geschlossen; Idle-Palette 0,03, Root 0,07 px; Walk-Palette 0,03, Root 0,17 px |
| Angry Pigeon | Idle-Palettendistanz 0,11 | visuell akzeptiert; der angehobene Flügel verändert den sichtbaren Farbflächenanteil, feste Körpermaterialien bleiben lesbar |
| Wombat | Walk-Höhenänderung 4,95 % | als beabsichtigtes Gang-Bobbing akzeptiert; Fußlinie und Root bleiben stabil |
| Budget Barbarian | Walk-Höhenänderung 6,67 % | als Gewicht-/Schrittwechsel mit Sequenz `[4, 6, 5, 7]` akzeptiert; frühere Scale-Pops sind entfernt |

Diese Ausnahmen dürfen nur neu geöffnet werden, wenn eine In-Game-Regression sichtbar wird oder native Source-Art gezielt verbessert wird.

## Abnahme

- `npm.cmd run assets:refresh`: 5/5 Sheets bestehen alle harten Gates.
- Whole-Sheet-Gate: 0 angeschnittene und 0 unerwartet leere Frames.
- Discount Wizard: 20/20 Zellen gültig.
- Combat Gym bei 0,25×: Wand Smack und Miscast geprüft; keine abgerissenen Fragmente, saubere Ground Line und getrennte VFX.
- Charakterauswahl: Wizard-v2-Idle ungeflipped geprüft.
- `npm.cmd run typecheck`, `npm.cmd test` und `npm.cmd run build`: verpflichtender Abschlusscheck.

## Produktionshinweis

Die v2-PNG-Quellen sind ein kontrollierter, deutlich besserer Stand, aber noch keine ideale native Animationsdatei. Für spätere Erweiterungen sollen Ebenen für Body, Waffe, Character-FX und Root-Marker in einer editierbaren Master-Datei geführt werden. Neue Wizard-Posen müssen vom v2-Master abgeleitet werden; ein erneuter unabhängiger Sheet-Generatorlauf ohne Masterreferenz ist nicht zulässig.

## Übergang zu BULK 2

BULK 1 ist geschlossen. Das anschließende datengetriebene Hitbox-/Hurtbox-/Pushbox-System wurde als BULK 2 ebenfalls abgeschlossen; Umsetzung und Abnahme stehen in `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md`. Die Art-Pipeline bleibt dabei ein Gate: weitere move-spezifische Boxprofile werden gegen die normalisierten Runtime-Sheets und im Combat Gym bei 0,25× authored und abgenommen.
