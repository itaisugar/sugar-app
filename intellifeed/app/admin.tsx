import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Fonts, Shadow, TextStyles } from '../constants/Theme';
import { Field, PrimaryButton, Banner } from '../components/auth/FormPrimitives';
import { useProfile } from '../lib/ProfileContext';
import { summarizeUrl, createContentItem, AISummary } from '../lib/admin';

export default function AdminScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  // Gate the page client-side as well as via the Edge Function's admin check
  if (profile && !profile.is_admin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={TextStyles.emptyTitle}>Editorial access only</Text>
          <Text style={[TextStyles.emptyDescription, { textAlign: 'center', marginTop: 8 }]}>
            This area is reserved for accounts marked as editors.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={TextStyles.buttonSecondary}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── State ─────────────────────────────────────────────────────────────────
  const [url, setUrl] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<AISummary | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields (mirrors draft once generated)
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [readTime, setReadTime] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [contentUrl, setContentUrl] = useState('');

  // ── Actions ───────────────────────────────────────────────────────────────
  const onGenerate = async () => {
    setError(null);
    if (!url.trim()) {
      setError('Please paste a URL.');
      return;
    }
    setWorking(true);
    try {
      const result = await summarizeUrl(url.trim());
      setDraft(result);
      setTitle(result.title);
      setSummary(result.summary);
      setSource(result.source);
      setCategory(result.category);
      setReadTime(String(result.read_time));
      setTagsInput(result.tags.join(', '));
      setImageUrl(result.image_url);
      setContentUrl(result.content_url);
    } catch (e: any) {
      setError(e?.message ?? 'Could not summarize this URL.');
    } finally {
      setWorking(false);
    }
  };

  const onSave = async () => {
    setError(null);
    if (!title.trim() || !summary.trim() || !source.trim() || !category.trim()) {
      setError('Title, summary, source, and category are required.');
      return;
    }
    setSaving(true);
    try {
      await createContentItem({
        title: title.trim(),
        summary: summary.trim(),
        source: source.trim(),
        category: category.trim(),
        category_color: draft?.category_color ?? '#1D4ED8',
        read_time: parseInt(readTime, 10) || 5,
        image_url: imageUrl.trim(),
        content_url: contentUrl.trim(),
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      Alert.alert('Published', 'The article is now live in the feed.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e?.message ?? 'Could not save the article.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setDraft(null);
    setUrl('');
    setError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={TextStyles.buttonGhost}>← Done</Text>
          </TouchableOpacity>
          <Text style={TextStyles.cardTitleSmall}>Editorial Desk</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? <Banner kind="error" message={error} /> : null}

          {/* URL input */}
          <View style={styles.card}>
            <Text style={TextStyles.overline}>Source URL</Text>
            <Text style={[TextStyles.helper, { marginTop: 4, marginBottom: 14 }]}>
              Paste a link. We'll fetch the page, summarize it in your editorial voice,
              and let you refine the result before publishing.
            </Text>
            <Field
              label=""
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.example.com/article"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!working && !draft}
            />
            {!draft ? (
              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  label="Generate Summary"
                  onPress={onGenerate}
                  loading={working}
                />
              </View>
            ) : (
              <TouchableOpacity onPress={reset} style={styles.linkBtn}>
                <Text style={TextStyles.buttonGhost}>Start over with a new URL</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Preview / edit */}
          {working && !draft ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={[TextStyles.helper, { marginTop: 12 }]}>
                Reading the article and writing an editorial summary…
              </Text>
            </View>
          ) : null}

          {draft ? (
            <>
              {/* Live preview of the card */}
              <View style={styles.previewCard}>
                <Text style={TextStyles.overline}>Live Preview</Text>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                ) : null}
                <View style={[styles.previewPill, { borderColor: (draft.category_color ?? Colors.primary) + '60' }]}>
                  <Text style={[styles.previewPillText, { color: draft.category_color ?? Colors.primary }]}>
                    {category || 'Category'}
                  </Text>
                </View>
                <Text style={[TextStyles.cardTitle, { marginTop: 10 }]}>{title || 'Untitled'}</Text>
                <Text style={[TextStyles.bodySecondary, { marginTop: 8 }]} numberOfLines={4}>
                  {summary || '—'}
                </Text>
                <Text style={[TextStyles.meta, { marginTop: 10 }]}>
                  {source || 'Source'} · {readTime || '?'} min read
                </Text>
              </View>

              {/* Edit fields */}
              <View style={styles.card}>
                <Text style={TextStyles.overline}>Refine</Text>
                <Text style={[TextStyles.helper, { marginTop: 4, marginBottom: 14 }]}>
                  Adjust anything that needs an editor's hand.
                </Text>

                <View style={{ gap: 14 }}>
                  <Field
                    label="Title"
                    value={title}
                    onChangeText={setTitle}
                    multiline
                  />
                  <Field
                    label="Summary"
                    value={summary}
                    onChangeText={setSummary}
                    multiline
                    style={{ height: 120, paddingTop: 12 }}
                  />
                  <Field label="Source" value={source} onChangeText={setSource} />
                  <Field
                    label="Category"
                    value={category}
                    onChangeText={setCategory}
                    autoCapitalize="words"
                  />
                  <Field
                    label="Read Time (minutes)"
                    value={readTime}
                    onChangeText={setReadTime}
                    keyboardType="number-pad"
                  />
                  <Field
                    label="Tags (comma-separated)"
                    value={tagsInput}
                    onChangeText={setTagsInput}
                    autoCapitalize="words"
                  />
                  <Field
                    label="Image URL"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Field
                    label="Article URL"
                    value={contentUrl}
                    onChangeText={setContentUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={{ marginTop: Spacing.lg }}>
                  <PrimaryButton
                    label="Publish to Feed"
                    onPress={onSave}
                    loading={saving}
                  />
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.base,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadow.sm,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...Shadow.md,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: Radius.md,
    marginTop: 12,
    backgroundColor: Colors.surfaceMuted,
  },
  previewPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 12,
  },
  previewPillText: {
    fontFamily: Fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 6,
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
});
