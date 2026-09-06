# G0 – Gameplay-Baseline

**Stand:** 2026-09-05  
**Status:** G0 abgeschlossen; technische Ausgangsbasis geprüft, keine Gameplay- oder Release-Abnahme.  
**Codebasis:** `d676906b9939b60a0b8cfb416c3f46160f484205` (`Add Barbarian walk cycle and clean air attack frames`).

Beim Start waren ausschließlich `docs/README.md` geändert und `docs/31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md` unversioniert. Diese vorhandene Planarbeit bleibt erhalten. G0 ergänzt Dokumentation, Messvorlage, Prüfprotokolle und generierte QA-Berichte; Code, Gameplay-Daten und Assets bleiben unverändert. Kein Commit oder Deployment wurde in G0 erzeugt.

## Reproduktion und Prüfungen

Umgebung: Windows, PowerShell, Node `v22.17.1`, npm `10.9.2`; vorhandene lokale Installation und `package-lock.json`, keine Dependency-Aktualisierung. Alle Befehle im Projektroot ausführen. Die Logs dokumentieren genau diesen lokalen Checkout; sie sind keine Messung des Pages-Builds.

| Befehl | Ergebnis / Exitcode | Protokoll |
|---|---|---|
| `npm.cmd run typecheck` | PASS / 0 | [Typecheck](typecheck.log) |
| `npm.cmd test` | 55/55 PASS, keine übersprungenen Tests / 0 | [Tests](tests.log) |
| `npm.cmd run build` | PASS / 0, bekannte Chunk-Warnung | [Build](build.log) |
| `npm.cmd run assets:report` | Inventar erzeugt / 0; kein Performance-Gate | [Asset-Report](assets-report.log) |
| `npm.cmd run assets:qa` | 6/6 Sheets bestehen harte Gates / 0 | [Character-QA](assets-qa.log) |
| `npm.cmd run vfx:qa` | 6/6 Style-Lock, 5/5 Library, 4/4 Roster / 0 | [VFX-QA](vfx-qa.log) |

`build` enthält zusätzlich `tsc`. Character-QA prüft sechs Sheets inklusive Buster-Prototyp; das ist nicht die Zahl der spielbaren Figuren. Bestehende Review-Warnungen für Wombats Pose-Höhe und Pigeons Palette sind keine neuen harten Fehler. Automatische Asset-Gates beweisen keine visuelle oder spielerische Freigabe.

## Tatsächlicher Gameplay-Stand

| Bereich | Implementiert | Noch offen |
|---|---|---|
| Normale Spieler | Wombat, Discount Wizard, Budget Barbarian, Mara Breach | Vollständiger Run pro Figur auf Keyboard und Touch |
| Normale Duel-Gegner | Angry Pigeon, Discount Wizard | Match-up- und Ressourcenbalance |
| Diagnostische Prototypen | Buster Bulldog, Reference Fighter im Combat Gym | Keine Aufnahme in normalen Roster geplant |
| Combat | Datengetriebene Basic/Special/Ultimate, Jump/Air Bonk, Input Buffer, Hitstop, Boxen, Fraktionen und Hit-Reaktionen | Spieler-Guard/Evade, vollständiger Knockdown/Wake-up, Dash und Basic-Chain |
| Waves | `junkyard_run`, 3 Zonen, 3 statische Gruppen mit 1/2/2 Gegnern, insgesamt 5 Gegner; Combat/Travel/Transition | Director, Entry-Sperre, Rollenmix, 7 Encounters, Midboss/Boss, Interaktionen/Pickup |
| Stage | 2880 Weltbreite, 3 eigene Zonenhintergründe, Bodenvertrag und Travel-Korridore | Aktuelle vollständige Kamera-/Boden-Sichtprüfung und Screenshot-Baselines |
| KI | Eigener Controller pro Gegner, generischer Nahkampf und Wizard-Distanzregeln | Gemeinsame Druckbudgets und rollenbasierte Koordination |
| Mana | Regeneration im Fighter-Update, auch bei sicherem Travel; Transition und Result überspringen dieses Update | Phasenvertrag in G1, vollständige Ressourcenbalance in G8 |
| Flow | Vorhandene Victory/Defeat-, Restart- und Menu-Pfade | Aktuelle Laufzeitabnahme und automatisierte Browser-Smokes |

Autoritative Codepfade: `src/game/data/roster.ts`, `src/game/data/stages.ts`, `src/game/core/WaveTraversal.ts`, `src/game/core/WaveStageValidation.ts`, `src/game/core/BattleFlowController.ts`, `src/game/ai/EnemyController.ts`, `src/game/combat/Fighter.ts` und `src/game/scenes/BattleScene.ts`.

Die bestehende Stage-Validierung begrenzt Gruppen ausdrücklich auf zwei Gegner. Beim Ausbau müssen datengetriebene Encounter-/Spawn-Regeln diese Baseline-Grenze gezielt ablösen. Das aktuelle Intro blendet Text ein, sperrt aber die KI nicht als eigene Entry-Phase. Die State-Machine gehört ab G1 in einen testbaren Director. G10 bleibt für spätere, durch Gameplay begründete Extraktionen; neue Regeln werden schon vorher modular implementiert.

## Asset- und Build-Befund

| Kennzahl | Lokaler Messwert |
|---|---:|
| `public/assets` | 96 Dateien / 68,31 MiB |
| Im Preload-Quelltext direkt gefundene Pfade | 47 Dateien / 20,17 MiB |
| Per Dateiname vermutete Source-Kandidaten | 26 Dateien / 30,30 MiB |
| JS-Bundle laut Vite | 1.482,68 kB, gzip 384,79 kB |

Der Asset-Report sucht Pfadtexte in `PreloadScene.ts`. Dynamische Manifest-Referenzen werden damit nicht vollständig erfasst. Die Gruppen sind nicht zwingend disjunkt; fehlende direkte Referenz bedeutet nicht unbenutzt. Ignorierte lokale Dateien unter `public` können im lokalen Build enthalten sein. Diese Zahlen sind deshalb weder die garantierte CI-Artefaktgröße noch gemessene Browser-Transfergröße oder Startzeit. Es wurden keine Dateien verschoben oder gelöscht.

## Offene Gates

- **Browser:** Menu → Select → Duel/Gym/Waves, vollständiger Run, Defeat, Victory, Restart und Rückkehr zum Menu wurden in G0 nicht interaktiv geprüft. Frühere Sichtprüfungen bleiben historische Nachweise.
- **Balance/Spielgefühl:** Noch kein aktueller vollständiger Messlauf. Keine Run-Dauer, Attrition, Fairness oder Figurenbalance als bestanden ausgeben. [Messvorlage](../gameplay-run-template.md) verwenden.
- **Mobile:** Mindestens zwei reale Landscape-Geräteklassen, Multi-Touch, Rotation/Safe Areas, Audio-Unlock, Frametimes und vollständiger Run pro Figur bleiben offen.
- **Deployment:** Aktueller Live-Build, Direktreload und Assetpfade wurden nicht geprüft. Historischer Pages-Workflow beweist nicht den aktuellen Stand.
- **Runtime-Automation:** Kein Lint- oder Browser-Smoke-Script in `package.json`; entsprechende G10-Gates fehlen noch.
- **Assets:** Transfergröße/Startzeit, reale VFX-Frametimes und Source-/Runtime-Trennung bleiben G11-Arbeit.

Diese offenen Prüfungen sind explizite Folgebulks und verhindern den Abschluss des dokumentarischen G0 nicht. Sie gelten dadurch nicht als bestanden.

## Abnahme G0 und nächster Schritt

- [x] Aktuellen Roster, Stage-Stand und 55 Tests gegen den Code abgeglichen.
- [x] Vorhandene technische Prüfungen erfolgreich protokolliert.
- [x] Widersprüchliche Statusdokumente korrigiert oder ausdrücklich historisch eingeordnet.
- [x] Einheitliche Run-Messvorlage mit Messdefinitionen angelegt; Baseline mit drei und Ziel mit sieben Encounters berücksichtigt.
- [x] Offene Browser-, Realgeräte-, Balance- und Release-Gates sichtbar erhalten.
- [x] Änderungen auf Dokumentation, Logs und QA-Berichte begrenzt.

Nächster Implementierungsbulk: **G1 – Encounter Director und dynamisches Druckbudget** nach [Plan 31](../../31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md). Vor dessen Abschluss sind neben Unit-Tests und Build die dortigen manuellen Entry-, Druck- und Regressionsprüfungen nötig.
