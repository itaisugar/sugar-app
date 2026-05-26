import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { PLAN_ITEMS, PlanStep } from '../../constants/MockData';

const STEP_LABELS: Record<string, string> = {
  task: 'Task',
  buy: 'Acquire',
  read: 'Study',
  watch: 'Watch',
  practice: 'Practice',
};

export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = PLAN_ITEMS.find(p => p.id === id) ?? PLAN_ITEMS[0];

  const [plan, setPlan] = useState(found);
  const [reflection, setReflection] = useState('');

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Plan not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnPrimary}>
            <Text style={TextStyles.buttonPrimary}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleStep = (i: number) => {
    setPlan({
      ...plan,
      steps: plan.steps.map((s, idx) => idx === i ? { ...s, isCompleted: !s.isCompleted } : s),
    });
  };

  const weekCurrent = Math.max(1, Math.round((plan.progress / 100) * 8));
  const weeksTotal = 8;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={TextStyles.overline}>Plan</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={TextStyles.kicker}>Week {weekCurrent} of {weeksTotal}</Text>
        <Text style={styles.title}>
          {plan.title}
        </Text>
        <Text style={[TextStyles.tagline, { marginTop: 8 }]}>
          Origin: {plan.sourceItem}
        </Text>

        {/* Week timeline */}
        <View style={styles.weekBlock}>
          <Text style={[TextStyles.overline, { marginBottom: 10 }]}>
            Weeks · {weekCurrent}/{weeksTotal}
          </Text>
          <View style={styles.weekBars}>
            {Array.from({ length: weeksTotal }).map((_, i) => {
              const past = i < weekCurrent - 1;
              const current = i === weekCurrent - 1;
              return (
                <View
                  key={i}
                  style={[
                    styles.weekBar,
                    past && { backgroundColor: Colors.primary },
                    current && { borderWidth: 1, borderColor: Colors.primary, backgroundColor: 'transparent' },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsBlock}>
          <Text style={[TextStyles.overline, { marginBottom: 14 }]}>The steps</Text>
          {plan.steps.map((s, i) => (
            <StepRow key={s.id} step={s} onToggle={() => toggleStep(i)} />
          ))}
        </View>

        {/* Reflection */}
        <View style={styles.reflectionCard}>
          <Text style={[TextStyles.kicker, { marginBottom: 8 }]}>Reflection</Text>
          <Text style={styles.reflectionPrompt}>
            "How has this changed the way you think about practice in your day?"
          </Text>
          <View style={styles.reflectionField}>
            <Text style={[TextStyles.tagline, { color: Colors.textFaint }]}>
              {reflection || 'Tap to write three sentences.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepRow({ step, onToggle }: { step: PlanStep; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.stepRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.stepCheck, step.isCompleted && styles.stepCheckDone]}>
        {step.isCompleted ? <Text style={styles.stepCheckIcon}>✓</Text> : null}
      </View>
      <View style={{ flex: 1, opacity: step.isCompleted ? 0.55 : 1 }}>
        <Text style={[TextStyles.kicker, { color: step.isCompleted ? Colors.textFaint : Colors.primary, fontSize: 9 }]}>
          {STEP_LABELS[step.type] ?? step.type}
        </Text>
        <Text style={[
          styles.stepTitle,
          step.isCompleted && { textDecorationLine: 'line-through', color: Colors.textMuted },
        ]}>
          {step.title}
        </Text>
        {step.description ? (
          <Text style={[TextStyles.helper, { marginTop: 2 }]}>{step.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 8 },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18, color: Colors.textPrimary },

  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },

  title: {
    fontFamily: Fonts.serif,
    fontSize: 32, lineHeight: 34,
    letterSpacing: -0.7,
    color: Colors.textPrimary,
    marginTop: 12,
  },

  weekBlock: { marginTop: Spacing.xl },
  weekBars: { flexDirection: 'row', gap: 4 },
  weekBar: {
    flex: 1, height: 8, borderRadius: 2,
    backgroundColor: Colors.surfaceBorder,
  },

  stepsBlock: { marginTop: Spacing.xl },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderColor: Colors.surfaceBorder,
  },
  stepCheck: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1, borderColor: Colors.surfaceBorderStrong,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  stepCheckDone: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  stepCheckIcon: { color: Colors.surface, fontSize: 12, fontFamily: Fonts.sansBold },
  stepTitle: {
    fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22,
    color: Colors.textPrimary,
    marginTop: 4,
  },

  reflectionCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.surfaceBorder,
  },
  reflectionPrompt: {
    fontFamily: Fonts.serifItalic,
    fontSize: 15, lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  reflectionField: {
    padding: 14,
    backgroundColor: Colors.background,
    borderWidth: 0.5, borderColor: Colors.surfaceBorderStrong,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },

  backBtnPrimary: {
    marginTop: 16,
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
});
