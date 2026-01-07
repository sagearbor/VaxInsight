export interface VaccineData {
  id: string;
  name: string;
  disease: string;
  immunityDurationYears: number; // 80 for lifelong
  immunityLabel: string; // "Lifelong", "10 Years", "6 Months"
  deathsPerMillion: number; // Historical or Unvaccinated estimate
  contagiousnessR0: number; // Basic reproduction number
  status: 'Recommended' | 'Modified' | 'Paused' | 'Revoked';
  recentChangeDescription?: string;
  sideEffectRisk: 'Low' | 'Moderate' | 'High'; // Simplified for viz
  category: 'Viral' | 'Bacterial';
}

export interface ChartPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  status: string;
  original: VaccineData;
}

export interface AnalysisResult {
  summary: string;
  sources: { title: string; uri: string }[];
  updatedDataHints?: Partial<VaccineData>[];
}
