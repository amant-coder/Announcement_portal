import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key: Please set VITE_CLERK_PUBLISHABLE_KEY in frontend/.env");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInUrl="/admin/login"
      signUpUrl="/admin/sign-up"
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ClerkProvider>
  </BrowserRouter>
);