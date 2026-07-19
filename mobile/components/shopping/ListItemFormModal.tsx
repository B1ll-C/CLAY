import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { OptionChips } from "@/components/inventory/OptionChips";
import { useAddListItem, useUpdateListItem } from "@/hooks/useShoppingLists";
import { parseNumber } from "@/lib/inventory/format";
import type { ShoppingListItemRow } from "@/models/shoppingListItems";
import { UNITS, shoppingListItemInputSchema, type Unit } from "@clay/shared";

interface ListItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  listId: number;
  /** Present for edit; absent for a new item. */
  initial?: ShoppingListItemRow;
}

const inputClass =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900";

/** Add or edit a shopping-list item (freeform name + quantity/unit/notes). */
export function ListItemFormModal({
  visible,
  onClose,
  listId,
  initial,
}: ListItemFormModalProps) {
  const isEdit = initial != null;
  const addItem = useAddListItem();
  const updateItem = useUpdateListItem();
  const saving = addItem.isPending || updateItem.isPending;

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setName(initial?.name ?? "");
    setQuantity(initial ? String(initial.quantity) : "");
    setUnit(initial?.unit ?? null);
    setNotes(initial?.notes ?? "");
  }, [visible, initial]);

  function handleSave() {
    const qty = parseNumber(quantity) ?? 1;

    const parsed = shoppingListItemInputSchema.safeParse({
      name,
      quantity: qty,
      unit: unit ?? undefined,
      notes: notes.trim() || undefined,
      productId: initial?.productId ?? undefined,
    });
    if (!parsed.success) {
      return setError(parsed.error.issues[0]?.message ?? "Check your input");
    }

    const onDone = {
      onSuccess: () => onClose(),
      onError: (e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to save"),
    };
    if (isEdit) updateItem.mutate({ id: initial.id, input: parsed.data }, onDone);
    else addItem.mutate({ listId, input: parsed.data }, onDone);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="max-h-[85%] rounded-t-3xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-base text-gray-500">Cancel</Text>
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit item" : "Add item"}
            </Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
              <Text className="text-base font-semibold text-primary-dark">
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 px-3 py-2">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-600">Name</Text>
              <TextInput
                className={inputClass}
                placeholder="e.g. Milk"
                value={name}
                onChangeText={setName}
                autoFocus={!isEdit}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-600">
                Quantity
              </Text>
              <TextInput
                className={inputClass}
                placeholder="1"
                keyboardType="decimal-pad"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-600">
                Unit (optional)
              </Text>
              <OptionChips
                options={UNITS}
                value={unit}
                onChange={setUnit}
                allowClear
                onClear={() => setUnit(null)}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-600">
                Notes (optional)
              </Text>
              <TextInput
                className={`${inputClass} h-20`}
                placeholder="Anything worth remembering"
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View className="h-6" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
