import React from 'react';
import { VaccineData } from '../types';
import { Download } from 'lucide-react';

interface DataTableProps {
  data: VaccineData[];
}

// Helper to get clean status (truncate if AI put too much text in it)
const getCleanStatus = (status: string): string => {
  if (!status) return 'Unknown';
  // If status is too long or contains extra text, extract just the first word
  if (status.length > 15 || status.includes(',') || status.includes('.')) {
    const firstWord = status.split(/[\s,.:]/)[0];
    if (['Recommended', 'Modified', 'Paused', 'Revoked'].includes(firstWord)) {
      return firstWord;
    }
    return 'Modified';
  }
  return status;
};

// Helper to escape CSV fields (wrap in quotes if contains comma, quote, or newline)
const escapeCSVField = (field: any): string => {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const downloadCSV = () => {
    const headers = ["ID", "Name", "Disease", "Immunity Duration (Years)", "Deaths/1M", "R0 (Contagiousness)", "Status", "Change Notes"];
    const rows = data.map(d => [
      d.id,
      d.name,
      d.disease,
      d.immunityDurationYears,
      d.deathsPerMillion,
      d.contagiousnessR0,
      getCleanStatus(d.status), // Use clean status for CSV
      d.recentChangeDescription || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.map(escapeCSVField).join(",") + "\n"
      + rows.map(row => row.map(escapeCSVField).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vaccine_impact_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">Detailed Vaccine Data</h3>
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
        >
          <Download size={16} />
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs">
            <tr>
              <th className="px-6 py-3">Vaccine</th>
              <th className="px-6 py-3">Disease</th>
              <th className="px-6 py-3">Immunity</th>
              <th className="px-6 py-3">Severity (Deaths/1M)</th>
              <th className="px-6 py-3">R0</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                <td className="px-6 py-4">{row.disease}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    row.immunityDurationYears > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {row.immunityLabel}
                  </span>
                </td>
                <td className="px-6 py-4">{row.deathsPerMillion.toLocaleString()}</td>
                <td className="px-6 py-4">{row.contagiousnessR0}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const cleanStatus = getCleanStatus(row.status);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         cleanStatus === 'Recommended' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                         cleanStatus === 'Modified' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                         'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                           cleanStatus === 'Recommended' ? 'bg-emerald-500' :
                           cleanStatus === 'Modified' ? 'bg-amber-500' :
                           'bg-rose-500'
                        }`}></span>
                        {cleanStatus}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
