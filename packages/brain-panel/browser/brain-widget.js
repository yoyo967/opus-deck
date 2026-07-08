// OPUS DECK — Brain-Panel (B3). Custom Theia-ReactWidget fuer den Second Brain.
// Drei Flaechen gegen den OPUS-PRIME-EX-Backend (/api/brain/*):
//   Suche      — Hybrid-Retrieval ueber raw/ + wiki/ (Treffer mit Schicht, Auszug, Score)
//   Hinzufuegen — neue Raw-Notiz (append-only, sofort)
//   Freigaben  — offene Wiki-Vorschlaege: Diff ansehen + Freigeben/Ablehnen (MENSCH-Aktion)
// State liegt auf der Widget-Instanz; this.update() rendert neu (Inputs unkontrolliert).
const { injectable, decorate } = require('@theia/core/shared/inversify');
const ReactNs = require('@theia/core/shared/react');
const React = ReactNs.default || ReactNs;
const h = React.createElement;
const { ReactWidget } = require('@theia/core/lib/browser/widgets/react-widget');

const BRAIN_WIDGET_ID = 'opus-deck.brain';
const GOLD = '#C9A227';
const INK = '#111317';
const BACKEND = 'http://localhost:8848';

class BrainWidget extends ReactWidget {
  constructor() {
    super();
    this.id = BRAIN_WIDGET_ID;
    this.title.label = 'Second Brain';
    this.title.caption = 'OPUS Second Brain — geteiltes Wissen';
    this.title.iconClass = 'codicon codicon-library';
    this.title.closable = true;
    this.addClass('opus-brain-panel');
    this.node.style.overflow = 'auto';
    this._tab = 'suche';
    this._results = [];
    this._proposals = [];
    this._active = null; // geoeffneter Vorschlag inkl. Diff
    this._status = '';
    this._busy = false;
    this.update();
    this.loadProposals();
  }

  setTab(tab) {
    this._tab = tab;
    this._active = null;
    this._status = '';
    if (tab === 'freigaben') this.loadProposals();
    this.update();
  }

  async loadProposals() {
    try {
      const resp = await fetch(BACKEND + '/api/brain/proposals');
      const data = await resp.json();
      this._proposals = data.proposals || [];
    } catch (e) {
      this._status = 'Backend nicht erreichbar (' + BACKEND + ').';
    }
    this.update();
  }

  async search() {
    const input = this.node.querySelector('.brain-q');
    const query = (input && input.value || '').trim();
    if (!query) return;
    this._busy = true;
    this._status = 'Suche …';
    this.update();
    try {
      const resp = await fetch(BACKEND + '/api/brain/search?k=8&q=' + encodeURIComponent(query));
      const data = await resp.json();
      this._results = data.treffer || [];
      this._status = this._results.length ? '' : 'Keine Treffer.';
    } catch (e) {
      this._status = 'Backend nicht erreichbar (' + BACKEND + ').';
    }
    this._busy = false;
    this.update();
  }

  async openProposal(id) {
    try {
      const resp = await fetch(BACKEND + '/api/brain/proposal?id=' + encodeURIComponent(id));
      const data = await resp.json();
      if (data.fehler) { this._status = data.fehler; } else { this._active = data; this._status = ''; }
    } catch (e) {
      this._status = 'Backend nicht erreichbar.';
    }
    this.update();
  }

  async decide(id, aktion) {
    // aktion: 'approve' | 'reject' — die menschliche Review-Entscheidung.
    this._busy = true;
    this._status = aktion === 'approve' ? 'Freigeben …' : 'Ablehnen …';
    this.update();
    try {
      const resp = await fetch(BACKEND + '/api/brain/' + aktion, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }),
      });
      const data = await resp.json();
      this._status = data.fehler
        ? ('Fehler: ' + data.fehler)
        : (aktion === 'approve' ? ('Freigegeben → ' + (data.titel || id)) : 'Vorschlag abgelehnt.');
    } catch (e) {
      this._status = 'Backend nicht erreichbar.';
    }
    this._active = null;
    this._busy = false;
    await this.loadProposals();
  }

  async addRaw() {
    const titel = (this.node.querySelector('.brain-titel') || {}).value || '';
    const inhalt = (this.node.querySelector('.brain-inhalt') || {}).value || '';
    const tags = ((this.node.querySelector('.brain-tags') || {}).value || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    if (!inhalt.trim()) { this._status = 'Inhalt darf nicht leer sein.'; this.update(); return; }
    this._busy = true;
    this._status = 'Speichere …';
    this.update();
    try {
      const resp = await fetch(BACKEND + '/api/brain/add_raw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel: titel.trim() || 'Notiz', inhalt: inhalt, tags: tags }),
      });
      const data = await resp.json();
      if (data.fehler) { this._status = 'Fehler: ' + data.fehler; }
      else {
        this._status = 'Gespeichert → ' + data.id;
        ['.brain-titel', '.brain-inhalt', '.brain-tags'].forEach((s) => {
          const el = this.node.querySelector(s); if (el) el.value = '';
        });
      }
    } catch (e) {
      this._status = 'Backend nicht erreichbar.';
    }
    this._busy = false;
    this.update();
  }

  // ---- Rendering ----------------------------------------------------------
  schichtBadge(schicht) {
    const istWiki = schicht === 'wiki';
    return h('span', { style: {
      fontSize: '9px', fontWeight: 600, letterSpacing: '0.04em', padding: '1px 6px',
      borderRadius: '999px', textTransform: 'uppercase',
      background: istWiki ? 'rgba(201,162,39,0.18)' : 'var(--theia-badge-background)',
      color: istWiki ? GOLD : 'var(--theia-badge-foreground)',
    } }, schicht || 'raw');
  }

  renderTreffer(t, i) {
    return h('div', { key: i, style: {
      border: '1px solid var(--theia-panel-border)', borderRadius: '8px', padding: '9px 11px',
      background: 'var(--theia-editorWidget-background)', fontSize: '12px', lineHeight: '1.45',
    } }, [
      h('div', { key: 'top', style: { display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' } }, [
        this.schichtBadge(t.schicht),
        h('strong', { key: 'ti', style: { fontSize: '12px' } }, t.titel),
        h('span', { key: 'sc', style: { marginLeft: 'auto', fontSize: '9px', opacity: 0.5 } },
          'score ' + (typeof t.score === 'number' ? t.score.toFixed(1) : t.score)),
      ]),
      h('div', { key: 'au', style: { fontSize: '11px', opacity: 0.75, whiteSpace: 'pre-wrap' } }, t.auszug || ''),
      h('div', { key: 'id', style: { fontSize: '9px', opacity: 0.4, marginTop: '4px' } }, t.id),
    ]);
  }

  renderDiff(diff) {
    const zeilen = (diff || '').split('\n');
    return h('pre', { style: {
      margin: 0, padding: '10px', borderRadius: '8px', background: 'var(--theia-editor-background)',
      fontFamily: 'var(--theia-editor-font-family, monospace)', fontSize: '11px', lineHeight: '1.5',
      overflowX: 'auto', border: '1px solid var(--theia-panel-border)',
    } }, zeilen.map((z, i) => {
      let col = 'var(--theia-foreground)'; let bg = 'transparent';
      if (z.startsWith('+') && !z.startsWith('+++')) { col = '#6cc07a'; bg = 'rgba(108,192,122,0.08)'; }
      else if (z.startsWith('-') && !z.startsWith('---')) { col = '#dc7070'; bg = 'rgba(220,112,112,0.08)'; }
      else if (z.startsWith('@@')) { col = GOLD; }
      else if (z.startsWith('+++') || z.startsWith('---')) { col = 'var(--theia-descriptionForeground)'; }
      return h('div', { key: i, style: { color: col, background: bg, whiteSpace: 'pre-wrap' } }, z || ' ');
    }));
  }

  renderSuche() {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '9px' } }, [
      h('div', { key: 'row', style: { display: 'flex', gap: '6px' } }, [
        h('input', { key: 'q', className: 'brain-q', placeholder: 'Wissen durchsuchen (raw + wiki) …',
          disabled: this._busy, onKeyDown: (e) => { if (e.key === 'Enter') this.search(); },
          style: inputStyle(1) }),
        h('button', { key: 'b', disabled: this._busy, onClick: () => this.search(), style: btnStyle(this._busy) },
          this._busy ? '…' : 'Suchen'),
      ]),
      h('div', { key: 'res', style: { display: 'flex', flexDirection: 'column', gap: '7px' } },
        this._results.length ? this._results.map((t, i) => this.renderTreffer(t, i))
          : [h('div', { key: 'e', style: hint() },
              'Frag den Brain — z. B. „nächste Bau-Stufe im Masterplan" oder „A5 Compliance Gaps".')]),
    ]);
  }

  renderAdd() {
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('div', { key: 'note', style: hint() }, 'Neue Raw-Notiz — append-only, sofort durchsuchbar. Wiki-Seiten entstehen als Vorschlag (Freigaben-Tab).'),
      h('input', { key: 'ti', className: 'brain-titel', placeholder: 'Titel', style: inputStyle() }),
      h('textarea', { key: 'in', className: 'brain-inhalt', placeholder: 'Inhalt (Markdown) …', rows: 7,
        style: Object.assign({}, inputStyle(), { resize: 'vertical', fontFamily: 'var(--theia-editor-font-family, monospace)' }) }),
      h('input', { key: 'tg', className: 'brain-tags', placeholder: 'Tags, kommagetrennt (optional)', style: inputStyle() }),
      h('button', { key: 'sv', disabled: this._busy, onClick: () => this.addRaw(),
        style: Object.assign({}, btnStyle(this._busy), { alignSelf: 'flex-start' }) },
        this._busy ? '…' : 'Als Raw speichern'),
    ]);
  }

  renderFreigaben() {
    if (this._active) {
      const p = this._active;
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, [
        h('button', { key: 'bk', onClick: () => { this._active = null; this.update(); },
          style: { alignSelf: 'flex-start', background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: '11px', padding: 0 } },
          '← zurück zur Liste'),
        h('div', { key: 'hd' }, [
          h('div', { key: 't', style: { fontSize: '13px', fontWeight: 600 } }, p.titel),
          h('div', { key: 'z', style: { fontSize: '10px', opacity: 0.6, marginTop: '2px' } }, 'Ziel: ' + p.ziel),
        ]),
        h('div', { key: 'lbl', style: { fontSize: '10px', opacity: 0.6 } }, 'Diff gegen aktuelle Seite'),
        h('div', { key: 'df' }, this.renderDiff(p.diff)),
        h('div', { key: 'act', style: { display: 'flex', gap: '8px' } }, [
          h('button', { key: 'ap', disabled: this._busy, onClick: () => this.decide(p.id, 'approve'), style: btnStyle(this._busy) },
            'Freigeben'),
          h('button', { key: 'rj', disabled: this._busy, onClick: () => this.decide(p.id, 'reject'),
            style: { padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(220,112,112,0.6)', background: 'transparent', color: '#dc7070', cursor: this._busy ? 'default' : 'pointer', fontWeight: 600 } },
            'Ablehnen'),
        ]),
      ]);
    }
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
      h('div', { key: 'note', style: hint() }, 'Agenten schlagen Wiki-Seiten vor — du entscheidest. Das Review-Gate ist vom Agenten nicht umgehbar.'),
      this._proposals.length
        ? h('div', { key: 'ls', style: { display: 'flex', flexDirection: 'column', gap: '7px' } },
            this._proposals.map((p, i) => h('div', { key: i, onClick: () => this.openProposal(p.id),
              style: { border: '1px solid var(--theia-panel-border)', borderRadius: '8px', padding: '9px 11px', cursor: 'pointer', background: 'var(--theia-editorWidget-background)' } }, [
              h('div', { key: 't', style: { fontSize: '12px', fontWeight: 600 } }, p.titel),
              h('div', { key: 'z', style: { fontSize: '10px', opacity: 0.6, marginTop: '2px' } }, p.ziel + '  ·  ' + (p.wer || 'agent')),
            ])))
        : h('div', { key: 'empty', style: hint() }, 'Keine offenen Vorschläge.'),
    ]);
  }

  render() {
    const tabs = [['suche', 'Suche'], ['add', 'Hinzufügen'], ['freigaben', 'Freigaben']];
    const body = this._tab === 'suche' ? this.renderSuche() : this._tab === 'add' ? this.renderAdd() : this.renderFreigaben();
    return h('div', { style: { fontFamily: 'var(--theia-ui-font-family)', color: 'var(--theia-foreground)', fontSize: '12px', padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' } }, [
      h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--theia-panel-border)', paddingBottom: '8px', marginBottom: '10px' } }, [
        h('span', { key: 'dot', style: { width: '10px', height: '10px', borderRadius: '50%', background: GOLD } }),
        h('strong', { key: 'nm', style: { fontSize: '13px' } }, 'Second Brain'),
        h('span', { key: 'tg', style: { fontSize: '11px', opacity: 0.7 } }, 'raw → wiki · geteilt'),
        h('span', { key: 'cnt', style: { marginLeft: 'auto', fontSize: '10px', opacity: 0.6 } },
          this._proposals.length ? (this._proposals.length + ' offen') : ''),
      ]),
      h('div', { key: 'tabs', style: { display: 'flex', gap: '4px', marginBottom: '10px' } },
        tabs.map(([id, label]) => h('button', { key: id, onClick: () => this.setTab(id),
          style: { flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
            border: '1px solid ' + (this._tab === id ? GOLD : 'var(--theia-panel-border)'),
            background: this._tab === id ? 'rgba(201,162,39,0.14)' : 'transparent',
            color: this._tab === id ? GOLD : 'var(--theia-foreground)', fontWeight: this._tab === id ? 600 : 400 } },
          label + (id === 'freigaben' && this._proposals.length ? ' (' + this._proposals.length + ')' : ''))),
      ),
      h('div', { key: 'body', style: { flex: 1, overflowY: 'auto' } }, body),
      this._status ? h('div', { key: 'st', style: { fontSize: '10px', opacity: 0.65, marginTop: '8px', borderTop: '1px solid var(--theia-panel-border)', paddingTop: '6px' } }, this._status) : null,
    ]);
  }
}

function inputStyle(flex) {
  const s = { padding: '8px', borderRadius: '6px', border: '1px solid var(--theia-input-border)',
    background: 'var(--theia-input-background)', color: 'var(--theia-input-foreground)', fontSize: '12px' };
  if (flex) s.flex = flex;
  return s;
}
function btnStyle(busy) {
  return { padding: '8px 12px', borderRadius: '6px', border: 'none', background: busy ? '#7a6a2e' : GOLD,
    color: INK, fontWeight: 600, cursor: busy ? 'default' : 'pointer' };
}
function hint() {
  return { fontSize: '11px', opacity: 0.55, lineHeight: 1.5 };
}

decorate(injectable(), BrainWidget);
module.exports = { BrainWidget, BRAIN_WIDGET_ID };
