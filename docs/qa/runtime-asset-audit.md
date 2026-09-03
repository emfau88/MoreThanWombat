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

## Ausgangsbefund

| Kennzahl | Wert |
| --- | ---: |
| `public/assets` gesamt | 58.17 MiB / 86 Dateien |
| `public/assets/original` | 5.90 MiB / 10 Dateien |
| Charakter-Assets gesamt | 33.15 MiB / 34 Dateien |
| Größte Einzeldatei | Rooftop Background, 2.18 MiB |

Die Ordner `original`, `source` sowie Chroma-/Reserve-Dateien sind **noch nicht verschoben**. Sie bleiben unverändert, bis ein späterer Report und ein manuelles Asset-Review sicher bestätigen, dass kein Build-Schritt, keine QA und keine Runtime-Referenz sie benötigt.
