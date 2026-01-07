import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Activity, Search, RefreshCw, ExternalLink, Info, Lock, Mail, X, Trash2 } from 'lucide-react';
import { VaccineChart } from './components/VaccineChart';
import { DataTable } from './components/DataTable';
import { INITIAL_VACCINE_DATA, MOCK_ANALYSIS } from './constants';
import { VaccineData, AnalysisResult } from './types';
import { analyzeHHSChanges } from './services/geminiService';

export default function App() {
  // Initialize state from LocalStorage safely
  const [data, setData] = useState<VaccineData[]>(() => {
    try {
      const saved = localStorage.getItem('vax_data');
      return saved ? JSON.parse(saved) : INITIAL_VACCINE_DATA;
    } catch (e) {
      console.warn("Failed to parse stored vaccine data, resetting to default.", e);
      return INITIAL_VACCINE_DATA;
    }
  });

  const [analysis, setAnalysis] = useState<AnalysisResult>(() => {
    try {
      const saved = localStorage.getItem('vax_analysis');
      return saved ? JSON.parse(saved) : { summary: "", sources: [] };
    } catch (e) {
      console.warn("Failed to parse stored analysis, resetting.", e);
      return { summary: "", sources: [] };
    }
  });

  const [loading, setLoading] = useState(false);
  const [hasFetchedLive, setHasFetchedLive] = useState(() => {
    try {
      return !!localStorage.getItem('vax_analysis');
    } catch {
      return false;
    }
  });
  
  // Graph State
  const [yAxisMode, setYAxisMode] = useState<'deaths' | 'r0'>('deaths');

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Persistence Effects
  useEffect(() => {
    try {
        localStorage.setItem('vax_data', JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save to localStorage", e);
    }
  }, [data]);

  useEffect(() => {
    try {
        localStorage.setItem('vax_analysis', JSON.stringify(analysis));
    } catch (e) {
        console.error("Failed to save analysis to localStorage", e);
    }
  }, [analysis]);

  const handleAdminLogin = () => {
    if (passwordInput === '88888888') {
      setIsAdmin(true);
      setShowPasswordModal(false);
    } else {
      alert("Incorrect password");
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data to factory defaults? This clears the latest AI analysis.")) {
        setData(INITIAL_VACCINE_DATA);
        setAnalysis({ summary: "", sources: [] });
        setHasFetchedLive(false);
        try {
            localStorage.removeItem('vax_data');
            localStorage.removeItem('vax_analysis');
        } catch (e) {}
    }
  };

  const handleLiveAnalysis = async () => {
    setLoading(true);
    try {
      // We pass the *current* data so the AI knows what IDs to reference
      const result = await analyzeHHSChanges(data);
      setAnalysis(result);
      
      console.log("Received updates from AI:", result.updatedDataHints);

      // Critical: Update the local data state based on AI hints
      if (result.updatedDataHints && result.updatedDataHints.length > 0) {
        const updatedData = data.map(v => {
          // Find if there is an update for this specific vaccine ID
          const update = result.updatedDataHints?.find(u => u.id === v.id);
          // If update exists, merge it. Ensure we keep the original structure valid.
          if (update) {
             console.log(`Updating ${v.name} status to ${update.status}`);
             return { ...v, ...update };
          }
          return v;
        });
        setData(updatedData);
      }
      setHasFetchedLive(true);
    } catch (e) {
      console.error("Analysis failed", e);
      alert("Analysis failed. Please check console or API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Lock size={20} className="text-slate-700"/> Admin Access
            </h3>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter Access Code"
              className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleAdminLogin} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* About/Methodology Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-slate-800">About VaxInsight</h2>
            
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                <strong>Data Methodology:</strong><br/>
                The "Live Update" feature utilizes the Google Gemini API with Search Grounding tools. When triggered by an admin, the system queries recent HHS and CDC announcements to identify status changes. It then correlates this text data with our baseline quantitative database.
              </p>
              <p>
                <strong>Variables:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                   <li><strong>Immunity Duration:</strong> Estimated time a vaccine provides effective protection before waning.</li>
                   <li><strong>Deaths per Million:</strong> Historical mortality rate of the disease in unvaccinated populations (US/Developed nations context).</li>
                   <li><strong>R0 (Reproduction Number):</strong> A measure of contagiousness. An R0 of 15 means one infected person infects 15 others on average.</li>
                </ul>
              </p>
              <p className="bg-yellow-50 p-3 rounded border border-yellow-100 text-sm">
                <strong>Note on "Live Updates":</strong> This feature is restricted to administrators to manage API costs. Public users can view the latest curated snapshot or suggest updates via email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white pt-8 pb-16 px-4 md:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 
                className="text-3xl font-bold flex items-center gap-3 cursor-pointer select-none"
                onClick={() => setShowPasswordModal(true)}
                title="Admin Login"
              >
                <Shield className="text-emerald-400" />
                VaxInsight
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Visualizing the trade-offs in public health policy: Immunity Duration vs. Disease Severity.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAboutModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Info size={18} />
                <span className="hidden sm:inline">About / Sources</span>
              </button>

              {isAdmin ? (
                <div className="flex gap-2">
                    <button 
                    onClick={handleResetData}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800/50"
                    title="Reset to Baseline"
                    >
                    <Trash2 size={20} />
                    </button>
                    <button 
                    onClick={handleLiveAnalysis}
                    disabled={loading}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${
                        loading
                        ? 'bg-slate-700 text-slate-400 cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                    }`}
                    >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                    {loading ? "Analyzing..." : "Run Live Update"}
                    </button>
                </div>
              ) : (
                <a 
                  href="mailto:sagearbor+vaccineUpdateDasboard@gmail.com?subject=Update Suggestion for VaxInsight"
                  className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 transition-all"
                >
                  <Mail size={20} />
                  Suggest Update
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 -mt-8 space-y-8">
        
        {/* Key Metrics / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Seasonal / Short-Term */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-bold uppercase tracking-wider">Seasonal / Short-Term</span>
              <Activity className="text-slate-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {data.filter(d => d.immunityDurationYears < 2).length} <span className="text-lg font-normal text-slate-500">Vaccines</span>
            </p>
             <div className="mt-3 flex gap-2">
                 {data.filter(d => d.immunityDurationYears < 2 && d.status !== 'Recommended').length > 0 ? (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">
                        {data.filter(d => d.immunityDurationYears < 2 && d.status !== 'Recommended').length} Modified
                    </span>
                 ) : (
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">All Stable</span>
                 )}
            </div>
            <p className="text-xs text-slate-400 mt-2 border-t pt-2 border-slate-100">
                Lower overall risk if modified.
            </p>
          </div>

          {/* 2. Lifelong Protection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-bold uppercase tracking-wider">Lifelong Protection</span>
              <Shield className="text-slate-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {data.filter(d => d.immunityDurationYears > 20).length} <span className="text-lg font-normal text-slate-500">Vaccines</span>
            </p>
            <div className="mt-3 flex gap-2">
                 {data.filter(d => d.immunityDurationYears > 20 && d.status !== 'Recommended').length > 0 ? (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                        {data.filter(d => d.immunityDurationYears > 20 && d.status !== 'Recommended').length} Modified
                    </span>
                 ) : (
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">All Stable</span>
                 )}
            </div>
            <p className="text-xs text-slate-400 mt-2 border-t pt-2 border-slate-100">
                High opportunity cost if removed.
            </p>
          </div>

          {/* 3. Severe Impact */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm font-bold uppercase tracking-wider">Severe Impact</span>
              <ShieldAlert className="text-slate-400" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {data.filter(d => d.deathsPerMillion > 1000).length} <span className="text-lg font-normal text-slate-500">Diseases</span>
            </p>
            <div className="mt-3">
               <span className="text-xs text-slate-500">Deaths &gt; 1,000 per 1M</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 border-t pt-2 border-slate-100">
                Removing protection significantly increases mortality.
            </p>
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                    <Info size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Strategic Analysis</h2>
            </div>
            <div className="prose prose-slate max-w-none text-slate-600 bg-slate-50 p-6 rounded-lg border border-slate-100">
                {hasFetchedLive && analysis.summary ? (
                    <div className="whitespace-pre-line leading-relaxed">
                        {analysis.summary}
                    </div>
                ) : (
                    <div className="text-slate-500 italic">
                        {MOCK_ANALYSIS}
                    </div>
                )}
            </div>
            
            {analysis.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">References</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                        {analysis.sources.map((s, i) => (
                            <li key={i}>
                                <a href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate">
                                    <ExternalLink size={14} className="flex-shrink-0" />
                                    <span className="truncate">{s.title}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* Visualization Section */}
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800">Impact Visualizer</h2>
                
                {/* Toggle Axis */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm font-bold text-slate-700 mr-2">Choose Y-Axis:</span>
                    <span className={`text-sm font-medium ${yAxisMode === 'deaths' ? 'text-blue-600' : 'text-slate-400'}`}>Deaths/1M</span>
                    <button 
                        onClick={() => setYAxisMode(prev => prev === 'deaths' ? 'r0' : 'deaths')}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <span className={`${yAxisMode === 'r0' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                    </button>
                    <span className={`text-sm font-medium ${yAxisMode === 'r0' ? 'text-blue-600' : 'text-slate-400'}`}>Contagiousness (R0)</span>
                </div>
            </div>

            <VaccineChart data={data} yAxisMode={yAxisMode} />
        </div>

        {/* Data Table */}
        <DataTable data={data} />

      </main>
    </div>
  );
}