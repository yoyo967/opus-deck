# Ökosystem-Briefing — OPUS DECK, Agenten, Mobile, Agenticum

> **Zweck:** kanonische Wissensbasis für Produkt-/Marken-/Architektur-Entscheidungen + Quelle für
> Landingpages und Claude-Code-Briefings. Extrahiert aus der Strategie-Recherche (2026-07-08).
> **Ehrlichkeit (Perfect-Twin):** Fakt = aus Repo/Quelle belegt · Einschätzung = Analyse ·
> **offen** = Owner-Entscheidung nötig. Marktzahlen sind externe Sekundärquellen (zu verifizieren),
> nicht Eigenmessung.

## 1. Systemlandkarte

| Komponente | Rolle | Status |
|---|---|---|
| **OPUS DECK** | Multi-Agent-Workbench (Theia, ACP-Host + MCP-Broker) | live (privat, Cloud Run EU); Panels Agent · Second Brain · OPUS FLOW |
| **OPUS PRIME EX** | 1. Fach-Agent: Recht/Steuer DE/EU, Guardrails G1–G8, deterministisch | Alpha, live (privat, Gemini/Vertex-EU); **ACP-Adapter offen** |
| **OPUS FLOW (→ OPUS FLOW EX)** | 2. Fach-Agent: lokaler OS-/Dev-Orchestrator (Gemma 4), Gate/Audit | F0/F1/F2 gebaut; über **MCP** integriert, **ACP-Andockung offen** |
| **Second Brain** | geteiltes MCP-Wissen (Raw/Wiki/Schema, Review-Gate) | gebaut (B0–B3), im Panel |
| **A5-Konformität** | BSI-Prüfrahmen als Governance-Linse | lebendes Mapping, keine Zertifizierung |
| **Agency OS** | 1. vertikale App auf OPUS DECK (CRM/Rechnungen/Marketing/…) | im Realbetrieb bei Agenticum |
| **Agenticum G5 Leadmachines** | eigenständige B2B-Servicemarke (lokale Lead-Gen als Outcome) | Live-Site, aktiver Vertrieb |
| **Android Mobile App** | 4. Client (Mission Control unterwegs) | **Konzept** (dieses Briefing) |

## 2. Android Mobile App — „Agent Control Surface"

**Kernpositionierung (Einschätzung):** *kein* miniaturisierter Desktop-Workbench, sondern ein
**mobiler Governance-/Oversight-Layer** für die Agenten. Das Handy wird zum **Approval-Gerät**:
Jobs starten, Freigaben erteilen, Status verfolgen, Artefakte prüfen, Fehler stoppen — Pushes wie
„Build fertig", „PowerShell-Freigabe nötig", „Wiki-Diff zur Review".

- **v1-Scope = wenige Kernobjekte perfekt** (nicht volle IDE-Parität): **Missions** (Mission Control,
  Surface S4) · **Approvals** (Permission-Gate mobil) · **Artifacts** (S6) · **Timeline/Audit** (S10);
  optional **Second-Brain-Review** (Wiki-Diffs freigeben/ablehnen). Kein Monaco/Terminal auf Mobile.
- **Stack (Einschätzung):** **React Native + Expo** (die bestehende TS-Monorepo-Struktur apps/
  packages wiederverwenden); ACP/MCP-Client über REST/WebSocket gegen das Cloud-Run-Backend (EU);
  offline-first (SQLite/MMKV); **Push Notifications = kritisch** für async Agent-Tasks.
- **IDE zum Bauen (Einschätzung):** **VS Code + Claude Code Extension** (+ Expo-Plugin
  `claude plugin install expo@claude-plugins-official`, + React-Native-Assistant-Plugin);
  **Android Studio nur** für Emulator/Gradle/SDK im Hintergrund.
- **Monetarisierung (Einschätzung):** über den **Server-Tier**, nicht die App — umgeht die 30 %
  Google-Play-Fee (B2B-Billing außerhalb Play). Freemium+Seat-SaaS, B2B-Team (Samsung Knox/Managed),
  EU-first/DSGVO als Enterprise-Türöffner.
- **Markt (extern, zu verifizieren):** AI-Agents-Markt stark wachsend; Gartner: 40 % Enterprise-Apps
  mit task-spezifischen Agenten bis Ende 2026. Chance > Risiko, weil die App *selbst* das agentische
  Frontend ist (wird nicht von Agenten ersetzt).

## 3. Marken-/Plattform-Strategie — „Marken trennen, Beweisführung verbinden"

Drei Schichten mit verschiedenen Jobs/Zielgruppen:

| Schicht | Was | Zielgruppe |
|---|---|---|
| **OPUS DECK** | technisches Fundament (Multi-Agent-Workbench) | Entwickler, technische Builder, Enterprise |
| **Agency OS** | vertikale App auf OPUS DECK (Business-Cockpit) | Agenturen/Ops-Teams |
| **Agenticum G5** | client-facing Servicemarke (Outcome „Lead Machines") | lokale Dienstleister (kein Tech-Interesse) |

**Empfehlung (Einschätzung):** Domains/Branding **vollständig getrennt** (OPUS DECK: eigene
Landingpage + Doku-Portal mit ADRs/Specs/A5-Mapping als Vertrauenssignal; Agenticum: unverändert,
nüchtern). **Einseitiger Referenzfluss:** OPUS DECK zeigt Agency OS als Flaggschiff-Case-Study;
Agenticum erwähnt höchstens beiläufig „eigenes AI-Betriebssystem im Einsatz". Kein gemeinsamer Login/
Nav. „Built on OPUS DECK"-Zeile im Agency-OS-Footer.

## 4. ACP-Agenten — Bau-Reihenfolge (korrigiert: NICHT gleich ein weiterer Fach-Agent)

Fundament vor Domäne (aus Masterplan-Phasenlogik):

1. **PRIME-EX-ACP-Adapter fertigstellen** (WI-3.2) — der Agent muss real über ACP im Workbench
   steuerbar sein (heute MCP; ACP-Host zurückgestellt).
2. **OPUS FLOW als ACP-Agent andocken** — 2. eigener Agent (heute MCP-integriert).
3. **Etablierten Fremd-Agenten andocken** (Claude Code oder Gemini CLI via ACP) — beweist Offenheit
   (P6 WI-6.1); großer Vertrauens-/Differenzierungsfaktor.
4. **Erst danach** nächster eigener Fach-Agent — eher Marketing/Wettbewerbsanalyse (Anschluss an
   Agency OS) mit geringerem regulatorischem Risiko, **nicht zwingend Finanzen**.

### OPUS MONEY EX (späterer Fach-Agent) — regulatorische Leitplanke (wichtig)
**Als Informations-/Analyse-Agent bauen, NICHT als Broker/Verwahrer.** „Echter Broker",
Wallet-Verwahrung für Kunden und personalisierte Anlageberatung (auch Robo-Advice) sind in DE/EU
**erlaubnispflichtig** (§ 32 KWG / § 15 WpIG / MiCAR). **Erlaubnisfrei + sofort baubar:** Live-
Marktdaten (London–HK–NYSE–Frankfurt), Analysen, Bildung, Portfolio-Tracking bei **Self-Custody**
(nur Anzeige, keine Ausführung/Keys), allgemeine Einschätzungen mit Disclaimer — genau das
PRIME-EX-Muster (Info-Agent statt Berater). Optional später: White-Label mit BaFin-lizenziertem Partner.

## 5. ACP als Positionierung („LSP für Agenten")

**Fakt/Einschätzung:** ACP (Zed, Aug 2025) entkoppelt Editor ↔ Agent wie LSP Editor ↔ Sprache.
Wert für OPUS DECK: die Governance-Schicht (Gates, Audit, Second Brain) **einmal** bauen → gilt für
**jeden** andockenden Agenten (eigen oder fremd); kein Lock-in; ACP-Registry „implement once, work
everywhere". Noch jung/nischig (Namensverwirrung mit *Agentic Commerce Protocol* / *Agent Connect
Protocol*; von MCP-Hype überschattet) → **First-Mover-Fenster**.

**Marketing-Entscheidung (Owner):** ACP öffentlich (LinkedIn) bespielen, **Produktname OPUS DECK
geheim** („wie ein API-Key"). Agenticum als „Driven Studio", das ACP-Agenten ein Zuhause gibt —
**Empfehlung: separate Untermarke** dafür (nicht mit der Lead-Machine-Verkaufsseite mischen).
Partial-Stealth (Konzept öffentlich, Name geheim) + **internen Reveal-Trigger/-Termin festlegen**.

## 6. Offene Owner-Entscheidungen (blockieren Downstream)

- **Hosting-Modell:** self-hosted vs. SaaS-Multi-Tenant.
- **Monetarisierung:** intern (Dogfooding) vs. Produkt — beeinflusst Prioritäten P7/P8.
- **Mobile-App-Repo:** eigenes `opus-deck-mobile` (React Native) vs. Ordner im Monorepo.
- **ACP-Host bauen** (P3/P4) als Voraussetzung für 1.–3. oben.
- Reveal-Trigger für OPUS DECK; Untermarke fürs „Driven Studio".

## 7. Arbeitsweise (Kontext)

Yahya plant Upgrade **Claude Pro → Max**, um **parallel über mehrere IDEs / mit mehreren Agenten
gleichzeitig** am Projekt zu arbeiten (Effizienz, schnelleres Time-to-Ship). Diese Wissensbasis ist
bewusst so gehalten, dass mehrere kalt startende Agenten sie als gemeinsamen Kontext nutzen können.
