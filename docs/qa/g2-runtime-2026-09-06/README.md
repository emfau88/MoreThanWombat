# G2 – Gegnerökologie: Implementierung und technische Prüfung

**Stand:** 2026-09-06  
**Ergebnis:** Implementiert und technisch geprüft. Die manuelle Spielgefühlabnahme für G1 und G2 bleibt offen und wird wie vereinbart nachgeholt. G3 ist damit noch nicht spielerisch freigegeben.

## Gelieferter Slice

- Ein datengetriebener Rollenvertrag beschreibt für Pursuer, Flanker, Heavy und Zoner Wunschdistanz, Lane, Director-Kanäle, Entry/Attack/Recovery/Reposition, die geplanten G4-Reaktionen, Schwäche und genau eine mechanische Comedy-Signatur.
- Angry Pigeon verfolgt aggressiv und gerät nach einem verfehlten Peck in ein bewegtes `WHOOPS!`-Fenster.
- Scrap Flanker ist ein ausdrücklich markierter Art-Prototyp. Er richtet sich auf einer versetzten Lane aus, belegt Disruption, stürmt geradlinig und bleibt nach einem Fehlschlag im `CRASH!`-Fenster verwundbar.
- Scrap Heavy ist ebenfalls ein Art-Prototyp. Er läuft langsam ein, telegraphiert einen breiten Bash und absorbiert zwei Kontakte mit Armor. Der zweite Kontakt löst `ARMOR BREAK!` aus; danach ist er normal treffbar und bewegt sich dauerhaft schneller.
- Discount Wizard hält Distanz, flieht im Nahbereich und ersetzt jeden dritten freigegebenen Fernzauber deterministisch durch einen harmlosen Blindgänger mit `DUD!`-Eigen-Stagger.
- Rollenhinweise und Zustandsfarben hängen am Fighter und bleiben unabhängig von Full, Reduced und Minimal VFX sichtbar. Entry-Schutz, Offscreen-Schutz und Director-Token-Lifecycle aus G1 bleiben aktiv.
- Die Stage bleibt für G2 bewusst bei drei Encounters. Abschnitt 2 prüft Pursuer + Zoner, Abschnitt 3 Flanker + Heavy. Die sechs vorgesehenen Zweierkombinationen werden gegen einen gemeinsamen Director automatisiert geprüft; der Ausbau auf sieben komponierte Encounters bleibt G3.
- Finale Flanker-/Heavy-Sprites wurden entsprechend der Produktionsregel nicht begonnen. Beide verwenden klar markierte vorhandene Prototypgrafik.

## Automatische Nachweise

```text
npm.cmd test
74/74 bestanden

npm.cmd run typecheck
bestanden

npm.cmd run build
bestanden

G2 Phaser runtime, 960 × 540
38/38 bestanden

G2 Phaser runtime, 844 × 390, mobile landscape
38/38 bestanden

G1 Phaser regression, 960 × 540
235/235 bestanden
```

Der G2-Harness lädt die echten Assets und Phaser-Szenen, durchläuft Entry und alle drei Abschnitte, startet die neuen Moves auf echten `Fighter`-Instanzen, löst alle vier Comedy-/Break-Zustände aus, prüft Director-Kanäle sowie Full/Reduced/Minimal VFX und lässt den letzten Zustand für den Screenshot rendern. Die Unit-Tests prüfen zusätzlich alle vier Einzelrollen und sechs Paarungen. Der G1-Harness durchläuft weiterhin mit allen vier Spielerfiguren den vollständigen Drei-Abschnitt-Flow sowie Defeat, Restart, Duel und Gym.

- [960 × 540 Laufzeitbild](runtime-960x540.png)
- [844 × 390 Mobile-Laufzeitbild](runtime-844x390.png)
- [960 × 540 Laufzeitprotokoll](runtime-960x540.log)
- [844 × 390 Laufzeitprotokoll](runtime-844x390.log)
- [G1-Regressionsprotokoll](g1-regression/runtime-960x540.log)

## Offene manuelle Abnahme

- G1 nachholen: Druckstaffelung, wartende Repositionierung und Trefferlesbarkeit mit Keyboard und Touch protokollieren.
- Vier G2-Rollen ohne Debug-UI einzeln erkennen und Austauschtest durchführen.
- Jede Rolle in mindestens zwei Zweierkombinationen spielen; Leerlauf, unfairer Rückenangriff, Stunlock und Punish-Fenster notieren.
- Armor Break, geradlinigen Charge, Pigeon-Whiff und Wizard-Dud in Full, Reduced und Minimal VFX auf Gefühl und Lesbarkeit beurteilen.
- Flanker-/Heavy-Balance und Prototypdarstellung freigeben, bevor G3 die sieben Encounter komponiert. Guard, Evade und vollständiger Knockdown bleiben planmäßig G4.

Für die Messung gilt die [einheitliche Run-Messvorlage](../gameplay-run-template.md). Browserautomation beweist Zustände und Integrationen, ersetzt aber keine Spielgefühl- oder Realgeräteabnahme.
