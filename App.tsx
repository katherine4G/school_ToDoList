// learning/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import TasksScreen from './screens/TasksScreen';
import CoursesScreen from './screens/CoursesScreen';

// ✅ Asegúrate de tipar Calendar con parámetros opcionales
export type RootTabParamList = {
  Home: undefined;
  Calendar: { selectedDate?: string; editingTaskId?: string };
  Tasks: undefined;
  Courses: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: '#555',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = '';

              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
              else if (route.name === 'Tasks') iconName = focused ? 'list' : 'list-outline';
              else if (route.name === 'Courses') iconName = focused ? 'book' : 'book-outline';
              else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

              return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Calendar" component={CalendarScreen} />
          <Tab.Screen name="Tasks" component={TasksScreen} />
          <Tab.Screen name="Courses" component={CoursesScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
