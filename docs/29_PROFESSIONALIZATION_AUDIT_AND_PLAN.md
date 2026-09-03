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

**Roster-Entscheidung (2026-09-03):** Buster Bulldog wird nicht weiter für die Auslieferung optimiert. Er bleibt nur als ersetzbarer technischer Prototyp erhalten und wird aus Character Select sowie Wave-Rotation entfernt, sobald diese Bereinigung umgesetzt wird. Seine heutige vierbeinige Silhouette und die Rollenüberschneidung mit dem Barbarian rechtfertigen keine weitere Produktionszeit. Ein späterer, zweibeiniger Nachfolger ist ein neuer Character-Production-Task: Rollenvertrag, saubere animierte Sheets, Move-Set, Boxen, VFX und vollständige Gym-/Mobile-Abnahme — kein Reskin des Bulldogs.

### BULK 5.3 — Wave als kuratierte Arcade-Route

**Priorität:** P1
**Ziel:** `Junkyard Run` wird eine kurze, wiederholbar gute Session statt ein technischer Kameratest.

Lieferumfang:

- `Junkyard Run` als zusammenhängender Side-Scrolling-Stage-Run: Kampf, kurzer freier Vorwärtsweg, nächste Begegnung. Das übernimmt den Rhythmus klassischer Beat-'em-ups, ohne deren Figuren, Assets oder konkrete Inhalte zu kopieren.
- Nach einem geleerten Kampfbereich wird der Weg nach rechts freigegeben; Kamera folgt dem Spieler statt ihn in den nächsten Bereich zu versetzen. Die nächste Begegnung startet erst an einem klaren Ankunftstrigger.
- Die bestehende Weltbreite wird in drei Bereiche mit Kampf- und Übergangszonen aufgeteilt: leichter Einstieg, gemischter Engpass, Wizard-/Heavy-Finale. Pro Übergang zunächst ungefähr eine Bildschirmbreite sichere Laufstrecke, kein unendliches Backtracking.
- Übergänge haben lesbare Richtungs- und Raumhinweise; Gegner können während der reinen Laufpassage nicht unfair von außerhalb der Kamera treffen.
- Erst nach erfolgreichem Laufgefühl: ein kleiner originaler Energie-/Schrott-Pickup, Fortschrittsanzeige und Section-Checkpoint.
- Für jede Section eine klare Gegneridee: Einführung, Mischdruck, Wizard-/Heavy-Finale; Spawn-, Lane- und HP-Daten bewusst ausbalancieren.
- Einfache Director-Regeln: keine unfairen Spawn-overlaps, keine Offscreen-Treffer, Telegraphe vor gleichzeitigem Druck.
- Keine physischen Hindernisse, Fallen oder Sprungpassagen in diesem Bulk. Die flache Kampfgeometrie bleibt bis zur separaten Stage-Physics-Phase bewusst fair und testbar.

Abnahme:

- Die Kamera unterstützt den Kampf und überholt ihn nicht.
- Jeder Abschnitt hat eine eigene taktische Aussage, ohne neue Kollisions- oder Hazard-Systeme zu erzwingen.
- Ein kompletter Run bleibt kurz und lädt zum Wiederholen ein.

### BULK 5.3-A — Stage-Run-Grundlage

**Priorität:** P1. **Abhängigkeit:** B5.1 manuell abgenommen.

- Combat-/Travel-/Transition-Zustände im Stage Director ergänzen.
- Bestehende Wave-Sections in `combatBounds`, `travelBounds` und `arrivalTrigger` aufteilen.
- Weg nach dem Clear freigeben, Kamera ruhig folgen lassen und Spawnlogik bis zur Ankunft pausieren.
- Ein-/Ausgang visuell und im Debug eindeutig darstellen.

### BULK 5.3-B — Encounter-Regie

**Priorität:** P1. **Abhängigkeit:** B5.3-A.

- Je Section Gegnerrollen, Spawn-Lanes, Mindestabstand, Telegraphie und maximale gleichzeitige Bedrohung definieren.
- Finale als klar lesbarer Wizard-/Heavy-Peak umsetzen; keine Offscreen-Projektile oder ungekennzeichneten Spawn-Overlaps.
- Vollständigen Run in der Combat-Feel-Matrix protokollieren.

### BULK 5.3-C — Fortschritt und Wiederholung

**Priorität:** P2. **Abhängigkeit:** B5.3-B.

- Kleine originale Belohnung pro Abschnitt, Fortschrittsanzeige und Checkpoint ergänzen.
- Score-/Zeit-/Restleben-Auswertung nur dann hinzufügen, wenn sie die Wiederholung motiviert und nicht den Kampf-HUD überlädt.

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

### BULK 6.0 — Kern-Roster bereinigen und beweisen

**Priorität:** P1. **Abhängigkeit:** B5.2 und B5.3-B.

- Buster Bulldog aus dem normalen Character Select und Wave-Roster nehmen; bestehende Daten nur als ungenutzten Prototyp behalten.
- Wombat, Wizard und Barbarian anhand der Combat-Feel-Matrix auf eine eindeutige Rollenidentität, faire Recovery und Mana-Rhythmus prüfen und gezielt nachjustieren.
- Pigeon ausschließlich als leichter Wave-Archetyp behandeln; keine unnötige Ausbauarbeit zum Playable Fighter.
- Jede Änderung im Combat Gym, Wave und auf Touch prüfen.

### BULK 6.1 — Onboarding und erste spielbare Session

**Priorität:** P2. **Abhängigkeit:** B5.4 und B6.0.

- Kurzes Start-Tutorial direkt im ersten Run: Bewegung, Angriff, Spezial, Mana und sichtbare Gefahren jeweils einmal ohne Textwand vermitteln.
- Character Select auf den finalen Kern-Roster reduzieren und pro Figur Rolle sowie zwei bis drei Move-Hinweise zeigen.
- Sieg, Niederlage, Neustart und Rückkehr ins Menü als vollständigen Flow ausarbeiten.

### BULK 6.2 — Zweite Route oder Arena-Variante

**Priorität:** P2. **Abhängigkeit:** B5.5 und erfolgreiches B5.3-Playtesting.

- Genau eine neue, visuell eigenständige Route oder Arena-Variante liefern, auf derselben flachen und validierten Kampfgeometrie.
- Neue Gegnerkombinationen nur aus bestehenden, geprüften Archetypen bilden; keine neue Figur parallel produzieren.
- StageVisualContract, Spawn-Regeln und Screenshot-Baselines verpflichtend anwenden.

### BULK 7.0 — Neuer zweibeiniger Fighter (Vorproduktion)

**Priorität:** P3. **Abhängigkeit:** stabiler Kern-Roster, B6.1 und B6.2.

- Erst Rollenlücke bestimmen; kein Ersatz nur wegen einer fehlenden Figurenzahl.
- Bewegungs- und Angriffssilhouette, Sheet-Standard, Paletten- und VFX-Familie vor der Implementierung verbindlich festlegen.
- Vier Kernzustände plus Basic, Special und Ultimate als Animatic/Preview prüfen; erst dann Runtime-Sheets erstellen.

### BULK 7.1 — Neuer zweibeiniger Fighter (Produktion)

**Priorität:** P3. **Abhängigkeit:** freigegebenes B7.0-Konzept.

- Datengetriebene Moves, getrennte Hit-/Hurt-/Pushboxen, universelle transparente VFX, SFX und Mobile-UI ergänzen.
- Vollständige Character-Asset-QA, Combat-Gym-Matrix, Wave-Test und Zielgeräteabnahme vor Aufnahme in den Roster.

## 4. Akute autonome Arbeitsroadmap

Diese Reihenfolge enthält ausschließlich Arbeit, die lokal, reproduzierbar und ohne subjektive Freigabe durch den Nutzer durchgeführt werden kann. Sie ist bewusst von der vollständigen Produktroadmap getrennt: Manuelle Zielgeräte-, Spielgefühl-, Sound- und Art-Freigaben werden vorbereitet, aber nicht vorweggenommen.

### A0 — Technische Baseline für die Wave-Route

**Status 2026-09-03:** technische Datenvalidierung und Tests abgeschlossen; visuelle Browser-Screenshot-Captures werden mit A4 als echter Browser-Gate umgesetzt. **Umfang:** klein und risikoarm.

- Bestehende Wave-Section-, Kamera-, Spawn- und Bounds-Logik präzise erfassen und durch zielgerichtete Tests absichern. **Erledigt:** `WaveStageValidation` prüft Weltgrenzen, Abschnittsreihenfolge, Spawnräume und sichere Startdistanz ohne Phaser-Laufzeit.
- Automatisierte Screenshot-Baselines für Park, Rooftop, Scrapyard sowie die drei Junkyard-Positionen erzeugen; StageVisualContract und Debug-Bodenlinie als Prüforakel verwenden. **Verschoben nach A4:** Ohne vorhandenen Browser-Test-Runner wären bloße lokale Bilddateien keine verlässliche CI-Baseline.
- Aktuelle Build-, Typecheck- und Test-Baseline dokumentieren.

**Ergebnis:** Künftige Route-/Kameraänderungen können die bereits korrigierte Bodenprojektion nicht unbemerkt verschlechtern.

### A1 — B5.3-A: Bewegung zwischen Wave-Begegnungen

**Status 2026-09-03:** technisch umgesetzt und lokal gestartet geprüft; Typecheck, 45 Tests, Production Build und der lokale Wave-Start sind grün. Die vollständige Touch-/Spielgefühlabnahme bleibt bewusst B5.1. **Umfang:** funktionale Umsetzung ohne Content-Entscheidung.

- Einen kleinen datengetriebenen Stage Director mit `combat`, `travel` und `transition` einführen.
- Die heutige Weltbreite in feste Kampf- und sichere Laufzonen gliedern; nach einem Clear wird nur der nächste Vorwärtskorridor freigegeben.
- Kamera folgt dem Spieler durch den Laufkorridor; die nächste Gegnergruppe entsteht erst am klaren Ankunftstrigger.
- Rückwärtsgrenze, Spawn-Pause und Debug-Anzeige implementieren und mit unit-/szenennahen Tests prüfen.

**Nicht enthalten:** Fallen, Hindernisse, Sprungpassagen, neue Art oder endgültiges Encounter-Balancing.

**Ergebnis:** Ein spielbarer, horizontaler Stage-Run statt eines Abschnitts-Teleports. Die spätere manuelle Abnahme entscheidet nur über Distanzen und Feintiming, nicht über die technische Richtung.

### A2 — B5.3-B: Faire Director-Sicherheitsregeln

**Status 2026-09-03:** technische Sicherheitsregeln umgesetzt; finale Schwierigkeit bleibt bewusst bis zum echten Wave-Test konservativ. **Umfang:** deterministische Schutzregeln.

- Harte Regeln gegen Spawn-Overlap, Spawn direkt hinter der Kamera, gleichzeitigen untelegraphierten Druck und feindliche Projektile während einer Travel-Phase ergänzen.
- Gegnergruppen für Entry, Engpass und Finale als klar getrennte Daten definieren, zunächst mit konservativen HP-/Anzahlwerten.
- Invarianten automatisiert testen: aktiver Gegner nur im Encounter-Bereich, keine Spawn-Position innerhalb der Pushbox des Spielers, kein Angriff vor Encounter-Aktivierung.

**Nicht enthalten:** finale Schadenswerte und Schwierigkeitsgrad; diese bleiben bis zum manuellen Wave-Test konservativ.

**Ergebnis:** Der Wave-Modus wird objektiv fairer und testbar, ohne Spielgefühl zu erraten.

### A3 — Roster-Bereinigung: Bulldog technisch ausliefern verhindern

**Status 2026-09-03:** umgesetzt. Buster Bulldog und Reference Fighter bleiben ausschließlich Combat-Gym-Prototypen; normaler Select zeigt Wombat, Wizard und Barbarian. **Umfang:** klarer Produktbeschluss, keine Neugestaltung.

- Buster Bulldog aus Character Select, zufälliger Gegnerwahl und Wave-Rotation entfernen.
- Seine Definition, Moves und Assets als ungenutzten Prototyp erhalten, damit nichts destruktiv gelöscht wird und der spätere Ersatz unabhängig entstehen kann.
- Auswahl-, Mode- und Fallback-Tests aktualisieren; Wombat, Wizard und Barbarian bleiben der sichtbare Kern-Roster.

**Ergebnis:** Der sichtbare Build behauptet keine Produktionsqualität für eine Figur, die bewusst ersetzt werden soll.

### A4 — Reproduzierbare Browser- und Asset-Gates

**Status 2026-09-03:** Asset-Inventar und Build-Report vorbereitet; der echte Browser-Runner bleibt offen und wird nicht durch unversionierte lokale Screenshots ersetzt. **Umfang:** Automatisierung und Schutz vor Regressionen.

- Lokale Browser-Smoke-Abdeckung für Menü, Character Select, Duel, Combat Gym und den vollständigen Wave-Run ergänzen.
- Asset-Manifest und Runtime-Dateien inventarisieren; erst einen sicheren Verschiebeplan erstellen, danach mögliche Source-/Chroma-Bereinigung als separaten Commit durchführen. **Erledigt:** `npm.cmd run assets:report` meldet Referenzen, Kandidaten und Größen ohne Dateien anzufassen.
- Build-Report für Runtime-Assetgrößen und fehlende Referenzen einführen. **Teilweise erledigt:** Größen- und Referenzreport vorhanden; ein CI-Browser-Gate folgt separat.

**Ergebnis:** Route-, Roster- oder Assetänderungen werden vor dem manuellen Gerätetest automatisch gegen die wichtigsten Fehler geprüft.

### A5 — B5.4 vorbereiten, aber keine subjektiven Inhalte festlegen

**Status 2026-09-03:** Mobile-Layout-Infrastruktur und Event-Map vorbereitet. Der linke HUD-Balken liegt nun sichtbar unterhalb des `MENU`-Controls; kleine Landscape-Geometrie ist automatisiert geprüft. **Umfang:** Infrastruktur, keine finale Audio-/Art-Aussage.

- Ereignisliste und technische SFX-Kategorien für Bewegung, Landung, Cast, Telegraphie, UI, Sieg und Niederlage definieren. **Erledigt:** `docs/qa/presentation-event-map.md`.
- HUD- und Mobile-Safe-Area-Überlappungen automatisiert bzw. mit festen Layout-Checks prüfen. **Erledigt:** testbare Mobile-Control- und HUD-Layout-Geometrie für die kleinste Landscape-Klasse.
- Onboarding- und Rollenhinweise als Text-/Datenstruktur vorbereiten.

**Ergebnis:** Audio, UX und Tutorial können danach gezielt ergänzt werden, ohne später Combat-Code oder HUD-Struktur umzubauen.

### Danach: ausdrücklich Nutzer- oder Zielgeräteabhängig

- B5.1: echter Touch-, Pages- und Leistungscheck auf mindestens zwei Geräteklassen.
- B5.2: finale Balancezahlen, Hitstop-Stärke, Recovery und Mana-Rhythmus nach persönlichem Combat-Gym-/Wave-Feedback.
- B5.3-C: Belohnungsart, Checkpoint-Strenge und Wiederholungsanreiz.
- B5.4: endgültige Soundauswahl, Lautheit, Stilfreigabe und finaler HUD-Geschmack.
- B6.2+: neue Stage-Art, neuer Gegner-Archetyp und der spätere zweibeinige Fighter.

### Sinnvolle Commit-Grenzen

1. `Add wave-route safety baseline` — A0, ohne Gameplay-Verhaltensänderung.
2. `Add continuous wave traversal` — A1, inklusive Tests und Plan-Update.
3. `Add fair wave encounter director` — A2, inklusive Invarianten.
4. `Remove Bulldog from shippable roster` — A3, isoliert und reversibel.
5. `Add browser and asset quality gates` — A4, ohne Asset-Löschung.
6. `Prepare presentation quality infrastructure` — A5, ohne finale Sound-/Art-Assets.

## 5. Empfohlene Reihenfolge

1. **BULK 5.0** — Wave-Boden-/Rendererkorrektur und Stage-Vertrag (**weitgehend abgeschlossen; Screenshot-Baselines offen**).
2. **BULK 5.1** — Pages- und Realgeräteabnahme, einschließlich B4.4 (**offen: manuelle Zielgeräteprüfung**).
3. **BULK 5.2** — Combat-Feel-Matrix und Roster-Identität (**Matrix vorhanden, Spieltests/Nachjustierung offen**).
4. **BULK 5.3-A** — freies, kontrolliertes Vorwärtslaufen zwischen Wave-Begegnungen.
5. **BULK 5.3-B** — Encounter-Regie und fairer Abschlusskampf.
6. **BULK 5.3-C** — Progression, Belohnung und Checkpoints.
7. **BULK 5.4** — Audio/UX-Polish.
8. **BULK 5.5** — Runtime-Asset-Hygiene und kontrollierter neuer Content.
9. **BULK 6.0** — Kern-Roster bereinigen, Bulldog ausliefern verhindern und Rollen beweisen.
10. **BULK 6.1** — Onboarding und vollständiger erster Session-Flow.
11. **BULK 6.2** — genau eine zweite geprüfte Route/Arena.
12. **BULK 7.0–7.1** — erst dann ein neuer, zweibeiniger Fighter von Konzept bis Produktion.

## 6. Bewusste Nicht-Ziele bis dahin

- Keine weitere Map vor dem Stage-Renderer-Fix.
- Keine zusätzlichen Figuren vor dem Balance- und Wave-Playtest; Buster Bulldog erhält ausdrücklich keine weitere Produktionsarbeit.
- Keine echte Hindernis-, Jump-Over- oder Hazard-Mechanik, solange die gegenwärtigen Arenen bewusst flache Kampfboxen sind.
- Kein großer Umbau des Combat-Kerns: Die vorhandene Trennung ist ein Vorteil und soll durch Daten/Tests erweitert werden.

## 7. Messbare Zieldefinition für den nächsten Meilenstein

Der nächste professionelle Milestone ist erreicht, wenn `Junkyard Run` in einer realen Wave-Sitzung auf Zielgerät sauber aussieht und sich sauber spielt: sichtbarer Boden stimmt mit allen Fighter-Positionen überein, die Kamera bleibt ruhig, keine Assets fehlen, Touch reagiert sofort, VFX bleiben im Budget und der Spieler versteht den nächsten Gegnerdruck ohne Debug-UI.
