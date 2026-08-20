import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  CheckCircle2,
  Compass,
  Database,
  Flame,
  Gauge,
  HelpCircle,
  Layers,
  LineChart,
  Percent,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { dbService } from '../database/db';
import { PredictionEngine } from '../prediction/predictionEngine';
import {
  ALL_TEAMS_LIST,
  ModelBacktestMetrics,
  PredictionAuditRecord,
  PredictionSnapshot,
  RoundResult,
  TeamId,
  TEAMS,
} from '../types/game';
import { TeamCrest } from './TeamCrest';

interface AnalysisTabProps {
  rounds: RoundResult[];
  prediction: PredictionSnapshot | null;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ rounds, prediction }) => {
  const [selectedMarkovTeam, setSelectedMarkovTeam] = useState<TeamId>('ac_milan');
  const [auditRecords, setAuditRecords] = useState<PredictionAuditRecord[]>([]);

  useEffect(() => {
    loadAudits();
  }, [rounds]);

  const loadAudits = async () => {
    const audits = await dbService.getPredictionAudits();
    setAuditRecords(audits);
  };

  const backtestMetrics: ModelBacktestMetrics = PredictionEngine.runBacktest(rounds);
  const { matrix, rowTotals } = PredictionEngine.calculateMarkovMatrix(rounds);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-bold text-base">Mathematical Prediction & Backtesting Engine</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Empirical multi-signal scoring model with zero lookahead bias, auditable signal breakdown, and signal effectiveness benchmarks.
          </p>
        </div>

        <div className="bg-purple-950/40 border border-purple-500/30 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 text-purple-300 font-medium">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Audited Sample: {backtestMetrics.totalTestedRounds} backtested rounds</span>
        </div>
      </div>

      {/* Accuracy Highlights with Exact Sample Size Ratios (Requirement 5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs uppercase font-medium">Top-1 Accuracy</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-2">
            {backtestMetrics.top1Ratio}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Baseline: 12.5% ({backtestMetrics.top1CorrectCount} hits)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs uppercase font-medium">Top-2 Accuracy</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400 mt-2">
            {backtestMetrics.top2Ratio}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Baseline: 25.0% ({backtestMetrics.top2CorrectCount} hits)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs uppercase font-medium">Top-3 Accuracy</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-2">
            {backtestMetrics.top3Ratio}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Baseline: 37.5% ({backtestMetrics.top3CorrectCount} hits)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs uppercase font-medium">Last 50 Accuracy (Top-3)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-2">
            {backtestMetrics.accuracyLast50}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Rolling stability window</span>
        </div>
      </div>

      {/* Requirement 8: Standalone Signal Performance Dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Signal Performance & Weight Effectiveness Dashboard
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Evaluates whether each statistical signal improves prediction accuracy over the 12.5% uniform baseline.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {backtestMetrics.signalPerformance.map((sig) => {
            const isPositive = sig.improvementVsBaseline > 0;
            return (
              <div
                key={sig.signalKey}
                className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">{sig.signalName}</span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      sig.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {sig.status}
                  </span>
                </div>

                <div className="my-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Standalone Top-1:</span>
                    <span className="font-mono font-bold text-white">
                      {sig.top1Accuracy}% ({sig.top1CorrectCount}/{sig.sampleSize})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Standalone Top-3:</span>
                    <span className="font-mono text-purple-300">
                      {sig.top3Accuracy}% ({sig.top3CorrectCount}/{sig.sampleSize})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vs 12.5% Baseline:</span>
                    <span
                      className={`font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {sig.improvementVsBaseline}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/50 flex justify-between text-[10px] text-slate-400">
                  <span>Model Weight: {(sig.currentWeight * 100).toFixed(0)}%</span>
                  <span>{sig.sampleSize} rounds</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requirement 11: Active Round Exact Score Breakdown (All 8 Teams) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          Active Round Score Decomposition & Contributions (8 Teams)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-3">Total Score</th>
                <th className="py-2.5 px-3">Recent Freq</th>
                <th className="py-2.5 px-3">Gap Signal</th>
                <th className="py-2.5 px-3">Markov P(Next)</th>
                <th className="py-2.5 px-3">Streak Adj</th>
                <th className="py-2.5 px-3">Multiplier Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {prediction?.rankings.map((item) => {
                const team = TEAMS[item.teamId];
                if (!team) return null;
                const exp = item.explanation;

                return (
                  <tr key={item.teamId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 font-bold w-3">#{item.rank}</span>
                        <TeamCrest teamId={item.teamId} size="xs" />
                        <span className="font-semibold text-white">{team.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      {item.totalScore} / 100
                    </td>

                    <td className="py-2.5 px-3 text-emerald-300">
                      {exp?.recentFrequencyContribution >= 0 ? '+' : ''}
                      {exp?.recentFrequencyContribution ?? 0}
                    </td>

                    <td className="py-2.5 px-3 text-emerald-300">
                      {exp?.currentGapContribution >= 0 ? '+' : ''}
                      {exp?.currentGapContribution ?? 0}
                    </td>

                    <td className="py-2.5 px-3 text-purple-300">
                      {exp?.transitionSignalContribution >= 0 ? '+' : ''}
                      {exp?.transitionSignalContribution ?? 0}
                    </td>

                    <td
                      className={`py-2.5 px-3 ${
                        (exp?.streakAdjustment ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {(exp?.streakAdjustment ?? 0) >= 0 ? '+' : ''}
                      {exp?.streakAdjustment ?? 0}
                    </td>

                    <td className="py-2.5 px-3 text-amber-400">
                      X{team.multiplier} (+{exp?.multiplierSignalContribution ?? 0})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirement 4: Prediction Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-bold text-base">Prediction Audit Log & Outcome Ledger</h3>
          </div>
          <button
            onClick={loadAudits}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {auditRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No prediction audits recorded yet. Run the Replay Analyzer or start the live monitoring pipeline.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/80 text-slate-400 text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-sans">Round</th>
                  <th className="py-2.5 px-3 font-sans">Sample Size</th>
                  <th className="py-2.5 px-3 font-sans">Top-1 Pick (Score)</th>
                  <th className="py-2.5 px-3 font-sans">Top-2 Pick</th>
                  <th className="py-2.5 px-3 font-sans">Top-3 Pick</th>
                  <th className="py-2.5 px-3 font-sans">Actual Result</th>
                  <th className="py-2.5 px-3 font-sans">Top-1 Hit</th>
                  <th className="py-2.5 px-3 font-sans">Top-3 Hit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {auditRecords.slice(0, 15).map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-white">{audit.roundPredicted}</td>
                    <td className="py-2 px-3 text-slate-400">{audit.availableHistoricalDataCount} rnds</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans font-medium">
                      {TEAMS[audit.top1Team]?.shortName} ({audit.top1Score})
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-300">
                      {TEAMS[audit.top2Team]?.shortName}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-300">
                      {TEAMS[audit.top3Team]?.shortName}
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-amber-400">
                      {audit.actualResult ? `${TEAMS[audit.actualResult]?.shortName} (X${audit.actualMultiplier})` : 'Pending'}
                    </td>
                    <td className="py-2 px-3">
                      {audit.status === 'EVALUATED' ? (
                        audit.top1Correct ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> NO
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">FROZEN</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {audit.status === 'EVALUATED' ? (
                        audit.top3Correct ? (
                          <span className="inline-flex items-center gap-1 text-purple-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> NO
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500">FROZEN</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Markov Transition Matrix Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Markov State Transition Matrix
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Empirical transition frequency P(NextTeam | CurrentTeam) based on {rounds.length} historical observations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Winner:</span>
            <select
              value={selectedMarkovTeam}
              onChange={(e) => setSelectedMarkovTeam(e.target.value as TeamId)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {ALL_TEAMS_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (X{t.multiplier})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transition probability cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {ALL_TEAMS_LIST.map((targetTeam) => {
            const prob = matrix[selectedMarkovTeam]?.[targetTeam.id]?.probability || 0;
            const count = matrix[selectedMarkovTeam]?.[targetTeam.id]?.count || 0;

            return (
              <div
                key={targetTeam.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center justify-between"
              >
                <TeamCrest teamId={targetTeam.id} size="sm" />
                <span className="text-xs font-bold text-white mt-1 text-center truncate max-w-full">
                  {targetTeam.shortName}
                </span>
                <div className="text-center mt-2">
                  <div className="text-base font-mono font-bold text-purple-400">{prob}%</div>
                  <span className="text-[10px] text-slate-500 font-mono">{count} times</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
