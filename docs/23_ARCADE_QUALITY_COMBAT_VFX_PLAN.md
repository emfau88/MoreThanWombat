# 23 — Arcade-Quality-, Combat-Feel-, VFX- und Hitbox-Plan

**Projekt:** More Than Wombat
**Stand der Bestandsaufnahme:** 2026-09-01; Umsetzungsstatus aktualisiert 2026-09-02
**Zweck:** Verbindliche, nach Priorität sortierte Roadmap vom aktuellen Prototyp zu einem hochwertigen 2.5D-Arcade-Brawler
**Scope dieses Dokuments:** Audit, Zielbild, Combat Feel, Hitboxen/Hurtboxen/Pushboxen, Charakter-Sheets, VFX, Audio, Mobile UX, Architektur, QA und Vertical Slice
**Ursprünglicher Audit-Scope:** In der Bestandsaufnahme wurden noch keine Code- oder Assetänderungen vorgenommen. Der Umsetzungsstatus darunter hält die nachträgliche Realisierung der priorisierten Blöcke fest.

---

## Umsetzungsstatus — 2026-09-02

### BULK 0 und BULK 0,5: abgeschlossen

- Der frühere passive Testmodus ist jetzt ein reproduzierbarer **Combat Gym**.
- Fighter, Move, Dummy, Distanz, Lane-Abstand, Mana und Dummy-Verhalten sind direkt im Battle wählbar.
- Pause, 60-Hz-Einzelschritt, 1x/0,5x/0,25x, Box-Anzeige, Reset und Move-Auslösung sind verfügbar.
- Telemetrie zeigt State, Move, Startup/Active/Recovery, Zeit im Move, Restzeit, Animationsframe und Hitstop.
- Dummy-Modi `idle`, `guard`, `invulnerable` und `attack-loop` sind implementiert.
- Move-Timeline, Kontaktauflösung, Hitfeedback, Input Buffer, Mobile-Hit-Test und Combat Clock sind als getrennte, testbare Systeme ausgeführt.
- Ultimates, Cast-/Impact-FX und Start-Cues liegen nicht mehr als wachsender Block in `BattleScene`, sondern im `CombatPresentationController` und `MoveStartCueController`.
- Charakteranimationen werden zentral im `CharacterAnimationRegistry` registriert.
- Projektile, Nahkampf und Axe Rain beachten dieselben Outcomes `hit`, `blocked` und `invulnerable`.
- Der Touch-Menü-Hit-Test hat Vorrang vor dem großen Joystick-Capture und wird als Einmalimpuls konsumiert.
- `BattleScene.ts` wurde von über 1.200 auf rund 1.020 Zeilen reduziert; weitere Trennung bleibt später sinnvoll, ist aber kein Sofort-Blocker mehr.
- Reproduzierbare Befehle sind vorhanden: `npm run typecheck`, `npm test`, `npm run build`.
- Derzeit bestehen **23 automatisierte Tests** für Timeline, Combat Resolution, Feedback, Input Buffer, Clock, Combat-Gym-Modell, Mobile-Hit-Test und Boxprofile.
- Browser-Abnahme bestanden: Preset-Wechsel, Guard, Invulnerability, Frame Step, Boxen und Touch-Menü im mobilen Landscape-Viewport.

### Bekannte Restpunkte nach BULK 0/0,5

- Knockdown-Testdummy und Frame-Time-Protokollierung gehören in den späteren State-/Performance-Ausbau.
- Der Produktionsbuild enthält weiterhin einen Chunk über 500 kB; Lazy Loading bleibt BULK 8.
- `npm audit` meldet drei High-Warnungen in Build-Abhängigkeiten; ein erzwungener Major-Upgrade-Fix wurde bewusst nicht ungeprüft ausgeführt.
- `Fighter` enthält weiterhin Visual- und State-Verantwortung, aber seine Boxauswahl ist jetzt datengetrieben. Eine weitere Trennung darf gezielt mit realem Bedarf wachsen, nicht als riskanter Big-Bang-Umbau.
- **Aktiver nächster Schritt:** BULK 3 auf der bestehenden Timeline-/Resolver-/Feedback-Grundlage vervollständigen; kein weiterer Architektur-Neubau muss vorgeschaltet werden.

### BULK 1: abgeschlossen und visuell abgenommen

- Fünf produktive Body-Sheets werden reproduzierbar als Runtime-Sheets generiert.
- Alle fünf Sheets beziehungsweise zehn Idle-/Walk-Gruppen bestehen die harten Gates für Raster, Fußlinie, Root-Proxy und Clipping.
- Der Discount Wizard wurde von einem kanonischen v2-Master mit stabiler Kostümidentität, separaten Body-/VFX-Layern und 20 gültigen Body-Frames neu aufgebaut.
- Discount Wizard v2 erreicht 0,07 px Idle- und 0,17 px Walk-Root-Drift bei einer Palettendistanz von jeweils 0,03; Wombat Idle liegt bei 0,02 px Root-Drift.
- Die alten Idle-Offset-Reparaturen für Wombat, Wizard und Pigeon sind entfernt.
- Barbarian-Scale-Pops bis 1,7x sowie 23–26 % Attack-Scale-Overrides sind entfernt.
- Dauerhafte Ganzkörper-Farbwechsel in Hitstun und Air Attack sind entfernt; der kurze Impact-Flash bleibt.
- Whole-Sheet-QA prüft alle produktiven Zellen; aktuell gibt es 0 unerwartet leere und 0 angeschnittene Frames.
- Wombat-/Barbarian-Gang-Bobbing und die Pigeon-Palettenwarnung wurden visuell als beabsichtigte Pose-/Flächenänderungen freigegeben.
- Wand Smack und Miscast wurden im Combat Gym bei 0,25× geprüft; der Miscast ist dafür jetzt direkt anwählbar.
- Der vollständige Workflow und die Review-Entscheidungen stehen in `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md` und `docs/qa/character-assets-latest.md`.

### BULK 2: abgeschlossen und im Combat Gym abgenommen

- Hitboxprofile unterstützen lückenlose Early-/Main-/Late-Fenster und mehrere Boxen pro Fenster.
- Wombat Jab und Belly Slam sind die framegenauen Authoring-Referenzen; Air Bonk und Axe Rain besitzen explizite Profile.
- Alle produktiven Fighter besitzen zustandsabhängige Hurtbox-/Pushboxprofile für Standing, Moving, Attacking, Airborne, Hit und Knockdown.
- Lane- und Höhenreichweite sind pro authored Angriff explizit; der tatsächliche Box-Überlappungsmittelpunkt ist der gemeinsame Kontaktpunkt.
- Combat-Factions verhindern Friendly Fire bei Nahkampf, Projektilen, Homing und Axe Rain.
- Pushboxen werden über alle Fighter-Paare gelöst; Airborne/Knockdown blockieren den Bodenraum nicht.
- Combat-Gym-Telemetrie zeigt Hitbox-/Hurtboxprofil und Kontaktmarker.
- Jab, Belly Slam, Air Bonk und Wizard Fireball wurden bei 0,25× beziehungsweise per 60-Hz-Einzelschritt geprüft.
- Details, bewusste Grenzen und Tests stehen in `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md`.

---

## 1. Kurzurteil

Das Projekt ist kein früher Techniktest mehr, sondern eine **fortgeschrittene Pre-Alpha mit eigener Identität**. Menü, Charakterauswahl, Arena-Art, spielbare Figuren, Pseudo-Tiefe, Angriffe, Mana, Ultimates, Projektile, mehrere Modi und Waves ergeben bereits ein klar erkennbares Spiel.

Zum Zeitpunkt des ursprünglichen Audits lag der größte Abstand zu professioneller Arcade-Qualität nicht in fehlender Inhaltsmenge, sondern in fünf Basisschichten:

1. **Charakter-Sheets sind nicht durchgehend stabil verankert.** Besonders der Discount Wizard driftet stark innerhalb seiner Frames; beim Wombat ist die Drift sichtbar, beim Barbarian gibt es einzelne Ausreißer und starke Laufzeit-Skalierungen.
2. **Trefferereignisse sind nicht zentral synchronisiert.** Animation, Hitbox, VFX, Hitstop, Flash, Shake und später Audio folgen noch keinem gemeinsamen Event-Zeitstrahl.
3. **Hitboxen und Hurtboxen sind zu statisch.** Ein Rechteck pro Angriff und eine unveränderte Hurtbox pro Figur reichen für den Prototyp, aber nicht für präzises, nachvollziehbares Kampfgefühl.
4. **Feedback ist teilweise zu großflächig oder zu lang.** Der aktuelle Ganzkörper-Tint im Hitstun und beim Air Attack erklärt einen Teil der wahrgenommenen Farbwechsel.
5. **Crowd Combat und defensive Entscheidungen fehlen noch.** Waves existieren technisch, aber Gegnerkoordination, Knockdown/Wakeup, Schutzfenster und klare Rollen fehlen.

Die richtige Strategie lautet deshalb:

> **Zuerst einen kleinen Combat-Gym- und Asset-QA-Prozess aufbauen, dann einen einzigen Kampf vollständig polieren. Erst danach neue Stages, Figuren oder Meta-Systeme produzieren.**

**Status nach BULK 0/0,5/1/2:** Combat Gym, zentrale Timeline-/Resolver-/Feedback-Bausteine, Input Buffer, Character-Asset-Pipeline sowie phasen- und zustandsabhängige Boxprofile mit präzisem Kontaktpunkt sind umgesetzt. Charakter-Root, Clipping, Wizard-Farbidentität und Collision-Grundmodell sind nicht mehr die aktiven Hauptblöcke. Der größte aktuelle Qualitätshebel ist BULK 3: vollständige Hit-Confirm-/Impact-Abstimmung; danach folgen VFX-/Audio-Sprache und defensive Combat States.

---

## 2. Empfohlenes Produktziel

### Primäre Identität

**Mobile-first 2.5D Arcade Brawler mit kurzen Sessions, klaren Charakterrollen und überzeichnetem Impact.**

- Pseudo-Tiefe wie bei klassischen Beat-'em-ups
- wenige, gut lesbare Aktionen statt großer Fighting-Game-Movelist
- charakterstarke Spezialangriffe und Ultimates
- Waves und Stage Progression als Hauptmodus
- Duel als Trainings-, Versus- oder Balance-Modus
- sofort verständlich auf Touch, zusätzlich sauber spielbar mit Tastatur und Gamepad

### Nicht gleichzeitig anstreben

Das Projekt sollte nicht gleichzeitig ein vollwertiges 1v1-Frame-Data-Fighting-Game, ein großer RPG-Brawler und ein Online-Service-Spiel werden. Diese Ziele würden Combat Polish, Produktionsbudget und mobile Lesbarkeit auseinanderziehen.

### Empfohlenes Qualitätsziel für den ersten Release-Meilenstein

Ein **hochpolierter Junkyard-Vertical-Slice** mit:

- 2 vollständig bereinigten spielbaren Figuren
- 3 klar unterscheidbaren Gegnerarchetypen
- 1 Miniboss oder Boss
- 1 komplett inszenierter Stage-Verlauf
- 1 defensive Universalaktion
- kurzer Basic-Chain
- präzisen Hit-/Hurt-/Pushboxen
- vollständigem SFX-, VFX- und Trefferfeedback
- stabilen 60 FPS auf dem Ziel-Mobilgerät
- professioneller Touch-Bedienung und reduzierbaren Flash-/Shake-Optionen

---

## 3. Audit-Grundlage

Die Bewertung beruht auf:

- Sichtung der bestehenden Projekt- und Systemdokumentation
- Prüfung der Phaser-/TypeScript-/Vite-Struktur
- Prüfung von Kampf-, Figuren-, Input-, Projektil- und Szenenlogik
- Build-Prüfung
- visueller Prüfung von Menü, Charakterauswahl und Kampfszene im laufenden Spiel
- direkter Prüfung der Charakter- und VFX-Sheets
- Messung der sichtbaren Alpha-Flächen pro Animationsframe, insbesondere Mittelpunkt- und Fußlinien-Drift
- Abgleich mit vergleichbaren 2D-Brawlern und Phaser-Projekten

Die Pixelmessung ist ein Diagnosewerkzeug, kein Ersatz für eine Animation Review. Gemessen wurde die sichtbare, nicht transparente Fläche pro Frame. Große Waffen, Haare oder Effekte können den Schwerpunkt absichtlich verschieben; deshalb sind **Fußanker, Körperkern und Wahrnehmung im Loop** wichtiger als der reine Gesamt-Schwerpunkt.

---

## 4. Aktueller Projektstand

| Bereich | Aktueller Stand | Bewertung | Hauptlücke |
|---|---|---:|---|
| Identität und Art Direction | eigenes Wombat-/Underdog-Thema, starke Menüs und Hintergründe | stark | Figuren- und Effektqualität angleichen |
| Technische Basis | Phaser 4.1, TypeScript, Vite; Build, Typecheck und 23 Tests erfolgreich | gut | gezielte weitere Modulentkopplung, Asset-Ladeplan |
| Kernkampf | Startup/Active/Recovery, Input Buffer, zentraler Resolver, Hitstop, Knockback, Hitstun, Air Attack | gut für Pre-Alpha | Knockdown, Defense, Cancel-/Chain-Regeln |
| Collision | phasen-/zustandsabhängige Hit-/Hurt-/Pushboxprofile, Factions, explizite Lane-/Höhenreichweite und echter Kontaktpunkt | stark für Pre-Alpha | weitere Moves selektiv authored kalibrieren |
| Charaktere | 5 eigene Figuren plus Reference Fighter; 5/5 Body-Sheets bestehen harte QA-Gates | gute produktive Grundlage | dedizierte Air-/State-Abdeckung und native Layer-Master |
| Spezialangriffe/Ultimates | figurenspezifisch und visuell unterscheidbar | vielversprechend | genaue Kontakt-Synchronisierung und einheitlicher Feedback-Standard |
| Projektile | vorhanden, inklusive Impact-FX | brauchbar | Team/Faction-Regeln, Kontaktpunkt, einheitliche Hitprofile |
| Waves | drei kurze Waves vorhanden | technischer Beweis | Gegnerrollen, Koordination, Stage Beats, Boss |
| Mobile Controls | großer Joystick und vier Aktionen vorhanden | spielbar | HUD-Flächen, Kontext, Portrait, Desktop-Ausblendung |
| Audio | Assets teilweise vorhanden, aber kein fertiger Audio-Layer | kritisch offen | SFX, Musik, Mix, Haptik |
| QA | Combat Gym, Profiltelemetrie, Kontaktmarker, Frame Step, 23 Kernsystemtests, Loop-Vorschauen und Whole-Sheet-Asset-Gates | gute Grundlage | Capture-Automation, Performance-Messung und CI-Gates |
| Produktionsreife | umfangreiche Dokumentation | gut | Provenienz/Lizenzen, Modulentkopplung, Performance-Budgets |

### Technische Größenordnung

- Produktionsbuild erfolgreich
- JavaScript-Bundle zuletzt ungefähr **1,43 MB**, gzip ungefähr **372 KB**
- `dist` insgesamt ungefähr **56 MB**
- ungefähr **30 vorab geladene Assets** mit zusammen rund **13,9 MB**
- `BattleScene.ts` liegt nach BULK 0,5 bei rund 1.020 Zeilen; `Fighter.ts` bleibt ein größerer nächster Trennungskandidat
- Typecheck und 23 automatisierte Kernsystemtests sind vorhanden; ein Lint-Script und CI-Gates fehlen noch

Diese Werte sind noch kein Release-Blocker. Sie zeigen aber, dass der nächste Ausbau ohne Systemtrennung, Lazy Loading und wiederholbare Tests teurer und riskanter wird.

---

## 5. Was bereits gut ist und geschützt werden sollte

### 5.1 Klare visuelle Identität

- Der Titel und die Underdog-/Tierkämpfer-Idee sind merkfähig.
- Hauptmenü und Charakterauswahl wirken bereits wie ein echtes Spiel und nicht wie Debug-UI.
- Park- und Junkyard-Hintergründe erzeugen eine klare Welt.
- Figuren besitzen voneinander unterscheidbare Rollen und Silhouetten.

### 5.2 Sinnvolle Combat-Grundlage

- Angriffe besitzen bereits Startup-, Active- und Recovery-Phasen.
- Hurtbox, Pushbox und Hitbox sind getrennte Konzepte.
- Hitstop, Knockback, Hitstun und Camera Shake existieren.
- Pseudo-Z, Luftzustände und Air Attack sind vorhanden.
- Mana, Specials, Ultimates und Projektile sind nicht nur geplant, sondern implementiert.

Diese Basis sollte **gezielt verfeinert und datengetriebener gemacht**, nicht ersetzt werden.

### 5.3 Gute Richtung bei figurenspezifischen Effekten

- Wombat Earthshaker besitzt eine klare schwere Identität.
- Wizard-FX haben eine eigene Magie-Farbwelt.
- Barbarian Axe Rain kombiniert Warnfläche, Projektil und Einschlag.
- Ultimates sind deutlich größer und spezieller als normale Angriffe.

Das Problem ist nicht Ideenmangel. Es fehlt ein gemeinsamer Timing-, Größen-, Farb- und Kontaktstandard.

### 5.4 Gute Voraussetzungen für professionelles Debugging

- Hitbox-, Hurtbox- und Pushbox-Debuggrafiken sind bereits vorhanden.
- Kampfwerte sind weitgehend als Daten definiert.
- Test- und Duel-Modi eignen sich als Grundlage für ein Combat Gym.

---

## 6. Kritische Befunde

### 6.1 Charakter-Sheets: Jitter und Farbwechsel — Audit-Baseline

Die folgenden Messungen dokumentieren die ursprüngliche Baseline. Sie sind für Ursachenanalyse und Regressionen erhalten; der aktuelle Stand nach BULK 1 steht in Abschnitt „Umsetzungsstatus“ und in `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md`.

#### Gemessene Frame-Stabilität

| Figur / Animation | Gemessene sichtbare Drift | Einschätzung |
|---|---:|---|
| Wombat Idle | ca. 9 px horizontal, Fußlinie stabil | sichtbar; Körper wandert im Standloop |
| Wombat Walk | ca. 6 px horizontal, ca. 3 px Fußlinienänderung | muss normalisiert werden |
| Angry Pigeon Idle | ca. 6 px horizontal, ca. 2 px vertikal | leicht bis mittel |
| Angry Pigeon Walk | nahezu stabil | gute interne Referenz |
| Discount Wizard Idle | ca. 26,5 px horizontal | schwerer Jitter |
| Discount Wizard Walk | ca. 25 px horizontal | schwerer Jitter |
| Budget Barbarian Idle | ca. 0,5 px, Fußlinie stabil | sehr gut |
| Budget Barbarian Walk | ein Ausreißer von ca. 9,5 px | einzelner problematischer Frame/Framefolge |
| Buster Bulldog Idle/Walk | ca. 0,5 px, Fußlinie stabil | beste aktuelle Normalisierung |

#### Figurenspezifisches Urteil

##### Discount Wizard — Priorität P0

- stärkste horizontale Drift im gesamten Roster
- Hutdetails, violette Flächen und andere Farbakzente sind zwischen Frames nicht stabil
- Körpergröße und Schwerpunkt verändern sich wahrnehmbar
- Körperanimation und Effektanteile sind teilweise zu eng gekoppelt
- es fehlen hochwertige, eigenständige Jump-/Fall-/Landing-/Air-Attack-Abdeckungen

**Folge:** Die Figur wirkt trotz guter Idee generiert bzw. zusammengesetzt und nicht wie aus einem kontrollierten Animationssatz.

##### Wombat — Priorität P0/P1

- Idle und Walk wandern nach links
- Fußlinie im Walk verändert sich leicht
- Attack- und Special-Frames verändern sichtbaren Mittelpunkt und Körperhöhe stark
- beim Air Bonk ist der Bodeneinschlag in die Körperanimation eingebrannt; Körperpose und Impact können deshalb nicht unabhängig getimt werden
- Laufzeit-Offsets kompensieren Symptome, aber nicht die eigentliche Sheet-Qualität

**Folge:** Als Hauptfigur fällt selbst moderater Jitter besonders auf.

##### Budget Barbarian — Priorität P1

- das neue 160er Sheet ist strukturell deutlich besser als die älteren Sheets
- Idle, Basic und Special sind sehr sauber zentriert
- ein Walk-Frame driftet deutlich
- Laufzeit-`frameScaleSets` enthalten starke Größenunterschiede; ein sehr großer Scale-Wert erzeugt sichtbares „Poppen“, selbst wenn der PNG-Anker korrekt ist
- manche Animationsfolgen wirken durch Wiederverwendung/Duplikate unruhig

**Folge:** Gute Basis, die mit wenig gezielter Arbeit produktionsreif werden kann.

##### Buster Bulldog — Priorität P2

- aktuell stabilstes Haupt-Sheet
- Mittelpunkt, Fußlinie und Palette sind im Idle/Walk sehr konstant
- eignet sich als Qualitätsreferenz für Sheet-Normalisierung
- benötigt trotzdem dedizierte Jump-/Fall-/Landing-Zustände und eine Prüfung des Air-Bonk-Größenverlaufs

##### Angry Pigeon — Priorität P2

- Walk ist überraschend stabil und gut lesbar
- Idle hat leichte Drift
- als Gegner sind Telegraphie, Trefferreaktion und Zustandslesbarkeit wichtiger als zusätzliche Effektmenge

#### Hauptursachen der wahrgenommenen Farbwechsel

1. **Sheet-Inkonsistenz:** Vor allem beim Wizard ändern sich Farbakzente und Flächen zwischen den Frames.
2. **Ganzkörper-Tint im Code:**
   - kurzer Trefferflash: hellgelb
   - gesamter Hitstun: rosa/rot
   - gesamter Air-Attack-Zustand: gelb
3. **Eingebackene VFX:** Große, helle Effektflächen verschieben Durchschnittsfarbe und Silhouette des Frames.
4. **Starke Laufzeit-Skalierung:** Ein Größenwechsel verändert auch die wahrgenommene Farb- und Detaildichte.

Der aktuelle Hitstun-Tint kann mehrere hundert Millisekunden bestehen. Das ist lang genug, um wie ein echter Farbfehler statt wie ein kurzer Impact-Flash zu wirken.

---

### 6.2 Hitboxen, Hurtboxen und Pushboxen

#### Was bereits vorhanden ist

- getrennte Hit-, Hurt- und Pushboxen
- Angriffsphasen Startup, Active und Recovery
- Debug-Overlay
- richtungsabhängige Weltpositionen
- Luftangriff und Projektile

#### Ursprüngliche Grenzen vor BULK 2

Diese Baseline ist mit dem Abschluss von BULK 2 systemisch adressiert. Der umgesetzte Stand und die bewusste schrittweise Move-Kalibrierung stehen in `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md`.

- jeder Nahkampfangriff verwendet im Active-Fenster im Wesentlichen **ein statisches Rechteck**
- die Hurtbox einer Figur bleibt weitgehend gleich, unabhängig von Pose und Zustand
- die Pushbox ist ebenfalls statisch
- unterschiedliche aktive Animationsframes besitzen keine Early-/Late-Hitboxen
- mehrere räumliche Trefferbereiche pro Move sind nicht als allgemeines Datenmodell angelegt
- Treffer-VFX werden nicht am tatsächlichen Schnittpunkt von Hitbox und Hurtbox positioniert
- der universelle Air Bonk verwendet größenmäßig denselben Boxansatz für sehr unterschiedliche Figuren
- große Angriffe wie Earthshaker können visuell und räumlich weiter reichen als der wahrgenommene Kontakt
- Axe-Rain-Trefferflächen und Effektlogik liegen teilweise als spezielle Szenenlogik vor
- Projektile benötigen explizite Team-/Faction-Regeln, damit spätere Gegner- oder Koop-Szenarien kein unbeabsichtigtes Friendly Fire erzeugen

#### Professioneller Zielzustand

Kein Pixel-Perfect-Collision-System und keine komplexen Polygone. Für diesen Stil sind wenige, gut gepflegte AABBs besser:

- **Hurtbox-Profile:** `standing`, `moving`, `airborne`, `hit`, `knockdown`
- **Pushbox-Profile:** primär geerdet, kleiner als die Hurtbox, im Knockdown deaktiviert oder stark reduziert
- **Hitbox-Phasen:** bei Bedarf `early`, `main`, `late`
- **mehrere Boxen nur bei Bedarf:** beispielsweise Körper + Welle, Faust + Schulter oder linker/rechter Einschlag
- **Z-Akzeptanz:** klare Toleranz pro Angriff, damit Tiefe nachvollziehbar bleibt
- **Kontaktpunkt:** Mittelpunkt der tatsächlichen Überlappungsfläche, nicht pauschal Gegnerzentrum
- **ein Treffer pro Ziel und Attack-Instanz**, außer ein Move ist explizit als Multi-Hit definiert

#### Grundregel

> Die Boxen sollen die beabsichtigte Spielentscheidung abbilden, nicht jede sichtbare Pixelkante.

Ein Punch darf leicht großzügig sein. Er darf aber weder deutlich hinter dem Arm treffen noch durch fehlende Z-Nähe „magisch“ verbinden.

---

### 6.3 Combat Feel und Treffer-Synchronisation

#### Aktueller Ablauf

Die Systeme für Schaden, Hitstun, Knockback, Hitstop, Shake, Tint und einzelne Impact-FX existieren. Sie werden jedoch noch nicht durch ein einheitliches „Hit Confirm“-Ereignis und einen gemeinsamen Move-Zeitstrahl orchestriert.

#### Sichtbare Probleme

- Eingaben werden vor dem Hitstop-Return gelesen; dadurch können kurze Taps während Hitstop verloren gehen.
- Es gibt noch keinen verlässlichen 80–150-ms-Input-Buffer.
- Hitstop ist grob schadensabhängig; Earthshaker besitzt eine Sonderbehandlung von nur 24 ms, während andere schwere Treffer 100 ms erhalten.
- Ganzkörper-Hitstun-Tint ist zu lang.
- Camera Shake ist primär schadensbasiert statt move-spezifisch und richtungsbewusst.
- viele Nahkampftreffer besitzen keinen eigenen universellen Hit Spark.
- Whiff-, Block- und Hit-Situationen haben noch keine klar getrennten Feedback-Pakete.
- Screen Shake und VFX können den Kontakt verstärken, aber sie können einen schlecht getimten Treffer nicht retten.

#### Zielablauf pro Angriff

1. **Anticipation:** Pose, kurzer Whoosh oder Bodenhinweis kündigen die Aktion an.
2. **Commit:** die Figur bindet sich sichtbar an den Angriff.
3. **Active:** Hitbox und aktiver Animationsframe beginnen gemeinsam.
4. **Contact:** tatsächlicher Treffer löst exakt einmal Hit Spark, SFX, Hitstop, Knockback, Flash und ggf. Shake aus.
5. **Consequence:** Gegnerpose und Bewegungsreaktion machen Gewicht und Richtung verständlich.
6. **Recovery:** der Angreifer ist für eine klar lesbare Zeit verwundbar oder wieder handlungsfähig.

#### Empfohlene Startbereiche für Hitstop

Diese Werte sind Ausgangspunkte, keine endgültigen Balancewerte:

| Trefferklasse | Startbereich |
|---|---:|
| Light | 35–50 ms |
| Medium | 50–75 ms |
| Heavy | 80–110 ms |
| Ultimate/Finisher | 100–140 ms |

Auf Mobilgeräten muss geprüft werden, ob lange Pausen wie Ruckler wirken. Ein Input-Buffer ist Pflicht, bevor Hitstop stark erhöht wird.

---

### 6.4 VFX-Audit

#### Wombat Earthshaker

- starke Idee und gute schwere Silhouette
- das FX-Sheet beginnt visuell bereits mit einem sehr großen, hellen Einschlag und läuft danach aus
- der Effekt wird aktuell schon beim Angriffsstart erzeugt
- dadurch kann der stärkste VFX-Moment vor dem eigentlichen aktiven Trefferfenster erscheinen
- derselbe Effekt wird zusätzlich als Impact verwendet

**Empfehlung:** Anticipation und Impact trennen. Startup erhält Staub, Bodenkompression oder Energieaufbau. Der große Ring/Crater startet exakt beim Active-Beginn oder bestätigten Kontakt. Danach Decay und Boden-Decal.

#### Wombat Air Bonk

- mittlerer Frame kombiniert Körperpose und Bodeneinschlag
- die sichtbare Fläche und der Schwerpunkt springen stark

**Empfehlung:** Körper-Sheet ohne Bodeneffekt; separater Air-Bonk-Impact am Kontaktpunkt. Körperanker bleibt am Character Root, Bodeneffekt liegt auf der Arena-Ebene.

#### Discount Wizard

- gute, eigene Farbidentität
- Fireball, Dust/Impact, Miscast, Teleport und Ultimate sind klar unterscheidbar
- einige Frames sind sehr hell und gesättigt
- kleine 64er FX können bei realer Mobile-Skalierung an Lesbarkeit verlieren
- Körperpalette und VFX-Palette vermischen sich teilweise

**Empfehlung:** Körperfarben sperren, Magie-FX separat halten, Hot-White-Fläche begrenzen und Effekte bei Zielauflösung testen. Kern hell, Rand farbig, kurze Lebensdauer, keine dauerhafte Überdeckung der Figur.

#### Budget Barbarian Axe Rain

- Warnellipse plus fallende Äxte ist bereits ein gutes Telegraphie-Muster
- Fall, Impact und steckenbleibende Axt ergeben eine verständliche Sequenz

**Empfehlung:** Warnzeit, aktive Box und exakter Impact-Frame in einem Move-Timeline-Datensatz verbinden. Einschlag erhält gerichteten Staub, kurzen Bodenring und einen klaren Heavy-SFX-Layer.

#### Allgemeine VFX-Lücken

- kein universelles Set für Light-/Medium-/Heavy-Hit-Sparks
- keine konsistente Whiff-Trail-/Whoosh-Sprache
- kein standardisiertes Landungs-, Dash-, Knockdown- und Getup-Dust
- Effektgrößen und Helligkeit folgen noch keinem mobilen Screen-Coverage-Budget
- Effekte werden nicht konsequent gepoolt
- kein globaler „Reduce Flash“-/„Reduce Shake“-Pfad

---

### 6.5 Mobile UX und Darstellung

#### Aktuelle Stärken

- Aktionen sind groß und klar farbcodiert.
- Joystick und Kampfbuttons sind sofort verständlich.
- die Landschaftsausrichtung nutzt die Arena sinnvoll.

#### Aktuelle Probleme

- Touch-Bedienelemente bleiben auch in Desktop-Tests sichtbar.
- Joystick und vier Action Buttons belegen große Teile der unteren Spielfläche.
- im Hochformat wird das Spiel sehr klein und letterboxed; Kampfdetails gehen verloren.
- Menü-Button und linker Eingabebereich überlappen logisch: Der Pointer-Handler ordnet die gesamte linke Hälfte zuerst dem Joystick zu und kehrt zurück, bevor der Menü-Button geprüft wird. Dadurch kann der sichtbare Menü-Button auf Touch unerreichbar sein.
- HUD und Menü liegen im oberen linken Bereich eng beieinander.
- vier gleichzeitige Aktionsbuttons sind für kurze Sessions verständlich, aber teuer in Blickweg und Daumenreichweite.

#### Ziel

- Landscape als klar kommunizierte Zielausrichtung
- Safe-Area-Unterstützung
- Touch-UI nur auf Touchgeräten bzw. nach Eingabemodus
- Menü-Eingabe vor Joystick-Bereich priorisieren
- Buttons nach Verfügbarkeit und Kontext visuell differenzieren
- Ultimate erst dann dominant, wenn verfügbar
- Joystick- und Button-Opacity im Stillstand reduzieren
- HUD nicht durch Finger oder Touchflächen verdecken

---

### 6.6 Crowd Combat und Spieldesign

Waves sind vorhanden, aber hochwertiges Beat-'em-up-Gefühl entsteht nicht dadurch, dass alle Gegner gleichzeitig zum Spieler laufen.

Es fehlen vor allem:

- Engagement Slots um den Spieler
- Attack Coordinator mit begrenzter Zahl gleichzeitiger Angreifer
- Gegnerrollen: Grunt, Flanker/Rusher, Ranged/Controller, Heavy
- Enemy-vs-Enemy-Pushboxen oder eine andere robuste Entflechtung
- Knockdown, Getup und kurze Invulnerability
- eine universelle defensive Entscheidung, empfohlen: kurzer Dodge oder Guard
- klarer Basic-Chain mit wenigen, gut lesbaren Schritten
- Crowd-Control- vs. Single-Target-Entscheidungen
- Combo-/Style-/Score-Rückmeldung
- Mana, das primär durch aktives gutes Spiel verdient wird, statt nur verfügbar zu sein

---

## 7. Vergleichbare Spiele und übertragbare Lehren

| Referenz | Vergleichbarkeit | Übertragbare Punkte | Nicht blind übernehmen |
|---|---|---|---|
| Little Fighter 2 | 2D-Brawler mit Tiefe, MP-Specials, Items, mehrere Modi | einfache Inputs, Defense, Jump/Attack-Kombinationen, Stage-/VS-Struktur, Weapons/Items als Abwechslung | ungefiltertes Chaos und sehr große Systembreite |
| Phaser 4 Beat-'em-up Tutorial | nahezu gleiche Webtechnik und Genre-Grundlage | Waves, Progression, Partikel, SFX/Musik, Shake, Freeze, Flash als vollständiger Feedback-Stack | Tutorial-Architektur als finale Produktionsarchitektur |
| Teen Titans Go: Slash of Justice | veröffentlichter Phaser-Brawler | mehrere Figuren, Level, Gegnerwellen, Bosse, Combo-getriebene Fähigkeiten | lizenz- und contentgetriebene Breite vor Polish |
| Phaser Street-Fighter-Clone | ähnliche Technik, 1v1-Fokus | Light/Heavy, Blocking, Energy, Combo-Regeln, Runden/Timer, Charakter-Gym und JSON-Tuning | die volle Komplexität eines kompetitiven Fighting Games |
| Streets of Rage 4 | modernes Referenzniveau für 2D-Brawler | klarer Impact, Crowd Spacing, charakteristische Movesets, Stage Rhythmus | Contentmenge und Animationsbudget eines großen Teams |
| TMNT: Shredder's Revenge | moderner zugänglicher Arcade-Brawler | sofortige Lesbarkeit, Koop-taugliche Crowd-Regeln, starke Telegraphie und kurze Sessions | sechsfacher Content- und Koop-Scope als frühes Ziel |
| River City Girls 2 | moderner Character-Brawler | Persönlichkeit, Hit Reactions, zugängliche Tiefe, Stage-/Encounter-Abwechslung | RPG-/Meta-Ausbau vor stabilem Core Combat |

### Wichtigste Schlussfolgerung aus den Vergleichen

Die Phaser-Beispiele zeigen, dass die Technik für ein hochwertiges Web-Brawler-Erlebnis ausreicht. Die Qualitätsdifferenz entsteht durch **Authoring, Timing, Feedback, Gegnerregie, Audio und QA**, nicht durch einen Enginewechsel.

---

## 8. Priorisierte Umsetzungsblöcke

Die Reihenfolge ist absichtlich streng. Ein Block darf teilweise parallel vorbereitet werden, aber sein Abnahmekriterium muss erfüllt sein, bevor breite neue Content-Produktion startet.

### BULK 0 — Wahrheit schaffen: Combat Gym, Messbarkeit und Scope Freeze

**Priorität:** P0 — sofort
**Ziel:** Jede Animation und jeder Treffer kann reproduzierbar analysiert, aufgenommen und verglichen werden.

#### Arbeitspakete

- vorhandenen Test-Modus zu einem **Combat Gym** ausbauen
- Fighter, Move, Gegner, Distanz, Z-Abstand und Mana auswählbar machen
- Pause, Frame Step und feste Slow-Motion-Stufen bereitstellen
- Hit-/Hurt-/Pushboxen mit Legende ein-/ausblendbar machen
- aktuellen Move, State, Phase, Animationsframe, Zeit im Move und Boxprofil anzeigen
- Dummy-Optionen: still, blockend, invulnerable, wiederholtes Angreifen, Knockdown-Test
- feste Capture-Presets für 16:9 Desktop, Ziel-Smartphone Landscape und kleines Smartphone
- pro Move eine Referenzaufnahme mit und ohne VFX/Shake erzeugen
- neue Figuren, Stages und Meta-Systeme bis zur Abnahme von BULK 3 zurückstellen

#### Abnahmekriterien

- jeder Move lässt sich innerhalb von höchstens 15 Sekunden reproduzieren
- Active-Beginn und Impact-Frame sind im Frame Step eindeutig sichtbar
- Boxen und Animation können ohne produktive UI beurteilt werden
- ein Vorher-/Nachher-Clip kann mit identischen Bedingungen erstellt werden
- 60-FPS-Framezeit ist im Testprofil sichtbar oder protokollierbar

---

### BULK 0,5 — Architektur absichern, bevor Asset- und Combat-Daten wachsen

**Priorität:** P0 — abgeschlossen 2026-09-01
**Ziel:** Die gefährlichsten Kopplungen vor dem Polish-Ausbau trennen, ohne das Spiel in einem Big-Bang-Refactor neu zu schreiben.

#### Umgesetzt

- reine Move-Timeline als gemeinsame Quelle für Startup, Active, Recovery und Feedbackklasse
- reine Kontaktauflösung für Treffer, Guard, Invulnerability, Kontaktpunkt und radialen Knockback
- zentraler Input Buffer und zentraler Hitfeedback-/Hitstop-Controller
- getrennte Präsentationscontroller für Move-Start-Cues, Ultimates, Casts und Impact-FX
- zentrale Animationsregistrierung für Battle und Character Select
- isolierte Combat Clock, Combat-Gym-Einstellungen und Mobile-Control-Hit-Tests
- automatisierte Tests für die extrahierten Regeln
- Dev-only Diagnosezustand für reproduzierbare Browser-Abnahmen

#### Bewusst nicht als Big Bang umgesetzt

- `Fighter` wird nicht vollständig in State-, Visual- und Box-Komponenten zerlegt, solange BULK 2/3 die benötigten Datenformen noch definiert.
- Waves und Encounter Director bleiben unangetastet, bis der Combat-Vertical-Slice stabil ist.
- Spezialangriffe dürfen eigene Präsentationscontroller besitzen; ihre Trefferregeln dürfen nicht zurück in szenenspezifische Sonderfälle wandern.

#### Abnahmekriterien

- neue Standard-Move-Timings können in Daten statt in `BattleScene` beschrieben werden
- Nahkampf, Projektile und spezielle AoE-Treffer liefern einheitliche Outcomes
- Combat Gym und Kernregeln sind unabhängig von der Phaser-Darstellung testbar
- Typecheck, Tests und Produktionsbuild laufen reproduzierbar

---

### BULK 1 — Charakter-Sheets normalisieren und Farbidentität sperren

**Priorität:** P0
**Ziel:** Kein ungewolltes Wandern, Skalieren oder Farbflackern im Körper-Sprite.
**Status:** Abgeschlossen am 2026-09-02; Umsetzung und Abnahme siehe `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md`.

#### Reihenfolge

1. Discount Wizard vollständig bereinigen
2. Wombat als Hauptfigur bereinigen
3. Budget Barbarian Walk-Ausreißer und Scale Pops beseitigen
4. Buster Bulldog als Referenzstandard dokumentieren und Animationslücken schließen
5. Angry Pigeon Idle und Gegnerreaktionen bereinigen
6. Reference Fighter vor einem öffentlichen Release ersetzen oder entfernen, sofern Provenienz/Lizenz nicht eindeutig produktionsgeeignet ist

#### Verbindlicher Sheet-Standard

- ein kanonischer Canvas pro Figur
- fester Fußanker: Mittelpunkt zwischen den belasteten Füßen auf einer definierten Ground Line
- fester Character Root unabhängig von Waffen- oder Effekt-Ausdehnung
- Körperkern bleibt in Idle/Walk innerhalb enger Toleranz
- beabsichtigte Vorwärtsbewegung wird als Root Motion oder klarer Laufzeit-Offset beschrieben, nicht zufällig ins Frame gebacken
- Body und VFX werden separat exportiert
- feste Farbpalette pro Figur mit benannten Swatches
- keine wechselnden Accessoire-Farben, Muster oder Materialwerte
- keine abgeschnittenen Alphapixel am Framerand
- keine starken Laufzeit-Scale-Korrekturen als dauerhafte Reparatur eines instabilen Sheets
- Vorschau bei tatsächlicher Ingame-Größe, gespiegelt und auf hellem/dunklem Hintergrund

#### Messbare Asset-Gates

| Prüfung | Zielwert |
|---|---:|
| Idle-/Walk-Fußlinien-Drift | höchstens 1 px im Quellframe |
| unbeabsichtigte Körperkern-Drift | höchstens 2 px |
| unbeabsichtigte Körperhöhenänderung | höchstens 2–3 % |
| Runtime-Scale-Korrektur | im Normalfall innerhalb ±5 % |
| sichtbare Alphapixel am Rand | 0 |
| ungeplante Palettenabweichung an festen Kostümteilen | 0 |
| eingebettete Kontakt-VFX im Body-Sheet | 0, außer bewusst untrennbares Character FX |

#### Professioneller Produktionsablauf

1. Master-Palette und Character Turnaround festlegen.
2. Füße, Hüfte, Brust und Kopf als Kontrollpunkte markieren.
3. Frames auf Fußanker und Körperkern ausrichten.
4. Scale und Proportionen angleichen.
5. Kostümfarben gegen Master-Palette prüfen.
6. Baked FX in eigene Sheets/Layers trennen.
7. Animation zehn Sekunden loopen; vorwärts und gespiegelt prüfen.
8. Attacken bei 0,25x Geschwindigkeit prüfen.
9. tatsächliche Mobile-Größe prüfen.
10. erst nach bestandenem Gate in Runtime-Konfiguration übernehmen.

#### Abnahmekriterien

- Idle- und Walk-Loops wirken zehn Sekunden lang stabil
- keine Figur „atmet“ durch Scale-Sprünge, sofern das nicht animiert beabsichtigt ist
- Farbflächen bleiben zwischen Frames identisch
- Hitflash ist klar von normaler Figurenpalette unterscheidbar
- Runtime-Offsets werden nur für beabsichtigte Pose-/Move-Anpassung verwendet
- Wombat und Wizard bestehen die Mess- und Loop-Prüfung vor weiteren Skins oder Animationen

---

### BULK 2 — Hitbox-/Hurtbox-/Pushbox-System professionalisieren

**Priorität:** P0
**Ziel:** Treffer fühlen sich großzügig, aber niemals zufällig oder visuell getrennt an.
**Umsetzungsstatus:** abgeschlossen am 2026-09-02; Referenz-Authoring und Abnahme siehe `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md`.

#### Arbeitspakete

- Boxdaten an einen gemeinsamen Move-Zeitstrahl binden
- Early-/Main-/Late-Active-Profile unterstützen
- Hurtbox-Profile für Standing, Moving, Airborne, Hit und Knockdown definieren
- Pushbox im Bodenraum vereinheitlichen
- Enemy-vs-Enemy-Entflechtung definieren
- Z-Reichweite pro Angriff explizit machen
- tatsächlichen Überlappungs-Mittelpunkt als Kontaktpunkt berechnen
- Multi-Hit-Regeln und „ein Treffer pro Attack-Instanz“ absichern
- Projectile Ownership/Faction explizit machen
- Spezialfälle wie Earthshaker und Axe Rain in dieselbe Datenlogik überführen
- Air Bonk figurenspezifisch prüfen, statt eine Box blind auf alle Silhouetten anzuwenden

#### Box-Authoring-Regeln

- maximal so wenige Boxen wie nötig
- Hände/Waffen dürfen etwas großzügiger sein als sichtbare Pixel
- Körperangriffe brauchen passende Self-Hurtbox-/Pushbox-Entscheidungen
- keine Hitbox hinter dem Angreifer, wenn der Move visuell nur nach vorn wirkt
- bei großen AOE-Angriffen muss der Bodenindikator die echte aktive Fläche abbilden
- Knockdown-Körper darf keine stehende Hurtbox behalten
- Lufttreffer benötigen nachvollziehbare Z- und Y-Toleranz

#### Abnahmekriterien

- alle Treffer bei 0,25x wirken räumlich plausibel
- kein sichtbarer Whiff verursacht Schaden
- kein klarer Kontakt verfehlt ohne verständlichen Grund
- Warnflächen großer Angriffe entsprechen der schädlichen Fläche
- Boxprofilwechsel treten exakt am geplanten Animationsframe auf
- Gegner blockieren und stapeln sich nicht unlesbar ineinander

#### Abschlussnotiz

Die System- und Vertical-Slice-Abnahme ist erfüllt. Wombat Jab und Belly Slam bilden die Early-/Main-/Late-Referenz; Wombat Air Bonk, Budget Axe Rain, Projectiles und Fighter-State-Profile belegen die übrigen Pfade. Noch nicht einzeln kalibrierte Moves verwenden kompatibel ihre bisherige Box als `main`-Profil und werden nur bei visuellem Bedarf weiter authored.

---

### BULK 3 — Trefferkern: Input Buffer, Hit Confirm und Impact-Orchestrierung

**Priorität:** P0/P1
**Ziel:** Ein Treffer besitzt einen einzigen, deterministischen Kontaktmoment, an dem alle Feedbackschichten hängen.
**Umsetzungsstatus:** aktiv; Input Buffer, zentraler Resolver, Feedback-Policy, Hitstop und Kontaktpunkt sind als Grundlage vorhanden. Offen ist vor allem die vollständige move-spezifische Orchestrierung aus Spark, kurzem Flash, Shake, SFX und optionaler Haptik.

#### Empfohlenes Move-Timeline-Modell

Jeder Move beschreibt mindestens:

- Startup, aktive Fenster, Recovery
- verwendete Animationsframes oder normalisierte Animationszeit
- Boxprofil pro aktivem Fenster
- Whiff-Events: Whoosh, Trail, Footstep, Cast
- Hit-Confirm-Profil: Schaden, Hitstun, Hitstop, Knockback, Flash, Shake, SFX, VFX
- Block-Confirm-Profil, sobald Guard existiert
- Cancel-Fenster und erlaubte Folgeaktionen
- Ressourcenverbrauch und Ressourcenaufbau

#### Arbeitspakete

- 80–150-ms-Input-Buffer einführen und mit Hitstop testen
- Input nicht durch globalen Hitstop verlieren
- zentrales `HitConfirm`-Ereignis als einzige Quelle für Impact-Feedback definieren
- Light-, Medium-, Heavy- und Ultimate-Hitprofile anlegen
- Hitstop pro Move/Profil statt durch reine Schadensschwelle steuern
- attacker- und defenderbezogene Reaktionen getrennt definieren
- Ganzkörper-Hitstun-Tint durch einen kurzen 40–70-ms-Flash ersetzen
- permanenten gelben Air-Attack-Tint entfernen; Luftzustand über Pose, Trail oder Schatten lesen lassen
- Shake als kurzes, move-spezifisches und möglichst gerichtetes Profil definieren
- Hit Spark am Kontaktpunkt erzeugen
- Whiff, Hit, Block, Armor und Invulnerable visuell/akustisch unterscheiden
- SFX und optionale Haptik an dieselben Events binden

#### Empfohlene Tuning-Reihenfolge pro Move

1. Animation und Boxen ohne VFX, Audio und Shake
2. Startup/Active/Recovery
3. Hitstun, Knockback und Gegnerreaktion
4. Hitstop
5. Hit Spark und Trail
6. SFX
7. Camera Shake und Flash zuletzt
8. Mobile-Test mit echten Touch-Eingaben

#### Abnahmekriterien

- Button-Taps während Hitstop gehen nicht verloren
- VFX, SFX und Boxkontakt liegen im selben wahrgenommenen Frame
- Light und Heavy sind auch ohne Schadenszahl unterscheidbar
- ein Whiff erzeugt niemals Impact-Spark oder Impact-Sound
- Hitstun verändert die Charakterfarbe nicht dauerhaft
- Screen Shake kann reduziert/deaktiviert werden, ohne dass der Treffer unlesbar wird

---

### BULK 4 — Einheitliche VFX-Sprache und Effektbibliothek

**Priorität:** P1
**Ziel:** Effekte verstärken Information und Charakter, ohne Figuren oder Arena zu verdecken.

#### VFX-Schichten

1. **Anticipation:** Charge, Warning, Windup Dust
2. **Motion:** kurze Trails, Whooshes, Speed Lines
3. **Contact:** Hit Spark, Block Spark, Armor Spark
4. **Consequence:** Dust, Debris, Shock Ring, Knockdown Puff
5. **Persistence:** kurze Decals, Rauch, Magiereste; sparsam und performancebewusst

#### Basisbibliothek

- Light Hit Spark
- Medium Hit Spark
- Heavy Hit Spark
- Block Spark
- Armor/No-Sell Spark
- Magic Hit Spark
- Whiff Arc/Trail
- Landing Dust
- Knockdown Dust
- Getup Dust
- Wall/ground impact, falls später verwendet
- Mana Gain/Spend
- Ultimate Ready

#### Style Guide

- neutraler physischer Impact: warmes Weiß/Gelb mit kurzem farbigem Rand
- charakterspezifische Energie bleibt in klaren Signaturfarben
- Zentrum höchstens wenige Frames sehr hell
- Figurensilhouette darf bei normalen Treffern höchstens 2–3 Frames stark verdeckt werden
- große Ultimates dürfen mehr Screen Space nutzen, brauchen aber klare Telegraphie
- kein langer Vollbild-Flash
- Alpha, Blend Mode und Overdraw auf schwachem Mobilgerät prüfen
- Kontakt-VFX folgt dem Kontaktpunkt; Boden-VFX folgt der Ground Plane
- Body-Sheets und World-FX getrennt halten
- Partikelanzahl und Lebensdauer budgetieren; Objektpooling verwenden

#### Figurenspezifische Aufgaben

- Earthshaker in Anticipation, Impact und Decay zerlegen
- Wombat Air-Bonk-Bodeneffekt aus dem Body-Sheet trennen
- Wizard-Hot-White-Flächen und Sättigung begrenzen
- Wizard-FX bei kleiner Mobile-Auflösung vergrößern oder vereinfachen, nicht nur hochskalieren
- Axe Rain vollständig an Warning-/Impact-Timeline koppeln
- Buster Bash/Ultimate mit klarer Schulter-/Körperrichtung und schwerem Kontaktprofil versehen
- Pigeon-Angriffe mit kleinen schnellen Sparks statt großen Explosionen lesbar halten

#### Abnahmekriterien

- jeder Effekt besitzt eine Informationsfunktion
- kein normaler Angriff verdeckt Gegnerpose und Trefferreaktion
- Impact sitzt am tatsächlichen Kontaktpunkt
- alle Effekte sind auf Zielgerät bei voller Kampfdichte stabil
- Farbwelt der Figur bleibt trotz VFX wiedererkennbar
- Reduce Flash und Reduce Shake funktionieren vollständig

---

### BULK 5 — Gegnerregie, Defense und spielerische Kampftiefe

**Priorität:** P1
**Ziel:** Waves erzeugen Rhythmus und Entscheidungen statt Überlagerung und Button-Spam.

#### Arbeitspakete

- Attack Coordinator: nur 1–2 Gegner greifen gleichzeitig aktiv an
- Engagement Slots vor, hinter und seitlich des Spielers
- Rollen definieren:
  - Grunt: Basisdruck und leicht lesbare Angriffe
  - Flanker/Rusher: zwingt zu Bewegung
  - Ranged/Controller: verändert Positionierung
  - Heavy: langsame, klar telegraphierte Gefahr
- Knockdown, Getup und kurzes Schutzfenster
- eine Universal-Defense wählen:
  - bevorzugt kurzer Dodge mit klarer Recovery, oder
  - Guard mit Blockstun und Guard-Schaden
- 2–3-Schritt-Basic-Chain statt beliebig langer Combo
- Single-Target- und Crowd-Control-Moves klar trennen
- Mana durch Treffer, Risiko oder sauberes Spiel verdienen
- Combo/Style/Score als positives Ziel ergänzen
- Gegner-Angriffe über Animation, Farbe und SFX früh genug telegraphieren

#### Abnahmekriterien

- maximal definierte Zahl aktiver Angreifer wird eingehalten
- Spieler kann aus Einkesselung mit lesbarer Entscheidung entkommen
- Knockdown führt nicht zu unfairer Trefferkette beim Aufstehen
- Basic-Chain besitzt klaren Rhythmus und darf nicht durch stumpfes Mashen unendlich sicher sein
- jede Gegnerrolle ist ohne UI-Text an Verhalten und Silhouette erkennbar

---

### BULK 6 — Audio, Haptik, Mobile UX und Accessibility

**Priorität:** P1/P2
**Ziel:** Treffer funktionieren multisensorisch und die mobile Bedienung konkurriert nicht mit dem Spielbild.

#### Audio-Priorität

1. UI Confirm/Back
2. Light/Medium/Heavy Hit
3. Whiff/Whoosh
4. Block/Armor
5. Jump/Land/Knockdown
6. figurenspezifische Specials
7. Ultimate Charge/Release/Impact
8. Arena Ambience
9. Music Loop und Ergebnis-Jingle

#### Audio-Regeln

- jeder Treffer besteht bei Bedarf aus Body, Material und Character Layer
- keine fünf lauten Samples gleichzeitig ohne Voice-Limit
- leichte Treffer kürzer und heller, schwere tiefer und mit längerem Tail
- Hitstop und Impact-Sound müssen zeitlich gemeinsam wahrgenommen werden
- Musik duckt bei großen Ultimates nur kurz und subtil
- Lautstärkegruppen: Master, Music, SFX

#### Mobile/Accessibility

- Touch-UI abhängig vom Eingabegerät anzeigen
- Menü-Hit-Test vor Joystick-Hit-Test ausführen
- Safe Areas und verschiedene Seitenverhältnisse prüfen
- Landscape-Hinweis bei Portrait
- frei skalierbare oder mindestens zwei UI-Größen anbieten
- Ultimate-Button erst bei Relevanz stärker hervorheben
- Vibration optional und kurz; keine Dauerhaptik
- Reduce Flash
- Reduce Shake
- optional hohe UI-Kontraste und farbunabhängige Zustandsanzeigen

#### Abnahmekriterien

- Treffergewicht ist mit ausgeschaltetem VFX noch akustisch unterscheidbar
- Audio clippt nicht bei mehreren Gegnern
- Menü ist auf Touch immer erreichbar
- Spielfigur und Gegner bleiben trotz Daumenflächen lesbar
- Portrait wird nicht als winzige spielbare Arena präsentiert, sondern klar behandelt

---

### BULK 7 — Ein vollständiger Junkyard Vertical Slice

**Priorität:** P2
**Ziel:** Eine kurze Session erreicht durchgehend Release-Qualität und dient als Produktionsvorlage.

#### Inhalt

- Intro-Beat
- 3–5 Encounter mit unterschiedlicher Zusammensetzung
- mindestens ein räumlicher oder taktischer Stage Beat
- drei Gegnerrollen
- ein Miniboss oder Boss mit klaren Phasen
- kurze Abschlusswertung
- Schwierigkeitsprofil mit Gegnerzahl, Aggression und Schaden statt nur HP-Aufblähung

#### Stage Rhythmus

1. Gegner einzeln vorstellen
2. bekannte Gegner kombinieren
3. räumlichen Druck erhöhen
4. kurze Erholung/Belohnung
5. Miniboss/Boss als Prüfung der gelernten Regeln

#### Abnahmekriterien

- komplette Session ohne Debugwissen verständlich
- keine Wave besteht nur aus „mehr vom Gleichen“
- jeder Gegner wird vor gefährlicher Kombination einzeln gelehrt
- Stage hat Anfang, Steigerung, Höhepunkt und Abschluss
- Performance- und Lesbarkeitsbudget hält im dichtesten Encounter

---

### BULK 8 — Architektur, Tests, Loading und Produktionssicherheit

**Priorität:** P2
**Ziel:** Weitere Inhalte können erstellt werden, ohne `BattleScene` und `Fighter` weiter zu überladen.

#### Arbeitspakete

- aus `BattleScene` extrahieren:
  - Combat Resolution
  - Move/VFX Event Timeline
  - Wave/Encounter Director
  - Ultimate-Speziallogik
  - Camera Feedback
- aus `Fighter` trennen:
  - Animation/Visual Controller
  - Combat State
  - Box Provider
  - Input/Action Buffer
- schema-validierte Fighter- und Move-Daten
- automatisierte Tests für:
  - Phasenwechsel
  - ein Treffer pro Attack-Instanz
  - Input Buffer
  - Mana-Verbrauch/-Aufbau
  - Knockdown/Getup/I-Frames
  - Team/Faction-Projektile
  - Mobile-Control-Hit-Tests
- visuelle Asset-Gates für Anchor, Footline, Palette und Clipping
- Lazy Loading pro Mode/Stage/Fighter statt vollständigem Preload
- Bundle- und Asset-Budgets in CI dokumentieren
- Abhängigkeiten reproduzierbar pinnen
- Lizenzen und Quellen aller produktiven Assets dokumentieren

#### Abnahmekriterien

- zentrale Szenen-/Fighter-Dateien wachsen bei neuen Figuren nicht proportional weiter
- ein neuer Standard-Move benötigt keine neue Spezialverzweigung in `BattleScene`
- Build, Typecheck, Tests und Asset-QA laufen reproduzierbar
- unklare Reference-/Fremdassets sind nicht im Release-Paket
- Startdownload lädt nur, was für den gewählten Einstieg nötig ist

---

### BULK 9 — Content-Ausbau erst nach bewiesenem Vertical Slice

**Priorität:** P3
**Ziel:** Qualität reproduzieren, nicht den unfertigen Kern verbreitern.

#### Danach sinnvoll

- weitere spielbare Figur
- zweite vollständig inszenierte Stage
- mehr Gegnerarchetypen
- lokale Koop-Prüfung
- Items/Weapons als begrenzte Stage-Abwechslung
- zusätzliche Difficulty-Modifikatoren

#### Noch nicht priorisieren

- Online-Multiplayer
- umfangreiche Story-Kampagne
- Shops, Crafting oder große RPG-Progression
- große Skin-Pipeline vor Palette-/Sheet-Standard
- sehr große Combo-Movelist
- Enginewechsel

---

## 9. Detailverfahren: einen Move professionell polieren

Für jeden Move wird derselbe Review-Zyklus verwendet.

### Pass A — Absicht

- Was ist die spielerische Aufgabe?
- Single Target, Crowd Control, Mobility, Punish oder Defense?
- Welches Risiko und welche Belohnung besitzt der Move?
- Was soll der Spieler 150 ms vor dem Treffer erkennen?

### Pass B — Rohkampf

- Animation ohne VFX und Tint
- Startup/Active/Recovery festlegen
- Boxen in Frame Step prüfen
- Reichweite und Z-Toleranz gegen mehrere Distanzen prüfen
- Whiff und Treffer müssen beide plausibel wirken

### Pass C — Reaktion

- Trefferpose des Gegners
- Hitstun und Knockback
- Boden-/Luftreaktion
- Knockdown nur, wenn er eine klare Funktion erfüllt

### Pass D — Impact

- Hitstop
- Kontakt-Spark
- Impact-SFX
- kurzer Flash
- minimal nötiger Shake

### Pass E — Kontext

- gegen einen Gegner
- gegen drei Gegner
- am Bildschirmrand
- im dichtesten VFX-Moment
- mit Touch-UI
- auf kleinem Zielgerät
- mit Reduce Flash/Shake

### Pass F — Abnahme

- Vorher-/Nachher-Aufnahme
- Werte und Boxprofile dokumentieren
- keine Sonderlogik außerhalb des Move-Datensatzes, sofern vermeidbar
- Testfall oder reproduzierbarer Gym-Preset vorhanden

---

## 10. Empfohlene konkrete Reihenfolge der ersten Arbeiten

1. Combat-Gym-Overlay, Frame Step und feste Capture-Presets spezifizieren.
2. Menü-/Joystick-Hit-Test als isolierten Mobile-P0-Bug behandeln.
3. Input Buffer und Hitstop-Verhalten festlegen.
4. Wombat Basic Attack als Gold-Standard-Move auswählen.
5. Für diesen Move Animation, Boxen und Kontaktpunkt ohne VFX finalisieren.
6. Light-Hitprofil aus Spark, Flash, SFX, Hitstop und minimalem Shake bauen.
7. Wombat Idle/Walk/Basic-Sheet auf Fußanker und Körperkern normalisieren.
8. Wombat Heavy/Special als Heavy-Hitprofil polieren und Earthshaker-Timeline trennen.
9. Discount Wizard vollständig nach demselben Asset-Standard bereinigen.
10. Knockdown/Getup/I-Frames und eine Defense-Option hinzufügen.
11. Attack Coordinator und drei Gegnerrollen im Junkyard Vertical Slice umsetzen.
12. Erst nach bestandener Mobile-/Performance-/Accessibility-Abnahme neue Inhalte beginnen.

---

## 11. QA-Matrix für „perfektes“ Combat Feeling

„Perfekt“ ist subjektiv, aber die Produktionsqualität kann objektiv abgesichert werden.

| Kategorie | Prüffrage | Methode |
|---|---|---|
| Timing | Beginnt die Box im beabsichtigten Animationsframe? | Frame Step + Overlay |
| Kontakt | Sitzt Spark/SFX am echten Kontakt? | 0,25x Capture |
| Gewicht | Sind Light/Heavy ohne Zahlen unterscheidbar? | Blindvergleich |
| Kontrolle | Gehen Taps während Hitstop verloren? | automatisierter Input-Buffer-Test |
| Fairness | Treffen sichtbare Whiffs oder verfehlen sichtbare Kontakte? | Distanz-/Z-Preset-Matrix |
| Stabilität | Wandert die Figur im Idle/Walk? | 10-s-Loop + Alpha/Anchor-Check |
| Farbe | Flackern feste Kostümteile? | Paletten-Diff |
| Lesbarkeit | Wird die Reaktionspose verdeckt? | Mobile-Capture mit voller VFX-Dichte |
| Crowd | Wie viele Gegner greifen gleichzeitig an? | Encounter-Director-Debug |
| Recovery | Ist Risiko nach Whiff erkennbar? | Spieler-Test ohne UI-Hilfe |
| Performance | Hält der dichteste Kampf das Zielbudget? | Zielgerät, nicht nur Desktop |
| Accessibility | Bleibt Feedback ohne Flash/Shake verständlich? | reduzierte Einstellungen |

### Testauflösungen

- Ziel-Smartphone Landscape
- kleines Smartphone Landscape
- Tablet Landscape
- Desktop 16:9
- Portrait nur für Orientation-/Fallback-Verhalten

### Testbedingungen

- 1 Gegner
- 3–5 Gegner
- Projektil + Melee gleichzeitig
- Ultimate in maximaler Effektlast
- Bildschirmrand
- Gegner hinter/vor dem Spieler in Z
- 30 Minuten wiederholtes Spielen auf Mobilgerät

---

## 12. Definition of Done für den Arcade-Quality-Vertical-Slice

Der Slice ist erst fertig, wenn alle folgenden Punkte erfüllt sind:

### Charaktere

- zwei Spielerfiguren bestehen Anchor-, Footline-, Palette- und Clipping-Gates
- alle verwendeten Kernzustände besitzen dedizierte, stabile Animationen
- keine starken kompensatorischen Frame-Scale-Pops
- keine ungewollten Farbwechsel

### Combat

- Basic, Special, Ultimate, Air Attack und Defense vollständig getimt
- Hit-, Hurt- und Pushboxen im Frame Step abgenommen
- Input Buffer funktioniert durch Hitstop hindurch
- Knockdown/Getup/I-Frames verhindern unfaire Loops
- Whiff, Hit, Block/Defense und Armor sind eindeutig unterscheidbar

### VFX/Audio

- gemeinsame Light/Medium/Heavy-VFX-Sprache
- figurenspezifische Effekte halten Style-/Coverage-Budget ein
- vollständige SFX-Kette für UI, Bewegung und Kampf
- kein Clipping und keine unkontrollierte Effektakkumulation
- Reduce Flash/Shake vorhanden

### Encounter

- drei Gegnerrollen
- Attack Coordinator
- vollständiger Stage-Rhythmus
- Boss/Miniboss
- lesbare Abschlusswertung

### Mobile/Technik

- Menü auf Touch erreichbar
- Touch-UI verdeckt keine entscheidenden Kampfinformationen
- Landscape und Safe Areas sauber
- stabile Ziel-Framezeit im dichtesten Encounter
- Tests, Build und Asset-QA erfolgreich
- produktive Assets besitzen geklärte Provenienz/Lizenz

---

## 13. Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| weitere Figuren vor Asset-Standard | Jitter/Farbfehler vervielfachen sich | erst zwei Gold-Standard-Figuren fertigstellen |
| mehr VFX vor korrektem Kontakt-Timing | spektakulär, aber schwammig | Boxen und Hit Confirm zuerst |
| Einzelfalllogik pro Ultimate | BattleScene wird unwartbar | Timeline/Event-Daten und modulare Controller |
| globale Hitstop-/Tint-Tricks | Inputverlust und Farbflackern | gepufferte Eingaben, kurze profilbasierte Reaktion |
| zu viele gleichzeitige Gegner | unfaire, unlesbare Treffer | Attack Coordinator und Rollen |
| Desktop-only-Abnahme | Touch- und Performanceprobleme spät entdeckt | Zielgerät ab jedem Bulk testen |
| ungeklärte Reference Assets | Release-/Lizenzrisiko | Provenienz dokumentieren oder entfernen |
| Content Scope vor Polish | große Pre-Alpha ohne fertigen Kern | Vertical Slice als Produktionsgate |

---

## 14. Referenzen und Quellen

### Vergleichbare Spiele/Phaser-Projekte

- [Little Fighter 2 — offizielle Einführung](https://www.lf2.net/en/intro.html)
- [Phaser: Vibe Code a Complete 2D Beat-'Em-Up Game with Phaser and Codex](https://phaser.io/news/2026/06/vibe-code-a-complete-2d-beat-em-up-game-with-phaser-and-codex)
- [Phaser: Teen Titans Go — Slash of Justice](https://phaser.io/news/2017/07/teen-titans-go-slash-of-justice)
- [Phaser: Vibe Code a Street Fighter Clone](https://phaser.io/news/2026/06/vibe-code-a-street-fighter-clone-with-phaser-cursor-and-codex)
- [Streets of Rage 4 — offizielle Produktseite](https://www.dotemu.com/games/streets-of-rage-4/)
- [TMNT: Shredder's Revenge — offizielle Veröffentlichung](https://www.dotemu.com/tmntshredders-revenge-is-now-available/)
- [River City Girls 2 — WayForward](https://wayforward.com/news/river-city-girls-2-updated-with-4-player-online-mode)

### Relevante Projektdateien

- [Combat-System-Spezifikation](07_COMBAT_SYSTEM_SPEC.md)
- [Testing-Checkliste](13_TESTING_CHECKLIST.md)
- [Character-Asset-Standard](21_CHARACTER_ASSET_STANDARD.md)
- [Fighter-Daten](../src/game/data/fighters.ts)
- [Fighter-Laufzeitlogik](../src/game/combat/Fighter.ts)
- [BattleScene](../src/game/scenes/BattleScene.ts)
- [Mobile Controls](../src/game/core/MobileControls.ts)

---

## 15. Schlussentscheidung

Die aktuelle Technik kann das gewünschte Spiel tragen. Ein Enginewechsel oder eine große Neuentwicklung ist nicht nötig. Der Qualitätshebel liegt in einer kontrollierten Produktionspipeline:

> **stabile Sheets → präzise Boxen → zentraler Trefferzeitpunkt → Reaktion/Hitstop → VFX/Audio → Crowd-Regie → kompletter Vertical Slice**

Wenn diese Reihenfolge eingehalten wird, kann More Than Wombat seine bereits starke visuelle Identität in ein hochwertiges, eigenständiges Arcade-Kampfspiel übersetzen. Wenn stattdessen jetzt primär neue Figuren, Stages und Effekte ergänzt werden, vervielfachen sich die vorhandenen Jitter-, Timing-, Lesbarkeits- und Architekturprobleme.
