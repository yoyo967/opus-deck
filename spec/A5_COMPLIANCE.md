# A5_COMPLIANCE.md — BSI-A5-Mapping (lebende Checkliste)

> **Was:** Wie unser System (OPUS DECK · OPUS PRIME EX · künftig OPUS FLOW/opus-brain) sich am
> **BSI-Prüfkatalog A5** ausrichtet. Entscheidung: [`docs/adr/ADR-0006-a5-conformity.md`](../docs/adr/ADR-0006-a5-conformity.md).
> **Status A5:** Community Draft (BSI, 06.07.2026), OSCAL-maschinenlesbar, C5-/ISAE-3000-Methodik,
> Raster für EU AI Act + Cyber Resilience Act. Kommentarfrist 31.08.2026.
>
> **Ehrlichkeit (nicht verhandelbar):** Dies ist eine **Selbst-Verortung**, **keine** Zertifizierung.
> „erfüllt" heißt „Kontrolle existiert und ist belegbar", nicht „von einem Prüfer testiert".
> Legende: ✅ erfüllt · 🟡 teilweise · ⬜ offen.

## Block 1 — Vertrauenswürdigkeit & Qualität
*(Robustheit, Fehlerverhalten, Umgang mit Unsicherheit/Halluzination)*

| A5-Anliegen | Unsere Kontrolle | Beleg (Zeiger) | Status |
|---|---|---|---|
| Keine erfundenen Fakten/Zahlen | **Deterministic-first**: Modell rechnet/erfindet keine Zitate; Zahlen aus geprüften Quellen | OPUS PRIME EX Guardrails G3/G4, `src/guardrails/` | ✅ |
| Halluzination blockieren | Guardrails weisen unbelegte Aussagen zurück → Safety-Refusal | Live-Nachweis: Gemma-E4B-Zahl → G3/G4 blockte | ✅ |
| Messbare Qualität | Golden-Set-Eval, DoD ≥ 95 % | `tests/evals/`, `evals/golden_set*` | ✅ |
| Modellunabhängige Robustheit | Guardrails greifen provider-agnostisch (Claude/Gemma) | `src/gateway/`, models.yaml-Katalog | ✅ |
| Unsicherheit kennzeichnen | Ehrlichkeits-Prinzip; Unsicheres markieren | CLAUDE-/Brain-Regeln, honesty-Prinzip | 🟡 |
| Formales Bias-/Robustheits-Testing | — | — | ⬜ **Gap** |
| Uncertainty Quantification (Konfidenz) | — | — | ⬜ **Gap** |

## Block 2 — Sicherheit & Datenschutz
*(Zugriff, Isolation, Missbrauchsschutz, Data Protection by Design, Logging ohne PII-Leak)*

| A5-Anliegen | Unsere Kontrolle | Beleg (Zeiger) | Status |
|---|---|---|---|
| Data Protection by Design | **EU-first (europe-west3), DSGVO** als Non-Negotiable | CLAUDE.md, ADR-0002 | ✅ |
| Keine Datenabflüsse | **Lokale Inferenz** (Gemma/Embeddings) — Daten verlassen die Maschine nicht | `src/gateway/gemma_client.py`, lokale Embeddings | ✅ |
| Logging ohne PII | Audit-Trail hasht statt Klartext (G8) | OPUS PRIME EX G5/G8-Guardrails | 🟡 |
| Zugriffsschutz / Isolation | Web-UI bindet nur 127.0.0.1; Secrets nur in `.env`/Secret Manager | `apps/web/server.py`, .gitignore | ✅ |
| Missbrauchsschutz (Agenten) | **Review-Gate**: Agenten dürfen nur *vorschlagen*; approve/reject = Mensch | `src/brain/server.py`, BRAIN.md | ✅ |
| Sandbox für OS-Automation | Flow-Studio-Spec: permission-gated, sandboxed | `spec/FLOW_STUDIO.md` | 🟡 (Spec, Impl offen) |
| Formales Threat-Model | STRIDE über das deployte System + Restrisiko-Backlog | `docs/governance/threat_model.md` | ✅ |
| Zugriffskontrolle Cloud | Backend + Workbench privat; Single-Origin-Proxy mit Identity-Token | `docs/deploy_cloud_run.md` | ✅ |
| Pen-Test / Härtungsnachweis | — | — | ⬜ **Gap** |

## Block 3 — Transparenz & Nachvollziehbarkeit
*(Systemdoku, erklärbare Entscheidungen, dokumentierte Zwecke/Grenzen)*

| A5-Anliegen | Unsere Kontrolle | Beleg (Zeiger) | Status |
|---|---|---|---|
| Vollständige Systemdoku | **Perfect-Twin-Specs** + ADRs zu jeder Entscheidung | `spec/`, `docs/adr/` | ✅ |
| Nachvollziehbare Entscheidung | Sichtbare Pipeline (Route/Quellen/Guardrails) in der UI | Agent-Panel, `/api/frage`-Antwortobjekt | ✅ |
| KI-Kennzeichnung (AI Act Art. 50) | KI-Badge + Disclaimer | OPUS PRIME EX `docs/ai-act-assessment.md` | ✅ |
| Dokumentierte Zwecke & Grenzen | Zweck/Scope/Grenzen je System festgehalten | `docs/ai-act-assessment.md`, ADRs | ✅ |
| Änderungshistorie | CHANGELOG + STATUS + git | `CHANGELOG.md`, `docs/STATUS.md` | ✅ |
| Quellen-Provenienz | Retrieval liefert Quelle je Aussage; Brain-Wiki zitiert Raw | `src/mcp_server/tools.py`, BRAIN.md | ✅ |
| Formale Model Cards | — | — | ⬜ **Gap** |

## Block 4 — Governance & Prozesse
*(Rollen/Verantwortung, Change-Management, Incident-Prozesse, Risikoanalyse)*

| A5-Anliegen | Unsere Kontrolle | Beleg (Zeiger) | Status |
|---|---|---|---|
| Change-Management | **Vier-Gates-CI** (ruff, mypy --strict, pytest, spec_lint) vor Merge | `.github/workflows/ci.yaml`, `tools/spec_lint` | ✅ |
| Qualitäts-Gate dokumentiert | gate_report als prüfbares Artefakt | OPUS PRIME EX `gate_report` | ✅ |
| Menschliche Letztverantwortung | **RA/StB-Sign-off** vor produktivem Rechts-Output | `review/human_signoff_checklist.md` | ✅ |
| Entscheidungsprozess | ADR-Prozess (versioniert, begründet) | `docs/adr/` | ✅ |
| Offene Risiken sichtbar | OPEN_QUESTIONS / Gap-Listen | `OPEN_QUESTIONS*`, dieses Dok | ✅ |
| Rollen-/Verantwortungsmatrix | RACI über alle Rollen (Owner/Agent/RA-StB/…) | `docs/governance/roles_responsibilities.md` | ✅ |
| Incident-Response-Prozess | 6-Schritt-Runbook + Sofortmaßnahmen (rotate/privat/stop) | `docs/governance/incident_response.md` | ✅ |
| Formales Risikoregister | — | — | ⬜ **Gap** |

## Gap-Backlog (priorisiert, nicht auf einmal)

1. ~~Rollen-/Verantwortungsmatrix (Block 4)~~ — ✅ erledigt 2026-07-08 (`docs/governance/roles_responsibilities.md`).
2. ~~Incident-Response-Prozess (Block 4)~~ — ✅ erledigt 2026-07-08 (`docs/governance/incident_response.md`).
3. ~~Threat-Model (Block 2)~~ — ✅ erledigt 2026-07-08 (`docs/governance/threat_model.md`).
4. ~~IAP/Auth-Härtung (Block 2)~~ — ✅ Weg 1 erledigt 2026-07-08: Backend+Workbench privat +
   Single-Origin-Proxy (Identity-Token). Rest: Voll-IAP+LB+Domain + Least-Privilege-SA (Threat-Model E1). *(nächst)*
5. **Model Cards** (Block 3) — je Modell im Katalog (Zweck, Grenzen, Daten).
6. **Bias-/Robustheits-Tests + Uncertainty** (Block 1) — Test-Erweiterung.
7. **Formales Risikoregister** (Block 4) + **OSCAL-Integration** (CI-Compliance-Lint / Audit-Dashboard).

## Pflege

Bei jeder relevanten Änderung (neue Kontrolle, geschlossene Lücke, A5-Draft-Update) **dieses Mapping
aktualisieren**. Es ist die Single-Source für „Wo stehen wir gegenüber A5". A5-Draft-Evolution bis
31.08.2026 verfolgen; danach finalen Katalog gegen dieses Mapping abgleichen.
