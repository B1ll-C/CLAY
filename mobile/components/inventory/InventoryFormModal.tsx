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

import type { InventoryItemView } from "@/controller/InventoryController";
import {
  useCreateInventoryItem,
  useUpdateInventoryItem,
} from "@/hooks/useInventory";
import {
  parseDateInput,
  parseNumber,
  toDateInput,
} from "@/lib/inventory/format";
import {
  PRODUCT_CATEGORIES,
  STORAGE_LOCATIONS,
  UNITS,
  inventoryItemInputSchema,
  type ProductCategory,
  type StorageLocation,
  type Unit,
} from "@clay/shared";
import { OptionChips } from "./OptionChips";

interface InventoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Present for edit; absent for a new item. */
  initial?: InventoryItemView;
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

/**
 * Create / edit an inventory item. The typed name is resolved to a catalog
 * product on save (find-or-create), so no separate product step is needed.
 * Validation runs through the shared `inventoryItemInputSchema`.
 */
export function InventoryFormModal({
  visible,
  onClose,
  initial,
}: InventoryFormModalProps) {
  const isEdit = initial != null;
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const saving = createItem.isPending || updateItem.isPending;

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [location, setLocation] = useState<StorageLocation>("pantry");
  const [minQuantity, setMinQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [expiration, setExpiration] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever it opens (seed from `initial` in edit mode).
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setName(initial?.product?.name ?? "");
    setBrand(initial?.product?.brand ?? "");
    setCategory(initial?.product?.category ?? null);
    setQuantity(initial ? String(initial.quantity) : "");
    setUnit(initial?.unit ?? null);
    setLocation(initial?.location ?? "pantry");
    setMinQuantity(initial?.minQuantity != null ? String(initial.minQuantity) : "");
    setCostPerUnit(initial?.costPerUnit != null ? String(initial.costPerUnit) : "");
    setExpiration(toDateInput(initial?.expirationDate));
    setNotes(initial?.notes ?? "");
  }, [visible, initial]);

  function handleSave() {
    const qty = parseNumber(quantity) ?? 0;

    let minQ: number | null = null;
    if (minQuantity.trim()) {
      minQ = parseNumber(minQuantity);
      if (minQ == null) return setError("Enter a valid low-stock threshold");
    }

    let cost: number | null = null;
    if (costPerUnit.trim()) {
      cost = parseNumber(costPerUnit);
      if (cost == null) return setError("Enter a valid cost per unit");
    }

    let expirationDate: Date | null = null;
    if (expiration.trim()) {
      expirationDate = parseDateInput(expiration);
      if (expirationDate == null) return setError("Use date format YYYY-MM-DD");
    }

    const parsed = inventoryItemInputSchema.safeParse({
      productName: name,
      brand: brand.trim() || undefined,
      category: category ?? undefined,
      quantity: qty,
      unit: unit ?? undefined,
      location,
      minQuantity: minQ,
      costPerUnit: cost,
      expirationDate,
      notes: notes.trim() || undefined,
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
    else createItem.mutate(parsed.data, onDone);
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
              {isEdit ? "Edit item" : "Add item"}
            </Text>
            <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
              <Text className="text-base font-semibold text-primary-dark">
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="px-5 py-4"
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View className="mb-4 rounded-xl bg-red-50 px-3 py-2">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : null}

            <Field label="Name">
              <TextInput
                className={inputClass}
                placeholder="e.g. Milk"
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

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Quantity">
                  <TextInput
                    className={inputClass}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="Low-stock at (optional)">
                  <TextInput
                    className={inputClass}
                    placeholder="e.g. 1"
                    keyboardType="decimal-pad"
                    value={minQuantity}
                    onChangeText={setMinQuantity}
                  />
                </Field>
              </View>
            </View>

            <Field label="Unit (optional)">
              <OptionChips
                options={UNITS}
                value={unit}
                onChange={setUnit}
                allowClear
                onClear={() => setUnit(null)}
              />
            </Field>

            <Field label="Location">
              <OptionChips
                options={STORAGE_LOCATIONS}
                value={location}
                onChange={setLocation}
                labelFor={(l) => l[0].toUpperCase() + l.slice(1)}
              />
            </Field>

            <Field label="Expiration date (optional)">
              <TextInput
                className={inputClass}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                value={expiration}
                onChangeText={setExpiration}
              />
            </Field>

            <Field label="Cost per unit (optional)">
              <TextInput
                className={inputClass}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={costPerUnit}
                onChangeText={setCostPerUnit}
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
