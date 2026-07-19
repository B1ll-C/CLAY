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

import type { ShoppingListRow } from "@/models/shoppingLists";
import { useCreateList, useUpdateList } from "@/hooks/useShoppingLists";
import { shoppingListInputSchema } from "@clay/shared";

interface ListFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Present for rename; absent for a new list. */
  initial?: ShoppingListRow;
  /** Called with the new list's id after a successful create. */
  onCreated?: (id: number) => void;
}

/** Create or rename a shopping list. */
export function ListFormModal({
  visible,
  onClose,
  initial,
  onCreated,
}: ListFormModalProps) {
  const isEdit = initial != null;
  const createList = useCreateList();
  const updateList = useUpdateList();
  const saving = createList.isPending || updateList.isPending;

  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setTitle(initial?.title ?? "");
  }, [visible, initial]);

  function handleSave() {
    const parsed = shoppingListInputSchema.safeParse({
      title,
      isShared: initial?.isShared ?? false,
    });
    if (!parsed.success) {
      return setError(parsed.error.issues[0]?.message ?? "Check your input");
    }

    const onError = (e: unknown) =>
      setError(e instanceof Error ? e.message : "Failed to save");

    if (isEdit) {
      updateList.mutate(
        { id: initial.id, input: parsed.data },
        { onSuccess: () => onClose(), onError },
      );
    } else {
      createList.mutate(parsed.data, {
        onSuccess: (id) => {
          onClose();
          onCreated?.(id);
        },
        onError,
      });
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        <View className="w-full rounded-3xl bg-white p-5">
          <Text className="text-lg font-semibold text-gray-900">
            {isEdit ? "Rename list" : "New list"}
          </Text>

          {error ? (
            <View className="mt-3 rounded-xl bg-red-50 px-3 py-2">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <Text className="mb-1.5 mt-4 text-sm font-medium text-gray-600">
            Name
          </Text>
          <TextInput
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900"
            placeholder="e.g. Weekly Shop"
            value={title}
            onChangeText={setTitle}
            autoFocus
            onSubmitEditing={handleSave}
            returnKeyType="done"
          />

          <View className="mt-5 flex-row justify-end gap-4">
            <Pressable onPress={onClose} hitSlop={8} className="px-2 py-2">
              <Text className="text-base text-gray-500">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2"
            >
              <Text className="text-base font-semibold text-white">
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
