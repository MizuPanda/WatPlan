// components/AuthScreen.tsx
import React, { useState } from 'react'

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

// Define your stack’s param list
type AuthStackParamList = {
  Auth: undefined
  ProfileSetup: undefined
  MainApp: undefined
}

export default function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleEmail = async () => {
    setLoading(true)
    let res
    if (isSignUp) {
      res = await supabase.auth.signUp({ email, password })
      if (!res.error) {
        // new user — send them to profile setup
        navigation.navigate('ProfileSetup')
      }
    } else {
      res = await supabase.auth.signInWithPassword({ email, password })
      if (!res.error) {
        // existing user — go to main app
        navigation.replace('ProfileSetup')
      }
    }
    if (res.error) setErrorMsg(res.error.message)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>WatPlan</Text>
      <View style={styles.inner}>
        <Text style={styles.title}>
          {isSignUp ? 'Create an Account' : 'Welcome Back!'}
        </Text>

        {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

        <TextInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabled]}
          onPress={handleEmail}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            
            setErrorMsg(null)
            setIsSignUp(!isSignUp)
          }}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// responsive sizing
const { width } = Dimensions.get('window')
const INNER_MAX_WIDTH = 400
const PADDING = 24

// Dynamically scale title: mobile, tablet, web breakpoints
export const computeTitleSize = () => {
  if (width >= 1024) return 72  // large screens
  if (width >= 600) return 48   // tablets and small desktops
  return 36                     // phones
}

export const brand = '#2563EB'         // a vivid blue for WatPlan branding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: PADDING,
    justifyContent: 'center',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  appTitle: {
    fontSize: computeTitleSize(),
    fontWeight: '700',
    marginBottom: 24,
    color: brand
  },
  inner: {
    width: '100%',
    maxWidth: INNER_MAX_WIDTH
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 14,
    marginBottom: 12,
    width: '100%'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4
  },
  primaryButton: {
    backgroundColor: brand,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    width: '100%'
  },
  primaryText: {
    color: '#fff',
    fontWeight: '500'
  },
  switchText: {
    color: brand,
    textAlign: 'center',
    marginTop: 16
  },
  error: {
    color: 'crimson',
    textAlign: 'center',
    marginBottom: 8
  },
  disabled: {
    opacity: 0.6
  }
})

