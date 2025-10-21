import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { GDPRStorage } from '../../../../storage/gdpr-storage';

export const deleteUserDataProcedure = publicProcedure
  .input(z.object({ phoneNumber: z.string() }))
  .mutation(async ({ input }) => {
    const jackets = await GDPRStorage.getAllJackets();
    let deletedCount = 0;

    for (const jacket of jackets) {
      try {
        const decryptedPhone = await GDPRStorage.getDecryptedPhoneNumber(jacket.encryptedPhoneNumber);
        if (decryptedPhone === input.phoneNumber) {
          await GDPRStorage.deleteJacket(jacket.id);
          deletedCount++;
        }
      } catch (error) {
        console.error('Error processing jacket:', error);
      }
    }

    return { deletedCount };
  });
