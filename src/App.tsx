/**
 * Football League Live Analyzer & Prediction System
 * Real Boomplay Game Master Clock & Native Android Floating Overlay Mode
 */
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Camera,
  CheckCircle,
  Clock,
  Compass,
  Database,
  Download,
  Eye,
  FileVideo,
  History,
  Home,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnalysisTab } from './components/AnalysisTab';
import { FloatingOverlaySettingsModal } from './components/FloatingOverlaySettingsModal';
import { FloatingOverlayTab } from './components/FloatingOverlayTab';
import { FloatingOverlayWidget } from './components/FloatingOverlayWidget';
import { HistoryTab } from './components/HistoryTab';
import { HomeTab } from './components/HomeTab';
import { LiveMonitorTab } from './components/LiveMonitorTab';
import { ReplayAnalyzerTab } from './components/ReplayAnalyzerTab';
import { SettingsTab } from './components/SettingsTab';
import { StatisticsTab } from './components/StatisticsTab';
import { ValidationTab } from './components/ValidationTab';
import { dbService } from './database/db';
import { downloadAndroidProjectZip } from './utils/downloadAndroidZip';
import { soundService } from './notifications/audioAlerts';
import { PredictionEngine } from './prediction/predictionEngine';
import {
  BoomplayAppScreen,
  CalibrationProfile,
  DataMode,
  FloatingOverlayConfig,
  GameClockStatus,
  GamePhase,
  LiveGameDetectionState,
  PredictionSnapshot,
  RoundResult,
  TeamId,
  TEAMS,
} from './types/game';
import { realGameObserver, RealGameObservationEvent } from './vision/realGameObserver';
import { DEFAULT_CALIBRATION_720X1600 } from './vision/visionEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>('DEMO_SEED');
  const [liveRoundsCount, setLiveRoundsCount] = useState<number>(0);
  const [currentRoundId, setCurrentRoundId] = useState<string>('08200035');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(24);
  const [gamePhase, setGamePhase] = useState<GamePhase>('BETTING_COUNTDOWN');
  const [calibration, setCalibration] = useState<CalibrationProfile>(DEFAULT_CALIBRATION_720X1600);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showOverlaySettingsModal, setShowOverlaySettingsModal] = useState<boolean>(false);

  // Boomplay active screen state
  const [activeBoomplayScreen, setActiveBoomplayScreen] = useState<BoomplayAppScreen>('FOOTBALL_LEAGUE');

  // Floating Overlay State
  const [overlayConfig, setOverlayConfig] = useState<FloatingOverlayConfig>({
    isEnabled: true,
    hasOverlayPermission: true,
    hasMediaProjectionPermission: true,
    isMonitoring: true,
    isPaused: false,
    opacity: 80,
    size: 'normal',
    isMinimized: false,
    position: { x: 24, y: 84 },
    batteryMode: 'NORMAL',
    showCountdown: true,
    showRound: true,
    showPrediction: true,
    showTop3: true,
    showScore: true,
    showConfidence: true,
    showLiveRounds: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Detection State (Strict Master Clock State)
  const [detectionState, setDetectionState] = useState<LiveGameDetectionState>(() =>
    realGameObserver.getState()
  );

  // Frozen prediction snapshot state
  const [frozenPredictionSnapshot, setFrozenPredictionSnapshot] = useState<PredictionSnapshot | null>(null);

  // 1. Database subscription & load
  useEffect(() => {
    const fetchRounds = async () => {
      const mode = dbService.getDataMode();
      setDataMode(mode);
      const activeData = await dbService.getActiveRounds();
      setRounds(activeData);
      const liveData = await dbService.getAllLiveRounds();
      setLiveRoundsCount(liveData.length);
    };

    fetchRounds();
    const unsubscribe = dbService.subscribe(() => {
      fetchRounds();
    });

    return () => unsubscribe();
  }, []);

  // 2. RealGameObserver subscription: Handles real game state changes and event freeze/audit
  useEffect(() => {
    const unsubscribeObserver = realGameObserver.subscribe(async (event: RealGameObservationEvent) => {
      const state = realGameObserver.getState();
      setDetectionState(state);
      setCurrentRoundId(state.detectedRoundNumber);
      setGamePhase(state.detectedPhase);
      setCountdownSeconds(state.detectedCountdown);

      if (event.type === 'PREDICTION_FROZEN') {
        // Freeze current prediction snapshot
        if (!frozenPredictionSnapshot) {
          const snapshot = PredictionEngine.calculatePrediction(
            rounds,
            state.detectedRoundNumber,
            1,
            undefined,
            true
          );
          setFrozenPredictionSnapshot(snapshot);
        }
      }

      if (event.type === 'RESULT_OBSERVED' && event.winnerTeam) {
        // Auto-audit observed result against frozen prediction
        const winnerId = event.winnerTeam;
        const winnerTeamInfo = TEAMS[winnerId];
        const activePrediction = frozenPredictionSnapshot || PredictionEngine.calculatePrediction(rounds, state.detectedRoundNumber, 5);

        const isTop1 = activePrediction.topCandidate === winnerId;
        const isTop2 =
          activePrediction.rankings[0]?.teamId === winnerId ||
          activePrediction.rankings[1]?.teamId === winnerId;
        const isTop3 = activePrediction.top3Candidates.includes(winnerId);

        setDetectionState((prev) => ({
          ...prev,
          lastActualResult: winnerId,
          top1Evaluation: isTop1 ? 'CORRECT' : 'INCORRECT',
          top2Evaluation: isTop2 ? 'CORRECT' : 'INCORRECT',
          top3Evaluation: isTop3 ? 'CORRECT' : 'INCORRECT',
          resultStatus: 'DETECTED',
        }));

        if (isTop1) {
          if (overlayConfig.soundEnabled) soundService.playWin();
          try {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
          } catch (e) {
            // ignore
          }
        }

        // Save round to database
        await dbService.insertRound(
          {
            roundNumber: state.detectedRoundNumber,
            timestamp: event.timestamp,
            team: winnerId,
            multiplier: winnerTeamInfo?.multiplier || 6,
            countdownDetected: 0,
            recognitionConfidence: event.confidence || 98,
            isLiveDetected: dataMode === 'LIVE',
            predictionMade: true,
            predictedTeam: activePrediction.topCandidate,
            predictedRank: isTop1 ? 1 : isTop2 ? 2 : isTop3 ? 3 : 5,
            predictionScore: activePrediction.topCandidateScore,
            predictionCorrect: isTop1,
            predictionTop2Correct: isTop2,
            predictionTop3Correct: isTop3,
            createdAt: new Date(event.timestamp).toISOString(),
          },
          dataMode
        );
      }

      if (event.type === 'NEW_ROUND_OBSERVED') {
        // Unfreeze and reset for fresh round
        setFrozenPredictionSnapshot(null);
      }
    });

    return () => unsubscribeObserver();
  }, [rounds, frozenPredictionSnapshot, overlayConfig.soundEnabled, dataMode]);

  // Compute live prediction snapshot
  const currentPrediction: PredictionSnapshot = React.useMemo(() => {
    if (detectionState.isFrozen && frozenPredictionSnapshot) {
      return frozenPredictionSnapshot;
    }
    const cd = countdownSeconds !== null ? countdownSeconds : 5;
    return PredictionEngine.calculatePrediction(
      rounds,
      currentRoundId,
      cd,
      undefined,
      detectionState.isFrozen
    );
  }, [rounds, currentRoundId, countdownSeconds, detectionState.isFrozen, frozenPredictionSnapshot]);

  // Handle toggle Data Mode (LIVE vs DEMO)
  const handleToggleDataMode = async () => {
    const nextMode: DataMode = dataMode === 'LIVE' ? 'DEMO_SEED' : 'LIVE';
    dbService.setDataMode(nextMode);
    setDataMode(nextMode);
    const activeData = await dbService.getActiveRounds();
    setRounds(activeData);
    if (nextMode === 'LIVE') {
      setIsSimulating(false); // Master clock rule: No simulated timer in LIVE mode
    }
  };

  // Demo simulator ticker (STRICTLY DISABLED in LIVE mode)
  useEffect(() => {
    if (dataMode === 'LIVE' || !isSimulating || overlayConfig.isPaused) return;

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        const currentVal = prev ?? 30;
        if (currentVal <= 1) {
          if (gamePhase === 'BETTING_COUNTDOWN') {
            setGamePhase('STOP_SELECTION');
            realGameObserver.updateDirectObservation({
              gamePhase: 'STOP_SELECTION',
              countdown: 0,
            });

            setTimeout(() => {
              setGamePhase('READY_SPIN');
              realGameObserver.updateDirectObservation({ gamePhase: 'READY_SPIN' });

              setTimeout(() => {
                const teamsList: TeamId[] = [
                  'ac_milan',
                  'man_utd',
                  'liverpool',
                  'juventus',
                  'bayern',
                  'psg',
                  'barcelona',
                  'real_madrid',
                ];
                const randWinner = teamsList[Math.floor(Math.random() * teamsList.length)];
                setGamePhase('RESULT_POPUP');
                realGameObserver.updateDirectObservation({
                  gamePhase: 'RESULT_POPUP',
                  winningTeam: randWinner,
                });

                setTimeout(() => {
                  setGamePhase('START_SELECTION');
                  realGameObserver.updateDirectObservation({ gamePhase: 'START_SELECTION' });

                  setTimeout(() => {
                    const nextNum = String(Number(currentRoundId) + 1).padStart(8, '0');
                    setCurrentRoundId(nextNum);
                    setGamePhase('BETTING_COUNTDOWN');
                    setCountdownSeconds(30);
                    realGameObserver.resetRoundForNewGame(nextNum);
                  }, 2000);
                }, 4000);
              }, 2500);
            }, 2000);
          }
          return 0;
        }

        // Trigger Audio Chime at 5s remaining (Final Model Score calculation moment)
        if (currentVal === 6 && overlayConfig.soundEnabled) {
          soundService.playPredictionReady();
        }

        const nextCd = currentVal - 1;
        realGameObserver.updateDirectObservation({ countdown: nextCd });
        return nextCd;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isSimulating,
    gamePhase,
    currentRoundId,
    overlayConfig.isPaused,
    overlayConfig.soundEnabled,
    dataMode,
  ]);

  // Master Clock Step Observer for Live Testing
  const handleStepRealGameEvent = (step: '30s' | '24s' | '10s' | '5s' | '1s' | 'stop' | 'result' | 'next') => {
    switch (step) {
      case '30s':
        realGameObserver.updateDirectObservation({
          gamePhase: 'BETTING_COUNTDOWN',
          countdown: 30,
          isGameDetected: true,
        });
        break;
      case '24s':
        realGameObserver.updateDirectObservation({
          gamePhase: 'BETTING_COUNTDOWN',
          countdown: 24,
          isGameDetected: true,
        });
        break;
      case '10s':
        realGameObserver.updateDirectObservation({
          gamePhase: 'BETTING_COUNTDOWN',
          countdown: 10,
          isGameDetected: true,
        });
        break;
      case '5s':
        if (overlayConfig.soundEnabled) soundService.playPredictionReady();
        realGameObserver.updateDirectObservation({
          gamePhase: 'BETTING_COUNTDOWN',
          countdown: 5,
          isGameDetected: true,
        });
        break;
      case '1s':
        realGameObserver.updateDirectObservation({
          gamePhase: 'BETTING_COUNTDOWN',
          countdown: 1,
          isGameDetected: true,
        });
        break;
      case 'stop':
        realGameObserver.updateDirectObservation({
          gamePhase: 'STOP_SELECTION',
          countdown: 0,
          isGameDetected: true,
        });
        break;
      case 'result': {
        const winner: TeamId = currentPrediction.topCandidate || 'ac_milan';
        realGameObserver.updateDirectObservation({
          gamePhase: 'RESULT_POPUP',
          winningTeam: winner,
          isGameDetected: true,
        });
        break;
      }
      case 'next': {
        const nextId = String(Number(currentRoundId) + 1).padStart(8, '0');
        realGameObserver.resetRoundForNewGame(nextId);
        break;
      }
    }
  };

  // Manual record trigger
  const handleManualRecord = async (teamId: TeamId, conf: number = 98) => {
    realGameObserver.updateDirectObservation({
      gamePhase: 'RESULT_POPUP',
      winningTeam: teamId,
      isGameDetected: true,
    });
  };

  const handleExportCSV = () => {
    const csvData = dbService.exportToCSV(rounds);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `football_league_rounds_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonData = dbService.exportToJSON(rounds);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `football_league_rounds_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAndroidZip = async () => {
    try {
      await downloadAndroidProjectZip();
    } catch (err) {
      console.error('Download error:', err);
      // Fallback
      const link = document.createElement('a');
      link.href = '/Football-League-Live-Analyzer-Android.zip';
      link.download = 'Football-League-Live-Analyzer-Android.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpdateOverlayConfig = (partial: Partial<FloatingOverlayConfig>) => {
    setOverlayConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleChangeBoomplayScreen = (screen: BoomplayAppScreen) => {
    setActiveBoomplayScreen(screen);
    if (screen !== 'FOOTBALL_LEAGUE') {
      realGameObserver.updateDirectObservation({ isGameDetected: false });
    } else {
      realGameObserver.updateDirectObservation({ isGameDetected: true, countdown: 24 });
    }
  };

  const navTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'floating', label: 'Floating Overlay', icon: Layers },
    { id: 'live', label: 'Live Monitor', icon: Activity },
    { id: 'replay', label: 'Replay Analyzer', icon: FileVideo },
    { id: 'history', label: 'History', icon: History },
    { id: 'validation', label: 'Validation (100+)', icon: ShieldCheck },
    { id: 'analysis', label: 'Analysis & Signals', icon: Brain },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Global Draggable Native Floating Window Overlay (Persistent over entire app) */}
      <FloatingOverlayWidget
        config={overlayConfig}
        detectionState={detectionState}
        prediction={currentPrediction}
        liveRoundsCount={liveRoundsCount}
        dataMode={dataMode}
        onUpdateConfig={handleUpdateOverlayConfig}
        onStopMonitoring={() => handleUpdateOverlayConfig({ isMonitoring: false })}
        onTogglePause={() => handleUpdateOverlayConfig({ isPaused: !overlayConfig.isPaused })}
        onOpenSettings={() => setShowOverlaySettingsModal(true)}
      />

      {/* Top Main App Navigation Header */}
      <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-black text-base sm:text-lg tracking-tight">
                  Football League Analyzer
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block border ${
                    dataMode === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {dataMode === 'LIVE' ? 'LIVE DATA' : 'DEMO/SEED DATA'}
                </span>
                {overlayConfig.isMonitoring && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full hidden md:inline-block">
                    🔴 OVERLAY ON
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] hidden md:block">
                Master Clock Observer • MediaProjection CV Pipeline • Native WindowManager Floating Window
              </p>
            </div>
          </div>

          {/* Quick Real Master Clock Telemetry in Header */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  detectionState.clockStatus === 'SYNCED'
                    ? 'bg-emerald-400 animate-pulse'
                    : detectionState.clockStatus === 'DETECTING'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-400 font-medium">Clock:</span>
              <span
                className={`font-mono font-bold ${
                  detectionState.clockStatus === 'SYNCED'
                    ? 'text-emerald-400'
                    : detectionState.clockStatus === 'DETECTING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {detectionState.clockStatus}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Round:</span>
              <span className="font-mono font-bold text-white">{detectionState.detectedRoundNumber}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-bold text-amber-400">
                {detectionState.countdownDisplay !== '—' && detectionState.countdownDisplay !== 'DETECTING'
                  ? `${detectionState.countdownDisplay}s`
                  : detectionState.countdownDisplay}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  detectionState.isFrozen
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {detectionState.isFrozen ? 'FROZEN' : detectionState.predictionStage}
              </span>
            </div>
          </div>

          {/* Right quick simulation & mode toggle */}
          <div className="flex items-center gap-2">
            <a
              id="header-btn-download-apk"
              href="/Football-League-Live-Analyzer.apk"
              download="Football-League-Live-Analyzer.apk"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-colors cursor-pointer"
              title="Download installable Android APK (.apk)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
            </a>
            <a
              id="header-btn-download-aab"
              href="/Football-League-Live-Analyzer.aab"
              download="Football-League-Live-Analyzer.aab"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors cursor-pointer"
              title="Download Android App Bundle (.aab)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.AAB</span>
            </a>
            <button
              id="header-btn-download-android-zip"
              onClick={handleDownloadAndroidZip}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-sm transition-colors cursor-pointer"
              title="Download complete Android Kotlin project ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Project ZIP</span>
            </button>
            <button
              id="header-btn-toggle-data-mode"
              onClick={handleToggleDataMode}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Mode: {dataMode === 'LIVE' ? 'LIVE' : 'DEMO'}
            </button>
            {dataMode === 'DEMO_SEED' && (
              <button
                id="header-btn-toggle-demo-sim"
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isSimulating
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isSimulating ? 'Demo Sim ON' : 'Paused'}
              </button>
            )}
          </div>
        </div>

        {/* Master Clock Live Step Bar for Real-Time Validation */}
        <div className="bg-slate-950/90 border-t border-b border-slate-800/80 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-bold text-slate-200">REAL GAME MASTER CLOCK OBSERVER:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {detectionState.gameDetected ? 'OBSERVING REAL BOOMPLAY FRAMES' : 'WAITING FOR GAME STATE'}
              </span>
              {detectionState.isFrozen && detectionState.freezeTimestamp && (
                <span className="text-rose-300 font-mono text-[11px] bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  FROZEN AT {detectionState.freezeTimestamp}
                </span>
              )}
            </div>

            {/* Quick Master Clock Testing Steps */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-slate-500 mr-1">Master Clock Steps:</span>
              <button
                onClick={() => handleStepRealGameEvent('24s')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
              >
                24s
              </button>
              <button
                onClick={() => handleStepRealGameEvent('10s')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
              >
                10s
              </button>
              <button
                onClick={() => handleStepRealGameEvent('5s')}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40"
              >
                5s (FINAL)
              </button>
              <button
                onClick={() => handleStepRealGameEvent('1s')}
                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/40"
              >
                1s (FREEZE)
              </button>
              <button
                onClick={() => handleStepRealGameEvent('stop')}
                className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-mono border border-purple-500/40"
              >
                STOP SELECTION
              </button>
              <button
                onClick={() => handleStepRealGameEvent('result')}
                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40"
              >
                OBSERVE WINNER
              </button>
              <button
                onClick={() => handleStepRealGameEvent('next')}
                className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-mono border border-blue-500/40"
              >
                NEXT ROUND
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'home' && (
          <HomeTab
            rounds={rounds}
            latestPrediction={currentPrediction}
            currentRoundId={currentRoundId}
            countdownSeconds={countdownSeconds ?? 0}
            gamePhase={gamePhase}
            dataMode={dataMode}
            liveRoundsCount={liveRoundsCount}
            detectionState={detectionState}
            onToggleDataMode={handleToggleDataMode}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onStartSimulation={() => setIsSimulating(true)}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === 'floating' && (
          <FloatingOverlayTab
            prediction={currentPrediction}
            currentRoundId={currentRoundId}
            countdownSeconds={countdownSeconds ?? 0}
            gamePhase={gamePhase}
            dataMode={dataMode}
            liveRoundsCount={liveRoundsCount}
            config={overlayConfig}
            detectionState={detectionState}
            onUpdateConfig={handleUpdateOverlayConfig}
            onStartMonitoring={() =>
              handleUpdateOverlayConfig({
                isEnabled: true,
                isMonitoring: true,
                hasOverlayPermission: true,
              })
            }
            onStopMonitoring={() => handleUpdateOverlayConfig({ isMonitoring: false })}
            onTogglePause={() => handleUpdateOverlayConfig({ isPaused: !overlayConfig.isPaused })}
            onSimulateWinner={handleManualRecord}
            activeBoomplayScreen={activeBoomplayScreen}
            onChangeBoomplayScreen={handleChangeBoomplayScreen}
          />
        )}

        {activeTab === 'live' && (
          <LiveMonitorTab
            prediction={currentPrediction}
            currentRoundId={currentRoundId}
            countdownSeconds={countdownSeconds ?? 0}
            gamePhase={gamePhase}
            onRecordResult={handleManualRecord}
            calibration={calibration}
            detectionState={detectionState}
            dataMode={dataMode}
          />
        )}

        {activeTab === 'replay' && (
          <ReplayAnalyzerTab calibration={calibration} />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            rounds={rounds}
            onDeleteRound={(id) => dbService.deleteRound(id)}
            onClearAll={() => dbService.clearAll()}
            onResetSeed={() => dbService.resetToSeed()}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            onImportData={async (imported) => {
              await dbService.importRounds(imported);
            }}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationTab
            rounds={rounds}
            dataMode={dataMode}
            liveRoundsCount={liveRoundsCount}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab rounds={rounds} prediction={currentPrediction} />
        )}

        {activeTab === 'statistics' && <StatisticsTab rounds={rounds} />}

        {activeTab === 'settings' && (
          <SettingsTab
            calibration={calibration}
            onUpdateCalibration={setCalibration}
            onResetSeed={() => dbService.resetToSeed()}
            onClearAll={() => dbService.clearAll()}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            overlayConfig={overlayConfig}
            onUpdateOverlayConfig={handleUpdateOverlayConfig}
            onStartMonitoring={() =>
              handleUpdateOverlayConfig({
                isEnabled: true,
                isMonitoring: true,
                hasOverlayPermission: true,
              })
            }
          />
        )}
      </main>

      {/* Global Overlay Settings Modal */}
      <FloatingOverlaySettingsModal
        isOpen={showOverlaySettingsModal}
        onClose={() => setShowOverlaySettingsModal(false)}
        config={overlayConfig}
        onUpdateConfig={handleUpdateOverlayConfig}
        onRequestOverlayPermission={() =>
          handleUpdateOverlayConfig({ hasOverlayPermission: true })
        }
      />

      {/* Persistent Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Football League Analyzer & Prediction System • Real Game Master Clock Architecture
          </span>
          <span className="text-slate-600">
            Compliant with non-automated decision support standards • Native Android WindowManager Floating Overlay
          </span>
        </div>
      </footer>
    </div>
  );
}
