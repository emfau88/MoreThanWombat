# Release-Balance-Baseline

**Stand:** 2026-09-04. Diese Tabelle ist ein Abnahmeprotokoll, keine Aufforderung zu blindem Zahlen-Tuning. Werte werden nur nach einem dokumentierten Combat-Gym- und Wave-Run geändert.

## Kern-Roster

| Figur | Rolle | HP / Tempo / MP-Regen | Basic | Special | Ultimate | Abnahme-Risiko |
|---|---|---|---|---|---|---|
| Wombat | beweglicher Bruiser | 100 / 187 / 4,5 | 8 Schaden, 330 ms | 18, 720 ms, 25 MP | 28, 950 ms, 100 MP | Earthshaker darf Mobilität nicht überkompensieren |
| Discount Wizard | Zoner mit Risiko | 76 / 149 / 6,0 | 6, 360 ms | Fireball, 590 ms, 22 MP | Clearance Orb, 1.050 ms, 100 MP | Nahkampf bleibt klar gefährlich |
| Budget Barbarian | langsamer Flächen-Bruiser | 112 / 134 / 4,0 | 12, 500 ms | 22, 785 ms, 30 MP | Axe Rain, 1.490 ms, 100 MP | lange Recovery muss fair lesbar bleiben |
| Mara Breach | schneller Kick-Skirmisher | 88 / 201 / 5,2 | 8, 358 ms | 15, 550 ms, 28 MP | 27, 885 ms, 100 MP | Tempo plus Reichweite darf keinen sicheren Dauerdruck ergeben |

Die Dauer ist Startup + Active + Recovery. Projectile- und Mehrtreffer-Moves werden im Gym nach tatsächlicher Trefferrate beurteilt, nicht allein nach der Tabellenzahl.

## Feste Freigabereihenfolge

1. Pro Figur C1, C2, C5, C8 und C9 aus [Combat-Feel-Matrix](combat-feel-matrix.md) im Gym prüfen.
2. Mit derselben Figur einen vollständigen `Junkyard Run` spielen; Treffer, Tod, blockierte Bewegung, Offscreen-Gefahr und Ultimate-Readability notieren.
3. Bei jeder betroffenen Änderung Full, Reduced und Minimal VFX sowie mindestens eine Touch-Abnahme wiederholen.
4. Erst dann genau **eine** Ursache ändern (Schaden, Timing, Reichweite, Mana oder KI-Parameter) und den Vergleich erneut protokollieren.

## Harte technische Schutzregeln

- Der normale Roster enthält vier Spielerfiguren. Buster Bulldog und Reference Fighter bleiben Combat-Gym-Prototypen.
- Jede Spielerfigur besitzt Basic, Special und Ultimate; Special kostet Mana, Ultimate benötigt volle Mana-Leiste. Dieser Vertrag ist automatisiert in `tests/shippable-roster.test.ts` gesichert.
- Wave-Daten dürfen keinen Prototyp verwenden; die Stage-Validierung prüft sichere Spawn- und Laufbereiche.

## Offene subjektive Abnahme

- [ ] Match-up Wombat gegen Wizard
- [ ] Match-up Barbarian gegen Mara
- [ ] Jede Spielerfigur: ein kompletter Wave-Run
- [ ] Kleinste Zielklasse im Landscape-Modus, Touch und drei VFX-Stufen

