import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VARIANT_ICON_COLOR, type MessageVariant } from '@/components/ui/banner';

const DEFAULT_DURATION_MS = 5000;

const VARIANT_BG: Record<MessageVariant, string> = {
  info: 'bg-info-bg',
  warning: 'bg-warning-bg',
  error: 'bg-danger-bg',
  success: 'bg-success-bg',
};

const VARIANT_ICON: Record<MessageVariant, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  warning: 'warning',
  error: 'alert-circle',
  success: 'checkmark-circle',
};

type ToastItem = {
  id: string;
  variant: MessageVariant;
  message: string;
};

type ToastContextValue = {
  show: (variant: MessageVariant, message: string, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (variant: MessageVariant, message: string, durationMs = DEFAULT_DURATION_MS) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, variant, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), durationMs),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, durationMs) => show('success', message, durationMs),
      error: (message, durationMs) => show('error', message, durationMs),
      warning: (message, durationMs) => show('warning', message, durationMs),
      info: (message, durationMs) => show('info', message, durationMs),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastOverlay toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastOverlay({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute inset-x-0 bottom-0 items-center gap-2 px-4"
      // Extra clearance above the bottom tab bar (phone/tablet), matching the
      // FAB's own bottom offset in the wireframes so a toast never sits under it.
      style={{ paddingBottom: insets.bottom + 82, pointerEvents: 'box-none' }}>
      {toasts.map((toast) => {
        const iconColor = VARIANT_ICON_COLOR[toast.variant][colorScheme === 'dark' ? 'dark' : 'light'];
        return (
          <Pressable
            key={toast.id}
            onPress={() => onDismiss(toast.id)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            className={`w-full max-w-sm flex-row items-start gap-2 rounded-md border border-border px-3.5 py-3 ${VARIANT_BG[toast.variant]}`}>
            <Ionicons name={VARIANT_ICON[toast.variant]} size={16} color={iconColor} style={{ marginTop: 1 }} />
            <Text className="flex-1 font-body text-[13px] leading-5 text-text">{toast.message}</Text>
            <Ionicons name="close" size={14} color={iconColor} style={{ marginTop: 2 }} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
