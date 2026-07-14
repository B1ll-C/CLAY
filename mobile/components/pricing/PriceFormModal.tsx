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
import type { PriceComparisonRow } from "@/controller/PriceController";
import {
  useRecordPrice,
  useRecordPriceForProductName,
} from "@/hooks/usePrices";
import { useStores } from "@/hooks/useStores";
import {
  formatPrice,
  parseDateInput,
  parseNumber,
  toDateInput,
} from "@/lib/pricing/format";
import { storePriceInputSchema, UNITS, type Unit } from "@clay/shared";

interface PriceFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Fixed when opened from a product's comparison view; omitted from the hub FAB. */
  productId?: number;
  /** Present to edit an existing price; absent to record a new one. */
  initial?: PriceComparisonRow;
  /**
   * Called with the resolved product id after a successful save (lets the hub
   * FAB route to that product's comparison view); falls back to `onClose`.
   */
  onSaved?: (productId: number) => void;
}

const inputClass =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900";

/**
 * Record or edit a store price. When `productId` isn't fixed (the hub FAB),
 * shows a product-name field and resolves it via find-or-create on save. The
 * store is locked once editing an existing price — changing it would upsert
 * against a different row rather than updating the one being edited.
 */
export function PriceFormModal({
  visible,
  onClose,
  productId,
  initial,
  onSaved,
}: PriceFormModalProps) {
  const isEdit = initial != null;
  const { data: stores = [] } = useStores();
  const recordPrice = useRecordPrice();
  const recordForName = useRecordPriceForProductName();
  const saving = recordPrice.isPending || recordForName.isPending;

  const [productName, setProductName] = useState("");
  const [storeId, setStoreId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [promotionPrice, setPromotionPrice] = useState("");
  const [promotionExpiresAt, setPromotionExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setProductName("");
    setStoreId(initial?.store.id ?? null);
    setPrice(initial ? String(initial.price.price) : "");
    setUnit(initial?.price.unit ?? null);
    setPromotionPrice(
      initial?.price.promotionPrice != null ? String(initial.price.promotionPrice) : "",
    );
    setPromotionExpiresAt(toDateInput(initial?.price.promotionExpiresAt));
  }, [visible, initial]);

  function handleSave() {
    if (storeId == null) return setError("Choose a store");

    const priceValue = parseNumber(price);
    if (priceValue == null || priceValue <= 0) {
      return setError("Enter a valid price");
    }

    let promoValue: number | null = null;
    if (promotionPrice.trim()) {
      promoValue = parseNumber(promotionPrice);
      if (promoValue == null || promoValue <= 0) {
        return setError("Enter a valid promo price");
      }
      if (promoValue >= priceValue) {
        return setError("Promotion price must be less than the regular price");
      }
    }

    let promoExpires: Date | null = null;
    if (promotionExpiresAt.trim()) {
      promoExpires = parseDateInput(promotionExpiresAt);
      if (promoExpires == null) return setError("Use date format YYYY-MM-DD");
    }

    const rest = {
      storeId,
      price: priceValue,
      unit: unit ?? undefined,
      promotionPrice: promoValue,
      promotionExpiresAt: promoExpires,
    };

    const onError = (e: unknown) =>
      setError(e instanceof Error ? e.message : "Failed to save");

    function finish(resolvedProductId: number) {
      if (onSaved) onSaved(resolvedProductId);
      else onClose();
    }

    if (productId != null) {
      const parsed = storePriceInputSchema.safeParse({ productId, ...rest });
      if (!parsed.success) {
        return setError(parsed.error.issues[0]?.message ?? "Check your input");
      }
      recordPrice.mutate(parsed.data, {
        onSuccess: () => finish(productId),
        onError,
      });
    } else {
      const name = productName.trim();
      if (!name) return setError("Enter a product name");
      recordForName.mutate(
        { name, rest },
        { onSuccess: ({ productId: resolvedId }) => finish(resolvedId), onError },
      );
    }
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
              {isEdit ? "Edit price" : "Record price"}
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

            {productId == null ? (
              <View className="mb-4">
                <Text className="mb-1.5 text-sm font-medium text-gray-600">
                  Product
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="e.g. Milk"
                  value={productName}
                  onChangeText={setProductName}
                  autoFocus
                />
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="mb-1.5 text-sm font-medium text-gray-600">
                Store
              </Text>
              {isEdit ? (
                <Text className="text-base text-gray-900">{initial.store.name}</Text>
              ) : (
                <OptionChips
                  options={stores.map((s) => String(s.id))}
                  value={storeId != null ? String(storeId) : null}
                  onChange={(v) => setStoreId(Number(v))}
                  labelFor={(v) =>
                    stores.find((s) => String(s.id) === v)?.name ?? v
                  }
                />
              )}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1.5 text-sm font-medium text-gray-600">
                  Price
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View className="flex-1">
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
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1.5 text-sm font-medium text-gray-600">
                  Promo price (optional)
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder={price ? `< ${formatPrice(Number(price) || 0)}` : "0.00"}
                  keyboardType="decimal-pad"
                  value={promotionPrice}
                  onChangeText={setPromotionPrice}
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1.5 text-sm font-medium text-gray-600">
                  Promo expires (optional)
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  value={promotionExpiresAt}
                  onChangeText={setPromotionExpiresAt}
                />
              </View>
            </View>

            <View className="h-6" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
