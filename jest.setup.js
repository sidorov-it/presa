if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Import jest-dom for enhanced DOM element matchers
import '@testing-library/jest-dom';

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
})); 