// OPUS DECK — Flow-Panel: Steuert den lokalen OPUS-FLOW-Daemon (read/exec mit Permission-Gate).
// Vier Flaechen gegen die lokale Flow-API (http://localhost:8850/api/flow/*):
//   Ausfuehren — Tool + Args; read laeuft sofort, exec/write/ui -> Freigaben (Gate)
//   Plan       — natuerlichsprachlicher Befehl -> Gemma-Schrittplan (nur PLAN, keine Ausfuehrung)
//   Freigaben  — offene PENDING-Aktionen: Freigeben (fuehrt aus) / Ablehnen  == das Gate in der UI
//   Audit      — append-only Protokoll (auto/user, redigiert)
// OPUS FLOW ist LOKAL (OS-Zugriff) -> das Panel ist fuer lokal laufendes OPUS DECK gedacht.
const { injectable, decorate } = require('@theia/core/shared/inversify');
const ReactNs = require('@theia/core/shared/react');
const React = ReactNs.default || ReactNs;
const h = React.createElement;
const { ReactWidget } = require('@theia/core/lib/browser/widgets/react-widget');

const FLOW_WIDGET_ID = 'opus-deck.flow';
const GOLD = '#C9A227';
const INK = '#111317';
const FLOW = 'http://localhost:8850';

const KLASSE_FARBE = { read: '#6cc07a', exec: '#dc9a4e', write: '#dc7070', ui: '#7aa2dc' };

class FlowWidget extends ReactWidget {
  constructor() {
    super();
    this.id = FLOW_WIDGET_ID;
    this.title.label = 'OPUS FLOW';
    this.title.caption = 'OPUS FLOW — lokaler Automations-Agent';
    this.title.iconClass = 'codicon codicon-run-all';
    this.title.closable = true;
    this.addClass('opus-flow-panel');
    this.node.style.overflow = 'auto';
    this._tab = 'run';
    this._tools = [];
    this._selected = '';
    this._models = [];
    this._modelDefault = '';
    this._ergebnis = null;
    this._plan = null;
    this._dry = null;
    this._pending = [];
    this._audit = [];
    this._status = '';
    this._busy = false;
    this.update();
    this.loadTools();
  }

  async _get(pfad) {
    const resp = await fetch(FLOW + pfad);
    return resp.json();
  }
  async _post(pfad, body) {
    const resp = await fetch(FLOW + pfad, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return resp.json();
  }

  async loadTools() {
    try {
      const d = await this._get('/api/flow/tools');
      this._tools = d.tools || [];
      this._selected = (this._tools[0] && this._tools[0].name) || '';
      this._scope = d.scope || [];
      this._status = '';
      try {
        const m = await this._get('/api/flow/models');
        this._models = m.modelle || [];
        this._modelDefault = m.default || '';
      } catch (e) { /* Katalog optional */ }
    } catch (e) {
      this._status = 'OPUS-FLOW-Daemon nicht erreichbar (' + FLOW + '). Lokal starten: opus-flow-serve';
    }
    this.update();
  }

  toolSpec(name) { return this._tools.find((t) => t.name === name) || null; }

  async run() {
    const spec = this.toolSpec(this.node.querySelector('.flow-tool').value);
    if (!spec) return;
    const args = {};
    (spec.params || []).forEach((p) => {
      const el = this.node.querySelector('.flow-arg-' + p);
      args[p] = el ? el.value : '';
    });
    this._busy = true; this._status = 'Fuehre ' + spec.name + ' …'; this._ergebnis = null; this.update();
    try {
      const d = await this._post('/api/flow/run', { tool: spec.name, args: args });
      if (d.pending) {
        this._status = '→ Freigabe noetig (exec). Zum Tab „Freigaben".';
        await this.loadPending();
        this._tab = 'gate';
      } else {
        this._ergebnis = d.ergebnis || d;
        this._status = '';
      }
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  async plan() {
    const befehl = (this.node.querySelector('.flow-befehl') || {}).value || '';
    if (!befehl.trim()) return;
    const sel = this.node.querySelector('.flow-model');
    const modelId = (sel && sel.value) || this._modelDefault;
    const label = (this._models.find((m) => m.id === modelId) || {}).label || modelId || 'Default';
    this._busy = true; this._status = 'Plane mit ' + label + ' … (lokale CPU-Modelle koennen dauern)';
    this._plan = null; this._dry = null; this.update();
    try {
      const d = await this._post('/api/flow/plan', { befehl: befehl, model_id: modelId });
      this._plan = d;
      this._dry = null;
      this._status = d.fehler ? d.fehler : '';
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  async dryRun() {
    if (!this._plan || !this._plan.plan) return;
    this._busy = true; this._status = 'Dry-Run (validiere, ohne Ausfuehrung) …'; this.update();
    try {
      const d = await this._post('/api/flow/dry_run', { plan: this._plan.plan });
      this._dry = d.dry_run || [];
      this._status = '';
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  async runStep(step) {
    // Einzelnen Plan-Schritt ausfuehren: read sofort, exec/write/ui -> Freigaben (Gate).
    this._busy = true; this._status = 'Fuehre ' + step.tool + ' …'; this._ergebnis = null; this.update();
    try {
      const d = await this._post('/api/flow/run', { tool: step.tool, args: step.args || {} });
      if (d.pending) { this._status = '→ Freigabe noetig. Tab „Freigaben".'; await this.loadPending(); this._tab = 'gate'; }
      else { this._ergebnis = d.ergebnis || d; this._status = 'Schritt ausgefuehrt.'; }
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  async loadPending() { try { this._pending = (await this._get('/api/flow/pending')).pending || []; } catch (e) { /* still */ } }
  async loadAudit() { try { this._audit = (await this._get('/api/flow/audit')).eintraege || []; } catch (e) { /* still */ } }

  async decide(id, aktion) {
    this._busy = true; this._status = aktion === 'approve' ? 'Freigeben + ausfuehren …' : 'Ablehnen …'; this.update();
    try {
      const d = await this._post('/api/flow/' + aktion, { id: id });
      if (d.ergebnis) this._ergebnis = d.ergebnis;
      this._status = d.fehler ? d.fehler : (aktion === 'approve' ? 'Ausgefuehrt.' : 'Abgelehnt.');
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false;
    await this.loadPending(); await this.loadAudit(); this.update();
  }

  setTab(t) {
    this._tab = t; this._status = '';
    if (t === 'gate') this.loadPending();
    if (t === 'audit') this.loadAudit();
    this.update();
  }

  klasseBadge(k) {
    return h('span', { style: {
      fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', padding: '1px 6px',
      borderRadius: '999px', color: INK, background: KLASSE_FARBE[k] || '#888',
    } }, k);
  }

  renderErgebnis() {
    if (!this._ergebnis) return null;
    const e = this._ergebnis;
    return h('pre', { style: {
      margin: '8px 0 0', padding: '9px', borderRadius: '8px', fontSize: '11px', lineHeight: 1.45,
      background: 'var(--theia-editor-background)', border: '1px solid ' + (e.ok ? 'var(--theia-panel-border)' : 'rgba(220,112,112,0.6)'),
      whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '260px', overflow: 'auto',
    } }, (e.ok ? '' : '⚠ ') + JSON.stringify(e.ok ? e.data : e.fehler, null, 2));
  }

  renderRun() {
    const spec = this.toolSpec((this.node.querySelector('.flow-tool') || {}).value || this._selected);
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('label', { key: 'l', style: hint() }, 'Tool (read laeuft sofort · exec/write/ui brauchen Freigabe)'),
      h('select', { key: 'sel', className: 'flow-tool', defaultValue: this._selected, onChange: () => this.update(),
        style: inputStyle() }, this._tools.map((t) => h('option', { key: t.name, value: t.name }, t.name + ' — ' + t.wirkungsklasse))),
      spec ? h('div', { key: 'kl', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [this.klasseBadge(spec.wirkungsklasse), h('span', { style: hint() }, spec.beschreibung)]) : null,
      ...(spec ? (spec.params || []).map((p) => h('input', { key: p, className: 'flow-arg-' + p, placeholder: p,
        defaultValue: p === 'repo' || p === 'pfad' ? (this._scope && this._scope[0]) || '.' : '', style: inputStyle() })) : []),
      h('button', { key: 'go', disabled: this._busy, onClick: () => this.run(), style: Object.assign({}, btn(this._busy), { alignSelf: 'flex-start' }) }, this._busy ? '…' : 'Ausfuehren'),
      this.renderErgebnis(),
    ]);
  }

  renderPlan() {
    const p = this._plan;
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('div', { key: 'n', style: hint() }, 'Natuerlichsprachlicher Befehl → Schrittplan (nur PLAN, keine Ausfuehrung).'),
      this._models.length ? h('select', { key: 'm', className: 'flow-model', defaultValue: this._modelDefault, style: inputStyle() },
        this._models.map((m) => h('option', { key: m.id, value: m.id }, m.label + '  ·  ' + m.provider))) : null,
      h('textarea', { key: 'in', className: 'flow-befehl', rows: 3, placeholder: 'z. B. „zeig mir den git-Status dieses Repos"', style: Object.assign({}, inputStyle(), { resize: 'vertical' }) }),
      h('div', { key: 'btns', style: { display: 'flex', gap: '6px' } }, [
        h('button', { key: 'b', disabled: this._busy, onClick: () => this.plan(), style: btn(this._busy) }, this._busy ? '…' : 'Plan erstellen'),
        p && p.plan ? h('button', { key: 'd', disabled: this._busy, onClick: () => this.dryRun(),
          style: { padding: '7px 12px', borderRadius: '6px', border: '1px solid ' + GOLD, background: 'transparent', color: GOLD, cursor: 'pointer', fontWeight: 600 } }, 'Dry-Run') : null,
      ]),
      p && p.plan ? h('div', { key: 'pl', style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
        p.plan.map((s, i) => {
          const dv = this._dry && this._dry[i];
          return h('div', { key: i, style: karte() }, [
            h('div', { key: 't', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
              h('span', { style: { fontSize: '10px', opacity: 0.5 } }, (i + 1) + '.'),
              h('strong', { style: { fontSize: '12px' } }, s.tool),
              h('button', { key: 'r', disabled: this._busy, onClick: () => this.runStep(s),
                style: { marginLeft: 'auto', padding: '3px 9px', borderRadius: '5px', border: 'none', background: GOLD, color: INK, fontWeight: 600, cursor: 'pointer', fontSize: '10px' } }, '▶ Ausfuehren')]),
            h('div', { key: 'a', style: { fontSize: '10px', opacity: 0.7, fontFamily: 'monospace' } }, JSON.stringify(s.args || {})),
            s.warum ? h('div', { key: 'w', style: hint() }, s.warum) : null,
            dv ? h('div', { key: 'dv', style: { fontSize: '10px', marginTop: '3px', color: dv.ok ? '#6cc07a' : '#dc7070' } },
              (dv.ok ? '✓ Dry-Run: ' : '✗ Dry-Run: ') + (dv.hinweis || '')) : null,
          ]);
        })) : null,
      this.renderErgebnis(),
    ]);
  }

  renderGate() {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('div', { key: 'n', style: hint() }, 'Offene PENDING-Aktionen (exec/write/ui). Du entscheidest — das Gate ist vom Agenten nicht umgehbar.'),
      this._pending.length ? h('div', { key: 'l', style: { display: 'flex', flexDirection: 'column', gap: '7px' } },
        this._pending.map((a) => h('div', { key: a.id, style: karte() }, [
          h('div', { key: 'h', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [this.klasseBadge(a.wirkungsklasse), h('strong', { style: { fontSize: '12px' } }, a.tool)]),
          h('div', { key: 'a', style: { fontSize: '11px', fontFamily: 'monospace', opacity: 0.8, wordBreak: 'break-all' } }, JSON.stringify(a.args || {})),
          h('div', { key: 'b', style: { display: 'flex', gap: '8px', marginTop: '4px' } }, [
            h('button', { key: 'ap', disabled: this._busy, onClick: () => this.decide(a.id, 'approve'), style: btn(this._busy) }, 'Freigeben'),
            h('button', { key: 'rj', disabled: this._busy, onClick: () => this.decide(a.id, 'reject'), style: { padding: '7px 11px', borderRadius: '6px', border: '1px solid rgba(220,112,112,0.6)', background: 'transparent', color: '#dc7070', cursor: 'pointer', fontWeight: 600 } }, 'Ablehnen'),
          ]),
        ]))) : h('div', { key: 'e', style: hint() }, 'Keine offenen Freigaben.'),
      this.renderErgebnis(),
    ]);
  }

  renderAudit() {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, [
      h('div', { key: 'n', style: hint() }, 'Append-only Protokoll (redigiert). Neueste zuletzt.'),
      this._audit.length ? this._audit.slice().reverse().map((x, i) => h('div', { key: i, style: karte() }, [
        h('div', { key: 'h', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
          this.klasseBadge(x.wirkungsklasse),
          h('strong', { style: { fontSize: '11px' } }, x.tool),
          h('span', { style: { marginLeft: 'auto', fontSize: '9px', opacity: 0.5 } }, x.ts)]),
        h('div', { key: 'm', style: { fontSize: '9px', opacity: 0.6 } }, 'Freigabe: ' + x.freigabe + ' · ' + (x.ok ? 'ok' : 'Fehler') + ' · ' + x.dauer_ms + 'ms'),
      ])) : h('div', { key: 'e', style: hint() }, 'Noch keine Eintraege.'),
    ]);
  }

  render() {
    const tabs = [['run', 'Ausfuehren'], ['plan', 'Plan'], ['gate', 'Freigaben'], ['audit', 'Audit']];
    const body = this._tab === 'run' ? this.renderRun() : this._tab === 'plan' ? this.renderPlan()
      : this._tab === 'gate' ? this.renderGate() : this.renderAudit();
    return h('div', { style: { fontFamily: 'var(--theia-ui-font-family)', color: 'var(--theia-foreground)', fontSize: '12px', padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' } }, [
      h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--theia-panel-border)', paddingBottom: '8px', marginBottom: '10px' } }, [
        h('span', { key: 'd', style: { width: '10px', height: '10px', borderRadius: '50%', background: GOLD } }),
        h('strong', { key: 'n', style: { fontSize: '13px' } }, 'OPUS FLOW'),
        h('span', { key: 't', style: { fontSize: '11px', opacity: 0.7 } }, 'lokal · Plan → Gate → Audit'),
        h('span', { key: 'p', style: { marginLeft: 'auto', fontSize: '10px', opacity: 0.6 } }, this._pending.length ? (this._pending.length + ' offen') : ''),
      ]),
      h('div', { key: 'tabs', style: { display: 'flex', gap: '4px', marginBottom: '10px' } }, tabs.map(([id, label]) =>
        h('button', { key: id, onClick: () => this.setTab(id), style: { flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
          border: '1px solid ' + (this._tab === id ? GOLD : 'var(--theia-panel-border)'),
          background: this._tab === id ? 'rgba(201,162,39,0.14)' : 'transparent',
          color: this._tab === id ? GOLD : 'var(--theia-foreground)', fontWeight: this._tab === id ? 600 : 400 } }, label))),
      h('div', { key: 'body', style: { flex: 1, overflowY: 'auto' } }, body),
      this._status ? h('div', { key: 'st', style: { fontSize: '10px', opacity: 0.65, marginTop: '8px', borderTop: '1px solid var(--theia-panel-border)', paddingTop: '6px' } }, this._status) : null,
    ]);
  }
}

function inputStyle() {
  return { padding: '7px', borderRadius: '6px', border: '1px solid var(--theia-input-border)', background: 'var(--theia-input-background)', color: 'var(--theia-input-foreground)', fontSize: '12px' };
}
function btn(busy) {
  return { padding: '7px 12px', borderRadius: '6px', border: 'none', background: busy ? '#7a6a2e' : GOLD, color: INK, fontWeight: 600, cursor: busy ? 'default' : 'pointer' };
}
function hint() { return { fontSize: '11px', opacity: 0.55, lineHeight: 1.5 }; }
function karte() { return { border: '1px solid var(--theia-panel-border)', borderRadius: '8px', padding: '8px 10px', background: 'var(--theia-editorWidget-background)' }; }

decorate(injectable(), FlowWidget);
module.exports = { FlowWidget, FLOW_WIDGET_ID };
