// components/MainApp.tsx 
import React from 'react' 
import { View, Text, StyleSheet } from 'react-native'

export default function MainApp() { 
    return ( 
    <View style={styles.container}> 
    <Text style={styles.title}>Welcome to WatPlan!</Text> 
    <Text style={styles.subtitle}>Your roadmap builder is coming soon.</Text> 
    </View> 
    ) 
}

const styles = StyleSheet.create({ 
    container: { 
        flex: 1, 
        padding: 24, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#fff' }, 
        title: { 
            fontSize: 28, 
            fontWeight: '600', 
            marginBottom: 12 }, 
            subtitle: { 
                fontSize: 16, 
                color: '#666' } 
            }
        )