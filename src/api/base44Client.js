import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6929e5bee86123b96ac8ce9c", 
  requiresAuth: true // Ensure authentication is required for all operations
});
