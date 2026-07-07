# ADR-0001 — Eclipse Theia als Workbench-Fundament

- **Status:** Akzeptiert (Owner Yahya, 2026-07-07)
- **Kontext:** OPUS DECK braucht ein VS-Code-artiges Interface (Monaco-Editor, Command
  Palette, Theming, Extensions) mit **eigener Marke**, lauffähig im **Browser und als
  Desktop-App**, das agentische Surfaces (Chat, Mission Control, Artifacts) aufnehmen kann.

## Entscheidung

Wir bauen die Workbench-Shell auf **Eclipse Theia** (Theia Platform). Agentische Surfaces
werden als **Theia-Extensions** implementiert; das Look & Feel folgt der VS-Code-Sprache,
die Marke ist unsere (white-label).

## Begründung / Alternativen

| Option | Bewertung |
|--------|-----------|
| **Eclipse Theia** ✅ | Monaco + VS-Code-Look; **voll white-label**; VS-Code-Extension-kompatibel; **Web + Desktop** aus einer Codebase; modular (jedes Teil ersetzbar); EU-nahe Eclipse-Foundation-Governance |
| VS-Code-Fork (Antigravity/Cursor/Windsurf) | Größtes Ökosystem, aber Fork-Wartungslast + Marken-/Marketplace-Lizenzfragen (Microsoft); schwerer „unser" |
| code-server / openvscode-server | VS Code im Browser, aber an MS-Release gekoppelt, wenig Custom-Freiheit |
| From scratch (Monaco + eigenes Workbench) | Maximale Kontrolle, aber unverhältnismäßiger Aufwand |

## Konsequenzen

- **Positiv:** schneller zu einem produktiven, gebrandeten IDE-Erlebnis; Web+Desktop gratis;
  VS-Code-Extensions nutzbar; volle Kontrolle über Layout/Theme.
- **Negativ / Risiko:** Theia-spezifische Lernkurve; kleineres Ökosystem als VS Code.
  **Mitigation:** Diese Entscheidung ist bis P1-Ende reversibel; ein **Spike** (WI-0.2:
  Theia bootet + Branding-Theme) validiert die Wette zuerst.
- **Folgt:** ADR-0003 (Web zuerst) — beide Ziele aus Theia bedienbar.

## Referenzen

- [Eclipse Theia](https://theia-ide.org/) · [Build your own IDE](https://theia-ide.org/docs/composing_applications/)
