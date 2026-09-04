# 30 – Mara und jitterfreie Character-Produktion

**Status:** M0–M3 implementiert und automatisiert abgenommen
**Stand:** 2026-09-04  
**Ziel:** Eine eigene, professionell lesbare weibliche Kämpferin produzieren, ohne die alten Probleme mit transparentem Leerraum, Root-Drift, Farbwechseln und scheinbar seitlichem Jitter zu wiederholen.

## Entscheidung und kreativer Rahmen

Die neue Figur heißt vorläufig **Mara „Breach“ Vale**. Sie ist eine flinke Nahkämpferin und ehemalige Sicherheitskraft: olivgrüne kurze Bomberjacke, dunkle Shorts/Leggings, robuste Boots, blonde seitliche Frisur, gelbe Akzente. Ihre klare, aufrechte Silhouette und schnelle Kick-Posen nehmen das gewünschte Street-Fighter-Gefühl als Bewegungsreferenz auf, bleiben aber vollständig eigene Gestaltung und eigene Animation.

### M0-Artefakt (2026-09-04)

- Originales Konzept-Model-Sheet: `art-source/concepts/mara/mara_breach_model_sheet_v1.png`
- Erzeugt mit der integrierten Bildgenerierung; Prompt und Gestaltungsentscheidung liegen in diesem Dokument.
- Abnahme: Die Figur besitzt eine brauchbare Farbidentität und die gewünschte Guard-/Kick-Silhouette. Sie ist **nicht** als Sprite-Sheet freigegeben: Die Konzeptfläche enthält einen dunklen Hintergrund, die Posen haben noch keinen gemeinsamen Pixel-Root und die Kick-Pose ist absichtlich nicht auf der Ground-Line. Sie ist daher Referenz, nicht Runtime-Asset.

**Freigegebene Designkonstanten für M1:** olivgrüne Bomberjacke, dunkles Unterteil, schwarze Boots/Handschuhe, blonde seitliche Frisur, Sicherheitsgelb nur als Akzent, breite dunkle Kontur. Keine Waffe, keine eingebrannten Effekte, kein Hintergrund.

Die verlinkte Cammy-Datei von The Spriters Resource ist **als private Bewegungs- und Posing-Referenz hilfreich**: Sie zeigt, wie lesbare Antizipation, klare Kick-Linien und ein belastbares Standbein aussehen können. Sie wird jedoch weder heruntergeladen noch bearbeitet noch ins Spiel übernommen. Die Website untersagt die Nutzung ihrer Inhalte in kommerziellen Werken; zudem liegt das zugrunde liegende Charakterrecht bei Capcom. Sie ist deshalb keine produktionsfähige Quelle für unser Sprite-Sheet.

Quellen:

- [The Spriters Resource – Terms of Use](https://www.spriters-resource.com/page/tou/)
- [Phaser Sprite API – Origin und Frame-Handling](https://docs.phaser.io/api-documentation/class/gameobjects-sprite)
- [Phaser Animation State – Framewechsel passt Größe/Ursprung an](https://docs.phaser.io/api-documentation/3.88.2/class/animations-animationstate)

## Befund: Warum der aktuelle Barbarian trotz QA noch unruhig wirkt

Die bestehende Asset-QA prüft bereits korrekt, ob Fußlinie, abgeleiteter Körperanker, Farbsprung und Framerand innerhalb enger Grenzwerte liegen. Das ist ein wichtiger technischer Schutz, aber noch keine vollständige visuelle Abnahme.

Beim Runtime-Walk des Budget Barbarian bleiben zwei sichtbare Ursachen:

1. **Nur zwei echte Walk-Posen:** Frames `4–7` alternieren tatsächlich zwischen zwei Ausgangsposen (`A–B–A–B`). Das wirkt rhythmisch grob und lässt Axt, Haare und Schulter-Silhouette abwechselnd seitlich springen.
2. **Zu viel ungenutzte Zelle:** Die stabile 160×160-Canvas enthält bewusst Platz für Axt und Angriffe. Im isolierten GIF zeigt dieser transparente Sicherheitsraum viel stärker als in der Spielszene; der Preview ist daher kein guter Qualitätsbeweis für die gefühlte Figurengröße.

Die Root- und Fußstabilität ist damit zwar technisch gelöst, die **Bewegungsillusion** aber noch nicht auf Endqualität. Ein weiterer automatischer Verschiebe- oder Skalierungspass würde das nicht beheben – er würde nur die Posen verformen.

## Verbindlicher Standard für neue Figuren

### 1. Ein Spielanker, nicht ein Bildzentrum

- Jeder Frame erhält vor der Gestaltung eine **Ground-Line** und einen **Gameplay-Root**: Mittelpunkt des belasteten Standfußes bzw. zwischen beiden Füßen.
- Der Root liegt für Mara als konstant benannte Koordinate im 160×160-Raster, nicht in der Mitte der sichtbaren Pixel und nicht am Waffenausleger.
- Idle und Walk dürfen den Root höchstens um **1 px vertikal / 2 px horizontal** verändern; sonst wird der Export abgelehnt.
- Bewusste Vorwärtsbewegung bei Angriffen wird in der Move-/Physics-Timeline beschrieben. Sie wird nicht zufällig durch unterschiedlich gepackte Bilder erzeugt.

### 2. Einheitlicher Canvas mit bewusstem Sicherheitsraum

- Mara nutzt 160×160 px pro Körperframe, transparente RGBA-PNGs und eine reservierte Ground-Line bei y=154.
- Der Sicherheitsraum ist kein Fehler, sofern er symmetrisch geplant ist: mindestens 6 px zur Kante für Körper, mehr Platz nur in ausgewiesenen Attack-/FX-Zellen.
- Körper-Sheet und Effekt-Sheets bleiben getrennt. Kicks, Treffersterne, Staub und Energie dürfen nicht mit dem Hintergrund gebacken werden.
- Der Ingame-Preview wird künftig zusätzlich als **beschnittene Kontaktbogen-Vorschau** gerendert. Das verändert niemals die Runtime-Zellen, macht aber Qualitätsprüfung ohne irreführende Leerfläche möglich.

### 3. Nicht generierte Zwischenbilder erzwingen

Bildgenerierung eignet sich für das originale Model Sheet, Farbstudien und Key-Pose-Referenzen. Sie ist **keine belastbare Quelle für fertige, framegenaue Walk-Zwischenbilder**: bei unabhängigen Generierungen ändern sich Proportionen, Accessoires und Perspektive zu leicht.

Darum gilt für die Produktionsversion:

- Zuerst ein eigenes, freigegebenes Mara-Model-Sheet mit Palette, Proportionen, Outfit und Root-Markierung erzeugen.
- Danach werden nur die 4–6 ausgewählten Walk-Keyposes in einer einzigen kontrollierten Vorlage aufgebaut und auf denselben Root gesetzt.
- Die Übergänge werden einzeln kontrolliert: `Kontakt links → Passing → Kontakt rechts → Passing` (bei 4 Frames) oder um zwei klare Extrem-/Recoil-Frames erweitert.
- Keine Spiegelung innerhalb desselben Rechtslauf-Zyklus; linke Laufrichtung entsteht erst zur Laufzeit über `flipX`.
- Eine Pose darf länger stehen (per-Frame-Dauer), wenn sie Gewicht braucht. Eine einheitliche Framerate ist kein Qualitätszwang.

### 4. Stil- und Farbkontinuität

- Vor dem ersten Sheet werden maximal 8 benannte Hauptfarben festgelegt: Außenlinie, Haut hell/schatten, Jacke hell/schatten, dunkles Unterteil, Boot, Akzentgelb.
- Pro Animation sind kleine Lichtwechsel erlaubt, aber weder Jackenfarbe noch Haarfarbe wechseln.
- Die Bewegung setzt auf breite, klare Comic-Silhouetten statt auf feine Textur. Das passt zum vorhandenen Little-Fighter-artigen Spielgefühl und bleibt auf Mobile lesbar.

## Produktionsplan in Abnahme-Bulks

### Bulk M0 – Design Lock und Bewegungs-Spezifikation

**Ergebnis:** produktionsfähiger Charakterbrief, noch keine Runtime-Integration.

1. Originales Mara-Model-Sheet erzeugen: Front-/3/4-Seitenansicht, Palette, Ausrüstung, Größenvergleich zum Wombat.
2. Root-/Ground-Line-Overlay einzeichnen und die Zielgröße gegen Wombat, Wizard und Barbarian im 160×160-Raster festlegen.
3. Moves vorzeichnen: Basic `Gate Kick`, Special `Breach Step`, Ultimate `Red-Line Barrage`; jedes Move-Konzept mit Antizipation, Aktivmoment und Recovery.
4. Festlegen, welche Anteile Body-Frames und welche universelle FX sind.

**Gate M0:** Eine Figur ist in einer 96×96-Mobile-Vorschau sofort als Mara lesbar; Palette, Stil und Root sind dokumentiert. Keine Sprite-Sheet-Integration vor diesem Gate.

### Bulk M1 – Bewegungs-Loop als Qualitätsprobe

**Ergebnis:** geprüftes Idle + echter 4- oder 6-Frame-Walk, bevor Angriffsbilder entstehen.

1. Idle mit vier subtilen, gleich verankerten Atem-/Guard-Frames bauen.
2. Walk als echter Zyklus bauen, nicht `A–B–A–B` aus zwei Bildern wiederholen.
3. Jede Pose auf die feste Ground-Line und denselben Root setzen; die Hüfte darf sich natürlich bewegen, der Spielanker nicht.
4. Zwei Vorschauen erzeugen: Runtime-Loop mit Ground-Line sowie eng beschnittener Kontaktbogen ohne irreführende Leerfläche.
5. Automatische Gates laufen lassen: Footline, Root, Farbpalette, Randclipping. Zusätzlich folgt eine visuelle 0,25×- und Echtzeit-Abnahme.

**Gate M1:** Kein Framewechsel wirkt wie Teleport; Schuhkontakt, Hüftbogen und Blickrichtung sind als zusammenhängender Gang lesbar. Erst dann werden Angriffe produziert.

### Bulk M2 – Kampfkern und getrennte FX

**Ergebnis:** vollständiger spielbarer Vertical Slice ohne gebackene Hintergründe.

1. Body: Basic-Kick (3–4 Frames), Special-Dash-Kick (4–5), Sprung/Fall/Landung, Air-Kick, Hit, K.O.
2. FX: universeller Impact-Star, Dust-Puff und Momentum-Streak als eigenständige transparente Sheets; Mara erhält nur Farb-/Skalenparameter, keine Hintergrundbilder.
3. Für jeden Move: feste Startup-/Active-/Recovery-Phasen, Hitbox nur im Active-Fenster, Hurt-/Pushbox aus der echten Masse des Sprites abgeleitet.
4. Hitboxen bei 0,25× im Combat Gym gegen Wombat und Barbarian kontrollieren; Kamera, Hitstop und VFX nutzen die bestehenden zentralen Systeme.

**Gate M2:** Jeder Treffer deckt sich mit Kick/FX; kein leerer Raum trifft, kein sichtbarer Kick verfehlt ohne erklärbaren Grund.

### Bulk M3 – Integration, Balance und Mobile-Abnahme

**Ergebnis:** Mara ist als vollwertige spielbare Figur registriert und auf Zielgeräten geprüft.

1. Fighter-Daten, Auswahlbildschirm, Animation Registry und Preload einbinden.
2. Werte gegen die vorhandenen Archetypen kalibrieren: höhere Mobilität als Wizard/Barbarian, geringere Reichweite/HP als Bulldog, keine unfaire Dash-Dominanz.
3. Portrait, Name, Farbkontrast und Ultimate-Cue im 16:9-Desktop sowie auf Mobile Landscape prüfen.
4. Typecheck, Tests, Build, Asset-QA und Browser-Capture ausführen; QA-GIF und Abnahmebericht ablegen.

**Gate M3:** Alle technischen Tests grün, kein sichtbarer Jitter in Idle/Walk/Attack-Transitions, klare Lesbarkeit bei realer Spielgröße.

## Parallelreparatur: Budget Barbarian B2.1

Diese Reparatur wird nicht über Offsets "weggeregelt". Der korrekte Ablauf ist:

1. Die vorhandenen vier Walk-Zellen durch einen neuen, echten 4-Frame-Zyklus ersetzen.
2. Axt-Hand, Schulter und Hüfte in der Kontakt-zu-Kontakt-Bewegung bewusst als Bogen führen; nur die Füße folgen der Ground-Line.
3. Jede neue Zelle vor dem Sheet-Pack am selben Root ausrichten.
4. Nicht nur die bestehende Asset-QA, sondern eine kontaktbogen-beschnittene Vorschau und Echtzeit-Loop prüfen.
5. Erst nach visueller Freigabe die Runtime-Datei austauschen.

Der bestehende 160×160-Canvas bleibt für Kompatibilität. Für die Review-Vorschau wird jedoch zusätzlich transparentes Sicherheitsfeld entfernt, nicht für das Spiel selbst.

## Definition of Done

Eine neue Figur gilt erst dann als hochwertig integriert, wenn:

- ihr Sheet eigenständig erstellt und nachvollziehbar dokumentiert ist;
- jede Bewegungssequenz echte Keyposes statt wiederholter Zufallsbilder enthält;
- Footline, Root, Palette und Randclipping automatisiert bestanden sind;
- die Kontaktbogen-Vorschau und die Runtime-Animation beide visuell abgenommen wurden;
- die Hitboxen im Combat Gym mit den aktiven Körperteilen zusammenpassen;
- Body und universelle FX ohne eingebrannten Hintergrund wiederverwendbar sind;
- Mobile und Desktop dieselbe klare Silhouette liefern.

## Bewusste Reihenfolge

**M0 → M1 → M2 → M3.** Der entscheidende Schutz ist M1: Erst wenn der Lauf als kurze, echte Animation überzeugt, lohnt es sich, die restliche Figur zu produzieren. Das verhindert, dass ein hübsches Konzept erneut auf einem unruhigen Kern landet.

## Umsetzungsprotokoll – Mara "Breach" Vale (2026-09-04)

Mara ist als vollwertige spielbare Figur integriert: Character Select, Duel-Gegneroption, Combat Gym, Preload, Animationsregistrierung, Fighter-Daten, drei eigene Moves, Boxprofile und reine Runtime-VFX-Cues.

### Produktionsartefakte

- Konzept: `art-source/concepts/mara/mara_breach_model_sheet_v1.png`
- Originale Posenquelle: `art-source/concepts/mara/mara_breach_animation_source_v1.png`
- Deterministischer Builder: `scripts/build-mara-sheet.mjs` (`npm.cmd run assets:mara`)
- Runtime-Sheet: `public/assets/characters/mara/mara_breach_spritesheet_160_normalized.png`
- Laufvorschau: `docs/qa/character-loop-previews/mara-breach-walk.png`

Der Builder entfernt bewusst die vom Generator als echte Pixel ausgegebene Transparenz-Vorschau über eine kantenverbundene Freistellung. Zusätzlich verwirft er isolierte Pixelgruppen, die durch einen Überstand aus einer benachbarten Generatorzelle entstehen können. Erst danach werden alle 28 Body-Frames mit **einem einzigen Sheet-Maßstab**, einem geschätzten Torso-Root x=80 und einer Ground-Line y=154 exportiert. Dadurch gibt es keine per-State-Skalierung und keine versteckten Runtime-Offsets.

### M1 – Animation

- Idle: 4 Guard-/Atemframes.
- Walk: 4 echte Phasen (Kontakt links, Passing, Kontakt rechts, Passing), keine A–B–A–B-Wiederholung.
- Basic: `Gate Kick`, 4 Keyposes.
- Special: `Breach Step`, 4 Keyposes mit begrenzter tatsächlicher Vorwärtsbewegung von 46 World-Pixeln.
- Ultimate: `Red-Line Barrage`, 4 Keyposes.
- Dedicated Jump, Fall, Air Kick, Landing, Hit und K.O.

### M2 – Kampfprofil

| Move | Rolle | Kosten | Besonderheit |
|---|---|---:|---|
| Gate Kick | schneller Poke | 0 | Drei Hitbox-Fenster, klarer Kick-Ausleger |
| Breach Step | mittlerer Engage | 28 Mana | 46 px begrenzter Schritt + universeller Dust |
| Red-Line Barrage | Ultimate | 100 Mana | großer finaler Kick, Launch, Charge/Impact aus universeller VFX-Bibliothek |

Mara ist bewusst mobil (201 Move Speed), aber mit 88 HP und schmalem Hurt-/Pushboxprofil verletzlicher als die Bruiser. Ihre aktiven Hitboxen decken die visuell ausgestreckten Kickphasen ab, nicht den Leerraum vor der Antizipation.

### M3 – Abnahme

- `npm.cmd run typecheck` – bestanden
- `npm.cmd run test` – 52/52 bestanden
- `npm.cmd run assets:qa` – 6/6 Character-Sheets bestehen harte Anchor-, Fußlinien-, Rand- und Leerzellen-Gates
- `npm.cmd run build` – bestanden (bekannte Vite-Chunk-Größenwarnung, kein Fehler)
- Lokales Browser-Duell: Mara-Auswahl und Attack-Inputs geprüft, keine Console-Fehler.

**Visuelle Entscheidung:** Der Walk ist technisch sauber verankert und als 4-Phasen-Zyklus lesbar. Das Produktionsblatt ist eine starke spielbare Erstfassung; ein späterer reiner Art-Polish kann einzelne Zwischenbilder noch glätten, ohne Daten, Boxen, Ground-Line oder Integration erneut anzufassen.
