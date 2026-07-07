# ADR-0004 — Flow Studio: lokaler Desktop-/Dev-Automations-Agent als OPUS-DECK-Mieter

- **Status:** Akzeptiert (Owner Yahya, 2026-07-07)
- **Arbeitstitel Agent:** **OPUS FLOW** (aka „Local Flow Studio"). Ökosystem-konsistent zu
  OPUS PRIME EX / OPUS DECK; finaler Name = offene Entscheidung.
- **Kontext:** Neben OPUS PRIME EX (Rechts-Info, RAG, nur Text) soll ein zweiter, radikal
  andersartiger Agent entstehen: ein **lokaler OS-/GUI-Automations-Agent** auf Basis von
  **Gemma 4** (lokal via Ollama), der die Windows-Umgebung als orchestrierbaren „Space"
  behandelt — GUI-Workflows in beliebigen Electron/Web-Apps **und** kontrollierte
  PowerShell-Kommandos, alles lokal, ohne Cloud, mit Approval-Gates, Logging und Replay.

## Entscheidung

1. **OPUS FLOW ist ein OPUS-DECK-Mieter, kein Solo-Produkt.** Er wird als **lokaler
   Agent-Daemon** gebaut, der seine Fähigkeiten über **ACP** (ADR-0002) an OPUS DECK
   anbindet. OPUS DECK bleibt die Kommandobrücke (Mission Control, Approval-Gates,
   Artifacts/Replay); die OS-Macht liegt ausschließlich im Daemon, **nie im Browser**.
2. **Web-first bleibt gültig** (ADR-0003): Die UI (Theia, Browser) spricht über `localhost`
   mit dem lokalen Daemon — dasselbe Muster wie Ollama und der OPUS-PRIME-EX-Backend heute.
3. **Zwei Tool-Welten über MCP**, gebrokert und gegated: **GUI-Tools** (inspect/click/fill/
   navigate) und **Shell-/Dev-Tools** (`execute_powershell`, `list_files`, `run_build`,
   `git_status`, …). Gemma-4-Function-Calling verbindet beide zu mehrstufigen Plänen.
4. **Co-Development statt „erst fertig, dann Agent":** OPUS FLOW ist der **treibende
   Anwendungsfall**, an dem OPUS DECKs Phasen ACP-Host, MCP-Permission-Broker, Mission
   Control und Artifacts *gebaut und validiert* werden. Reihenfolge: erst die Live-Chat-
   Wirbelsäule (OPUS PRIME EX im Panel), dann OPUS FLOW schrittweise darauf.
5. **Modell hybrid** (nutzt den bereits gebauten OPUS-PRIME-EX-Modell-Katalog-Ansatz):
   Gemma 4 lokal für einfache/lokale Schritte, Claude für schwere Planung — messbar,
   umschaltbar.

## Begründung / Alternativen

- **Warum als OPUS-DECK-Mieter statt Standalone-App?** OPUS DECKs Kernthese ist „Zuhause
  für beliebige Agenten". Zwei maximal unterschiedliche Agenten (RAG-Info vs. OS-Automation,
  niedriges vs. hohes Risiko) sind der **ideale Beweis der Agnostizität** — und OPUS FLOW
  bekommt Mission Control, Approval, Audit, Replay „for free" aus der Plattform.
- **Warum Daemon + ACP statt Browser-Automation?** Ein Browser kann keine beliebigen
  Windows-Apps steuern oder PowerShell ausführen. Der Daemon kapselt die gefährlichen
  Fähigkeiten hinter einer auditierbaren, gegateten Grenze.
- **Warum Gemma lokal?** Keine API-Kosten, **kein Datenabfluss** (die Automation sieht
  Dateien/Screens des Nutzers — lokale Inferenz ist hier Pflicht, nicht Kür).
- **Verworfen:** proprietäre Einzel-Integration ohne ACP/MCP (Lock-in, kein Wiederverwenden
  des Permission-Layers); reine Pixel-Automation (spröder als Accessibility/DOM).

## Konsequenzen

- **Positiv:** flaggschiff-Demo der Plattform; erzwingt einen sauberen Permission-/Audit-
  Layer; lokal-first/DSGVO; ein zweiter realer Mieter härtet ACP/MCP.
- **Negativ / Risiko (ehrlich):** höchster Blast-Radius aller Agenten (PowerShell + „klickt
  alles") → Sicherheit ist das #1-Thema (siehe `spec/FLOW_STUDIO.md` §Sicherheits-Kontrakt);
  Gemma-4-Function-Calling bei langen Plänen unsicher (Hybrid mitigiert); GUI-Automation
  beliebiger Apps ist spröde.

## Referenzen

- `spec/FLOW_STUDIO.md` (Detail-Spec), [ADR-0002](ADR-0002-acp-agent-interop.md) (ACP/MCP),
  [ADR-0003](ADR-0003-web-first.md), [Masterplan](../MASTERPLAN.md) §4/§6/§7.
