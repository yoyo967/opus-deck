# SPEC — OPUS FLOW (Local Flow Studio)

> Lokaler Desktop-/Dev-Automations-Agent auf Basis von **Gemma 4** (lokal via Ollama),
> Mieter von OPUS DECK. Behandelt die Windows-Umgebung als orchestrierbaren „Space":
> steuert GUI-Workflows **und** führt kontrollierte PowerShell-Kommandos aus — mehrstufig
> geplant, gegated ausgeführt, lückenlos protokolliert, wiederholbar gespeichert. Alles
> lokal, ohne Cloud. Grundsatzentscheidung: [ADR-0004](../docs/adr/ADR-0004-flow-studio-agent.md).
>
> **Status:** Spec v0.1 (ENTWURF, 2026-07-07). **Nichts beschönigt** — die harten Stellen und
> der Sicherheits-Kontrakt stehen explizit drin (§5, §9).

## 1. North Star & Abgrenzung

**North Star:** Aus **einem** natürlichsprachlichen Befehl einen **transparenten, auditierbaren,
wiederholbaren Flow** machen, der App-Oberfläche und Shell/Dev kombiniert.

Beispiel: *„Öffne das Projekt-Dashboard, exportiere den Report und leg ihn im Build-Ordner des
aktuellen Repos ab."* → geplanter Mehrschritt-Flow (GUI-Export + Shell-Move), Schritt für
Schritt freigegeben und protokolliert, als Workflow speicherbar.

**Non-Goals (bewusst außen vor):**
- Kein Cloud-Betrieb, kein Datenabfluss (lokale Gemma-Inferenz ist Pflicht, nicht Kür).
- Kein „autonomes Durchlaufen" gefährlicher Aktionen ohne Freigabe (siehe §5).
- Kein Ersatz für CI/CD; lokaler Orchestrator für Desktop-/Dev-Tasks, nicht Produktions-Deploy.
- Keine unbeaufsichtigte Fernsteuerung ohne anwesenden Nutzer (attended zuerst; headless nur
  für explizit freigegebene, parametrisierte Workflows — späte Phase).

## 2. Architektur

```
OPUS DECK (Theia, Browser)  ──ACP (JSON-RPC/localhost)──►  OPUS-FLOW-Daemon (lokal)
  · Chat/Command-Eingabe                                      │  hat OS-Rechte, kapselt Gefahr
  · Mission Control (Plan ansehen, Schritte freigeben)        ├─ Planner (Gemma-4-Function-Calling)
  · Artifacts (Logs, Screenshots, gespeicherte Workflows)     ├─ MCP-Tool-Broker + Permission-Gate
  · Replay (Schritt-für-Schritt-Wiedergabe)                   │    ├─ GUI-Tools (§3.1)
                                                              │    └─ Shell-/Dev-Tools (§3.2)
                                                              ├─ Audit-Log (append-only, §6)
                                                              └─ Modell: Gemma 4 lokal | Claude (§7)
```

**Trust-Boundary:** Die UI (Browser) hat **nie** direkte OS-Rechte. Jede wirkende Aktion läuft
über den Daemon → Permission-Gate → Audit. OPUS DECK zeigt nur an und gibt frei.

**Reuse aus OPUS DECK (Masterplan §6/§7):** ACP-Host, MCP-Permission-Broker, Mission Control,
Artifacts, Audit — OPUS FLOW ist der erste reale Mieter, der diese Surfaces exerziert.

## 3. Tool-Schichten (MCP)

Jedes Tool hat eine **Wirkungsklasse**: `read` (nebenwirkungsfrei), `write` (verändert Dateien/
State), `exec` (führt Code/Prozesse aus), `ui` (interagiert mit Fremd-App). Die Klasse steuert
das Default-Gate (§5).

### 3.1 GUI-Tools (Wirkungsklasse `ui`)
- `ui.inspect(target)` — Accessibility-/DOM-Baum eines Fensters/Elements lesen *(read-ähnlich)*
- `ui.click(selector) · ui.fill(selector, wert) · ui.navigate(url|menu)` — interagieren
- **Primär über Accessibility (Windows UI Automation) / DOM** (robuster als Pixel); Pixel-
  Fallback nur explizit. Electron/Web-Apps zuerst (bester Baum), native Apps später.

### 3.2 Shell-/Dev-Tools
- `fs.list_files(pfad) · fs.read_file(pfad)` — `read`
- `git.status · git.diff` — `read`
- `build.run(target)` — `exec` (gegated)
- `shell.execute_powershell(cmd)` — `exec` (gegated, Allowlist/Denylist, §5)
- `fs.write_file · fs.move · fs.delete` — `write`/`exec` (gegated, mit Undo wo möglich)

### 3.3 Tool-Kontrakt
- Jedes Tool: JSON-Schema für Args + Result; deterministische, **strukturierte Ausgabe**
  (kein „nackter" Text-Dump), damit der Planner zuverlässig weiterplant.
- Timeouts, Größenlimits (Ausgabe-Truncation), Fehler als typisiertes Ergebnis (kein Crash).
- **Secret-Redaction:** Ausgaben werden vor Log/Anzeige auf Tokens/Keys/Passwörter gefiltert.

## 4. Planner (Plan → Approve → Execute)

Zwei-Phasen-Prinzip, **nicht verhandelbar**:
1. **PLAN (Dry-Run):** Gemma 4 erzeugt via Function-Calling einen **Schrittplan** (welche Tools,
   welche Args, welche Wirkungsklasse je Schritt). Der Plan wird dem Nutzer **vollständig gezeigt**,
   bevor irgendetwas Wirkendes passiert. `read`-Schritte dürfen zur Plan-Verfeinerung real laufen.
2. **APPROVE:** Nutzer gibt den Plan (oder einzelne Schritte) frei; gefährliche Schritte einzeln.
3. **EXECUTE:** Schrittweise Ausführung; nach jedem Schritt: Ergebnis + ggf. Screenshot als
   Artifact; bei Abweichung Re-Plan (mit erneutem Gate). Jederzeit **Stop/Abbruch**.

## 5. Sicherheits-Kontrakt (das #1-Thema)

Nicht verhandelbar, ab Tag 1:
1. **Least Privilege + Scope:** Ein Flow läuft in einem deklarierten Scope (erlaubte Ordner,
   erlaubte Apps, erlaubte Kommando-Allowlist). Außerhalb = hartes Nein.
2. **Gate je Wirkungsklasse:** `read` auto-erlaubt; `write`/`exec`/`ui` erfordern explizite
   Freigabe (Just-in-time-Prompt in OPUS DECK), auditiert. Kein „Alles-erlauben"-Schalter im MVP.
3. **PowerShell gehärtet:** Allowlist bevorzugt; Denylist für Zerstörerisches (`Remove-Item -Recurse`
   auf System-/Home-Pfade, `Format-*`, Registry-Massenänderung, Netzwerk-Exfiltration…); nie
   `-Force` ohne explizite Freigabe; Ausführung mit Timeout, ohne erhöhte Rechte per Default.
4. **Dry-Run/Simulation** für schreibende/löschende Schritte, wo möglich (zeigt, *was* passieren würde).
5. **Undo/Rollback** wo möglich (z. B. Datei in Papierkorb/Backup statt Hard-Delete; Git-Checkpoints).
6. **Append-only Audit** jedes Schritts (§6); kein Löschen aus dem Log durch den Agenten.
7. **Kill-Switch:** globaler Stop; der Daemon respektiert ihn synchron.
8. **Kein Umgehen der Gates durch den Agenten** — Tools sind die *einzige* Wirk-Schnittstelle;
   der Planner kann keine Rohbefehle an der Broker-Schicht vorbei absetzen.

## 6. Observability: Audit, Replay, Workflow-Speicherung

- **Audit-Log (append-only):** je Schritt `{ts, tool, args(redigiert), wirkungsklasse, freigabe:
  user|auto, ergebnis(redigiert), dauer, screenshot_ref?}`.
- **Replay:** ein Flow kann Schritt für Schritt wiedergegeben werden (read-only Nachvollzug).
- **Workflow-Speicherung (JSON/YAML):** ein bestätigter Flow wird als wiederholbarer,
  **parametrisierbarer** Workflow gespeichert:
  ```yaml
  name: "Report exportieren und ablegen"
  params: { repo: string, report_name: string }
  scope: { ordner: ["${repo}/build"], apps: ["dashboard"], shell_allow: ["git", "Move-Item"] }
  schritte:
    - { tool: ui.navigate, args: { ziel: "Dashboard/Reports" }, wirkung: ui }
    - { tool: ui.click,     args: { selector: "Export" },        wirkung: ui }
    - { tool: fs.move,      args: { von: "~/Downloads/${report_name}", nach: "${repo}/build/" }, wirkung: write }
  ```
  Wiederholung eines gespeicherten Workflows durchläuft dieselben Gates (Scope bleibt bindend).

## 7. Modell-Strategie (hybrid)

Nutzt das in OPUS PRIME EX gebaute Muster (Modell-Katalog, `build_llm_client`):
- **Gemma 4 lokal (Default):** Function-Calling für Planung + einfache Schritte. Keine Kosten,
  kein Datenabfluss. Start CPU/32 GB (E4B), größere Varianten via GCP-GPU später.
- **Claude (optional):** für schwere/lange Pläne, wenn Gemma unzuverlässig ist — umschaltbar.
- **Messen statt annehmen:** Function-Calling-Zuverlässigkeit von Gemma 4 gegen einen
  Flow-Eval-Satz prüfen (Plan-Korrektheit, Tool-Arg-Genauigkeit), bevor autonome Ketten erlaubt werden.

## 8. Meilensteinplan (gekoppelt an OPUS DECK)

Jede Flow-Phase härtet zugleich eine OPUS-DECK-Surface (Co-Development).

- **F0 — Daemon-Skelett + read-Tools ✅ (2026-07-08, Repo `opus-flow`):** read-Tools
  (`fs.list_files`, `fs.read_file`, `git.status`, `git.diff`) mit vollem Sicherheits-Kontrakt
  (Scope/Traversal-Schutz, Wirkungsklassen, strukturierte Ausgabe, Secret-Redaction) als
  **MCP-Server**. *Ehrliche Abweichung:* MCP statt ACP (ACP-Host zurückgestellt; MCP = Broker-Schicht
  §2). Gates grün (ruff/mypy/pytest), Dogfood verifiziert. **AK „im Panel" ✅** — Flow-Panel in
  OPUS DECK zeigt die Ergebnisse (siehe unten).
- **F1 — Shell mit Gate ✅ (2026-07-08):** `shell.execute_powershell` (Allowlist + Denylist +
  Timeout + Redaction) + **Permission-Gate** (read auto, exec/write/ui → PENDING → menschliche
  Freigabe) + **append-only Audit** (auto/user). Lokale HTTP-API (`apps/api/server.py`, 127.0.0.1).
  *AK erfüllt:* Kommando erst nach Klick, Schritt im Audit-Log — **end-to-end im Panel verifiziert**.
- **F2 — Planner (Plan→Dry-Run→Execute) ✅ (2026-07-08):** Planner (`planner.py`, lokales Gemma) →
  Schrittplan; **Dry-Run** (`daemon.dry_run`, Endpoint `/api/flow/dry_run`) validiert jeden Schritt
  gegen Scope + Allowlist/Denylist **ohne Nebeneffekt** (zeigt ✓/✗ + Grund vor jeder Wirkung);
  **schrittweise gegatete Ausführung** aus dem Plan (read sofort, exec → Gate). *AK erfüllt:*
  mehrstufiger Plan sichtbar, einzelne Freigabe, Dry-Run zeigt Wirkung vorab — **im Cloud-UI
  verifiziert**. Offen (Feinschliff): automatische Ketten-Ausführung mit Re-Plan; Gemma-4-
  Function-Calling-Zuverlässigkeit gegen einen Flow-Eval messen (§7/§9).
- **F3 — Artifacts/Replay/Workflow-Speicherung 🟡 teilweise:** Audit-Log (append-only) steht +
  ist im Panel sichtbar. Offen: Replay + parametrisierte Workflow-Speicherung (JSON/YAML).
- **OPUS-DECK-Panel ✅:** `@opus-deck/flow-panel` (Ausführen/Plan/Freigaben/Audit) — das Gate ist
  in der UI (PENDING → Freigeben/Ablehnen). Verdrahtet + im Browser end-to-end verifiziert.
- **F4 — GUI-Automation** (Accessibility/DOM; Electron/Web zuerst). *AK:* Klick+Fill in einer
  Ziel-App verifiziert; Screenshot je Schritt.
- **F5 — Hybrid-Modell, Parametrisierung, Härtung** (Scope-Editor, Denylist-Pflege, Undo,
  Kill-Switch, Flow-Eval). *AK:* Gemma↔Claude umschaltbar; Security-Review bestanden.

## 9. Risiken (ehrlich)

| Risiko | Auswirkung | Gegenmaßnahme |
|--------|-----------|---------------|
| Blast-Radius (PowerShell + „klickt alles") | Datenverlust/Systemschaden | Sicherheits-Kontrakt §5 (Gate/Allowlist/Dry-Run/Undo/Kill-Switch) |
| Gemma-4-Function-Calling wackelt bei langen Plänen | falsche/kaputte Schritte | Plan-zuerst + einzelne Freigabe; Hybrid mit Claude; Flow-Eval |
| GUI-Automation spröde (native Apps) | Flow bricht | Accessibility/DOM statt Pixel; Electron/Web zuerst; Retry+Re-Plan |
| Secret-Leak in Logs/Plänen | Vertraulichkeit | Secret-Redaction vor Log/Anzeige |
| Scope-Creep zum „Auto-Piloten" | Sicherheit untergraben | attended-first Non-Goal; headless nur für freigegebene Workflows |

## 10. Offene Entscheidungen (Owner)

1. **Name final:** OPUS FLOW / Local Flow Studio / anders?
2. **GUI-Automations-Basis:** Windows UI Automation (UIA) vs. app-spezifische DOM/CDP-Brücken —
   welche Ziel-Apps zuerst (VS Code? Browser? ein konkretes Dashboard)?
3. **Daemon-Sprache:** Python (nah an OPUS PRIME EX, schnelle MCP/Tool-Entwicklung) vs. Go/.NET
   (näher an Windows-APIs). Empfehlung: **Python** für Tempo, native GUI-Brücke via UIA-Binding.
4. **Repo:** eigenes `opus-flow`-Repo (analog OPUS PRIME EX) vs. Unterordner in `opus-deck`.
   Empfehlung: **eigenes Repo**, angebunden als ACP-Agent (wie OPUS PRIME EX).

## 11. Nächster Schritt

Erst die **Live-Chat-Wirbelsäule** fertig (OPUS PRIME EX im Agent-Panel mit Modellwahl —
Schritt 2), weil beide Agenten darauf sitzen. **Direkt danach F0** (OPUS-FLOW-Daemon + ACP +
read-Tools), was zugleich OPUS DECKs ACP-Host/MCP-Broker aktiviert.
