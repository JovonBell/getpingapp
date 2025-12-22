// Jest setup file - minimal setup for unit tests

// Set env vars
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Silence console warnings during tests
const originalConsole = { ...console };
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
};
