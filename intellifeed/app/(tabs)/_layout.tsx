import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, TextStyles } from '../../constants/Theme';

function TabPill({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={focused ? TextStyles.tabLabelActive : TextStyles.tabLabel}>{label}</Text>
      {focused ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabPill focused={focused} label="Feed" /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ tabBarIcon: ({ focused }) => <TabPill focused={focused} label="Plan" /> }}
      />
      <Tabs.Screen
        name="clubs"
        options={{ tabBarIcon: ({ focused }) => <TabPill focused={focused} label="Clubs" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabPill focused={focused} label="Profile" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: Colors.surfaceBorder,
    height: 78,
    paddingBottom: 12,
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 60,
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  dotSpacer: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
});
