import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { GDPRStorage } from '../../../../storage/gdpr-storage';

export const getJacketProcedure = publicProcedure
  .input(z.object({ qrCode: z.string() }))
  .query(async ({ input }) => {
    const jacket = await GDPRStorage.getJacketByQR(input.qrCode);
    
    if (!jacket) {
      return null;
    }

    const phoneNumber = await GDPRStorage.getDecryptedPhoneNumber(jacket.encryptedPhoneNumber);

    return {
      id: jacket.id,
      hangerNumber: jacket.hangerNumber,
      phoneNumber,
      countryCode: jacket.countryCode,
      qrCode: jacket.qrCode,
      status: jacket.status,
      depositTime: jacket.depositTime,
      retrievalTime: jacket.retrievalTime,
    };
  });
