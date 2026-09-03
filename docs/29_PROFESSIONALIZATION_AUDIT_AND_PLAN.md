# 29 — Projekt-Audit und Plan zum professionellen Vertical Slice

**Stand:** 2026-09-03
**Scope:** Audit, Plan und nachverfolgte Umsetzungsstände.

**Implementierungsupdate 2026-09-03:** Der akute Wave-Rendererfehler ist behoben. `Junkyard Run` skaliert seine 1672×941-Scrapyard-Quelle nun proportional auf die 960×540-Kampfprojektion, bevor sie horizontal gekachelt wird. Ein gemeinsamer `StageVisualContract` definiert nun den fairen Flat-Arena-Korridor und validiert jede Junkyard-Section gegen ihre lokale Bodenfläche. Typecheck, 42 Tests, Production Build und eine Laufzeitprüfung sind grün. Screenshot-Baselines bleiben der nächste Teil von BULK 5.0.

**Release-QA-Update 2026-09-03:** `docs/qa/vertical-slice-release-checklist.md` bündelt Local-, Pages- und Zielgeräte-Gates. Der Pages-Workflow des aktuellen Commits läuft; die vorherige Wave-Boden-Korrektur wurde bereits erfolgreich ausgeliefert. Die echte kleinste Zielgeräteklasse bleibt ein manueller Abschlusscheck.

## Kurzurteil

*More Than Wombat* besitzt bereits ein ungewöhnlich gutes Fundament für einen kleinen Browser-Arcade-Brawler: deterministische Move-Timelines, profilierte Hit-/Hurt-/Pushboxes, einen reproduzierbaren Combat Gym, getrennte Combat-/VFX-Präsentation, Qualitätsbudgets für VFX, Asset-QA und GitHub-Pages-Deployment. Der nächste Qualitätssprung kommt deshalb **nicht** durch mehr Figuren oder mehr rohe Features, sondern durch einen belastbaren spielbaren Vertical Slice: korrekte Stages, geprüftes Spielgefühl, eine bewusst inszenierte Wave-Route und saubere reale Geräteabnahme.

Die aktuelle größte Produktlücke ist die Stage-Integrität in Wave Mode. Danach folgen spielerische Lesbarkeit/Balance und abschließend Präsentation, Audio und Produktionshygiene.

## 1. Arena- und Begehbarkeitsaudit

### Wichtigste Klarstellung

Die im Combat Gym sichtbare Standardarena ist keine eigene Gym-Map, sondern **Park Clash**. Combat Gym übernimmt die im Character Select gewählte Arena; die Default-Auswahl ist `park`.

### Bestand

| Arena | Runtime-Datei | Visuelle Eignung | Tatsächliche Begehbarkeit | Urteil |
|---|---|---|---|---|
| Park Clash | 960×540, natives Spielraster | klarster Boden, ruhige Mitte, sehr gute Figuren- und VFX-Lesbarkeit | dieselbe Rechteckfläche wie alle Duel/Test-Arenen: X 72–888, Y 248–474 | **Goldstandard für Combat Gym und Balance** |
| Rooftop Rumble | 1672×941, im Duel/Test auf 960×540 skaliert | beste Tiefenorientierung durch Plattenlinien; Mitte bleibt gut lesbar | dieselbe Rechteckfläche, keine Dachkanten, Hindernisse oder Höhenmechanik | **beste alternative Duel-Arena** |
| Scrapyard Scrap | 1672×941, im Duel/Test auf 960×540 skaliert | starke Atmosphäre, aber hoher Kontrast und viele Details hinter den Figuren | dieselbe Rechteckfläche, kein Schrott besitzt Kollisionsgeometrie | **als Mood-Arena brauchbar, nicht als Gym-Referenz** |
| Junkyard Run (Wave) | nutzt Scrapyard als 2640×540 `TileSprite` | derzeit keine verlässliche Bodenillusion | Abschnitts-Bounds sind korrekt datengesteuert, aber die Hintergrunddarstellung passt nicht dazu | **P0-Defekt, vor Content beheben** |

### Technischer Befund

Duel und Combat Gym nutzen für alle drei Arenen dieselben `FighterBounds` (`X 72–888`, `Y 248–474`). Damit sind sie bewusst **visuelle Varianten**, keine unterschiedlichen spielbaren Maps. Das ist für den jetzigen Brawler sinnvoll: keine unsichtbaren Hindernisse, identische Reichweiten und faire Vergleichbarkeit.

Die Wave-Stage besitzt dagegen drei echte Abschnitts-Bounds und einen Kamera-Scroll. Ihre Darstellung ist inkonsistent: Die Scrapyard-Quelle ist 1672×941, wird in Wave aber als 2640×540 `TileSprite` angelegt. Anders als die Duel-Darstellung wird sie nicht auf die Spielhöhe skaliert. Im Laufzeitbild liegt die sichtbare Bodenebene dadurch unter den Kampfpositionen; Figuren wirken vor Zaun/Schrott schwebend. Das betrifft visuelle Begehbarkeit und Professionalität unmittelbar, obwohl die Kollisionsgrenzen selbst funktionieren.

### Entscheidungen

1. **Park bleibt die Gym- und Balance-Referenz.** Screenshots, Hitbox- und VFX-Abnahmen zuerst dort durchführen.
2. **Rooftop bleibt die zweite Referenz** für Kontrast, Entfernung und Bodeneffekte.
3. **Scrapyard bleibt als atmosphärische Duel-Arena**, erhält aber keine spielmechanischen Hindernisse, solange kein echtes Stage-Collision-System existiert.
4. **Keine neue Map produzieren**, bevor der Wave-Renderer und der Stage-Vertrag stimmen.

## 2. Projekt-Audit

### Bereits professionell genug, um darauf aufzubauen

- Strikte TypeScript-Konfiguration und klar getrennte Bereiche für AI, Combat, Core, Data, Debug, Scenes und UI.
- Datengetriebene Moves mit Startup/Active/Recovery, echten Hitbox-Fenstern, Hurt-/Pushbox-Profilen, Fraktionslogik und Kontaktpunkt.
- Combat Gym mit Pause, Frame Step, Slow Motion, Boxen, Dummy-Modi, VFX-Labor und Diagnosewerten; das ist ein echter Produktionsvorteil.
- Ein `CombatImpact`-Pfad bündelt Hitstop, Flash, Shake, SFX, Haptik und VFX. Das verhindert inkonsistentes Trefferfeedback.
- Transparente, qualitätsgestufte VFX mit Pooling, Limits (80/48/24) und QA-Gates.
- Character-Asset-Normalisierung/QAs sowie GitHub-Pages-CI existieren.

### Lücken mit hohem Nutzen

| Bereich | Befund | Risiko für die wahrgenommene Qualität | Priorität |
|---|---|---|---|
| Wave-Stage-Rendering | Scrapyard-Quelle und 540px-Wave-Fläche sind nicht auf derselben Bodenprojektion | Figuren schweben optisch; der einzige echte Stage-Modus wirkt unfertig | P0 |
| Stages | Nur `junkyard_run`; drei Abschnitte nutzen dieselbe Kulisse, keine Stage-Metadaten für Boden-/Horizon-Linie | Maps sind Kulissen statt bewusst getesteter Kampfflächen | P0 |
| Realgeräte/Live-Build | Zielgerät-FPS, Touch-Start, Pages-Assets und kleine Displays stehen noch als manuelle Abnahme offen | Lokale Qualität kann von der ausgelieferten Version abweichen | P0 |
| Kampfspiel | Der Kern ist robust, aber es gibt noch kein geschlossenes Balance-/Cancel-/Recovery-Regelwerk und kaum Playtestdaten | Moves können einzeln gut, als Roster aber beliebig oder unfair wirken | P1 |
| Gegnerverhalten | Standard-AI ist generisch; Wizard hat bereits Distanzregeln, aber keine rollenbasierte Crowd-Koordination | Waves werden schnell zu Druck ohne lesbare Rollen | P1 |
| Charaktertiefe | Vier spielbare Figuren besitzen vor allem Basic, Special, Ultimate und den gemeinsamen Air Bonk; Pigeon hat nur Basic | Identitäten sind angelegt, aber noch nicht als vollständiger Spielstil bewiesen | P1 |
| Audio/UX | Treffer-SFX sind gut angebunden; Bewegung, Cast, Telegraphie, UI, Raumklang und Mix fehlen noch | Treffer fühlen gut, der Rest des Spiels noch prototypisch | P2 |
| Asset-Auslieferung | Unter `public/assets` liegen etwa 61 MB, inklusive mehrerer Source-/Chroma-Dateien, die nicht geladen werden | Deployment-Artefakt und Repository sind unnötig groß; Source/Runtime-Grenze ist nicht überall sauber | P2 |
| Tests | 38 zielgerichtete Unit-Tests, aber keine automatisierte Browser-/Pages-/Playtest-Suite | UI-, Assetpfad-, Kamera- und Mobile-Regressionen werden zu spät entdeckt | P2 |

## 3. Priorisierter Umsetzungsplan

### BULK 5.0 — Stage-Integrität und Lesbarkeit

**Priorität:** P0
**Ziel:** Jede sichtbare Kampfposition passt zur gemalten Bodenebene; Stages bleiben fair und nachvollziehbar.

**Status 2026-09-03:** Rendererfix und struktureller StageVisualContract abgeschlossen; die Screenshot-Baselines bleiben offen.

Lieferumfang:

- Wave-Hintergrund korrekt auf die 960×540-Kampfperspektive bringen; kein unskalierter vertikaler Tile-Crop.
- Einen `StageVisualContract` definieren: Quellraster, sichtbare Bodenlinie, zulässige `minY/maxY`, Kamerarahmen, sichere HUD-Zone und optionale Scroll-/Tile-Strategie.
- Für Park, Rooftop, Scrapyard und jede Wave-Section feste Screenshot-Baselines bei 1×, 0,5× und 0,25× erzeugen.
- Im Debug eine optionale Ground-/Bounds-Linie anbieten, damit Art und Combat dauerhaft überprüfbar bleiben.
- Wave-Hintergrund nicht blind wiederholen: entweder breite, bewusst zusammengesetzte Source-Abschnitte oder eine stilistisch unauffällige Parallax-/Tile-Lösung.

Abnahme:

- Keine Figur schwebt vor Zaun, Geröll oder Wand.
- Alle drei Duel-Arenen haben die gleiche faktische Bewegungsfläche und keine irreführenden Pseudo-Hindernisse.
- Jede Wave-Section hat visuell lesbare Ein- und Ausgänge sowie faire Spawnräume.

### BULK 5.1 — Ausgelieferter Vertical Slice und echte Geräteabnahme

**Priorität:** P0
**Ziel:** „funktioniert lokal“ wird zu „funktioniert für Spielende“.

Lieferumfang:

- GitHub-Pages-Smoke-Test: Menü, Character Select, jede Arena, Duel, Wave und Combat Gym ohne Asset-/Konsolenfehler.
- Zwei echte Touch-Geräteklassen prüfen: kleines Android/iPhone-Format und größeres Tablet; Startinput, Joystick, Aktionsbuttons, Menü und Safe Areas erfassen.
- B4.4-Abnahme auf dem schwächsten Zielgerät: Wave-Crowd, alle VFX-Qualitäten, Reduce Flash/Shakes, Ziel-Framerate und Speicherverhalten.
- Eine kurze reproduzierbare QA-Checkliste samt Resultat im Repository führen.

Abnahme:

- Pages entspricht visuell und funktional dem lokalen Build.
- Kampf startet auf Touch ohne verlorenen ersten Input.
- Die festgelegte Ziel-Framerate wird in der dichtesten vorgesehenen Szene gehalten oder Qualitätsmodus/Assetbudget wird entsprechend angepasst.

### BULK 5.2 — Combat-Feel- und Balance-Labor

**Priorität:** P1
**Ziel:** Der vorhandene technische Kampfkern wird als bewusstes Arcade-System lesbar.

**Status 2026-09-03:** gestartet. `docs/qa/combat-feel-matrix.md` definiert Rollenvertrag, zehn reproduzierbare Gym-/Wave-Szenarien und eine Freigaberegel vor jeder Zahlenänderung.

Lieferumfang:

- Für jede spielbare Figur eine knappe Rollenkarte: Reichweite, Tempo, sichere Optionen, Risiko, Mana-Rhythmus und Crowd-Funktion.
- Ein Tabellen-/Datenblatt für Schaden, Hitstun, Knockback, Startup, Recovery, Manaeffizienz und Reichweite aller Moves.
- Zehn feste Combat-Gym-Szenarien: Point Blank, Max Range, Diagonal Lane, Air, Guard, Armor, Invulnerable, zwei Gegner, Projectile, Ultimate.
- Für jeden Move explizit entscheiden: darf er während Recovery gecancelt werden, darf er drehen, darf er laufen, darf er mehrfach treffen? Fehlende Regeln nicht implizit lassen.
- Je Figur genau **eine** starke, erkennbare Interaktion ergänzen oder schärfen, erst nachdem die Balance-Matrix stimmt; kein Move-Spam.

Abnahme:

- Wombat, Wizard, Barbarian und Buster sind ohne Namensschild an Tempo und Raumkontrolle unterscheidbar.
- Keine offensichtliche „immer beste“ Aktion im Duel oder Wave-Test.
- Ein neuer Move wird erst nach Treffer-, AI-, VFX-, Audio- und Mobile-Prüfung freigegeben.

### BULK 5.3 — Wave als kuratierte Arcade-Route

**Priorität:** P1
**Ziel:** `Junkyard Run` wird eine kurze, wiederholbar gute Session statt ein technischer Kameratest.

Lieferumfang:

- Nach B5.0 drei visuell unterschiedliche, aber kollisionsfreie Abschnitte: Entry, Engpass, Finale.
- Für jede Section eine klare Gegneridee: Einführung, Mischdruck, Wizard-/Heavy-Finale; Spawn-, Lane- und HP-Daten bewusst ausbalancieren.
- Einfache Director-Regeln: keine unfairen Spawn-overlaps, keine Offscreen-Treffer, Telegraphe vor gleichzeitigem Druck.
- Section-Übergänge mit kurzer, lesbarer Kamera- und Audio-Pause statt abruptem Reset.

Abnahme:

- Die Kamera unterstützt den Kampf und überholt ihn nicht.
- Jeder Abschnitt hat eine eigene taktische Aussage, ohne neue Kollisions- oder Hazard-Systeme zu erzwingen.
- Ein kompletter Run bleibt kurz und lädt zum Wiederholen ein.

### BULK 5.4 — Präsentation, Audio und UX

**Priorität:** P2
**Ziel:** Das Spiel wirkt geschlossen, nicht wie ein gutes Combat-Debugprojekt mit Art darüber.

Lieferumfang:

- SFX-Familien für Bewegung, Sprung/Landung, Cast, Projektilflug, Telegraphie, UI, Victory/Defeat und Stage-Ambience; Lautheitsregeln und Ducking festlegen.
- HUD-Informationshierarchie für kleine Displays prüfen: Name/HP/MP, Wave-Info, Debug und Touch-Buttons dürfen sich nicht konkurrieren.
- Character Select mit Rollen-Summary und klarer Move-Preview ergänzen; der Combat Gym bleibt Diagnosewerkzeug, nicht Ersatz für Onboarding.
- Kurze Spielstart-Anleitung und pausierbare Controls-Hilfe.

Abnahme:

- Ein erster Match erklärt sich ohne Dokumentation.
- Audio verstärkt Timing und Gefahr, ohne VFX oder Figurensilhouette zu überdecken.
- Mobile UI bleibt in echter Daumenreichweite lesbar.

### BULK 5.5 — Produktionshygiene und kontrollierte Content-Erweiterung

**Priorität:** P2, erst nach B5.0–5.3
**Ziel:** Weiterer Content bleibt günstig, testbar und auslieferbar.

Lieferumfang:

- Nichtproduktive Source-/Chroma-Dateien aus `public` in klar markierte `art-source`-Pfade verschieben; Runtime-Manifest als alleinige Auslieferungsquelle nutzen.
- Browser-Smoke-Tests für Pages, Character Select, eine Duel-Arena, Wave und Combat Gym ergänzen.
- Assetgrößen-Budget und Build-Report einführen.
- Erst danach: eine zusätzliche Arena **oder** ein zusätzlicher Gegner-Archetyp, nicht beides zugleich.

Abnahme:

- Jede neue Datei ist klar Source oder Runtime, nie beides.
- Neue Bühne/Figur kann den vorhandenen QA- und Balanceprozess durchlaufen.
- Kein Content-Update verschlechtert Pages-Start, Mobile oder Wave-Lesbarkeit.

## 4. Empfohlene Reihenfolge

1. **BULK 5.0** — Wave-Boden-/Rendererkorrektur und Stage-Vertrag.
2. **BULK 5.1** — Pages- und Realgeräteabnahme, einschließlich B4.4.
3. **BULK 5.2** — Combat-Feel-Matrix und Roster-Identität.
4. **BULK 5.3** — eine vollständige, kuratierte Junkyard-Route.
5. **BULK 5.4** — Audio/UX-Polish.
6. **BULK 5.5** — Runtime-Asset-Hygiene und erst dann neuer Content.

## 5. Bewusste Nicht-Ziele bis dahin

- Keine weitere Map vor dem Stage-Renderer-Fix.
- Keine zusätzlichen Figuren vor dem Balance- und Wave-Playtest.
- Keine echte Hindernis-, Jump-Over- oder Hazard-Mechanik, solange die gegenwärtigen Arenen bewusst flache Kampfboxen sind.
- Kein großer Umbau des Combat-Kerns: Die vorhandene Trennung ist ein Vorteil und soll durch Daten/Tests erweitert werden.

## 6. Messbare Zieldefinition für den nächsten Meilenstein

Der nächste professionelle Milestone ist erreicht, wenn `Junkyard Run` in einer realen Wave-Sitzung auf Zielgerät sauber aussieht und sich sauber spielt: sichtbarer Boden stimmt mit allen Fighter-Positionen überein, die Kamera bleibt ruhig, keine Assets fehlen, Touch reagiert sofort, VFX bleiben im Budget und der Spieler versteht den nächsten Gegnerdruck ohne Debug-UI.
