# Mara und Budget Barbarian — Rework-Blocker

**Statusabgleich:** 2026-09-05. Dieses Dokument bewahrt den historischen Rework-Befund vom 2026-09-04. Mara und Budget Barbarian stehen inzwischen wieder im normalen Spieler-Roster; `src/game/data/roster.ts` führt keine Rework-Figuren mehr. Die normale Wave-Gegnerbesetzung besteht weiterhin aus Pigeon und Wizard. Die frühere Aussage, beide Figuren seien ausschließlich im Gym verfügbar, ist überholt.

Die [G0-Baseline](gameplay-baseline-2026-09-05/README.md) bestätigt Codezustand und technische Asset-Gates. Sie stellt keine neue manuelle Art- oder Gerätefreigabe aus; vollständige aktuelle Run-/Touch-Abnahmen bleiben offen. Die folgenden Befunde und Gates gelten als Rework-Historie und Qualitätsreferenz, nicht als Auftrag für eine erneute Figurenproduktion während G0–G9.

## Sichtbarer Befund

| Figur | Blocker | Konsequenz |
|---|---|---|
| Mara Breach | helle Matte-/Fragmentpixel an der Silhouette, unscharfe heruntergerechnete Quellillustration, Walk ohne glaubwürdigen Fußkontakt | neue Produktionsquelle; keine Reparatur durch Frame-Offsets |
| Budget Barbarian | unvollständige/uneinheitliche Füße und Axe-Silhouette; der bisherige Walk wiederholt Quellframes statt eines echten Schritts | neuer Walk mit echten Kontakt-, Passing- und Down-Posen |

Die frühere Character-Asset-QA hat nur technische Positionen, Randbeschnitt und grobe Palette gemessen. Ihre bisherigen `PASS`-Werte sind **keine** visuelle Freigabe für diese beiden Figuren.

## Verbindliche Rework-Gates

1. **Alpha zuerst:** jede Quellpose als echte RGBA-Datei. Auf Weiß, Schwarz und Mittelgrau prüfen; keine helle/gefärbte Matte, keine Checkerboard- oder Hintergrundpixel.
2. **Native Raster:** keine nachträgliche bilineare Verkleinerung aus einer diffusen Illustration. Die freigegebene Linie und Farbpalette werden direkt im 160×160-Raster produziert.
3. **Echter Walk:** mindestens vier verschiedene, einzeln benannte Phasen: linker Kontakt, Passing, rechter Kontakt, Passing. Beide Füße sind in jeder Phase vollständig, die Standfüße teilen eine Bodenlinie.
4. **Bild-für-Bild-Abnahme:** Preview-Strip und 4-fps-GIF auf neutralem Hintergrund prüfen. Ein automatischer Root-/Fußdrift-Wert ergänzt diese Sichtprüfung, ersetzt sie aber nie.
5. **Spiel-Abnahme:** je 60 Sekunden Duel, Combat Gym und Wave auf 16:9 und breitem Landscape; erst dann Rückkehr in Character Select und Wave-Daten.

## Historisch geplante Produktion

Zuerst Mara als kleine, klar lesbare Comic-Silhouette mit sauberer Bodenkontaktfolge neu erstellen und freigeben. Erst danach denselben Prozess für den Barbarian anwenden. Moves, Hit-/Hurt-/Pushboxen und universelle VFX können bestehen bleiben, werden aber erst nach der neuen Sichtprüfung feinjustiert.
