# OPUS DECK

> **Die Kommandobrücke für Agenten.** Ein weltklasse, VS-Code-gebrandetes Interface, das
> Menschen KI-Agenten steuern lässt — zuerst [OPUS PRIME EX](https://github.com/yoyo967/OPUS-PRIME-EX),
> perspektivisch **beliebige Agenten** über den offenen **Agent Client Protocol (ACP)**.
>
> *A world-class, VS-Code-styled workbench that gives AI agents a home and lets humans
> drive them — projects, files, multi-agent orchestration, verifiable artifacts.*

**Status:** Pre-Alpha · P0 (Fundament). Dies ist ein **Plattform-Vorhaben** — der Bauplan
steht, der Bau beginnt. Siehe **[docs/MASTERPLAN.md](docs/MASTERPLAN.md)** (semi-atomar,
P0–P8) und die **[ADRs](docs/adr/)**.

## Was OPUS DECK wird

- **VS-Code-Designsprache** (Eclipse Theia + Monaco), eigene Marke, Web **und** Desktop.
- **Multi-Agent-Home:** jeder ACP-fähige Agent (Claude Code, Gemini CLI, Codex … und
  OPUS PRIME EX) dockt an. Tools über **MCP** mit Permission-Gate.
- **Voller Funktionsumfang** (Vorbild Claude.ai + Google Antigravity): Projekte anlegen,
  Dateien hochladen/erstellen/bearbeiten/herunterladen, **Mission Control** für mehrere
  async Agenten, **Artifacts** mit Live-Preview & Inline-Feedback, Terminal, Command Palette.
- **EU-first / DSGVO**, sandboxed Agent-Runtimes, Multi-Tenancy, Barrierefreiheit (WCAG 2.2).

## Architektur-Entscheidungen (ADRs)

| ADR | Entscheidung |
|-----|--------------|
| [0001](docs/adr/ADR-0001-theia-foundation.md) | **Eclipse Theia** als Workbench-Fundament (statt VS-Code-Fork) |
| [0002](docs/adr/ADR-0002-acp-agent-interop.md) | **ACP + MCP** als Agent-/Tool-Anbindung (Multi-Agent-Home) |
| [0003](docs/adr/ADR-0003-web-first.md) | **Web zuerst** (Cloud Run EU), Desktop später aus derselben Codebase |
| [0004](docs/adr/ADR-0004-flow-studio-agent.md) | **OPUS FLOW** — lokaler Desktop-/Dev-Automations-Agent (Gemma 4) als 2. OPUS-DECK-Mieter ([Spec](spec/FLOW_STUDIO.md)) |
| [0005](docs/adr/ADR-0005-second-brain.md) | **Second Brain** — geteiltes, agentengepflegtes Wissen (Karpathy-LLM-Wiki-Muster) als MCP-Server ([Spec](spec/SECOND_BRAIN.md)) |
| [0006](docs/adr/ADR-0006-a5-conformity.md) | **A5-Konformität** — BSI-KI-Prüfrahmen als Governance-Linse fürs ganze System ([Mapping](spec/A5_COMPLIANCE.md)) |

## Repo-Struktur (Ziel)

```
apps/       workbench (Theia) · gateway · acp-host · mcp-broker
packages/   ui-kit · agent-sdk · artifacts
infra/      GCP europe-west3 (Terraform/Cloud Run/GKE), CI/CD
spec/       Perfect-Twin-Specs · docs/ ADRs + Masterplan
```

## Engineering-Disziplin

Wie im Schwester-Projekt OPUS PRIME EX: **Spec zuerst**, Traceability, vier Gates grün vor
Merge (Lint · Typecheck · Tests · Spec-Lint), ehrlich vor Über-Behauptung.

## Lizenz

MIT — siehe [LICENSE](LICENSE).
