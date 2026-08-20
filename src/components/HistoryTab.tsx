import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  History,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { MultiplierTier, RoundResult, TeamId, TEAMS } from '../types/game';
import { TeamCrest } from './TeamCrest';

interface HistoryTabProps {
  rounds: RoundResult[];
  onDeleteRound: (id: string) => void;
  onClearAll: () => void;
  onResetSeed: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportData: (imported: RoundResult[]) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  rounds,
  onDeleteRound,
  onClearAll,
  onResetSeed,
  onExportCSV,
  onExportJSON,
  onImportData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [selectedMultiplierFilter, setSelectedMultiplierFilter] = useState<string>('ALL');
  const [selectedPredictionFilter, setSelectedPredictionFilter] = useState<string>('ALL');

  // Filtered dataset
  const filteredRounds = useMemo(() => {
    return rounds.filter((r) => {
      // Search
      if (searchQuery.trim() && !r.roundNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Team filter
      if (selectedTeamFilter !== 'ALL' && r.team !== selectedTeamFilter) {
        return false;
      }
      // Multiplier filter
      if (selectedMultiplierFilter !== 'ALL' && r.multiplier !== Number(selectedMultiplierFilter)) {
        return false;
      }
      // Prediction status
      if (selectedPredictionFilter === 'TOP1_CORRECT' && !r.predictionCorrect) return false;
      if (selectedPredictionFilter === 'TOP3_CORRECT' && !r.predictionTop3Correct) return false;
      if (selectedPredictionFilter === 'INCORRECT' && r.predictionTop3Correct !== false) return false;

      return true;
    });
  }, [rounds, searchQuery, selectedTeamFilter, selectedMultiplierFilter, selectedPredictionFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          onImportData(parsed);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold text-base">Recorded Round Database</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Total of {rounds.length} persistent rounds recorded. Search, filter, or export to CSV / JSON.
          </p>
        </div>

        {/* Export & Utility Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-2 rounded-lg text-xs border border-slate-700 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import JSON
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            id="history-btn-export-csv"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-2 rounded-lg text-xs border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>

          <button
            id="history-btn-export-json"
            onClick={onExportJSON}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-3 py-2 rounded-lg text-xs border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export JSON
          </button>

          <button
            id="history-btn-reset-seed"
            onClick={onResetSeed}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium px-3 py-2 rounded-lg text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Seed
          </button>

          <button
            id="history-btn-clear-all"
            onClick={onClearAll}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium px-3 py-2 rounded-lg text-xs border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search round number (e.g. 08200033)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Team Filter */}
        <select
          value={selectedTeamFilter}
          onChange={(e) => setSelectedTeamFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Teams</option>
          {Object.values(TEAMS).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (X{t.multiplier})
            </option>
          ))}
        </select>

        {/* Multiplier Filter */}
        <select
          value={selectedMultiplierFilter}
          onChange={(e) => setSelectedMultiplierFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Multipliers</option>
          <option value="40">X40 (Real Madrid, Barca)</option>
          <option value="12">X12 (PSG, Liverpool)</option>
          <option value="6">X6 (AC Milan, Bayern)</option>
          <option value="4">X4 (Juventus, Man Utd)</option>
        </select>

        {/* Prediction Accuracy Filter */}
        <select
          value={selectedPredictionFilter}
          onChange={(e) => setSelectedPredictionFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Prediction Outcomes</option>
          <option value="TOP1_CORRECT">Top-1 Correct Only</option>
          <option value="TOP3_CORRECT">Top-3 Correct</option>
          <option value="INCORRECT">Missed</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Round ID</th>
                <th className="py-3 px-4">Recorded Winner</th>
                <th className="py-3 px-4">Multiplier</th>
                <th className="py-3 px-4">Model Prediction</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRounds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No recorded rounds match the active filters.
                  </td>
                </tr>
              ) : (
                filteredRounds.map((round) => {
                  const team = TEAMS[round.team];
                  const predicted = round.predictedTeam ? TEAMS[round.predictedTeam] : null;

                  return (
                    <tr key={round.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {round.roundNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <TeamCrest teamId={round.team} size="xs" />
                          <span className="font-semibold text-white">{team?.name || round.team}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-800 text-amber-400 border border-slate-700">
                          X{round.multiplier}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {predicted ? (
                          <div className="flex items-center gap-2">
                            <TeamCrest teamId={predicted.id} size="xs" />
                            <span className="text-slate-200">
                              {predicted.shortName}{' '}
                              {round.predictedRank && (
                                <span className="text-slate-400 font-mono text-[10px]">
                                  (Rank #{round.predictedRank})
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {round.predictionScore ? (
                          <span className="text-emerald-400 font-bold">{round.predictionScore}/100</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {round.predictionCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Top-1 Hit
                          </span>
                        ) : round.predictionTop3Correct ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Top-3 Hit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3" /> Miss
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteRound(round.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Delete round"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
