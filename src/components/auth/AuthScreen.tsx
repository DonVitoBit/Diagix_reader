import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { TouchableScale } from '@/components/TouchableScale';
import { theme, typography, spacing, radius, BRAND_COLOR } from '@/styles/theme';
import { PageTransition } from '@/components/transitions/PageTransition';

export function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = theme[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Показываем сообщение о подтверждении email
        alert('Проверьте вашу почту для подтверждения регистрации');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <PageTransition>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: colors.text }]}>
              {mode === 'login' ? 'Вход' : 'Регистрация'}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={error}
            />

            <Input
              label="Пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={error}
            />

            <Button
              title={mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              onPress={handleAuth}
              loading={loading}
              style={styles.button}
            />
          </View>

          <TouchableScale onPress={toggleMode}>
            <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
              {mode === 'login'
                ? 'Нет аккаунта? Зарегистрируйтесь'
                : 'Уже есть аккаунт? Войдите'}
            </Text>
          </TouchableScale>
        </View>
      </KeyboardAvoidingView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.lg,
    tintColor: BRAND_COLOR,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
  },
  toggleText: {
    ...typography.body,
    textAlign: 'center',
  },
});
