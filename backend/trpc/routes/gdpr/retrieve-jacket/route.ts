import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { GDPRStorage } from '../../../../storage/gdpr-storage';

export const retrieveJacketProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    await GDPRStorage.updateJacket(input.id, {
      status: 'retrieved',
      retrievalTime: new Date().toISOString(),
    });

    return { success: true };
  });
