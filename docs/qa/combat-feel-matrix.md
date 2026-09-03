# Combat-Feel-Matrix — Vertical Slice

**Stand:** 2026-09-03. Diese Matrix ist die verbindliche Prüfreihenfolge vor Zahlenänderungen. Aktuelle Werte stammen aus `src/game/data/attacks.ts` und werden erst nach reproduzierbarem Gym-/Wave-Test verändert.

## Rollenvertrag

| Figur | Rolle | Stärke | Risiko / Prüffokus |
|---|---|---|---|
| Wombat | schneller Bruiser | höchste Mobilität, klarer Heavy-/Ground-Peak | darf nicht durch Tempo plus Earthshaker alle Räume dominieren |
| Discount Wizard | Glaskanonen-Zoner | Distanz, Mana, Projektil- und Miscast-Humor | Fireball braucht Raum; Nahkampf muss riskant bleiben |
| Budget Barbarian | langsamer Flächen-Bruiser | breite Hitboxen, Axe-Rain-Telegraphie | Recovery und Gegnerdruck müssen seine Peaks rechtfertigen |
| Buster Bulldog | zäher Nahdruck | viel HP, kurzer Dash-/Knockback-Peak | darf nicht ohne Commitment ständig Nahraum gewinnen |
| Angry Pigeon | leichter Gegner | Tempo und einfacher Druck | dient als lesbarer Baseline-Dummy, nicht als Boss |

## Feste Gym-Szenarien

| ID | Range | Lane | Dummy | Mana | Erwartung |
|---|---:|---:|---|---:|---|
| C1 Point Blank | 58 | 0 | Idle | 100 % | Basic trifft, Heavy bleibt lesbar |
| C2 Max Range | 150 | 0 | Idle | 100 % | Wizard-Projektil und Axe-Telegraphie bleiben verständlich |
| C3 Lane Check | 92 | 34 | Idle | 100 % | horizontale Moves treffen nicht ungewollt über Lane hinweg |
| C4 Air Check | 58 | 0 | Idle | 100 % | Air Bonk trifft nur sichtbar/plausibel |
| C5 Guard | 58 | 0 | Guard | 100 % | Block ist eindeutig und ohne Schaden/Hitstun |
| C6 Armor | 58 | 0 | Armor | 100 % | Schaden ohne normalen Stun, kein Doppeltrigger |
| C7 Phase | 58 | 0 | Invulnerable | 100 % | Kontakt ohne Schaden, klare Phasenrückmeldung |
| C8 Pressure | 58 | 0 | Attack Loop | 100 % | Recovery, Input Buffer und Whiffs bleiben fair |
| C9 Ultimate | 92 | 0 | Idle | 100 % | Peak eindeutig, Figur und Boden bleiben lesbar |
| C10 Wave | echte Section | 0/34 | 2 Gegner | 100 % | keine Offscreen-Treffer, keine unlesbaren Overlaps |

## Freigaberegel

Eine Balanceänderung wird nur übernommen, wenn sie für die betroffene Figur mindestens C1, C2, C5, C8 und C10 verbessert oder neutral hält. Getestet werden außerdem Full/Reduced/Minimal VFX sowie Touch auf dem Zielgerät. Ergebnisse gehören in die Release-Checkliste.
