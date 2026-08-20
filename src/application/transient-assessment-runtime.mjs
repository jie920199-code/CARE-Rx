import { TransientSessionStore } from "./transient-session-store.mjs";

const globalStore = globalThis.__careRxTransientAssessmentStore ?? new TransientSessionStore();
if (process.env.NODE_ENV !== "production") globalThis.__careRxTransientAssessmentStore = globalStore;
export const transientAssessmentStore = globalStore;
