'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { PlanItem } from '@/types';
import SourceBadge from '@/components/feed/SourceBadge';
import ActionStep from './ActionStep';

interface PlanCardProps {
  plan: PlanItem;
  onToggleStep: (planId: string, stepId: string) => void;
  onRemove: (planId: string) => void;
}

export default function PlanCard({ plan, onToggleStep, onRemove }: PlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = plan.steps.filter((s) => s.isCompleted).length;
  const totalCount = plan.steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: '#141414', borderColor: '#2A2A2A' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left transition-colors active:opacity-80"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1.5">
              <SourceBadge type={plan.type} />
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{
                  backgroundColor: '#1E1E1E',
                  color: '#888888',
                  border: '1px solid #2A2A2A',
                }}
              >
                {plan.category}
              </span>
            </div>
            <h3
              className="font-semibold line-clamp-2 leading-snug"
              style={{ fontSize: '14px', color: '#F5F5F5' }}
            >
              {plan.title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
              {plan.source}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(plan.id);
                }}
                className="p-1 rounded-lg transition-opacity active:opacity-60"
                style={{ color: '#666' }}
              >
                <Trash2 size={14} />
              </button>
              {isExpanded ? (
                <ChevronUp size={16} style={{ color: '#888888' }} />
              ) : (
                <ChevronDown size={16} style={{ color: '#888888' }} />
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: '4px', backgroundColor: '#2A2A2A' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressPercent === 100 ? '#6EE7B7' : '#D48B2C',
              }}
            />
          </div>
          <span className="text-xs font-medium flex-shrink-0" style={{ color: '#888888' }}>
            {completedCount}/{totalCount} steps
          </span>
        </div>
      </button>

      {/* Steps */}
      {isExpanded && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: '#2A2A2A' }}
        >
          <div className="pt-2 space-y-0">
            {plan.steps.map((step, i) => (
              <div key={step.id}>
                <ActionStep
                  step={step}
                  onToggle={(stepId) => onToggleStep(plan.id, stepId)}
                />
                {i < plan.steps.length - 1 && (
                  <div style={{ height: '1px', backgroundColor: '#1E1E1E', marginLeft: '60px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
