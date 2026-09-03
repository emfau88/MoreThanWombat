# Presentation-Event-Map

**Stand:** 2026-09-03. Diese Map bereitet Audio und UX vor, ohne konkrete Sounds oder Stilentscheidungen festzulegen. Bestehende Treffer-SFX bleiben unverändert.

| Ereignisfamilie | Auslöser im Spiel | Spätere Ausgabe | Qualitätsregel |
| --- | --- | --- | --- |
| Bewegung | Start/Stop, Schrittzyklus | kurze Schritte je Charakterklasse | leiser als Treffer, keine Wiedergabe pro Frame |
| Vertikal | Sprung, Landung, harter Ground-Impact | Luftzug, Landung, Staub | Landung muss ohne VFX lesbar bleiben |
| Angriff | Startup, Whiff, Block, Hit, Armor, Phase | Bewegungs- und Kontakt-SFX | bestehender `CombatImpact` bleibt zentrale Hit-Quelle |
| Magie | Cast, Projektilflug, Teleport, Telegraphie | Cast-/Loop-/Warnfamilie | Telegraphie hat Vorrang vor Atmosphärenklang |
| Wave | Clear, Travel, Eintritt, Victory/Defeat | kurzer Übergangs- und Ergebnisakzent | nie während aktivem Treffer-Hitstop starten |
| UI | Menü, Auswahl, Start, Pause/Restart | dezente bestätigende UI-Sounds | kein UI-Sound darf Kampf-Hinweise überdecken |

## Reihenfolge der Umsetzung

1. Lautheitsbudget und SFX-Toggle festlegen.
2. Wave-Travel/Entry und UI als kleine, klar getrennte Events anbinden.
3. Bewegungs- und Landungsfamilien ergänzen.
4. Magie- und Stage-Ambience erst nach manueller Stilfreigabe.
