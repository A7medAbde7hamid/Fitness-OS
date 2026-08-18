import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { WeeklyReportService } from '../../services/weeklyReportService';
import { WeeklyReportData } from '../../types';

interface WeeklyReportViewProps {
  onClose?: () => void;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({ onClose }) => {
  const { t, language, formatWeight, formatNumber } = useI18n();
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    WeeklyReportService.generate(user.id).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#FF4E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) return null;

  const weightColor = report.weight.trend === 'losing' ? 'text-emerald-400' :
    report.weight.trend === 'gaining' ? 'text-red-400' : 'text-gray-400';

  const consistencyScore = Math.round(
    ((report.consistency.checkInsCompleted / 7) * 30 +
    (report.consistency.mealsLogged > 0 ? 30 : 0) +
    (report.consistency.weightLogged > 0 ? 20 : 0) +
    (report.workout.workoutsCompleted > 0 ? 20 : 0))
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">{t('weeklyReport.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {report.startDate} — {report.endDate}
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('weeklyReport.overview')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">{t('weeklyReport.weightChange')}</p>
            <p className={`text-lg font-bold ${weightColor}`}>
              {report.weight.deltaKg > 0 ? '+' : ''}{formatNumber(report.weight.deltaKg)} kg
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('weeklyReport.consistency')}</p>
            <p className="text-lg font-bold text-white">{consistencyScore}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('weeklyReport.workoutsCompleted')}</p>
            <p className="text-lg font-bold text-white">{report.workout.workoutsCompleted}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('weeklyReport.totalMeals')}</p>
            <p className="text-lg font-bold text-white">{report.nutrition.totalMealsLogged}</p>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('weeklyReport.weight')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.startWeight')}</span>
            <span className="text-white">{formatNumber(report.weight.startKg)} kg</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.endWeight')}</span>
            <span className="text-white">{formatNumber(report.weight.endKg)} kg</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.average')}</span>
            <span className="text-white">{formatNumber(report.weight.avgKg)} kg</span>
          </div>
        </div>
        {report.weight.dailyWeights.length > 0 && (
          <div className="mt-3 h-20 flex items-end gap-1">
            {report.weight.dailyWeights.map((w, i) => {
              const max = Math.max(...report.weight.dailyWeights.map((d) => d.weightKg));
              const min = Math.min(...report.weight.dailyWeights.map((d) => d.weightKg));
              const range = max - min || 1;
              const height = ((w.weightKg - min) / range) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-[#FF4E00]/60 rounded-t"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${w.date}: ${w.weightKg} kg`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Nutrition */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('weeklyReport.nutrition')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.avgCalories')}</span>
            <span className="text-white">{formatNumber(report.nutrition.avgDailyCalories)} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.avgProtein')}</span>
            <span className="text-white">{formatNumber(report.nutrition.avgDailyProtein)} g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.avgCarbs')}</span>
            <span className="text-white">{formatNumber(report.nutrition.avgDailyCarbs)} g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.avgFat')}</span>
            <span className="text-white">{formatNumber(report.nutrition.avgDailyFat)} g</span>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('weeklyReport.activity')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.totalSteps')}</span>
            <span className="text-white">{formatNumber(report.activity.totalSteps)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.avgDailySteps')}</span>
            <span className="text-white">{formatNumber(report.activity.avgDailySteps)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.activeMinutes')}</span>
            <span className="text-white">{formatNumber(report.activity.totalActiveMinutes)} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.daysActive')}</span>
            <span className="text-white">{report.activity.daysActive}/7</span>
          </div>
        </div>
      </div>

      {/* Workout */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('weeklyReport.workout')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.completed')}</span>
            <span className="text-white">{report.workout.workoutsCompleted}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{t('weeklyReport.totalDuration')}</span>
            <span className="text-white">{formatNumber(report.workout.totalDurationMinutes)} min</span>
          </div>
          {Object.entries(report.workout.categories).map(([cat, count]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-gray-400 capitalize">{cat}</span>
              <span className="text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl bg-white/5 text-gray-400 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          {t('common.close')}
        </button>
      )}
    </div>
  );
};
