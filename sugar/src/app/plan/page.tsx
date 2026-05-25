'use client';

import { useState } from 'react';
import { PlanItem, PlanCategory } from '@/types';
import { store } from '@/data/store';
import TopBar from '@/components/layout/TopBar';
import PlanCard from '@/components/plan/PlanCard';

type FilterTab = 'all' | PlanCategory;

const tabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'learning', label: 'Learning' },
  { id: 'health', label: 'Health' },
  { id: 'habit', label: 'Habits' },
];

export default function PlanPage() {
  const [plans, setPlans] = useState<PlanItem[]>(store.getPlanItems());
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered =
    activeTab === 'all' ? plans : plans.filter((p) => p.category === activeTab);

  const handleToggleStep = (planId: string, stepId: string) => {
    store.toggleStep(planId, stepId);
    setPlans([...store.getPlanItems()]);
  };

  const handleRemove = (planId: string) => {
    store.removePlanItem(planId);
    setPlans([...store.getPlanItems()]);
  };

  const totalCompleted = plans.reduce(
    (acc, p) => acc + p.steps.filter((s) => s.isCompleted).length,
    0
  );
  const totalSteps = plans.reduce((acc, p) => acc + p.steps.length, 0);

  return (
    <>
      <TopBar title="My Plans" />

      {/* Overall progress summary */}
      {plans.length > 0 && (
        <div
          className="mx-4 mt-4 p-4 rounded-2xl border"
          style={{ backgroundColor: '#141414', borderColor: '#2A2A2A' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: '#F5F5F5' }}>
              Overall Progress
            </span>
            <span className="text-sm font-bold" style={{ color: '#D48B2C' }}>
              {totalCompleted}/{totalSteps} steps
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '6px', backgroundColor: '#2A2A2A' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: totalSteps > 0 ? `${(totalCompleted / totalSteps) * 100}%` : '0%',
                backgroundColor: '#D48B2C',
              }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b"
        style={{ borderColor: '#2A2A2A' }}
      >
        {tabs.map((tab) => {
          const count =
            tab.id === 'all'
              ? plans.length
              : plans.filter((p) => p.category === tab.id).length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-95"
              style={
                isActive
                  ? { backgroundColor: '#D48B2C', color: '#000' }
                  : {
                      backgroundColor: '#1E1E1E',
                      color: '#888888',
                      border: '1px solid #2A2A2A',
                    }
              }
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                  style={
                    isActive
                      ? { backgroundColor: 'rgba(0,0,0,0.2)', color: '#000' }
                      : { backgroundColor: '#2A2A2A', color: '#888' }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Plan cards */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-base font-medium mb-1" style={{ color: '#F5F5F5' }}>
              No plans yet
            </p>
            <p className="text-sm text-center" style={{ color: '#888888' }}>
              Add content from your Feed to create action plans
            </p>
          </div>
        ) : (
          filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onToggleStep={handleToggleStep}
              onRemove={handleRemove}
            />
          ))
        )}
        <div className="h-4" />
      </div>
    </>
  );
}
