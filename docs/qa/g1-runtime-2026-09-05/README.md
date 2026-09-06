# G1 – Encounter Director: Implementierung und technische Prüfung

Stand: 2026-09-05. Basis: `d676906`; Änderungen dieses Arbeitsstands. Der [G0-Snapshot](../gameplay-baseline-2026-09-05/README.md) bleibt historische Baseline.

## Ergebnis und Umfang

G1 ist implementiert und technisch geprüft. Die manuelle Spielgefühlabnahme bleibt offen; G2 wird dadurch noch nicht freigegeben. Der Gesamtplan ist ausdrücklich noch nicht abgeschlossen: weiterhin drei Gruppen mit 1/2/2 Gegnern, keine sieben Encounters, neuen Rollen oder Bosse.

- Pure `EncounterDirector`-State-Machine: Intro → sichtbare Entry-Phase → Active → Clear Delay → Travel → Transition → nächster Abschnitt bzw. Victory; Defeat hat Vorrang, auch bei gleichzeitigem Tod.
- Zone 1: M1/R0/D0; Zone 2: M1/R1/D0; Zone 3: M1/R1/D0 mit 1,8 Sekunden Doppelangriffsfenster je 5 Sekunden. Neue Angriffe starten mindestens 300 ms versetzt. Bereits laufende Angriffe dürfen ihr Fenster beenden; außerhalb des Burst-Fensters wird bei einem belegten Token kein weiterer Angriff zugesagt.
- AI fragt Tokens erst bei einem tatsächlich startbaren, sichtbaren Angriff an. Wartende Gegner bewegen sich zur Lane und aus direkter Nähe. Tokens bleiben während Startup/Active sowie solange zugehörige Projektile gefährlich sind belegt; Recovery/Whiff, Interrupt, Abbruch, Tod und Neustart geben sie frei.
- Sichtbare, getrennte Spawns mit mindestens 112 Abstand; kein unsicherer Fallback. Gegner sind während Entry geschützt und können erst in Active angreifen. Bestehende Angriffshinweise bleiben erhalten.
- Offscreen-Angriffe werden unterbunden; gegnerische Projektile werden beim Verlassen des sichtbaren horizontalen Bereichs entfernt. Clear, Travel, Defeat und Victory räumen Projektile und temporäre Effekte auf.
- Mana nur während aktiver Wave-Simulation; kein Auffüllen durch Intro, Entry, Clear Delay, Travel, Transition oder Ergebnis. Combat-Rate und Kosten unverändert. Gym-Pause und Duel sind regressionsgeprüft.
- Debug-Anzeige enthält Abschnitt, Phase und belegte M/R/D-Budgets.

## Nachweise

| Prüfung | Ergebnis |
|---|---|
| Typecheck | PASS – [Log](typecheck.log) |
| Unit-Tests einschließlich mobiler Touch-Geometrie | 66/66 PASS – [Log](tests.log) |
| Production Build | PASS – [Log](build.log); bestehender Hinweis auf großes Bundle bleibt |
| Phaser-Browserdiagnostik | 235 Assertions pro Lauf; [844×390](runtime-844x390.log), [960×540](runtime-960x540.log), [932×360](runtime-932x360.log) |
| Querformat, Rotation und echte Touch-Ereignisse | [Mobiler Prüfbericht](../mobile-2026-09-05/README.md) |

Der Harness lädt echte Assets und echte Phaser-Szenen. Er durchläuft mit allen vier normalen Spielerfiguren die drei Abschnitte, prüft tatsächliche Spawnpositionen gegen die Kamera, Mana während mehrsekündigem Travel-Warten, Projektil-Cleanup, Interrupt, Defeat, simultanen Tod, Restart sowie Duel und Gym-Pause. Gegner werden für die Lifecycle-Prüfung gezielt besiegt: Das ist kein Balance- oder manuell gespielter Run.

Browserprüfung: isoliertes Headless Edge mit Touch-/Viewport-Emulation, Windows, Node 22.17.1. Der integrierte Browser konnte wegen eines Verbindungsfehlers nicht gestartet werden; der eigenständige Testbrowser verwendet ein frisches temporäres Profil. Keine ungefangenen Fehler, Console-Errors oder HTTP-Fehler im erfolgreichen Lauf. Keine Aussage über reale GPU-Frametimes oder native Safari-/Android-Eigenheiten.

## Reproduktion

```powershell
npm.cmd run dev -- --port 4189 --strictPort
# In einem zweiten Terminal:
node scripts/check-browser-runtime.mjs
$env:QA_WIDTH='960'; $env:QA_HEIGHT='540'
node scripts/check-browser-runtime.mjs
```

Optional `BROWSER_EXECUTABLE` auf ein anderes Chromium-Binary setzen. URL und Ausgabeordner sind die ersten beiden Scriptargumente. Der Browser-Testharness liegt unter `/MoreThanWombat/tests/browser/g1.html` und gehört nicht zum Production-Bundle.

## Noch offene G1-Abnahme

- Repositionierung bei zwei Gegnern wirkt beschäftigt und nachvollziehbar.
- Zone-2-Mischdruck und Zone-3-Fenster sind im tatsächlichen Kampf lesbar; Trefferursache, Richtung und Timing bleiben verständlich.
- Dies auf Keyboard und Touch mit der [Run-Messvorlage](../gameplay-run-template.md) protokollieren. Erst danach G2-Rollenprototypen beginnen.
- Vollständige Balance, reale Geräteklassen und Release-Abnahme bleiben G8/G11-Arbeit. Die technischen Nachweise ersetzen diese Gates nicht.
