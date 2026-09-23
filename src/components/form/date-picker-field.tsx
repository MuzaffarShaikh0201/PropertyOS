import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { isValidIsoDate, todayIsoDate } from '@/features/agreements/calculations';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type DatePickerFieldProps = {
  label: string;
  value: string; // "" | "YYYY-MM-DD"
  onChangeDate: (iso: string) => void;
  accessibilityLabel: string;
  /** Inclusive bounds, as "YYYY-MM-DD" — days outside them are shown but not selectable. */
  minimumDate?: string;
  maximumDate?: string;
  errorMessage?: string | null;
};

function parseIso(value: string): { year: number; month: number; day: number } | null {
  if (!isValidIsoDate(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return { year, month: month - 1, day };
}

function toIso(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatDisplayDate(value: string): string {
  const parsed = parseIso(value);
  if (!parsed) return '';
  return `${parsed.day} ${MONTH_LABELS[parsed.month].slice(0, 3)} ${parsed.year}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

// A month-grid calendar in the app's own design system — no native
// date-picker dependency renders on web (see @expo/ui's DateTimePicker.web.tsx,
// which is a no-op), and this app has to work identically on phone, tablet
// and laptop-web, so a cross-platform native picker isn't an option here.
export function DatePickerField({
  label,
  value,
  onChangeDate,
  accessibilityLabel,
  minimumDate,
  maximumDate,
  errorMessage,
}: DatePickerFieldProps) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#EDEFEF' : '#1B2020';
  const [isOpen, setIsOpen] = useState(false);

  const selected = parseIso(value);
  const initial = selected ?? parseIso(todayIsoDate())!;
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const open = () => {
    const base = selected ?? parseIso(todayIsoDate())!;
    setViewYear(base.year);
    setViewMonth(base.month);
    setIsOpen(true);
  };

  const changeMonth = (delta: number) => {
    let month = viewMonth + delta;
    let year = viewYear;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setViewMonth(month);
    setViewYear(year);
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekdayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayIsoDate();

  return (
    <View className="gap-1.5">
      <Text className="font-body-bold text-[12px] text-text-muted">{label}</Text>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={`w-full flex-row items-center justify-between rounded-sm border bg-surface px-3 py-2.5 ${
          errorMessage ? 'border-danger-fg' : 'border-border'
        }`}>
        <Text className={`font-body text-[14px] ${value ? 'text-text' : 'text-text-faint'}`}>
          {value ? formatDisplayDate(value) : 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={iconColor} />
      </Pressable>
      {errorMessage ? <Text className="font-body text-[12px] text-danger-fg">{errorMessage}</Text> : null}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable
          onPress={() => setIsOpen(false)}
          className="flex-1 items-center justify-center bg-black/40 px-6"
          accessibilityLabel="Close date picker"
          accessibilityRole="button">
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-md border border-border bg-surface p-3.5">
            <View className="flex-row items-center justify-between pb-2">
              <Pressable
                onPress={() => changeMonth(-1)}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                className="h-8 w-8 items-center justify-center rounded-sm active:bg-surface-2">
                <Ionicons name="chevron-back" size={18} color={iconColor} />
              </Pressable>
              <Text className="font-display-extrabold text-[14px] text-text">
                {MONTH_LABELS[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={() => changeMonth(1)}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                className="h-8 w-8 items-center justify-center rounded-sm active:bg-surface-2">
                <Ionicons name="chevron-forward" size={18} color={iconColor} />
              </Pressable>
            </View>

            <View className="flex-row">
              {WEEKDAY_LABELS.map((day) => (
                <View key={day} className="flex-1 items-center py-1">
                  <Text className="font-body-bold text-[10.5px] text-text-faint">{day}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {cells.map((day, index) => {
                if (day === null) {
                  return <View key={`blank-${index}`} className="h-9 w-[14.28%]" />;
                }
                const iso = toIso(viewYear, viewMonth, day);
                const isSelected = iso === value;
                const isToday = iso === today;
                const isDisabled = (minimumDate ? iso < minimumDate : false) || (maximumDate ? iso > maximumDate : false);
                return (
                  <View key={iso} className="h-9 w-[14.28%] items-center justify-center">
                    <Pressable
                      onPress={() => {
                        if (isDisabled) return;
                        onChangeDate(iso);
                        setIsOpen(false);
                      }}
                      disabled={isDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={iso}
                      className={`h-8 w-8 items-center justify-center rounded-pill ${
                        isSelected ? 'bg-primary' : isToday ? 'border border-primary' : ''
                      }`}>
                      <Text
                        className={`font-body text-[12.5px] ${
                          isSelected ? 'text-on-primary' : isDisabled ? 'text-text-faint' : 'text-text'
                        }`}>
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
