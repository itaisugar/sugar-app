import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '../../constants/Theme';
import { PLAN_ITEMS, PlanItem, PlanStep } from '../../constants/MockData';

const TYPE_LABELS: Record<string, string> = {
  fitness: 'PROTOCOL',
  learning: 'STUDY PATH',
  reading: 'READING',
  research: 'RESEARCH',
  habit: 'PRACTICE',
};

const STEP_LABELS: Record<string, string> = {
  task: 'TASK',
  buy: 'ACQUIRE',
  read: 'READ',
  watch: 'WATCH',
  practice: 'PRACTICE',
};

function StepRow({ step, onToggle }: { step: PlanStep; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.stepRow} onPress={onToggle}>
      <View style={[styles.stepCheck, step.isCompleted && styles.stepCheckDone]}>
        {step.isCompleted && <Text style={styles.stepCheckIcon}>✓</Text>}
      </View>
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTypeLabel}>{STEP_LABELS[step.type]}</Text>
        </View>
        <Text style={[styles.stepTitle, step.isCompleted && styles.stepTitleDone]}>
          {step.title}
        </Text>
        <Text style={styles.stepDesc}>{step.description}</Text>
        {step.link && (
          <View style={styles.linkPill}>
            <Text style={styles.linkText}>Open Resource</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PlanCard({ plan, onStepToggle }: { plan: PlanItem; onStepToggle: (planId: string, stepId: string) => void }) {
  const [expanded, setExpanded] = useState(plan.id === 'p1');
  const completedSteps = plan.steps.filter(s => s.isCompleted).length;

  return (
    <View style={styles.planCard}>
      <TouchableOpacity style={styles.planHeader} onPress={() => setExpanded(!expanded)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.planType}>{TYPE_LABELS[plan.type]}</Text>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planSource} numberOfLines={1}>Origin: {plan.sourceItem}</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${plan.progress}%` }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressText}>{plan.progress}% Complete</Text>
          <Text style={styles.progressSteps}>{completedSteps} of {plan.steps.length} steps</Text>
        </View>
      </View>

      <View style={styles.datesRow}>
        <Text style={styles.dateText}>{plan.createdAt}</Text>
        {plan.dueDate && <Text style={styles.dateText}>{plan.dueDate}</Text>}
      </View>

      {expanded && (
        <View style={styles.stepsContainer}>
          <View style={styles.divider} />
          {plan.steps.map(step => (
            <StepRow
              key={step.id}
              step={step}
              onToggle={() => onStepToggle(plan.id, step.id)}
            />
          ))}
        </View>
      )}

      {expanded && (
        <View style={styles.aiHint}>
          <Text style={styles.aiHintLabel}>AI RECOMMENDATION</Text>
          <Text style={styles.aiHintText}>
            Based on your progression, completing step three tomorrow morning — before breakfast —
            will yield optimal adherence.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function PlanScreen() {
  const [plans, setPlans] = useState(PLAN_ITEMS);

  const handleStepToggle = (planId: string, stepId: string) => {
    setPlans(prev =>
      prev.map(plan => {
        if (plan.id !== planId) return plan;
        const steps = plan.steps.map(s =>
          s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        const completed = steps.filter(s => s.isCompleted).length;
        const progress = Math.round((completed / steps.length) * 100);
        return { ...plan, steps, progress };
      })
    );
  };

  const totalProgress = Math.round(
    plans.reduce((acc, p) => acc + p.progress, 0) / plans.length
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>From Theory to Action</Text>
            <Text style={styles.headerTitle}>Plan</Text>
            <Text style={styles.tagline}>Convert insights into concrete steps.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{plans.length}</Text>
              <Text style={styles.summaryLabel}>Active Plans</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{totalProgress}%</Text>
              <Text style={styles.summaryLabel}>Overall Progress</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>9</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>DAILY AI INSIGHT</Text>
          <Text style={styles.insightText}>
            "{plans.filter(p => p.progress < 50).length} plans require renewed attention.
            Analysis suggests completing the Zone 2 challenge will improve your AI study retention by 32%."
          </Text>
        </View>

        <View style={{ paddingHorizontal: Spacing.lg, gap: 16 }}>
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onStepToggle={handleStepToggle} />
          ))}

          <View style={styles.emptyPrompt}>
            <Text style={styles.emptyPromptTitle}>Save to Plan</Text>
            <Text style={styles.emptyPromptText}>
              Curate insights from the feed — our AI will transform them into a personalized course of action.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  kicker: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  addBtnText: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: {
    fontSize: 32,
    fontFamily: Fonts.serif,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryDivider: { width: 1, height: 48, backgroundColor: Colors.surfaceBorder },
  insightCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.base,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
  },
  insightLabel: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  insightText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    gap: 12,
  },
  planType: {
    fontSize: 10,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  planSource: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  expandIcon: {
    fontSize: 24,
    fontFamily: Fonts.sansBold,
    color: Colors.primary,
    paddingHorizontal: 4,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  progressSteps: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.base,
  },
  stepsContainer: {
    gap: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  stepCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  stepCheckDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCheckIcon: {
    color: Colors.background,
    fontSize: 12,
    fontFamily: Fonts.sansBold,
  },
  stepContent: { flex: 1 },
  stepHeader: {
    marginBottom: 4,
  },
  stepTypeLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  stepTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  linkPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    borderRadius: Radius.sm,
  },
  linkText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    color: Colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  aiHint: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  aiHintLabel: {
    fontSize: 9,
    fontFamily: Fonts.sansSemibold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  aiHintText: {
    fontSize: 13,
    fontFamily: Fonts.serifItalic,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyPrompt: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
  },
  emptyPromptTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: Colors.textPrimary,
  },
  emptyPromptText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
