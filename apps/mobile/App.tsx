import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import LoginScreen from "./src/auth/LoginScreen";
import MeetingListScreen from "./src/screens/MeetingListScreen";
import MeetingDetailScreen from "./src/screens/MeetingDetailScreen";
import ActionItemsScreen from "./src/screens/ActionItemsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MeetingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: "#1f2937"
      }}
    >
      <Stack.Screen
        name="MeetingListTab"
        component={MeetingListScreen}
        options={{ title: "Meetings" }}
      />
      <Stack.Screen
        name="MeetingDetail"
        component={MeetingDetailScreen}
        options={{ title: "Meeting Details" }}
      />
    </Stack.Navigator>
  );
}

function ActionItemsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: "#1f2937"
      }}
    >
      <Stack.Screen
        name="ActionItemsTab"
        component={ActionItemsScreen}
        options={{ title: "My Action Items" }}
      />
    </Stack.Navigator>
  );
}

function AuthenticatedTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1f2937",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopColor: "#e5e7eb",
          paddingBottom: 4,
          paddingTop: 4
        }
      }}
    >
      <Tab.Screen
        name="Meetings"
        component={MeetingStack}
        options={{
          tabBarLabel: "Meetings",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📋</Text>
          )
        }}
      />
      <Tab.Screen
        name="ActionItems"
        component={ActionItemsStack}
        options={{
          tabBarLabel: "Action Items",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>✓</Text>
          )
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <AuthenticatedTabs /> : <LoginStack />}
    </NavigationContainer>
  );
}

function LoginStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

import { Text } from "react-native";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
