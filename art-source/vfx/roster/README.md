# Roster-VFX-Quellen

Diese vier Quellen sind transparente, arenaunabhängige Primitive für BULK 4.3.
Sie bleiben vom Body-, Waffen- und Arena-Artwork getrennt und werden über
`config/vfx-roster.json` nach `public/assets/fx/roster/` exportiert.

| Quelle | Einsatz | Finaler Prompt-Kern |
|---|---|---|
| `wizard-cast-source.png` | Wizard Cast/Miscast | kompakter violett-cyanfarbener Comic-Crescent mit warmweißem Kern |
| `wizard-phase-source.png` | Wizard Teleport/Ultimate | dünne gebrochene Violett-/Cyan-Phasenbögen, kleiner Kern, keine Hot-White-Fläche |
| `warning-ring-source.png` | Axe Rain Telegraphie | dünner orange-roter Ground-Ring mit vier Chevrons, kein gefüllter Mittelpunkt |
| `shock-ring-source.png` | Axe Rain/Buster Ground-Folge | gebrochener amberfarbener Shock-Ring mit wenigen Debris-Keilen |

Alle wurden im Built-in-ImageGen-Modus als `stylized-concept` erzeugt. Die
Prompts verlangten echte Transparenz sowie ausdrücklich keinen Charakter,
keine Bodenfläche, keine Arena, keinen Text und kein Wasserzeichen.
