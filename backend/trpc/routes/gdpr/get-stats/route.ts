import { publicProcedure } from '../../../create-context';
import { GDPRStorage } from '../../../../storage/gdpr-storage';

export const getStatsProcedure = publicProcedure
  .query(async () => {
    const stats = await GDPRStorage.getAnonymizedStats();
    return stats;
  });
