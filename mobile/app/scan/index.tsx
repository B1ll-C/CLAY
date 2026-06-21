import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { BarcodeScanner } from "@/components/scan/BarcodeScanner";
import { ListPickerModal } from "@/components/scan/ListPickerModal";
import { ScanResultSheet } from "@/components/scan/ScanResultSheet";
import { UnknownProductModal } from "@/components/scan/UnknownProductModal";
import { useBarcodeLookup } from "@/hooks/useBarcodeLookup";
import type { Product } from "@/models/products";

/** Where the scan flow currently is. */
type Phase = "scanning" | "result" | "unknown" | "inventory" | "listpick";

/**
 * Barcode scanner flow (Phase 7). Scans a code, resolves it against the local
 * catalog (offline), then routes the user to add the product to inventory or a
 * list. Unknown codes — or a 10s no-read timeout — fall through to manual entry,
 * which saves a skeleton product that syncs once the Phase 8 backend lands.
 */
export default function ScanScreen() {
  const router = useRouter();
  const lookup = useBarcodeLookup();

  const [phase, setPhase] = useState<Phase>("scanning");
  const [product, setProduct] = useState<Product | null>(null);
  const [productIsNew, setProductIsNew] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState("");

  const close = useCallback(() => router.back(), [router]);

  const handleScanned = useCallback(
    async (barcode: string) => {
      try {
        const found = await lookup.mutateAsync(barcode);
        if (found) {
          setProduct(found);
          setProductIsNew(false);
          setPhase("result");
          return;
        }
      } catch {
        // Fall through to manual entry on a lookup error.
      }
      setUnknownBarcode(barcode);
      setPhase("unknown");
    },
    [lookup],
  );

  const handleTimeout = useCallback(() => {
    if (phase !== "scanning") return;
    setUnknownBarcode("");
    setPhase("unknown");
  }, [phase]);

  const handleProductSaved = useCallback((saved: Product) => {
    setProduct(saved);
    setProductIsNew(true);
    setPhase("result");
  }, []);

  const scanAgain = useCallback(() => {
    setProduct(null);
    setProductIsNew(false);
    setPhase("scanning");
  }, []);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <BarcodeScanner
        active={phase === "scanning" && !lookup.isPending}
        onScanned={handleScanned}
        onClose={close}
        onTimeout={handleTimeout}
      />

      <UnknownProductModal
        visible={phase === "unknown"}
        barcode={unknownBarcode}
        onClose={scanAgain}
        onSaved={handleProductSaved}
      />

      {product ? (
        <>
          <ScanResultSheet
            visible={phase === "result"}
            product={product}
            isNew={productIsNew}
            onAddToInventory={() => setPhase("inventory")}
            onAddToList={() => setPhase("listpick")}
            onScanAgain={scanAgain}
            onClose={close}
          />

          <InventoryFormModal
            visible={phase === "inventory"}
            prefill={{
              productName: product.name,
              brand: product.brand,
              category: product.category,
            }}
            onClose={() => setPhase("result")}
            onSaved={close}
          />

          <ListPickerModal
            visible={phase === "listpick"}
            product={product}
            onClose={() => setPhase("result")}
            onAdded={close}
          />
        </>
      ) : null}
    </View>
  );
}
