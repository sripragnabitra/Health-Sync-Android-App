import { z } from "zod";

/**
 * `clientDeviceId` is generated once by the mobile app on first launch
 * (a UUID persisted in DataStore) and resent on every call. It's what
 * makes device registration idempotent — reinstalling the app or calling
 * this twice on the same physical device updates the same row instead of
 * creating a duplicate `devices` record.
 */
export const registerDeviceSchema = z.object({
  clientDeviceId: z.string().uuid(),
  platform: z.enum(["ANDROID", "IOS"]).default("ANDROID"),
  deviceModel: z.string().max(120).optional(),
  osVersion: z.string().max(40).optional(),
  appVersion: z.string().max(40).optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
