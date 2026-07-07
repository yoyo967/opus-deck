// OPUS DECK — Agent-Panel (S3 Chat-Surface). Erste custom Theia-View.
// Vorerst eine gebrandete Chat-Shell fuer OPUS PRIME EX; Backend-Anbindung (ACP-Adapter)
// folgt. Der technische Zweck: beweisen, dass eine eigene View im Workbench rendert —
// das Fundament fuer alle Agent-Surfaces (Chat, Mission Control, Artifacts).
const { injectable, decorate } = require('@theia/core/shared/inversify');
const ReactNs = require('@theia/core/shared/react');
const React = ReactNs.default || ReactNs;
const h = React.createElement;
const { ReactWidget } = require('@theia/core/lib/browser/widgets/react-widget');

const AGENT_WIDGET_ID = 'opus-deck.agent';
const GOLD = '#C9A227';

class AgentWidget extends ReactWidget {
  constructor() {
    super();
    this.id = AGENT_WIDGET_ID;
    this.title.label = 'Agent';
    this.title.caption = 'OPUS PRIME EX';
    this.title.iconClass = 'codicon codicon-hubot';
    this.title.closable = true;
    this.addClass('opus-agent-panel');
    this.node.style.overflow = 'auto';
    this.update();
  }

  render() {
    const box = { fontFamily: 'var(--theia-ui-font-family)', color: 'var(--theia-foreground)', fontSize: '12px' };
    return h('div', { style: Object.assign({ padding: '12px' }, box) }, [
      h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--theia-panel-border)', paddingBottom: '8px', marginBottom: '12px' } }, [
        h('span', { key: 'dot', style: { width: '10px', height: '10px', borderRadius: '50%', background: GOLD, display: 'inline-block' } }),
        h('strong', { key: 'nm', style: { fontSize: '13px' } }, 'OPUS PRIME EX'),
        h('span', { key: 'tg', style: { fontSize: '11px', opacity: 0.7 } }, 'Recht & Steuer · DE/EU')
      ]),
      h('div', { key: 'msgs', style: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' } }, [
        h('div', { key: 'm1', style: { background: 'var(--theia-editorWidget-background)', border: '1px solid var(--theia-panel-border)', borderRadius: '8px', padding: '10px 12px', lineHeight: '1.5' } }, [
          h('div', { key: 'r', style: { fontSize: '10px', opacity: 0.6, marginBottom: '4px' } }, 'OPUS PRIME EX'),
          'Willkommen. Ich liefere allgemeine Rechts- und Steuer-Information zu deutschem und EU-Recht — mit Quellenpruefung und Guardrails. Dies ist keine Rechtsberatung.'
        ])
      ]),
      h('div', { key: 'pipe', style: { fontSize: '10px', opacity: 0.55, marginBottom: '12px' } },
        'Pipeline: Routing → Retrieval → Guardrails G1–G8 → Antwort'),
      h('div', { key: 'inrow', style: { display: 'flex', gap: '6px' } }, [
        h('input', { key: 'in', placeholder: 'Frage an OPUS PRIME EX …', disabled: true, style: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--theia-input-border)', background: 'var(--theia-input-background)', color: 'var(--theia-input-foreground)', fontSize: '12px' } }),
        h('button', { key: 'sd', disabled: true, style: { padding: '8px 12px', borderRadius: '6px', border: 'none', background: GOLD, color: '#111317', fontWeight: 600 } }, 'Senden')
      ]),
      h('div', { key: 'nt', style: { fontSize: '10px', opacity: 0.5, marginTop: '8px' } },
        'Backend-Anbindung (ACP-Adapter zu OPUS PRIME EX) folgt — P3.')
    ]);
  }
}
decorate(injectable(), AgentWidget);

module.exports = { AgentWidget, AGENT_WIDGET_ID };
