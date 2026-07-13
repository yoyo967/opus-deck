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
    this._chain = null;
    this._pending = [];
    this._audit = [];
    this._workflows = [];
    this._security = null;
    this._gestoppt = false;
    this._status = '';
    this._busy = false;
    this.update();
    this.loadTools();
    this.loadSecurity();
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

  async runChain() {
    // Ganzen Plan als Kette: read-Schritte laufen auto, erster exec/write/ui pausiert (Gate).
    if (!this._plan || !this._plan.plan) return;
    this._busy = true; this._status = 'Kette laeuft (read auto · erster exec/write/ui pausiert) …';
    this._chain = null; this._ergebnis = null; this.update();
    try {
      const d = await this._post('/api/flow/run_plan', { plan: this._plan.plan });
      this._chain = d;
      if (d.status === 'warte_freigabe') {
        this._status = 'Kette pausiert bei Schritt ' + (d.index + 1) + ' — Freigabe im Tab „Freigaben".';
        await this.loadPending();
      } else if (d.status === 'fehler') {
        this._status = 'Kette gestoppt bei Schritt ' + (d.index + 1) + ' (unbekanntes Tool).';
      } else {
        this._status = 'Kette fertig — ' + (d.ergebnisse || []).length + ' read-Schritt(e) gelaufen.';
      }
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
  async loadWorkflows() { try { this._workflows = (await this._get('/api/flow/workflows')).workflows || []; } catch (e) { /* still */ } }
  async loadSecurity() {
    try {
      this._security = await this._get('/api/flow/security');
      this._gestoppt = !!(this._security.kill_switch && this._security.kill_switch.gestoppt);
    } catch (e) { this._security = null; }
  }

  async killSwitch() {
    this._busy = true; this._status = 'Kill-Switch: stoppe + verwerfe offene Freigaben …'; this.update();
    try {
      const d = await this._post('/api/flow/kill', {});
      this._gestoppt = !!d.gestoppt;
      this._status = '⛔ Kill-Switch AKTIV — Ausfuehrung gesperrt (' + (d.verworfen || 0) + ' Freigabe(n) verworfen). „Entsperren" zum Fortsetzen.';
      await this.loadPending(); await this.loadSecurity();
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  async armSwitch() {
    this._busy = true; this._status = 'Entsperren …'; this.update();
    try {
      const d = await this._post('/api/flow/arm', {});
      this._gestoppt = !!d.gestoppt;
      this._status = this._gestoppt ? 'Noch gesperrt.' : 'Entsperrt — Ausfuehrung wieder erlaubt.';
      await this.loadSecurity();
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  // ${param}-Platzhalter aus allen String-Args der Plan-Schritte sammeln.
  _paramsAusPlan(schritte) {
    const re = /\$\{(\w+)\}/g; const set = new Set();
    (schritte || []).forEach((s) => Object.values(s.args || {}).forEach((v) => {
      if (typeof v === 'string') { let m; while ((m = re.exec(v))) set.add(m[1]); }
    }));
    return Array.from(set);
  }

  async saveWorkflow() {
    if (!this._plan || !this._plan.plan) return;
    const name = ((this.node.querySelector('.flow-wf-name') || {}).value || '').trim();
    if (!name) { this._status = 'Bitte einen Namen fuer den Workflow angeben.'; this.update(); return; }
    const schritte = this._plan.plan.map((s) => ({ tool: s.tool, args: s.args || {} }));
    this._busy = true; this._status = 'Speichere Workflow …'; this.update();
    try {
      const d = await this._post('/api/flow/workflow/save', { name: name, schritte: schritte, params: this._paramsAusPlan(schritte) });
      this._status = d.fehler ? d.fehler : ('Workflow „' + (d.name || name) + '" gespeichert.');
      await this.loadWorkflows(); this._tab = 'flows';
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

  async runWorkflow(wf) {
    const params = {};
    (wf.params || []).forEach((p) => {
      const el = this.node.querySelector('.flow-wfp-' + wf.id + '-' + p);
      if (el && el.value) params[p] = el.value;
    });
    this._busy = true; this._status = 'Spiele „' + wf.name + '" ab …'; this._ergebnis = null; this.update();
    try {
      const d = await this._post('/api/flow/workflow/run', { id: wf.id, params: params });
      if (d.fehler) { this._status = d.fehler; }
      else {
        const offen = (d.ergebnisse || []).some((r) => r && r.pending);
        this._wfErgebnis = d;
        if (offen) { this._status = 'Ein oder mehr Schritte brauchen Freigabe. Tab „Freigaben".'; await this.loadPending(); }
        else { this._status = 'Workflow „' + d.workflow + '" abgespielt.'; }
      }
    } catch (e) { this._status = 'Daemon nicht erreichbar.'; }
    this._busy = false; this.update();
  }

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
    if (t === 'flows') this.loadWorkflows();
    if (t === 'security') this.loadSecurity();
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
        p && p.plan ? h('button', { key: 'c', disabled: this._busy, onClick: () => this.runChain(),
          style: { padding: '7px 12px', borderRadius: '6px', border: 'none', background: GOLD, color: INK, cursor: 'pointer', fontWeight: 600 } }, '▶ Kette ausfuehren') : null,
      ]),
      this._chain ? h('div', { key: 'ch', style: Object.assign({}, karte(), { borderColor: this._chain.status === 'fertig' ? 'rgba(108,192,122,0.6)' : GOLD }) }, [
        h('div', { key: 't', style: { fontSize: '11px', fontWeight: 600 } },
          this._chain.status === 'fertig' ? '✓ Kette fertig — ' + (this._chain.ergebnisse || []).length + ' read-Schritt(e)'
          : this._chain.status === 'warte_freigabe' ? '⏸ Pausiert bei Schritt ' + (this._chain.index + 1) + ' (Freigabe noetig) · ' + ((this._chain.rest || []).length) + ' offen'
          : '✗ Gestoppt bei Schritt ' + (this._chain.index + 1)),
        h('div', { key: 'h', style: hint() }, 'read-Schritte liefen automatisch; der erste exec/write/ui-Schritt wartet im Tab „Freigaben".'),
      ]) : null,
      p && p.plan ? h('div', { key: 'save', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
        h('input', { key: 'nm', className: 'flow-wf-name', placeholder: 'Als Workflow speichern (Name)…', style: Object.assign({}, inputStyle(), { flex: 1 }) }),
        h('button', { key: 'sv', disabled: this._busy, onClick: () => this.saveWorkflow(),
          style: { padding: '7px 12px', borderRadius: '6px', border: '1px solid ' + GOLD, background: 'transparent', color: GOLD, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' } }, 'Speichern'),
      ]) : null,
      p && p.plan ? h('div', { key: 'ph', style: hint() }, 'Tipp: Argumente mit ${name} machen den Workflow parametrisierbar (Werte beim Abspielen).') : null,
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

  renderWorkflows() {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('div', { key: 'n', style: hint() }, 'Gespeicherte Fluesse. Abspielen laeuft durch DIESELBEN Gates (Scope + Freigabe je Wirkungsklasse).'),
      this._workflows.length ? h('div', { key: 'l', style: { display: 'flex', flexDirection: 'column', gap: '7px' } },
        this._workflows.map((wf) => h('div', { key: wf.id, style: karte() }, [
          h('div', { key: 'h', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
            h('strong', { style: { fontSize: '12px' } }, wf.name),
            h('span', { style: { fontSize: '9px', opacity: 0.5 } }, wf.schritte_n + ' Schritt(e)')]),
          ...(wf.params || []).map((p) => h('input', { key: p, className: 'flow-wfp-' + wf.id + '-' + p, placeholder: p, style: Object.assign({}, inputStyle(), { marginTop: '4px' }) })),
          h('button', { key: 'run', disabled: this._busy, onClick: () => this.runWorkflow(wf),
            style: Object.assign({}, btn(this._busy), { alignSelf: 'flex-start', marginTop: '6px' }) }, '▶ Abspielen'),
        ]))) : h('div', { key: 'e', style: hint() }, 'Noch keine Workflows. Im Tab „Plan" einen Plan erstellen und speichern.'),
      this.renderErgebnis(),
    ]);
  }

  renderSecurity() {
    const s = this._security;
    const zeile = (k, v) => h('div', { key: k, style: { display: 'flex', gap: '8px', fontSize: '11px', padding: '3px 0' } }, [
      h('span', { style: { opacity: 0.6, minWidth: '120px' } }, k), h('span', { style: { fontFamily: 'monospace' } }, v)]);
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('div', { key: 'n', style: hint() }, 'Aktive Sicherheitslage (read-only). Scope + Gate + Listen sind der Kontrakt; nur Menschen ändern sie.'),
      s ? h('div', { key: 'b', style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
        zeile('Kill-Switch', this._gestoppt ? '⛔ AKTIV (gesperrt)' : '✓ scharf (Ausfuehrung erlaubt)'),
        zeile('Datei-Scope', (s.datei_scope || []).join(', ')),
        zeile('Gate', 'read=auto · exec/write/ui=Freigabe'),
        zeile('Shell-Allowlist', (s.shell ? s.shell.allowlist_n : '?') + ' Kommandos'),
        zeile('Shell-Denylist', (s.shell ? s.shell.denylist_n : '?') + ' Muster'),
        zeile('GUI-Treiber', s.gui && s.gui.treiber_aktiv ? 'aktiv' : 'deaktiviert'),
        zeile('App-Scope', s.gui && s.gui.app_scope && s.gui.app_scope.length ? s.gui.app_scope.join(', ') : '(leer = deny-all)'),
        zeile('Tools', (s.tools || []).map((t) => t.name + '·' + t.wirkungsklasse).join('  ')),
      ]) : h('div', { key: 'e', style: hint() }, 'Keine Daten (Daemon nicht erreichbar).'),
    ]);
  }

  render() {
    const tabs = [['run', 'Ausfuehren'], ['plan', 'Plan'], ['flows', 'Workflows'], ['gate', 'Freigaben'], ['audit', 'Audit'], ['security', 'Sicherheit']];
    const body = this._tab === 'run' ? this.renderRun() : this._tab === 'plan' ? this.renderPlan()
      : this._tab === 'flows' ? this.renderWorkflows()
      : this._tab === 'security' ? this.renderSecurity()
      : this._tab === 'gate' ? this.renderGate() : this.renderAudit();
    return h('div', { style: { fontFamily: 'var(--theia-ui-font-family)', color: 'var(--theia-foreground)', fontSize: '12px', padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' } }, [
      h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--theia-panel-border)', paddingBottom: '8px', marginBottom: '10px' } }, [
        h('span', { key: 'd', style: { width: '10px', height: '10px', borderRadius: '50%', background: GOLD } }),
        h('strong', { key: 'n', style: { fontSize: '13px' } }, 'OPUS FLOW'),
        h('span', { key: 't', style: { fontSize: '11px', opacity: 0.7 } }, 'lokal · Plan → Gate → Audit'),
        h('span', { key: 'p', style: { marginLeft: 'auto', fontSize: '10px', opacity: 0.6 } }, this._pending.length ? (this._pending.length + ' offen') : ''),
        this._gestoppt
          ? h('button', { key: 'arm', disabled: this._busy, onClick: () => this.armSwitch(), title: 'Entsperren',
              style: { padding: '5px 10px', borderRadius: '6px', border: '1px solid ' + GOLD, background: 'transparent', color: GOLD, cursor: 'pointer', fontWeight: 700, fontSize: '11px' } }, 'Entsperren')
          : h('button', { key: 'kill', disabled: this._busy, onClick: () => this.killSwitch(), title: 'Kill-Switch: alles stoppen',
              style: { padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '11px' } }, '⛔ Stop'),
      ]),
      this._gestoppt ? h('div', { key: 'ks', style: { background: 'rgba(192,57,43,0.16)', border: '1px solid rgba(192,57,43,0.6)', color: '#e07a6e', borderRadius: '8px', padding: '7px 10px', marginBottom: '10px', fontSize: '11px', fontWeight: 600 } },
        '⛔ Kill-Switch AKTIV — jede Ausfuehrung ist gesperrt. „Entsperren" (oben) setzt fort.') : null,
      h('div', { key: 'tabs', style: { display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' } }, tabs.map(([id, label]) =>
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
