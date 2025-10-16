import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Jacket, JacketStats } from '@/types/jacket';
import { useAuth } from './AuthContext';

const getStorageKey = (userId: string) => `@myjacket_data_${userId}`;

export const [JacketProvider, useJackets] = createContextHook(() => {
  const { user } = useAuth();
  const [jackets, setJackets] = useState<Jacket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadJackets = useCallback(async () => {
    if (!user) return;
    
    try {
      const storageKey = getStorageKey(user.username);
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setJackets(JSON.parse(stored));
      } else {
        setJackets([]);
      }
    } catch (error) {
      console.error('Error loading jackets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadJackets();
    } else {
      setJackets([]);
      setIsLoading(false);
    }
  }, [user, loadJackets]);



  const addJacket = useCallback((jacket: Jacket) => {
    if (!user) return;
    
    setJackets(prev => {
      const updated = [...prev, jacket];
      const storageKey = getStorageKey(user.username);
      AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, [user]);

  const updateJacket = useCallback((id: string, updates: Partial<Jacket>) => {
    if (!user) return;
    
    setJackets(prev => {
      const updated = prev.map(j => 
        j.id === id ? { ...j, ...updates } : j
      );
      const storageKey = getStorageKey(user.username);
      AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, [user]);

  const retrieveJacket = useCallback((id: string) => {
    if (!user) return;
    
    setJackets(prev => {
      const updated = prev.map(j => 
        j.id === id ? { ...j, status: 'retrieved' as const, retrievalTime: new Date().toISOString() } : j
      );
      const storageKey = getStorageKey(user.username);
      AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, [user]);

  const getJacketByQR = useCallback((qrCode: string): Jacket | undefined => {
    return jackets.find(j => j.qrCode === qrCode);
  }, [jackets]);

  const stats: JacketStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayDeposits = jackets.filter(j => 
      new Date(j.depositTime) >= todayStart
    ).length;

    const active = jackets.filter(j => j.status === 'active').length;
    const retrieved = jackets.filter(j => j.status === 'retrieved').length;

    return {
      total: jackets.length,
      active,
      retrieved,
      todayDeposits,
    };
  }, [jackets]);

  return useMemo(() => ({
    jackets,
    isLoading,
    addJacket,
    updateJacket,
    retrieveJacket,
    getJacketByQR,
    stats,
  }), [jackets, isLoading, addJacket, updateJacket, retrieveJacket, getJacketByQR, stats]);
});

export const useActiveJackets = () => {
  const { jackets } = useJackets();
  return useMemo(() => jackets.filter(j => j.status === 'active'), [jackets]);
};

export const useRetrievedJackets = () => {
  const { jackets } = useJackets();
  return useMemo(() => jackets.filter(j => j.status === 'retrieved'), [jackets]);
};
