import { useAuthStore } from "@/store/authStore";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/product");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-[#557C55] mb-8">
        Welcome back
      </Text>

      <TextInput
        className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-3"
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-3"
        placeholder="Password"
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <Text className="text-red-500 mb-3 text-center">{error}</Text>
      )}

      <TouchableOpacity
        className="w-full bg-[#8FB996] rounded-full py-3 items-center mt-2"
        onPress={onSubmit}
        disabled={submitting || !email || !password}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Log In</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/register" className="mt-6 text-[#557C55]">
        Don&apos;t have an account? Sign up
      </Link>
    </View>
  );
}
