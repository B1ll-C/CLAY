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

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await register(email.trim(), password);
      router.replace("/(tabs)/product");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-[#557C55] mb-8">
        Create account
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
        className="w-full bg-gray-100 rounded-xl px-4 py-3 mb-1"
        placeholder="Password (min. 8 characters)"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <Text className="text-red-500 mb-3 mt-2 text-center">{error}</Text>
      )}

      <TouchableOpacity
        className="w-full bg-[#8FB996] rounded-full py-3 items-center mt-4"
        onPress={onSubmit}
        disabled={submitting || !email || password.length < 8}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Sign Up</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" className="mt-6 text-[#557C55]">
        Already have an account? Log in
      </Link>
    </View>
  );
}
