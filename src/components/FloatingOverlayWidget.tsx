import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Battery,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';
import {
  FloatingOverlayConfig,
  GamePhase,
  LiveGameDetectionState,
  PredictionSnapshot,
  TeamId,
  TEAMS,
} from '../types/game';
import { TeamCrest } from './TeamCrest';

interface FloatingOverlayWidgetProps {
  config: FloatingOverlayConfig;
  detectionState: LiveGameDetectionState;
  prediction: PredictionSnapshot | null;
  liveRoundsCount: number;
  dataMode: 'LIVE' | 'DEMO_SEED';
  onUpdateConfig: (partial: Partial<FloatingOverlayConfig>) => void;
  onStopMonitoring: () => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
}

export const FloatingOverlayWidget: React.FC<FloatingOverlayWidgetProps> = ({
  config,
  detectionState,
  prediction,
  liveRoundsCount,
  dataMode,
  onUpdateConfig,
  onStopMonitoring,
  onTogglePause,
  onOpenSettings,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(config.position || { x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 340, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 220, dragStartRef.current.startY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdateConfig({ position });
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, onUpdateConfig]);

  if (!config.isEnabled || !config.isMonitoring) {
    return null;
  }

  // Opacity styles
  const getOpacityClass = () => {
    switch (config.opacity) {
      case 100:
        return 'bg-slate-950/98 shadow-2xl border-emerald-500/50';
      case 80:
        return 'bg-slate-950/90 backdrop-blur-md shadow-2xl border-emerald-500/40';
      case 60:
        return 'bg-slate-950/70 backdrop-blur-md shadow-xl border-emerald-500/30';
      case 40:
        return 'bg-slate-950/50 backdrop-blur-sm shadow-lg border-emerald-500/30';
      default:
        return 'bg-slate-950/90 backdrop-blur-md shadow-2xl border-emerald-500/40';
    }
  };

  // Dimensions
  const getSizeStyles = () => {
    switch (config.size) {
      case 'compact':
        return 'w-[310px] min-h-[180px] text-xs';
      case 'large':
        return 'w-[380px] min-h-[260px] text-sm';
      case 'normal':
      default:
        return 'w-[340px] min-h-[220px] text-xs';
    }
  };

  // Check if live state is uncertain
  const isStateUncertain =
    !detectionState.gameDetected ||
    detectionState.clockStatus === 'UNSYNCED' ||
    !detectionState.captureConnected ||
    detectionState.confidenceScore < 70;

  // Minimized Bubble View
  if (config.isMinimized) {
    return (
      <div
        id="floating-overlay-minimized-bubble"
        onMouseDown={handleMouseDown}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className="fixed z-50 cursor-move select-none touch-none animate-in fade-in zoom-in duration-150"
      >
        <div
          onClick={() => onUpdateConfig({ isMinimized: false })}
          className="relative w-14 h-14 rounded-full bg-slate-950/95 border-2 border-emerald-400 text-white flex flex-col items-center justify-center shadow-2xl backdrop-blur-md hover:scale-105 active:scale-95 transition-transform"
        >
          {!isStateUncertain && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
          )}

          <div className="flex flex-col items-center leading-none">
            <span className="text-base">⚽</span>
            <span className="text-[10px] font-black text-emerald-400 tracking-tighter mt-0.5">
              {detectionState.isFrozen ? 'FROZEN' : isStateUncertain ? 'WAIT' : 'LIVE'}
            </span>
          </div>

          {/* Countdown badge if active */}
          {!isStateUncertain && detectionState.countdownDisplay !== '—' && (
            <span
              className={`absolute -top-1 -right-1 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full shadow-xs ${
                detectionState.isFrozen ? 'bg-rose-400' : 'bg-amber-400'
              }`}
            >
              {detectionState.countdownDisplay}
            </span>
          )}

          {/* Uncertainty badge if lost */}
          {isStateUncertain && (
            <span className="absolute -bottom-1 bg-rose-600 text-white text-[8px] font-bold px-1 rounded-full">
              LOST
            </span>
          )}
        </div>
      </div>
    );
  }

  const top1Team = prediction?.rankings[0];
  const top2Team = prediction?.rankings[1];
  const top3Team = prediction?.rankings[2];

  const isPredictionFrozen =
    detectionState.isFrozen ||
    prediction?.status === 'FROZEN' ||
    (detectionState.detectedCountdown !== null && detectionState.detectedCountdown <= 1);

  return (
    <div
      id="floating-overlay-window"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-50 select-none border-2 rounded-2xl overflow-hidden transition-opacity ${getOpacityClass()} ${getSizeStyles()}`}
    >
      {/* Draggable Title Header */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-slate-900/95 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⚽</span>
          <span className="text-white font-black text-xs tracking-tight">FOOTBALL ANALYZER</span>
          {config.batteryMode === 'LOW_POWER' && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1 rounded">
              ECO
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Pause / Resume Button */}
          <button
            id="overlay-btn-pause"
            onClick={onTogglePause}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={config.isPaused ? 'Resume Monitoring' : 'Pause Monitoring'}
          >
            {config.isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Opacity Cycle */}
          <button
            id="overlay-btn-opacity-cycle"
            onClick={() => {
              const nextOpacity: 100 | 80 | 60 | 40 =
                config.opacity === 100 ? 80 : config.opacity === 80 ? 60 : config.opacity === 60 ? 40 : 100;
              onUpdateConfig({ opacity: nextOpacity });
            }}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-bold"
            title="Toggle Opacity"
          >
            {config.opacity}%
          </button>

          {/* Minimize to Floating Bubble */}
          <button
            id="overlay-btn-minimize"
            onClick={() => onUpdateConfig({ isMinimized: true })}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Minimize to Bubble"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close / Stop Monitoring */}
          <button
            id="overlay-btn-close"
            onClick={onStopMonitoring}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Stop & Close Overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3 space-y-2.5">
        {/* Real Game Master Clock Telemetry Strip */}
        <div className="flex items-center justify-between text-[10px] px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                !isStateUncertain && detectionState.clockStatus === 'SYNCED'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-bold text-slate-300">
              CLOCK:{' '}
              <strong
                className={
                  !isStateUncertain && detectionState.clockStatus === 'SYNCED'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {!isStateUncertain ? detectionState.clockStatus : 'UNSYNCED'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            {config.showRound && (
              <span className="text-slate-400">
                RND: <strong className="text-white font-bold">{detectionState.detectedRoundNumber}</strong>
              </span>
            )}
            {config.showCountdown && (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>
                  {detectionState.countdownDisplay !== '—' && detectionState.countdownDisplay !== 'DETECTING'
                    ? `${detectionState.countdownDisplay}s`
                    : detectionState.countdownDisplay}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* RULE: NO DECISION WHEN LIVE STATE IS UNCERTAIN */}
        {isStateUncertain ? (
          <div className="bg-rose-950/70 border border-rose-500/50 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1 animate-pulse">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div className="text-rose-200 font-black text-xs uppercase tracking-wider">
              NO DECISION
            </div>
            <div className="text-[11px] text-rose-300 font-bold">
              LIVE GAME STATE NOT CONFIRMED
            </div>
            <div className="text-[9px] text-rose-400/90 max-w-[260px]">
              Football League pitch not detected or confidence below threshold. Monitoring real screen...
            </div>
          </div>
        ) : (
          <>
            {/* Winner evaluation banner if in result phase */}
            {detectionState.detectedPhase === 'RESULT_POPUP' && detectionState.lastActualResult ? (
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TeamCrest teamId={detectionState.lastActualResult} size="sm" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ACTUAL REAL GAME RESULT
                    </div>
                    <div className="text-xs font-black text-white leading-tight">
                      {TEAMS[detectionState.lastActualResult]?.name} (X{TEAMS[detectionState.lastActualResult]?.multiplier})
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-xs">
                  {detectionState.top1Evaluation === 'CORRECT' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> TOP 1 WIN
                    </span>
                  ) : detectionState.top2Evaluation === 'CORRECT' ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> TOP 2 HIT
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> MISS
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* THE REQUIRED "FINAL MODEL DECISION" BLOCK */
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 shadow-md space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      FINAL MODEL DECISION
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border ${
                      isPredictionFrozen
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {isPredictionFrozen ? 'PREDICTION FROZEN' : 'FINAL MODEL SCORE'}
                  </span>
                </div>

                {top1Team && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TeamCrest teamId={top1Team.teamId} size="sm" />
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold block leading-none">
                          Top Pick:
                        </span>
                        <span className="text-sm font-black text-white block leading-tight">
                          {TEAMS[top1Team.teamId]?.name}
                        </span>
                        <span className="text-[10px] text-amber-300 font-semibold">
                          Multiplier: <strong>X{TEAMS[top1Team.teamId]?.multiplier}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block leading-none">Model Score:</span>
                      <span className="text-base font-mono font-black text-emerald-400 leading-tight">
                        {top1Team.totalScore}
                      </span>
                    </div>
                  </div>
                )}

                {/* Second and Third Candidates */}
                {top2Team && top3Team && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/70 text-[11px]">
                    <div className="bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 truncate">
                        Second: <strong className="text-slate-200">{TEAMS[top2Team.teamId]?.shortName}</strong>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold ml-1">{top2Team.totalScore}</span>
                    </div>

                    <div className="bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 truncate">
                        Third: <strong className="text-slate-200">{TEAMS[top3Team.teamId]?.shortName}</strong>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold ml-1">{top3Team.totalScore}</span>
                    </div>
                  </div>
                )}

                {/* Audit Telemetry Footer */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>
                    Status: <strong className={isPredictionFrozen ? 'text-rose-300' : 'text-emerald-300'}>
                      {isPredictionFrozen ? 'PREDICTION FROZEN' : 'ACTIVE MODEL'}
                    </strong>
                  </span>
                  <span>
                    Source: <strong className="text-slate-200">REAL BOOMPLAY SCREEN</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Status Bar: Data Store & CV Telemetry */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 px-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dataMode === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={dataMode === 'LIVE' ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
                  {dataMode === 'LIVE' ? `LIVE DATA (${liveRoundsCount} RNDS)` : 'DEMO MODE'}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[9px]">
                <span>CONF: <strong className="text-slate-200">{detectionState.confidenceScore}%</strong></span>
                <span>TEAMS: <strong className="text-emerald-400">{detectionState.teamsRecognizedCount}/8</strong></span>
              </div>
            </div>
          </>
        )}

        {/* Quick Stop Button & Settings Gear */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
          <button
            id="overlay-btn-stop-bottom"
            onClick={onStopMonitoring}
            className="flex-1 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold transition-colors mr-2 text-center"
          >
            STOP MONITORING
          </button>
          <button
            id="overlay-btn-open-settings"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            title="Overlay Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
