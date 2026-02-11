// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock react-markdown which uses ESM
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
  };
});
