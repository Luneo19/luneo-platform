import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import AIStudioScreen from '@/screens/ai-studio/AIStudioScreen';
import ProductsScreen from '@/screens/products/ProductsScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const iconForRoute = (route: keyof MainTabParamList) => {
  switch (route) {
    case 'Dashboard':
      return 'home';
    case 'AIStudio':
      return 'cpu';
    case 'Products':
      return 'box';
    case 'Orders':
      return 'shopping-bag';
    case 'Profile':
      return 'user';
    default:
      return 'circle';
  }
};

export const MainNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e2e8f0',
      },
      tabBarIcon: ({ color, size }) => (
        <Feather name={iconForRoute(route.name as keyof MainTabParamList)} color={color} size={size} />
      ),
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="AIStudio" component={AIStudioScreen} options={{ title: 'Studio IA' }} />
    <Tab.Screen name="Products" component={ProductsScreen} options={{ title: 'Produits' }} />
    <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Commandes' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
  </Tab.Navigator>
);

export default MainNavigator;
