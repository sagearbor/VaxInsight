import { VaccineData } from './types';

// Baseline data based on historical CDC/WHO data. 
// "deathsPerMillion" is approximate for unvaccinated populations in developed nations historically.
// "R0" is contagiousness.
export const INITIAL_VACCINE_DATA: VaccineData[] = [
  {
    id: 'measles',
    name: 'MMR (Measles)',
    disease: 'Measles',
    immunityDurationYears: 80,
    immunityLabel: 'Lifelong',
    deathsPerMillion: 2000, // Historical ~0.2% CFR in developed world, higher elsewhere
    contagiousnessR0: 15, // Extremely high
    status: 'Recommended',
    sideEffectRisk: 'Low',
    category: 'Viral'
  },
  {
    id: 'polio',
    name: 'IPV (Polio)',
    disease: 'Polio',
    immunityDurationYears: 80,
    immunityLabel: 'Lifelong',
    deathsPerMillion: 500, // Paralytic polio rate + death
    contagiousnessR0: 6,
    status: 'Recommended',
    sideEffectRisk: 'Low',
    category: 'Viral'
  },
  {
    id: 'flu',
    name: 'Influenza',
    disease: 'Influenza',
    immunityDurationYears: 0.8,
    immunityLabel: '6-12 Months',
    deathsPerMillion: 15, // Varies wildly by strain/year
    contagiousnessR0: 1.5,
    status: 'Modified', // Changed to show color contrast in UI
    recentChangeDescription: 'Annual strain updates required; recommendations vary by season.',
    sideEffectRisk: 'Low',
    category: 'Viral'
  },
  {
    id: 'dtap-d',
    name: 'DTaP (Diphtheria)',
    disease: 'Diphtheria',
    immunityDurationYears: 10,
    immunityLabel: '10 Years',
    deathsPerMillion: 5000, // ~5-10% CFR
    contagiousnessR0: 2.6,
    status: 'Recommended',
    sideEffectRisk: 'Low',
    category: 'Bacterial'
  },
  {
    id: 'dtap-t',
    name: 'DTaP (Tetanus)',
    disease: 'Tetanus',
    immunityDurationYears: 10,
    immunityLabel: '10 Years',
    deathsPerMillion: 15000, // Very high if untreated (>10%)
    contagiousnessR0: 0, // Not contagious
    status: 'Recommended',
    sideEffectRisk: 'Low',
    category: 'Bacterial'
  },
  {
    id: 'pertussis',
    name: 'DTaP (Pertussis)',
    disease: 'Whooping Cough',
    immunityDurationYears: 5,
    immunityLabel: '3-5 Years',
    deathsPerMillion: 200, // High for infants
    contagiousnessR0: 5.5, // Highly contagious
    status: 'Recommended',
    sideEffectRisk: 'Moderate', // Soreness common
    category: 'Bacterial'
  },
  {
    id: 'covid',
    name: 'COVID-19',
    disease: 'COVID-19',
    immunityDurationYears: 0.5,
    immunityLabel: '4-6 Months',
    deathsPerMillion: 100, // Varies by age heavily
    contagiousnessR0: 9, // Omicron variants
    status: 'Modified', // Changed to show color contrast in UI
    recentChangeDescription: 'Shifted to seasonal recommendation for high-risk groups.',
    sideEffectRisk: 'Moderate', // Reactogenicity
    category: 'Viral'
  },
  {
    id: 'varicella',
    name: 'Varicella',
    disease: 'Chickenpox',
    immunityDurationYears: 80,
    immunityLabel: 'Lifelong',
    deathsPerMillion: 20,
    contagiousnessR0: 11,
    status: 'Recommended',
    sideEffectRisk: 'Low',
    category: 'Viral'
  },
  {
    id: 'hpv',
    name: 'HPV',
    disease: 'Human Papillomavirus',
    immunityDurationYears: 30, // Long term
    immunityLabel: 'Decades/Life',
    deathsPerMillion: 40, // Cancer risk
    contagiousnessR0: 2,
    status: 'Recommended',
    sideEffectRisk: 'Low',
    category: 'Viral'
  }
];

export const MOCK_ANALYSIS = `
### Analysis of Vaccine Guidelines

Recent discussions have centered on the trade-offs between lifelong immunity mandates and short-term boosters.

*   **Lifelong Protectors:** Vaccines like MMR and Polio provide high "Return on Investment" for public health. They stop highly contagious diseases (High R0) with a "one-and-done" or minimal booster series.
*   **Short-term Protectors:** Flu and COVID-19 vaccines require frequent updates due to viral mutation. The debate often centers on whether mandating these is effective compared to targeted protection for vulnerable groups.

**Visual Interpretation:**
The dashboard highlights that "modified" statuses often correlate with vaccines that have shorter immunity durations or lower historical mortality rates in children, whereas "Lifelong" vaccines generally remain strictly recommended due to the high risk of resurgence.
`;
