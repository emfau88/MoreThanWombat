# Vertical-Slice Release- und Gerätecheck

Diese Checkliste trennt reproduzierbare lokale Gates von echter Geräteabnahme. Ein Punkt gilt erst als bestanden, wenn Build-Commit, Gerät und Ergebnis dokumentiert sind.

## Lokales Gate (bei jedem Release)

- [ ] `npm.cmd run typecheck` grün (für den Release-Commit erneut ausführen)
- [ ] `npm.cmd test` grün (für den Release-Commit erneut ausführen)
- [ ] `npm.cmd run build` grün (für den Release-Commit erneut ausführen)
- [ ] Laufende Duel-, Gym- und Wave-Session bei Landscape-Resize/Rotation prüfen: HUD, Kamera, Arena, Controls und Fighter bleiben im sichtbaren Raum
- [ ] Main Menu → Character Select → Duel → Menu ohne Konsolenfehler
- [ ] Combat Gym: Park, Rooftop und Scrapyard; Pause, Frame Step, Boxes und VFX-Qualität prüfen
- [ ] Waves: `Junkyard Run` Entry, Crusher Lane und Wizard Pit; Boden, Kamera, HUD und Wave-Übergang prüfen
- [ ] Full/Reduced/Minimal VFX, Reduce Flash sowie Shake Full/Reduced/Off mindestens einmal auslösen

## GitHub Pages Gate

- [x] Pages-Workflow des getesteten Commits erfolgreich (`a35d541`, Run 33797668796)
- [ ] [Live-Build](https://emfau88.github.io/MoreThanWombat/) öffnet ohne fehlende Assets
- [ ] Main Menu, Character Select, Duel, Combat Gym und Waves öffnen jeweils ohne Browser-Konsolenfehler
- [ ] Direkter Reload auf der Pages-URL bleibt funktionsfähig

## Echtes Mobilgerät — kleinste Zielklasse

- [ ] Gerät/Browser/OS und getesteten Commit eintragen
- [ ] Erster Touch nach Matchstart bewegt die Figur sofort
- [ ] Joystick, ATK, SP, JMP, ULT und MENU liegen in Daumenreichweite und lösen nur die erwartete Aktion aus
- [ ] Park und `Junkyard Run` bei Full/Reduced/Minimal VFX jeweils 60 Sekunden testen
- [ ] Keine sichtbaren Framedrops, Audio-Doppeltrigger, überdeckten Fighter oder unlesbaren HUD-Elemente
- [ ] Hochformat, Querformat sowie Browser-Safe-Areas prüfen, sofern unterstützt

## Ergebnisprotokoll

| Datum | Commit | Umgebung/Gerät | Gate | Ergebnis | Befund / Follow-up |
|---|---|---|---|---|---|
| 2026-09-03 | `a35d541` | Lokal, Chromium | Local Gate | bestanden | Typecheck, 42 Tests, Production Build und Wave-Sichtprüfung grün. |
| 2026-09-04 | ausstehend | Lokal, Codex Chromium | Preflight | bestanden | Typecheck, 54 Tests, Production Build, Asset- und VFX-QA grün. Main Menu, laufendes Duel, Combat Gym und Waves bei zwei Landscape-Größen ohne Konsolenfehler geprüft; Zielgeräteabnahme bleibt offen. |
