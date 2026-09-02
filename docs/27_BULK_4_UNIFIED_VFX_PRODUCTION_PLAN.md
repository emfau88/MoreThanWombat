# 27 — BULK 4: Einheitliche, universelle VFX-Sprache

**Status:** geplant, noch nicht implementiert

**Planungsstand:** 2026-09-02

**Abhängigkeit:** BULK 3 ist abgeschlossen; `CombatImpact` bleibt die verbindliche Quelle für bestätigte Kontakte.

**Arbeitsname der Stilrichtung:** **Punchy Comic Impact**

## 1. Ziel und Entscheidung

BULK 4 ersetzt die provisorischen code-nativen Sparks und die stilistisch uneinheitlichen Spezialeffekte durch eine wiederverwendbare, transparente und mobile-taugliche VFX-Bibliothek.

Die Stilrichtung übernimmt von **Little Fighter 2** nicht dessen konkrete Pixel, Assets oder exakte Gestaltung, sondern die für dieses Projekt passenden Prinzipien:

- Effekte sind im Kampfgewühl sofort lesbar.
- Ein Treffer wird mit wenigen, klaren Frames erzählt.
- Physische und elementare Angriffe unterscheiden sich über Form und Farbe.
- Die Figur bleibt wichtiger als der Effekt.
- Große Specials dürfen spektakulär sein, behalten aber eine klare Silhouette und kurze Kernphase.

Diese Prinzipien werden in die bereits vorhandene hochauflösende Comicoptik von More Than Wombat übersetzt: handgezeichnet wirkende Konturen, kräftige Keil- und Sternformen, kontrollierte Flächenfarben und kurze Bewegungsakzente statt Pixel-Art-Imitation, weicher Stock-Glow-Optik oder halbrealistischer Bodenmalerei.

**Verbindliche Entscheidung:** Bevor die komplette Bibliothek produziert wird, müssen drei kleine Referenzeffekte als Style Lock im laufenden Spiel freigegeben werden:

1. physischer Light Hit,
2. magischer Wizard Hit,
3. neutraler Ground Impact für Air Bonk/Earthshaker.

Ohne diese Abnahme werden keine weiteren Serien-Sheets erzeugt.

## 2. Nicht verhandelbare Asset-Regeln

### 2.1 Transparenz und Wiederverwendbarkeit

- Jedes Runtime-VFX-Asset besitzt echte RGBA-Transparenz.
- In keinem Effekt dürfen Arena, Himmel, Gras, Erde, Asphalt, Wand, UI oder eine feste Hintergrundfarbe eingebrannt sein.
- Ein Ground Impact darf abstrakte Risse, Staub, Linien, Steine und einen Shock Ring enthalten, aber **keine gemalte Bodenplatte**.
- Body-Sprites, Weapon-Sprites, Contact-FX und World-/Ground-FX bleiben getrennte Layer.
- Chroma-Key-Quellen dürfen nur in einem klar benannten Source-Verzeichnis liegen; Runtime-Dateien müssen alpha-clean sein.
- Ein Effekt muss ohne sichtbaren rechteckigen Rand auf Park, Scrapyard und Rooftop funktionieren.
- Wiederverwendbare Grundeffekte dürfen keine Figur, Attacke oder Arena im Bild enthalten.
- Attacken kombinieren universelle Primitive über Rezepte. Nur echte Signature-Layer bleiben charakterspezifisch.

### 2.2 Was „universell“ hier bedeutet

Die Bibliothek besteht aus kleinen Bausteinen:

- `core`: kurzer heller Trefferkern,
- `burst`: Stern-/Keilform,
- `rays`: gerichtete Geschwindigkeitsspitzen,
- `ring`: Contact- oder Shock-Ring,
- `dust`: neutrale Staubwolken,
- `debris`: kleine abstrakte Splitter oder Steine,
- `trail`: kurzer Bewegungsbogen,
- `residue`: sehr kurze Rauch-/Magiereste,
- `warning`: klare Telegraphie vor Flächenangriffen.

Ein Move referenziert ein VFX-Rezept und Parameter wie Größe, Richtung, Farbrolle und Intensität. Er bekommt kein neues komplett eingebranntes Hintergrundbild.

Beispiele:

- Jab = `physical.light` + Angriffsrichtung
- Belly Slam = `physical.heavy` + `ground.dust.small`
- Air Bonk = getrenntes Body-Sheet + `ground.impact.medium`
- Earthshaker = `ground.warning` + `ground.impact.ultimate` + `ground.debris` + Wombat-Farbaccent
- Wizard Wand = `magic.light` + Wizard-Palette
- Axe Rain = `warning.circle` + Weapon-Layer + `ground.impact.heavy`

## 3. Bestandsaudit

| Bestand | Technischer Zustand | Visueller Zustand | Entscheidung für BULK 4 |
|---|---|---|---|
| code-native Contact Sparks | transparent, kontaktpunktgebunden, deterministisch | lesbare Systemreferenz, aber geometrisch und noch nicht final gezeichnet | als Timing-Referenz behalten, anschließend durch VFX-Rezepte ersetzen |
| `wombat_air_bonk.png` / `_chroma.png` | 2172×724, vollständig deckender grüner Source-Hintergrund; liegen derzeit unter `public`, werden aber vom Preloader nicht referenziert | nicht für Runtime geeignet | aus dem öffentlichen Runtime-Pfad in einen klaren Source-Bereich verschieben; nie preloaden oder direkt ausliefern |
| `wombat_air_bonk_128.png` | 384×128, echte Transparenz, transparente Ecken | Ground-Spark/Steine sind im mittleren Body-Frame eingebrannt | Wombat-Körper neu exportieren und Bodeneffekt als separates universelles Rezept ausgeben |
| `wombat_earthshaker_sheet_256.png` | 1024×256, außen transparent | enthält eine feste grüne Grasfläche und braune Bodenplatte; auf anderen Arenen stilistisch falsch | vollständig ersetzen; Impact, Ring, Dust und Debris ohne Terrain neu aufbauen |
| `discount_wizard_fx_64.png` | transparent und getrennt vom Body | deutlich pixeliger als Figuren und Arenen | in gleicher Funktion, aber in der neuen Comic-Sprache neu zeichnen |
| `discount_wizard_ultimate_sheet_128.png` | transparent | sehr heller, glatter Neon-/Stock-FX-Look; hohe Detaildichte | in Portal Core, Ringe, Rauch und kleine Accent-Sparks zerlegen; Hot White begrenzen |
| `budget_barbarian_ultimate_sheet_128.png` | transparent | Axe Impact enthält eine feste leuchtende Bodenfläche und wirkt stilistisch glänzender als die Figuren | Weapon-Layer behalten/neu angleichen; Ground Impact durch universelles Rezept ersetzen |
| Buster Dust/Ring im Code | keine Texturabhängigkeit | funktional, aber einfache Ellipsen ohne gemeinsame Art Direction | durch Bibliotheksprimitive ersetzen |

### Bestätigter Wombat-Befund

Die vom Nutzer beobachtete feste Umgebung ist sehr wahrscheinlich der Earthshaker: Das Sheet besitzt zwar transparenten Außenraum, malt aber Gras und rissige Erde direkt in alle Effektphasen. Dadurch sieht der Effekt im Park plausibler aus als auf Rooftop oder Scrapyard.

Beim Air Bonk ist im geladenen `_128`-Sheet kein grüner Hintergrund vorhanden. Der Fehler dort ist stattdessen die fehlende Layertrennung: weißer Bodenspark und Steine sind Teil des Wombat-Body-Frames. Beide Probleme werden in BULK 4.2 gemeinsam behoben.

## 4. Style Guide „Punchy Comic Impact“

### 4.1 Formensprache

- leicht asymmetrische, handgezeichnet wirkende Sterne, Keile und Bögen,
- kräftige dunkle Außenkante an deckenden Shapes,
- ein klarer Hauptvektor entsprechend der Angriffsrichtung,
- maximal ein dominanter Kern plus wenige unterstützende Splitter,
- physische Treffer: kantig, radial, komprimiert,
- Magie: runder, spiralförmig oder fließend, aber weiterhin klar konturiert,
- Block: nach außen ablenkende Fächer-/Schildform,
- Armor: stumpfer, breiter No-Sell-Ring mit kurzen Splittern,
- Invulnerability: dünne, saubere Ausweich-/Phasenform ohne schweren Explosionskern,
- Staub: stilisierte Wolkenformen statt halbtransparentem Fotonebel.

Zu vermeiden:

- fotorealistische Rauch- oder Bodentexturen,
- weiche, großflächige Gaussian-Glow-Wolken,
- viele kleine bedeutungslose Funken,
- dauerhaft weiß ausgebrannte Zentren,
- perfekte geometrische Kreise ohne handgezeichnete Variation,
- rechteckige Farbsäume aus Chroma-Key-Quellen.

### 4.2 Farbrollen

| Rolle | Kern | Hauptfarbe | dunkle Kante/Akzent | Funktion |
|---|---|---|---|---|
| Physical | warmes Weiß `#FFF4D0` | Goldgelb `#FFC94A` | Orangebraun `#B84F2A` | normale Treffer |
| Heavy | warmes Weiß `#FFF1C1` | Orange `#F58A32` | Dunkelrotbraun `#7D2B23` | Gewicht und Bodenwirkung |
| Wizard Magic | Weiß `#FFF8FF` | Violett `#B95CFF` | Cyan `#45D7E8` | magische Identität |
| Block | Eisweiß `#E9FDFF` | Cyan `#57CFE8` | Stahlblau `#286C8E` | Ablenkung/Abwehr |
| Armor | Creme `#FFE7AE` | Bernstein `#D89035` | Braun `#6F4528` | Treffer absorbiert, aber Schaden |
| Invulnerable | Weiß `#F4FFFF` | Hellblau `#8EEAFF` | Violettblau `#6677CC` | kein Schaden/Phasing |
| Neutral Dust | Hellbeige `#E7CDA5` | Sand `#B98B5F` | Umbra `#654534` | stage-neutrale Bodenfolge |

Die Farbtabelle definiert Rollen, keine starre Pixelpalette. Pro Frame werden wenige dominante Werte verwendet. Ein Signaturfarbakzent darf höchstens etwa ein Drittel des normalen Contact-FX einnehmen, damit Outcome und Stärkeklasse zuerst lesbar bleiben.

### 4.3 Zeit- und Größenbudget bei 960×540

| Klasse | Kernphase | Gesamtdauer | Richtwert sichtbare Breite | Verdeckung der Figur |
|---|---:|---:|---:|---|
| Light | 1–2 Frames | 80–120 ms | 28–42 px | höchstens 2 Frames |
| Medium | 2 Frames | 100–150 ms | 40–58 px | höchstens 2–3 Frames |
| Heavy | 2–3 Frames | 140–220 ms | 58–88 px | höchstens 3 Frames |
| Ultimate Contact | 3–4 Frames | 220–420 ms | 90–150 px | nur im Peak kurz großflächig |
| Dust/Residue | kein weißer Kern | 180–500 ms | kontextabhängig | Silhouette bleibt lesbar |

Bevorzugter Rhythmus: **Snap → kurzer Peak → schneller Breakup → kontrollierter Rest**. Langsame lineare Skalierung und gleichmäßiges Ausfaden wirken weich und werden vermieden.

### 4.4 Little-Fighter-2-Einfluss und Abgrenzung

LF2 dient als Referenz für kompaktes, schnelles Crowd-Combat-Feedback und klar unterscheidbare physische beziehungsweise elementare Aktionen. Die offizielle Beschreibung bestätigt das Zusammenspiel aus mehreren Kämpfern, normalen Aktionen, Spezialangriffen und Mana; die Remastered-Fassung überträgt diese Identität in neu gezeichnete hochauflösende Grafik und behält den schnellen Kampfstil bei.

More Than Wombat übernimmt daraus:

- schnelle Lesbarkeit bei mehreren Figuren,
- deutliche Element-/Outcome-Farbrollen,
- wenige starke Shapes statt Effektnebel,
- kleine Normalangriffe und bewusst größere Specials,
- cartoonhafte Übertreibung bei klarer Gameplay-Funktion.

Nicht übernommen werden konkrete LF2-Sprites, exakte Effektformen, Animationen, Namen oder Farbfolgen. Das Ergebnis bleibt eine eigenständige More-Than-Wombat-Optik.

## 5. Zielarchitektur

BULK 3 bleibt unverändert die Quelle für Outcome, Kontaktpunkt, Stärke, Hitstop, Flash, Shake, SFX und Haptik. BULK 4 ersetzt nur die Präsentationsschicht.

Geplante Bausteine:

- **VFX Asset Manifest:** Frames, Raster, Ursprung, Ground-/Contact-Raum, Blend Mode und maximale Dauer.
- **VFX Recipe Registry:** Datenrezepte für `physical.light`, `physical.medium`, `physical.heavy`, `magic`, `block`, `armor`, `invulnerable`, `dust`, `warning` und Specials.
- **VFX Director:** liest `CombatImpact` und Move-Cues, kombiniert die passenden Layer und besitzt keine Schadenslogik.
- **Pool/Emitter Layer:** wiederverwendete Sprites und gepoolte Partikel statt Erzeugen/Zerstören ungebremster Einzelobjekte.
- **Quality Policy:** Full/Reduced/Minimal für Partikelanzahl und Residue; Reduce Flash und Reduce Shake bleiben unabhängig davon erhalten.
- **Combat-Gym-VFX-Matrix:** Outcome, Klasse, Rezept, Qualitätsmodus, Hintergrundarena und Effektanzahl direkt auswählbar.

Der bestehende `CombatPresentationController` soll nicht durch weitere Attack-ID-`if`-Ketten wachsen. Normale Treffer werden vollständig über Profile/Rezepte gewählt. Specials referenzieren benannte Cue-Rezepte, die wiederum universelle Primitive kombinieren.

## 6. Asset- und Exportvertrag

### Runtime-Dateien

- PNG/RGBA oder ein gemeinsamer transparenter Atlas,
- keine Chroma-Key-Hintergründe,
- mindestens 4 px transparenter Innenabstand pro Frame bei 128er Zellen, 6–8 px bei 256er Zellen,
- keine angeschnittenen Alphapixel,
- fester Ursprung je Kategorie: Contact Center, Ground Center oder Directional Origin,
- Contact-FX spiegelbar; Text, Lichtquelle und Schatten dürfen das Spiegeln nicht verraten,
- Ground-FX wird perspektivisch flach angelegt und folgt der World-Ground-Plane,
- additive Darstellung nur für kleine Kern-/Energie-Layer; Kontur, Staub und Debris bleiben normal geblendet.

### Source-Dateien

- Master, Palette und Ebenen bleiben nachvollziehbar,
- Body, Core, Rays, Dust, Debris und Residue werden getrennt gehalten,
- verwendete Generatoren/Quellen und Lizenz werden dokumentiert,
- Chroma-Quellen erhalten den Suffix `_source_chroma` und werden nie vom Preloader referenziert.

### Automatische Gates

Ein neues `vfx:qa`-Gate soll mindestens prüfen:

- Runtime-Datei besitzt einen Alpha-Kanal,
- alle vier Ecken sind vollständig transparent,
- Mindestabstand zum Framerand wird eingehalten,
- keine erwartete Zelle ist leer,
- keine produktive Datei trägt `_chroma` oder liegt im Source-Pfad,
- Rastermaße stimmen mit dem Manifest überein,
- maximale Framezahl und Texturgröße werden nicht überschritten,
- Manifest besitzt Kategorie, Ursprung, Dauer, Blend Mode und Qualitätsklasse.

Eine visuelle Vorschau rendert jede Animation auf mindestens vier Testflächen: hell, dunkel, Park und Rooftop/Scrapyard. So werden rechteckige Hintergründe, Farbsäume und arenaabhängige Bodenplatten sofort sichtbar.

## 7. Umsetzung in priorisierten Teilblöcken

### BULK 4.0 — Style Lock und drei Gold-Standard-Prototypen

**Priorität:** P0, vor jeder Serienproduktion

Lieferumfang:

- ein einseitiges visuelles Style Board mit Form-, Kontur-, Farb- und Timingregeln,
- Physical Light Hit in 2–3 Varianten,
- Wizard Magic Hit in 2 Varianten,
- neutraler Ground Impact ohne Bodenplatte in 2 Varianten,
- Ingame-Vergleich bei 1×, 0,5× und 0,25×,
- Prüfung auf Park, Scrapyard und Rooftop,
- Nutzerfreigabe einer gemeinsamen Richtung.

Abnahme:

- comicartig und passend zu den Figuren,
- LF2-artig in Klarheit und Tempo, nicht als Pixelkopie,
- keine feste Umgebung und kein sichtbares Rechteck,
- Trefferpose bleibt erkennbar,
- Light und Magic sind ohne UI unterscheidbar.

**Commit-Gate:** Style Guide und freigegebene Referenzassets getrennt committen. Keine Roster-Massenproduktion vor Freigabe.

### BULK 4.1 — Bibliothekskern, Manifest und QA

**Priorität:** P0

Lieferumfang:

- Atlas-/Manifest-Struktur,
- VFX Recipe Registry,
- VFX Director auf `CombatImpact`,
- Sprite-/Partikel-Pooling,
- `vfx:qa` und Preview-Generator,
- Combat-Gym-Auswahl für Rezept und Arena,
- Full/Reduced/Minimal-VFX-Qualität.

Startbibliothek:

- Physical Light/Medium/Heavy,
- Magic Light/Medium/Heavy,
- Block, Armor, Invulnerable,
- Directional Whiff Trail,
- Dust Small/Medium,
- Ground Impact Medium/Heavy,
- Warning Circle/Cone,
- kurzer Shock Ring und Debris Burst.

Abnahme:

- kein normaler Treffer benötigt Attack-ID-Sondercode,
- Whiff erzeugt keinen Contact Spark,
- alle Rezepte sind im Combat Gym reproduzierbar,
- Pause/Frame Step halten die Effektzeit deterministisch,
- vorhandene Combat-Tests bleiben grün.

### BULK 4.2 — Wombat Gold Slice und Entfernung eingebrannter Umgebung

**Priorität:** P0

Reihenfolge:

1. Air-Bonk-Body ohne weißen Ground Spark und ohne Steine exportieren.
2. Separates `ground.impact.medium` am tatsächlichen Ground Contact auslösen.
3. Earthshaker-Gras-/Erdplatte vollständig aus dem Runtime-Asset entfernen.
4. Earthshaker in Warning/Anticipation, Contact Core, Shock Ring, Dust, Debris und Decay zerlegen.
5. Jab, Belly Slam, Air Bonk und Earthshaker als zusammenhängendes Physical-Set abstimmen.

Abnahme:

- Air Bonk und Earthshaker funktionieren unverändert auf allen drei Arenen,
- kein grüner/brauner Terrainfleck bleibt sichtbar,
- Body-Animation kann ohne World-FX abgespielt werden,
- Ground-FX kann mit einer anderen Figur oder Attacke wiederverwendet werden,
- Earthshaker bleibt auch mit Reduce Flash und Reduce Shake eindeutig als Ultimate lesbar.

**Commit-Gate:** Wombat Body-/World-Layertrennung und neue Gold-Slice-Rezepte als eigener Commit.

### BULK 4.3 — Outcome-Bibliothek und Roster-Integration

**Priorität:** P1

- Block, Armor und Invulnerable in der freigegebenen Sprache finalisieren.
- Wizard-Pixel-FX und überhelle Ultimate-Layer ersetzen.
- Axe Rain von der festen Bodenfläche trennen; Warning und Impact geometrisch angleichen.
- Buster-Dust und Ring auf Bibliotheksprimitive umstellen.
- Pigeon-Effekte klein, schnell und leicht halten.
- gleiche Stärkeklassen über alle Figuren visuell vergleichbar halten.

Abnahme:

- Outcome ist ohne Schadenszahl lesbar,
- Figurensignatur verändert die gemeinsame Grammatik nicht,
- keine neue attackenspezifische Bodenplatte,
- keine dauerhaft hellweiße oder vollflächige Überblendung.

### BULK 4.4 — Dichte, Performance, Accessibility und Endabnahme

**Priorität:** P1

Initiale Mobile-Budgets, anschließend auf Zielgerät messen:

| Kategorie | Partikel/kleine Fragmente | Flipbook-Layer | maximale Residue |
|---|---:|---:|---:|
| normaler Hit | bis 12 | 1 | 220 ms |
| Heavy/Ground Hit | bis 24 | 2 | 420 ms |
| Ultimate Peak | bis 48 | 3 | 800 ms |
| global gleichzeitig | Zielwert bis 80 aktive Kleinteile | bevorzugt gemeinsamer Atlas | älteste unkritische Residue zuerst abbauen |

Prüfungen:

- 60-FPS-Ziel auf dem schwächsten vorgesehenen Mobilgerät,
- Duel und dichteste Wave-Situation,
- Park, Scrapyard und Rooftop,
- Touch-UI und kleine Displays,
- Full/Reduced/Minimal VFX,
- Reduce Flash sowie Shake Full/Reduced/Off,
- mehrere gleichzeitige Treffer ohne SFX-/VFX-Doppeltrigger,
- keine unkontrollierte Blend-Mode- oder Shader-Wechselfolge.

Phaser-ParticleEmitter verwaltet Partikel gepoolt; `reserve` und `maxParticles` sollen bewusst genutzt werden. Für Rendering-Performance werden ähnliche Game Objects und gemeinsame Texturen bevorzugt, damit der Phaser-Renderer sie batchen kann.

## 8. Definition of Done für BULK 4

BULK 4 ist erst abgeschlossen, wenn alle folgenden Punkte erfüllt sind:

- [ ] Stilrichtung wurde anhand der drei Gold-Standard-Prototypen freigegeben.
- [ ] Jeder produktive Runtime-Effekt besitzt echte Transparenz.
- [ ] Kein VFX-Sheet enthält Arena-, Gras-, Erd-, Asphalt- oder Himmelsflächen.
- [ ] Air-Bonk-Körper und Ground Impact sind getrennt.
- [ ] Earthshaker besteht aus transparenten, wiederverwendbaren Layern.
- [ ] Physical Light/Medium/Heavy/Ultimate sind ohne Zahlen unterscheidbar.
- [ ] Magic, Block, Armor und Invulnerable besitzen klare gemeinsame Grammatik.
- [ ] Normale Treffer verdecken die Gegnerreaktion höchstens 2–3 Frames.
- [ ] Kontakt-FX sitzt am durch BULK 2 ermittelten Kontaktpunkt.
- [ ] Ground-FX sitzt auf der World-Ground-Plane.
- [ ] Combat-Gym-Pause und Frame Step bleiben deterministisch.
- [ ] VFX-Qualitätsmodi und Reduce Flash/Shake funktionieren.
- [ ] `vfx:qa`, Typecheck, Tests und Produktionsbuild sind grün.
- [ ] Die dichteste vorgesehene Wave-Szene hält das vereinbarte Zielgerätebudget.
- [ ] Dokumentation, Manifest, Quellen und Lizenzen sind aktuell.

## 9. Bewusste Grenzen

Nicht Bestandteil von BULK 4:

- neue Treffermechanik oder Umbau des `CombatImpact`-Kerns,
- Parry, Guard Break, Knockdown/Getup oder neue Defense-Systeme,
- kompletter Audio-Mix und Musiksystem,
- neue Figuren, Arenen oder Meta-Systeme,
- Shader- oder Postprocessing-Großumbau,
- Kopieren oder Nachbauen konkreter LF2-Assets.

Diese Grenzen verhindern, dass der VFX-Polish erneut Architektur- oder Content-Scope öffnet.

## 10. Empfohlene Commit-Reihenfolge

1. `Lock Bulk 4 comic VFX style`
2. `Add reusable VFX manifest and QA pipeline`
3. `Separate Wombat body and ground impact VFX`
4. `Integrate universal combat outcome VFX`
5. `Complete roster VFX and mobile quality pass`

Jeder Commit muss für sich typecheck-/testbar sein. Änderungen an Wombat-Body-Sheets laufen zusätzlich durch die vorhandene Character-Asset-Pipeline.

## 11. Referenzen

- [Little Fighter 2 — offizielle Einführung](https://www.lf2.net/en/intro.html) — Referenz für schnelles Mehrfiguren-Combat, normale Aktionen, Specials und Mana.
- [Little Fighter 2 Remastered — Steam](https://store.steampowered.com/app/3249650/Little_Fighter_2_Remastered/) — Referenz dafür, die klassische schnelle Identität mit neu gezeichneter hochauflösender Grafik zu verbinden.
- [Phaser 4 ParticleEmitter API](https://docs.phaser.io/api-documentation/class/gameobjects-particles-particleemitter) — Pooling, Reservierung, Partikellimits und Laufzeitsteuerung.
- [Phaser 4 Rendering Concepts](https://phaser.io/tutorials/phaser-4-rendering-concepts) — gemeinsame Game-Object-/Texturpfade zur besseren Batchbarkeit.

## 12. Nächster konkreter Schritt

Als Nächstes wird ausschließlich **BULK 4.0** umgesetzt: drei kleine Ingame-Prototypen und ein Style Board. Erst nach visueller Freigabe beginnt der Bibliotheks- und Roster-Ausbau.
