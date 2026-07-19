import { ScrollView, Text, TouchableOpacity } from "react-native";

interface OptionChipsProps<T extends string> {
  options: readonly T[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  /** Map a raw option value to a display label (defaults to the value). */
  labelFor?: (value: T) => string;
  /** Allow tapping the selected chip again to clear it. */
  allowClear?: boolean;
  onClear?: () => void;
}

/**
 * Horizontal single-select chip row, used across the inventory form for
 * category / unit / location / reason pickers. Keeps the form dependency-free
 * (no native picker module to install and rebuild).
 */
export function OptionChips<T extends string>({
  options,
  value,
  onChange,
  labelFor,
  allowClear = false,
  onClear,
}: OptionChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row"
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.8}
            onPress={() => {
              if (selected && allowClear) onClear?.();
              else onChange(option);
            }}
            className={`rounded-full border px-4 py-2 ${
              selected
                ? "border-primary bg-primary"
                : "border-gray-300 bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selected ? "text-white" : "text-gray-700"
              }`}
            >
              {labelFor ? labelFor(option) : option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
