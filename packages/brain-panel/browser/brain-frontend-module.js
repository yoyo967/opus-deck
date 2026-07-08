// OPUS DECK — Brain-Panel DI-Wiring (WidgetFactory + View-Contribution).
// Registriert die Second-Brain-View im linken Seitenbereich und dockt sie beim Start an.
const { ContainerModule, injectable, decorate } = require('@theia/core/shared/inversify');
const {
  WidgetFactory,
  bindViewContribution,
  FrontendApplicationContribution,
  AbstractViewContribution,
} = require('@theia/core/lib/browser');
const { BrainWidget, BRAIN_WIDGET_ID } = require('./brain-widget');

class BrainViewContribution extends AbstractViewContribution {
  constructor() {
    super({
      widgetId: BRAIN_WIDGET_ID,
      widgetName: 'Second Brain',
      defaultWidgetOptions: { area: 'left', rank: 500 },
      toggleCommandId: 'opusDeck.brain.toggle',
    });
  }
  // Robuste Auto-Sichtbarkeit: EINMALIG einblenden (auch nach Layout-Restore), danach
  // Nutzerwahl respektieren. Pro-View-Marker -> kein Race, kein Aufzwingen.
  async onDidInitializeLayout() {
    const key = 'opusDeck.seen.' + BRAIN_WIDGET_ID;
    try { if (localStorage.getItem(key)) return; } catch (e) { /* localStorage evtl. blockiert */ }
    await this.openView({ activate: false, reveal: false });
    try { localStorage.setItem(key, '1'); } catch (e) { /* egal */ }
  }
}
decorate(injectable(), BrainViewContribution);

module.exports = new ContainerModule((bind) => {
  bind(BrainWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: BRAIN_WIDGET_ID,
      createWidget: () => ctx.container.get(BrainWidget),
    }))
    .inSingletonScope();
  bindViewContribution(bind, BrainViewContribution);
  bind(FrontendApplicationContribution).toService(BrainViewContribution);
});
