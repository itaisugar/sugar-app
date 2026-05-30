import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts, TextStyles } from '../../constants/Theme';

function TabButton({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View style={styles.tabBtn}>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.dot, focused && styles.dotActive]} />
    </View>
  );
}

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
        options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} label="Feed" /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} label="Plan" /> }}
      />
      <Tabs.Screen
        name="clubs"
        options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} label="Clubs" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} label="Profile" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 52,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabItem: {
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorderStrong,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  tabLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
    fontFamily: Fonts.sansSemibold,
  },
  dot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
});
