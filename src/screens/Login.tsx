import React from 'react'
import { View, Button } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Login() {
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) console.error('Auth error:', error.message)
    else console.log('Redirecting to:', data.url)
  }

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Button title="Sign in with Google" onPress={signInWithGoogle} />
    </View>
  )
}
