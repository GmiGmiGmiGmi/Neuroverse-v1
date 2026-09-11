import { CONFIG } from '../config/app-config.js';

function join(base, path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${String(base || '').replace(/\/$/,'')}/${String(path).replace(/^\//,'')}`;
}

export const mediaService = {
  url(ref, provider = CONFIG.mediaProvider) {
    if (!ref) return '';
    if (/^https?:\/\//i.test(ref) || ref.startsWith('assets/')) return ref;
    if (provider === 'aws' && CONFIG.media.awsPublicBaseUrl) return join(CONFIG.media.awsPublicBaseUrl, ref);
    if (provider === 'supabase' && CONFIG.supabase.url) {
      return `${CONFIG.supabase.url.replace(/\/$/,'')}/storage/v1/object/public/${CONFIG.media.supabaseBucket}/${String(ref).replace(/^\//,'')}`;
    }
    return join(CONFIG.media.localBaseUrl, ref);
  }
};
