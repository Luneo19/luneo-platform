import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { formatDate } from '@/utils/format';

export const ProfileScreen: React.FC = () => {
  const { user, logout, biometricsEnabled, enableBiometrics } = useAuthStore();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleEnableBiometrics = useCallback(async () => {
    const success = await enableBiometrics();
    Alert.alert(
      success ? 'Activée' : 'Impossible d\'activer',
      success
        ? 'Authentification biométrique disponible pour vos prochaines connexions.'
        : 'Vérifiez les réglages biométriques de votre appareil.'
    );
  }, [enableBiometrics]);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Aucun utilisateur connecté</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.firstName?.[0] ?? user.email[0]}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Rôle</Text>
          <Text style={styles.rowValue}>{user.role}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Compte créé</Text>
          <Text style={styles.rowValue}>{formatDate(user.createdAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dernière activité</Text>
          <Text style={styles.rowValue}>{formatDate(user.updatedAt)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <TouchableOpacity style={styles.preferenceRow} onPress={handleEnableBiometrics}>
          <View>
            <Text style={styles.preferenceTitle}>Authentification biométrique</Text>
            <Text style={styles.preferenceSubtitle}>
              {biometricsEnabled ? 'Activée' : 'Non activée'}
            </Text>
          </View>
          <Text style={styles.preferenceAction}>Configurer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  email: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    color: '#64748b',
  },
  rowValue: {
    fontWeight: '600',
    color: '#0f172a',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  preferenceSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  preferenceAction: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
