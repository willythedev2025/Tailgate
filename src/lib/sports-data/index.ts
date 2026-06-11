export * from "./types";
export { ManualProvider } from "./manual-provider";
export { ApiProvider } from "./api-provider";

import { ManualProvider } from "./manual-provider";

// Default to ManualProvider. Swap to ApiProvider when ESPN keys are ready.
export const sportsData = new ManualProvider();
