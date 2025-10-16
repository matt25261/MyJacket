import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';

const AUTH_STORAGE_KEY = '@myjacket_auth';

interface User {
  id: string;
  username: string;
  email: string;
}

const VALID_USERS = [
  { username: 'admin', password: 'admin123', email: 'admin@myjacket.com' },
  { username: 'vestiaire', password: 'vestiaire123', email: 'vestiaire@myjacket.com' },
  { username: 'seb', password: 'seb123', email: 'seb@myjacket.com' },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const validUser = VALID_USERS.find(
      (u) => u.username === username.trim() && u.password === password.trim()
    );

    if (validUser) {
      const newUser: User = {
        id: Date.now().toString(),
        username: validUser.username,
        email: validUser.email,
      };
      
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        return true;
      } catch (error) {
        console.error('Error saving auth:', error);
        return false;
      }
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  }), [user, isLoading, login, logout]);
});
