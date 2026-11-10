import React, { useState } from 'react';
import { CalendarRange, Dumbbell, Scale, Utensils } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LiquidTabs } from '../components/common/LiquidTabs';
import { BodyChart } from '../components/dashboard/BodyChart';
import { PfcChart } from '../components/dashboard/PfcChart';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { WorkoutChart } from '../components/dashboard/WorkoutChart';
import { BodyForm } from '../components/forms/BodyForm';
import { DietForm } from '../components/forms/DietForm';
import { WorkoutForm } from '../components/forms/WorkoutForm';
import { RecordList } from '../components/history/RecordList';
import { NavTab } from '../components/layout/GooeyMenu';
import { Header } from '../components/layout/Header';
import { useFitnessRecords } from '../hooks/useFitnessRecords';
import { AuthUser, PeriodDays, RecordType } from '../types/records';

interface DashboardPageProps {
  user: AuthUser;
  onSignOut: () => void;
}

const TAB_ORDER: Record<NavTab, number> = {
  dashboard: 0,
  record: 1,
  history: 2,
};

/**
 * ページがパタッとめくれるような 3D フリップ「Turn Over」アニメーション Variants
 */
const turnOverVariants = {
  enter: (direction: number) => ({
    rotateY: direction >= 0 ? 75 : -75,
    opacity: 0,
    scale: 0.96,
    transformOrigin: direction >= 0 ? 'left center' : 'right center',
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transformOrigin: 'center center',
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: (direction: number) => ({
    rotateY: direction >= 0 ? -75 : 75,
    opacity: 0,
    scale: 0.96,
    transformOrigin: direction >= 0 ? 'right center' : 'left center',
    transition: {
      duration: 0.32,
      ease: [0.4, 0, 1, 1],
    },
  }),
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [turnDirection, setTurnDirection] = useState<number>(1);
  const [activeFormType, setActiveFormType] = useState<RecordType>('DIET');
  const [periodDays, setPeriodDays] = useState<PeriodDays>(7);

  const {
    records,
    dietRecords,
    workoutRecords,
    bodyRecords,
    loading,
    error,
    refresh,
    addDietRecord,
    addWorkoutRecord,
    addBodyRecord,
  } = useFitnessRecords(true);

  const handleChangeNavTab = (nextTab: NavTab) => {
    if (nextTab === activeTab) return;
    const dir = TAB_ORDER[nextTab] > TAB_ORDER[activeTab] ? 1 : -1;
    setTurnDirection(dir);
    setActiveTab(nextTab);
  };

  return (
    <div className="min-h-screen bg-theme-bg pb-12 text-theme-dark overflow-x-hidden">
      <Header
        user={user}
        activeTab={activeTab}
        onChangeTab={handleChangeNavTab}
        onRefresh={refresh}
        onSignOut={onSignOut}
        loading={loading}
      />

      <main
        className="relative z-10 mx-auto max-w-4xl space-y-4 px-4 pt-4"
        style={{ perspective: '1400px' }}
      >
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* ダッシュボード & 履歴画面共通: 期間切り替えトグル (7日間 / 30日間) */}
        {(activeTab === 'dashboard' || activeTab === 'history') && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-theme-muted/40 bg-white px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-theme-dark">
              <CalendarRange className="h-4 w-4 text-theme-main" />
              <span>データ表示期間:</span>
            </div>
            <div className="w-56">
              <LiquidTabs<PeriodDays>
                layoutIdPrefix="period-selector"
                size="sm"
                activeTab={periodDays}
                onChange={setPeriodDays}
                tabs={[
                  { id: 7, label: '直近1週間 (7日)' },
                  { id: 30, label: '直近1ヶ月 (30日)' },
                ]}
              />
            </div>
          </div>
        )}

        {/* メニュー遷移時の 3D Turn Over アニメーション */}
        <AnimatePresence mode="wait" custom={turnDirection}>
          <motion.div
            key={activeTab}
            custom={turnDirection}
            variants={turnOverVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
            className="space-y-5"
          >
            {activeTab === 'dashboard' && (
              <>
                <SummaryCards
                  dietRecords={dietRecords}
                  workoutRecords={workoutRecords}
                  bodyRecords={bodyRecords}
                  periodDays={periodDays}
                />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <PfcChart dietRecords={dietRecords} periodDays={periodDays} />
                  <BodyChart bodyRecords={bodyRecords} periodDays={periodDays} />
                </div>
                <WorkoutChart
                  workoutRecords={workoutRecords}
                  periodDays={periodDays}
                />
              </>
            )}

            {activeTab === 'record' && (
              <div className="mx-auto max-w-lg rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="mb-3 text-base font-bold text-theme-dark">
                  日々の記録を入力
                </h2>

                {/* Liquid Bulge エフェクト付きタブ切り替え (食事 / 筋トレ / 体組成) */}
                <div className="mb-5">
                  <LiquidTabs<RecordType>
                    layoutIdPrefix="record-type-tab"
                    activeTab={activeFormType}
                    onChange={setActiveFormType}
                    tabs={[
                      {
                        id: 'DIET',
                        label: '食事 (PFC)',
                        icon: <Utensils className="h-3.5 w-3.5" />,
                      },
                      {
                        id: 'WORKOUT',
                        label: '筋トレ',
                        icon: <Dumbbell className="h-3.5 w-3.5" />,
                      },
                      {
                        id: 'BODY',
                        label: '体組成',
                        icon: <Scale className="h-3.5 w-3.5" />,
                      },
                    ]}
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFormType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
                    {activeFormType === 'DIET' && (
                      <DietForm onSubmit={addDietRecord} />
                    )}
                    {activeFormType === 'WORKOUT' && (
                      <WorkoutForm
                        onSubmit={addWorkoutRecord}
                        recentWorkouts={workoutRecords}
                      />
                    )}
                    {activeFormType === 'BODY' && (
                      <BodyForm
                        onSubmit={addBodyRecord}
                        latestBody={bodyRecords[0]}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-theme-dark">
                    直近{periodDays}日間の記録タイムライン
                  </h2>
                  <span className="text-xs text-theme-muted">
                    全期間保持: {records.length} 件 (Hot DB)
                  </span>
                </div>
                <RecordList records={records} periodDays={periodDays} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
