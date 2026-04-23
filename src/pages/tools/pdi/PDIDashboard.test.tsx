import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDIDashboard } from './PDIDashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/AuthContext';

// Mock AuthContext
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user123' },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('PDIDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PDIDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText('pdi.dashboard.title')).toBeDefined();
  });

  it('opens the new PDI modal when clicking the button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PDIDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    const newPdiBtn = screen.getByText('pdi.dashboard.new_pdi');
    fireEvent.click(newPdiBtn);
    
    expect(screen.getByText('pdi.form.create_title')).toBeDefined();
  });
});
