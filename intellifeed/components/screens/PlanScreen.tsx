import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, TextStyles, Shadow } from '../../constants/Theme';
import { Tappable, EntranceView, ProgressRing } from '../ui';
import { getCategoryStyle } from '../../constants/Categories';
import { PLAN_ITEMS, PlanItem, PlanStep, USER_PROFILE } from '../../constants/MockData';

// Step-type glyphs (no icon library in this repo — text glyphs match the app).
const STEP_GLYPH: Record<string, string> = {
  read: '❝', watch: '▷', buy: '＋', practice: '✦', task: '◎',
};
const stepGlyph = (type: string) => STEP_GLYPH[type] ?? '◎';

// ── Up Next — the single most important action ──────────────────────────────
function UpNext({ plan, step, idx, total, onComplete, onOpen }: {
  plan: PlanItem; step: PlanStep; idx: number; total: number; onComplete: () => void; onOpen: () => void;
}) {
  const cs = getCategoryStyle(plan.category);
  return (
    <View style={[styles.card, styles.cardGlow, { padding: 0 }]}>
      <View style={{ height: 3, backgroundColor: cs.color }} />
      <View style={{ padding: Spacing.lg }}>
        <View style={styles.upNextTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={[styles.dot, { backgroundColor: cs.color }]} />
            <Text style={styles.goldKicker}>UP NEXT</Text>
          </View>
          <Text style={styles.stepCount}>Step {idx + 1} of {total}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 13 }}>
          <View style={[styles.stepIconBox, { borderColor: cs.color + '55', backgroundColor: cs.color + '1f' }]}>
            <Text style={[styles.stepIconGlyph, { color: cs.color }]}>{stepGlyph(step.type)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.stepType, { color: cs.color }]}>{step.type.toUpperCase()}</Text>
            <Text style={styles.upNextTitle}>{step.title}</Text>
          </View>
        </View>

        <Text style={styles.upNextDesc}>{step.description}</Text>
        <Text style={styles.upNextFrom}>from {plan.title}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Tappable style={[styles.primaryBtn, { flex: 1 }]} onPress={onComplete}>
            <Text style={styles.primaryBtnText}>✓  Mark complete</Text>
          </Tappable>
          <Tappable style={styles.ghostBtn} onPress={onOpen}>
            <Text style={styles.ghostBtnText}>Details</Text>
          </Tappable>
        </View>
      </View>
    </View>
  );
}

// ── Momentum strip ──────────────────────────────────────────────────────────
function Momentum({ active, overall, completed }: { active: number; overall: number; completed: number }) {
  const days = [1, 1, 1, 0, 1, 1, 0];
  return (
    <View style={[styles.card, { padding: Spacing.base }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.faintKicker, { marginBottom: 10 }]}>THIS WEEK</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {days.map((d, i) => (
              <View
                key={i}
                style={{
                  flex: 1, height: 26, borderRadius: 7,
                  backgroundColor: d ? Colors.primary : Colors.border,
                  opacity: d ? 0.45 + i * 0.09 : 1,
                  alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3,
                }}
              >
                <Text style={{ fontFamily: Fonts.sansSemibold, fontSize: 8.5, color: d ? Colors.onPrimary : Colors.textFaint }}>
                  {'MTWTFSS'[i]}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 12 }}>
            <Text style={styles.momentumStat}><Text style={styles.momentumStatNum}>{active}</Text> active</Text>
            <Text style={styles.momentumStat}><Text style={styles.momentumStatNum}>{completed}</Text> completed</Text>
          </View>
        </View>
        <View style={styles.vDivider} />
        <View style={{ alignItems: 'center' }}>
          <ProgressRing pct={overall} size={62} stroke={5} color={Colors.gold} />
          <Text style={[styles.faintKicker, { marginTop: 8 }]}>OVERALL</Text>
        </View>
      </View>
    </View>
  );
}

// ── Timeline step row ───────────────────────────────────────────────────────
function StepRow({ step, onToggle, first, last }: { step: PlanStep; onToggle: () => void; first: boolean; last: boolean }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ width: 26, alignItems: 'center' }}>
        {!first && <View style={[styles.connector, { top: 0, height: 24 }]} />}
        {!last && <View style={[styles.connector, { top: 24, bottom: 0 }]} />}
        <View style={[styles.stepNode, step.isCompleted && styles.stepNodeDone]}>
          <Text style={[styles.stepNodeGlyph, step.isCompleted && { color: Colors.onPrimary }]}>
            {step.isCompleted ? '✓' : stepGlyph(step.type)}
          </Text>
        </View>
      </View>
      <View style={[styles.stepBody, last && { borderBottomWidth: 0 }]}>
        <Text style={styles.stepRowType}>{step.type.toUpperCase()}</Text>
        <Text style={[styles.stepRowTitle, step.isCompleted && styles.stepRowTitleDone]}>{step.title}</Text>
        <Text style={styles.stepRowDesc}>{step.description}</Text>
        {step.link ? (
          <View style={styles.linkPill}><Text style={styles.linkText}>→ Open resource</Text></View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Plan card ───────────────────────────────────────────────────────────────
function PlanCard({ plan, onToggleStep, defaultOpen }: { plan: PlanItem; onToggleStep: (planId: string, stepId: string) => void; defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!defaultOpen);
  const cs = getCategoryStyle(plan.category);
  const done = plan.steps.filter(s => s.isCompleted).length;

  return (
    <View style={[styles.card, { padding: 0 }]}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 3, backgroundColor: cs.color }} />
        <View style={{ flex: 1, padding: Spacing.lg }}>
          <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.8} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={[styles.typeTag, { backgroundColor: cs.color }]}>{plan.type.toUpperCase()}</Text>
                {plan.dueDate ? <Text style={styles.dueDate}>{plan.dueDate}</Text> : null}
              </View>
              <Text style={styles.planTitle} numberOfLines={2}>{plan.title}</Text>
              <Text style={styles.planSteps}>{done} of {plan.steps.length} steps complete</Text>
            </View>
            <ProgressRing pct={plan.progress} size={52} color={cs.color} />
          </TouchableOpacity>

          <View style={styles.toggleRow}>
            <View style={styles.toggleRule} />
            <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
              <Text style={styles.toggleText}>{open ? 'HIDE STEPS  ⌄' : 'VIEW STEPS  ›'}</Text>
            </TouchableOpacity>
            <View style={styles.toggleRule} />
          </View>

          {open ? (
            <View style={{ marginTop: 10 }}>
              {plan.steps.map((s, i) => (
                <StepRow key={s.id} step={s} first={i === 0} last={i === plan.steps.length - 1} onToggle={() => onToggleStep(plan.id, s.id)} />
              ))}
              <View style={styles.aiNudge}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Text style={{ color: Colors.gold, fontSize: 13 }}>✦</Text>
                  <Text style={styles.goldKicker}>SAPIENCE AI</Text>
                </View>
                <Text style={styles.aiNudgeText}>
                  Completing the next session before breakfast tomorrow will maximise adherence — your data shows mornings stick.
                </Text>
              </View>
              <Tappable style={[styles.ghostBtn, { marginTop: 12, alignSelf: 'flex-start' }]} onPress={() => router.push({ pathname: '/plan-detail/[id]', params: { id: plan.id } })}>
                <Text style={styles.ghostBtnText}>Open plan</Text>
              </Tappable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const [plans, setPlans] = useState(PLAN_ITEMS);

  const toggleStep = (planId: string, stepId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const steps = p.steps.map(s => s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s);
      const progress = Math.round(steps.filter(s => s.isCompleted).length / steps.length * 100);
      return { ...p, steps, progress };
    }));
  };

  const overall = plans.length ? Math.round(plans.reduce((a, p) => a + p.progress, 0) / plans.length) : 0;
  const completed = USER_PROFILE.plansCompleted ?? plans.filter(p => p.progress >= 100).length;

  // First incomplete step across plans → Up Next.
  let upNext: { plan: PlanItem; step: PlanStep; idx: number } | null = null;
  for (const p of plans) {
    const idx = p.steps.findIndex(s => !s.isCompleted);
    if (idx !== -1) { upNext = { plan: p, step: p.steps[idx], idx }; break; }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <EntranceView>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={TextStyles.overline}>FROM THEORY TO ACTION</Text>
              <Text style={[TextStyles.screenTitle, { marginTop: 6 }]}>
                Plan<Text style={{ color: Colors.primary }}>.</Text>
              </Text>
            </View>
            <Tappable style={styles.addBtn} onPress={() => {}}>
              <Text style={styles.addBtnGlyph}>＋</Text>
            </Tappable>
          </View>

          <View style={styles.body}>
            {upNext ? (
              <UpNext
                plan={upNext.plan} step={upNext.step} idx={upNext.idx} total={upNext.plan.steps.length}
                onComplete={() => toggleStep(upNext!.plan.id, upNext!.step.id)}
                onOpen={() => {}}
              />
            ) : null}

            <Momentum active={plans.length} overall={overall} completed={completed} />

            <View>
              <View style={styles.sectionHead}>
                <Text style={styles.faintKicker}>ACTIVE PLANS · {plans.length}</Text>
              </View>
              <View style={{ gap: 14 }}>
                {plans.map((p, i) => (
                  <PlanCard key={p.id} plan={p} onToggleStep={toggleStep} defaultOpen={i === 0 && !upNext} />
                ))}
              </View>
            </View>

            <View style={styles.savePrompt}>
              <View style={styles.savePromptIcon}><Text style={{ color: Colors.primary, fontSize: 20 }}>✦</Text></View>
              <Text style={styles.savePromptTitle}>Turn reading into action</Text>
              <Text style={styles.savePromptText}>
                Save any piece from your feed and Sapience drafts a structured plan you can act on.
              </Text>
            </View>
          </View>
        </EntranceView>
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
    paddingBottom: Spacing.sm,
  },
  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.base, gap: 16 },

  addBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnGlyph: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.sansMedium },

  // Card shell
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardGlow: { borderColor: Colors.hairlineGold, ...Shadow.glow },

  // Kickers
  goldKicker: { fontFamily: Fonts.sansSemibold, fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase', color: Colors.gold },
  faintKicker: { fontFamily: Fonts.sansSemibold, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textFaint },

  // Up Next
  upNextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stepCount: { fontFamily: Fonts.mono, fontSize: 10.5, color: Colors.textMuted },
  stepIconBox: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepIconGlyph: { fontSize: 18 },
  stepType: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1, marginBottom: 4 },
  upNextTitle: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 23, letterSpacing: -0.3, color: Colors.textPrimary },
  upNextDesc: { fontFamily: Fonts.sans, fontSize: 13.5, lineHeight: 20, color: Colors.textSecondary, marginTop: 12 },
  upNextFrom: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 8, fontStyle: 'italic' },

  primaryBtn: {
    minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: Colors.primary,
  },
  primaryBtnText: { fontFamily: Fonts.sansSemibold, fontSize: 14.5, color: Colors.onPrimary, letterSpacing: 0.2 },
  ghostBtn: {
    minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: Colors.borderStrong,
  },
  ghostBtnText: { fontFamily: Fonts.sansSemibold, fontSize: 13.5, color: Colors.textSecondary },

  // Momentum
  momentumStat: { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.textMuted },
  momentumStatNum: { fontFamily: Fonts.sansBold, color: Colors.textPrimary },
  vDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Colors.border },

  // Section
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },

  // Plan card header
  typeTag: { fontFamily: Fonts.sansBold, fontSize: 9.5, letterSpacing: 1.2, color: Colors.onPrimary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  dueDate: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textMuted },
  planTitle: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 22, letterSpacing: -0.3, color: Colors.textPrimary },
  planSteps: { fontFamily: Fonts.sans, fontSize: 11.5, color: Colors.textMuted, marginTop: 5 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  toggleRule: { flex: 1, height: 1, backgroundColor: Colors.border },
  toggleText: { fontFamily: Fonts.sansSemibold, fontSize: 11, letterSpacing: 0.6, color: Colors.primary },

  // Timeline step
  connector: { position: 'absolute', width: 2, backgroundColor: Colors.border },
  stepNode: {
    width: 26, height: 26, marginTop: 12, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.borderStrong, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNodeDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNodeGlyph: { fontSize: 12, color: Colors.textMuted, fontFamily: Fonts.sansBold },
  stepBody: { flex: 1, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, minHeight: 44 },
  stepRowType: { fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: 1, color: Colors.primary, marginBottom: 3 },
  stepRowTitle: { fontFamily: Fonts.sansSemibold, fontSize: 14.5, lineHeight: 19, color: Colors.textPrimary },
  stepRowTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  stepRowDesc: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 18, color: Colors.textMuted, marginTop: 4 },
  linkPill: {
    alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary + '55',
  },
  linkText: { fontFamily: Fonts.sansSemibold, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', color: Colors.primary },

  aiNudge: {
    marginTop: 14, padding: 14, borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft, borderWidth: 1, borderColor: Colors.hairlineGold,
  },
  aiNudgeText: { fontFamily: Fonts.sans, fontSize: 13.5, lineHeight: 20, color: Colors.textSecondary, fontStyle: 'italic' },

  // Save prompt
  savePrompt: {
    alignItems: 'center', paddingVertical: 22, paddingHorizontal: Spacing.lg, gap: 4,
    borderWidth: 1, borderColor: Colors.borderStrong, borderStyle: 'dashed', borderRadius: Radius.card,
  },
  savePromptIcon: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primarySoft, marginBottom: 6,
  },
  savePromptTitle: { fontFamily: Fonts.display, fontSize: 17, color: Colors.textPrimary },
  savePromptText: { fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 19, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
});
