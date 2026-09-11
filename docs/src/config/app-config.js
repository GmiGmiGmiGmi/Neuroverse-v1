export const CONFIG = (() => {
  const defaults = {
    environment: 'local', contentProvider: 'local', authProvider: 'none', mediaProvider: 'local',
    routingMode: 'hash', fallbackToLocal: true,
    supabase: { url: '', publishableKey: '' },
    media: { localBaseUrl: 'assets/images/', supabaseBucket: 'support-media', awsPublicBaseUrl: '' },
    features: { admin: false, analytics: false }
  };
  const c = window.__NEUROVERSE_CONFIG__ || {};
  return {
    ...defaults, ...c,
    supabase: { ...defaults.supabase, ...(c.supabase || {}) },
    media: { ...defaults.media, ...(c.media || {}) },
    features: { ...defaults.features, ...(c.features || {}) }
  };
})();
