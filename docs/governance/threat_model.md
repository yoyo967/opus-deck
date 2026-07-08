# Threat-Model (OPUS-System)

> Schließt A5-Block 2 „Threat-Model". STRIDE-basiert über das **real deployte** System
> (Cloud Run europe-west3). SSoT-Mapping: [`../../spec/A5_COMPLIANCE.md`](../../spec/A5_COMPLIANCE.md).
> Verwandt: [`incident_response.md`](incident_response.md), [`roles_responsibilities.md`](roles_responsibilities.md).
> Stand: 2026-07-08. **Lebendes Dokument** — bei Architektur-/Expositions-Änderung fortschreiben.

## 1. System & Datenflüsse

```
Owner ──gcloud proxy(authz)──▶ Workbench (Cloud Run, PRIVAT)
                                  │  api-proxy: /api + Identity-Token
                                  ▼
                             Backend (Cloud Run, PRIVAT) ──▶ Vertex AI (Gemini, EU)
                                  │                     └──▶ Secret Manager (ANTHROPIC_API_KEY)
                                  ▼
                             Seed-Gehirn (Image) · Fixtures-Korpus (Image)
Lokal (nie Cloud): persönliches Gehirn (brain/raw|wiki), korpus/snapshot, .env
```

## 2. Assets & Trust Boundaries

| Asset | Sensibilität | Wo |
|---|---|---|
| `ANTHROPIC_API_KEY` | hoch (Kosten/Missbrauch) | Secret Manager (EU), Laufzeit-Env |
| Runtime-SA-Identität (`…-compute@`, **Editor**) | **sehr hoch** | Metadata-Server der Container |
| Persönliches Gehirn / Korpus | hoch (DSGVO) | **nur lokal**, gitignored |
| Nutzer-Anfragen (Rechtsfragen) | mittel (PII möglich) | Request-Pfad, Logs |
| Modell-Zugriff (Vertex/Anthropic) | mittel (Kosten) | Backend |

**Trust Boundaries:** (B1) Internet↔Workbench, (B2) Workbench↔Backend, (B3) Backend↔Vertex/Secret
Manager, (B4) lokal↔Cloud (Datenresidenz).

## 3. STRIDE

| # | Bedrohung (STRIDE) | Boundary | Mitigation (IST) | Restrisiko / Backlog |
|---|---|---|---|---|
| S1 | **Spoofing:** unbefugter Zugriff auf Workbench/Backend | B1/B2 | Beide `--no-allow-unauthenticated`; nur Owner (proxy) bzw. Workbench-SA (`run.invoker`) | Owner-Konto-Kompromittierung → MFA am Google-Konto (extern) |
| T1 | **Tampering:** manipulierte Antwort / injizierte Zitate | B3 | **Guardrails G1–G8, deterministic-first** (Modell erfindet keine Zahlen/Zitate → G4 blockt) | Prompt-Injection über Nutzertext → Injection-Tests (Backlog) |
| R1 | **Repudiation:** keine Nachvollziehbarkeit | – | Audit-Trail (G8, gehasht), CHANGELOG, ADRs, Cloud-Run-Logs | Kein zentrales SIEM; Log-Retention-Policy (Backlog) |
| I1 | **Info Disclosure — API-Key** | B3 | Nur Secret Manager, nie im Image/Repo/Log; Rotations-Runbook | Key im Laufzeit-Env lesbar bei Code-Exec → siehe E1 |
| I2 | **Info Disclosure — persönl. Daten** | B4 | **Kein persönl. Wissen im Image** (Fixtures + Seed + leeres persönl. Gehirn), verifiziert | Seed = bewusst öffentlich; Prüfung bei jeder Image-Änderung |
| I3 | **Info Disclosure — PII in Logs** | R/Logs | G5-Redaction, `log_message`-Silencing | Formaler PII-Log-Scan (Backlog) |
| D1 | **DoS / Kostenmissbrauch** (LLM-Flut) | B1/B2 | Backend privat (keine offene API); `max-instances=2`; Anthropic ohne Guthaben | Budget-Alert auf `leadmachines-prod` (Backlog) |
| E1 | **Elevation — SA-Token via Terminal** | B1 | **Workbench privat** → nur Owner erreicht das Theia-Terminal; Editor-Token nicht mehr öffentlich abgreifbar | **Default-SA = Editor** (zu breit) → dedizierte Least-Privilege-SA (Backlog, hohe Prio) |

## 4. Wichtigste Restrisiken (priorisiert)

1. **E1 — Default-Editor-SA:** die Runtime-SA hat `roles/editor`. Auch privat sollte die
   Workbench eine **dedizierte SA mit nur `run.invoker` aufs Backend** bekommen (Blast-Radius
   minimieren). *(nächster Härtungsschritt)*
2. **T1 — Prompt-Injection:** Nutzertext könnte die Pipeline manipulieren → Injection-Testfälle in
   die Eval-Suite.
3. **D1 — Budget-Alert:** GCP-Budget-/Anomalie-Alert einrichten (Kosten-Frühwarnung).
4. **R1/I3 — Logging:** Retention-Policy + PII-Log-Scan formalisieren.

## 5. Bewusst außerhalb des Scopes (jetzt)

- Öffentlicher Login-Zugang (Voll-IAP + LB + Domain) — separater Härtungsschritt.
- OPUS FLOW (lokaler OS-Automations-Agent) — **eigenes** Threat-Model bei Bau (Sandbox,
  Permission-Gates, Datei-/Netz-Zugriff) in `spec/FLOW_STUDIO.md`.
