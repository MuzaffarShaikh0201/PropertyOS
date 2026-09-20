import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoLockup } from '@/components/brand/logo-lockup';

// Bottom tab bar: active state is `primary` (matches `.wf-tab.is-active`).
const TAB_BAR_ICON_COLOR = {
  light: { active: '#1F7A6E', inactive: '#5B6363' },
  dark: { active: '#3FA396', inactive: '#9AA3A3' },
};

// Laptop sidebar: active state is `info-fg`, which is a distinct color from
// `primary` in dark mode (matches `.wf-navitem.is-active`).
const SIDEBAR_ICON_COLOR = {
  light: { active: '#1F7A6E', inactive: '#5B6363' },
  dark: { active: '#5FC2B2', inactive: '#9AA3A3' },
};

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  properties: { active: 'business', inactive: 'business-outline' },
  finance: { active: 'wallet', inactive: 'wallet-outline' },
  alerts: { active: 'notifications', inactive: 'notifications-outline' },
  more: { active: 'ellipsis-horizontal-circle', inactive: 'ellipsis-horizontal-circle-outline' },
};

// A tab whose screen is a folder (e.g. `properties/index.tsx`) can report its
// route name as either "properties" or "properties/index" depending on the
// navigator version — normalize to the first path segment so the icon lookup
// doesn't depend on which form is currently in use.
function getTabIcons(routeName: string) {
  const key = routeName.split('/')[0];
  const icons = TAB_ICONS[key];
  if (!icons) {
    if (__DEV__) {
      console.warn(`TabBar: no icon mapping for route "${routeName}" (looked up "${key}"). Falling back to Home's icon.`);
    }
    return TAB_ICONS.index;
  }
  return icons;
}

type TabBarProps = BottomTabBarProps & { variant: 'bar' | 'sidebar' };

export function TabBar({ state, descriptors, navigation, variant }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const isFocused = state.index === index;
    const icons = getTabIcons(route.name);

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return { key: route.key, label, isFocused, icon: isFocused ? icons.active : icons.inactive, onPress };
  });

  if (variant === 'sidebar') {
    const iconColor = SIDEBAR_ICON_COLOR[scheme];
    return (
      <View
        className="w-[220px] gap-[3px] border-r border-border bg-surface px-3 py-[18px]"
        style={{ paddingTop: insets.top + 18 }}>
        <View className="mb-4 px-2.5">
          <LogoLockup markSize={28} textSize={15} />
        </View>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            className={`flex-row items-center gap-2.5 rounded-sm px-2.5 py-2 ${
              item.isFocused ? 'bg-info-bg' : ''
            }`}>
            <Ionicons name={item.icon} size={18} color={item.isFocused ? iconColor.active : iconColor.inactive} />
            <Text
              className={`font-body-bold text-[13px] ${item.isFocused ? 'text-info-fg' : 'text-text-muted'}`}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const iconColor = TAB_BAR_ICON_COLOR[scheme];

  return (
    <View className="flex-row border-t border-border bg-surface" style={{ paddingBottom: insets.bottom }}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          className="flex-1 items-center gap-1 px-1 pb-[11px] pt-[9px]">
          <Ionicons name={item.icon} size={20} color={item.isFocused ? iconColor.active : iconColor.inactive} />
          <Text className={`font-body-bold text-[10px] ${item.isFocused ? 'text-primary' : 'text-text-muted'}`}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
