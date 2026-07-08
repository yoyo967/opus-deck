// OPUS DECK — Agent-Panel (S3 Chat-Surface). Custom Theia-ReactWidget.
// Interaktiver Chat gegen den OPUS-PRIME-EX-Backend (/api/models, /api/frage) mit
// Hybrid-Modellwahl (alle Claude-Modelle + lokales Gemma 4). Zeigt Antwort, gewaehltes
// Modell, Route, Quellen und Guardrail-Ereignisse — die volle Pipeline sichtbar.
// State liegt auf der Widget-Instanz; this.update() rendert neu (Eingaben sind
// unkontrolliert -> Tippen bleibt ueber Re-Render erhalten).
const { injectable, decorate } = require('@theia/core/shared/inversify');
const ReactNs = require('@theia/core/shared/react');
const React = ReactNs.default || ReactNs;
const h = React.createElement;
const { ReactWidget } = require('@theia/core/lib/browser/widgets/react-widget');

const AGENT_WIDGET_ID = 'opus-deck.agent';
const GOLD = '#C9A227';
const INK = '#111317';
// Backend-Origin: lokal 127.0.0.1:8848; in der Cloud das private-aber-erreichbare Cloud-Run-
// Backend (per Demo-Token geschuetzt). Spaeter konfigurierbar / ACP-Adapter.
const _LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const BACKEND = _LOCAL ? 'http://localhost:8848' : 'https://opus-prime-ex-backend-805048455261.europe-west3.run.app';
// Oeffentlicher Demo-Token (Client-seitig -> nur Bremsschwelle/Kostenschutz, KEIN Secret; rotierbar).
const OPUS_TOKEN = 'tpoTRtgo-dBtnAgani7tKt32';

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
    this._models = [];
    this._selected = '';
    this._messages = [];
    this._busy = false;
    this._status = 'Verbinde mit OPUS PRIME EX …';
    this.update();
    this.loadModels();
  }

  async loadModels() {
    try {
      const resp = await fetch(BACKEND + '/api/models');
      const data = await resp.json();
      this._models = data.modelle || [];
      const sonnet = this._models.find((m) => m.id === 'claude-sonnet-5');
      this._selected = (sonnet && sonnet.id) || (this._models[0] && this._models[0].id) || '';
      this._status = '';
    } catch (e) {
      this._status = 'Backend nicht erreichbar (' + BACKEND + '). Läuft der OPUS-PRIME-EX-Server?';
    }
    this.update();
  }

  currentModelId() {
    const sel = this.node.querySelector('.opus-model');
    return (sel && sel.value) || this._selected;
  }

  async send() {
    if (this._busy) return;
    const input = this.node.querySelector('.opus-frage');
    const frage = (input && input.value || '').trim();
    if (!frage) return;
    const modelId = this.currentModelId();
    const label = (this._models.find((m) => m.id === modelId) || {}).label || modelId;
    this._messages.push({ role: 'user', text: frage });
    if (input) input.value = '';
    this._busy = true;
    this._status = 'Frage an ' + label + ' … (lokale CPU-Modelle können 1–5 min brauchen)';
    this.update();
    try {
      const resp = await fetch(BACKEND + '/api/frage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Opus-Token': OPUS_TOKEN },
        body: JSON.stringify({ frage: frage, model_id: modelId }),
      });
      const data = await resp.json();
      this._messages.push({
        role: 'assistant',
        text: data.antwort || data.fehler || '(keine Antwort)',
        blockiert: !data.antwort,
        meta: {
          modell: data.modell,
          route: data.route,
          domaenen: data.domaenen || [],
          quellen: (data.quellen || []).length,
          guardrails: data.guardrails || [],
        },
      });
    } catch (e) {
      this._messages.push({ role: 'assistant', text: 'Fehler: Backend nicht erreichbar.', blockiert: true, meta: {} });
    }
    this._busy = false;
    this._status = '';
    this.update();
  }

  renderMessage(m, i) {
    const istUser = m.role === 'user';
    const bubble = {
      background: istUser ? 'rgba(201,162,39,0.12)' : 'var(--theia-editorWidget-background)',
      border: '1px solid ' + (m.blockiert ? 'rgba(220,80,80,0.5)' : 'var(--theia-panel-border)'),
      borderRadius: '8px', padding: '10px 12px', lineHeight: '1.5', fontSize: '12px',
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    };
    const kinder = [
      h('div', { key: 'r', style: { fontSize: '10px', opacity: 0.6, marginBottom: '4px' } },
        istUser ? 'Du' : (m.meta && m.meta.modell) || 'OPUS PRIME EX'),
      h('div', { key: 't' }, m.text),
    ];
    if (!istUser && m.meta && (m.meta.route || m.meta.guardrails)) {
      const tags = [];
      if (m.meta.route) tags.push('Route ' + m.meta.route);
      if (m.meta.domaenen && m.meta.domaenen.length) tags.push(m.meta.domaenen.join(', '));
      tags.push(m.meta.quellen + ' Quellen');
      if (m.meta.guardrails && m.meta.guardrails.length) tags.push('Guardrails: ' + m.meta.guardrails.join(' · '));
      kinder.push(h('div', { key: 'm', style: { fontSize: '10px', opacity: 0.55, marginTop: '6px', borderTop: '1px solid var(--theia-panel-border)', paddingTop: '5px' } }, tags.join('  ·  ')));
    }
    return h('div', { key: i, style: bubble }, kinder);
  }

  render() {
    const box = { fontFamily: 'var(--theia-ui-font-family)', color: 'var(--theia-foreground)', fontSize: '12px' };
    const optionen = this._models.map((m) => {
      // "lokal, kostenlos" nur fuer LOKALES Gemma — Cloud-GPU (-cloud) ist weder lokal noch gratis.
      const istLokalesGemma = m.provider === 'gemma' && m.id.indexOf('-cloud') === -1;
      return h('option', { key: m.id, value: m.id }, m.label + (istLokalesGemma ? '  ·  lokal, kostenlos' : ''));
    });
    return h('div', { style: Object.assign({ padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }, box) }, [
      h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--theia-panel-border)', paddingBottom: '8px', marginBottom: '10px' } }, [
        h('span', { key: 'dot', style: { width: '10px', height: '10px', borderRadius: '50%', background: GOLD } }),
        h('strong', { key: 'nm', style: { fontSize: '13px' } }, 'OPUS PRIME EX'),
        h('span', { key: 'tg', style: { fontSize: '11px', opacity: 0.7 } }, 'Recht & Steuer · DE/EU'),
      ]),
      h('label', { key: 'ml', style: { fontSize: '10px', opacity: 0.7, marginBottom: '3px' } }, 'Modell'),
      h('select', { key: 'sel', className: 'opus-model', defaultValue: this._selected,
        style: { marginBottom: '10px', padding: '6px', borderRadius: '6px', background: 'var(--theia-input-background)', color: 'var(--theia-input-foreground)', border: '1px solid var(--theia-input-border)', fontSize: '12px' } }, optionen),
      h('div', { key: 'msgs', style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', minHeight: '60px' } },
        this._messages.length ? this._messages.map((m, i) => this.renderMessage(m, i))
          : [h('div', { key: 'empty', style: { fontSize: '11px', opacity: 0.55, lineHeight: 1.5 } },
              'Willkommen. Stelle eine Frage zu deutschem/EU-Recht. Volle Pipeline mit Quellenprüfung und Guardrails. Keine Rechtsberatung.')]),
      this._status ? h('div', { key: 'st', style: { fontSize: '10px', opacity: 0.6, marginBottom: '6px' } }, this._status) : null,
      h('div', { key: 'pipe', style: { fontSize: '10px', opacity: 0.5, marginBottom: '8px' } },
        'Routing → Retrieval → Guardrails G1–G8 → Antwort'),
      h('div', { key: 'inrow', style: { display: 'flex', gap: '6px' } }, [
        h('input', { key: 'in', className: 'opus-frage', placeholder: 'Frage an OPUS PRIME EX …', disabled: this._busy,
          onKeyDown: (e) => { if (e.key === 'Enter') this.send(); },
          style: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--theia-input-border)', background: 'var(--theia-input-background)', color: 'var(--theia-input-foreground)', fontSize: '12px' } }),
        h('button', { key: 'sd', disabled: this._busy, onClick: () => this.send(),
          style: { padding: '8px 12px', borderRadius: '6px', border: 'none', background: this._busy ? '#7a6a2e' : GOLD, color: INK, fontWeight: 600, cursor: this._busy ? 'default' : 'pointer' } },
          this._busy ? '…' : 'Senden'),
      ]),
    ]);
  }
}
decorate(injectable(), AgentWidget);

module.exports = { AgentWidget, AGENT_WIDGET_ID };
