# ADR-0006 — A5-Konformität als Governance-Säule (BSI KI-Prüfrahmen)

- **Status:** Akzeptiert (Owner Yahya, 2026-07-08)
- **Kontext:** Das BSI hat am 06.07.2026 den **Community Draft des A5** („AI Audit and
  Assurance Assessment Architecture") veröffentlicht — einen modularen **Prüfkatalog für
  vertrauenswürdige KI-Systeme**, C5-analog, ISAE-3000-Methodik, **OSCAL-maschinenlesbar**,
  als technisch prüfbares Raster für **EU AI Act + Cyber Resilience Act**. Kommentierung bis
  31.08.2026. Unsere Systeme (OPUS PRIME EX = Rechts-KI; OPUS DECK = Multi-Agent-Plattform;
  OPUS FLOW = OS-Automation, hohes Risiko) fallen genau in dieses Prüf-/Regulierungsfeld.

## Entscheidung

1. **A5 wird die durchgehende Governance-/Prüf-Linse** für das gesamte System (alle Repos:
   OPUS DECK, OPUS PRIME EX, künftig OPUS FLOW/opus-brain). Wir bauen **A5-ready**: zu jedem
   kritischen Aspekt (Qualität, Sicherheit/Datenschutz, Transparenz, Governance) entstehen
   **prüfbare Artefakte** (Specs, Logs, Tests, Diagramme) — genau die Disziplin, die wir
   bereits fahren.
2. **Lebendes Mapping** in `spec/A5_COMPLIANCE.md`: A5s vier Blöcke → unsere konkreten
   Kontrollen (mit Datei-/Code-Zeigern) → Status (erfüllt/teilweise/offen) → Lücke/Owner-Aktion.
   Das ist eine **Arbeits-Checkliste**, kein einmaliges Dokument.
3. **Ehrliche Einordnung:** A5 ist ein **Draft** und A5 ist **kein Gesetz** — wir behaupten
   **keine „A5-Zertifizierung"**. Wir richten uns am Katalog aus, benennen Lücken offen und
   folgen der Draft-Evolution (Kommentarfrist 31.08.2026).
4. **OSCAL als Roadmap:** die maschinenlesbaren A5-Kriterien perspektivisch als
   **Compliance-Linting im CI** / internes Audit-Dashboard nutzen (kein Sofort-Bau; erst wenn
   der Kriterienstand tragfähig ist).

## Begründung / Alternativen

- **Warum A5 jetzt aufnehmen (obwohl Draft)?** Es wird der Referenzrahmen, den Prüfer und große
  Kunden in DE/EU verwenden. Früh A5-nah bauen = **kein Compliance-Refactor später**. Und es
  passt zu unserer Premium-/EU-first-/Behörden-ready-Identität.
- **Warum nur Linse, nicht Vollausbau?** Draft-Status + Feature-Reife zuerst. Wir nutzen A5 als
  **Checkliste/Quality-Gate**, nicht als Bau-Stopp.
- **Verworfen:** A5 ignorieren (späteres teures Refactor); oder A5 als Sofort-Zertifizierung
  behandeln (unehrlich bei Draft-Stand).

## Konsequenzen

- **Positiv:** unsere ohnehin starke Disziplin (Guardrails, EU-first/DSGVO, Perfect-Twin-Specs,
  Vier-Gates-CI, Review-Gates, RA/StB-Abnahme) wird in einem anerkannten Raster **prüfbar
  sichtbar**; Enterprise-/Behörden-Readiness; klarer Lücken-Backlog.
- **Aufwand:** das Mapping pflegen; künftig OSCAL-Integration; Gaps schließen (formales
  Threat-Model, Incident-Prozess, Bias/Robustheits-Tests) — priorisiert, nicht auf einmal.

## Referenzen

- `spec/A5_COMPLIANCE.md` (Mapping/Checkliste). BSI:
  [A5-Übersicht](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Kuenstliche-Intelligenz/A5/A5_node.html) ·
  [Community-Draft-PM 06.07.2026](https://www.bsi.bund.de/DE/Service-Navi/Presse/Pressemitteilungen/Presse2026/260706_KI_A5-Community-Draft.html) ·
  OSCAL (NIST). Verwandt: OPUS PRIME EX `docs/ai-act-assessment.md`, `review/human_signoff_checklist.md`.
