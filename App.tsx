import React from 'react'
import { SafeAreaView } from 'react-native'
import AuthScreen from './src/screens/AuthScreen'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ProfileSetupScreen from './src/screens/ProfileSetupScreen'
import MainApp from './src/screens/MainApp'   // your logged-in flow

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* If no session */}
        <Stack.Screen name="Auth" component={AuthScreen} />

        {/* Immediately after Sign-Up */}
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
        />

        {/* After complete */}
        <Stack.Screen name="MainApp" component={MainApp} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
