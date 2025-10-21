import { publicProcedure } from '../../../create-context';
import { GDPRStorage } from '../../../../storage/gdpr-storage';

export const cleanupExpiredProcedure = publicProcedure
  .mutation(async () => {
    const deletedCount = await GDPRStorage.deleteExpiredJackets();
    
    return { 
      success: true, 
      deletedCount,
      message: `${deletedCount} expired jackets anonymized and deleted`
    };
  });
