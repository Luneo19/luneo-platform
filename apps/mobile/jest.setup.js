import '@testing-library/jest-native/extend-expect';

// Mocks simples pour les APIs React Native utilisées dans les tests.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}));

