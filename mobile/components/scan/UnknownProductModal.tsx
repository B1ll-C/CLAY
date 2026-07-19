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

import { useSaveScannedProduct } from "@/hooks/useBarcodeLookup";
import { OptionChips } from "@/components/inventory/OptionChips";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@clay/shared";
import type { Product } from "@/models/products";

interface UnknownProductModalProps {
  visible: boolean;
  /** The scanned code with no catalog match, or "" for the manual fallback. */
  barcode: string;
  onClose: () => void;
  /** The skeleton product saved from the entered name. */
  onSaved: (product: Product) => void;
}

const inputClass =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900";

/**
 * Shown when a scanned barcode matches nothing locally (and no backend lookup is
 * available yet). The user names the product; we save a skeleton catalog record
 * carrying the barcode so it's recognized on the next scan and syncs later.
 */
export function UnknownProductModal({
  visible,
  barcode,
  onClose,
  onSaved,
}: UnknownProductModalProps) {
  const save = useSaveScannedProduct();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setCategory(null);
    setError(null);
  }, [visible]);

  function handleSave() {
    if (!name.trim()) return setError("Give the product a name");
    save.mutate(
      { barcode, name: name.trim(), category },
      {
        onSuccess: (product) => onSaved(product),
        onError: (e) =>
          setError(e instanceof Error ? e.message : "Couldn't save"),
      },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">
              {barcode ? "Unknown product" : "Add manually"}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-base text-gray-500">Cancel</Text>
            </Pressable>
          </View>
          <Text className="mb-4 text-sm text-gray-500">
            {barcode
              ? `Barcode ${barcode} isn't in your catalog yet. Name it to save and reuse it.`
              : "Couldn't read a barcode. Add the product by name instead."}
          </Text>

          {error ? (
            <View className="mb-3 rounded-xl bg-red-50 px-3 py-2">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <Text className="mb-1.5 text-sm font-medium text-gray-600">Name</Text>
          <TextInput
            className={inputClass}
            placeholder="e.g. Whole Milk 1 gal"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text className="mb-1.5 mt-4 text-sm font-medium text-gray-600">
            Category (optional)
          </Text>
          <OptionChips
            options={PRODUCT_CATEGORIES}
            value={category}
            onChange={setCategory}
            allowClear
            onClear={() => setCategory(null)}
          />

          <Pressable
            onPress={handleSave}
            disabled={save.isPending}
            className="mt-6 items-center rounded-xl bg-primary-dark py-3"
          >
            <Text className="text-base font-semibold text-white">
              {save.isPending ? "Saving…" : "Save product"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
