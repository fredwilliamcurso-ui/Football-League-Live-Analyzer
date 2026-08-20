import React from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Download,
  Eye,
  HelpCircle,
  History,
  Info,
  Layers,
  Play,
  PlaySquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  DataMode,
  LiveGameDetectionState,
  ModelStatus,
  PredictionSnapshot,
  RoundResult,
  TEAMS,
} from '../types/game';
import { TeamCrest } from './TeamCrest';
import { MasterClockDiagnostic } from './MasterClockDiagnostic';

interface HomeTabProps {
  rounds: RoundResult[];
  latestPrediction: PredictionSnapshot | null;
  currentRoundId: string;
  countdownSeconds: number;
  gamePhase: string;
  dataMode: DataMode;
  liveRoundsCount: number;
  detectionState: LiveGameDetectionState;
  onToggleDataMode: () => void;
  onNavigateTab: (tabId: string) => void;
  onStartSimulation: () => void;
  isSimulating: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  rounds,
  latestPrediction,
  currentRoundId,
  countdownSeconds,
  gamePhase,
  dataMode,
  liveRoundsCount,
  detectionState,
  onToggleDataMode,
  onNavigateTab,
  onStartSimulation,
  isSimulating,
}) => {
  const lastRound = rounds[0] || null;
  const topCandidate = latestPrediction?.topCandidate ? TEAMS[latestPrediction.topCandidate] : null;
  const topRankItem = latestPrediction?.rankings[0];
  const top2RankItem = latestPrediction?.rankings[1];
  const top3RankItem = latestPrediction?.rankings[2];
  const explanation = topRankItem?.explanation;

  const modelStatus: ModelStatus = latestPrediction?.modelStatus || 'WAITING FOR DATA';
  const confidenceWarning = latestPrediction?.confidenceWarning;

  const isStateUncertain =
    !detectionState.gameDetected ||
    detectionState.clockStatus === 'UNSYNCED' ||
    !detectionState.captureConnected ||
    detectionState.confidenceScore < 70;

  const isPredictionFrozen =
    detectionState.isFrozen ||
    latestPrediction?.status === 'FROZEN' ||
    (detectionState.detectedCountdown !== null && detectionState.detectedCountdown <= 1);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice with LIVE vs SEED Mode Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold text-base">Football League Real-Time Decision Support</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  dataMode === 'LIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {dataMode === 'LIVE' ? '● LIVE DATA' : 'DEMO/SEED DATA'}
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Live Boomplay screen observer, synchronous Master Clock tracking, and frozen model recommendation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            id="home-btn-toggle-datamode"
            onClick={onToggleDataMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              dataMode === 'LIVE'
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {dataMode === 'LIVE' ? 'Switch to Demo/Seed Data' : 'Switch to Live Data Mode'}
          </button>

          <a
            id="home-btn-download-apk"
            href="/Football-League-Live-Analyzer.apk"
            download="Football-League-Live-Analyzer.apk"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
            title="Download Android APK"
          >
            <Download className="w-3.5 h-3.5" />
            Download APK
          </a>
          <button
            id="home-btn-launch-live"
            onClick={() => onNavigateTab('live')}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            Live Monitor
          </button>
          <button
            id="home-btn-launch-floating"
            onClick={() => onNavigateTab('floating')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3.5 py-2 rounded-lg text-xs transition-colors border border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Floating Overlay
          </button>
        </div>
      </div>

      {/* Prediction Confidence / Live Sample Warning */}
      {confidenceWarning && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            modelStatus === 'INSUFFICIENT DATA' || modelStatus === 'WAITING FOR DATA'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{confidenceWarning}</span>
          </div>
          <span className="text-[11px] font-mono opacity-80">
            {dataMode === 'LIVE' ? `Live Sample: ${liveRoundsCount} rounds` : `Seed Sample: ${rounds.length} rounds`}
          </span>
        </div>
      )}

      {/* THE PROMINENT FINAL MODEL DECISION CARD */}
      {isStateUncertain ? (
        <div className="bg-rose-950/40 border-2 border-rose-500/50 rounded-2xl p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-white font-black text-lg uppercase tracking-wider">NO DECISION</h3>
          <p className="text-rose-300 font-bold text-sm">LIVE GAME STATE NOT CONFIRMED</p>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            The application strictly refuses to generate recommendations when the real game state is unobserved or uncertain. Return to the Football League screen in Boomplay to restore synchronization.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-white font-black text-base sm:text-lg uppercase tracking-wider">
                  FINAL MODEL DECISION
                </h3>
                <span className="text-slate-400 text-xs">
                  Target Round: <strong className="font-mono text-white">NO. {currentRoundId}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-black px-3 py-1 rounded-full border ${
                  isPredictionFrozen
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isPredictionFrozen ? 'PREDICTION FROZEN' : 'FINAL MODEL SCORE'}
              </span>
            </div>
          </div>

          {topRankItem && topCandidate && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <TeamCrest teamId={topCandidate.id} size="lg" />
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Top Pick:
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                    {topCandidate.name}
                  </h4>
                  <span className="text-xs text-amber-300 font-bold mt-1 block">
                    Multiplier: <strong>X{topCandidate.multiplier}</strong>
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">
                  Model Score:
                </span>
                <span className="text-3xl font-mono font-black text-emerald-400 block leading-tight mt-0.5">
                  {topRankItem.totalScore}
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  Rank #1 of 8 Teams
                </span>
              </div>
            </div>
          )}

          {/* Second & Third Candidates */}
          {top2RankItem && top3RankItem && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TeamCrest teamId={top2RankItem.teamId} size="xs" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Second:</span>
                    <span className="text-sm font-bold text-white block">
                      {TEAMS[top2RankItem.teamId]?.name} — X{TEAMS[top2RankItem.teamId]?.multiplier}
                    </span>
                  </div>
                </div>
                <span className="text-base font-mono font-black text-emerald-400">
                  {top2RankItem.totalScore}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TeamCrest teamId={top3RankItem.teamId} size="xs" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Third:</span>
                    <span className="text-sm font-bold text-white block">
                      {TEAMS[top3RankItem.teamId]?.name} — X{TEAMS[top3RankItem.teamId]?.multiplier}
                    </span>
                  </div>
                </div>
                <span className="text-base font-mono font-black text-emerald-400">
                  {top3RankItem.totalScore}
                </span>
              </div>
            </div>
          )}

          {/* Source and Freeze Audit Footnote */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <span>
              Status: <strong className={isPredictionFrozen ? 'text-rose-300' : 'text-emerald-300'}>
                {isPredictionFrozen ? 'PREDICTION FROZEN' : 'ACTIVE MODEL (5s CALCULATION)'}
              </strong>
            </span>
            <span>
              Source: <strong className="text-slate-200">REAL BOOMPLAY SCREEN</strong>
            </span>
          </div>
        </div>
      )}

      {/* Real Game Master Clock Diagnostic Section */}
      <MasterClockDiagnostic
        detectionState={detectionState}
        prediction={latestPrediction}
        currentRoundId={currentRoundId}
        countdownSeconds={countdownSeconds}
        gamePhase={gamePhase}
        dataMode={dataMode}
        liveRoundsCount={liveRoundsCount}
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Round & Countdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Current Round</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {currentRoundId || '08200035'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-mono font-bold text-xs">
                {countdownSeconds > 0 ? `${countdownSeconds}s remaining` : 'Phase Transition'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Phase</span>
            <span className="text-emerald-400 font-semibold">{gamePhase.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Card 2: Top Model Pick */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Top Model Pick</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            {topCandidate ? (
              <>
                <TeamCrest teamId={topCandidate.id} size="sm" />
                <div>
                  <div className="text-white font-bold text-sm sm:text-base leading-tight">
                    {topCandidate.name}
                  </div>
                  <div className="text-emerald-400 text-xs font-semibold mt-0.5">
                    Score: {latestPrediction?.topCandidateScore ?? 0}/100
                  </div>
                </div>
              </>
            ) : (
              <span className="text-slate-500 text-xs">Waiting for round...</span>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Model Status</span>
            <span
              className={`font-bold font-mono text-[10px] px-1.5 py-0.5 rounded ${
                modelStatus === 'READY'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : modelStatus === 'LEARNING'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {modelStatus}
            </span>
          </div>
        </div>

        {/* Card 3: Live Rounds Counter */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {dataMode === 'LIVE' ? 'Live Rounds Observed' : 'Seed Data In Memory'}
            </span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {dataMode === 'LIVE' ? liveRoundsCount : rounds.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {dataMode === 'LIVE'
                ? `LIVE ROUNDS OBSERVED: ${liveRoundsCount}`
                : `DEMO SEED: ${rounds.length} rounds`}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Last Winner</span>
            <span className="text-slate-200 font-semibold font-mono">
              {lastRound ? `${TEAMS[lastRound.team]?.shortName} (X${lastRound.multiplier})` : 'None'}
            </span>
          </div>
        </div>

        {/* Card 4: Historical Accuracy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Historical Accuracy</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold font-mono text-purple-300 tracking-tight">
              {latestPrediction?.top3Ratio || '0.0% (0/0)'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Top-1: {latestPrediction?.top1Ratio || '0.0% (0/0)'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sample Size</span>
            <span className="font-mono text-slate-300 font-semibold">
              {latestPrediction?.availableSampleCount || 0} completed rounds
            </span>
          </div>
        </div>
      </div>

      {/* "Why this pick?" Mathematical Audit Decomposition Panel */}
      {topCandidate && explanation && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-bold text-sm sm:text-base">Why this pick? Score Decomposition</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Total Score: {topRankItem.totalScore} / 100
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 mb-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 mb-2 font-bold text-white">
              <TeamCrest teamId={topCandidate.id} size="xs" />
              <span>TOP MODEL PICK: {topCandidate.name} (X{topCandidate.multiplier})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Recent Frequency</span>
                <span className="text-emerald-400 font-bold">
                  {explanation.recentFrequencyContribution >= 0 ? '+' : ''}
                  {explanation.recentFrequencyContribution}
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Current Gap</span>
                <span className="text-emerald-400 font-bold">
                  {explanation.currentGapContribution >= 0 ? '+' : ''}
                  {explanation.currentGapContribution}
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Transition Signal</span>
                <span className="text-purple-400 font-bold">
                  {explanation.transitionSignalContribution >= 0 ? '+' : ''}
                  {explanation.transitionSignalContribution}
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Long-Term Baseline</span>
                <span className="text-blue-400 font-bold">
                  +{explanation.longTermFrequencyContribution}
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Multiplier Signal</span>
                <span className="text-amber-400 font-bold">
                  +{explanation.multiplierSignalContribution}
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Streak Adjustment</span>
                <span className={explanation.streakAdjustment >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {explanation.streakAdjustment >= 0 ? '+' : ''}
                  {explanation.streakAdjustment}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Decomposed formula: <code>Total = Base(20.0) + Recency + Gap + Markov + Baseline + Multiplier + Streak</code>.
            Auditable and transparent without lookahead bias.
          </p>
        </div>
      )}

      {/* Safety and Operational Decision-Support Policy */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1">
            <div className="font-semibold text-white">Ethical & Operational Safety Policy:</div>
            <p>
              This application functions strictly as an analytical decision-support tool.
              It does <strong>NOT</strong> perform automatic betting, click buttons, or interact with gambling accounts.
              The application stops at <strong>MODEL RECOMMENDATION</strong>; the user makes all final betting decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Rounds Timeline Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-bold text-sm sm:text-base">Recent Observed Rounds Timeline</h3>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
          >
            <span>Full History ({rounds.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {rounds.slice(0, 8).map((round, idx) => {
            const team = TEAMS[round.team];
            if (!team) return null;

            return (
              <div
                key={round.id || idx}
                className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-between text-center relative group hover:border-slate-700 transition-colors"
              >
                <span className="text-[9px] font-mono text-slate-500 block mb-1">
                  NO. {round.roundNumber.slice(-4)}
                </span>
                <TeamCrest teamId={round.team} size="sm" />
                <span className="font-bold text-xs text-white mt-1 truncate max-w-full">
                  {team.shortName}
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                  X{round.multiplier}
                </span>
                {round.predictionMade && (
                  <span
                    className={`mt-1 text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                      round.predictionCorrect
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : round.predictionTop2Correct
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {round.predictionCorrect ? 'TOP 1' : round.predictionTop2Correct ? 'TOP 2' : 'MISS'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
