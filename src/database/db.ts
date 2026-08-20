/**
 * Local Database Management & Prediction Audit Registry
 * Maintains clear separation between LIVE DATA and DEMO/SEED DATA.
 */
import {
  DataMode,
  PredictionAuditRecord,
  RoundResult,
  ScoreExplanation,
  TeamId,
  TEAMS,
} from '../types/game';

const DB_NAME = 'FootballLeagueDB';
const DB_VERSION = 2;
const LOCAL_STORAGE_KEY_LIVE = 'football_league_live_results_v2';
const LOCAL_STORAGE_KEY_SEED = 'football_league_seed_results_v2';
const LOCAL_STORAGE_KEY_AUDITS = 'football_league_prediction_audits_v2';
const LOCAL_STORAGE_KEY_DATAMODE = 'football_league_active_datamode_v2';

// Clean initial demo seed dataset (16 historic rounds for demonstration/sandbox only)
export const INITIAL_DEMO_SEED_ROUNDS: RoundResult[] = [
  {
    id: 'seed-1',
    roundNumber: '08200020',
    timestamp: Date.now() - 15 * 60 * 1000,
    team: 'juventus',
    multiplier: 4,
    countdownDetected: 30,
    recognitionConfidence: 96,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'juventus',
    predictedRank: 1,
    predictionScore: 68,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    roundNumber: '08200021',
    timestamp: Date.now() - 14 * 60 * 1000,
    team: 'man_utd',
    multiplier: 4,
    countdownDetected: 30,
    recognitionConfidence: 98,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'man_utd',
    predictedRank: 1,
    predictionScore: 71,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    roundNumber: '08200022',
    timestamp: Date.now() - 13 * 60 * 1000,
    team: 'bayern',
    multiplier: 6,
    countdownDetected: 30,
    recognitionConfidence: 95,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'ac_milan',
    predictedRank: 2,
    predictionScore: 62,
    predictionCorrect: false,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-4',
    roundNumber: '08200023',
    timestamp: Date.now() - 12 * 60 * 1000,
    team: 'ac_milan',
    multiplier: 6,
    countdownDetected: 30,
    recognitionConfidence: 99,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'ac_milan',
    predictedRank: 1,
    predictionScore: 65,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-5',
    roundNumber: '08200024',
    timestamp: Date.now() - 11 * 60 * 1000,
    team: 'psg',
    multiplier: 12,
    countdownDetected: 30,
    recognitionConfidence: 94,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'liverpool',
    predictedRank: 2,
    predictionScore: 54,
    predictionCorrect: false,
    predictionTop2Correct: false,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-6',
    roundNumber: '08200025',
    timestamp: Date.now() - 10 * 60 * 1000,
    team: 'barcelona',
    multiplier: 40,
    countdownDetected: 30,
    recognitionConfidence: 97,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'man_utd',
    predictedRank: 5,
    predictionScore: 42,
    predictionCorrect: false,
    predictionTop2Correct: false,
    predictionTop3Correct: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-7',
    roundNumber: '08200026',
    timestamp: Date.now() - 9 * 60 * 1000,
    team: 'juventus',
    multiplier: 4,
    countdownDetected: 30,
    recognitionConfidence: 98,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'juventus',
    predictedRank: 1,
    predictionScore: 74,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-8',
    roundNumber: '08200027',
    timestamp: Date.now() - 8 * 60 * 1000,
    team: 'ac_milan',
    multiplier: 6,
    countdownDetected: 30,
    recognitionConfidence: 96,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'ac_milan',
    predictedRank: 1,
    predictionScore: 69,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-9',
    roundNumber: '08200028',
    timestamp: Date.now() - 7 * 60 * 1000,
    team: 'man_utd',
    multiplier: 4,
    countdownDetected: 30,
    recognitionConfidence: 98,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'man_utd',
    predictedRank: 1,
    predictionScore: 72,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-10',
    roundNumber: '08200029',
    timestamp: Date.now() - 6 * 60 * 1000,
    team: 'real_madrid',
    multiplier: 40,
    countdownDetected: 30,
    recognitionConfidence: 96,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'bayern',
    predictedRank: 6,
    predictionScore: 35,
    predictionCorrect: false,
    predictionTop2Correct: false,
    predictionTop3Correct: false,
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-11',
    roundNumber: '08200030',
    timestamp: Date.now() - 5 * 60 * 1000,
    team: 'juventus',
    multiplier: 4,
    countdownDetected: 30,
    recognitionConfidence: 99,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'juventus',
    predictedRank: 1,
    predictionScore: 76,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-12',
    roundNumber: '08200031',
    timestamp: Date.now() - 4 * 60 * 1000,
    team: 'bayern',
    multiplier: 6,
    countdownDetected: 30,
    recognitionConfidence: 97,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'man_utd',
    predictedRank: 2,
    predictionScore: 61,
    predictionCorrect: false,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-13',
    roundNumber: '08200032',
    timestamp: Date.now() - 3 * 60 * 1000,
    team: 'man_utd',
    multiplier: 4,
    countdownDetected: 30,
    recognitionConfidence: 98,
    isLiveDetected: false,
    predictionMade: true,
    predictedTeam: 'man_utd',
    predictedRank: 1,
    predictionScore: 70,
    predictionCorrect: true,
    predictionTop2Correct: true,
    predictionTop3Correct: true,
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];

class DatabaseService {
  private liveRounds: RoundResult[] = [];
  private seedRounds: RoundResult[] = [];
  private predictionAudits: PredictionAuditRecord[] = [];
  private dataMode: DataMode = 'LIVE'; // Default to LIVE DATA mode per User Requirements
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (typeof window === 'undefined') return;

    try {
      const storedMode = localStorage.getItem(LOCAL_STORAGE_KEY_DATAMODE);
      if (storedMode === 'LIVE' || storedMode === 'DEMO_SEED') {
        this.dataMode = storedMode;
      } else {
        this.dataMode = 'LIVE';
      }

      // Load Live Rounds
      const storedLive = localStorage.getItem(LOCAL_STORAGE_KEY_LIVE);
      if (storedLive) {
        this.liveRounds = JSON.parse(storedLive);
      } else {
        this.liveRounds = []; // Starts clean with 0 live rounds
      }

      // Load Demo Seed Rounds
      const storedSeed = localStorage.getItem(LOCAL_STORAGE_KEY_SEED);
      if (storedSeed) {
        this.seedRounds = JSON.parse(storedSeed);
      } else {
        this.seedRounds = [...INITIAL_DEMO_SEED_ROUNDS];
        localStorage.setItem(LOCAL_STORAGE_KEY_SEED, JSON.stringify(this.seedRounds));
      }

      // Load Audits
      const storedAudits = localStorage.getItem(LOCAL_STORAGE_KEY_AUDITS);
      if (storedAudits) {
        this.predictionAudits = JSON.parse(storedAudits);
      } else {
        this.predictionAudits = [];
      }
    } catch (e) {
      console.warn('Storage init fallback error', e);
      this.liveRounds = [];
      this.seedRounds = [...INITIAL_DEMO_SEED_ROUNDS];
      this.predictionAudits = [];
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // Data Mode Getters & Setters
  public getDataMode(): DataMode {
    return this.dataMode;
  }

  public setDataMode(mode: DataMode) {
    this.dataMode = mode;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DATAMODE, mode);
    } catch (e) {}
    this.notify();
  }

  // Active Rounds Getter (returns strictly live or demo depending on active mode)
  public async getActiveRounds(): Promise<RoundResult[]> {
    const list = this.dataMode === 'LIVE' ? this.liveRounds : this.seedRounds;
    return [...list].sort((a, b) => {
      if (a.roundNumber && b.roundNumber) {
        return b.roundNumber.localeCompare(a.roundNumber);
      }
      return b.timestamp - a.timestamp;
    });
  }

  public async getAllLiveRounds(): Promise<RoundResult[]> {
    return [...this.liveRounds].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getLiveRoundsCount(): number {
    return this.liveRounds.length;
  }

  public getSeedRoundsCount(): number {
    return this.seedRounds.length;
  }

  // Insert or Update with Duplicate Protection by roundNumber
  public async insertRound(
    round: Omit<RoundResult, 'id'> & { id?: string },
    modeOverride?: DataMode
  ): Promise<{ success: boolean; round: RoundResult; message?: string }> {
    // Confidence threshold validation (>= 85% required for automatic save)
    if (round.recognitionConfidence < 85) {
      return {
        success: false,
        round: round as RoundResult,
        message: 'Result uncertain (<85% confidence) — manual confirmation required.',
      };
    }

    const targetMode = modeOverride || this.dataMode;
    const targetStore = targetMode === 'LIVE' ? this.liveRounds : this.seedRounds;

    const existingIndex = targetStore.findIndex(
      (r) => r.roundNumber === round.roundNumber && round.roundNumber.trim() !== ''
    );

    const fullRound: RoundResult = {
      id: round.id || `round-${round.roundNumber || Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      isLiveDetected: targetMode === 'LIVE',
      createdAt: round.createdAt || new Date().toISOString(),
      ...round,
    };

    if (existingIndex >= 0) {
      // Update existing detection to prevent duplicates
      targetStore[existingIndex] = {
        ...targetStore[existingIndex],
        ...fullRound,
      };
    } else {
      targetStore.unshift(fullRound);
    }

    // Automatically evaluate any pending prediction audits for this roundNumber
    this.resolvePendingAudit(
      fullRound.roundNumber,
      fullRound.team,
      fullRound.multiplier,
      fullRound.recognitionConfidence
    );

    this.saveToStorage();
    this.notify();
    return { success: true, round: fullRound };
  }

  // Prediction Audit Tracking & Automatic Resolution
  public async savePredictionAudit(audit: PredictionAuditRecord): Promise<void> {
    const existingIdx = this.predictionAudits.findIndex((a) => a.roundPredicted === audit.roundPredicted);
    if (existingIdx >= 0) {
      this.predictionAudits[existingIdx] = audit;
    } else {
      this.predictionAudits.unshift(audit);
    }
    this.saveToStorage();
    this.notify();
  }

  public resolvePendingAudit(
    roundNumber: string,
    actualWinner: TeamId,
    actualMultiplier: number,
    confidence: number
  ): PredictionAuditRecord | null {
    const audit = this.predictionAudits.find((a) => a.roundPredicted === roundNumber);
    if (!audit) return null;

    audit.actualResult = actualWinner;
    audit.actualMultiplier = actualMultiplier as any;
    audit.recognitionConfidence = confidence;
    audit.status = 'EVALUATED';
    audit.evaluatedAt = Date.now();

    audit.top1Correct = audit.top1Team === actualWinner;
    audit.top2Correct = audit.top1Team === actualWinner || audit.top2Team === actualWinner;
    audit.top3Correct =
      audit.top1Team === actualWinner || audit.top2Team === actualWinner || audit.top3Team === actualWinner;

    this.saveToStorage();
    this.notify();
    return audit;
  }

  public getPredictionAudits(): PredictionAuditRecord[] {
    return [...this.predictionAudits].sort((a, b) => b.predictionTimestamp - a.predictionTimestamp);
  }

  public async deleteRound(id: string): Promise<void> {
    if (this.dataMode === 'LIVE') {
      this.liveRounds = this.liveRounds.filter((r) => r.id !== id);
    } else {
      this.seedRounds = this.seedRounds.filter((r) => r.id !== id);
    }
    this.saveToStorage();
    this.notify();
  }

  public async clearLiveRounds(): Promise<void> {
    this.liveRounds = [];
    this.predictionAudits = [];
    this.saveToStorage();
    this.notify();
  }

  public async clearAll(): Promise<void> {
    if (this.dataMode === 'LIVE') {
      this.liveRounds = [];
    } else {
      this.seedRounds = [];
    }
    this.predictionAudits = [];
    this.saveToStorage();
    this.notify();
  }

  public async resetToSeed(): Promise<void> {
    this.seedRounds = [...INITIAL_DEMO_SEED_ROUNDS];
    this.saveToStorage();
    this.notify();
  }

  public async importRounds(rounds: RoundResult[]): Promise<number> {
    let addedCount = 0;
    const targetStore = this.dataMode === 'LIVE' ? this.liveRounds : this.seedRounds;

    for (const round of rounds) {
      const existing = targetStore.find((r) => r.roundNumber === round.roundNumber);
      if (!existing) {
        targetStore.push(round);
        addedCount++;
      }
    }
    this.saveToStorage();
    this.notify();
    return addedCount;
  }

  private saveToStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LIVE, JSON.stringify(this.liveRounds));
      localStorage.setItem(LOCAL_STORAGE_KEY_SEED, JSON.stringify(this.seedRounds));
      localStorage.setItem(LOCAL_STORAGE_KEY_AUDITS, JSON.stringify(this.predictionAudits));
      localStorage.setItem(LOCAL_STORAGE_KEY_DATAMODE, this.dataMode);
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Export functions
  public exportToCSV(rounds: RoundResult[]): string {
    const headers = [
      'id',
      'roundNumber',
      'timestamp',
      'dateISO',
      'team',
      'teamName',
      'multiplier',
      'isLiveDetected',
      'predictedTeam',
      'predictedRank',
      'predictionScore',
      'predictionCorrect',
      'predictionTop3Correct',
      'recognitionConfidence',
    ];

    const rows = rounds.map((r) => [
      r.id,
      r.roundNumber,
      r.timestamp,
      new Date(r.timestamp).toISOString(),
      r.team,
      TEAMS[r.team]?.name || r.team,
      r.multiplier,
      r.isLiveDetected ? 'LIVE' : 'SEED',
      r.predictedTeam || '',
      r.predictedRank ?? '',
      r.predictionScore ?? '',
      r.predictionCorrect !== null ? (r.predictionCorrect ? 'YES' : 'NO') : '',
      r.predictionTop3Correct !== null ? (r.predictionTop3Correct ? 'YES' : 'NO') : '',
      r.recognitionConfidence,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');
    return csvContent;
  }

  public exportToJSON(rounds: RoundResult[]): string {
    return JSON.stringify(rounds, null, 2);
  }
}

export const dbService = new DatabaseService();
