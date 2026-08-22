// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Netwerk Status Hook
// Detecteert of de app online of offline is via @react-native-community/netinfo
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkStatus {
  isOnline: boolean;
  isControlled: boolean; // false tijdens initieel laden
}

/**
 * Hook die de huidige netwerkstatus bijhoudt.
 * @returns {{ isOnline, isControlled }}
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline,     setIsOnline]     = useState(true);
  const [isControlled, setIsControlled] = useState(false);

  useEffect(() => {
    // Eenmalig controleren bij mount
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? true);
      setIsControlled(true);
    });

    // Luister naar netwerkwijzigingen
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
      setIsControlled(true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isControlled };
}
