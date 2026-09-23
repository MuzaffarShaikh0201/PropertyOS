import { Pressable, Text, View } from 'react-native';

type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View className="flex-row gap-[3px] rounded-sm border border-border bg-surface p-[3px]">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            className={`flex-1 items-center rounded-[6px] px-1.5 py-[7px] ${isActive ? 'bg-primary' : ''}`}>
            <Text className={`font-body-bold text-[11.5px] ${isActive ? 'text-on-primary' : 'text-text-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
