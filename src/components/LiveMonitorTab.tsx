import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  StopCircle,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { soundService } from '../notifications/audioAlerts';
import {
  ALL_TEAMS_LIST,
  CalibrationProfile,
  DataMode,
  GamePhase,
  LiveGameDetectionState,
  PredictionSnapshot,
  RoundResult,
  TeamId,
  TEAMS,
} from '../types/game';
import { DEFAULT_CALIBRATION_720X1600, VisionDetectionResult, VisionEngine } from '../vision/visionEngine';
import { TeamCrest } from './TeamCrest';
import { MasterClockDiagnostic } from './MasterClockDiagnostic';

interface LiveMonitorTabProps {
  prediction: PredictionSnapshot | null;
  currentRoundId: string;
  countdownSeconds: number;
  gamePhase: GamePhase;
  onRecordResult: (teamId: TeamId, confidence?: number) => void;
  calibration: CalibrationProfile;
  detectionState: LiveGameDetectionState;
  dataMode: DataMode;
}

export const LiveMonitorTab: React.FC<LiveMonitorTabProps> = ({
  prediction,
  currentRoundId,
  countdownSeconds,
  gamePhase,
  onRecordResult,
  calibration,
  detectionState,
  dataMode,
}) => {
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeWinnerHighlight, setActiveWinnerHighlight] = useState<TeamId | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const visionEngineRef = useRef<VisionEngine | null>(null);

  useEffect(() => {
    visionEngineRef.current = new VisionEngine(calibration);
  }, [calibration]);

  // Handle start browser screen projection
  const handleStartCapture = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen capture API is not available in this browser environment. Using simulation canvas.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15, max: 30 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScreenCapturing(true);

      stream.getVideoTracks()[0].onended = () => {
        handleStopCapture();
      };
    } catch (err) {
      console.warn('Screen capture cancelled or error', err);
    }
  };

  const handleStopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenCapturing(false);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setEnabled(next);
  };

  // Phase color styling
  const getPhaseBadge = (phase: GamePhase) => {
    switch (phase) {
      case 'BETTING_COUNTDOWN':
        return { label: 'BETTING SELECTION', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'STOP_SELECTION':
        return { label: 'STOP SELECTION', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'READY_SPIN':
        return { label: 'SPINNING / READY', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'RESULT_POPUP':
        return { label: 'RESULT ANNOUNCEMENT', color: 'bg-emerald-500 text-slate-950 font-black border-emerald-400' };
      case 'START_SELECTION':
        return { label: 'STARTING NEXT ROUND', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      default:
        return { label: 'IDLE / MONITORING', color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const currentPhaseInfo = getPhaseBadge(gamePhase);

  // Check state uncertainty
  const isStateUncertain =
    !detectionState.gameDetected ||
    detectionState.clockStatus === 'UNSYNCED' ||
    !detectionState.captureConnected ||
    detectionState.confidenceScore < 70;

  const top1Team = prediction?.rankings[0];
  const top2Team = prediction?.rankings[1];
  const top3Team = prediction?.rankings[2];

  const isPredictionFrozen =
    detectionState.isFrozen ||
    prediction?.status === 'FROZEN' ||
    (detectionState.detectedCountdown !== null && detectionState.detectedCountdown <= 1);

  return (
    <div className="space-y-6">
      {/* Top Controls & Real Game Master Clock Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                !isStateUncertain && detectionState.clockStatus === 'SYNCED'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-mono font-bold text-slate-200">
              CLOCK: <span className={!isStateUncertain ? 'text-emerald-400' : 'text-rose-400'}>{!isStateUncertain ? detectionState.clockStatus : 'UNSYNCED'}</span>
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentPhaseInfo.color}`}>
            {currentPhaseInfo.label}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>RND: <strong className="font-mono text-white font-bold">{currentRoundId}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="live-btn-toggle-overlay"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showOverlays
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Detection ROI
          </button>

          <button
            id="live-btn-toggle-sound"
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={soundEnabled ? 'Mute Alerts' : 'Unmute Alerts'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {!isScreenCapturing ? (
            <button
              id="live-btn-start-screen-cap"
              onClick={handleStartCapture}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Capture Screen
            </button>
          ) : (
            <button
              id="live-btn-stop-screen-cap"
              onClick={handleStopCapture}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Stop Capture
            </button>
          )}
        </div>
      </div>

      {/* Decision Process Flow Diagram */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <span className="font-bold text-white uppercase text-[10px] bg-slate-800 px-2 py-0.5 rounded">
            Live Decision Process:
          </span>
          <span className="text-emerald-400 font-bold">REAL BOOMPLAY GAME</span>
          <span>→</span>
          <span>SCREEN CAPTURE</span>
          <span>→</span>
          <span>GAME DETECTION</span>
          <span>→</span>
          <span>REAL COUNTDOWN</span>
          <span>→</span>
          <span>STATISTICAL ANALYSIS</span>
          <span>→</span>
          <span className="text-amber-400 font-bold">FINAL MODEL DECISION</span>
          <span>→</span>
          <span className="text-rose-400 font-bold">PREDICTION FROZEN</span>
          <span>→</span>
          <span>REAL GAME RESULT</span>
          <span>→</span>
          <span className="text-emerald-400 font-bold">AUTOMATIC AUDIT</span>
        </div>
      </div>

      {/* Real Game Master Clock Telemetry & Countdown Audit */}
      <MasterClockDiagnostic
        detectionState={detectionState}
        prediction={prediction}
        currentRoundId={currentRoundId}
        countdownSeconds={countdownSeconds}
        gamePhase={gamePhase}
        dataMode={dataMode}
      />

      {/* Main Grid: Screen View on Left, Decision Card & 8-Teams on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Game Area Canvas / Screen / Simulator */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
            {/* Screen Aspect Ratio Container (Portrait 720x1600 ~ 9:16 ratio) */}
            <div className="relative w-full max-w-[340px] aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl flex flex-col justify-between p-3 select-none">
              {/* Internal simulated or projected game graphics */}
              {isScreenCapturing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#0F4C1E] via-[#15803D] to-[#0A3D14] flex flex-col justify-between p-3 overflow-hidden">
                  {/* Top Bar with Coin balance & Football League Banner */}
                  <div className="flex items-center justify-between text-[11px] text-white/90 bg-black/40 px-2 py-1 rounded-md backdrop-blur-xs">
                    <span className="font-bold text-amber-400">FOOTBALL LEAGUE</span>
                    <span className="bg-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold">Normal</span>
                  </div>

                  {/* 8 Team Circular Pitch Layout */}
                  <div className="relative flex-1 my-2 flex items-center justify-center">
                    {/* Outer soccer pitch circle line */}
                    <div className="absolute w-60 h-60 rounded-full border-2 border-white/20 pointer-events-none" />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-white/20 pointer-events-none" />

                    {/* Central Countdown / Phase Display */}
                    <div className="z-10 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-black/60 border border-amber-400/40 backdrop-blur-sm shadow-lg">
                      <span className="text-[10px] text-amber-300 font-medium">Select Time</span>
                      <span
                        className={`text-2xl font-black font-mono leading-none mt-0.5 ${
                          countdownSeconds <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                        }`}
                      >
                        {countdownSeconds}s
                      </span>
                    </div>

                    {/* Team Positions on Pitch */}
                    {/* Top Row: Real Madrid (L) and Barcelona (R) */}
                    <div className="absolute top-2 left-10 flex flex-col items-center">
                      <TeamCrest teamId="real_madrid" size="sm" showMultiplier />
                    </div>
                    <div className="absolute top-2 right-10 flex flex-col items-center">
                      <TeamCrest teamId="barcelona" size="sm" showMultiplier />
                    </div>

                    {/* Middle Row: PSG (L) and Liverpool (R) */}
                    <div className="absolute top-1/3 left-1 flex flex-col items-center">
                      <TeamCrest teamId="psg" size="sm" showMultiplier />
                    </div>
                    <div className="absolute top-1/3 right-1 flex flex-col items-center">
                      <TeamCrest teamId="liverpool" size="sm" showMultiplier />
                    </div>

                    {/* Lower Row: AC Milan (L) and Bayern (R) */}
                    <div className="absolute bottom-1/4 left-1 flex flex-col items-center">
                      <TeamCrest teamId="ac_milan" size="sm" showMultiplier />
                    </div>
                    <div className="absolute bottom-1/4 right-1 flex flex-col items-center">
                      <TeamCrest teamId="bayern" size="sm" showMultiplier />
                    </div>

                    {/* Bottom Row: Juventus (L) and Man Utd (R) */}
                    <div className="absolute bottom-2 left-12 flex flex-col items-center">
                      <TeamCrest teamId="juventus" size="sm" showMultiplier />
                    </div>
                    <div className="absolute bottom-2 right-12 flex flex-col items-center">
                      <TeamCrest teamId="man_utd" size="sm" showMultiplier />
                    </div>

                    {/* Result Popup Overlay Modal when in RESULT phase */}
                    {gamePhase === 'RESULT_POPUP' && activeWinnerHighlight && (
                      <div className="absolute inset-2 bg-slate-950/90 rounded-xl border-2 border-amber-400 p-4 flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-rose-600 text-white font-mono font-black text-xs px-3 py-1 rounded-md mb-2">
                          NO. {currentRoundId}
                        </div>
                        <TeamCrest teamId={activeWinnerHighlight} size="xl" showMultiplier />
                        <span className="text-white font-bold text-base mt-2">
                          {TEAMS[activeWinnerHighlight]?.name}
                        </span>
                        <span className="text-amber-300 text-xs font-semibold mt-1">
                          Winning Multiplier: X{TEAMS[activeWinnerHighlight]?.multiplier}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom History and Round Number Bar */}
                  <div className="bg-black/60 backdrop-blur-xs p-1.5 rounded-lg flex items-center justify-between text-[10px] text-white">
                    <span className="text-slate-400">Result History</span>
                    <span className="font-mono text-amber-300 font-bold">NO. {currentRoundId}</span>
                  </div>
                </div>
              )}

              {/* Bounding Box Overlays (Calibration Visualization) */}
              {showOverlays && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Countdown Box */}
                  <div
                    className="absolute border border-dashed border-amber-400/80 bg-amber-400/10 flex items-center justify-center"
                    style={{
                      left: `${calibration.countdownArea.x * 100}%`,
                      top: `${calibration.countdownArea.y * 100}%`,
                      width: `${calibration.countdownArea.width * 100}%`,
                      height: `${calibration.countdownArea.height * 100}%`,
                    }}
                  >
                    <span className="text-[8px] font-mono text-amber-300 bg-black/60 px-1 rounded">Countdown ROI</span>
                  </div>

                  {/* Result Modal Area */}
                  <div
                    className="absolute border border-dashed border-emerald-400/70 bg-emerald-500/5 flex items-start justify-end"
                    style={{
                      left: `${calibration.resultPopupArea.x * 100}%`,
                      top: `${calibration.resultPopupArea.y * 100}%`,
                      width: `${calibration.resultPopupArea.width * 100}%`,
                      height: `${calibration.resultPopupArea.height * 100}%`,
                    }}
                  >
                    <span className="text-[8px] font-mono text-emerald-300 bg-black/70 px-1 rounded">Result Box ROI</span>
                  </div>

                  {/* Round Number Area */}
                  <div
                    className="absolute border border-dashed border-blue-400/80 bg-blue-400/10 flex items-center justify-center"
                    style={{
                      left: `${calibration.roundNumberArea.x * 100}%`,
                      top: `${calibration.roundNumberArea.y * 100}%`,
                      width: `${calibration.roundNumberArea.width * 100}%`,
                      height: `${calibration.roundNumberArea.height * 100}%`,
                    }}
                  >
                    <span className="text-[7px] font-mono text-blue-300 bg-black/60 px-1 rounded">Round ID ROI</span>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Verification Trigger Buttons */}
            <div className="mt-4 w-full">
              <span className="text-[11px] font-medium text-slate-400 block mb-2 text-center">
                Manual Verification Trigger (Simulate Winner Detection):
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_TEAMS_LIST.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setActiveWinnerHighlight(team.id);
                      onRecordResult(team.id, 98);
                      setTimeout(() => setActiveWinnerHighlight(null), 3000);
                    }}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-colors text-[10px] text-slate-200"
                  >
                    <TeamCrest teamId={team.id} size="xs" />
                    <span className="truncate max-w-full font-medium mt-0.5">{team.shortName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Decision Support & 8-Teams Ranking */}
        <div className="lg:col-span-6 space-y-4">
          {/* RULE: NO DECISION WHEN LIVE STATE IS UNCERTAIN */}
          {isStateUncertain ? (
            <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-black text-base uppercase tracking-wider">NO DECISION</h3>
                <p className="text-rose-300 font-bold text-sm mt-0.5">LIVE GAME STATE NOT CONFIRMED</p>
                <p className="text-slate-400 text-xs max-w-md mx-auto mt-2">
                  The application does not produce recommendations from stale or unconfirmed visual states. Please ensure the Boomplay Football League pitch is visible and unoccluded.
                </p>
              </div>
            </div>
          ) : (
            /* THE REQUIRED "FINAL MODEL DECISION" CARD */
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-black text-base uppercase tracking-wider">FINAL MODEL DECISION</h3>
                </div>
                <span
                  className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                    isPredictionFrozen
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isPredictionFrozen ? 'PREDICTION FROZEN' : 'FINAL MODEL SCORE'}
                </span>
              </div>

              {top1Team && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TeamCrest teamId={top1Team.teamId} size="md" />
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider leading-none">
                        Top Pick:
                      </span>
                      <span className="text-lg font-black text-white block mt-1 leading-tight">
                        {TEAMS[top1Team.teamId]?.name}
                      </span>
                      <span className="text-xs text-amber-300 font-semibold mt-1 block">
                        Multiplier: <strong>X{TEAMS[top1Team.teamId]?.multiplier}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider leading-none">
                      Model Score:
                    </span>
                    <span className="text-2xl font-mono font-black text-emerald-400 leading-tight block mt-1">
                      {top1Team.totalScore}
                    </span>
                  </div>
                </div>
              )}

              {/* Second and Third Candidates */}
              {top2Team && top3Team && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Second:</span>
                      <span className="text-sm font-bold text-white block mt-0.5">
                        {TEAMS[top2Team.teamId]?.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-black text-emerald-400">{top2Team.totalScore}</span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Third:</span>
                      <span className="text-sm font-bold text-white block mt-0.5">
                        {TEAMS[top3Team.teamId]?.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-black text-emerald-400">{top3Team.totalScore}</span>
                  </div>
                </div>
              )}

              {/* Audit & Compliance Footnote */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
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

          {/* Full 8-Team Live Model Scores */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-bold text-sm">Full 8-Team Live Model Scores</h4>
              <span className="text-[11px] text-slate-400">Strictly Observational</span>
            </div>

            <div className="space-y-2">
              {prediction?.rankings.map((item) => {
                const team = TEAMS[item.teamId];
                if (!team) return null;

                return (
                  <div
                    key={item.teamId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs w-4 text-slate-400">#{item.rank}</span>
                      <TeamCrest teamId={item.teamId} size="xs" />
                      <div>
                        <div className="text-white font-semibold text-xs leading-tight">{team.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Multiplier: <strong>X{team.multiplier}</strong></span>
                          <span>•</span>
                          <span>Gap: <strong>{item.rawSignals.roundsSinceLastAppearance} rnds</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${item.totalScore}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-400 w-10 text-right">
                        {item.totalScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
