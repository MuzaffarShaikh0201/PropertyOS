import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { TabBar } from '@/components/nav/tab-bar';

const LAPTOP_BREAKPOINT = 1024;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isLaptop = width >= LAPTOP_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: isLaptop ? 'left' : 'bottom' }}
      tabBar={(props) => <TabBar {...props} variant={isLaptop ? 'sidebar' : 'bar'} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties' }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
