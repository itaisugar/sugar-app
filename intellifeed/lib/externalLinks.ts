import { Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/Theme';

export type ExternalLinkKind = 'spotify' | 'kindle' | 'web';

export function detectLinkKind(url: string | null | undefined): ExternalLinkKind {
  if (!url) return 'web';
  if (/spotify\.com/i.test(url) || /^spotify:/i.test(url)) return 'spotify';
  if (/amazon\.[a-z.]+\//i.test(url) || /^https?:\/\/a\.co\//i.test(url) || /read\.amazon\.com/i.test(url)) return 'kindle';
  return 'web';
}

export function ctaLabelFor(kind: ExternalLinkKind): string {
  switch (kind) {
    case 'spotify': return 'Listen on Spotify';
    case 'kindle':  return 'Open in Kindle';
    default:        return 'Read article';
  }
}

export async function openExternal(url: string, kind: ExternalLinkKind) {
  try {
    if (kind === 'spotify' || kind === 'kindle') {
      // Universal links — iOS hands off to Spotify / Kindle app if installed
      await Linking.openURL(url);
    } else {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: Colors.background,
        controlsColor: Colors.primary,
        dismissButtonStyle: 'close',
      });
    }
  } catch {
    Alert.alert('Could not open the source.');
  }
}
