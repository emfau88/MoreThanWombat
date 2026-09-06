# 31 – Gameplay- und Wave-Completion-Plan

**Stand:** 2026-09-05<br>
**Status:** Verbindliche, nach Gameplay-Risiko neu sortierte Ausführungsreihenfolge<br>
**Adressat:** Coding Agent<br>
**Ziel:** Aus dem technisch stabilen Vertical Slice einen kurzen, eigenständig tragfähigen Arcade-Brawler-Run machen, bevor weitere Figuren, Arenen oder aufwendige VFX produziert werden.

> Bei Widersprüchen mit älteren Roadmaps gilt für Gameplay und Wave Completion dieses Dokument.

### Ausführungsstand 2026-09-05

**G0 abgeschlossen; G1 implementiert und technisch geprüft, manuelle Spielgefühlabnahme offen.** [G1-Prüfbericht](qa/g1-runtime-2026-09-05/README.md) · [Historische G0-Baseline](qa/gameplay-baseline-2026-09-05/README.md) · [Einheitliche Run-Messvorlage](qa/gameplay-run-template.md).

Technisch geprüft: 66/66 Tests, Typecheck und Production Build. Der Browser-Harness prüft die echten Phaser-Objekte mit allen vier Figuren, drei Abschnitten, Defeat, Restart sowie Duel/Gym. Die G0-Asset-Gates bleiben dokumentiert. Der Run hat weiterhin drei komponierte Gruppen (1/2/2), jetzt mit Director, sicherer Entry-Phase und phasenabhängigem Mana. Manuelle Spielgefühl-, Balance- und Realgeräteabnahmen bleiben offen; G2 beginnt nach der G1-Spielgefühlabnahme.

Zusatzauftrag Mobile: Querformat-Skalierung und Rotation korrigiert, vier Aktionsbuttons um 10 % vergrößert und Touch-Zonen angepasst. [Messwerte und Eingabeprüfung](qa/mobile-2026-09-05/README.md); Abschluss der Dokumentation am 2026-09-06.

**Präzisierte Abhängigkeiten aus dem Codeabgleich:**

- G2 beweist Rollen zunächst mit den verfügbaren Spielermitteln. Guard-/Evade-/Knockdown-Reaktionen erhalten dort einen Datenvertrag und werden erst nach G4 vollständig integriert und abgenommen. G3 darf auf der dokumentierten Rollen-Prototypabnahme aufbauen.
- Funktional notwendige Telegraphen und Offscreen-Schutz gehören bereits zu G1/G2. G9 vervollständigt die Kommunikation; es ist keine Voraussetzung, frühe Gefahren fair lesbar zu machen.
- Der Mana-Warteexploit wird durch den Phasenvertrag bereits in G1 geschlossen. G8 behält Combat-Regeneration, Pickup-Wirkung und vollständige Run-Balance. Begründung: frühe Encounter-Playtests dürfen nicht auf durch Travel-Warten garantierten vollen MP beruhen.
- Director und neue Rollenlogik entstehen unmittelbar als fokussierte, testbare Module. G10 härtet die nach G1–G9 tatsächlich belasteten Grenzen und konsolidiert verbleibende Altlogik; es verschiebt die modulare Implementierung neuer Systeme nicht nach hinten.

## 1. Ausgangslage

Das Projekt besitzt bereits eine belastbare technische Grundlage:

- Pseudo-Depth-Bewegung mit `x`, `y` und Fake-`z`;
- datengetriebene Fighter, Angriffe, Projektile und Stage-Abschnitte;
- Startup-, Active- und Recovery-Phasen;
- Hit-, Hurt- und Pushboxen mit Lane- und Höhenprüfung;
- Hitstop, Knockback, Hitstun, Treffer-VFX, SFX und Input Buffer;
- vier normale Spielerfiguren sowie diagnostische Prototypen im Combat Gym;
- ein Wave-Level mit drei Zonen sowie Combat-, Travel- und Transition-Phasen;
- striktes TypeScript und eine bereits funktionierende Testbasis.

Der Engpass ist nicht mehr die technische Machbarkeit, sondern die spielerische Dichte:

- `Junkyard Run` besteht noch aus wenigen statischen Gegnergruppen;
- Gegner unterscheiden sich stärker über Werte als über Aufgaben und Verhalten;
- mehrere Gegner werden seit G1 über getrennte Druckbudgets gestaffelt; ihre spielerische Wirkung muss noch manuell abgenommen werden;
- der Mana-Warteexploit in sicheren Travel-Phasen ist seit G1 gesperrt;
- dem Spieler fehlen normale Crowd-Antworten wie Guard/Evade, Dash-Grammatik, Basic-Chain und klarer Knockdown/Wake-up;
- Midboss, eigenständiger Endboss, Stage-Interaktionen und Ressourcenentscheidungen fehlen;
- HUD, Kamera und Offscreen-Kommunikation sind für dichtere Encounters noch nicht ausreichend;
- Teile der Laufzeitlogik liegen zu konzentriert in der `BattleScene`.

Das Ergebnis ist ein gut präsentierter Combat-Prototyp, aber noch keine vollständige kurze Stage.

## 2. Produktposition und Referenzrahmen

Die sinnvollste Produktbeschreibung lautet:

> **Streets of Rage × Castle Crashers als kompakter, charakterstarker Browser-Brawler.**

Little Fighter 2 bleibt eine wichtige Referenz für die unterliegende Systemlogik:

- Raumgewinn nach besiegten Gruppen;
- Kampf, kurze Entlastung und neuer Druck;
- Gegnerrollen statt bloßer HP-Varianten;
- defensive und mobile Antworten auf Crowd-Druck;
- Ressourcenknappheit über einen Run;
- Eskalation von Mooks über Elites und Midboss bis zum Boss;
- lesbare Spezialfähigkeiten und überraschende, aber faire Begegnungen.

Nicht übernommen werden:

- geschützte Figuren, Namen, Animationen, Sounds, UI oder Stage-Inhalte;
- LF2s vollständige Tastenkombinationssprache auf Mobile;
- fünf Kampagnenstages, Survival, Co-op oder großes Roster als erstes Ziel;
- Inhaltsmenge als Ersatz für einen guten einzelnen Run.

Der Abstand zu LF2 soll zunächst nicht durch maximale Feature-Parität geschlossen werden. Entscheidend sind Encounter-Komposition, Rollenvielfalt, Crowd-Kontrolle und ein vollständiger Spannungsbogen.

Referenzquellen:

- [Offizielle LF2-Einführung](https://www.lf2.net/en/intro.html)
- [LF2 Stage Mode](https://lf2.fandom.com/wiki/Stage_Mode)
- [LF2 Stage 1 – Acts und Waves](https://lf2.fandom.com/wiki/Stage_1)
- [LF2 Stage-/Bound-Datenmodell](https://www.lf-empire.de/lf2-empire/data-changing/types/166-stage)
- [LF2 Basic Moves](https://lf2.fandom.com/wiki/Basic_Moves)

## 3. Leitprinzip der neuen Reihenfolge

Systeme und spielbarer Inhalt werden abwechselnd aufgebaut. Kein großer Infrastrukturblock darf über mehrere Bulks hinweg nur abstrakte Möglichkeiten schaffen.

Die verbindliche Schleife lautet:

1. Regelkern einführen;
2. sofort mit sichtbarem Gameplay-Inhalt beweisen;
3. Crowd-Sicherheit und Spielerausdruck ergänzen;
4. Stage dramaturgisch vervollständigen;
5. erst danach Balance, Präsentation und Architektur härten.

Jeder Bulk muss einen im Build beobachtbaren Fortschritt liefern. Finale Art wird erst produziert, wenn das zugrunde liegende Verhalten bewiesen ist.

## 4. Zielbild für den ersten vollständigen Run

Der erste professionelle Gameplay-Meilenstein ist ein kompletter `Junkyard Run` mit:

- drei visuell unterscheidbaren Zonen;
- sieben Encounter-Phasen;
- klaren Entry-, Active-, Clear-, Travel- und Transition-Zuständen;
- vier normalen Gegnerrollen mit jeweils eigener mechanischer Comedy-Signatur;
- einem Midboss und einem zweiphasigen Endboss;
- zwei bis vier sichtbaren Gegnern, aber kontrolliertem gleichzeitigem Druck;
- einem defensiven Spielerwerkzeug;
- Run/Dash, Dash Attack und kurzer Basic-Chain;
- Knockdown, Wake-up und Schutz vor Crowd-Stunlock;
- ein bis zwei Stage-Interaktionen und einem deterministischen Pickup-Moment;
- relevanter HP-/MP-Attrition über den vollständigen Run;
- Gegnerzahl, Offscreen-Hinweisen und eigenem Boss-HUD;
- vollständigem Victory-, Defeat-, Restart- und Menu-Flow;
- ungefähr **7–10 Minuten** Zielspielzeit nach erster Spielgefühlabnahme.

Die Zielzeit ist eine Tuning-Hypothese. Leerlauf und Schadensschwämme gelten nicht als Inhalt.

## 5. Verbindliche Prioritäten und Reihenfolge

### P0 – Der Run bekommt Struktur und erkennbare Gegner

1. `BULK G0` – Baseline und Dokumentationswahrheit
2. `BULK G1` – Encounter Director und dynamisches Druckbudget
3. `BULK G2` – Gegnerökologie als spielbare Prototypen
4. `BULK G3` – Junkyard Run zu sieben Encounters ausbauen

### P1 – Crowd-Kampf und Stage werden vollständig

5. `BULK G4` – Crowd-Sicherheit: Guard/Evade, Knockdown und Wake-up
6. `BULK G5` – Combat-Breite: Run/Dash, Dash Attack und Basic-Chain
7. `BULK G6` – Stage-Rhythmus: Interaktionen, Pickup, Comedy und Midboss
8. `BULK G7` – Zweiphasiger Endboss
9. `BULK G8` – Ressourcen- und Gesamtbalance
10. `BULK G9` – HUD, Offscreen-Hinweise, Kamera und Wave-Audio

### P2 – Härten, abnehmen und ausliefern

11. `BULK G10` – Architektur gezielt härten und Runtime-Gates ergänzen
12. `BULK G11` – Mobile-, Asset- und Release-Abnahme
13. `BULK G12` – Optionale LF2-artige Erweiterungen nach Freigabe

## 6. BULK G0 – Baseline und Dokumentationswahrheit

**Status:** abgeschlossen am 2026-09-05. [Abnahme und Befunde](qa/gameplay-baseline-2026-09-05/README.md). Die folgenden Punkte beschreiben den gelieferten Umfang; offene manuelle Release-Gates bleiben ausdrücklich offen.

**Priorität:** P0<br>
**Risiko:** niedrig<br>
**Abhängigkeit:** keine

### Ziel

Eine reproduzierbare Ausgangsbasis herstellen und widersprüchliche Statusdokumente bereinigen, ohne Gameplay zu verändern.

### Lieferumfang

- Typecheck, Tests, Production Build und Asset-Report protokollieren;
- tatsächliche Testzahl und shippable Roster mit Roadmap und QA-Dokumenten abgleichen;
- offene Realgeräte-, Browser- und Balance-Gates ausdrücklich offen markieren;
- Messvorlage für vollständige Runs anlegen:
  - Run-Dauer;
  - Dauer und erhaltener Schaden pro Encounter;
  - Todesursache;
  - eingesetzte Specials/Ultimates;
  - maximale sichtbare und gleichzeitig angreifende Gegner;
  - Zeit ohne Gegnerkontakt;
  - Rest-HP und Rest-MP an Encounter-, Zonen- und Run-Ende.

### Nicht enthalten

- Zahlen-Balancing;
- Roster- oder Stage-Erweiterung;
- Refactoring.

### Abnahme

- Dokumentation und Code beschreiben denselben aktuellen Projektstand;
- alle vorhandenen Gates bleiben grün;
- der Arbeitsbaum enthält nur beabsichtigte Änderungen;
- die Messvorlage lässt sich für jeden vollständigen Run identisch ausfüllen.

### Empfohlener Commit

`Align gameplay baseline and release status`

## 7. BULK G1 – Encounter Director und dynamisches Druckbudget

**Status 2026-09-05:** Implementierung und technische Prüfungen geliefert. Manuelle Druck-, Repositionierungs- und Trefferlesbarkeitsabnahme offen; Details und reproduzierbare Befehle im [G1-Prüfbericht](qa/g1-runtime-2026-09-05/README.md).

**Priorität:** P0<br>
**Risiko:** mittel<br>
**Abhängigkeit:** G0

### Ziel

Einen deterministischen Encounter Director schaffen, der mehrere aktive Gegner bedrohlich, lesbar und abgestuft orchestriert.

### Zustandsmodell

```txt
section_intro
  -> spawning
  -> active
  -> clear_delay
  -> travel
  -> transition
  -> next_section | victory
```

Jeder Wechsel folgt einer testbaren Bedingung und nicht verteilten Scene-Timern.

### Druckmodell

Kein dauerhaft starres „genau ein Gegner greift an“. Der Director verwaltet getrennte Budgets:

- `meleeTokens`;
- `rangedTokens`;
- `disruptionBudget`;
- rollen- oder bossabhängige Ausnahmen.

Startprofile:

| Abschnitt | Zulässiger Druck |
|---|---|
| Zone 1 | höchstens ein aktiver Nahkampfangriff |
| Zone 2 | ein Nahkampfangriff plus ein klar telegraphierter Fernangriff |
| Zone 3 | kurze Fenster mit zwei Angriffen, nur wenn Richtung und Timing lesbar bleiben |
| Midboss/Boss | eigener getesteter Vertrag; Adds bleiben im Director-Budget |

### Lieferumfang

- Director als testbare Core-Komponente;
- neue Wave-Regeln direkt im Director modellieren; die Scene integriert Darstellung und Lifecycle, G10 konsolidiert später verbleibende Altlogik;
- Encounter-Aktivierung von Darstellung und Stage-Text trennen;
- sichere, sichtbare Spawn-Entry-Phase;
- Gegner greifen vor `active` nicht an und erzeugen keine Projektile;
- Tokens nach Hit, Whiff, Abbruch, State-Wechsel oder Tod zuverlässig freigeben;
- wartende Gegner repositionieren sich sinnvoll;
- Spawn-Overlap, Angriffe hinter der Kamera und unkommunizierte Offscreen-Projektile verhindern;
- bereits hier funktionale Entry-/Angriffshinweise liefern; bis zu einem verlässlichen Indikator gefährliche Offscreen-Angriffe unterbinden, G9 übernimmt spätere HUD-/Audio-Verfeinerung;
- Mana-Regeneration an den Simulations-/Encounter-Phasenvertrag binden: keine Regeneration während `travel`, `transition`, Pause oder Ergebnis; Combat-Rate und Kosten unverändert lassen;
- Debug-Anzeige für Section, Encounter, Director-State und belegte Budgets.

### Automatisierte Abnahme

- kein Angriff vor Encounter-Aktivierung;
- Budgets werden nie überschritten;
- kein verlorenes Token nach Tod, Interrupt oder Restart;
- kein Spawn überlappt Spieler oder anderen Spawn;
- Travel startet erst nach vollständigem Clear;
- Projektile werden bei Travel, Defeat und Victory korrekt bereinigt.
- Mana steigt durch Warten in Travel, Transition, Pause oder Ergebnis nicht; laufender Combat behält die bisherigen Regenerationswerte, Duel/Gym regressionsprüfen.

### Manuelle Abnahme

- wartende Gegner wirken beschäftigt, nicht abgeschaltet;
- steigender Druck ist sichtbar, aber nicht zufällig;
- der Spieler erkennt Ursache, Richtung und Zeitfenster eines Treffers.

### Empfohlener Commit

`Add deterministic encounter pressure director`

## 8. BULK G2 – Gegnerökologie als spielbare Prototypen

**Priorität:** P0<br>
**Risiko:** mittel bis hoch<br>
**Abhängigkeit:** G1

### Ziel

Vor dem Ausbau auf sieben Encounters vier klar unterscheidbare Rollen beweisen. Die Stage soll später Kombinationen von Verhalten variieren, nicht siebenmal dieselben Gegner hochzählen.

### Verbindliche Rollen

1. **Grunt/Pursuer – Angry Pigeon**
   - schließt Distanz schnell;
   - wenig HP und kurze, klare Nahkampffenster;
   - Comedy-Signatur: überzieht einen Angriff und gerät bei Whiff kurz sichtbar aus dem Takt.
2. **Flanker/Disruptor – Prototyp**
   - wechselt Lane oder Eintrittsrichtung;
   - zwingt zu Positionswechsel, ohne kostenlos von hinten zu treffen;
   - Comedy-Signatur: misslungener Ansturm endet in einer kurzen Schrottplatz-Panne.
3. **Heavy/Armor – Prototyp**
   - langsam, breite Telegraphie, hoher Raumdruck;
   - Armor verlangt Heavy, Flanke oder bewusstes Abwarten;
   - Comedy-Signatur: Armor Break verändert sichtbar Haltung, Silhouette oder Verhalten.
4. **Zoner – Discount Wizard**
   - hält Wunschdistanz und telegraphiert Projektile;
   - wird im Nahkampf verletzlich und flieht kontrolliert;
   - Comedy-Signatur: ein klar lesbarer Fehlzauber erzeugt Eigen-Stagger oder einen harmlosen Blindgänger.

### Produktionsregel

Zuerst Verhalten, Boxen, Telegraphie und Kombinationen mit klar markierter Prototypdarstellung beweisen. Finale Sprites beginnen erst nach mechanischer Abnahme.

### Verbindlicher Rollenvertrag

Jede Rolle definiert:

- Wunschdistanz und bevorzugte Lane;
- erlaubte Director-Budgets;
- Entry-, Attack-, Recovery- und Repositionierungsverhalten;
- Reaktion auf Guard, Evade, Projectile, Armor Break und Knockdown;
- mindestens eine faire Schwäche;
- genau eine mechanisch erkennbare Comedy-Signatur.

**Gestufte Abnahme:** Guard, Evade und vollständiger Knockdown entstehen erst in G4. G2 definiert die vorgesehenen Reaktionen und beweist jede Rolle mit bereits verfügbaren Antworten, etwa Positionierung, Angriff oder Abwarten. Die Integration der G4-Reaktionen bleibt explizit offen und wird vor Abschluss von G4 nachgeprüft. Diese begrenzte G2-Prototypabnahme trägt G3; sie ist keine vorgezogene Abnahme fehlender Defensivmechaniken.

**Austauschtest:** Wenn Sprite und Name vertauscht werden könnten und sich das Verhalten weiterhin gleich anfühlt, ist die Rolle nicht fertig.

### Abnahme

- jede Rolle ist ohne Namensschild am Verhalten erkennbar;
- keine Rolle ist nur eine HP-/Speed-Variante;
- Comedy entsteht im Gameplay und nicht nur durch Text oder Idle-Animation;
- jede Rolle funktioniert einzeln und in mindestens zwei Zweierkombinationen;
- alle Rollen bleiben in Full-, Reduced- und Minimal-VFX lesbar.

### Empfohlene Commit-Grenzen

1. `Add role-based enemy behavior contracts`
2. `Add flanker and heavy enemy prototypes`
3. `Add mechanical comedy signatures to enemy roles`

## 9. BULK G3 – Junkyard Run zu sieben Encounters ausbauen

**Priorität:** P0<br>
**Risiko:** mittel<br>
**Abhängigkeit:** G1 und G2

### Ziel

Aus den drei statischen Gruppen sieben kurze Encounter machen, die Gegnerrollen lehren, kombinieren und steigern.

### Verbindliches Encounter-Skelett

#### Zone 1 – Scrap Gate

1. **Einführung:** einzelner Pigeon; Director und Grundrhythmus werden lesbar.
2. **Erste Kombination:** Pigeon plus verspäteter Flanker; noch nur ein Nahkampftoken.

#### Zone 2 – Furnace Yard

3. **Distanzkonflikt:** Pigeon plus Wizard; Nah- und Fernkampfdruck werden gestaffelt.
4. **Raumdruck:** Heavy plus Pigeon; Armor und Positionierung werden geprüft.
5. **Provisorischer Elite-Slot:** Rollenmix mit klarer Eskalation; wird in G6 zum Midboss-Encounter.

#### Zone 3 – Neon Dump

6. **Gemischter Hinterhalt:** drei Rollen, gestaffelter Eintritt und kurzes erhöhtes Druckbudget.
7. **Provisorisches Finale:** vorhandener Elite-/Rollenmix; wird in G7 durch den Endboss ersetzt.

### Lieferumfang

- Sections enthalten datengetriebene Encounter;
- Sub-Waves innerhalb einer Zone funktionieren ohne Travel-Teleport;
- Entry-Richtung und Spawn-Timing sind pro Spawn konfigurierbar;
- `defeat_all` ist die erste Completion Rule;
- `defeat_priority` wird für G7 vorbereitet, aber nicht vorzeitig verwendet;
- Section-Clear und Stage-Clear bleiben getrennt;
- Travel findet nur zwischen Zonen statt.

### Abnahme

- exakt sieben Encounter laufen vollständig durch;
- jeder Encounter besitzt eine erkennbare spielerische Aufgabe;
- Schwierigkeit wächst durch Rollenkomposition, Timing und Druckbudget, nicht primär HP;
- kein Softlock nach Tod, Projectile-Clear, Defeat, Victory oder Restart;
- Duel und Combat Gym bleiben unverändert.

### Empfohlener Commit

`Compose seven role-based Junkyard encounters`

## 10. BULK G4 – Crowd-Sicherheit: Guard/Evade, Knockdown und Wake-up

**Priorität:** P1<br>
**Risiko:** hoch, da Kerngefühl<br>
**Abhängigkeit:** G1–G3

### Ziel

Dem Spieler eine verständliche aktive Antwort auf Crowd-Druck geben und garantierte Stunlock-Ketten durch eindeutige Trefferzustände verhindern.

### Verbindlicher Minimalumfang

- neue Input-Aktion `defend`;
- stationär oder ohne starke Richtung: Guard;
- Richtung plus `defend`: kurze Evade, Rolle oder Sidestep;
- klarer Vertrag für Schaden, Hitstun, Guard Break und Invulnerability;
- getrennte Zustände für `launched`, `knockdown`, `grounded` und `wake_up` oder äquivalente Zustände;
- move-seitiger Knockdown-/Launch-Vertrag;
- kurze Schutzphase beim Wake-up;
- keine Boden-Infinites;
- Combat-Gym-Preset für Guard, Evade, Launch, Knockdown und Wake-up.

### Mobile-Regel

Die endgültige Bedienung wird erst nach einem Prototyp festgelegt. Ein zusätzlicher dauerhafter Button bleibt nur, wenn kleinste Landscape-Geräte keine wichtige Kampf- oder HUD-Fläche verlieren.

### Gameplay-Vertrag

- Guard ist kein risikoloser Dauerzustand;
- Evade besitzt ein kurzes, präzises Schutzfenster und lesbare Recovery;
- Block, Armor und Invulnerability bleiben technisch getrennte Ergebnisse;
- schwere Treffer fühlen sich anders an als normaler Hitstun;
- zwei Gegner können den Spieler nicht unbegrenzt abwechselnd stunnen;
- Tod bleibt vom normalen Knockdown getrennt.

### Abnahme

- der Spieler kann kontrolliert aus einer Zwei-Gegner-Drucksituation entkommen;
- kein Ground Infinite und keine garantierte Bounds-Endlosschleife;
- Wake-up-Schutz ist fair, sichtbar und getestet;
- Input Buffer erzeugt keine doppelte Evade;
- mobile Hit-Targets bleiben überschneidungsfrei.
- G2-Rollenvertrag gegen Guard, Evade und Knockdown mit den nun verfügbaren Spieleraktionen integrieren und vollständig nachprüfen.

### Empfohlene Commit-Grenzen

1. `Add player guard and evade contract`
2. `Add knockdown and protected wake-up states`

## 11. BULK G5 – Combat-Breite: Run/Dash, Dash Attack und Basic-Chain

**Priorität:** P1<br>
**Risiko:** hoch, da Bewegungsgefühl<br>
**Abhängigkeit:** G4

### Ziel

Mehr Entscheidungen zwischen Annäherung, Positionswechsel und Treffer schaffen, ohne ein komplexes Combo-System zu bauen.

### Lieferumfang

- expliziter Run- oder Dash-Zustand;
- ergonomische Aktivierung auf Keyboard und Touch;
- eigener Dash Attack;
- maximal dreistufige datengetriebene Basic-Chain pro shippable Figur;
- definierte Cancel- und Buffer-Fenster;
- unterschiedliche Risiken für Hit- und Whiff-Fortsetzung;
- zunächst keine freien Special-/Ultimate-Cancel-Ketten.

### Designregeln

- keine endlose Light-Attack-Schleife;
- jeder Schritt besitzt klare Silhouette und steigendes Commitment;
- der letzte Schritt darf Knockdown auslösen;
- Dash Attack verbessert Annäherung, ersetzt aber nicht alle anderen Moves;
- Whiff der vollen Chain öffnet ein faires Gegenfenster.

### Abnahme

- wiederholtes ATK fühlt sich rhythmisch, nicht automatisch an;
- alle Schritte bleiben bei realer Mobile-Größe lesbar;
- gepufferter Input startet maximal einen Folgeschritt;
- Hitstop, Hitstun und Whiff beschädigen den Buffer-Vertrag nicht;
- Duel, Waves und Gym nutzen denselben Move-Vertrag.

### Empfohlene Commit-Grenzen

1. `Add run and dash attack states`
2. `Add data-driven basic attack chains`

## 12. BULK G6 – Stage-Rhythmus: Interaktionen, Pickup, Comedy und Midboss

**Priorität:** P1<br>
**Risiko:** mittel<br>
**Abhängigkeit:** G3–G5

### Ziel

Den Run zwischen normalen Gruppen dramaturgisch gliedern, ohne eine zweite Stage oder ein allgemeines Physik-Sandbox-System zu bauen.

### Lieferumfang

- Encounter 5 wird zu einem eigenständigen Midboss;
- ein bis zwei einfache, datengetriebene Stage-Interaktionen;
- ein deterministischer Pickup- oder Reward-Moment;
- ein kurzer Traversal- oder Comedy-Moment ohne erzwungenen langen Leerlauf;
- mindestens eine Interaktion beeinflusst Position, Gefahr oder Ressourcen und ist nicht nur Dekoration;
- vollständige Bereinigung aller Interaktionen bei Restart, Defeat und Victory.

Geeignete kleine Beispiele:

- telegraphierter Schrottpressen- oder Dampfstoß als temporäre Lane-Gefahr;
- zerstörbarer Behälter mit festem HP- oder MP-Pickup;
- kurz rutschender Schrotthaufen, der Gegner und Spieler lesbar verschiebt;
- Midboss-Panne oder Arena-Reaktion als mechanische Pointe.

### Grenzen

- keine allgemeine Waffenbibliothek;
- keine zufällige Loot-Tabelle;
- keine Story-Cinematic;
- höchstens zwei neue Interaktionstypen;
- Midboss ist ein eigenständiges Muster, kein normaler Gegner mit verdoppelten HP.

### Abnahme

- Zone 2 besitzt einen klaren Höhepunkt vor dem Übergang;
- Pickup-Platzierung und Wirkung sind reproduzierbar;
- Comedy verändert einen spielerischen Moment;
- Stage-Gefahr ist telegraphiert und kann nicht unsichtbar offscreen treffen;
- der Run hat erkennbare Spannung, Entlastung und erneute Eskalation.

### Empfohlene Commit-Grenzen

1. `Add Junkyard interaction and deterministic pickup`
2. `Add Junkyard midboss encounter`

## 13. BULK G7 – Zweiphasiger Endboss

**Priorität:** P1<br>
**Risiko:** hoch<br>
**Abhängigkeit:** G1, G2, G4 und G6

### Ziel

Encounter 7 durch einen eigenständigen, lernbaren Höhepunkt ersetzen.

### Boss-Vertrag

- eigene Schrottplatz-Identität und eigenes HUD;
- mindestens drei unterscheidbare Aktionen:
  - schneller, punishbarer Nahmove;
  - großer Area-Denial-Move;
  - Repositionierungs-, Summon- oder Arena-Move;
- zwei deutlich unterscheidbare Phasen;
- sichtbare Startup-Hinweise für jeden gefährlichen Angriff;
- keine normale Fighter-AI mit bloß mehr HP;
- Adds ausschließlich über Director und Druckbudget;
- `defeat_priority` bereinigt verbleibende Adds kontrolliert.

### Abnahme

- Musterlernen verbessert die Erfolgschance nach wenigen Versuchen;
- beide Phasen verändern Entscheidungen, nicht nur Geschwindigkeit oder Schaden;
- Boss plus Adds erzeugen keine unlösbare Druckkombination;
- Sieg bereinigt AI, Projektile, Interaktionen und VFX;
- Restart reproduziert den vollständigen Encounter.

### Empfohlener Commit

`Add two-phase Junkyard boss encounter`

## 14. BULK G8 – Ressourcen- und Gesamtbalance

**Priorität:** P1<br>
**Risiko:** mittel<br>
**Abhängigkeit:** G6 und G7

### Ziel

Erst am nun vollständigen Run Attrition, HP, MP, Schaden, Encounter-Dauer und Druckprofile gemeinsam abstimmen.

### Verbindlicher Vertrag

- Mana regeneriert während `travel`, `transition`, Pause und Ergebnisbildschirm nicht;
- diese Phasensperre ist seit G1 implementiert und wird hier im vollständigen Run erneut überprüft;
- Combat-Regeneration wird anhand kompletter Runs bewertet;
- deterministische HP-/MP-Belohnung aus G6 erzeugt eine echte Entscheidung;
- Ultimate ist nicht automatisch zu Beginn jedes Encounters garantiert;
- Rollen- und Boss-HP werden auf gewünschte Begegnungsdauer getunt;
- Schwierigkeitsanstieg erfolgt zuerst über Komposition und Budget, dann über Werte.

### Zu messende Zielwerte

- ungefähr 7–10 Minuten Run-Dauer;
- kein normaler Encounter wird zum Schadensschwamm;
- keine Travel-Phase belohnt passives Warten;
- gute Runs erreichen den Boss mit erkennbarem Vorteil, aber nicht garantiert voll;
- mindestens ein früher, mittlerer und späterer Encounter kann als Hauptschadensquelle identifiziert werden;
- Figuren bleiben unterschiedlich, aber alle können den Run ohne Exploit abschließen.

### Abnahme

- HP-/MP-Wahl ist situationsabhängig sinnvoll;
- Todesursachen sind überwiegend verständliche Fehlentscheidungen;
- kein einzelner Move trivialisiert mehrere Rollen und beide Bosse;
- Balancewerte basieren auf protokollierten vollständigen Runs.

### Empfohlener Commit

`Tune full-run resources and encounter balance`

## 15. BULK G9 – HUD, Offscreen-Hinweise, Kamera und Wave-Audio

**Priorität:** P1<br>
**Risiko:** niedrig bis mittel<br>
**Abhängigkeit:** G3, G7 und G8

### Ziel

Encounter-Zustand und Gefahren ohne Debug-UI verständlich machen.

### Lieferumfang

- Restgegner und kompakter Encounter-Fortschritt;
- Offscreen-Indikatoren für aktive Gegner und gefährliche Projektile;
- eigenes Midboss-/Boss-HUD;
- kurzer `GO`-/Pfadimpuls;
- getrennte Kamera-Parameter für Combat und Travel;
- Deadzone und Follow-Lerp für kleinste und breiteste Zielklasse;
- kurze SFX für Spawn, Clear, GO, Midboss, Boss-Eintritt, Victory und Defeat;
- Musik/Ambience erst nach funktionalen Cues und Lautheitsbudget.

### Abnahme

- Spieler erkennt Ziel, Restgefahr und nächste Richtung;
- kein Gegner trifft wiederholt ohne sichtbare Gefahrenkommunikation;
- HUD, Pfeile und Touch-Controls verdecken keine Telegraphen;
- Combat-Kamera ist ruhiger als Travel-Kamera;
- Audio-Cues verdecken keine Hit- oder Boss-Warnungen.

### Empfohlene Commit-Grenzen

1. `Add wave threat and progress HUD`
2. `Separate combat and travel camera behavior`
3. `Add wave transition audio cues`

## 16. BULK G10 – Architektur gezielt härten und Runtime-Gates ergänzen

**Priorität:** P2<br>
**Risiko:** mittel<br>
**Abhängigkeit:** G1–G9 spielerisch freigegeben

### Ziel

Nur die durch den vollständigen Run nachweislich belasteten Architekturgrenzen verbessern. Keine Neuschreibung des Combat-Kerns.

### Lieferumfang

- Wave-State, Spawnfortschritt und Completion im Director bündeln;
- AI-Orchestrierung und Druckbudgets aus der Scene extrahieren;
- Presentation darf Position, Schaden oder Completion nicht direkt besitzen;
- Gameplay-Motion und Area-Hit-Auflösung aus Presentation-Code lösen;
- `BattleScene` bleibt Integrationspunkt, aber nicht Besitzer jeder Regel;
- Unit-Tests für Director, Enemy Controller, Budgets, Rewards und Result-Flow;
- Browser-Smoke für Menu, Select, Duel, Gym, vollständigen Wave-Run und Restart;
- Lint-Gate und geprüfte Dependency-Versionen.

### Refactoring-Regel

- keine komplette Neuschreibung;
- keine Balanceänderung im selben Commit wie eine Extraktion;
- jede Extraktion bewahrt beobachtbares Verhalten durch Tests;
- nur Code trennen, dessen Verantwortung durch G1–G9 tatsächlich klar geworden ist.

### Abnahme

- Director und AI-Orchestrierung sind ohne Phaser-Scene testbar;
- kein Gameplay-Schaden in reinen Presentation-Klassen;
- Typecheck, Tests, Lint, Build und Browser-Smoke sind grün;
- Duel und Combat Gym verhalten sich unverändert.

### Empfohlene Commit-Grenzen

1. `Extract wave encounter runtime from BattleScene`
2. `Separate gameplay motion from combat presentation`
3. `Add battle flow browser smoke tests`

## 17. BULK G11 – Mobile-, Asset- und Release-Abnahme

**Priorität:** P2<br>
**Risiko:** mittel<br>
**Abhängigkeit:** G10

### Ziel

Den vollständigen Vertical Slice auf realen Zielgeräten und im ausgelieferten Build beweisen.

### Lieferumfang

- mindestens zwei reale Landscape-Geräteklassen;
- vollständiger Run mit jeder shippable Spielerfigur;
- Full-, Reduced- und Minimal-VFX;
- Multi-Touch, Rotation, Safe Areas und Audio-Unlock;
- Frametimes im dichtesten Encounter und Boss;
- klare Trennung von Runtime- und Source-Assets;
- reale Transfergröße und Startzeit als Asset-Budget;
- Direktreload und fehlende Assetpfade im Deployment prüfen.

### Harte Release-Gates

- keine reproduzierbaren Softlocks;
- keine verlorenen oder klebenden Touch-Inputs;
- keine fehlenden Runtime-Assets;
- kein unlesbarer Crowd-, Midboss- oder Boss-Encounter;
- vollständiger Run ohne Konsolenfehler;
- Gerät, Browser, Commit, Ergebnis und Messwerte dokumentiert.

### Empfohlene Commit-Grenzen

1. `Add runtime asset loading budget`
2. `Remove non-runtime assets from public build`
3. `Document vertical slice device acceptance`

## 18. BULK G12 – Optionale Erweiterungen

**Priorität:** P3, ausdrücklich erst nach G11<br>
**Abhängigkeit:** erfolgreicher erster Run

### Mögliche Reihenfolge

1. Grab und Throw;
2. geworfene Gegner als Crowd-Projektil;
3. ein leichter und ein schwerer aufnehmbarer Gegenstand;
4. einzelner Verbündeter oder Gefangener als Stage-Ereignis;
5. Difficulty-Profile über Director-Budgets;
6. Checkpoint nach Zone 2;
7. zweite Stage;
8. lokaler Co-op;
9. Survival Mode.

### Nicht gemeinsam implementieren

- Grab/Throw und Waffen nicht im selben Bulk;
- zweite Stage und neuer Spielerfighter nicht parallel;
- Co-op und Survival nicht parallel;
- Meta-Progression nicht vor stabiler Run-Balance.

## 19. Messbare Gameplay-Gates

### Encounter

- kein Angriff vor abgeschlossener Entry-Phase;
- kein dauerhaft verlorenes Angriffstoken;
- kein Budget wird ohne explizite Bossregel überschritten;
- keine Offscreen-Gefahr ohne Indikator;
- keine Phase mit mehr als fünf Sekunden erzwungenem Leerlauf, außer kurzer Reward-Moment;
- alle sieben Encounter sind erreichbar und abschließbar.

### Gegnerökologie

- vier Rollen sind ohne Namensschild unterscheidbar;
- jede Rolle besitzt eine eigene Antwort und Schwäche;
- jede Rolle besitzt eine mechanische Comedy-Signatur;
- mindestens sechs sinnvolle Zweierkombinationen sind getestet;
- Midboss und Boss sind keine HP-Varianten normaler Gegner.

### Combat

- Guard, Evade, Dash und Chain respektieren Input Buffer und Hitstop;
- Heavy, Launch und Knockdown sind visuell unterscheidbar;
- kein Ground Infinite oder garantierter Crowd-Stunlock;
- jede shippable Figur besitzt nachvollziehbaren Vorteil und Risiko;
- kein einzelner Move löst jede Gegnerrolle optimal.

### Run

- Sieg, Niederlage, Restart und Menu ohne Softlock;
- HP/MP-Entscheidungen beeinflussen den späteren Run;
- kein Vorteil durch passives Warten;
- Midboss und Boss werden durch Musterlernen fairer;
- vollständiger Run pro Fighter auf Touch und Keyboard;
- Zielkorridor 7–10 Minuten ohne künstliche HP-Streckung.

## 20. Arbeitsregeln für den Coding Agent

1. Vor jedem Bulk Arbeitsbaum prüfen und fremde Änderungen erhalten.
2. Pro Commit nur eine Gameplay-Ursache ändern.
3. Balance und Architektur nicht im selben Commit verändern.
4. Neue Regeln möglichst zuerst als Datenvertrag oder pure Core-Logik modellieren.
5. Prototyp-Art ausdrücklich markieren; finale Art erst nach mechanischer Abnahme.
6. Keine neuen Spielerfiguren oder Arenen während G0–G9.
7. Tests müssen beobachtbares Verhalten und nicht nur Implementierungsdetails sichern.
8. Nach jedem Bulk Typecheck, Tests und Production Build ausführen.
9. Bei Wave-Änderungen Duel und Combat Gym regressionsprüfen.
10. Manuelle Spielgefühlabnahme nie automatisch als bestanden markieren.
11. Einen Bulk vollständig abnehmen, bevor der nächste seine Annahmen darauf aufbaut.
12. Wenn ein Bulk die erwartete Spielwirkung nicht erzeugt, den Vertrag korrigieren statt ungeplant neue Systeme hinzuzufügen.

## 21. Autoritative Gesamtreihenfolge

```txt
G0  Baseline und Dokumentationswahrheit
 -> G1 Encounter Director und dynamisches Druckbudget
 -> G2 Gegnerökologie:
       Grunt, Flanker/Disruptor, Heavy/Armor, Wizard/Zoner
       plus je eine mechanische Comedy-Signatur
 -> G3 sieben rollenbasierte Encounters
 -> G4 Crowd-Sicherheit:
       Guard/Evade, Anti-Stunlock, Knockdown und Wake-up
 -> G5 Combat-Breite:
       Run/Dash, Dash Attack und Basic-Chain
 -> G6 Stage-Rhythmus:
       1–2 Interaktionen, deterministischer Pickup,
       Traversal-/Comedy-Moment und Midboss
 -> G7 zweiphasiger Endboss
 -> G8 Ressourcen- und Gesamtbalance
 -> G9 HUD, Offscreen-Hinweise, Kamera und Wave-Audio
 -> vollständiger Gameplay-Playtest
 -> G10 Architektur gezielt härten und Runtime-Tests
 -> G11 Mobile-/Asset-/Release-Gate
 -> optional G12:
       Grab/Throw, Waffen, Verbündete, Difficulty,
       zweite Stage, Co-op und Survival
```

Diese Reihenfolge darf nur geändert werden, wenn eine dokumentierte Abhängigkeit oder ein Playtest-Befund sie widerlegt. Insbesondere dürfen die sieben Encounter nicht vor den vier Rollen finalisiert und G10 nicht vor bewiesenem Gameplay vorgezogen werden.

## 22. Bewusste Nicht-Ziele bis G11

- keine zusätzliche Spielerfigur;
- keine zweite Stage;
- keine Story-Cinematics;
- kein Shop, Battle Pass oder langfristiger Grind;
- kein Online-Multiplayer;
- kein lokaler Co-op;
- kein prozedurales Endloslevel;
- kein Survival Mode;
- keine breite Waffenbibliothek;
- keine weitere große VFX-Produktion;
- keine vollständige Neuarchitektur.

## 23. Definition of Done

Der Plan ist erfüllt, wenn:

- `Junkyard Run` aus sieben klar inszenierten Encounter-Phasen besteht;
- vier mechanisch erkennbare Gegnerrollen die Encounter-Komposition tragen;
- jede Rolle mindestens eine spielerische Comedy-Signatur besitzt;
- der Director simultanen Nah-, Fern- und Stördruck kontrolliert;
- Spieler Guard/Evade, Run/Dash, Dash Attack, Basic-Chain und Knockdown-Recovery nutzen können;
- Stage-Interaktion, deterministischer Pickup, Midboss und zweiphasiger Boss einen vollständigen Spannungsbogen bilden;
- Travel kein Mana-Warteexploit mehr ist;
- HP/MP eine echte Run-Entscheidung bilden;
- HUD, Kamera und Audio Crowd- und Bossgefahren klar kommunizieren;
- der komplette Run auf Keyboard und mindestens zwei Touch-Geräteklassen abgenommen wurde;
- Runtime-Smoke, Typecheck, Tests, Lint, Build und Asset-Gates grün sind;
- erst danach neue Stage-, Roster- oder Meta-Expansion freigegeben wird.

Der entscheidende Produktmeilenstein ist nicht „mehr Content“, sondern ein einzelner Run, den Spieler nach einer Niederlage freiwillig sofort noch einmal starten wollen.
