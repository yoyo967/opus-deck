# STATUS — OPUS DECK

> Ehrlicher Projekt-Snapshot. Stand: 2026-07-07.

## Kurzfassung

**P0 (Fundament) läuft — die Wette steht.** Repo spec-/docs-first aufgesetzt; **der
Theia-Spike (WI-0.2) ist end-to-end bewiesen**: Theia installiert + baut fehlerfrei und
serviert einen laufenden, VS-Code-artigen Workbench mit unserer Marke „OPUS DECK"
(HTTP 200, `<title>OPUS DECK</title>`, Menüleiste File/Edit/…/Help, Activity Bar,
Statusleiste 0 Fehler/0 Warnungen, Konsole sauber). Verifiziert **im Linux-Container**
(= Ziel-Target Cloud Run, ADR-0003).

## Phase P0 — Fortschritt

| WI | Beschreibung | Status |
|----|--------------|--------|
| 0.1 | Repo + CI-Skelett + Gate-Struktur | ✅ Repo, CI-Skelett, Struktur-Gate |
| 0.2 | Theia-App bootet (Monaco, Workbench) | ✅ **bewiesen** (Container, HTTP 200, gerendert) |
| 0.3 | Branding/Theme-Paket (Tokens, Dark/Light, Logo) | 🟡 **teilweise** — applicationName + Fenstertitel „OPUS DECK" greifen; **volles Farb-Theme fehlt** (siehe unten) |
| 0.4 | ADR-Prozess + Spec-Ordner | ✅ ADR-0001/0002/0003 + spec/ |

## WI-0.2 — Ergebnis & ehrliche Einordnung

- **Foundation validiert:** `apps/workbench` (Theia, Browser-Target). `npm install` +
  `theia build` → **0 Fehler** (Browser- + Node-Bundle). Marke „OPUS DECK" greift bereits
  (applicationName).
- **Windows-Dev-Caveat:** Auf dem Windows-Rechner **ohne** Visual-Studio-C++-Build-Tools
  scheitern zwei native Backend-Module (`drivelist`, `nsfw`); Node 24 ist zudem zu neu für
  deren Prebuilds. **Kein Foundation-Problem** — reine lokale Toolchain-Frage.
- **Reproduzierbarer Weg = Container:** `apps/workbench/Dockerfile` (node:22-bookworm +
  build-essential) baut die nativen Module sauber und serviert die App. Das ist zugleich
  das Produktions-Target (Linux/Cloud Run). Lokal starten:
  `docker build -t opus-deck-workbench apps/workbench && docker run -p 3333:3333 opus-deck-workbench`
  → http://127.0.0.1:3333

## WI-0.3 — Branding (teilweise, ehrlich)

- **Greift bereits:** `applicationName: "OPUS DECK"` + `window.title` („OPUS DECK — …",
  visuell verifiziert).
- **Fehlt noch:** eigenes **Farb-Theme**. Ein Versuch, die Marken-Palette (near-black +
  Opus-Gold-Akzent) per `workbench.colorCustomizations` in den Default-Preferences zu setzen,
  **wirkte nicht** — diese Theia-Version registriert die Farb-Customization-Preference nicht
  ohne eine Theming-Extension (Konsole: „Linked preference workbench.colorCustomizations not
  found"). Die Statusleiste bleibt daher vorerst im Theia-Default (lila).
- **Richtiger Weg (WI-0.3 proper):** ein `packages/ui-kit` mit einer **Theia-/VS-Code-Theme-
  Contribution** (Design-Tokens als SSoT → Theme-JSON), plus Logo/Favicon. Nächster Schritt.

## Entscheidungen (verankert)

- **ADR-0001:** Eclipse Theia als Fundament.
- **ADR-0002:** ACP (+ MCP) für Agent-/Tool-Anbindung.
- **ADR-0003:** Web zuerst (Cloud Run EU), Desktop später.

## Nächster Schritt

**WI-0.2 — Theia-Spike:** minimale Theia-Browser-App zum Booten bringen (Node 24/npm
vorhanden), dann Branding-Theme (WI-0.3). Erst danach lohnt sich der weitere Ausbau
(Gateway/Auth/Projekte in P2, ACP-Anbindung in P3).

## Offene Owner-Entscheidungen (Masterplan §13)

- Hosting-Modell (Self-hosted vs. SaaS-Multi-Tenant zuerst)
- Erste Fremd-Agenten neben OPUS PRIME EX
- Monetarisierung (intern vs. Produkt)
- GitHub-Remote für `opus-deck` anlegen (aktuell nur lokal versioniert)
