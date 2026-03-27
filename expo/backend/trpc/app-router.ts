import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { createJacketProcedure } from "./routes/gdpr/create-jacket/route";
import { getJacketProcedure } from "./routes/gdpr/get-jacket/route";
import { retrieveJacketProcedure } from "./routes/gdpr/retrieve-jacket/route";
import { deleteUserDataProcedure } from "./routes/gdpr/delete-user-data/route";
import { cleanupExpiredProcedure } from "./routes/gdpr/cleanup-expired/route";
import { getStatsProcedure } from "./routes/gdpr/get-stats/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  gdpr: createTRPCRouter({
    createJacket: createJacketProcedure,
    getJacket: getJacketProcedure,
    retrieveJacket: retrieveJacketProcedure,
    deleteUserData: deleteUserDataProcedure,
    cleanupExpired: cleanupExpiredProcedure,
    getStats: getStatsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
