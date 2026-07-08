// OPUS DECK — Flow-Panel DI-Wiring (WidgetFactory + View-Contribution).
// Registriert die OPUS-FLOW-View im linken Seitenbereich.
const { ContainerModule, injectable, decorate } = require('@theia/core/shared/inversify');
const {
  WidgetFactory,
  bindViewContribution,
  FrontendApplicationContribution,
  AbstractViewContribution,
} = require('@theia/core/lib/browser');
const { FlowWidget, FLOW_WIDGET_ID } = require('./flow-widget');

class FlowViewContribution extends AbstractViewContribution {
  constructor() {
    super({
      widgetId: FLOW_WIDGET_ID,
      widgetName: 'OPUS FLOW',
      defaultWidgetOptions: { area: 'left', rank: 600 },
      toggleCommandId: 'opusDeck.flow.toggle',
    });
  }
  async initializeLayout() {
    await this.openView({ activate: false, reveal: false });
  }
}
decorate(injectable(), FlowViewContribution);

module.exports = new ContainerModule((bind) => {
  bind(FlowWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: FLOW_WIDGET_ID,
      createWidget: () => ctx.container.get(FlowWidget),
    }))
    .inSingletonScope();
  bindViewContribution(bind, FlowViewContribution);
  bind(FrontendApplicationContribution).toService(FlowViewContribution);
});
