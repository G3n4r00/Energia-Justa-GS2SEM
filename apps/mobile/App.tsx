import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// 10.0.2.2 é o loopback do host no emulador Android.
// Para dispositivo físico, defina EXPO_PUBLIC_API_URL com o IP da máquina.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000';

type HealthResponse = { status: string; ts: string };

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch(e => setErro(String(e)));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>EnergiaJusta</Text>
      <Text style={styles.rotulo}>Backend</Text>

      {!health && !erro && <ActivityIndicator size="large" color="#2E7D32" />}

      {health && (
        <View style={styles.caixa}>
          <Text style={styles.status}>status: {health.status}</Text>
          <Text style={styles.ts}>{health.ts}</Text>
        </View>
      )}

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 32,
    color: '#1B5E20',
  },
  rotulo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  caixa: {
    backgroundColor: '#F1F8E9',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    minWidth: 220,
  },
  status: {
    fontFamily: 'monospace' as const,
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ts: {
    fontFamily: 'monospace' as const,
    fontSize: 12,
    color: '#555',
    marginTop: 6,
  },
  erro: {
    color: '#B71C1C',
    fontSize: 13,
    textAlign: 'center',
  },
});
