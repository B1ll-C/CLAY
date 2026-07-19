import { FontAwesome } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

import type { Product } from "@/models/products";

interface ScanResultSheetProps {
  visible: boolean;
  product: Product;
  /** True when this product was just created from the scan (vs. already known). */
  isNew: boolean;
  onAddToInventory: () => void;
  onAddToList: () => void;
  onScanAgain: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet shown once a scan resolves to a product. Offers the two add
 * destinations from the Phase 7 flow plus "scan again" to keep the camera loop
 * going without leaving the screen.
 */
export function ScanResultSheet({
  visible,
  product,
  isNew,
  onAddToInventory,
  onAddToList,
  onScanAgain,
  onClose,
}: ScanResultSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                <FontAwesome name="check" size={16} color="#557C55" />
              </View>
              <Text className="ml-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                {isNew ? "New product saved" : "Product found"}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-base text-gray-500">Close</Text>
            </Pressable>
          </View>

          <Text className="text-xl font-bold text-gray-900">{product.name}</Text>
          {product.brand ? (
            <Text className="mt-0.5 text-sm text-gray-500">{product.brand}</Text>
          ) : null}
          {product.barcode ? (
            <Text className="mt-1 text-xs text-gray-400">
              Barcode {product.barcode}
            </Text>
          ) : null}

          <Pressable
            onPress={onAddToInventory}
            className="mt-5 flex-row items-center justify-center rounded-xl bg-primary-dark py-3.5"
          >
            <FontAwesome name="archive" size={16} color="#FFFFFF" />
            <Text className="ml-2 text-base font-semibold text-white">
              Add to inventory
            </Text>
          </Pressable>

          <Pressable
            onPress={onAddToList}
            className="mt-3 flex-row items-center justify-center rounded-xl border border-primary py-3.5"
          >
            <FontAwesome name="list" size={16} color="#557C55" />
            <Text className="ml-2 text-base font-semibold text-primary-dark">
              Add to a list
            </Text>
          </Pressable>

          <Pressable onPress={onScanAgain} className="mt-4 items-center py-2">
            <Text className="text-sm font-medium text-gray-500">
              Scan another
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
