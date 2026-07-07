# STATUS — OPUS DECK

> Ehrlicher Projekt-Snapshot. Stand: 2026-07-07.

## Kurzfassung

**P0 (Fundament) begonnen.** Repo aufgesetzt (spec-/docs-first, analog OPUS PRIME EX),
Masterplan + ADRs stehen. **Noch kein lauffähiger Code** — der nächste Schritt ist der
Theia-Spike (WI-0.2), der die Fundament-Wette validiert.

## Phase P0 — Fortschritt

| WI | Beschreibung | Status |
|----|--------------|--------|
| 0.1 | Repo + CI-Skelett + Gate-Struktur | ⏳ Grundgerüst da; Gates aktivieren sich mit WI-0.2 |
| 0.2 | Theia-App bootet (Monaco, leerer Workbench) | ⬜ offen — **nächster Schritt** |
| 0.3 | Branding/Theme-Paket (Tokens, Dark/Light, Logo) | ⬜ offen |
| 0.4 | ADR-Prozess + Spec-Ordner | ✅ ADR-0001/0002/0003 + spec/ |

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
