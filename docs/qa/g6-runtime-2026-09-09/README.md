# G6 – Stage-Interaktionen, Pickup, Comedy und Midboss: technische Prüfung

**Stand:** 2026-09-09<br>
**Ergebnis:** Implementiert und technisch geprüft. Manuelle Spielgefühl-, Balance- und Realgeräte-Abnahme bleibt offen.

## Gelieferter Stage-Vertrag

- G6 verwendet genau zwei datengetriebene Interaktionstypen: `steam_vent` und `resource_pickup`.
- Encounter 3 enthält ein periodisches Dampfventil. Es startet nach einer festen sicheren Verzögerung, zeigt die Gefahrenellipse 900 ms lang an, trifft jeden geerdeten Fighter höchstens einmal pro Zyklus und startet keinen Warnzyklus außerhalb der Kamera.
- Encounter 4 enthält die fest platzierte **Union Lunchbox**. Sie stellt einmalig 18 % Max-HP und 25 % Max-MP wieder her. Platzierung und Wirkung sind reproduzierbar; es gibt keine Loot-Tabelle.
- Interaktionen laufen nur im aktiven Kampf und werden bei Section-Clear, Restart, Defeat und Victory vollständig entfernt.
- Stage-Daten werden auf Position, eindeutige IDs, maximal zwei Interaktionen, gültige Werte und gültige Midboss-Referenzen geprüft.

## Gelieferter Midboss-Vertrag

Encounter 5 ist jetzt ein Einzelkampf gegen den **Acting Foreman** mit eigenem AI-Profil und eigenem Namen im HUD. Seine 132 HP sind nur Teil des Profils; seine Identität entsteht aus einem festen dreistufigen Muster:

1. **Clipboard Check** – schneller, kurzer Nahkampftest mit `CLIPBOARD!`-Hinweis.
2. **Forklift Charge** – weit angekündigter Vorwärtsangriff mit Richtungsanzeige `FORKLIFT →`.
3. **Steam Drill** – kommandiert das feste Dampfventil nach einer 1050-ms-Warnung.

Steht der Foreman bei seinem eigenen Steam Drill auf dem Ventil, erleidet er 1,5-fachen Ventilschaden, wird niedergeschlagen, setzt sein Muster zurück und zeigt `SAFETY LAST!`. Die Pointe erzeugt damit ein echtes Angriffsfenster und verändert den Kampfzustand.

## Automatische Nachweise

```text
npm.cmd test
94/94 bestanden

npm.cmd run typecheck
bestanden

npm.cmd run build
bestanden

G6 Phaser runtime, 960 × 540
51/51 bestanden

G6 Phaser runtime, 844 × 390
51/51 bestanden

G1–G5 Regression, jeweils 960 × 540 und 844 × 390
G1 715/715 · G2 57/57 · G3 305/305 · G4 29/29 · G5 80/80
```

Der G6-Harness lädt echte Phaser-Szenen und spielt die sieben Encounter skriptgesteuert durch. Er prüft Warn- und Aktivphasen, Schaden, Einmal-Treffer, Knockback, exakte Pickup-Werte, einmalige Aufnahme, Foreman-Reihenfolge und -Callouts, eigenen Dampf-Knockdown sowie Cleanup bei Defeat, Restart, Section-Clear und Victory. Die Protokolle und Screenshots liegen in diesem Ordner.

## Offene manuelle Abnahme vor oder zu Beginn von G7

1. Zone 2 mit allen vier Spielern spielen und prüfen, ob Dampfellipse, Warnzeit und Knockback ohne Debug-UI verständlich und fair sind.
2. Prüfen, ob die Lunchbox nach Encounter 3 tatsächlich als Entlastung und Ressourcenentscheidung wahrgenommen wird; Werte erst in G8 final abstimmen.
3. Den Foreman mehrmals ohne absichtliches Test-Setup spielen: Mustererkennung, Charge-Reichweite, Steam-Backfire und Länge des Punish-Fensters bewerten.
4. Auf kleinem und breitem realen Landscape-Gerät prüfen, ob Ventil, Callouts, Boss-HUD und Touch-Steuerung gleichzeitig lesbar bleiben.
5. Einen vollständigen Run je Spielerfigur mit [Run-Messvorlage](../gameplay-run-template.md) protokollieren. G1–G6 bleiben bis dahin spielerisch noch nicht final abgenommen.

Browserautomation belegt Zustände, Verträge und Lifecycle. Sie ersetzt keine Balance-, Lesbarkeits- oder physische Geräteabnahme.
