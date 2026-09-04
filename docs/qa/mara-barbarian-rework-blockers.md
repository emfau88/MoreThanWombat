# Mara und Budget Barbarian — Rework-Blocker

**Stand:** 2026-09-04. Beide Figuren sind aus normalen Spielmodi und Waves entfernt. Sie bleiben ausschließlich im Combat Gym, damit ihre Moves und Boxen diagnostizierbar bleiben, ohne sie als Release-Content auszugeben.

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

## Nächste Produktion

Zuerst Mara als kleine, klar lesbare Comic-Silhouette mit sauberer Bodenkontaktfolge neu erstellen und freigeben. Erst danach denselben Prozess für den Barbarian anwenden. Moves, Hit-/Hurt-/Pushboxen und universelle VFX können bestehen bleiben, werden aber erst nach der neuen Sichtprüfung feinjustiert.
