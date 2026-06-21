import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import type { InventoryItemView } from "@/controller/InventoryController";
import { useAdjustInventoryQuantity } from "@/hooks/useInventory";
import { formatQuantity, parseNumber } from "@/lib/inventory/format";
import {
  inventoryAdjustmentInputSchema,
  type MovementReason,
} from "@clay/shared";
import { MOVEMENT_REASON_LABEL } from "./alertMeta";
import { OptionChips } from "./OptionChips";

interface InventoryAdjustModalProps {
  visible: boolean;
  onClose: () => void;
  item: InventoryItemView;
}

const ADD_REASONS: MovementReason[] = ["purchase", "adjust"];
const REMOVE_REASONS: MovementReason[] = ["consume", "waste", "adjust"];

/** Add or remove stock for an item; the change is recorded in the movement log. */
export function InventoryAdjustModal({
  visible,
  onClose,
  item,
}: InventoryAdjustModalProps) {
  const adjust = useAdjustInventoryQuantity();
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<MovementReason>("purchase");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDirection("add");
    setAmount("");
    setReason("purchase");
    setNotes("");
    setError(null);
  }, [visible]);

  function selectDirection(next: "add" | "remove") {
    setDirection(next);
    setReason(next === "add" ? "purchase" : "consume");
  }

  function handleApply() {
    const magnitude = parseNumber(amount);
    if (magnitude == null || magnitude <= 0) {
      return setError("Enter an amount greater than zero");
    }
    const delta = direction === "add" ? magnitude : -magnitude;
    const parsed = inventoryAdjustmentInputSchema.safeParse({
      delta,
      reason,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      return setError(parsed.error.issues[0]?.message ?? "Check your input");
    }
    adjust.mutate(
      { id: item.id, input: parsed.data },
      {
        onSuccess: () => onClose(),
        onError: (e) =>
          setError(e instanceof Error ? e.message : "Failed to adjust"),
      },
    );
  }

  const reasons = direction === "add" ? ADD_REASONS : REMOVE_REASONS;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        <View className="w-full rounded-3xl bg-white p-5">
          <Text className="text-lg font-semibold text-gray-900">Adjust stock</Text>
          <Text className="mt-0.5 text-sm text-gray-400">
            On hand: {formatQuantity(item.quantity, item.unit)}
          </Text>

          {error ? (
            <View className="mt-3 rounded-xl bg-red-50 px-3 py-2">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <View className="mt-4 flex-row rounded-xl bg-gray-100 p-1">
            {(["add", "remove"] as const).map((dir) => (
              <Pressable
                key={dir}
                onPress={() => selectDirection(dir)}
                className={`flex-1 items-center rounded-lg py-2 ${
                  direction === dir ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${
                    direction === dir ? "text-primary-dark" : "text-gray-500"
                  }`}
                >
                  {dir} stock
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-1.5 mt-4 text-sm font-medium text-gray-600">
            Amount
          </Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            placeholder="0"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <Text className="mb-1.5 mt-4 text-sm font-medium text-gray-600">
            Reason
          </Text>
          <OptionChips
            options={reasons}
            value={reason}
            onChange={setReason}
            labelFor={(r) => MOVEMENT_REASON_LABEL[r]}
          />

          <Text className="mb-1.5 mt-4 text-sm font-medium text-gray-600">
            Notes (optional)
          </Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            placeholder="e.g. weekly shop"
            value={notes}
            onChangeText={setNotes}
          />

          <View className="mt-5 flex-row justify-end gap-4">
            <Pressable onPress={onClose} hitSlop={8} className="px-2 py-2">
              <Text className="text-base text-gray-500">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              disabled={adjust.isPending}
              className="rounded-xl bg-primary px-5 py-2"
            >
              <Text className="text-base font-semibold text-white">
                {adjust.isPending ? "Applying…" : "Apply"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
