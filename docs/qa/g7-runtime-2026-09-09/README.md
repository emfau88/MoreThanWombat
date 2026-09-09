# G7 – Zweiphasiger Junkyard-Endboss: technische Prüfung

**Stand:** 2026-09-09<br>
**Ergebnis:** Implementiert und technisch geprüft. Manuelle Lernkurven-, Balance- und Realgeräte-Abnahme bleibt offen.

## Gelieferter Boss-Vertrag

- Encounter 7 ist jetzt ein `defeat_priority`-Finale gegen den **Overtime Supervisor** mit eigenem `junkyard_boss`-AI-Profil und phasenabhängigem Boss-HUD.
- **Mandatory Timecard Swipe** ist der schnelle Nahkampftest mit 170 ms Startup, sichtbarem `TIMECARD!`-Hinweis und 520 ms punishbarer Recovery.
- **Mandatory Overtime Lockdown** kommandiert zwei vorhandene Dampfventil-Interaktionen. Phase 1 sperrt abwechselnd eine Außenlane; Phase 2 warnt mit `FULL LOCKDOWN!` und sperrt beide Außenlanes, sodass die sichere Mitte zur erlernten Antwort wird.
- **Shift Change** ist eine sichtbare Repositionierung über X- und Lane-Achse. Phase 1 setzt sie ans Musterende, Phase 2 beginnt damit und ändert damit die Entscheidungsreihenfolge statt nur Tempo oder Schaden.
- Bei 50 % HP beginnt die 1050 ms lange, geschützte Phase-2-Transition `OVERTIME!`; HUD und Modustext wechseln sofort auf `PHASE 2/2`.
- Ein verzögert eintretender Pigeon-Add teilt sich den einzigen Melee-Token mit dem Boss. Der Boss-Lockdown nutzt den getrennten Disruption-Token; beide laufen ausschließlich über den Encounter Director.
- Der Boss kann nicht von seinen eigenen Ventilen getroffen werden. Spieler und Add bleiben der vollständig telegraphierten Gefahr ausgesetzt.
- Der Tod des Prioritätsziels entfernt den überlebenden Add, seine Projektile, Stage-Interaktionen und transiente VFX sofort und kontrolliert.

## Automatische Nachweise

```text
npm.cmd test
96/96 bestanden

npm.cmd run typecheck
bestanden

npm.cmd run build
bestanden

G7 Phaser runtime, 960 × 540
63/63 bestanden

G7 Phaser runtime, 844 × 390
63/63 bestanden

G1–G6 Regression, jeweils 960 × 540 und 844 × 390
G1 679/679 · G2 57/57 · G3 280/280 · G4 29/29 · G5 80/80 · G6 51/51
```

Der G7-Harness lädt echte Phaser-Szenen, durchläuft den vollständigen Run und prüft Bossdaten, Phase-1- und Phase-2-Muster, Telegraphen, Lane-Safe-Spaces, phasenabhängiges HUD, den gemeinsamen Director-Token, Boss-Immunität gegen eigene Ventile, `defeat_priority`-Cleanup, Victory und einen vollständigen Restart bis zum frischen Boss. Protokolle und Screenshots liegen in diesem Ordner.

## Offene manuelle Abnahme vor oder zu Beginn von G8

1. Den Boss mit allen vier Spielern mehrmals ohne Debug-Hilfe spielen: Timecard-Recovery, Lane-Lock-Antwort und Shift-Change-Muster müssen nach wenigen Versuchen lernbar sein.
2. Prüfen, ob die sichere Lane in Phase 1 und die sichere Mitte in Phase 2 bei realem Kampf- und Touchdruck erkennbar bleiben.
3. Boss und Add auf kleinem und breitem realen Landscape-Gerät prüfen; es darf trotz zweier Druckkanäle keine unlösbare Kombination entstehen.
4. Übergang bei 50 % HP, Boss-HUD, Ventilwarnungen und Cleanup des überlebenden Adds visuell bewerten.
5. Vollständige Runs je Spielerfigur mit der [Run-Messvorlage](../gameplay-run-template.md) protokollieren; diese Daten sind die Grundlage für G8.

Browserautomation belegt Zustände, Verträge und Lifecycle. Sie ersetzt keine Lernkurven-, Balance-, Lesbarkeits- oder physische Geräteabnahme.
