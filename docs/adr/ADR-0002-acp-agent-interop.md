# ADR-0002 — ACP + MCP als Agent- und Tool-Anbindung

- **Status:** Akzeptiert (Owner Yahya, 2026-07-07)
- **Kontext:** OPUS DECK soll nicht nur OPUS PRIME EX, sondern **beliebigen Agenten ein
  Zuhause** geben. Es braucht einen offenen, stabilen Anbindungsstandard, damit Agenten
  austauschbar sind und nicht hart in die UI verdrahtet werden.

## Entscheidung

1. **Agenten-Anbindung über ACP (Agent Client Protocol).** Der Workbench ist ein
   **ACP-Host/Client**; jeder Agent ist ein **ACP-Server** (lokaler Subprozess via
   JSON-RPC/stdio oder remote). ACP ist „LSP für Agenten": ein Standard, viele Agenten.
2. **Tool-/Datenanbindung über MCP (Model Context Protocol).** Der Host betreibt einen
   **MCP-Broker** mit **Permission-Gate** (Just-in-time-Freigaben, auditiert).
3. **OPUS PRIME EX bekommt einen dünnen ACP-Adapter** (`apps/acp-adapter` im OPUS-Repo),
   der seine bestehende Orchestrator-Pipeline (Routing/Retrieval/Guardrails) als ACP-Session
   exponiert. Er dient zugleich als **Referenz-Blaupause** für das „Einhausen" weiterer Agenten.

## Begründung / Alternativen

- **ACP** (Zed-Ursprung, offene Registry mit Claude Code, Gemini CLI, Codex …) entkoppelt
  Editor und Agent sauber; der Agent behält eigene Runtime/Auth/Modellwahl/Tools.
- Alternativen (proprietäre Einzel-Integrationen je Agent) → Lock-in, Integrations-Overhead,
  verworfen.
- ACP/MCP sind **noch jung** → Risiko Breaking Changes. **Mitigation:** Adapter-Schicht
  kapseln, Versionen pinnen, Contract-Tests.

## Konsequenzen

- **Positiv:** echtes Multi-Agent-Home; neue Agenten ohne UI-Änderung andockbar; klare
  Sicherheits-/Permission-Grenze über den Broker.
- **Negativ / Risiko:** Abhängigkeit von jungen Standards; Mehraufwand für Host + Broker.

## Referenzen

- [Agent Client Protocol](https://agentclientprotocol.com/get-started/introduction) ·
  [Zed ACP](https://zed.dev/acp) · [Model Context Protocol](https://modelcontextprotocol.io/)
