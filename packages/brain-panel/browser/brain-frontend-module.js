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
  // Default-Layout: Brain-View links andocken, ohne den Fokus vom Agenten zu stehlen.
  async initializeLayout() {
    await this.openView({ activate: false, reveal: false });
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
