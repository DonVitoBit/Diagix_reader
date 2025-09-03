import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getCurrentUser, signInWithOtp, signOut } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  async function handleSignIn() {
    if (!email) return;

    try {
      setLoading(true);
      await signInWithOtp(email);
      Alert.alert(
        'Проверьте почту',
        'Мы отправили вам ссылку для входа на указанный email адрес.'
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить ссылку для входа.');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта.');
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.userInfo}>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.subtitle}>Вы вошли в аккаунт</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Выход...' : 'Выйти'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход в аккаунт</Text>
      <Text style={styles.subtitle}>
        Введите email для получения ссылки для входа
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Ваш email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading || !email}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Отправка...' : 'Получить ссылку для входа'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
});
