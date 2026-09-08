# G3 – Sieben Junkyard-Encounters: Implementierung und technische Prüfung

**Stand:** 2026-09-08
**Ergebnis:** Implementiert und technisch geprüft. Die gemeinsame manuelle Spielgefühl- und Balanceabnahme für G1–G3 bleibt offen.

## Gelieferter Run

| # | Zone | Encounter | Aufgabe | Rollen | Eintritt |
|---:|---|---|---|---|---|
| 1 | Scrap Gate | Gate Crasher | Pursuer-Rhythmus lesen | Pursuer | direkt |
| 2 | Scrap Gate | Side Door | verspäteten Lane-Wechsel verfolgen | Pursuer + Flanker | Flanker nach 900 ms |
| 3 | Furnace Yard | Crossfire | Nah- und Fernkampf abwechseln | Pursuer + Zoner | Zoner nach 550 ms |
| 4 | Furnace Yard | Armor Lesson | Armor unter Verfolgungsdruck brechen | Heavy + Pursuer | Pursuer nach 650 ms |
| 5 | Furnace Yard | Foreman Audition | zwei lange Commitments bestrafen | Heavy + Flanker | Flanker nach 800 ms |
| 6 | Neon Dump | Neon Ambush | drei gestaffelte Rollen überstehen | Pursuer + Zoner + Flanker | 0/650/1300 ms |
| 7 | Neon Dump | Junkyard Overtime | provisorischen Finalmix kontrollieren | Heavy + Zoner + Flanker | 0/500/1050 ms |

- Jeder Encounter besitzt Daten für Aufgabe, Druckbudget, Completion Rule und Gegnerliste.
- Jede Spawn-Definition besitzt eine stabile ID, Entry-Richtung und Entry-Verzögerung. Einlaufende Gegner sind unsichtbar, danach sichtbar invulnerable und werden erst am Zielpunkt zu gültigen Kampfobjekten.
- `defeat_all` steuert alle sieben ausgelieferten Encounter. Das typisierte und validierte `defeat_priority` samt Runtime-Auflösung ist für G7 vorbereitet, wird in G3 aber nicht benutzt.
- Encounter innerhalb derselben Zone wechseln automatisch über Intro und Entry. Spielerposition, Kamera und Arena bleiben erhalten. Laufkorridore öffnen sich ausschließlich nach Encounter 2 und 5 an den beiden Zonengrenzen.
- Die Schwierigkeit wächst über Rollen, Verzögerungen, drei getrennte Director-Kanäle und Burst-Fenster. HP-Werte bleiben nahe an den G2-Prototypen.
- Das bisherige Limit wurde gezielt von zwei auf drei gleichzeitig vorhandene Gegner erweitert. Spawn-Suche und Kamera-Sicherheit werden für mehrere Spielerpositionen und 960/1200 logische Breite geprüft.
- Flanker und Heavy bleiben gemäß G2-Produktionsregel sichtbare Art-Prototypen. G3 benötigt keine zusätzliche Rolle; neue Charakterproduktion würde vor der mechanischen Abnahme zusätzliche, derzeit unbegründete Kosten erzeugen.

## Automatische Nachweise

```text
npm.cmd test
75/75 bestanden

npm.cmd run typecheck
bestanden

npm.cmd run build
bestanden

G3 Phaser runtime, 960 × 540
198/198 bestanden

G3 Phaser runtime, 844 × 390 mobile landscape
198/198 bestanden

G2 Phaser regression, 960 × 540
51/51 bestanden

G1/full-run regression, 960 × 540
639/639 bestanden
```

Der G3-Harness lädt echte Assets und Szenen, durchläuft alle sieben Encounter, prüft Entry-Richtung, Verzögerung, Schutz, Aktivierung, Projektil-Cleanup, vier Sub-Wave-Wechsel, zwei Zonentravels und Victory. Der erweiterte G1-Harness wiederholt den vollständigen Run mit Wombat, Discount Wizard, Budget Barbarian und Mara Breach sowie Defeat, Restart, Duel und Combat Gym.

- [960 × 540 Laufzeitbild](runtime-960x540.png)
- [844 × 390 Mobile-Laufzeitbild](runtime-844x390.png)
- [960 × 540 Laufzeitprotokoll](runtime-960x540.log)
- [844 × 390 Laufzeitprotokoll](runtime-844x390.log)
- [G2-Regressionsprotokoll](g2-regression/runtime-960x540.log)
- [Vollständiges G1-/Run-Regressionsprotokoll](g1-regression/runtime-960x540.log)

## Offene manuelle Abnahme

- G1: Director-Druck, wartende Gegner und Trefferlesbarkeit auf Keyboard und Touch.
- G2: Austauschtest, Rollen-Punish-Fenster, Paarungen und Full/Reduced/Minimal VFX.
- G3: alle sieben Aufgaben ohne Debug-UI erkennen; Tempo, Leerlauf, Schadensspitzen und Schwierigkeitskurve mit der [Run-Messvorlage](../gameplay-run-template.md) protokollieren.
- Prüfen, ob die verzögerten Eintritte fair sichtbar werden und Encounter 6/7 mit drei Rollen ohne Stunlock spielbar bleiben. Crowd-Sicherheit, Guard/Evade und Knockdown werden anschließend in G4 umgesetzt.
- Erst nach mechanischer Freigabe finale Flanker-/Heavy-Assets produzieren.

Browserautomation belegt Zustände und Lifecycle, ersetzt aber keine Balance- oder Realgeräteabnahme.
