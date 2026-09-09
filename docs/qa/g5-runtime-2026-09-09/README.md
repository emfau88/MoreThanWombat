# G5 – Run, Dash Attack, Basic-Chain und Air Bonk: technische Prüfung

**Stand:** 2026-09-09<br>
**Ergebnis:** Implementiert und technisch geprüft. Manuelles Rhythmus-, Balance- und Realgeräte-Gate bleibt offen.

## Gelieferter Bewegungsvertrag

- Ein voller Richtungsinput aktiviert nach 220 ms den `run`-Zustand. Das funktioniert über WASD/Pfeiltasten und den vorhandenen virtuellen Joystick, ohne zusätzlichen Button oder fehleranfälligen Touch-Doppeltipp.
- Run ist 1,42-mal so schnell wie Walk, bleibt lenkbar und endet nahe der Stick-Deadzone.
- `ATK` während Run startet je Figur einen eigenen, nach vorn gebundenen `dashAttack`. Gegeneingabe dreht ihn während des Commitments nicht um.
- Air Bonk friert die Bewegung nicht mehr ein: Sprungbogen und Gravitation laufen weiter, horizontale und Lane-Eingaben wirken mit 82 % Luftkontrolle und die Blickrichtung kann mehrmals korrigiert werden.

Die LF2-Prüfung bestätigt die relevante Grundidee: Die Originalsteuerung besitzt Jump und Attack, Running wird über eine schnelle Richtungseingabe erreicht, und Luftzustände dürfen Richtungs- beziehungsweise Facing-Korrekturen auswerten. More Than Wombat übernimmt daraus nur die lesbare Bewegungsentscheidung; die mobile Aktivierung bleibt ein kurzer voller Stick-Hold. Quellen: [offizielle LF2-Einführung](https://lf2.net/en/intro.html), [LF2-Empire State-Referenz](https://www.lf-empire.de/lf2-empire/data-changing/reference-pages/182-states?limitstart=&showall=1), [LF2 Controls Wiki](https://lf2.fandom.com/wiki/Controls).

## Gelieferter Chain-Vertrag

| Figur | Schritt 1 | Schritt 2 | Knockdown-Finisher | Dash Attack |
|---|---|---|---|---|
| Wombat | Wombat Jab | Paw Backhand | Warranty Headbutt | Commuter Bonk |
| Discount Wizard | Wand Smack | Wand Rebound | Receipt Stamp | Clearance Broom Bump |
| Budget Barbarian | Cracked Axe Swing | Axe Backstroke | Handle With Care | Budget Shoulder Delivery |
| Mara Breach | Gate Kick | Elbow Check | Emergency Exit Boot | Express Gate Crasher |

- Die drei Schritte und der Dash Attack liegen je Figur in den Fighter-/Attack-Daten und erscheinen einzeln im Combat Gym.
- Nur ein weiterer ATK-Input kann pro Schritt gespeichert werden. Schritt 3 beendet die Chain und kann nicht wieder auf Schritt 1 loopen.
- Ein bestätigter Treffer erreicht das Fortsetzungsfenster früher. Ein Whiff bindet den Spieler bis zu einem späteren Cancel-Punkt und lässt die volle Chain bestrafen.
- Eine aktive Chain lässt sich nicht frei in Special oder Ultimate abbrechen.
- Intern gestartete Folgeschritte lösen denselben Präsentationspfad wie normal gestartete Angriffe aus.

## Automatische Nachweise

```text
npm.cmd test
89/89 bestanden

npm.cmd run typecheck
bestanden

npm.cmd run build
bestanden

G5 Phaser runtime, 960 × 540
80/80 bestanden

G5 Phaser runtime, 844 × 390
80/80 bestanden

Mobile runtime, 844 × 390 plus Portrait-Rotation und 932 × 360
bestanden; echter Multi-Touch-Joystick-Run plus ATK-Dash, keine Browserfehler

G4 regression, 960 × 540 und 844 × 390
29/29 je Auflösung bestanden

G3/full-Wave regression, 960 × 540 und 844 × 390
335/335 je Auflösung bestanden

G2 role regression, 960 × 540
51/51 bestanden

G1 four-character/full-mode regression, 960 × 540
743/743 bestanden
```

Der G5-Harness lädt echte Phaser-Szenen und prüft alle vier Spielerfiguren. Er beweist Run-Schwelle und Geschwindigkeit, den figurenspezifischen Dash Attack, Vorwärts-Commitment, genau eine gepufferte Fortsetzung, frühes Hit- und späteres Whiff-Cancel, Knockdown-Finisher, Loop-Sperre, Special-Cancel-Sperre sowie Air-Bonk-Sprungphysik und wiederholte Richtungswechsel. Der Mobile-Smoke verwendet reale emulierte Touchpunkte gleichzeitig auf Joystick und ATK.

## Offene manuelle Abnahme vor oder zu Beginn von G6

1. Mit allen vier Spielern die Drei-Treffer-Chain im Gym und unter Wave-Druck prüfen: Rhythmus, sichtbare Posen, Reichweite und Bestrafbarkeit bei Whiff.
2. Run-Aktivierung und Dash Attack auf mindestens einem kleinen und einem breiten realen Landscape-Gerät testen; dabei unbeabsichtigte Runs, Daumenwechsel und Multi-Touch-Komfort notieren.
3. Air Bonk auf Keyboard und Touch mit gehaltenem Vorlauf, Richtungsumkehr und mehreren Lane-Korrekturen prüfen. Der Sprung soll flüssig bleiben, aber kein freies Luftfliegen erlauben.
4. Einen vollständigen Run je Spielerfigur protokollieren. Prüfen, ob Dash Attack und Knockdown-Finisher Crowd-Druck sinnvoll lösen, ohne Guard/Evade oder Special zu verdrängen.
5. Erst nach diesen Läufen Zahlen wie 220 ms, 1,42×, 82 % Luftkontrolle sowie Hit-/Whiff-Fenster nachziehen.

Browserautomation belegt Zustände, Verträge und Eingabeintegration. Sie ersetzt keine Rhythmus-, Balance- oder physische Geräteabnahme.
