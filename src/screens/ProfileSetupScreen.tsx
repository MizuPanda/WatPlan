import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { computeTitleSize, brand } from './AuthScreen';

interface ProgramOption {
  degree_id: string;
  short_name: string;
  coop: boolean;
  years: number[];
}

export default function ProfileSetupScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [username, setUsername] = useState('');
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(0);
  const [startYearInput, setStartYearInput] = useState('');

  useEffect(() => {
    async function fetchPrograms() {
      const { data, error } = await supabase
        .from('degree_programs')
        .select('degree_id, short_name, plan_year, coop');
      if (error) {
        console.error('Error fetching programs:', error);
        return;
      }
      const map: Record<string, ProgramOption> = {};
      data.forEach((item) => {
        const key = `${item.degree_id}-${item.coop}`;
        if (!map[key]) {
          map[key] = {
            degree_id: item.degree_id,
            short_name: item.short_name,
            coop: item.coop,
            years: [],
          };
        }
        map[key].years.push(item.plan_year);
      });
      const options = Object.values(map).map((opt) => ({
        ...opt,
        years: opt.years.sort((a, b) => a - b),
      }));
      options.sort((a, b) => {
        if (a.short_name !== b.short_name) return a.short_name.localeCompare(b.short_name);
        return a.coop === b.coop ? 0 : a.coop ? -1 : 1;
      });
      setPrograms(options);
      setSelectedProgramIndex(0);
    }
    fetchPrograms();
  }, []);

  const handleSubmit = async () => {
    const numericYear = parseInt(startYearInput, 10);
    if (!username.trim() || programs.length === 0 || isNaN(numericYear)) {
      Alert.alert('Validation', 'Please complete all fields correctly.');
      return;
    }
    const program = programs[selectedProgramIndex];
    const availableYears = program.years;
    const minYear = Math.min(...availableYears);
    const maxYear = Math.max(...availableYears);
    let matchedYear = numericYear;
    if (numericYear < minYear) matchedYear = minYear;
    else if (numericYear > maxYear) matchedYear = maxYear;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      Alert.alert('Error', 'Authentication issue. Please sign in again.');
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.trim(),
      current_degree_id: program.degree_id,
      current_plan_year: matchedYear,
      current_coop: program.coop,
    });
    if (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } else {
      navigation.navigate('MainApp');
    }
  };

  return (
    <ScrollView style={styles.background} contentContainerStyle={styles.scrollContainer}>
      <View style={[styles.headerContainer, Platform.OS !== 'web' && styles.headerMobile]}>  
        <Text style={styles.appTitle}>WatPlan</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>You’re almost done!</Text>

        <View style={styles.formWrapper}>
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Program</Text>
            <View style={[styles.pickerContainer, Platform.OS === 'web' && styles.pickerWeb]}>  
              <Picker
                style={Platform.OS === 'web' ? styles.pickerSelectWeb : undefined}
                selectedValue={selectedProgramIndex}
                onValueChange={(index) => setSelectedProgramIndex(index)}
              >
                {programs.map((prog, idx) => (
                  <Picker.Item
                    key={`${prog.degree_id}-${prog.coop}`}
                    label={`${prog.short_name}${prog.coop ? ' (Co-op)' : ''}`}
                    value={idx}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Year Started</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2023"
              value={startYearInput}
              onChangeText={setStartYearInput}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Finish Setup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerContainer: {
    paddingTop: Platform.select({ ios: 60, android: 40, web: 40 }),
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  headerMobile: {
    paddingHorizontal: 0,
  },
  appTitle: {
    fontSize: computeTitleSize(),
    fontWeight: '700',
    color: brand,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '700',
    color:
      '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  field: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pickerWeb: {
    borderRadius: 0,
  },
  pickerSelectWeb: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 24,
    width: Platform.OS === 'web' ? 220 : '100%',
    backgroundColor: brand,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});