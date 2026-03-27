import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { GDPRStorage } from '../../../../storage/gdpr-storage';

export const createJacketProcedure = publicProcedure
  .input(
    z.object({
      hangerNumber: z.string(),
      phoneNumber: z.string(),
      countryCode: z.string(),
      consentGiven: z.boolean(),
    })
  )
  .mutation(async ({ input }) => {
    if (!input.consentGiven) {
      throw new Error('User consent is required for GDPR compliance');
    }

    const jacket = await GDPRStorage.saveJacket({
      hangerNumber: input.hangerNumber,
      phoneNumber: input.phoneNumber,
      countryCode: input.countryCode,
      status: 'active',
      depositTime: new Date().toISOString(),
      consentGiven: input.consentGiven,
    });

    return {
      id: jacket.id,
      hangerNumber: jacket.hangerNumber,
      countryCode: jacket.countryCode,
      qrCode: jacket.qrCode,
      status: jacket.status,
      depositTime: jacket.depositTime,
    };
  });
