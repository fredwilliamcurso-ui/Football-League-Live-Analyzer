/**
 * Football League Game Definitions, Prediction Audit, and Statistical Types
 */

export type TeamId =
  | 'real_madrid'
  | 'barcelona'
  | 'psg'
  | 'liverpool'
  | 'ac_milan'
  | 'bayern'
  | 'juventus'
  | 'man_utd';

export type MultiplierTier = 40 | 12 | 6 | 4;

export type DataMode = 'LIVE' | 'DEMO_SEED';

export type ModelStatus =
  | 'WAITING FOR DATA'
  | 'LEARNING'
  | 'ANALYZING'
  | 'READY'
  | 'INSUFFICIENT DATA';

export interface TeamInfo {
  id: TeamId;
  name: string;
  shortName: string;
  multiplier: MultiplierTier;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  country: string;
  position: 'top-left' | 'top-right' | 'mid-left' | 'mid-right' | 'low-left' | 'low-right' | 'bottom-left' | 'bottom-right';
  gridIndex: number;
  baseTheoreticalOdds: number;
}

export const TEAMS: Record<TeamId, TeamInfo> = {
  real_madrid: {
    id: 'real_madrid',
    name: 'Real Madrid',
    shortName: 'Real Madrid',
    multiplier: 40,
    primaryColor: '#FFFFFF',
    secondaryColor: '#EEB82C',
    accentColor: '#472B74',
    textColor: '#1E293B',
    country: 'Spain',
    position: 'top-left',
    gridIndex: 0,
    baseTheoreticalOdds: 0.025, // 1 in 40
  },
  barcelona: {
    id: 'barcelona',
    name: 'Barcelona',
    shortName: 'Barcelona',
    multiplier: 40,
    primaryColor: '#004D98',
    secondaryColor: '#A50044',
    accentColor: '#EDBB00',
    textColor: '#FFFFFF',
    country: 'Spain',
    position: 'top-right',
    gridIndex: 1,
    baseTheoreticalOdds: 0.025, // 1 in 40
  },
  psg: {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    multiplier: 12,
    primaryColor: '#004170',
    secondaryColor: '#DA291C',
    accentColor: '#FFFFFF',
    textColor: '#FFFFFF',
    country: 'France',
    position: 'mid-left',
    gridIndex: 2,
    baseTheoreticalOdds: 0.083, // 1 in 12
  },
  liverpool: {
    id: 'liverpool',
    name: 'Liverpool',
    shortName: 'Liverpool',
    multiplier: 12,
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    accentColor: '#F6EB61',
    textColor: '#FFFFFF',
    country: 'England',
    position: 'mid-right',
    gridIndex: 3,
    baseTheoreticalOdds: 0.083, // 1 in 12
  },
  ac_milan: {
    id: 'ac_milan',
    name: 'AC Milan',
    shortName: 'AC Milan',
    multiplier: 6,
    primaryColor: '#FB090B',
    secondaryColor: '#000000',
    accentColor: '#FFFFFF',
    textColor: '#FFFFFF',
    country: 'Italy',
    position: 'low-left',
    gridIndex: 4,
    baseTheoreticalOdds: 0.166, // 1 in 6
  },
  bayern: {
    id: 'bayern',
    name: 'Bayern Munich',
    shortName: 'Bayern',
    multiplier: 6,
    primaryColor: '#DC052D',
    secondaryColor: '#0066B2',
    accentColor: '#FFFFFF',
    textColor: '#FFFFFF',
    country: 'Germany',
    position: 'low-right',
    gridIndex: 5,
    baseTheoreticalOdds: 0.166, // 1 in 6
  },
  juventus: {
    id: 'juventus',
    name: 'Juventus',
    shortName: 'Juventus',
    multiplier: 4,
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#D1A153',
    textColor: '#FFFFFF',
    country: 'Italy',
    position: 'bottom-left',
    gridIndex: 6,
    baseTheoreticalOdds: 0.226, // high frequency
  },
  man_utd: {
    id: 'man_utd',
    name: 'Manchester United',
    shortName: 'Man United',
    multiplier: 4,
    primaryColor: '#DA291C',
    secondaryColor: '#FBE122',
    accentColor: '#000000',
    textColor: '#FFFFFF',
    country: 'England',
    position: 'bottom-right',
    gridIndex: 7,
    baseTheoreticalOdds: 0.226, // high frequency
  },
};

export const ALL_TEAMS_LIST = Object.values(TEAMS);

export type GamePhase =
  | 'IDLE'
  | 'BETTING_COUNTDOWN'
  | 'STOP_SELECTION'
  | 'READY_SPIN'
  | 'RESULT_POPUP'
  | 'START_SELECTION';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CalibrationProfile {
  name: string;
  width: number;
  height: number;
  gameArea: BoundingBox;
  countdownArea: BoundingBox;
  roundNumberArea: BoundingBox;
  resultPopupArea: BoundingBox;
  resultHistoryArea: BoundingBox;
  stateBannerArea: BoundingBox;
  teamAreas: Record<TeamId, BoundingBox>;
}

export interface RoundResult {
  id: string;
  roundNumber: string;
  timestamp: number;
  team: TeamId;
  multiplier: MultiplierTier;
  countdownDetected: number;
  recognitionConfidence: number; // 0..100
  isLiveDetected?: boolean;
  predictionMade: boolean;
  predictedTeam: TeamId | null;
  predictedRank: number | null;
  predictionScore: number | null;
  predictionCorrect: boolean | null;
  predictionTop2Correct: boolean | null;
  predictionTop3Correct: boolean | null;
  screenshotPath?: string;
  createdAt: string;
}

export interface ScoreExplanation {
  recentFrequencyContribution: number; // e.g. +12.4
  currentGapContribution: number; // e.g. +8.2
  transitionSignalContribution: number; // e.g. +6.8
  longTermFrequencyContribution: number; // e.g. +5.7
  multiplierSignalContribution: number; // e.g. +3.1
  streakAdjustment: number; // e.g. -2.4
  rawSum: number;
}

export interface TeamScoreBreakdown {
  teamId: TeamId;
  totalScore: number; // exact decimal score e.g. 54.2
  rank: number;
  recentFrequencyScore: number;
  streakScore: number;
  gapScore: number;
  markovScore: number;
  multiplierScore: number;
  explanation: ScoreExplanation;
  rawSignals: {
    appearancesLast10: number;
    appearancesLast25: number;
    appearancesLast50: number;
    appearancesLast100: number;
    currentStreak: number;
    roundsSinceLastAppearance: number;
    transitionProbability: number;
    historicalFrequencyRate: number;
  };
}

export interface PredictionSnapshot {
  roundNumber: string;
  timestamp: number;
  secondsRemaining: number;
  status: 'PRELIMINARY' | 'UPDATED' | 'FINAL' | 'FROZEN';
  rankings: TeamScoreBreakdown[];
  topCandidate: TeamId;
  topCandidateScore: number;
  top3Candidates: TeamId[];
  availableSampleCount: number;
  modelStatus: ModelStatus;
  confidenceWarning: string | null;
  backtestAccuracyTop1: number;
  backtestAccuracyTop2: number;
  backtestAccuracyTop3: number;
  top1Ratio: string;
  top2Ratio: string;
  top3Ratio: string;
  historicalSupport: 'Low' | 'Medium' | 'High' | 'Strong';
}

export interface PredictionAuditRecord {
  id: string;
  roundPredicted: string;
  predictionTimestamp: number;
  availableHistoricalDataCount: number;
  top1Team: TeamId;
  top1Score: number;
  top2Team: TeamId;
  top2Score: number;
  top3Team: TeamId;
  top3Score: number;
  allScores: Record<TeamId, number>;
  scoreExplanations: Record<TeamId, ScoreExplanation>;
  status: 'FROZEN_PENDING_RESULT' | 'EVALUATED';
  actualResult: TeamId | null;
  actualMultiplier: MultiplierTier | null;
  top1Correct: boolean | null;
  top2Correct: boolean | null;
  top3Correct: boolean | null;
  evaluatedAt: number | null;
  recognitionConfidence: number | null;
}

export interface SignalPerformanceMetric {
  signalKey: 'frequency' | 'gap' | 'markov' | 'streak' | 'multiplier' | 'combined';
  signalName: string;
  top1CorrectCount: number;
  top1Accuracy: number;
  top3CorrectCount: number;
  top3Accuracy: number;
  sampleSize: number;
  improvementVsBaseline: number; // Top-1 improvement vs 12.5% random baseline
  currentWeight: number;
  status: 'ACTIVE' | 'WEIGHT_REDUCED' | 'DISABLED';
}

export interface ModelBacktestMetrics {
  totalTestedRounds: number;
  top1CorrectCount: number;
  top1Accuracy: number;
  top1Ratio: string; // e.g. "54.5% (11/20)"
  top2CorrectCount: number;
  top2Accuracy: number;
  top2Ratio: string; // e.g. "70.0% (14/20)"
  top3CorrectCount: number;
  top3Accuracy: number;
  top3Ratio: string; // e.g. "85.0% (17/20)"
  accuracyLast50: number;
  accuracyLast100: number;
  accuracyByTeam: Record<TeamId, { total: number; correctTop1: number; correctTop3: number; accuracy: number }>;
  accuracyByMultiplier: Record<MultiplierTier, { total: number; correctTop1: number; correctTop3: number; accuracy: number }>;
  signalPerformance: SignalPerformanceMetric[];
}

export type BoomplayAppScreen =
  | 'FOOTBALL_LEAGUE'
  | 'BOOMPLAY_HOME'
  | 'BOOMPLAY_SEARCH'
  | 'BOOMPLAY_PROFILE'
  | 'OTHER_APP';

export interface FloatingOverlayConfig {
  isEnabled: boolean;
  hasOverlayPermission: boolean;
  hasMediaProjectionPermission: boolean;
  isMonitoring: boolean;
  isPaused: boolean;
  opacity: 100 | 80 | 60 | 40;
  size: 'compact' | 'normal' | 'large';
  isMinimized: boolean;
  position: { x: number; y: number };
  batteryMode: 'NORMAL' | 'LOW_POWER';
  showCountdown: boolean;
  showRound: boolean;
  showPrediction: boolean;
  showTop3: boolean;
  showScore: boolean;
  showConfidence: boolean;
  showLiveRounds: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export type GameClockStatus =
  | 'SYNCED'
  | 'WAITING FOR GAME'
  | 'UNSYNCED'
  | 'DETECTING';

export type PredictionStage =
  | 'INITIAL'
  | 'PRELIMINARY'
  | 'UPDATED'
  | 'FINAL_MODEL_SCORE'
  | 'FROZEN';

export interface LiveGameDetectionState {
  captureConnected: boolean;
  gameDetected: boolean;
  clockStatus: GameClockStatus;
  screenIdentified: BoomplayAppScreen;
  detectedRoundNumber: string;
  detectedPhase: GamePhase;
  detectedCountdown: number | null; // null when unconfident / detecting, strictly from game
  countdownDisplay: string; // e.g. "5", "4", "3", "2", "1", "DETECTING", "—"
  teamsRecognizedCount: number; // e.g. 8
  resultStatus: 'WAITING' | 'DETECTED' | 'EVALUATING';
  confidenceScore: number;
  lastActualResult: TeamId | null;
  top1Evaluation: 'CORRECT' | 'INCORRECT' | null;
  top2Evaluation: 'CORRECT' | 'INCORRECT' | null;
  top3Evaluation: 'CORRECT' | 'INCORRECT' | null;
  isFrozen: boolean;
  freezeTimestamp: string | null; // e.g. "19:42:13.527"
  predictionStage: PredictionStage;
  gameDetectedTimestamp: number | null;
  predictionTimestamp: number | null;
  resultDetectedTimestamp: number | null;
  fps: number;
  missedFramesCount: number;
  detectedRoundId?: string;
  lastCountdownDetected?: number | null;
  frameTimestamp?: string;
  transitionAudit?: Array<{ timestamp: string; countdown: number }>;
  rawRoiDebugInfo: {
    pitchSignatureConfidence: number;
    countdownRoiConfidence: number;
    roundNumberRoiConfidence: number;
    resultPopupConfidence: number;
  };
}

