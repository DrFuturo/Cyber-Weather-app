import { render, screen } from '@testing-library/react';
import App from './App';

test('renders weather forecast heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/weather forecast/i);
  expect(headingElement).toBeInTheDocument();
});
