# Rollen & Verantwortlichkeiten (OPUS-System)

> Schließt A5-Block 4 „Rollen/Verantwortlichkeiten". Gilt systemweit (OPUS DECK · OPUS PRIME EX ·
> OPUS FLOW · Second Brain · Cloud-Deploy). SSoT-Mapping: [`../../spec/A5_COMPLIANCE.md`](../../spec/A5_COMPLIANCE.md).
> Stand: 2026-07-08.

## Rollen

| Rolle | Wer | Mandat |
|---|---|---|
| **Owner / Systemarchitekt** | Yahya | Letztentscheidung; genehmigt Deploys, Exposition, IAM/Secrets; **Incident Commander**; Freigabe von Brain-Wiki. |
| **Coding-Agent** | Claude Code (spec-driven) | Implementiert in kleinen, reviewbaren Schritten; hält die vier Gates grün; **schlägt vor**, mutiert Cloud/IAM/Exposition nur mit Owner-Zustimmung. |
| **Antigravity** | paralleler PoC-Agent | Read-only im Betriebs-Repo; PoCs/Handoff; **kein** Merge, kein Deploy. |
| **Fachreviewer (RA/StB)** | zugelassene Berufsträger:in | Rechts-/Steuer-**Sign-off** vor produktivem Rechts-Output (OPUS PRIME EX). Ohne Sign-off nur „allgemeine Information". |
| **GCP-Admin** | Owner | `leadmachines-prod`, Secret Manager, Cloud Run, IAM. Least-Privilege. |

## Verantwortungs-Matrix (RACI-kompakt)

R = führt aus · A = rechenschaftspflichtig/entscheidet · C = konsultiert · I = informiert

| Aktivität | Owner | Coding-Agent | RA/StB | Antigravity |
|---|---|---|---|---|
| Code-Änderung + vier Gates | A | R | – | I |
| Merge auf `main` | A | R | – | – |
| Deploy Cloud Run | A | R | – | I |
| **IAM / Exposition / Secret-Rotation** | **A/R** | C (schlägt vor) | – | – |
| Produktiver Rechts-Output (Freigabe) | A | R (Pipeline) | **C→A** | – |
| Second-Brain-Wiki freigeben | A/R | C (propose) | – | – |
| **Incident-Response** | **A (Commander)** | R (Ausführung) | C (bei Rechts-Output-Vorfall) | I |
| Modell-/Provider-Wahl | A | R | – | – |

## Grundsätze

- **Review-Gate ist unumgehbar:** Agenten schlagen vor, Menschen entscheiden (Brain-Wiki, Rechts-Output).
- **Vier-Augen für Cloud-Kritisches:** IAM/Exposition/Secrets brauchen bewusste Owner-Entscheidung
  (der Coding-Agent stoppt und legt vor — siehe die geblockte IAM-Erweiterung im Deploy-Log).
- **Ehrlich vor Über-Behauptung** gilt für alle Rollen.
