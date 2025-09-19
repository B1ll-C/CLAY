import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8eb692",
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="product"
        options={{
          title: "Groceries",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="shopping-basket" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "List",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="archive" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProductDetails"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
