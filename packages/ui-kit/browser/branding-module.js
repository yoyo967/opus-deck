// OPUS DECK — Marken-Branding (Theia-Frontend-Extension).
// Setzt die Marken-Farbpalette (near-black + Opus-Gold-Akzent) als CSS-Variablen mit
// 'important' auf documentElement — ueberschreibt auch von Theia gesetzte Inline-Styles.
// Erste Stufe des Design-Systems (WI-0.3); waechst spaeter zu Design-Tokens + Voll-Theme.
const { ContainerModule } = require('@theia/core/shared/inversify');
const { FrontendApplicationContribution } = require('@theia/core/lib/browser');

const GOLD = '#C9A227';
const INK = '#111317';

// Theia-Farb-IDs -> Wert. Variablenname = '--theia-' + id (mit '-' statt '.').
const BRAND_COLORS = {
  'statusBar-background': GOLD,
  'statusBar-foreground': INK,
  'statusBar-noFolderBackground': GOLD,
  'statusBar-noFolderForeground': INK,
  'statusBar-borderColor': GOLD,
  'activityBar-foreground': GOLD,
  'activityBar-activeBorder': GOLD,
  'focusBorder': GOLD,
  'progressBar-background': GOLD,
  'button-background': GOLD,
  'button-foreground': INK,
};

class OpusBrandingContribution {
  applyBrand() {
    const root = document.documentElement;
    for (const id in BRAND_COLORS) {
      const varName = '--theia-' + id;
      // Nur setzen, wenn abweichend -> verhindert Endlosschleife mit dem Observer.
      if (root.style.getPropertyValue(varName) !== BRAND_COLORS[id]) {
        root.style.setProperty(varName, BRAND_COLORS[id], 'important');
      }
    }
  }
  onStart() {
    this.applyBrand();
    // Falls Theia das Theme spaeter (neu) anwendet, Marke erneut durchsetzen.
    if (typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(() => this.applyBrand());
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
      obs.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }
}

module.exports = new ContainerModule((bind) => {
  bind(OpusBrandingContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(OpusBrandingContribution);
});
