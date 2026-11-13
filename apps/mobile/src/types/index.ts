export type Appliance = {
  id: number;
  name: string;
  power_w: number;
  daily_hours: number;
  is_protected: boolean;
  is_active: boolean;
  category: string;
};

export type AppliancePayload = {
  name: string;
  power_w: number;
  daily_hours: number;
  is_protected: boolean;
  is_active?: boolean;
  category?: string;
};

export type HouseholdConfig = {
  id: number;
  budget_brl: number;
  cycle_days: number;
};

export type ConsumptionItem = {
  id: number;
  name: string;
  kwh: number;
  brl: number;
  pct_of_total: number;
};

export type ConsumptionSummary = {
  total_kwh: number;
  total_brl: number;
  budget_brl: number;
  cycle_days: number;
  tariff_rate_brl_kwh: number;
  tariff_is_demo: boolean;
  items: ConsumptionItem[];
};
