import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const ADMIN_EMAIL = 'admin@luneo.app';

export const RegisterScreen: React.FC = () => {
  const handleContactAdmin = () => {
    Linking.openURL(`mailto:${ADMIN_EMAIL}?subject=Demande%20d'accès%20Luneo%20Mobile`).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.subtitle}>
        Le flux d'inscription complet sera disponible prochainement. Veuillez contacter votre administrateur pour créer un compte.
      </Text>
      <TouchableOpacity style={styles.cta} onPress={handleContactAdmin}>
        <Text style={styles.ctaText}>Contacter l'administrateur</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  cta: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3751ff',
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
