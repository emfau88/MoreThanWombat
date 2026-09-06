# Vertical-Slice Release- und Gerätecheck

Diese Checkliste trennt reproduzierbare lokale Gates von echter Geräteabnahme. Ein Punkt gilt erst als bestanden, wenn Build-Commit, Gerät und Ergebnis dokumentiert sind.

**Status 2026-09-05:** [G0-Baseline](gameplay-baseline-2026-09-05/README.md) mit 55 Tests und technischen Prüfprotokollen abgeschlossen. Die folgenden Release-Checkboxen bleiben für den tatsächlich auszuliefernden Commit offen. Historische Browser- und Workflow-Ergebnisse werden nicht auf den aktuellen Build übertragen. Vollständige Runs nach [Messvorlage](gameplay-run-template.md) protokollieren.

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

Diese Liste getrennt für mindestens zwei reale Landscape-Geräteklassen ausfüllen: kleinste Zielklasse und zweite/breitere Zielklasse. Emulation zählt nicht als Realgerät.

- [ ] Gerät/Browser/OS und getesteten Commit eintragen
- [ ] Erster Touch nach Matchstart bewegt die Figur sofort
- [ ] Joystick, ATK, SP, JMP, ULT und MENU liegen in Daumenreichweite und lösen nur die erwartete Aktion aus
- [ ] Park und `Junkyard Run` bei Full/Reduced/Minimal VFX jeweils 60 Sekunden testen
- [ ] Keine sichtbaren Framedrops, Audio-Doppeltrigger, überdeckten Fighter oder unlesbaren HUD-Elemente
- [ ] Hochformat, Querformat sowie Browser-Safe-Areas prüfen, sofern unterstützt
- [ ] Vollständiger `Junkyard Run` mit Wombat, Wizard, Barbarian und Mara; je Versuch ein Messprotokoll
- [ ] Frametimes im dichtesten Encounter und später beim Midboss/Boss mit Messmethode dokumentieren

## Ergebnisprotokoll

| Datum | Commit | Umgebung/Gerät | Gate | Ergebnis | Befund / Follow-up |
|---|---|---|---|---|---|
| 2026-09-05 | `d676906` + G0-Dokumentation | Lokal, Windows / Node 22.17.1 | G0 technische Baseline | bestanden | Typecheck, 55/55 Tests, Build, Character-QA 6/6 und VFX-QA 6/6 + 5/5 + 4/4; Logs verlinkt. Keine neue Browser-, Spielgefühl-, Pages- oder Realgeräteabnahme. |
| 2026-09-03 | `a35d541` | Lokal, Chromium | Local Gate | bestanden | Typecheck, 42 Tests, Production Build und Wave-Sichtprüfung grün. |
| 2026-09-04 | ausstehend | Lokal, Codex Chromium | Preflight | bestanden | Typecheck, 54 Tests, Production Build, Asset- und VFX-QA grün. Main Menu, laufendes Duel, Combat Gym und Waves bei zwei Landscape-Größen ohne Konsolenfehler geprüft; Zielgeräteabnahme bleibt offen. |
