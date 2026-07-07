# ADR-0005 — Second Brain: geteiltes, agentengepflegtes Wissen (Karpathy-LLM-Wiki-Muster)

- **Status:** Akzeptiert (Owner Yahya, 2026-07-07)
- **Kontext:** OPUS DECK soll nicht nur Agenten beherbergen, sondern ein **Second Brain**
  sein — ein persistenter, durchsuchbarer Wissens-/Gedächtnis-Speicher, den **Menschen UND
  Agenten teilen**. Alle Mieter (OPUS PRIME EX, Flow Studio, Claude Code, Assistent) sollen
  aus demselben Gehirn lesen *und* hineinschreiben.

## Entscheidung

1. **Der Second Brain ist ein geteilter MCP-Server** (auf dem ACP/MCP-Rückgrat aus
   [ADR-0002](ADR-0002-acp-agent-interop.md)). Jeder Agent greift über dieselben MCP-Tools
   zu — ein Gehirn, viele Agenten. OPUS DECK ist die menschliche Oberfläche dazu.
2. **Design nach Andrej Karpathys „LLM-Wiki"-Muster** — drei Schichten:
   - **Raw** (unveränderliche Quellen: Dokumente, Dateien, Transkripte; Agent liest, ändert nie),
   - **Wiki** (agenten-*gepflegte* strukturierte **Markdown**-Seiten mit Backlinks + Index —
     Wissen wird **im Voraus kompiliert**, nicht erst bei der Frage zusammengesucht),
   - **Schema** (`BRAIN.md`-Konventionsdatei, die Agenten sagt, wie das Wiki aufgebaut ist).
3. **Plain Markdown + git-native.** Writes sind **review-gated** (Vorschlag → Diff → Freigabe),
   versioniert, auditierbar — deckt sich exakt mit unserer Perfect-Twin-/Audit-Disziplin.
4. **Retrieval wiederverwendet die OPUS-PRIME-EX-RAG-Engine** (Hybrid BM25 + lokale
   Embeddings) für die Raw-Schicht; die Wiki-Schicht liefert vorkompilierte Antworten.
   „Compile-ahead" (Wiki) **plus** „retrieve-on-demand" (Raw) — das Beste aus beiden.
5. **Provider-agnostisch:** Die Wiki-Pflege nutzt den Modell-Katalog (Claude / Gemini-Vertex /
   Gemma lokal|GPU) — teure Modelle für die Kompilierung, lokale für Routine.

## Begründung / Alternativen

- **Warum Karpathy-Wiki statt reinem RAG?** Reines RAG sucht jedes Mal rohe Chunks; Qualität
  hängt am Retrieval. Die kompilierte Wiki-Schicht wächst, vernetzt sich und wird von Agenten
  aktuell gehalten → bessere, konsistentere Antworten, geringere Modell-Abhängigkeit.
- **Warum Markdown + git?** Menschlich lesbar, versionierbar, diff-/review-fähig, kein Lock-in;
  passt zu unserer gesamten Arbeitsweise und zu Obsidian/Editoren.
- **Warum MCP?** Ein Standard, alle Agenten teilen dasselbe Gehirn ohne Sonder-Integration.
- **Verworfen:** proprietäre Vektor-DB-only-Lösung (Lock-in, keine menschliche Lesbarkeit,
  kein Review-Gate); Gehirn pro Agent (widerspricht dem geteilten Second Brain).

## Konsequenzen

- **Positiv:** ein kohärentes, wachsendes, geteiltes Wissen; menschlich lesbar + agenten-nativ;
  Wiederverwendung der RAG-Engine; Audit/Review „for free"; Obsidian-kompatibel.
- **Negativ / Risiko (ehrlich):** Scope-Explosion („Alles-Wissen") → klein anfangen (Doku/Notiz-
  Store + Retrieval + review-gated Write). Schreibende Agenten brauchen Provenienz/Audit +
  Konfliktauflösung. Kompilier-Kosten (Modellaufrufe) — lokale/günstige Modelle dafür bevorzugen.

## Referenzen

- `spec/SECOND_BRAIN.md` (Detail-Spec). Karpathys LLM-Wiki:
  [Konzept/Community](https://github.com/topics/karpathy-llm-wiki) ·
  [Second-Brain-Implementierung](https://www.doit.com/blog/llm-wiki-second-brain-implementation).
- Sitzt auf [ADR-0002](ADR-0002-acp-agent-interop.md) (ACP/MCP); nutzt den Modell-Katalog aus
  OPUS PRIME EX (`AGENT_ARCHITECTURE §2 v1.3`).
