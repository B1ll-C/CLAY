import { useEffect, useState, type ReactNode } from "react";
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
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { Product } from "@/models/products";
import {
  PRODUCT_CATEGORIES,
  UNITS,
  productInputSchema,
  type ProductCategory,
  type Unit,
} from "@clay/shared";

interface ProductFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Present for edit; absent for a new product. */
  initial?: Product;
  onSaved?: () => void;
}

/** Labeled form field wrapper. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-gray-600">{label}</Text>
      {children}
    </View>
  );
}

const inputClass =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900";

/** Create / edit a catalog product, for the Groceries tab. */
export function ProductFormModal({
  visible,
  onClose,
  initial,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = initial != null;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const saving = createProduct.isPending || updateProduct.isPending;

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever it opens (seed from `initial` in edit mode).
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setName(initial?.name ?? "");
    setBrand(initial?.brand ?? "");
    setCategory(initial?.category ?? null);
    setBarcode(initial?.barcode ?? "");
    setUnit(initial?.unit ?? null);
    setNotes(initial?.notes ?? "");
  }, [visible, initial]);

  function handleSave() {
    const parsed = productInputSchema.safeParse({
      name,
      brand: brand.trim() || undefined,
      category: category ?? undefined,
      barcode: barcode.trim() || undefined,
      unit: unit ?? undefined,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      return setError(parsed.error.issues[0]?.message ?? "Check your input");
    }

    const onDone = {
      onSuccess: () => (onSaved ?? onClose)(),
      onError: (e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to save"),
    };
    if (isEdit) updateProduct.mutate({ id: initial.id, input: parsed.data }, onDone);
    else createProduct.mutate(parsed.data, onDone);
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
        className="flex-1 justify-end bg-black/40"
      >
        <View className="max-h-[90%] rounded-t-3xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-base text-gray-500">Cancel</Text>
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">
              {isEdit ? "Edit product" : "Add product"}
            </Text>
            <Pressable
              testID="product-save-button"
              onPress={handleSave}
              disabled={saving}
              hitSlop={8}
            >
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

            <Field label="Name">
              <TextInput
                testID="product-name-input"
                className={inputClass}
                placeholder="e.g. Whole Milk"
                value={name}
                onChangeText={setName}
              />
            </Field>

            <Field label="Brand (optional)">
              <TextInput
                className={inputClass}
                placeholder="e.g. Anchor"
                value={brand}
                onChangeText={setBrand}
              />
            </Field>

            <Field label="Category (optional)">
              <OptionChips
                options={PRODUCT_CATEGORIES}
                value={category}
                onChange={setCategory}
                allowClear
                onClear={() => setCategory(null)}
              />
            </Field>

            <Field label="Unit (optional)">
              <OptionChips
                options={UNITS}
                value={unit}
                onChange={setUnit}
                allowClear
                onClear={() => setUnit(null)}
              />
            </Field>

            <Field label="Barcode (optional)">
              <TextInput
                className={inputClass}
                placeholder="Scanned or typed code"
                autoCapitalize="none"
                value={barcode}
                onChangeText={setBarcode}
              />
            </Field>

            <Field label="Notes (optional)">
              <TextInput
                className={`${inputClass} h-20`}
                placeholder="Anything worth remembering"
                multiline
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </Field>

            <View className="h-6" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
