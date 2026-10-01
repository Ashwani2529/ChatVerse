import { render, screen } from '@testing-library/react';

import App from './App';

test('shows the room join form when there is no saved session', () => {
  window.localStorage.clear();

  render(<App />);

  expect(screen.getByLabelText(/room id/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/room password/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /enter room/i })).toBeInTheDocument();
});
