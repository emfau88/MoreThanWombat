# G4 – Crowd-Sicherheit und Wave-Polish: technische Prüfung

**Stand:** 2026-09-08<br>
**Ergebnis:** Implementiert und technisch geprüft. Die gemeinsame manuelle Spielgefühl- und Balanceabnahme für G1–G4 bleibt offen.

## Gelieferter Combat-Vertrag

- `defend` startet ohne starke Richtung Guard und mit Richtung eine kurze Evade.
- Guard schützt 340 ms und besitzt 190 ms verwundbare Recovery. Evade besitzt 60 ms Startup, 190 ms Invulnerability, 170 ms verwundbare Recovery und einen gemeinsamen Wiederverwendungs-Cooldown.
- Authored Heavy Moves können Guard brechen. `blocked`, `guard_broken`, `armor`, `invulnerable` und normale Treffer bleiben getrennte Ergebnisse.
- Launch, Knockdown, Grounded und Wake-up sind eigene Fighter-Zustände. Grounded besitzt keine Hurtbox; Wake-up beginnt mit 260 ms Schutz und endet mit verwundbarer Recovery.
- Hitstun, Launch und Knockdown verhindern abwechselnde Crowd-Rehits. Tod bleibt ein eigener Zustand.
- G2-Rollen reagieren auf Block/Evade als fehlgeschlagenen Angriff und setzen bei Knockdown ihre Commitments sauber zurück.
- Combat Gym besitzt Presets für Guard, Evade, Launch, Knockdown und Wake-up.
- Desktop nutzt `F`. Mobile besitzt einen getrennten `DEF`-Button neben dem Joystick; alle fünf Aktions-Touchflächen bleiben auf dem kleinsten unterstützten Landscape-Viewport überschneidungsfrei.

## Nach Playtest-Rückmeldung korrigierter Junkyard Run

- Alle Fighter werden in jeder Combat- und Travel-Phase auf das sichtbar bemalte Bodenband `y=310…468` begrenzt.
- Die sieben Encounter nutzen nun die Gruppenkurve `1/3/3/3/3/4/4`: mehrere schwache Pigeons bilden die Masse, Flanker, Zoner und Heavy setzen punktuelle Spitzen.
- Gegner-HP wurde deutlich gesenkt. Der Director behält begrenzte Nahkampf-, Fernkampf- und Disruption-Commitments, damit vier vorhandene Gegner nicht gleichzeitig angreifen.
- Nach `Side Door` werden 25 % Max-HP und nach `Foreman Audition` 30 % Max-HP wiederhergestellt.
- Abschnittswechsel nutzen eine farblich zur Zone passende Karte mit Bereich, Encounter, Titel, Aufgabe und Heilhinweis.
- Intro und Bereichswechsel führen die Kamera zum kommenden Encounter. Aktiver Kampf rahmt Spieler und lebende Gegnergruppe gemeinsam; Travel folgt weiterhin dem Spieler.

## Automatische Nachweise

```text
npm.cmd test
84/84 bestanden

npm.cmd run typecheck
bestanden

npm.cmd run build
bestanden

G4 Phaser runtime, 960 × 540
29/29 bestanden

G4 Phaser runtime, 844 × 390
29/29 bestanden

G3/full-Wave regression, 960 × 540
335/335 bestanden

G3/full-Wave regression, 844 × 390
335/335 bestanden

G3/full-Wave regression, 844 × 390
335/335 bestanden

G2 role regression, 960 × 540
51/51 bestanden

G1 four-character/full-mode regression, 960 × 540
743/743 bestanden

Mobile runtime, 844 × 390 plus portrait rotation and 932 × 360
bestanden; keine ungenutzten Landscape-Ränder, keine Browserfehler
```

Der G4-Harness prüft echte Phaser-Fighter mit Guard, Guard Break, Evade-Fenstern, Recovery, Anti-Stunlock, Launch, Knockdown, Grounded, Wake-up, Tod und Gym-Presets. Der Wave-Harness durchläuft alle sieben Encounter und prüft zusätzlich Bodenband, schwach/stark gemischte Gruppenkurve, Heilbelohnungen, Übergangskarten, Kamera-Framing, Entry-Schutz, Travel und Victory.

## Offene manuelle Abnahme vor G5

1. Mit allen vier Spielern mindestens einen vollständigen Run ohne Debug-Schutz spielen und HP nach Encounter 2, 3, 5 und 7 protokollieren.
2. Guard und Evade in einer echten Zwei- bis Vier-Gegner-Drucksituation auf Lesbarkeit, Reaktionszeit und Recovery-Gefühl prüfen.
3. Prüfen, ob die neue Pigeon-Masse LF2-artig belebt wirkt, ohne dass Flanker, Zoner oder Heavy als einzelne Spitzen untergehen.
4. Kamera und Übergangskarten auf kleinem und breitem realem Landscape-Gerät prüfen; besonders auf verdeckte Telegraphen und Touch-Komfort achten.
5. Erst danach Zahlen nachziehen und G5 Run/Dash, Dash Attack und Basic Chain starten.

Browserautomation belegt Zustände und Lifecycle, ersetzt aber keine Balance- oder Realgeräteabnahme.
