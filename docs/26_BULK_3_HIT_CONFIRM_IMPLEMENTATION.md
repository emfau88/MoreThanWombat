# 26 — BULK 3 Hit Confirm and Impact Orchestration

**Status:** abgeschlossen und visuell abgenommen am 2026-09-02

**Aktueller Kontext — 2026-09-05:** Historische Implementierungsdokumentation. Die Testzahl und der „nächste Schritt“ weiter unten sind zeitgebunden; aktuelle Gameplay-Prioritäten stehen in `31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md`, aktuelle technische Gates in `qa/gameplay-baseline-2026-09-05/README.md`.

## Ziel

BULK 3 bündelt jeden bestätigten Kontakt in einem deterministischen Impact-Pfad. Schaden beziehungsweise Armor-Reaktion, Hitstop, kurzer Defender-Flash, Camera Shake, Kontakt-VFX, SFX, optionale Haptik und Combat-Gym-Telemetrie sollen vom selben aufgelösten Kontakt ausgehen.

## Ergebnis

`CombatImpactOrchestrator` ist jetzt der einzige Präsentationspfad für bestätigte Nahkampf-, Projektil- und Axe-Rain-Kontakte. Ein `CombatImpact` transportiert Outcome, Schaden, Attack-ID, Timeline, Kontaktpunkt, Angreifer und Verteidiger. Daraus werden deterministisch Defender-Flash, Spark, SFX, Haptik, Hitstop und Shakeprofil abgeleitet.

Whiffs gelangen nicht in diesen Pfad. Bei mehreren Treffern im selben Simulationsframe erhält jedes Ziel Flash und Spark, aber nur das stärkste Ereignis steuert globalen Hitstop, Camera Shake, SFX und Haptik. Dadurch stapeln sich Crowd-Sounds und Vibrationen nicht unkontrolliert.

## Produktionsprofile

| Profil | Hitstop | Flash | Shake | Spark-Skalierung | SFX-Lautstärke | Haptik |
|---|---:|---:|---:|---:|---:|---:|
| Light | 45 ms | 42 ms | 48 ms / 0,0028 | 0,72 | 0,36 | 8 ms |
| Medium | 65 ms | 50 ms | 68 ms / 0,0040 | 0,94 | 0,44 | 12 ms |
| Heavy | 90 ms | 58 ms | 88 ms / 0,0058 | 1,18 | 0,54 | 18 ms |
| Ultimate | 110 ms | 64 ms | 120 ms / 0,0075 | 1,48 | 0,62 | 26 ms |

Ein Move kann Hitstop, Shake, Flash, Spark-Art, Sound, Lautstärke und Haptik über seine Timeline überschreiben. Discount-Wizard-Kontakte verwenden unabhängig von ihrer Stärkeklasse die magische Spark-/Sound-Sprache. Earthshaker besitzt jetzt einen bewusst schweren 105-ms-Hitstop statt des alten 24-ms-Sonderwerts.

## Outcome-Profile

| Outcome | Schaden | Hitstun/Knockback | Feedback |
|---|---:|---|---|
| `hit` | vollständig | ja | Stärkeklasse des Moves |
| `blocked` | 0 | nein | 28-ms-Hitstop, Cyan-Flash, Block-Spark und Metall-Klick |
| `armored` | vollständig | nein | 40-ms-Hitstop, Orange-Flash, Armor-Spark und Metall-Impact |
| `invulnerable` | 0 | nein | kein Hitstop/Shake, kurzer Eisblau-Flash und leichter No-Sell-Klang |
| `miss` | 0 | nein | kein Spark, kein Impact-Sound, keine Haptik |

Armor ist im Combat Gym als eigener Dummy-Modus verfügbar. Es bildet ein echtes No-Sell ab: Schaden wird angewendet, der aktuelle State beziehungsweise Angriff des Verteidigers wird aber nicht durch Hitstun oder Knockback unterbrochen.

## Flash- und Farbkorrektur

- Der feste 110-ms-Trefferflash wurde entfernt.
- Flashes dauern profilabhängig 34–64 ms Simulationszeit.
- Die Flash-Uhr läuft auch während Hitstop weiter, bleibt aber bei manuell pausiertem Combat Gym stehen.
- Hitstun und Air Attack färben die Figur nicht mehr für den gesamten State um.
- Nach dem kurzen Impact kehrt die Sprite-Palette vollständig zum Character-Sheet zurück.

## Input Buffer und Hitstop

Der Produktionsbuffer bleibt 150 ms lang. Seine Lebenszeit altert während globalem Hitstop nicht mehr. Ein während der Freeze-Frames gedrückter Button steht nach dem Hitstop deshalb mit seinem vollständigen Restfenster zur Verfügung. Hitstop wird auf volle 60-Hz-Simulationsschritte aufgerundet, statt im letzten Freeze-Frame bereits wieder Simulation durchzulassen.

## Kontakt-VFX

Eine kleine code-native Spark-Grundbibliothek unterscheidet:

- physischen Kontakt
- magischen Kontakt
- Block
- Armor
- Invulnerable/No-Sell

Stärkere Profile besitzen mehr Strahlen und größere Ringe, ohne die Gegnerpose lange zu verdecken. Vorhandene charakterbezogene Wizard-/Earthshaker-Effekte bleiben zusätzliche Layer; der generische Kontakt-Spark sitzt immer am tatsächlichen Überlappungspunkt aus BULK 2. Der vollständige Art-/Pooling-Ausbau bleibt BULK 4.

Die generischen Sparks werden mit der Combat-Clock statt mit frei laufenden Scene-Tweens fortgeschrieben. Sie bleiben bei Combat-Gym-Pause stehen und lassen sich deshalb reproduzierbar per Frame Step prüfen, laufen während regulärem Hitstop aber kontrolliert weiter.

## Audio und Haptik

Acht kurze Impact-Sounds aus dem bereits im Repository liegenden Kenney-Impact-Sounds-Paket sind geladen: Light, Medium, Heavy, Ultimate, Magic, Block, Armor und Invulnerable. Die mitgelieferte `public/kenney_impact-sounds/License.txt` dokumentiert die CC0-Lizenz. Audio wird nur bei echtem Kontakt und nur einmal für das stärkste Ereignis des Frames abgespielt.

Optionale Browser-Haptik verwendet `navigator.vibrate`, sofern verfügbar. Sie folgt demselben stärksten Profil und wird durch die Shake-Zugänglichkeit mit reduziert beziehungsweise deaktiviert.

## Shake-Zugänglichkeit

Der Combat Gym besitzt jetzt `Shake full`, `Shake reduced` und `Shake off` sowie den Shortcut `G`. Die Einstellung gilt für Kontakt-Shakes und für move-spezifische Start-/Ground-Cues. Bei `off` bleiben Spark, kurzer Flash, Hitstop und SFX erhalten, damit Kontakte weiterhin ohne Kamerabewegung lesbar sind.

## Combat-Gym-Telemetrie und visuelle Abnahme

Die zweite Telemetriezeile zeigt Outcome, Feedbackklasse, Spark-Art und SFX-Profil. Framegenau geprüft wurden:

- Wombat Jab als Light-Hit mit 45-ms-Hitstop
- Wombat Belly Slam als Heavy-Hit mit 90-ms-Hitstop
- Block mit 0 Schaden und 28-ms-Hitstop
- Armor mit Schaden, ohne Hitstun und mit 40-ms-Hitstop
- Invulnerable ohne Schaden und ohne Hitstop
- Discount Wizard Wand Smack als magischer Light-Kontakt
- Whiff bei 92 px ohne Impact-Telemetrie, Spark oder Schaden
- Shake-Zyklus `full -> reduced -> off`

Im Browser traten keine Runtime- oder Audio-Ladefehler auf.

## Abschluss-Gates

- Input-Taps überstehen Hitstop
- Whiffs erzeugen weder Impact-Spark noch Impact-Sound
- Light, Heavy, Block, Armor und Invulnerable sind ohne Schadenszahl unterscheidbar
- der Defender-Flash dauert je nach Profil 40–70 ms Simulationszeit und ist nicht an die gesamte Hitstun-Dauer gekoppelt
- Shake kann reduziert oder deaktiviert werden; Spark, Flash und SFX bleiben lesbar
- Typecheck, Tests und Produktionsbuild bestehen

Abschlussstand:

```text
npm.cmd run typecheck  # bestanden
npm.cmd test           # 31/31 Tests bestanden
npm.cmd run build      # bestanden
```

## Bewusste Grenzen und nächster Block

- Die Sparks sind eine performante Systemreferenz, noch keine finale gezeichnete VFX-Bibliothek.
- Sound-Mix, Random-Varianten, globale Lautstärkeregler und Musik gehören in den Audio-/Polish-Ausbau.
- Haptik bleibt Browser-/Geräte-abhängig und muss auf echten Zielgeräten geprüft werden.
- Parry, Guard Break und echte defensive Player-Aktionen sind nicht Teil dieses Blocks.

Aktiver nächster Schritt ist BULK 4: die einheitliche gezeichnete VFX-Sprache auf dem jetzt zentralen Impact-Event ausbauen, ohne den Trefferkern erneut umzubauen.
