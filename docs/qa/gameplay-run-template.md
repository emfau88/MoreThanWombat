# Gameplay-Run – Messvorlage

**Vorlagenstand:** 2026-09-05. Für jeden Versuch eine neue Kopie anlegen, z. B. `docs/qa/runs/2026-09-05-wombat-keyboard-01.md`. Auch Niederlagen und abgebrochene Versuche aufzeichnen. Diese leere Vorlage ist kein absolvierter Playtest.

## Versuchsbedingungen

| Feld | Eintrag |
|---|---|
| Run-ID, Datum und Prüfer | offen |
| Commit und lokale Änderungen | offen |
| URL / lokaler oder ausgelieferter Build | offen |
| Stage und Stand (G0: 3 Encounters / ab G3: 7) | offen |
| Spielerfigur / Versuch Nr. / vorherige Erfahrung | offen |
| Gerät, OS, Browser und Version | offen |
| Viewport, Orientierung und Safe Areas | offen |
| Input (Keyboard / echtes Touch / Emulation) | offen |
| VFX (Full/Reduced/Minimal), Flash, Shake, Audio | offen |
| Spieltempo / Debug-Modifikationen | 1×; keine HP-/MP-Resets oder Gegner-Skips für reguläre Balance-Runs |
| Messquelle (Video mit Zeitmarken / Telemetrie / manuell) | offen |
| Erwartete Auflösung bzw. Schätzunsicherheit | offen |

## Einheitliche Messregeln

- **Start/Ende:** Start beim ersten steuerbaren Wave-Frame; Ende beim ersten Victory-/Defeat-Ergebnis. Bei Abbruch dessen Zeitpunkt und Ursache erfassen. Restart beginnt einen neuen Versuch.
- **Zeit:** Sekunden ab Start protokollieren. Run-Dauer ist reale verstrichene Zeit minus dokumentierte Pausen; Hitstop, Entry, Clear, Travel und Transition bleiben enthalten. Ladezeit vor dem Start separat notieren. Messläufe mit Slow Motion/Frame Step als Diagnose markieren, nicht zur Balancebewertung zählen.
- **Encounter:** Entry-Beginn, Active-Beginn und Clear-Zeitpunkt getrennt erfassen. Aktive Dauer läuft bis Completion oder Spielertod. In G0 gibt es noch keine getrennte Entry-Sperre: Active beginnt mit laufendem Kampf, auch wenn Introtext sichtbar ist. Künftige Nachzügler/Sub-Waves gehören bis zur Completion zum selben Encounter.
- **HP/MP:** Werte beim Active-Beginn, bei Clear bzw. Tod und beim Zonenende unmittelbar vor Transition notieren. Run-Ende separat erfassen. Unlesbare MP-Werte als Schätzung markieren.
- **Erhaltener Schaden:** Tatsächlichen HP-Verlust über alle Treffer summieren, Heilung separat erfassen. Nicht einfach Start-HP minus End-HP verwenden, sobald Pickups existieren. Optional Overkill separat notieren.
- **Move-Einsatz:** Erfolgreich gestartete Specials/Ultimates zählen; abgelehnte Tasten-/Touch-Eingaben separat als Input-Befund notieren.
- **Druck:** Maximal gleichzeitig sichtbare lebende Gegner zählen. Gleichzeitig angreifend bedeutet Gegner mit laufendem offensivem Startup/Active; zusätzlich maximale gleichzeitig gefährliche Projektile/Flächen notieren. Ab G1 maximale belegte Melee-/Ranged-/Disruption-Budgets ergänzen; diese sind keine Synonyme für sichtbare Gegnerzahl.
- **Kontaktfreie Zeit:** Intervalle ohne erfolgreichen Schadens-, Block-, Armor- oder Invulnerable-Kontakt zwischen Spieler und Gegnern. Gesamtdauer sowie längstes Intervall notieren; Kampf und Travel/Transition getrennt erfassen. Zusätzlich erzwungenen Leerlauf (>5 s) von freiwilligem Warten/Repositionieren unterscheiden. Bei fehlender Messquelle `nicht gemessen` verwenden.
- **Fehlende Daten:** `nicht gemessen`, `nicht erreicht` oder `nicht vorhanden` schreiben, niemals eine erfundene Null. Die Baseline hat drei Encounters; Zeilen 4–7 sind dort `nicht vorhanden`. Bei Niederlage spätere Encounters als `nicht erreicht` markieren.
- **Vergleich:** Gleiche Figur, Geräteeinstellungen und Spielweise verwenden. Nach einem Fix genau die veränderte Ursache nennen. Kein Warten auf volle MP als unmarkierten Standardlauf verbuchen; einen Mana-Warteexploit separat testen und protokollieren.

## Verlauf je Encounter

| Nr. / Zone / Encounter-ID | Entry / Active / Ende (s) | Aktive Dauer (s) | HP Start → Ende | MP Start → Ende | Schaden / Heilung | Specials / Ultimates | Ergebnis |
|---|---|---|---|---|---|---|---|
| 1 | offen | offen | offen | offen | offen | offen | offen |
| 2 | offen | offen | offen | offen | offen | offen | offen |
| 3 | offen | offen | offen | offen | offen | offen | offen |
| 4 | offen | offen | offen | offen | offen | offen | offen |
| 5 | offen | offen | offen | offen | offen | offen | offen |
| 6 | offen | offen | offen | offen | offen | offen | offen |
| 7 | offen | offen | offen | offen | offen | offen | offen |

## Druck und Leerlauf je Encounter

| Nr. | Max. sichtbar / angreifend | Max. gefährliche Projektile/Flächen | Max. Melee/Ranged/Disruption belegt | Kontaktfrei gesamt / längstes Intervall (s) | Erzwungener Leerlauf, Telegraphie, Offscreen- oder Stunlock-Befund |
|---|---|---|---|---|---|
| 1 | offen | offen | offen | offen | offen |
| 2 | offen | offen | offen | offen | offen |
| 3 | offen | offen | offen | offen | offen |
| 4 | offen | offen | offen | offen | offen |
| 5 | offen | offen | offen | offen | offen |
| 6 | offen | offen | offen | offen | offen |
| 7 | offen | offen | offen | offen | offen |

## Zonen, Travel und Ressourcen

| Zone | HP / MP bei Zonenende | Travel / Transition (s) | Kontaktfrei außerhalb Combat (s) | Freiwillige Wartezeit (s) | Pickup: Zeitpunkt, HP/MP-Wahl und Wirkung |
|---|---|---|---|---|---|
| Scrap Gate | offen | offen | offen | offen | offen |
| Furnace Yard | offen | offen | offen | offen | offen |
| Neon Dump | offen | nicht vorhanden: Run-Ende | offen | offen | offen |

## Ergebnis und Befunde

| Feld | Eintrag |
|---|---|
| Victory / Defeat / Abbruch | offen |
| Run-Dauer / Pausen / Ladezeit (s) | offen |
| Rest-HP / Rest-MP am Run-Ende | offen |
| Schaden / Heilung gesamt; Specials / Ultimates gesamt | offen |
| Max. sichtbare / gleichzeitig angreifende Gegner im Run | offen |
| Kontaktfrei gesamt / längstes Intervall (Combat und außerhalb getrennt) | offen |
| Todesursache: Encounter, Gegner, Move, Richtung, vorherige HP | offen |
| War der tödliche Treffer angekündigt und vermeidbar? | offen |
| Früh-/Mittel-/Spät-Encounter mit größtem Schaden | offen |
| Exploit oder dominanter Move; Mana durch Warten | offen |
| Dichteste Szene: Frametimes, Messmethode / Konsolenfehler | offen |
| Motivation für erneuten Versuch / größter Frustmoment | offen |
| Eine vorgeschlagene Änderung und erwartete Wirkung | offen |
| Video / Screenshots / Telemetrie-Beleg | offen |

## Manuelle Flow- und Eingabeprüfung

Jeweils `bestanden`, `fehlgeschlagen` oder `nicht geprüft` und einen Beleg eintragen. Nicht nach einem anderen Versuch pauschal abhaken.

- Einstieg Menu → Select → Waves, sofortige Bewegung: **nicht geprüft**.
- Alle vorhandenen Encounters erreichbar, Clear und Travel ohne Softlock: **nicht geprüft**.
- Victory oder Defeat, Restart und Rückkehr zum Menu: **nicht geprüft**.
- Touch: gleichzeitige Bewegung/Aktion, keine klebenden Inputs, Rotation/Safe Areas: **nicht geprüft**.
- Telegraphen, Kamera und HUD lesbar, keine unkommunizierte Offscreen-Gefahr: **nicht geprüft**.
- Bei Wave-Codeänderung separate Duel-/Gym-Regressionsprüfung mit Beleg: **nicht geprüft**.
