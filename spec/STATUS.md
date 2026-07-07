# STATUS — OPUS DECK

> Ehrlicher Projekt-Snapshot. Stand: 2026-07-07.

## Kurzfassung

**P0 komplett · P1-Kern verifiziert · P3-Fundament gelegt.** Der gebrandete Theia-Workbench
(„OPUS DECK", Opus-Gold) läuft im Linux-Container (= Cloud-Run-Target). **Editor + Dateien
end-to-end** (Explorer, Monaco, Upload, Download, Markdown-Vorschau) und die **erste custom
Agent-View** (OPUS-PRIME-EX-Chat-Shell im rechten Panel) sind live verifiziert. Details unten.

## Phase P0 — Fortschritt

| WI | Beschreibung | Status |
|----|--------------|--------|
| 0.1 | Repo + CI-Skelett + Gate-Struktur | ✅ Repo, CI-Skelett, Struktur-Gate |
| 0.2 | Theia-App bootet (Monaco, Workbench) | ✅ **bewiesen** (Container, HTTP 200, gerendert) |
| 0.3 | Branding/Theme-Paket (Tokens, Dark/Light, Logo) | ✅ **Marken-Branding sichtbar** — Titel + Opus-Gold-Akzent via `packages/ui-kit` (Logo/Voll-Theme = Ausbau) |
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

## Phase P3 — Agent-Panel (Fundament gelegt)

**Erste custom OPUS-DECK-View rendert im Workbench** — der technische Durchbruch für alle
Agent-Surfaces. `packages/agent-panel` (Theia `ReactWidget`) zeigt im rechten Seitenbereich
eine gebrandete **OPUS-PRIME-EX-Chat-Shell**: Header (gold, „Recht & Steuer · DE/EU"),
Begrüßung mit Pflicht-Disclaimer, Pipeline-Zeile (Routing → Retrieval → Guardrails G1–G8 →
Antwort), Eingabe + „Senden", Agent-Icon in der rechten Activity Bar. Live verifiziert
(sichtbar, 313 px, Inhalt gerendert, 0/0).

- **Wiring (Muster für alle Surfaces):** `ReactWidget` + `AbstractViewContribution` +
  `WidgetFactory`, in Plain-JS via `decorate(injectable(), …)`; Default-Sichtbarkeit über
  `initializeLayout()` (NICHT `onStart` — der klappt den rechten Bereich nicht auf).
- **Live-Chat gewirkt (Schritt 2, verifiziert):** Das Agent-Panel ist interaktiv — **Modell-
  Dropdown** (aus `GET /api/models` des OPUS-PRIME-EX-Backends, alle Claude-Modelle + lokales
  Gemma 4), **Senden → `POST /api/frage`** mit gewähltem Modell → Antwort + Modell/Route/Quellen/
  **Guardrail-Ereignisse** gerendert. CORS im Backend; Timeout 900s (CPU-Inferenz). End-to-end
  live geprüft: Dropdown lädt vom Backend, Senden feuert den Request, Busy-State + Status
  („Frage an Gemma 4 E4B … 1–5 min"). Backend-Antwort + Guardrails separat direkt verifiziert
  (lokales Gemma, **kostenlos**; E4B halluzinierte → G3/G4 **blockierten** korrekt → Sicherheits-
  Ablehnung. Beweist: Guardrails schützen modellunabhängig; E4B-Qualität für Recht noch zu schwach).
- **Offen (nächster P3-Schritt):** Formalisierung als **ACP-Adapter** (statt Direkt-HTTP),
  Streaming, und **OPUS FLOW F0** (Daemon + ACP + read-Tools, siehe [FLOW_STUDIO.md](FLOW_STUDIO.md)).
  Ehrliche UX-Grenze: Gemma auf CPU ~5 min/Frage — GPU (GCP) oder kleineres/quantisiertes Modell fürs Tempo.

## Phase P1 — Editor & Dateien (Kern verifiziert)

Standard-Workspace `/workspace` wird beim Start geöffnet; Trust-Prompt deaktiviert
(sauberer Start). **Der Datei-Kern kommt aus Theias Standard-Paketen und ist im laufenden
Workbench live verifiziert** (Browser-Automation gegen den Container):

| WI | Beschreibung | Status |
|----|--------------|--------|
| 1.1 | Explorer CRUD (Neu/Umbenennen/Löschen/Duplizieren/Copy-Paste) | ✅ verifiziert (Kontextmenü + „New File/Folder"-Buttons) |
| 1.2 | **Upload** (Datei-Upload) | ✅ „Upload Files…" im Kontextmenü (Theia `@theia/filesystem`) |
| 1.3 | **Download** (Datei; Ordner als Archiv) | ✅ „Download" + „Copy Download Link" (Theia `FileDownloadService`) |
| 1.4 | Monaco-Editing | ✅ verifiziert (Datei geöffnet, Inhalt gerendert, Editor-Tab) |
| 1.5 | Vorschau-Renderer | ✅ **Markdown-Vorschau** (`@theia/preview`) live verifiziert (Split-View Editor+Preview: Überschrift/Liste/fett/Zitat gerendert). Bild/HTML via `@theia/mini-browser` „Open With → Preview" verfügbar. CSV öffnet als Text. |

**Ehrlich:**
- Der Datei-Kern (Explorer, Editor, Upload, Download) war **nicht zu bauen** — Theia liefert ihn;
  P1-Arbeit = Workspace-Setup + Verifikation. **Markdown-Vorschau** ergänzt (`@theia/preview`),
  live im Split-View bestätigt.
- **Chunked Upload:** Theias `FileUploadService` (hinter „Upload Files…") lädt in Segmenten hoch;
  das Kommando ist verifiziert, ein 1-GB-Stresstest steht noch aus (WI-1.2-AK).
- **Bild-Vorschau:** `.svg`/Bilder öffnen per Default als Text; Rendern via „Open With → Preview"
  (mini-browser). Automatische Bild-/PDF-/CSV-Tabellen-Assoziation = kleiner Ausbau.
- **Versions-Pin (Fix):** alle `@theia/*` auf **1.72.3** gepinnt — `@theia/preview` hing bei 1.72.3
  und zog ein nested `@theia/core`, was „Cannot apply @injectable decorator multiple times"
  auslöste (weißer Screen). Ein einheitlicher Core behebt das.

## WI-0.3 — Branding (erledigt, visuell verifiziert)

- **`packages/ui-kit`** ist als echte **Theia-Frontend-Extension** angelegt (Monorepo via
  npm-Workspaces) und Dependency der Workbench. Sie setzt die Marken-Farben (near-black +
  **Opus-Gold** `#C9A227`) als `--theia-*`-CSS-Variablen mit `important` durch — verifiziert:
  Statusleiste `rgb(201,162,39)`, Titel „OPUS DECK —", 0 Fehler/0 Warnungen.
- **Weg dorthin (ehrlich):** ein App-eingebettetes Modul lud NICHT (Theia liest
  `theiaExtensions` nur aus *Dependencies*, nicht aus dem App-Paket). Erst das eigene
  `@opus-deck/ui-kit`-Paket wurde geladen. Zusätzliche Linux-Build-Deps nötig: `libsecret-1-dev`
  (keytar). Root-`Dockerfile` baut jetzt das Monorepo.
- **Ausbau (später):** Design-Tokens als SSoT, Light/High-Contrast, Logo/Favicon,
  vollständige VS-Code-Theme-Contribution statt gezielter Variablen-Overrides.

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
