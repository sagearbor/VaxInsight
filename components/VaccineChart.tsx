import React, { useId } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  LogarithmicScale,
  PointElement,
  Tooltip,
  Legend,
  BubbleController,
  Title,
  Plugin
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';
import { VaccineData } from '../types';

// Register ChartJS components locally
ChartJS.register(LinearScale, LogarithmicScale, PointElement, Tooltip, Legend, BubbleController, Title);

// Ensure charts are destroyed properly on re-render
ChartJS.defaults.datasets.bubble.clip = false;

// ============================================
// Helper Functions
// ============================================

function willIncreaseUsage(description: string): boolean {
  const lower = description.toLowerCase();
  // Keywords indicating increased vaccine usage/recommendation
  return /\b(increase|increased|increasing|rising|risen|higher|growing|expanded|uptick|mandate|mandated|required|universal|broadened|strengthened|reinstated)\b/.test(lower);
}

function willDecreaseUsage(description: string): boolean {
  const lower = description.toLowerCase();
  // Keywords indicating decreased vaccine usage/recommendation
  return /\b(decrease|decreased|decreasing|falling|fallen|lower|reduced|paused|revoked|removed|restricted|optional|voluntary|no longer|eliminated|dropped|suspended|shifted|high-risk only|limited|narrowed|scaled back|rolled back|discontinued)\b/.test(lower);
}

// Helper to check if a vaccine has recent changes (checks both recentChangeDescription and status)
function hasRecentChange(vaccine: VaccineData): boolean {
  if (vaccine.recentChangeDescription) return true;
  // Fallback: check if status contains description text (AI formatting issue)
  if (vaccine.status && vaccine.status.length > 15) return true;
  return false;
}

// Get the description to analyze for increase/decrease
function getChangeDescription(vaccine: VaccineData): string {
  if (vaccine.recentChangeDescription) return vaccine.recentChangeDescription;
  // Fallback: use status if it contains description text
  if (vaccine.status && vaccine.status.length > 15) return vaccine.status;
  return '';
}

// ============================================
// Background Zone Plugin
// ============================================

const backgroundZonePlugin: Plugin<'bubble'> = {
  id: 'backgroundZone',
  beforeDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const xScale = chart.scales['x'];
    const yScale = chart.scales['y'];

    // Zone thresholds (in data coordinates)
    const xThreshold = 10;  // 10 years immunity
    const yThreshold = 500; // 500 deaths per million

    // Convert data coordinates to pixel coordinates
    const xPixel = xScale.getPixelForValue(xThreshold);
    const yPixel = yScale.getPixelForValue(yThreshold);

    ctx.save();

    // Clip to chart area
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.clip();

    // Draw light red background for entire chart area first
    ctx.fillStyle = 'rgba(254, 202, 202, 0.3)'; // red-200 with low opacity
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);

    // Draw light green background for "safe zone" (bottom-left: low deaths, short immunity)
    // Bottom-left means: x < 20 years AND y < 500 deaths (which is BELOW yPixel since y-axis is inverted on canvas)
    ctx.fillStyle = 'rgba(187, 247, 208, 0.4)'; // green-200 with low opacity
    const greenWidth = Math.max(0, xPixel - chartArea.left);
    const greenHeight = Math.max(0, chartArea.bottom - yPixel);
    if (greenWidth > 0 && greenHeight > 0) {
      ctx.fillRect(chartArea.left, yPixel, greenWidth, greenHeight);
    }

    // Add zone labels
    ctx.font = 'bold 14px sans-serif';

    // Green zone label (bottom-left corner)
    if (greenWidth > 50 && greenHeight > 30) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(22, 101, 52, 0.6)'; // darker green
      ctx.fillText('Lower Risk', chartArea.left + 12, chartArea.bottom - 12);
    }

    // Red zone label (top-right area)
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(153, 27, 27, 0.5)'; // darker red
    ctx.fillText('Higher Risk', chartArea.right - 12, chartArea.top + 12);

    ctx.restore();
  }
};

// ============================================
// End Background Zone Plugin
// ============================================

// ============================================
// Bubble Label Plugin
// ============================================

const bubbleLabelPlugin: Plugin<'bubble'> = {
  id: 'bubbleLabels',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();

    // Configure text styling
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#374151'; // gray-700 for good readability
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Draw labels for all datasets
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((element: any, pointIndex) => {
        const dataPoint = dataset.data[pointIndex] as { x: number; y: number; r: number; original?: VaccineData };
        const vaccine = dataPoint?.original;

        if (!vaccine) return;

        // Get the current position (accounting for animation)
        const { x, y } = element.getCenterPoint();
        const radius = element.options?.radius || 10;

        // Use abbreviated vaccine name for cleaner display
        const name = getAbbreviatedName(vaccine.name);

        // Position label below the bubble with some padding
        const labelY = y + radius + 4;

        // Draw a semi-transparent background for better readability
        ctx.textAlign = 'center';
        const textMetrics = ctx.measureText(name);
        const padding = 2;
        const bgX = x - textMetrics.width / 2 - padding;
        const bgY = labelY - padding;
        const bgWidth = textMetrics.width + padding * 2;
        const bgHeight = 13; // Approximate text height + padding

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

        // Draw the text
        ctx.fillStyle = '#374151';
        ctx.fillText(name, x, labelY);
      });
    });

    ctx.restore();
  }
};

/**
 * Returns an abbreviated version of vaccine name for label display
 */
function getAbbreviatedName(fullName: string): string {
  // Common abbreviations to keep short and readable
  const abbreviations: { [key: string]: string } = {
    'Measles, Mumps, Rubella': 'MMR',
    'Diphtheria, Tetanus, Pertussis': 'DTaP',
    'Tetanus, Diphtheria': 'Td',
    'Haemophilus influenzae type b': 'Hib',
    'Hepatitis A': 'Hep A',
    'Hepatitis B': 'Hep B',
    'Human Papillomavirus': 'HPV',
    'Inactivated Poliovirus': 'IPV',
    'Pneumococcal': 'PCV',
    'Varicella': 'Varicella',
    'Influenza': 'Flu',
    'Meningococcal': 'MenACWY',
    'Rotavirus': 'RV',
    'COVID-19': 'COVID-19'
  };

  // Check if we have a specific abbreviation
  if (abbreviations[fullName]) {
    return abbreviations[fullName];
  }

  // If name is short enough, return as-is
  if (fullName.length <= 12) {
    return fullName;
  }

  // Otherwise, truncate with ellipsis
  return fullName.substring(0, 10) + '...';
}

// ============================================
// End Bubble Label Plugin
// ============================================

interface VaccineChartProps {
  data: VaccineData[];
  yAxisMode: 'deaths' | 'r0';
}

export const VaccineChart: React.FC<VaccineChartProps> = ({ data, yAxisMode }) => {
  const chartId = useId();

  const chartData = {
    datasets: [
      {
        label: 'Recommended Vaccines',
        data: data.filter(d => d.status === 'Recommended').map(d => ({
          x: d.immunityDurationYears,
          y: yAxisMode === 'deaths' ? d.deathsPerMillion : d.contagiousnessR0,
          r: calculateRadius(d, yAxisMode),
          original: d
        })),
        backgroundColor: 'rgba(71, 85, 105, 0.6)', // Slate-600
        borderColor: (context: any) => {
          const dataPoint = context.dataset.data[context.dataIndex];
          const vaccine = dataPoint?.original as VaccineData;
          if (vaccine && hasRecentChange(vaccine)) {
            const desc = getChangeDescription(vaccine);
            if (willIncreaseUsage(desc)) return '#10b981'; // Green = increase usage
            // Default to red for any change that isn't clearly an increase
            return '#ef4444'; // Red = decrease usage or any change
          }
          return 'rgba(71, 85, 105, 0.9)'; // Default slate
        },
        borderWidth: (context: any) => {
          const dataPoint = context.dataset.data[context.dataIndex];
          const vaccine = dataPoint?.original as VaccineData;
          if (vaccine && hasRecentChange(vaccine)) {
            return 8; // Thicker for changes
          }
          return 5; // Default width (thicker)
        }
      },
      {
        label: 'Modified / Other',
        data: data.filter(d => d.status !== 'Recommended').map(d => ({
          x: d.immunityDurationYears,
          y: yAxisMode === 'deaths' ? d.deathsPerMillion : d.contagiousnessR0,
          r: calculateRadius(d, yAxisMode),
          original: d
        })),
        backgroundColor: 'rgba(234, 88, 12, 0.7)', // Orange-600
        borderColor: (context: any) => {
          const dataPoint = context.dataset.data[context.dataIndex];
          const vaccine = dataPoint?.original as VaccineData;
          if (vaccine && hasRecentChange(vaccine)) {
            const desc = getChangeDescription(vaccine);
            if (willIncreaseUsage(desc)) return '#10b981'; // Green = increase usage
            // Default to red for any change that isn't clearly an increase
            return '#ef4444'; // Red = decrease usage or any change
          }
          return 'transparent'; // No border for unmodified
        },
        borderWidth: (context: any) => {
          const dataPoint = context.dataset.data[context.dataIndex];
          const vaccine = dataPoint?.original as VaccineData;
          if (vaccine && hasRecentChange(vaccine)) {
            return 8; // Thicker for changes
          }
          return 0; // No border for unmodified
        }
      }
    ]
  };

  function calculateRadius(d: VaccineData, mode: 'deaths' | 'r0') {
    // Determine bubble size based on the OTHER metric
    // If Y-Axis is Deaths, Size is R0. If Y-Axis is R0, Size is Deaths.
    const val = mode === 'deaths' ? d.contagiousnessR0 : d.deathsPerMillion;
    
    // Scale logically for visibility
    if (mode === 'deaths') {
        // R0 ranges 0-18 usually. 
        return Math.max(8, val * 3);
    } else {
        // Deaths range 0-5000+. Log scale down.
        return Math.max(8, Math.log(val + 1) * 3);
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Immunity Duration (Years)'
        },
        min: 0,
        max: 90,
        grid: {
             color: '#f1f5f9'
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisMode === 'deaths' ? 'Deaths per Million (Log Scale)' : 'Contagiousness (R0)'
        },
        type: yAxisMode === 'deaths' ? 'logarithmic' as const : 'linear' as const,
        min: yAxisMode === 'deaths' ? 1 : 0,
        grid: {
             color: '#f1f5f9'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const d = context.raw.original as VaccineData;
            return [
                ` ${d.name}`,
                ` Status: ${d.status}`,
                ` Immunity: ${d.immunityLabel}`,
                ` Deaths/1M: ${d.deathsPerMillion}`,
                ` R0: ${d.contagiousnessR0}`,
                d.recentChangeDescription ? ` Note: ${d.recentChangeDescription}` : ''
            ].filter(Boolean);
          }
        }
      }
    }
  };

  return (
    <div className="w-full h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative">
       <h3 className="text-lg font-bold text-slate-700 mb-2 px-4">
        Vaccine Strategy Matrix
      </h3>
      <div className="relative w-full h-[85%]">
        <Bubble key={chartId} id={chartId} data={chartData} options={options} plugins={[backgroundZonePlugin, bubbleLabelPlugin]} />
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-500 border-[3px] border-slate-700"></span>
          <span>Recommended</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-orange-500"></span>
          <span>Modified / Other</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-orange-500 border-[3px] border-green-500"></span>
          <span>Lower Risk Vaccine Change</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-orange-500 border-[3px] border-red-500"></span>
          <span>Higher Risk Vaccine Change</span>
        </div>
      </div>
       <div className="absolute bottom-16 right-6 text-xs text-slate-400 bg-white/90 p-2 rounded pointer-events-none border border-slate-100 shadow-sm z-10">
          Bubble Size = {yAxisMode === 'deaths' ? 'Contagiousness (R0)' : 'Mortality Rate'}
      </div>
    </div>
  );
};