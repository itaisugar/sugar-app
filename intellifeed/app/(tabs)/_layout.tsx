import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, TextStyles } from '../../constants/Theme';

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View style={styles.tabItem}>
      <Text style={focused ? TextStyles.tabLabelActive : TextStyles.tabLabel}>{label}</Text>
      {focused ? <View style={styles.activeIndicator} /> : <View style={styles.indicatorSpacer} />}
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
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Feed" />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Plan" />,
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Clubs" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    height: 78,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 60,
    gap: 6,
  },
  activeIndicator: {
    width: 14,
    height: 1.5,
    backgroundColor: Colors.primary,
  },
  indicatorSpacer: {
    width: 14,
    height: 1.5,
  },
});
