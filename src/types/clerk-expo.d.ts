declare module '@clerk/clerk-expo' {
  import * as React from 'react';

  export interface ClerkProviderProps {
    children?: React.ReactNode;
    publishableKey: string;
    tokenCache?: unknown;
  }

  export const ClerkProvider: React.ComponentType<ClerkProviderProps>;
  export const SignedIn: React.ComponentType<{ children?: React.ReactNode }>;
  export const SignedOut: React.ComponentType<{ children?: React.ReactNode }>;
}
