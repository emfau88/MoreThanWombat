# Runtime-Asset-Audit

**Stand:** 2026-09-03. Dieser Audit ist nicht destruktiv: Er trennt zunächst nur beobachtete Runtime-Referenzen von wahrscheinlich nicht auszulieferndem Quellmaterial. Erst nach manueller Prüfung jedes Kandidaten darf ein separater Verschiebe-Commit folgen.

## Reproduzierbarer Report

```powershell
npm.cmd run assets:report
```

Der Report liest `PreloadScene.ts` und inventarisiert alle Dateien unter `public/assets`. Er liefert:

- Gesamtgröße und Dateizahl der öffentlich ausgelieferten Assets;
- die direkt aus `PreloadScene` referenzierten Runtime-Dateien;
- Kandidaten mit `source`, `original`, `raw`, `chroma`, `reserve` oder `master` im Namen;
- die zwölf größten Dateien als Priorisierung für eine spätere Bereinigung.

## Aktueller Inventarabgleich — 2026-09-05

`npm.cmd run assets:report` wurde in G0 erneut ausgeführt: **96 Dateien / 68,31 MiB** unter `public/assets`, davon **47 Dateien / 20,17 MiB** durch direkte Pfadtexte in `PreloadScene.ts` erkannt. **26 Dateien / 30,30 MiB** sind per Dateiname vermutete Source-Kandidaten. [Vollständiger Report](gameplay-baseline-2026-09-05/assets-report.log).

Die Referenzsuche ist heuristisch und erfasst dynamische Manifestpfade nicht vollständig; die Gruppen können sich überschneiden. Das lokale Inventar enthält möglicherweise ignorierte Dateien, die im CI-Checkout fehlen. Es ist keine gemessene Netzwerk-Transfergröße und beweist nicht, dass nicht direkt referenzierte Dateien entfernt werden dürfen. Transfer/Startzeit und Source-/Runtime-Trennung bleiben offen. G0 verschiebt oder löscht keine Assets.

## Historischer Ausgangsbefund — 2026-09-03

| Kennzahl | Wert |
| --- | ---: |
| `public/assets` gesamt | 58.17 MiB / 86 Dateien |
| `public/assets/original` | 5.90 MiB / 10 Dateien |
| Charakter-Assets gesamt | 33.15 MiB / 34 Dateien |
| Größte Einzeldatei | Rooftop Background, 2.18 MiB |

Die Ordner `original`, `source` sowie Chroma-/Reserve-Dateien sind **noch nicht verschoben**. Sie bleiben unverändert, bis ein späterer Report und ein manuelles Asset-Review sicher bestätigen, dass kein Build-Schritt, keine QA und keine Runtime-Referenz sie benötigt.
