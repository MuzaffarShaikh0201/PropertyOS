import { Pressable, Text, View } from 'react-native';

type ChipSelectProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
};

export function ChipSelect<T extends string>({ options, value, onChange }: ChipSelectProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            className={`rounded-pill border px-3 py-1.5 ${
              isActive ? 'border-primary bg-primary' : 'border-border bg-surface'
            }`}>
            <Text className={`font-body-bold text-[12.5px] ${isActive ? 'text-on-primary' : 'text-text-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
