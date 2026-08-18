import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { AppStorageRepository } from '../../db/storage';
import { GoalCalculationsService, WeightTrendDataPoint } from '../../services/goalCalculations';
import { GlassCard } from '../ui/GlassCard';

interface WeightTrendChartProps {
  days?: number;
  compact?: boolean;
}

type TimeRange = 7 | 30 | 90 | 'all';

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ days: defaultDays = 30, compact = false }) => {
  const { user, profile } = useAuth();
  const { language } = useI18n();
  const isAr = language === 'ar';

  const [timeRange, setTimeRange] = useState<TimeRange>(defaultDays as TimeRange);

  const trendData = useMemo<WeightTrendDataPoint[]>(() => {
    if (!user) return [];
    const measurements = AppStorageRepository.getMeasurements(user.id);
    const days = timeRange === 'all' ? 365 : timeRange;
    return GoalCalculationsService.getWeightTrendData(measurements, days);
  }, [user, timeRange]);

  const targetWeight = profile?.targetWeightKg;

  const stats = useMemo(() => {
    if (trendData.length === 0) return null;
    const weights = trendData.map((d) => d.weight);
    const latest = weights[weights.length - 1];
    const earliest = weights[0];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const change = Math.round((latest - earliest) * 10) / 10;
    return { latest, earliest, min, max, change };
  }, [trendData]);

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return isAr
      ? d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return isAr
      ? d.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric', year: 'numeric' })
      : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: WeightTrendDataPoint }> }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-[10px] text-neutral-400">{formatTooltipDate(data.date)}</p>
        <p className="text-sm font-bold text-white">{data.weight} {isAr ? 'كجم' : 'kg'}</p>
        {data.rollingAvg && (
          <p className="text-[10px] text-[#FF6B2B]">
            {isAr ? 'متوسط ٧ أيام' : '7-day avg'}: {data.rollingAvg}
          </p>
        )}
      </div>
    );
  };

  return (
    <GlassCard variant="card" className={`p-4 ${compact ? '' : 'sm:p-5'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">
          {isAr ? 'مخطط الوزن' : 'Weight Trend'}
        </h3>
        <div className="flex gap-1">
          {([7, 30, 90, 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              id={`weight-range-${range}`}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                timeRange === range
                  ? 'bg-[#FF4E00] text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {range === 'all' ? (isAr ? 'الكل' : 'All') : `${range}${isAr ? 'ي' : 'd'}`}
            </button>
          ))}
        </div>
      </div>

      {trendData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-xs text-neutral-500">
          {isAr ? 'لا توجد بيانات أوزان بعد' : 'No weight data yet'}
        </div>
      ) : (
        <>
          {stats && (
            <div className="flex justify-between text-[10px] text-neutral-400 mb-3 px-1">
              <span>
                {isAr ? 'الأحدث' : 'Latest'}: <span className="text-white font-bold">{stats.latest}</span>
              </span>
              <span>
                {isAr ? 'التغيير' : 'Change'}:{' '}
                <span className={`font-bold ${stats.change < 0 ? 'text-emerald-400' : stats.change > 0 ? 'text-red-400' : 'text-neutral-300'}`}>
                  {stats.change > 0 ? '+' : ''}{stats.change}
                </span>
              </span>
              <span>
                {isAr ? 'نطاق' : 'Range'}: {stats.min}–{stats.max}
              </span>
            </div>
          )}

          <div className={`${compact ? 'h-36' : 'h-48'} sm:h-56`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip content={<CustomTooltip />} />
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#FF6B2B"
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                    label={{
                      value: isAr ? 'الهدف' : 'Target',
                      position: 'right',
                      fill: '#FF6B2B',
                      fontSize: 9,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#FF4E00"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#FF4E00', stroke: '#fff', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="rollingAvg"
                  stroke="#FF8D24"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </GlassCard>
  );
};
