// backend/src/plugins/tracing.ts
// OpenTelemetry tracing plugin

import { FastifyPluginAsync } from 'fastify';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

export const tracingPlugin: FastifyPluginAsync = async (app) => {
  const sdk = new NodeSDK({
    traceExporter: new PrometheusExporter({ port: 9464 }),
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: 'asset-mt-backend',
  });

  sdk.start();

  app.addHook('onClose', async () => {
    await sdk.shutdown();
  });
};

export default tracingPlugin;