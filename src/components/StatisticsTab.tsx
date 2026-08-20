import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Flame,
  Layers,
  PieChart as PieIcon,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { ALL_TEAMS_LIST, MultiplierTier, RoundResult, TeamId, TEAMS } from '../types/game';
import { TeamCrest } from './TeamCrest';

interface StatisticsTabProps {
  rounds: RoundResult[];
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ rounds }) => {
  // Chronological array (oldest to newest)
  const chronological = useMemo(() => {
    return [...rounds].sort((a, b) => a.timestamp - b.timestamp);
  }, [rounds]);

  const totalCount = chronological.length;

  // Calculate detailed per-team statistics
  const teamStats = useMemo(() => {
    return ALL_TEAMS_LIST.map((team) => {
      const appearances = chronological.filter((r) => r.team === team.id);
      const count = appearances.length;
      const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0';

      // Streaks
      let longestStreak = 0;
      let tempStreak = 0;
      for (const r of chronological) {
        if (r.team === team.id) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // Current streak
      let currentStreak = 0;
      for (let i = chronological.length - 1; i >= 0; i--) {
        if (chronological[i].team === team.id) currentStreak++;
        else break;
      }

      // Gap calculation (rounds between appearances)
      const gapIntervals: number[] = [];
      let lastIndex = -1;
      chronological.forEach((r, idx) => {
        if (r.team === team.id) {
          if (lastIndex !== -1) {
            gapIntervals.push(idx - lastIndex);
          }
          lastIndex = idx;
        }
      });

      const avgGap =
        gapIntervals.length > 0
          ? (gapIntervals.reduce((a, b) => a + b, 0) / gapIntervals.length).toFixed(1)
          : (1 / team.baseTheoreticalOdds).toFixed(1);

      // Rounds since last appearance
      let roundsSince = 0;
      let found = false;
      for (let i = chronological.length - 1; i >= 0; i--) {
        if (chronological[i].team === team.id) {
          found = true;
          break;
        }
        roundsSince++;
      }
      if (!found) roundsSince = totalCount;

      const lastRound = appearances[appearances.length - 1];

      return {
        ...team,
        count,
        percentage: Number(percentage),
        longestStreak,
        currentStreak,
        avgGap: Number(avgGap),
        roundsSince,
        lastAppearanceRound: lastRound ? lastRound.roundNumber : 'None',
        expectedFrequency: Number((team.baseTheoreticalOdds * 100).toFixed(1)),
      };
    });
  }, [chronological, totalCount]);

  // Multiplier distribution
  const multiplierStats = useMemo(() => {
    const counts: Record<MultiplierTier, number> = { 4: 0, 6: 0, 12: 0, 40: 0 };
    chronological.forEach((r) => {
      if (counts[r.multiplier] !== undefined) {
        counts[r.multiplier]++;
      }
    });

    const colors: Record<MultiplierTier, string> = {
      4: '#3B82F6', // Blue
      6: '#10B981', // Emerald
      12: '#EC4899', // Pink
      40: '#F59E0B', // Amber
    };

    return ([4, 6, 12, 40] as MultiplierTier[]).map((m) => ({
      name: `X${m}`,
      count: counts[m],
      percentage: totalCount > 0 ? Number(((counts[m] / totalCount) * 100).toFixed(1)) : 0,
      color: colors[m],
    }));
  }, [chronological, totalCount]);

  // Chart data for team frequency bar chart
  const barChartData = useMemo(() => {
    return teamStats.map((t) => ({
      name: t.shortName,
      Actual: t.count,
      Expected: Number((totalCount * t.baseTheoreticalOdds).toFixed(1)),
      fill: t.secondaryColor || '#10B981',
    }));
  }, [teamStats, totalCount]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold text-base">Long-Term Statistical Dashboard</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Empirical breakdown across {totalCount} rounds: Team win rates, streaks, gap distributions, and theoretical odds comparison.
          </p>
        </div>
      </div>

      {/* Multiplier Distribution Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {multiplierStats.map((item) => (
          <div key={item.name} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-amber-400 text-base">{item.name} Multiplier</span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              {item.percentage}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
              {item.count} total occurrences
            </span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Frequency Comparison Bar Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <h3 className="text-white font-bold text-sm sm:text-base mb-4">
            Team Appearance Frequencies (Observed vs Expected Baseline)
          </h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#FFF' }}
                />
                <Bar dataKey="Actual" fill="#10B981" radius={[4, 4, 0, 0]} name="Observed Wins" />
                <Bar dataKey="Expected" fill="#64748B" radius={[4, 4, 0, 0]} name="Expected Theoretical" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multiplier Donut Pie Chart */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <h3 className="text-white font-bold text-sm sm:text-base mb-2">Multiplier Tier Share</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={multiplierStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {multiplierStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-400 text-center border-t border-slate-800 pt-2 mt-2">
            X4 & X6 constitute high-frequency base wins.
          </div>
        </div>
      </div>

      {/* Complete Historical Team Stats Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Comprehensive Historical Team Performance Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Team</th>
                <th className="py-3 px-3">Multiplier</th>
                <th className="py-3 px-3">Total Wins</th>
                <th className="py-3 px-3">Win % (Observed)</th>
                <th className="py-3 px-3">Expected %</th>
                <th className="py-3 px-3">Longest Streak</th>
                <th className="py-3 px-3">Current Streak</th>
                <th className="py-3 px-3">Average Gap</th>
                <th className="py-3 px-3">Rounds Since Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {teamStats.map((team) => (
                <tr key={team.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <TeamCrest teamId={team.id} size="xs" />
                      <span className="font-semibold text-white">{team.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono font-black text-amber-400 text-[11px]">
                      X{team.multiplier}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-white">
                    {team.count}
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-emerald-400">
                    {team.percentage}%
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-400">
                    {team.expectedFrequency}%
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">
                    {team.longestStreak} in a row
                  </td>

                  <td className="py-3 px-3 font-mono">
                    {team.currentStreak > 0 ? (
                      <span className="text-amber-400 font-bold">{team.currentStreak} 🔥</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">
                    {team.avgGap} rounds
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className={team.roundsSince > team.avgGap * 1.5 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {team.roundsSince} rounds ago
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
