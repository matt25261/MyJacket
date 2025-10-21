import { GDPRStorage } from '../storage/gdpr-storage';

export async function runGDPRCleanup() {
  console.log('[GDPR Cleanup] Starting automatic cleanup of expired data...');
  
  try {
    const deletedCount = await GDPRStorage.deleteExpiredJackets();
    console.log(`[GDPR Cleanup] Successfully anonymized and deleted ${deletedCount} expired jackets`);
    
    return { success: true, deletedCount };
  } catch (error) {
    console.error('[GDPR Cleanup] Error during cleanup:', error);
    return { success: false, deletedCount: 0, error };
  }
}

export function startGDPRCleanupScheduler() {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

  runGDPRCleanup();

  setInterval(() => {
    runGDPRCleanup();
  }, CLEANUP_INTERVAL);

  console.log('[GDPR Cleanup] Scheduler started - running every 24 hours');
}
