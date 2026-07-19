import { FontAwesome } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { AlertStatus } from "@/lib/inventory/alerts";
import { ALERT_META } from "./alertMeta";

interface AlertBadgeProps {
  status: AlertStatus;
  /** Use the abbreviated label (for dense list rows). */
  compact?: boolean;
}

/** Colored pill summarizing one smart-alert state on an inventory item. */
export function AlertBadge({ status, compact = false }: AlertBadgeProps) {
  const meta = ALERT_META[status];
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${meta.chipBg}`}
    >
      <FontAwesome name={meta.icon} size={11} color={meta.iconColor} />
      <Text className={`text-xs font-semibold ${meta.chipText}`}>
        {compact ? meta.short : meta.label}
      </Text>
    </View>
  );
}
