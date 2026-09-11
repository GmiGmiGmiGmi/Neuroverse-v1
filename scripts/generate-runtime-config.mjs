import fs from 'node:fs';
const e=process.env;
const bool=(v,d=false)=>v==null?d:/^(1|true|yes)$/i.test(v);
const cfg={
  environment:e.NEUROVERSE_ENV||'production',
  contentProvider:e.CONTENT_PROVIDER||'local',
  authProvider:e.AUTH_PROVIDER||'none',
  mediaProvider:e.MEDIA_PROVIDER||'local',
  routingMode:e.ROUTING_MODE||'hash',
  fallbackToLocal:bool(e.FALLBACK_TO_LOCAL,true),
  supabase:{url:e.SUPABASE_URL||'',publishableKey:e.SUPABASE_PUBLISHABLE_KEY||''},
  media:{localBaseUrl:'assets/images/',supabaseBucket:e.SUPABASE_MEDIA_BUCKET||'support-media',awsPublicBaseUrl:e.AWS_PUBLIC_BASE_URL||''},
  features:{admin:bool(e.FEATURE_ADMIN,false),analytics:bool(e.FEATURE_ANALYTICS,false)}
};
fs.writeFileSync('docs/config/runtime-config.js',`window.__NEUROVERSE_CONFIG__ = ${JSON.stringify(cfg,null,2)};\n`);
console.log(`Neuroverse config generated: content=${cfg.contentProvider}, auth=${cfg.authProvider}, media=${cfg.mediaProvider}`);
