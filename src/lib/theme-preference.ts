import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'propertyos.theme-preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Wraps NativeWind's colorScheme with a persisted, explicit "light / dark /
 * system" preference (NativeWind itself only tracks the resolved light/dark
 * value, not the user's choice to follow the OS). Defaults to "system" until
 * a saved preference is loaded, so there's one call site the rest of the app
 * (Settings, the auth screens' quick toggle) shares instead of touching
 * AsyncStorage or NativeWind's setColorScheme directly.
 */
export function useThemePreference() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (isThemePreference(saved)) {
        setPreferenceState(saved);
        setColorScheme(saved);
      }
      setIsLoaded(true);
    });
    // Only ever needs to run once on mount — setColorScheme's identity is
    // stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      setColorScheme(next);
      AsyncStorage.setItem(STORAGE_KEY, next);
    },
    [setColorScheme],
  );

  return { preference, setPreference, colorScheme, isLoaded };
}
