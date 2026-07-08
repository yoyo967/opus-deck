# Incident-Response-Runbook (OPUS-System)

> Schließt A5-Block 4 „Incident-Prozesse". Für die Live-Dienste (Cloud Run: `opus-prime-ex-backend`,
> `opus-deck-workbench`; Lead-Pipeline). SSoT-Mapping: [`../../spec/A5_COMPLIANCE.md`](../../spec/A5_COMPLIANCE.md).
> **Incident Commander: Owner (Yahya).** Stand: 2026-07-08.

## Prozess (6 Schritte)

1. **Erkennen** — Signal: Cloud-Billing-Spike, ungewöhnliche Logs (`gcloud run services logs read`),
   Missbrauchsmeldung, geleakter Key, falscher Rechts-Output.
2. **Triagieren** — Schwere festlegen: **S1** (Secret-Leak / Datenexposition / laufender Missbrauch),
   **S2** (Kostenanomalie / Ausfall), **S3** (funktionaler Fehler ohne Sicherheits-/Kostenfolge).
3. **Eindämmen** — sofort (siehe Sofortmaßnahmen).
4. **Beheben** — Ursache entfernen (Fix + vier Gates + Deploy).
5. **Wiederherstellen** — Dienst kontrolliert zurückbringen, verifizieren.
6. **Nachbereiten** — kurzes Post-Mortem (Ursache, Zeitachse, Fix, Prävention) → ggf. Gap in
   `A5_COMPLIANCE.md` + neuer Test/Guardrail.

## Sofortmaßnahmen (Copy-Paste)

**Dienst sofort privat schalten (Exposition stoppen):**
```bash
gcloud run services update opus-prime-ex-backend --region=europe-west3 --no-allow-unauthenticated
gcloud run services update opus-deck-workbench   --region=europe-west3 --no-allow-unauthenticated
```
**Dienst hart stoppen (auf 0 skalieren):**
```bash
gcloud run services update opus-prime-ex-backend --region=europe-west3 --max-instances=0
```
**Anthropic-Key rotieren (neuer Wert aus .env, ohne Ausgabe) + neu ausrollen:**
```bash
grep '^ANTHROPIC_API_KEY=' .env | sed 's/^ANTHROPIC_API_KEY=//' | tr -d '\r\n"' \
  | gcloud secrets versions add anthropic-api-key --data-file=-
gcloud run services update opus-prime-ex-backend --region=europe-west3 \
  --set-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest
# danach ALTE Version deaktivieren: gcloud secrets versions disable <N> --secret=anthropic-api-key
```
**Demo-Token rotieren:**
```bash
NEU=$(python -c "import secrets;print(secrets.token_urlsafe(18))")
gcloud run services update opus-prime-ex-backend --region=europe-west3 --set-env-vars=OPUS_API_TOKEN=$NEU
# Workbench-Panels mit dem neuen Token neu bauen/ausrollen.
```

## Szenario-Karten

| Szenario | Schwere | Erste Handlung |
|---|---|---|
| **Anthropic-Key geleakt** | S1 | Key rotieren + alte Secret-Version deaktivieren; Billing prüfen. |
| **Kostenmissbrauch** (öffentl. Backend/Gemini) | S1/S2 | Backend **privat** schalten oder `max-instances=0`; Token rotieren; Vertex-Nutzung prüfen. |
| **Datenexposition** (persönl. Wissen sichtbar) | S1 | Dienst stoppen. *Erwartung: unmöglich by design* — Image hat nur Fixtures + leeres Gehirn; wenn doch → Root-Cause im Build/COPY. |
| **Falscher Rechts-Output emittiert** | S1 | Betroffenes Modell/Route sperren; RA/StB konsultieren; Guardrail-Lücke → Test + Fix. |
| **Theia-Terminal-Missbrauch** (offene Workbench) | S1 | Workbench **privat** schalten; als Konsequenz IAP-Härtung priorisieren. |
| **Ausfall** | S2/S3 | Logs prüfen; letzte gute Revision zurückrollen (`gcloud run services update-traffic --to-revisions=…`). |

## Prävention (laufend)

- `max-instances` klein halten; Billing-Budget-Alert auf `leadmachines-prod`.
- Öffentliche Exposition ist **Demo**, nicht Dauerzustand → IAP/Auth-Härtung (offener A5-Punkt).
- Jeder Incident → Post-Mortem + möglichst ein neuer Test/Guardrail (Regressionsschutz).
