# Universal VFX Library Source Provenance

Stand: 2026-09-02. Diese Source-Master ergänzen den freigegebenen BULK-4.0-Style-Lock zu einer universellen Produktionsbibliothek. Sie wurden im eingebauten ImageGen-Modus erzeugt und danach nur über `config/vfx-library.json` in Runtime-Dateien überführt.

Gemeinsamer Vertrag: echte RGBA-Transparenz, isolierter Comic-VFX-Baustein, keine Figur, keine Waffe, keine Arena, keine Bodenplatte, kein Text und keine UI. Die endgültige Runtime-Prüfung läuft mit `npm.cmd run vfx:refresh`.

| Datei | Rolle | Finaler Kurzprompt |
|---|---|---|
| `block-contact-source.png` | Abwehrfächer | Icy cyan shield fan with a small white contact core and short angular deflection streaks. |
| `armor-contact-source.png` | No-Sell-Ring | Wide blunt amber-orange armor ring with cream core and chunky fragments; absorbed hit. |
| `invulnerable-contact-source.png` | Phasenring | Two thin broken cyan/periwinkle oval arcs and tiny diamonds; no explosive core. |
| `whiff-trail-source.png` | Fehlhieb-Bewegung | Three short tapering blue-gray speed arcs; no contact core. |
| `dust-medium-source.png` | neutrale Bodenfolge | Low beige comic dust puffs and neutral debris; center open; no ground plane. |

Die Style-Lock-Master und ihr vollständiger gemeinsamer Prompt-Vertrag verbleiben in `../style-lock/README.md`.

