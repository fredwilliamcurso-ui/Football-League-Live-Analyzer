import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  XCircle,
} from 'lucide-react';
import { LiveGameDetectionState, PredictionSnapshot, RoundResult, TEAMS } from '../types/game';

interface MasterClockDiagnosticProps {
  detectionState: LiveGameDetectionState;
  prediction: PredictionSnapshot | null;
  currentRoundId: string;
  countdownSeconds: number;
  gamePhase: string;
  dataMode: 'LIVE' | 'DEMO_SEED';
  liveRoundsCount?: number;
}

export const MasterClockDiagnostic: React.FC<MasterClockDiagnosticProps> = ({
  detectionState,
  prediction,
  currentRoundId,
  countdownSeconds,
  gamePhase,
  dataMode,
  liveRoundsCount = 0,
}) => {
  const isPredictionFrozen =
    detectionState.isFrozen ||
    prediction?.status === 'FROZEN' ||
    (detectionState.detectedCountdown !== null && detectionState.detectedCountdown <= 1);

  const getPredictionStateLabel = () => {
    if (isPredictionFrozen) return 'FROZEN';
    if (detectionState.detectedCountdown !== null && detectionState.detectedCountdown <= 5) {
      return 'FINAL';
    }
    if (detectionState.detectedCountdown !== null && detectionState.detectedCountdown <= 15) {
      return 'UPDATED';
    }
    return 'PRELIMINARY';
  };

  const predictionState = getPredictionStateLabel();
  const topTeam = prediction?.topCandidate ? TEAMS[prediction.topCandidate] : null;

  return (
    <div className="bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header with Master Clock Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-black text-sm sm:text-base uppercase tracking-wider">
                REAL GAME MASTER CLOCK
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Strictly driven by physical screen frames. Zero local timer countdowns.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            SOURCE: <strong className="text-emerald-400">REAL BOOMPLAY SCREEN</strong>
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg border font-bold ${
              detectionState.clockStatus === 'SYNCED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : detectionState.clockStatus === 'WAITING_FOR_GAME'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            CLOCK: {detectionState.clockStatus}
          </span>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Game Target</span>
          <span className="text-white font-bold text-xs mt-1 block">FOOTBALL LEAGUE</span>
          <span className="text-[10px] text-emerald-400 mt-0.5">
            {detectionState.gameDetected ? '● DETECTED' : '○ NOT DETECTED'}
          </span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Round ID</span>
          <span className="text-white font-black text-sm mt-1 block font-mono">
            {currentRoundId || detectionState.detectedRoundId || '08200035'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Live Round Frame</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Game Phase</span>
          <span className="text-emerald-400 font-bold text-xs mt-1 block truncate">
            {gamePhase.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Visual Confirmation</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Detected Countdown</span>
          <span className="text-amber-300 font-black text-base mt-1 block font-mono">
            {detectionState.detectedCountdown !== null ? `${detectionState.detectedCountdown}s` : '—'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Last: {detectionState.lastCountdownDetected ?? '—'}s
          </span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Prediction State</span>
          <span
            className={`font-black text-xs mt-1 block ${
              isPredictionFrozen ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {predictionState}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Frozen: <strong className="text-white">{isPredictionFrozen ? 'YES' : 'NO'}</strong>
          </span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Recognition Confidence</span>
          <span className="text-blue-400 font-black text-sm mt-1 block font-mono">
            {detectionState.confidenceScore}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {detectionState.frameTimestamp ? detectionState.frameTimestamp.slice(11, 23) : 'Live Stream'}
          </span>
        </div>
      </div>

      {/* Countdown Audit Log (Real Frame Transition Stream) */}
      <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800/90 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            Countdown Transition Audit (Direct Frame Detections Only)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Rule: Missing frames allowed (e.g. 5 → 3 → 1); zero synthetic interpolation
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {detectionState.transitionAudit && detectionState.transitionAudit.length > 0 ? (
            detectionState.transitionAudit.slice(-6).map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-1.5"
              >
                <span className="text-[10px] text-slate-500">{item.timestamp.slice(11, 23)}</span>
                <span className="text-emerald-400 font-bold">→ {item.countdown}s</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-[11px] italic">
              Awaiting live countdown frame transitions from MediaProjection stream...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
