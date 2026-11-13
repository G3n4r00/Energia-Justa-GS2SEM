import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { AppliancesScreen } from './src/screens/AppliancesScreen';
import { SimuladorScreen } from './src/screens/SimuladorScreen';
import { PlanoScreen } from './src/screens/PlanoScreen';
import { colors, type } from './src/ui/tokens';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: colors.textInverse,
          headerTitleStyle: { ...type.title, color: colors.textInverse },
          tabBarStyle: { backgroundColor: colors.brand, borderTopWidth: 0 },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { ...type.caption, marginBottom: 2 },
        }}
      >
        <Tab.Screen
          name="Início"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Aparelhos"
          component={AppliancesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flash-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Simulador"
          component={SimuladorScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pulse-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Plano"
          component={PlanoScreen}
          options={{
            tabBarLabel: 'Plano',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-down-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
