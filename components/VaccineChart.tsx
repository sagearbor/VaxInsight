import React from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BubbleController,
  Title
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';
import { VaccineData } from '../types';

// Register ChartJS components locally
ChartJS.register(LinearScale, PointElement, Tooltip, Legend, BubbleController, Title);

interface VaccineChartProps {
  data: VaccineData[];
  yAxisMode: 'deaths' | 'r0';
}

export const VaccineChart: React.FC<VaccineChartProps> = ({ data, yAxisMode }) => {
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
        borderColor: 'rgba(71, 85, 105, 0.9)',
        borderWidth: 1
      },
      {
        label: 'Modified / Other',
        data: data.filter(d => d.status !== 'Recommended').map(d => ({
          x: d.immunityDurationYears,
          y: yAxisMode === 'deaths' ? d.deathsPerMillion : d.contagiousnessR0,
          r: calculateRadius(d, yAxisMode),
          original: d
        })),
        backgroundColor: 'rgba(234, 88, 12, 0.6)', // Orange-600
        borderColor: 'rgba(234, 88, 12, 0.9)',
        borderWidth: 1
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
      <div className="relative w-full h-[90%]">
        <Bubble data={chartData} options={options} />
      </div>
       <div className="absolute bottom-6 right-6 text-xs text-slate-400 bg-white/90 p-2 rounded pointer-events-none border border-slate-100 shadow-sm z-10">
          Bubble Size = {yAxisMode === 'deaths' ? 'Contagiousness (R0)' : 'Mortality Rate'}
      </div>
    </div>
  );
};