// OPUS DECK — Agent-Panel DI-Wiring (WidgetFactory + View-Contribution).
// Registriert die Agent-View im rechten Seitenbereich und oeffnet sie beim Start.
const { ContainerModule, injectable, decorate } = require('@theia/core/shared/inversify');
const {
  WidgetFactory,
  bindViewContribution,
  FrontendApplicationContribution,
  AbstractViewContribution,
} = require('@theia/core/lib/browser');
const { AgentWidget, AGENT_WIDGET_ID } = require('./agent-widget');

class AgentViewContribution extends AbstractViewContribution {
  constructor() {
    super({
      widgetId: AGENT_WIDGET_ID,
      widgetName: 'Agent',
      defaultWidgetOptions: { area: 'right', rank: 100 },
      toggleCommandId: 'opusDeck.agent.toggle',
    });
  }
  // Default-Layout: Agent-View rechts sichtbar andocken (korrekter Theia-Hook).
  async initializeLayout() {
    await this.openView({ activate: true, reveal: true });
  }
}
decorate(injectable(), AgentViewContribution);

module.exports = new ContainerModule((bind) => {
  bind(AgentWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue((ctx) => ({
      id: AGENT_WIDGET_ID,
      createWidget: () => ctx.container.get(AgentWidget),
    }))
    .inSingletonScope();
  bindViewContribution(bind, AgentViewContribution);
  bind(FrontendApplicationContribution).toService(AgentViewContribution);
});
