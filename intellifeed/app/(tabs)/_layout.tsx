import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, Fonts } from '../../constants/Theme';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconFeed({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="3" rx="1.5" fill={color} />
      <Rect x="3" y="10.5" width="12" height="3" rx="1.5" fill={color} opacity="0.6" />
      <Rect x="3" y="17" width="15" height="3" rx="1.5" fill={color} opacity="0.35" />
    </Svg>
  );
}

function IconClubs({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="1.8" />
      <Circle cx="17" cy="9" r="2.4" stroke={color} strokeWidth="1.6" />
      <Path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M17 14c1.7.4 3 2 3 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

type TabConfig = {
  focused: boolean;
  label: string;
  icon: (color: string) => React.ReactNode;
};

function TabButton({ focused, label, icon }: TabConfig) {
  const color = focused ? Colors.primary : Colors.textFaint;
  return (
    <View style={styles.tabBtn}>
      {icon(color)}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused} label="Feed" icon={(c) => <IconFeed color={c} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused} label="Clubs" icon={(c) => <IconClubs color={c} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused} label="Profile" icon={(c) => <IconProfile color={c} />} />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
    height: 62,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.3,
    color: Colors.textFaint,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: Fonts.sansSemibold,
  },
});
