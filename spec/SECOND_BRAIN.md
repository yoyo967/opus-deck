# SPEC — Second Brain (geteiltes, agentengepflegtes Wissen)

> Ein persistenter, durchsuchbarer Wissens-/Gedächtnis-Speicher, den Menschen **und** Agenten
> teilen — als **MCP-Server** auf dem ACP/MCP-Rückgrat. Design nach Andrej Karpathys
> „LLM-Wiki"-Muster: der Agent **pflegt** eine kompilierte Markdown-Wissensschicht, statt
> nur roh zu suchen. Grundsatzentscheidung: [ADR-0005](../docs/adr/ADR-0005-second-brain.md).
>
> **Status:** Spec v0.1 (ENTWURF, 2026-07-07). Klein, echt, geteilt anfangen — kein „Alles-Wissen".

## 1. North Star & Abgrenzung

**North Star:** Wissen, das **von selbst wächst und aktuell bleibt** — Menschen werfen Rohes
hinein, Agenten kompilieren es zu vernetzten, zitierbaren Seiten, und *jeder* Agent im Interface
(plus der Mensch) profitiert davon.

**Non-Goals:** kein Cloud-Zwang (lokal-first, DSGVO); kein automatisches Überschreiben ohne
Review-Gate; keine proprietäre Blackbox — alles ist lesbares Markdown + Git.

## 2. Die drei Schichten (Karpathy-Muster)

```
brain/
  BRAIN.md                # SCHEMA: Konventionen, Ordnerlayout, Workflows (Agenten lesen das zuerst)
  raw/                    # RAW: unveraenderliche Quellen (Agent liest, aendert NIE)
    2026-07-07_notiz.md · report.pdf · transkript.md · …
  wiki/                   # WIKI: agenten-gepflegte, kompilierte Markdown-Seiten
    <thema>.md            #   strukturiert, mit Frontmatter + [[Backlinks]]
    INDEX.md              #   automatisch gepflegter Index/Karte
  .brain/                 # intern: Retrieval-Snapshot (BM25/Embeddings), Provenienz
```

- **Raw:** was reinkommt (Notizen, Dateien, Gesprächs-Essenzen). Immutable. Quelle der Wahrheit.
- **Wiki:** was der Agent daraus **kompiliert** — je Thema eine Seite mit `[[Backlinks]]`, Quellen-
  verweisen auf `raw/`, Frontmatter (`titel`, `stand`, `quellen`, `tags`). Wird aktuell gehalten.
- **Schema (`BRAIN.md`):** sagt jedem Agenten, wie das Wiki aufgebaut ist, welche Konventionen
  gelten und wie die Workflows laufen — analog unserer `CLAUDE.md`/Perfect-Twin-Disziplin.

## 3. MCP-Tool-Oberfläche (so nutzen alle Agenten das Gehirn)

Ein MCP-Server `second-brain` exponiert (Wirkungsklassen wie in FLOW_STUDIO §3):
- `brain.search(query, k)` — Hybrid-Retrieval (BM25 + Embeddings) über Raw **und** Wiki *(read)*
- `brain.read(pfad)` — Seite/Quelle lesen *(read)*
- `brain.list(sammlung?)` — Struktur/Index *(read)*
- `brain.add_raw(inhalt|datei, meta)` — Rohquelle ablegen *(write, auto-erlaubt: append-only)*
- `brain.propose_wiki(seite, inhalt, quellen)` — Wiki-Seite anlegen/ändern **als Vorschlag**
  *(write, **review-gated**: erzeugt Diff → Freigabe in OPUS DECK → Git-Commit)*
- `brain.backlinks(seite)` — Wissensgraph-Kanten *(read)*

**Provenienz:** jeder Write trägt `wer` (Agent/Mensch) + `wann` + `quellen`; landet im Audit.

## 4. Retrieval: compile-ahead + retrieve-on-demand

- **Wiki-first:** eine Frage trifft zuerst die kompilierten Wiki-Seiten (vorverdichtet, vernetzt) →
  schnelle, konsistente Antwort mit Quellenkette nach `raw/`.
- **Raw-Fallback:** deckt das Wiki es nicht, greift Hybrid-RAG (die **OPUS-PRIME-EX-Engine**:
  Chunker, InMemoryVectorStore, BM25 + optionale lokale Embeddings) auf `raw/`.
- **Kompilier-Loop:** ein Agent kann aus häufigen Raw-Treffern eine neue Wiki-Seite *vorschlagen*
  (review-gated) → das Gehirn wächst.

## 5. Struktur, Menschen-UI, geteilte Nutzung

- **Sammlungen/Projekte:** das Gehirn ist in Sammlungen gegliedert (= „Projects + Knowledge"-
  Surface aus dem Masterplan §4/§5). Berechtigungen je Sammlung (RBAC, später Tenancy).
- **OPUS-DECK-UI:** Browsen (Wiki + Raw), Suchen, Rohes hinzufügen (Upload/Notiz), **Review-Ansicht**
  für vorgeschlagene Wiki-Diffs (Freigeben/Ablehnen), Wissensgraph-Ansicht (Backlinks).
- **Geteilt:** OPUS PRIME EX, Flow Studio, Claude Code und der Assistent nutzen **denselben**
  MCP-Server → ein Gehirn. (Mein file-basiertes Assistenten-Gedächtnis kann eine Raw-Quelle sein.)

## 6. Git-native & Sicherheit

- Alles in `brain/` ist Git-versioniert: Diffs, History, Blame, Rollback. Wiki-Writes = Commits
  mit Provenienz. **Kein Löschen aus dem Audit durch Agenten.**
- Review-Gate für alle `write` auf `wiki/` (Mensch bestätigt); `add_raw` ist append-only.
- Lokal-first/DSGVO: Retrieval-Embeddings lokal; kein Datenabfluss nötig.
- Secret-Redaction vor Ablage/Anzeige (wie FLOW_STUDIO §3.3).

## 7. Modell-Strategie

Nutzt den Modell-Katalog (Claude · Gemini-Vertex-EU · Gemma lokal|GPU): **teure Modelle für die
Wiki-Kompilierung** (Qualität zählt), **lokale/günstige für Routine-Retrieval/Zusammenfassungen**.
Kompilierung ist ein Offline-Batch, nie im Anfrage-Pfad (analog OPUS-PRIME-EX-Prinzip).

## 8. Meilensteinplan (gekoppelt; sitzt auf dem ACP/MCP-Rückgrat)

- **B0 — Store + Schema:** `brain/`-Layout, `BRAIN.md`, Git-Init, `add_raw`/`read`/`list`.
  *AK:* Rohquelle ablegen + lesen; Struktur sichtbar.
- **B1 — MCP-Read + Retrieval:** `second-brain`-MCP-Server mit `search` (Hybrid-RAG auf raw/),
  angebunden an OPUS DECK. *AK:* ein Agent findet Wissen über MCP.
- **B2 — Wiki-Pflege (review-gated):** `propose_wiki` → Diff → Freigabe → Commit; Kompilier-Loop.
  *AK:* Agent schlägt Wiki-Seite vor, Mensch gibt frei, Seite ist versioniert.
- **B3 — Menschen-UI in OPUS DECK:** Browse/Suche/Add/Review-Diff. *AK:* Gehirn im Interface bedienbar.
- **B4 — Wissensgraph:** `backlinks`, INDEX-Pflege, Graph-Ansicht. *AK:* vernetzte Navigation.
- **B5 — Geteilt + Provider:** alle Agenten (inkl. Claude Code) am selben Brain; Gemini/GPU für
  Kompilierung. *AK:* zwei Agenten nutzen dasselbe Wissen; Kompilierung mit gewähltem Provider.

## 9. Risiken (ehrlich)

| Risiko | Auswirkung | Gegenmaßnahme |
|--------|-----------|---------------|
| Scope-Explosion („Alles-Wissen") | nie fertig | B0–B2 klein; Sammlungen statt Monolith |
| Agenten schreiben Müll/Widersprüche ins Wiki | Wissen verrottet | Review-Gate + Provenienz + Git-Diff + Rollback |
| Kompilier-Kosten (Modellaufrufe) | teuer | Offline-Batch; lokale/günstige Modelle; nur bei Bedarf |
| Retrieval-Rauschen (BM25) | schlechte Treffer | lokale Embeddings (haben wir); Wiki-first vor Raw |
| Secret-Leak in raw/wiki | Vertraulichkeit | Redaction vor Ablage/Anzeige |

## 10. Nächster Schritt

Der Keystone ist das **ACP/MCP-Rückgrat** (aus Direkt-HTTP → ACP + MCP-Broker in OPUS DECK).
**Direkt danach B0/B1** — der Second Brain wird der **erste MCP-Server**, den alle Agenten teilen.
Reihenfolge (Owner): 1) Rückgrat → 2) Second Brain → 3) Provider (Gemini/GPU). GCP-Deploy später.
