import { FontAwesome } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeType,
} from "expo-camera";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

/** Retail + common 1D/2D symbologies; QR included so test codes scan too. */
const BARCODE_TYPES: BarcodeType[] = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "code93",
  "codabar",
  "itf14",
  "qr",
];

/** No barcode within this window → offer manual entry (damaged/partial code). */
const SCAN_TIMEOUT_MS = 10_000;

interface BarcodeScannerProps {
  /**
   * Whether the camera should be actively detecting. Set `false` while a result
   * sheet or modal is open so a barcode behind it isn't re-processed; flipping
   * back to `true` re-arms the single-shot guard.
   */
  active: boolean;
  /** Fired once per scan with the raw barcode payload (debounced by the guard). */
  onScanned: (barcode: string) => void;
  /** Close the scanner (back affordance). */
  onClose: () => void;
  /** Fired after `SCAN_TIMEOUT_MS` of active scanning with no detection. */
  onTimeout?: () => void;
}

/**
 * Full-bleed rear-camera barcode scanner (Phase 7). Camera and detection are
 * native, so this works with no network. The parent owns the lookup/result
 * flow; this component only handles permission, framing, and a single-shot
 * debounce so one physical barcode yields exactly one `onScanned` call.
 */
export function BarcodeScanner({
  active,
  onScanned,
  onClose,
  onTimeout,
}: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();

  // Single-shot guard: re-armed each time scanning becomes active again.
  const handledRef = useRef(false);
  useEffect(() => {
    if (active) handledRef.current = false;
  }, [active]);

  // Keep the latest onTimeout without restarting the timer on every render.
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const cameraReady = permission?.granted ?? false;
  useEffect(() => {
    if (!active || !cameraReady) return;
    const timer = setTimeout(() => {
      if (!handledRef.current) onTimeoutRef.current?.();
    }, SCAN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [active, cameraReady]);

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (!active || handledRef.current) return;
      const code = result.data?.trim();
      if (!code) return;
      handledRef.current = true;
      onScanned(code);
    },
    [active, onScanned],
  );

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <FontAwesome name="camera" size={44} color="#8FB996" />
        <Text className="mt-5 text-center text-lg font-semibold text-white">
          Camera access needed
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-300">
          CLAY uses the camera to scan product barcodes. Nothing is recorded.
        </Text>
        {permission.canAskAgain ? (
          <Pressable
            onPress={requestPermission}
            className="mt-6 rounded-xl bg-primary px-6 py-3"
          >
            <Text className="font-semibold text-white">Allow camera</Text>
          </Pressable>
        ) : (
          <Text className="mt-6 text-center text-xs text-gray-400">
            Enable the camera for CLAY in your device settings to scan.
          </Text>
        )}
        <Pressable onPress={onClose} className="mt-4 px-6 py-2" hitSlop={8}>
          <Text className="text-sm text-gray-400">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        onBarcodeScanned={active ? handleScan : undefined}
      />

      {/* Chrome overlay: close button, reticle, hint. */}
      <View className="flex-1 justify-between px-6 pb-12 pt-14">
        <View className="flex-row justify-start">
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          >
            <FontAwesome name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="items-center">
          <View className="h-44 w-72 rounded-2xl border-2 border-white/80" />
        </View>

        <Text className="text-center text-sm text-white/90">
          {active
            ? "Point the camera at a barcode"
            : "Looking up product…"}
        </Text>
      </View>
    </View>
  );
}
