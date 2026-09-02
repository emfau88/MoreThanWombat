# 25 — BULK 2 Box Profile Implementation

**Status:** abgeschlossen am 2026-09-02
**Ziel:** nachvollziehbare, datengetriebene Treffergeometrie für den polierten Combat-Vertical-Slice

## Ergebnis

BULK 2 ersetzt die bisherige Annahme „ein statisches Angriffsrechteck und eine unveränderte Körperbox“ durch eine gemeinsame Boxprofil-Schicht. Angriffe können jetzt mehrere aktive Zeitfenster und mehrere Boxen pro Fenster besitzen. Fighter wählen Hurtbox und Pushbox anhand ihres Zustands. Nahkampf, Projektile und Axe Rain verwenden denselben tatsächlichen Überlappungsmittelpunkt für den Kontakt.

Die Umstellung bleibt rückwärtskompatibel: Noch nicht einzeln kalibrierte Moves verwenden weiterhin ihre bisherige Hitbox als `main`-Profil. Dadurch kann das restliche Roster schrittweise authored werden, ohne einen riskanten Komplettumbau zu erzwingen.

## Implementierte Datenmodelle

### Fighter-Profile

Jede produktive Fighter-Definition besitzt Profile für:

- `standing`
- `moving`
- `attacking`
- `airborne`
- `hit`
- `knockdown`

Die geerdete Pushbox ist kleiner als die Hurtbox. In `airborne` und `knockdown` ist die Pushbox deaktiviert. `dead` verwendet bis zur Einführung eines echten Knockdown-States das Knockdown-Profil und besitzt keine Hurtbox.

### Angriffsprofile

Ein `AttackHitboxProfile` beschreibt:

- halboffene Zeitfenster `[startMs, endMs)` innerhalb der Active-Phase
- eine oder mehrere lokale Boxen pro Fenster
- explizite Lane-Toleranz
- explizite Höhen-/Z-Toleranz

Die Validierung verlangt lückenlose, nicht überlappende Fenster über die komplette Active-Phase und positive Boxgrößen.

## Authoring-Vertical-Slice

| Move | Active-Profile | Ergebnis |
|---|---|---|
| Wombat Jab | Early 0–24 ms, Main 24–60 ms, Late 60–80 ms | kurze Anlaufbox, größte Reichweite im Kontaktframe, wieder kleinere Late-Box |
| Wombat Belly Slam | Early 0–35 ms, Main 35–105 ms, Late 105–140 ms | Heavy-Body-Hit mit klar lesbarem Reichweitenmaximum in der Main-Phase |
| Air Bonk | Main 0–120 ms | explizite Lane-/Höhentoleranz; Wombat visuell im Combat Gym geprüft |
| Budget Axe Rain | datengetriebener Area Hit | Warnellipse entspricht 96 px Breite und 36 px Lane-Fußabdruck der Schadenszone |

Alle übrigen Nahkampfmoves laufen über den kompatiblen `main`-Fallback. Deren individuelle Early-/Main-/Late-Kalibrierung ist Content-Authoring auf der neuen Grundlage und kein weiterer Architekturblocker.

## Kontakt- und Faction-Regeln

- Der Kontaktpunkt ist der Mittelpunkt der tatsächlichen Schnittfläche von Hitbox und Hurtbox.
- Ein Ziel kann pro Attack-Instanz weiterhin nur einmal getroffen werden.
- `player`, `enemy` und `neutral` sind explizite Combat-Factions.
- Gleichartige Factions verursachen keinen Schaden untereinander.
- Projektile speichern die Faction ihres Owners; Homing ignoriert verbündete Ziele.
- Axe Rain beachtet dieselben Faction-, Lane-, Höhen- und Kontaktregeln.

## Crowd- und Pushbox-Verhalten

Pushbox-Auflösung läuft jetzt über alle ungeordneten Fighter-Paare im aktuellen Kampf. Damit trennen sich in Waves nicht nur Player und Enemy, sondern auch Gegner untereinander. Airborne- und Knockdown-Fighter blockieren den Bodenraum nicht.

## Combat-Gym-Diagnostik

Die Telemetrie zeigt jetzt zusätzlich:

- aktives Hitboxprofil (`early`, `main`, `late` oder `none`)
- aktives Hurtboxprofil
- Kontaktmarker am berechneten Überlappungsmittelpunkt
- mehrere aktive Hitboxen, falls ein späterer Move sie authored

Visuell abgenommen wurden:

- Wombat Jab bei 0,25× und per 60-Hz-Einzelschritt in Early/Main/Late
- Wombat Belly Slam per Einzelschritt in Early/Main/Late
- Air Bonk mit `airborne`-Hurtbox und deaktivierter Pushbox
- Nahkontakt-Hit mit genau einmaligem Schaden und Hitstop
- Jab-Whiff auf größerer Distanz
- Discount Fireball bei 150 px Distanz und 0,25×

## Technische Prüfungen

Folgende Gates bestehen am Abschlussstand:

```text
npm.cmd run typecheck
npm.cmd test          # 23/23 Tests
npm.cmd run build
```

Neue Regressionstests decken ab:

- exakte Early-/Main-/Late-Grenzen
- lückenlose Profilabdeckung
- Fighter-State-zu-Boxprofil-Zuordnung
- Faction/Friendly-Fire-Regeln
- gemeinsamen Überlappungsmittelpunkt
- Lane- und Höhen-Toleranzen
- Axe-Rain-Warnflächenabgleich

## Bewusste Grenzen

- Ein eigener `knockdown`-Combat-State wird erst mit den defensiven States eingeführt; das Profil und das Nullbox-Verhalten sind bereits vorbereitet.
- Nicht jeder bestehende Move benötigt drei Phasen. Weitere Profile werden nur dort authored, wo Animation oder Spielentscheidung dadurch klarer werden.
- Die individuelle Air-Bonk-Kalibrierung für jede weitere Silhouette erfolgt bei der jeweiligen Move-/Animationsabnahme. Die technische Möglichkeit und die Wombat-Referenz sind vorhanden.
- Die Kontaktmarkierung bleibt Diagnose. Der zentrale Spark-/Audio-/Haptik-/Impact-Pfad wurde anschließend in BULK 3 umgesetzt; die finale gezeichnete Effektbibliothek gehört zu BULK 4.

## Nächster aktiver Block

BULK 3 ist abgeschlossen; Details stehen in `26_BULK_3_HIT_CONFIRM_IMPLEMENTATION.md`. Aktiver nächster Block ist BULK 4, das die finale VFX-Sprache auf dem bestehenden Hit-Confirm-Event aufbaut.
