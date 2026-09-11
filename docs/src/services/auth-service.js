import { CONFIG } from '../config/app-config.js';
import { contentService } from './content-service.js';

export const authService = {
  enabled() { return CONFIG.authProvider === 'supabase'; },
  async signIn(email, password) {
    if (!this.enabled()) throw new Error('Authentication provider is not enabled.');
    const sb = await contentService.getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    if (!this.enabled()) return;
    const sb = await contentService.getSupabase();
    await sb.auth.signOut();
  },
  async session() {
    if (!this.enabled()) return null;
    const sb = await contentService.getSupabase();
    const { data } = await sb.auth.getSession();
    return data.session;
  },
  async profile() {
    const session = await this.session();
    if (!session) return null;
    const sb = await contentService.getSupabase();
    const { data, error } = await sb.from('profiles').select('id,display_name,role').eq('id',session.user.id).single();
    if (error) throw error;
    return data;
  }
};
