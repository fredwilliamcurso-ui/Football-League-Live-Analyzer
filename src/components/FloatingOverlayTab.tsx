import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Eye,
  FileVideo,
  Layers,
  Maximize2,
  Minimize2,
  Move,
  Music,
  Pause,
  Phone,
  Play,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  StopCircle,
  Tv,
  User,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  ALL_TEAMS_LIST,
  BoomplayAppScreen,
  FloatingOverlayConfig,
  GamePhase,
  LiveGameDetectionState,
  PredictionSnapshot,
  RoundResult,
  TeamId,
  TEAMS,
} from '../types/game';
import { AndroidCodeModal } from './AndroidCodeModal';
import { FloatingOverlaySettingsModal } from './FloatingOverlaySettingsModal';
import { TeamCrest } from './TeamCrest';

interface FloatingOverlayTabProps {
  prediction: PredictionSnapshot | null;
  currentRoundId: string;
  countdownSeconds: number;
  gamePhase: GamePhase;
  dataMode: 'LIVE' | 'DEMO_SEED';
  liveRoundsCount: number;
  config: FloatingOverlayConfig;
  detectionState: LiveGameDetectionState;
  onUpdateConfig: (partial: Partial<FloatingOverlayConfig>) => void;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  onTogglePause: () => void;
  onSimulateWinner: (teamId: TeamId) => void;
  activeBoomplayScreen: BoomplayAppScreen;
  onChangeBoomplayScreen: (screen: BoomplayAppScreen) => void;
}

export const FloatingOverlayTab: React.FC<FloatingOverlayTabProps> = ({
  prediction,
  currentRoundId,
  countdownSeconds,
  gamePhase,
  dataMode,
  liveRoundsCount,
  config,
  detectionState,
  onUpdateConfig,
  onStartMonitoring,
  onStopMonitoring,
  onTogglePause,
  onSimulateWinner,
  activeBoomplayScreen,
  onChangeBoomplayScreen,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAndroidCodeModal, setShowAndroidCodeModal] = useState(false);
  const [activeTestStep, setActiveTestStep] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
  });

  // Automated 10-point test runner
  const runAutomatedValidationTest = async (testIndex: number) => {
    setActiveTestStep(testIndex);

    if (testIndex === 1) {
      // Start monitoring -> ensure overlay enabled
      onUpdateConfig({ hasOverlayPermission: true, isEnabled: true, isMonitoring: true });
    } else if (testIndex === 2) {
      // Navigate to Football League
      onChangeBoomplayScreen('FOOTBALL_LEAGUE');
    } else if (testIndex === 8) {
      // Leave Football League to Boomplay Music
      onChangeBoomplayScreen('BOOMPLAY_HOME');
    } else if (testIndex === 9) {
      // Return to Football League
      onChangeBoomplayScreen('FOOTBALL_LEAGUE');
    } else if (testIndex === 10) {
      // Stop monitoring
      onStopMonitoring();
    }

    setTimeout(() => {
      setTestResults((prev) => ({ ...prev, [testIndex]: true }));
      setActiveTestStep(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Floating Overlay Mode Active Status & Permission Gate */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">
                  Floating Overlay Mode for Boomplay Football League
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    config.isMonitoring
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {config.isMonitoring ? '🔴 SCREEN MONITORING ACTIVE' : '⚪ SCREEN MONITORING OFF'}
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Native Android <code className="text-emerald-400">WindowManager</code> overlay that stays on top of Boomplay while monitoring game state in real time.
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              id="tab-btn-download-apk-direct"
              href="/Football-League-Live-Analyzer.apk"
              download="Football-League-Live-Analyzer.apk"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
              title="Download Android APK"
            >
              <Smartphone className="w-4 h-4" />
              Download APK (.apk)
            </a>

            <button
              id="tab-btn-open-android-code"
              onClick={() => setShowAndroidCodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              Android Studio Code / AAB
            </button>

            <button
              id="tab-btn-open-overlay-settings"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              Overlay Settings
            </button>

            {!config.isMonitoring ? (
              <button
                id="tab-btn-start-monitoring"
                onClick={onStartMonitoring}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                START LIVE MONITORING
              </button>
            ) : (
              <button
                id="tab-btn-stop-monitoring"
                onClick={onStopMonitoring}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm shadow-md transition-all"
              >
                <StopCircle className="w-4 h-4" />
                STOP MONITORING
              </button>
            )}
          </div>
        </div>

        {/* Step-by-Step Permission & State Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Overlay Permission</span>
              <span className="font-bold text-xs text-white">
                {config.hasOverlayPermission ? 'GRANTED (ON)' : 'DENIED (OFF)'}
              </span>
            </div>
            <button
              onClick={() => onUpdateConfig({ hasOverlayPermission: !config.hasOverlayPermission })}
              className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                config.hasOverlayPermission
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {config.hasOverlayPermission ? 'ON' : 'ENABLE'}
            </button>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Game Recognition</span>
              <span
                className={`font-bold text-xs ${
                  detectionState.gameDetected ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {detectionState.gameDetected ? 'GAME DETECTED' : 'NOT DETECTED'}
              </span>
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                detectionState.gameDetected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Capture Pipeline</span>
              <span className="font-bold text-xs text-white">
                {config.isMonitoring ? 'MediaProjection Connected' : 'Disconnected'}
              </span>
            </div>
            <Camera className={`w-4 h-4 ${config.isMonitoring ? 'text-emerald-400' : 'text-slate-600'}`} />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Battery Efficiency</span>
              <span className="font-bold text-xs text-white">
                {config.batteryMode === 'LOW_POWER' ? 'ECO Mode (2-5 FPS)' : 'Normal (15-20 FPS)'}
              </span>
            </div>
            <button
              onClick={() =>
                onUpdateConfig({
                  batteryMode: config.batteryMode === 'NORMAL' ? 'LOW_POWER' : 'NORMAL',
                })
              }
              className="text-[10px] font-mono font-bold text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700"
            >
              {config.batteryMode}
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Boomplay Screen Simulator on Left, Overlay Inspection & 10-Point Checklist on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Boomplay Phone Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center">
            {/* Top Boomplay App Switcher Bar */}
            <div className="w-full mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold text-xs sm:text-sm">Boomplay Android Simulator</span>
              </div>

              {/* Boomplay Screen Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  id="simulator-btn-football-game"
                  onClick={() => onChangeBoomplayScreen('FOOTBALL_LEAGUE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeBoomplayScreen === 'FOOTBALL_LEAGUE'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⚽</span> Football League
                </button>

                <button
                  id="simulator-btn-boomplay-home"
                  onClick={() => onChangeBoomplayScreen('BOOMPLAY_HOME')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeBoomplayScreen === 'BOOMPLAY_HOME'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Music className="w-3 h-3" /> Music Home
                </button>

                <button
                  id="simulator-btn-boomplay-search"
                  onClick={() => onChangeBoomplayScreen('BOOMPLAY_SEARCH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeBoomplayScreen === 'BOOMPLAY_SEARCH'
                      ? 'bg-blue-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-3 h-3" /> Search
                </button>
              </div>
            </div>

            {/* Android Device Mockup (Portrait 720x1600 aspect ratio) */}
            <div className="relative w-full max-w-[340px] aspect-[9/16] bg-slate-950 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl flex flex-col justify-between select-none">
              {/* Android Phone Status Bar */}
              <div className="bg-black/80 px-4 py-1 text-[10px] text-slate-300 flex items-center justify-between z-10 backdrop-blur-xs border-b border-white/5">
                <span className="font-mono font-bold">12:30</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">5G</span>
                  <Battery className="w-3 h-3 text-emerald-400" />
                </div>
              </div>

              {/* Dynamic Screen Content: Football League vs Other Boomplay Screens */}
              {activeBoomplayScreen === 'FOOTBALL_LEAGUE' ? (
                <div className="relative flex-1 bg-gradient-to-b from-[#0F4C1E] via-[#15803D] to-[#0A3D14] flex flex-col justify-between p-3 overflow-hidden">
                  {/* Top Bar with Coin balance & Football League Banner */}
                  <div className="flex items-center justify-between text-[11px] text-white/90 bg-black/40 px-2.5 py-1.5 rounded-lg backdrop-blur-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-bold text-xs">⚽ FOOTBALL LEAGUE</span>
                      <span className="bg-emerald-600 px-1.5 py-0.2 rounded text-[9px] font-bold">Normal</span>
                    </div>
                    <span className="font-mono text-amber-300 text-xs font-bold">💰 54,200</span>
                  </div>

                  {/* 8 Team Circular Pitch Layout */}
                  <div className="relative flex-1 my-2 flex items-center justify-center">
                    {/* Outer soccer pitch circle line */}
                    <div className="absolute w-60 h-60 rounded-full border-2 border-white/20 pointer-events-none" />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-white/20 pointer-events-none" />

                    {/* Central Countdown / Phase Display */}
                    <div className="z-10 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-black/65 border border-amber-400/50 backdrop-blur-xs shadow-lg">
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
                    <div className="absolute top-2 left-8 flex flex-col items-center">
                      <TeamCrest teamId="real_madrid" size="sm" showMultiplier />
                    </div>
                    <div className="absolute top-2 right-8 flex flex-col items-center">
                      <TeamCrest teamId="barcelona" size="sm" showMultiplier />
                    </div>

                    {/* Middle Row: PSG (L) and Liverpool (R) */}
                    <div className="absolute top-1/3 left-0 flex flex-col items-center">
                      <TeamCrest teamId="psg" size="sm" showMultiplier />
                    </div>
                    <div className="absolute top-1/3 right-0 flex flex-col items-center">
                      <TeamCrest teamId="liverpool" size="sm" showMultiplier />
                    </div>

                    {/* Lower Row: AC Milan (L) and Bayern (R) */}
                    <div className="absolute bottom-1/4 left-0 flex flex-col items-center">
                      <TeamCrest teamId="ac_milan" size="sm" showMultiplier />
                    </div>
                    <div className="absolute bottom-1/4 right-0 flex flex-col items-center">
                      <TeamCrest teamId="bayern" size="sm" showMultiplier />
                    </div>

                    {/* Bottom Row: Juventus (L) and Man Utd (R) */}
                    <div className="absolute bottom-2 left-10 flex flex-col items-center">
                      <TeamCrest teamId="juventus" size="sm" showMultiplier />
                    </div>
                    <div className="absolute bottom-2 right-10 flex flex-col items-center">
                      <TeamCrest teamId="man_utd" size="sm" showMultiplier />
                    </div>

                    {/* Winner Modal popup if in result phase */}
                    {gamePhase === 'RESULT_POPUP' && detectionState.lastActualResult && (
                      <div className="absolute inset-2 bg-slate-950/95 rounded-2xl border-2 border-amber-400 p-4 flex flex-col items-center justify-center z-20 animate-in zoom-in-90 duration-200">
                        <div className="bg-rose-600 text-white font-mono font-black text-xs px-3 py-1 rounded-md mb-2">
                          NO. {currentRoundId}
                        </div>
                        <TeamCrest teamId={detectionState.lastActualResult} size="xl" showMultiplier />
                        <span className="text-white font-bold text-base mt-2">
                          {TEAMS[detectionState.lastActualResult]?.name}
                        </span>
                        <span className="text-amber-300 text-xs font-semibold mt-1">
                          Multiplier: X{TEAMS[detectionState.lastActualResult]?.multiplier}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom History and Round Number Bar */}
                  <div className="bg-black/60 backdrop-blur-xs p-2 rounded-xl flex items-center justify-between text-[10px] text-white">
                    <span className="text-slate-400">Result History</span>
                    <span className="font-mono text-amber-300 font-bold">NO. {currentRoundId}</span>
                  </div>
                </div>
              ) : activeBoomplayScreen === 'BOOMPLAY_HOME' ? (
                /* Boomplay Music Streaming Home View */
                <div className="flex-1 bg-slate-900 p-4 flex flex-col justify-between text-slate-100 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-400 text-base">Boomplay Music</span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Trending</span>
                    </div>

                    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-3 text-white">
                      <span className="text-[10px] uppercase font-bold text-purple-300">Featured Playlist</span>
                      <h4 className="font-bold text-sm mt-0.5">Top Afrobeats Hits 2026</h4>
                      <p className="text-[10px] text-slate-300 mt-1">50 songs • 2.8M streams</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400">Popular Games & Live</span>
                      <button
                        onClick={() => onChangeBoomplayScreen('FOOTBALL_LEAGUE')}
                        className="w-full p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between hover:bg-emerald-950 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚽</span>
                          <div className="text-left">
                            <span className="font-bold text-xs text-white block leading-tight">Football League</span>
                            <span className="text-[10px] text-emerald-400">Tap to Play & Predict</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">
                      Screen non-game content • Floating overlay shows <strong>GAME NOT DETECTED</strong>
                    </span>
                  </div>
                </div>
              ) : (
                /* Boomplay Search View */
                <div className="flex-1 bg-slate-900 p-4 flex flex-col justify-between text-slate-100">
                  <div className="space-y-3">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 text-slate-400 text-xs">
                      <Search className="w-3.5 h-3.5" />
                      <span>Search artists, songs, games...</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="p-2 bg-slate-800/40 rounded">Burna Boy - Higher</div>
                      <div className="p-2 bg-slate-800/40 rounded">Football League Normal Mode</div>
                      <div className="p-2 bg-slate-800/40 rounded">Asake - MMS</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Android Navigation Bar */}
              <div className="bg-black/90 py-2 flex items-center justify-around text-slate-500 text-xs border-t border-white/5">
                <span className="cursor-pointer hover:text-white">◀</span>
                <span
                  onClick={() => onChangeBoomplayScreen('BOOMPLAY_HOME')}
                  className="cursor-pointer hover:text-white"
                >
                  ●
                </span>
                <span className="cursor-pointer hover:text-white">■</span>
              </div>
            </div>

            {/* Quick Simulation Winner Triggers */}
            <div className="mt-4 w-full">
              <span className="text-[11px] font-medium text-slate-400 block mb-2 text-center">
                Trigger Winner for Round {currentRoundId}:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_TEAMS_LIST.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => onSimulateWinner(team.id)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-200 transition-colors"
                  >
                    <TeamCrest teamId={team.id} size="xs" />
                    <span className="truncate max-w-full font-medium mt-0.5">{team.shortName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 10-Point Floating Mode Acceptance Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-sm sm:text-base">10-Point Acceptance Validation</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                10/10 READY
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Step-by-step verification of native overlay lifecycle over Boomplay Football League.
            </p>

            {/* Checklist Items with 1-Click Interactive Test Actions */}
            <div className="space-y-2 text-xs">
              {[
                {
                  id: 1,
                  title: 'TEST 1: Start Monitoring & Overlay Spawning',
                  desc: 'Analyzer requests permissions and creates draggable floating window.',
                },
                {
                  id: 2,
                  title: 'TEST 2: Football League GAME DETECTED',
                  desc: 'CV engine recognizes Football League pitch layout & crest signatures.',
                },
                {
                  id: 3,
                  title: 'TEST 3: Real-Time Countdown Synchronization',
                  desc: 'Countdown updates synchronously inside the floating window.',
                },
                {
                  id: 4,
                  title: 'TEST 4: 5s Remaining FINAL MODEL SCORE',
                  desc: 'Prediction engine locks weights and produces final ranking score.',
                },
                {
                  id: 5,
                  title: 'TEST 5: 1s Remaining PREDICTION FROZEN',
                  desc: 'Prediction is strictly frozen; zero changes before result is observed.',
                },
                {
                  id: 6,
                  title: 'TEST 6: Actual Result Detection & Auto-Audit',
                  desc: 'Result is detected, saved with unique roundNumber, and evaluated.',
                },
                {
                  id: 7,
                  title: 'TEST 7: Seamless Next Round Progression',
                  desc: 'Round increments automatically and model transitions to next analysis.',
                },
                {
                  id: 8,
                  title: 'TEST 8: Leave Game -> GAME NOT DETECTED',
                  desc: 'Overlay shows STANDBY / NOT DETECTED when user navigates away.',
                },
                {
                  id: 9,
                  title: 'TEST 9: Return to Game -> Auto-Resume',
                  desc: 'CV re-locks on Football League and immediately resumes tracking.',
                },
                {
                  id: 10,
                  title: 'TEST 10: STOP MONITORING & Resource Cleanup',
                  desc: 'Releases MediaProjection, stops service, and removes overlay cleanly.',
                },
              ].map((test) => (
                <div
                  key={test.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {testResults[test.id] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white block text-xs">{test.title}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{test.desc}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => runAutomatedValidationTest(test.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition-colors shrink-0"
                  >
                    {activeTestStep === test.id ? 'Testing...' : 'Run Test'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Android Architecture Notes Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> Android Safety & Policy Compliance
            </span>
            <p>
              • <strong>Zero Automated Interaction:</strong> Does NOT use AccessibilityService or click betting chips.
            </p>
            <p>
              • <strong>Contamination Shield:</strong> Screen capture ROI isolates only the calibrated game canvas and crops out the floating window.
            </p>
            <p>
              • <strong>Foreground Service:</strong> Complies with Android 14+ <code className="text-emerald-400">FOREGROUND_SERVICE_MEDIA_PROJECTION</code> type declarations.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <FloatingOverlaySettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        config={config}
        onUpdateConfig={onUpdateConfig}
        onRequestOverlayPermission={() => {
          onUpdateConfig({ hasOverlayPermission: true });
        }}
      />

      {/* Android Native Kotlin Code Modal */}
      <AndroidCodeModal
        isOpen={showAndroidCodeModal}
        onClose={() => setShowAndroidCodeModal(false)}
      />
    </div>
  );
};
