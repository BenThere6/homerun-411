import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export default function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    return () => sub && sub();
  }, []);
  return online;
}