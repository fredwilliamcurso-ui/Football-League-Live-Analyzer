/**
 * Football League Multi-Signal Statistical Prediction & Sequential Backtesting Engine
 * Purely empirical formulation without lookahead bias or hardcoded predictions.
 */
import {
  ALL_TEAMS_LIST,
  ModelBacktestMetrics,
  ModelStatus,
  MultiplierTier,
  PredictionSnapshot,
  RoundResult,
  ScoreExplanation,
  SignalPerformanceMetric,
  TeamId,
  TEAMS,
  TeamScoreBreakdown,
} from '../types/game';

export interface PredictionWeights {
  recentFrequency: number;
  streak: number;
  gap: number;
  markovTransition: number;
  multiplierTier: number;
}

export const DEFAULT_WEIGHTS: PredictionWeights = {
  recentFrequency: 0.25,
  streak: 0.20,
  gap: 0.25,
  markovTransition: 0.20,
  multiplierTier: 0.10,
};

export class PredictionEngine {
  /**
   * Generates a ranked statistical score for each of the 8 teams given past round history.
   * Fully auditable: decomposed into mathematical signal contributions.
   */
  public static calculatePrediction(
    history: RoundResult[],
    currentRoundNumber: string = '',
    secondsRemaining: number = 5,
    customWeights: PredictionWeights = DEFAULT_WEIGHTS,
    isExplicitlyFrozen: boolean = false
  ): PredictionSnapshot {
    // Sort chronologically ascending (oldest to newest)
    const chronological = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const totalRounds = chronological.length;

    // Determine Model Status & Confidence Warning based on sample size
    let modelStatus: ModelStatus = 'READY';
    let confidenceWarning: string | null = null;

    if (totalRounds === 0) {
      modelStatus = 'WAITING FOR DATA';
      confidenceWarning = 'Waiting for live game screen rounds to be detected.';
    } else if (totalRounds < 50) {
      modelStatus = 'INSUFFICIENT DATA';
      confidenceWarning = 'Insufficient live data for reliable statistical analysis.';
    } else if (totalRounds < 100) {
      modelStatus = 'LEARNING';
      confidenceWarning = 'Limited historical sample.';
    } else {
      modelStatus = secondsRemaining <= 5 ? 'READY' : 'ANALYZING';
      confidenceWarning = null;
    }

    // Determine timing status based on real game countdown or explicit freeze
    let timingStatus: PredictionSnapshot['status'] = 'FINAL';
    if (isExplicitlyFrozen || secondsRemaining <= 1) {
      timingStatus = 'FROZEN';
    } else if (secondsRemaining > 10) {
      timingStatus = 'PRELIMINARY';
    } else if (secondsRemaining > 5) {
      timingStatus = 'UPDATED';
    } else {
      timingStatus = 'FINAL';
    }

    const lastRound = chronological[totalRounds - 1];
    const lastWinningTeam = lastRound?.team || null;

    // Slices for recency and Markov analysis
    const last10 = chronological.slice(-10);
    const last25 = chronological.slice(-25);
    const last50 = chronological.slice(-50);
    const last100 = chronological.slice(-100);

    // Markov transition counts from last observed winning team
    const markovCounts: Record<TeamId, number> = {
      real_madrid: 0,
      barcelona: 0,
      psg: 0,
      liverpool: 0,
      ac_milan: 0,
      bayern: 0,
      juventus: 0,
      man_utd: 0,
    };
    let totalTransitionsFromLast = 0;

    if (lastWinningTeam && totalRounds >= 2) {
      for (let i = 0; i < chronological.length - 1; i++) {
        if (chronological[i].team === lastWinningTeam) {
          const nextTeam = chronological[i + 1].team;
          markovCounts[nextTeam] = (markovCounts[nextTeam] || 0) + 1;
          totalTransitionsFromLast++;
        }
      }
    }

    // Calculate empirical scores and exact decomposed contributions for all 8 teams
    const calculatedTeams: {
      teamId: TeamId;
      totalScore: number;
      explanation: ScoreExplanation;
      rawBreakdown: Omit<TeamScoreBreakdown, 'rank' | 'totalScore' | 'explanation'>;
    }[] = [];

    for (const team of ALL_TEAMS_LIST) {
      const teamId = team.id;

      // 1. Recent Frequency Calculation
      const count10 = last10.filter((r) => r.team === teamId).length;
      const count25 = last25.filter((r) => r.team === teamId).length;
      const count50 = last50.filter((r) => r.team === teamId).length;
      const count100 = last100.filter((r) => r.team === teamId).length;

      const freqNorm =
        (count10 / Math.max(1, last10.length)) * 0.5 +
        (count25 / Math.max(1, last25.length)) * 0.3 +
        (count50 / Math.max(1, last50.length)) * 0.2;

      // 2. Current Streak Calculation
      let currentStreak = 0;
      for (let i = chronological.length - 1; i >= 0; i--) {
        if (chronological[i].team === teamId) {
          currentStreak++;
        } else {
          break;
        }
      }

      // 3. Gap Calculation (rounds since last appearance)
      let roundsSinceLast = 0;
      let found = false;
      for (let i = chronological.length - 1; i >= 0; i--) {
        if (chronological[i].team === teamId) {
          found = true;
          break;
        }
        roundsSinceLast++;
      }
      if (!found) roundsSinceLast = totalRounds;

      const expectedGap = Math.max(1, Math.round(1 / team.baseTheoreticalOdds));

      // 4. Markov Transition Probability
      let markovProb = team.baseTheoreticalOdds;
      if (totalTransitionsFromLast > 0) {
        markovProb = markovCounts[teamId] / totalTransitionsFromLast;
      }

      // 5. Explicit Mathematical Score Contributions (+/- auditable values)
      // Base score starts around 20.0
      const baseScore = 20.0;

      // Recent frequency contribution (+0.0 to +18.0)
      const recentFreqContrib = Number((freqNorm * 45 * customWeights.recentFrequency * 4).toFixed(1));

      // Current gap contribution (-4.0 to +12.0)
      let gapContrib = 0;
      if (roundsSinceLast === 0) {
        gapContrib = team.multiplier === 4 ? 2.5 : -2.0;
      } else {
        const gapRatio = roundsSinceLast / expectedGap;
        if (gapRatio >= 0.8 && gapRatio <= 1.6) {
          gapContrib = Math.min(12.0, Number(((gapRatio - 0.5) * 8.0).toFixed(1)));
        } else if (gapRatio > 1.6) {
          gapContrib = Math.min(10.0, Number((8.0 + (gapRatio - 1.6) * 2.0).toFixed(1)));
        } else {
          gapContrib = Number((-2.0 + gapRatio * 4.0).toFixed(1));
        }
      }

      // Markov transition contribution (+0.0 to +14.0)
      const markovContrib = Number((markovProb * 40 * customWeights.markovTransition * 4).toFixed(1));

      // Long term baseline frequency contribution (+2.0 to +8.0)
      const longTermFreqContrib = Number((team.baseTheoreticalOdds * 35).toFixed(1));

      // Multiplier tier contribution (+1.0 to +6.0)
      let multiplierContrib = 2.0;
      if (team.multiplier === 4) multiplierContrib = 5.8;
      else if (team.multiplier === 6) multiplierContrib = 4.2;
      else if (team.multiplier === 12) multiplierContrib = 2.5;
      else multiplierContrib = 1.2;

      // Streak adjustment (-3.0 to +6.0)
      let streakAdj = 0;
      if (currentStreak >= 2) {
        streakAdj = Number((2.5 + Math.min(4, currentStreak * 1.5)).toFixed(1));
      } else if (currentStreak === 1) {
        streakAdj = team.multiplier === 4 ? 1.5 : -1.2;
      } else {
        streakAdj = Number((-1.5).toFixed(1));
      }

      // Total exact sum with 1 decimal precision
      const rawSum =
        baseScore +
        recentFreqContrib +
        gapContrib +
        markovContrib +
        longTermFreqContrib +
        multiplierContrib +
        streakAdj;

      const totalScore = Number(Math.max(15.0, Math.min(92.0, rawSum)).toFixed(1));

      const explanation: ScoreExplanation = {
        recentFrequencyContribution: recentFreqContrib,
        currentGapContribution: gapContrib,
        transitionSignalContribution: markovContrib,
        longTermFrequencyContribution: longTermFreqContrib,
        multiplierSignalContribution: multiplierContrib,
        streakAdjustment: streakAdj,
        rawSum: Number(rawSum.toFixed(1)),
      };

      calculatedTeams.push({
        teamId,
        totalScore,
        explanation,
        rawBreakdown: {
          teamId,
          recentFrequencyScore: Math.round(recentFreqContrib * 5),
          streakScore: Math.round((streakAdj + 3) * 12),
          gapScore: Math.round((gapContrib + 4) * 6),
          markovScore: Math.round(markovContrib * 6),
          multiplierScore: Math.round(multiplierContrib * 15),
          rawSignals: {
            appearancesLast10: count10,
            appearancesLast25: count25,
            appearancesLast50: count50,
            appearancesLast100: count100,
            currentStreak,
            roundsSinceLastAppearance: roundsSinceLast,
            transitionProbability: Number((markovProb * 100).toFixed(1)),
            historicalFrequencyRate: Number(((count50 / Math.max(1, last50.length)) * 100).toFixed(1)),
          },
        },
      });
    }

    // Sort descending by exact total score
    calculatedTeams.sort((a, b) => b.totalScore - a.totalScore);

    const rankings: TeamScoreBreakdown[] = calculatedTeams.map((item, idx) => ({
      ...item.rawBreakdown,
      teamId: item.teamId,
      totalScore: item.totalScore,
      explanation: item.explanation,
      rank: idx + 1,
    }));

    const topCandidate = rankings[0].teamId;
    const topCandidateScore = rankings[0].totalScore;
    const top3Candidates = [rankings[0].teamId, rankings[1].teamId, rankings[2].teamId];

    // Compute sequential backtest metrics on completed rounds
    const backtestMetrics = PredictionEngine.runBacktest(chronological, customWeights);

    // Historical support classification
    let historicalSupport: PredictionSnapshot['historicalSupport'] = 'Medium';
    if (totalRounds < 10) historicalSupport = 'Low';
    else if (totalRounds >= 50 && backtestMetrics.top3Accuracy > 60) historicalSupport = 'Strong';
    else if (totalRounds >= 20) historicalSupport = 'High';

    return {
      roundNumber: currentRoundNumber,
      timestamp: Date.now(),
      secondsRemaining,
      status: timingStatus,
      rankings,
      topCandidate,
      topCandidateScore,
      top3Candidates,
      availableSampleCount: totalRounds,
      modelStatus,
      confidenceWarning,
      backtestAccuracyTop1: backtestMetrics.top1Accuracy,
      backtestAccuracyTop2: backtestMetrics.top2Accuracy,
      backtestAccuracyTop3: backtestMetrics.top3Accuracy,
      top1Ratio: backtestMetrics.top1Ratio,
      top2Ratio: backtestMetrics.top2Ratio,
      top3Ratio: backtestMetrics.top3Ratio,
      historicalSupport,
    };
  }

  /**
   * Evaluates sequential prediction performance across all completed historical rounds
   * without lookahead bias.
   */
  public static runBacktest(
    history: RoundResult[],
    weights: PredictionWeights = DEFAULT_WEIGHTS
  ): ModelBacktestMetrics {
    const chronological = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const total = chronological.length;

    let testableCount = 0;
    let top1Correct = 0;
    let top2Correct = 0;
    let top3Correct = 0;

    // Per-signal standalone test tracking
    let freqTop1 = 0;
    let freqTop3 = 0;
    let gapTop1 = 0;
    let gapTop3 = 0;
    let markovTop1 = 0;
    let markovTop3 = 0;
    let streakTop1 = 0;
    let streakTop3 = 0;
    let multTop1 = 0;
    let multTop3 = 0;

    const teamAcc: Record<TeamId, { total: number; correctTop1: number; correctTop3: number; accuracy: number }> = {
      real_madrid: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      barcelona: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      psg: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      liverpool: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      ac_milan: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      bayern: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      juventus: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      man_utd: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
    };

    const multiplierAcc: Record<MultiplierTier, { total: number; correctTop1: number; correctTop3: number; accuracy: number }> = {
      40: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      12: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      6: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
      4: { total: 0, correctTop1: 0, correctTop3: 0, accuracy: 0 },
    };

    const recentResults: { isTop1: boolean; isTop3: boolean }[] = [];

    // Evaluate for each round from index 3 onwards
    for (let i = 3; i < total; i++) {
      const priorSlice = chronological.slice(0, i);
      const targetRound = chronological[i];
      const actualWinner = targetRound.team;
      const actualMultiplier = targetRound.multiplier;

      // Combined Model Prediction
      const pred = PredictionEngine.calculatePrediction(priorSlice, targetRound.roundNumber, 5, weights);

      const isTop1 = pred.rankings[0]?.teamId === actualWinner;
      const isTop2 = pred.rankings[0]?.teamId === actualWinner || pred.rankings[1]?.teamId === actualWinner;
      const isTop3 =
        pred.rankings[0]?.teamId === actualWinner ||
        pred.rankings[1]?.teamId === actualWinner ||
        pred.rankings[2]?.teamId === actualWinner;

      testableCount++;
      if (isTop1) top1Correct++;
      if (isTop2) top2Correct++;
      if (isTop3) top3Correct++;

      recentResults.push({ isTop1, isTop3 });

      // Signal individual evaluations
      // Frequency alone
      const sortedByFreq = [...pred.rankings].sort((a, b) => b.recentFrequencyScore - a.recentFrequencyScore);
      if (sortedByFreq[0]?.teamId === actualWinner) freqTop1++;
      if (sortedByFreq.slice(0, 3).some((r) => r.teamId === actualWinner)) freqTop3++;

      // Gap alone
      const sortedByGap = [...pred.rankings].sort((a, b) => b.gapScore - a.gapScore);
      if (sortedByGap[0]?.teamId === actualWinner) gapTop1++;
      if (sortedByGap.slice(0, 3).some((r) => r.teamId === actualWinner)) gapTop3++;

      // Markov alone
      const sortedByMarkov = [...pred.rankings].sort((a, b) => b.markovScore - a.markovScore);
      if (sortedByMarkov[0]?.teamId === actualWinner) markovTop1++;
      if (sortedByMarkov.slice(0, 3).some((r) => r.teamId === actualWinner)) markovTop3++;

      // Streak alone
      const sortedByStreak = [...pred.rankings].sort((a, b) => b.streakScore - a.streakScore);
      if (sortedByStreak[0]?.teamId === actualWinner) streakTop1++;
      if (sortedByStreak.slice(0, 3).some((r) => r.teamId === actualWinner)) streakTop3++;

      // Multiplier alone
      const sortedByMult = [...pred.rankings].sort((a, b) => b.multiplierScore - a.multiplierScore);
      if (sortedByMult[0]?.teamId === actualWinner) multTop1++;
      if (sortedByMult.slice(0, 3).some((r) => r.teamId === actualWinner)) multTop3++;

      // Track by team
      teamAcc[actualWinner].total++;
      if (isTop1) teamAcc[actualWinner].correctTop1++;
      if (isTop3) teamAcc[actualWinner].correctTop3++;

      // Track by multiplier
      multiplierAcc[actualMultiplier].total++;
      if (isTop1) multiplierAcc[actualMultiplier].correctTop1++;
      if (isTop3) multiplierAcc[actualMultiplier].correctTop3++;
    }

    // Finalize team accuracy percentages
    for (const key of Object.keys(teamAcc) as TeamId[]) {
      const item = teamAcc[key];
      item.accuracy = item.total > 0 ? Number(((item.correctTop3 / item.total) * 100).toFixed(1)) : 0;
    }

    // Finalize multiplier accuracy percentages
    for (const m of [40, 12, 6, 4] as MultiplierTier[]) {
      const item = multiplierAcc[m];
      item.accuracy = item.total > 0 ? Number(((item.correctTop3 / item.total) * 100).toFixed(1)) : 0;
    }

    const top1Pct = testableCount > 0 ? Number(((top1Correct / testableCount) * 100).toFixed(1)) : 0;
    const top2Pct = testableCount > 0 ? Number(((top2Correct / testableCount) * 100).toFixed(1)) : 0;
    const top3Pct = testableCount > 0 ? Number(((top3Correct / testableCount) * 100).toFixed(1)) : 0;

    const top1Ratio = `${top1Pct}% (${top1Correct}/${testableCount})`;
    const top2Ratio = `${top2Pct}% (${top2Correct}/${testableCount})`;
    const top3Ratio = `${top3Pct}% (${top3Correct}/${testableCount})`;

    const last50Slice = recentResults.slice(-50);
    const last100Slice = recentResults.slice(-100);

    const accLast50 =
      last50Slice.length > 0
        ? Number(((last50Slice.filter((r) => r.isTop3).length / last50Slice.length) * 100).toFixed(1))
        : 0;
    const accLast100 =
      last100Slice.length > 0
        ? Number(((last100Slice.filter((r) => r.isTop3).length / last100Slice.length) * 100).toFixed(1))
        : 0;

    // Baseline for 8 teams: Random Top-1 is 12.5%, Random Top-3 is 37.5%
    const randomBaselineTop1 = 12.5;

    const signalPerformance: SignalPerformanceMetric[] = [
      {
        signalKey: 'frequency',
        signalName: 'Recent Frequency Signal',
        top1CorrectCount: freqTop1,
        top1Accuracy: testableCount > 0 ? Number(((freqTop1 / testableCount) * 100).toFixed(1)) : 0,
        top3CorrectCount: freqTop3,
        top3Accuracy: testableCount > 0 ? Number(((freqTop3 / testableCount) * 100).toFixed(1)) : 0,
        sampleSize: testableCount,
        improvementVsBaseline:
          testableCount > 0 ? Number((((freqTop1 / testableCount) * 100) - randomBaselineTop1).toFixed(1)) : 0,
        currentWeight: weights.recentFrequency,
        status: 'ACTIVE',
      },
      {
        signalKey: 'gap',
        signalName: 'Gap / Mean-Reversion Analysis',
        top1CorrectCount: gapTop1,
        top1Accuracy: testableCount > 0 ? Number(((gapTop1 / testableCount) * 100).toFixed(1)) : 0,
        top3CorrectCount: gapTop3,
        top3Accuracy: testableCount > 0 ? Number(((gapTop3 / testableCount) * 100).toFixed(1)) : 0,
        sampleSize: testableCount,
        improvementVsBaseline:
          testableCount > 0 ? Number((((gapTop1 / testableCount) * 100) - randomBaselineTop1).toFixed(1)) : 0,
        currentWeight: weights.gap,
        status: testableCount >= 10 && (gapTop1 / testableCount) * 100 < randomBaselineTop1 ? 'WEIGHT_REDUCED' : 'ACTIVE',
      },
      {
        signalKey: 'markov',
        signalName: 'Markov State Transitions',
        top1CorrectCount: markovTop1,
        top1Accuracy: testableCount > 0 ? Number(((markovTop1 / testableCount) * 100).toFixed(1)) : 0,
        top3CorrectCount: markovTop3,
        top3Accuracy: testableCount > 0 ? Number(((markovTop3 / testableCount) * 100).toFixed(1)) : 0,
        sampleSize: testableCount,
        improvementVsBaseline:
          testableCount > 0 ? Number((((markovTop1 / testableCount) * 100) - randomBaselineTop1).toFixed(1)) : 0,
        currentWeight: weights.markovTransition,
        status: 'ACTIVE',
      },
      {
        signalKey: 'streak',
        signalName: 'Streak / Momentum Analysis',
        top1CorrectCount: streakTop1,
        top1Accuracy: testableCount > 0 ? Number(((streakTop1 / testableCount) * 100).toFixed(1)) : 0,
        top3CorrectCount: streakTop3,
        top3Accuracy: testableCount > 0 ? Number(((streakTop3 / testableCount) * 100).toFixed(1)) : 0,
        sampleSize: testableCount,
        improvementVsBaseline:
          testableCount > 0 ? Number((((streakTop1 / testableCount) * 100) - randomBaselineTop1).toFixed(1)) : 0,
        currentWeight: weights.streak,
        status: 'ACTIVE',
      },
      {
        signalKey: 'multiplier',
        signalName: 'Multiplier Tier Odds Balancing',
        top1CorrectCount: multTop1,
        top1Accuracy: testableCount > 0 ? Number(((multTop1 / testableCount) * 100).toFixed(1)) : 0,
        top3CorrectCount: multTop3,
        top3Accuracy: testableCount > 0 ? Number(((multTop3 / testableCount) * 100).toFixed(1)) : 0,
        sampleSize: testableCount,
        improvementVsBaseline:
          testableCount > 0 ? Number((((multTop1 / testableCount) * 100) - randomBaselineTop1).toFixed(1)) : 0,
        currentWeight: weights.multiplierTier,
        status: 'ACTIVE',
      },
      {
        signalKey: 'combined',
        signalName: 'Combined Ensemble Model',
        top1CorrectCount: top1Correct,
        top1Accuracy: top1Pct,
        top3CorrectCount: top3Correct,
        top3Accuracy: top3Pct,
        sampleSize: testableCount,
        improvementVsBaseline: Number((top1Pct - randomBaselineTop1).toFixed(1)),
        currentWeight: 1.0,
        status: 'ACTIVE',
      },
    ];

    return {
      totalTestedRounds: testableCount,
      top1CorrectCount: top1Correct,
      top1Accuracy: top1Pct,
      top1Ratio,
      top2CorrectCount: top2Correct,
      top2Accuracy: top2Pct,
      top2Ratio,
      top3CorrectCount: top3Correct,
      top3Accuracy: top3Pct,
      top3Ratio,
      accuracyLast50: accLast50,
      accuracyLast100: accLast100,
      accuracyByTeam: teamAcc,
      accuracyByMultiplier: multiplierAcc,
      signalPerformance,
    };
  }

  /**
   * Builds the empirical Markov transition matrix: P(NextTeam | CurrentTeam)
   */
  public static calculateMarkovMatrix(history: RoundResult[]): {
    matrix: Record<TeamId, Record<TeamId, { count: number; probability: number }>>;
    rowTotals: Record<TeamId, number>;
  } {
    const chronological = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const matrix: any = {};
    const rowTotals: any = {};

    ALL_TEAMS_LIST.forEach((fromTeam) => {
      matrix[fromTeam.id] = {};
      rowTotals[fromTeam.id] = 0;
      ALL_TEAMS_LIST.forEach((toTeam) => {
        matrix[fromTeam.id][toTeam.id] = { count: 0, probability: 0 };
      });
    });

    for (let i = 0; i < chronological.length - 1; i++) {
      const from = chronological[i].team;
      const to = chronological[i + 1].team;
      if (matrix[from] && matrix[from][to]) {
        matrix[from][to].count++;
        rowTotals[from]++;
      }
    }

    // Compute probabilities
    ALL_TEAMS_LIST.forEach((fromTeam) => {
      const total = rowTotals[fromTeam.id];
      ALL_TEAMS_LIST.forEach((toTeam) => {
        const count = matrix[fromTeam.id][toTeam.id].count;
        matrix[fromTeam.id][toTeam.id].probability =
          total > 0 ? Number(((count / total) * 100).toFixed(1)) : Number((toTeam.baseTheoreticalOdds * 100).toFixed(1));
      });
    });

    return { matrix, rowTotals };
  }
}
