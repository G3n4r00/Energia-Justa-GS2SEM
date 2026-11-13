import type { Appliance, AppliancePayload, ConsumptionSummary, HouseholdConfig, Plan, SensorReading, SensorReadingPayload, Tariff } from '../types';

// 10.0.2.2 é o loopback do host no emulador Android.
// Para dispositivo físico, defina EXPO_PUBLIC_API_URL com o IP da máquina.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getConsumptionSummary: () =>
    request<ConsumptionSummary>('/consumption/summary'),

  getAppliances: () =>
    request<Appliance[]>('/appliances'),

  createAppliance: (data: AppliancePayload) =>
    request<Appliance>('/appliances', { method: 'POST', body: JSON.stringify(data) }),

  updateAppliance: (id: number, data: Partial<AppliancePayload>) =>
    request<Appliance>(`/appliances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAppliance: (id: number) =>
    request<void>(`/appliances/${id}`, { method: 'DELETE' }),

  getConfig: () =>
    request<HouseholdConfig>('/config'),

  updateConfig: (data: { budget_brl?: number; cycle_days?: number }) =>
    request<HouseholdConfig>('/config', { method: 'PUT', body: JSON.stringify(data) }),

  getActiveTariff: () =>
    request<Tariff>('/tariffs/active'),

  createSensorReading: (data: SensorReadingPayload) =>
    request<SensorReading>('/sensors/readings', { method: 'POST', body: JSON.stringify(data) }),

  getSensorReadings: (limit = 20) =>
    request<SensorReading[]>(`/sensors/readings?limit=${limit}`),

  createPlan: (target_brl?: number) =>
    request<Plan>('/plans', {
      method: 'POST',
      body: JSON.stringify(target_brl !== undefined ? { target_brl } : {}),
    }),

  getLastPlan: () =>
    request<Plan[]>('/plans').then(plans => plans[0] ?? null),
};
