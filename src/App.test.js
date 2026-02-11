import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AI-powered resume analyzer app', () => {
  render(<App />);
  const titleElement = screen.getByText(/Intelligence Intake/i);
  expect(titleElement).toBeInTheDocument();
});
