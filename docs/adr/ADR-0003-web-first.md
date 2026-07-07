# ADR-0003 — Web zuerst (Desktop später aus derselben Codebase)

- **Status:** Akzeptiert (Owner Yahya, 2026-07-07)
- **Kontext:** Theia liefert Browser- **und** Desktop-App aus einer Codebase. Für die erste
  nutzbare Phase muss ein Zielprofil führen.

## Entscheidung

**Web zuerst.** Die erste auslieferbare OPUS-DECK-App ist die **Browser-Variante**,
deployt auf **GCP Cloud Run in `europe-west3`** (EU-first/DSGVO). Die **Desktop-App**
(Electron/Theia-Desktop) folgt später aus derselben Theia-Codebase.

## Begründung

- Schneller teilbar (kein Install), ideal für Demo/SaaS-Onboarding und frühe Nutzung.
- Deckt sich mit der GCP-/EU-Infrastruktur des Ökosystems.
- Desktop bleibt strategisch möglich (voller lokaler Datei-/Terminal-Zugriff, offline) —
  ohne Rework, da Theia beide Targets teilt.

## Konsequenzen

- **Positiv:** kürzester Weg zu „nutzbar"; EU-Hosting von Tag 1.
- **Beachten:** Browser-Sandbox begrenzt lokalen Dateisystem-/Terminal-Zugriff → dafür läuft
  die Agent-/Datei-Ausführung server-seitig im sandboxed Runtime (siehe Masterplan §6/§7).
- **Negativ:** Desktop-Only-Vorteile (echtes lokales FS, Offline-First) kommen später.
