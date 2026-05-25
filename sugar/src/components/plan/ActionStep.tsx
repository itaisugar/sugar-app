'use client';

import {
  BookOpen,
  ShoppingCart,
  Calendar,
  Bell,
  Dumbbell,
  Target,
} from 'lucide-react';
import { ActionStep as ActionStepType } from '@/types';

const stepIcons = {
  read: BookOpen,
  buy: ShoppingCart,
  calendar: Calendar,
  reminder: Bell,
  exercise: Dumbbell,
  practice: Target,
};

const stepColors = {
  read: '#A5B4FC',
  buy: '#6EE7B7',
  calendar: '#FCD34D',
  reminder: '#F9A8D4',
  exercise: '#86EFAC',
  practice: '#D48B2C',
};

interface ActionStepProps {
  step: ActionStepType;
  onToggle: (stepId: string) => void;
}

export default function ActionStep({ step, onToggle }: ActionStepProps) {
  const Icon = stepIcons[step.type];
  const color = stepColors[step.type];

  return (
    <button
      onClick={() => onToggle(step.id)}
      className="w-full flex items-start gap-3 py-2.5 text-left transition-opacity active:opacity-70"
    >
      {/* Custom checkbox */}
      <div
        className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        style={
          step.isCompleted
            ? { backgroundColor: '#D48B2C', borderColor: '#D48B2C' }
            : { backgroundColor: 'transparent', borderColor: '#2A2A2A' }
        }
      >
        {step.isCompleted && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Step icon */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={14} style={{ color }} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug transition-all duration-200"
          style={{
            color: step.isCompleted ? '#888888' : '#F5F5F5',
            textDecoration: step.isCompleted ? 'line-through' : 'none',
          }}
        >
          {step.label}
        </p>
        {step.detail && !step.isCompleted && (
          <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
            {step.detail}
          </p>
        )}
      </div>
    </button>
  );
}
