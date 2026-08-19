// backend/src/plugins/tracing.ts
// OpenTelemetry tracing plugin (simplified - metrics only via Prometheus)

import { FastifyPluginAsync } from 'fastify';

export const tracingPlugin: FastifyPluginAsync = async (app) => {
  // Tracing disabled for Phase 1 - can be enabled with OTLP exporter later
  // For now, metrics are handled by /metrics endpoint
  app.log.info('Tracing plugin loaded (disabled for Phase 1)');
};

export default tracingPlugin;