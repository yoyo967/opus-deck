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
  // Robuste Auto-Sichtbarkeit: neue View EINMALIG einblenden — auch wenn Theia ein altes
  // (die View noch nicht kennendes) Layout wiederherstellt. onDidInitializeLayout laeuft immer;
  // ein Pro-View-"gesehen"-Marker verhindert Aufzwingen nach dem ersten Mal (Nutzerwahl bleibt).
  async onDidInitializeLayout() {
    const key = 'opusDeck.seen.' + AGENT_WIDGET_ID;
    try { if (localStorage.getItem(key)) return; } catch (e) { /* localStorage evtl. blockiert */ }
    await this.openView({ activate: false, reveal: true });
    try { localStorage.setItem(key, '1'); } catch (e) { /* egal */ }
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
