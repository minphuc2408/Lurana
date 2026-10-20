// Deferred source stays available for future integration. An opt-in cannot
// activate customer fixtures before a real customer API is connected.
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
export const customerAuthRequested = env?.VITE_ENABLE_CUSTOMER_AUTH === 'true';
const customerApiReady = false;
export const featureFlags = {
  customerAuth: customerAuthRequested && customerApiReady,
  customRequests: false,
  adminCustomers: false,
  adminSettings: false,
  adminNotifications: false,
  // Enable only after the shop supplies a working, verified contact destination.
  zaloContact: false,
};
