import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const ARM_DISTANCE = 88;
const EXTRA_TRAVEL = 56;
const RESISTANCE = 0.55;
const OFFSCREEN_DISTANCE = 420;

/** iOS-style rubber-band curve: approaches (but never reaches) `dimension`. */
function rubberBand(overshoot: number, dimension: number, coefficient: number) {
  "worklet";
  return (overshoot * dimension * coefficient) / (dimension + coefficient * overshoot);
}

interface SwipeToDeleteProps {
  onDelete: () => void;
  /** Vertical gap below the row, animated away as it collapses. Match the row's own mb-*. */
  spacing?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a row with swipe-left-to-delete. Dragging past the arm distance engages
 * rubberband resistance (drag keeps working but fights back) plus a haptic tick —
 * that resistance IS the confirmation, so releasing while armed deletes immediately
 * with no follow-up dialog. Releasing before the threshold snaps back untouched.
 */
export function SwipeToDelete({
  onDelete,
  spacing = 8,
  disabled = false,
  children,
}: SwipeToDeleteProps) {
  const translateX = useSharedValue(0);
  const armed = useSharedValue(false);
  const rowHeight = useSharedValue(0);
  const collapseProgress = useSharedValue(0);

  const armHaptic = useCallback((isArmed: boolean) => {
    Haptics.impactAsync(
      isArmed ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
  }, []);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      const raw = event.translationX;
      if (raw >= 0) {
        translateX.value = 0;
        armed.value = false;
        return;
      }
      const dragLeft = -raw;
      if (dragLeft <= ARM_DISTANCE) {
        translateX.value = raw;
        if (armed.value) armed.value = false;
      } else {
        const overshoot = dragLeft - ARM_DISTANCE;
        const damped = rubberBand(overshoot, EXTRA_TRAVEL, RESISTANCE);
        translateX.value = -(ARM_DISTANCE + damped);
        if (!armed.value) {
          armed.value = true;
          runOnJS(armHaptic)(true);
        }
      }
    })
    .onEnd(() => {
      if (armed.value) {
        translateX.value = withTiming(-OFFSCREEN_DISTANCE, { duration: 180 }, (finished) => {
          if (finished) {
            collapseProgress.value = withTiming(1, { duration: 150 }, (finished2) => {
              if (finished2) runOnJS(onDelete)();
            });
          }
        });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
      armed.value = false;
    });

  function onLayout(event: LayoutChangeEvent) {
    rowHeight.value = event.nativeEvent.layout.height;
  }

  const containerStyle = useAnimatedStyle(() => ({
    height: rowHeight.value > 0 ? rowHeight.value * (1 - collapseProgress.value) : undefined,
    marginBottom: spacing * (1 - collapseProgress.value),
    opacity: 1 - collapseProgress.value,
  }));

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(-translateX.value / ARM_DISTANCE, 1),
    backgroundColor: armed.value ? "#B91C1C" : "#EF4444",
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: armed.value ? 1.15 : 1 }],
  }));

  return (
    <Animated.View style={containerStyle} onLayout={onLayout}>
      <View className="absolute inset-0 overflow-hidden rounded-2xl">
        <Animated.View
          style={backdropStyle}
          className="h-full w-full items-end justify-center pr-6"
        >
          <Animated.View style={iconStyle}>
            <FontAwesome name="trash-o" size={20} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
