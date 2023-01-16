import { Counter, Registry } from 'prom-client';

export const register = new Registry();

export const durationOfIlluminationMetric = new Counter({
  name: 'duration_of_illumination_total_seconds',
  help: 'Duration of illumination',
  registers: [register],
  labelNames: ['name'],
});
