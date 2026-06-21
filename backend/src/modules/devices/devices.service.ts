import { prisma } from "../../db/prisma";
import { RegisterDeviceInput } from "./devices.schema";

export async function registerOrUpdateDevice(userId: string, input: RegisterDeviceInput) {
  return prisma.device.upsert({
    where: { userId_clientDeviceId: { userId, clientDeviceId: input.clientDeviceId } },
    create: {
      userId,
      clientDeviceId: input.clientDeviceId,
      platform: input.platform,
      deviceModel: input.deviceModel,
      osVersion: input.osVersion,
      appVersion: input.appVersion,
      lastSeenAt: new Date(),
    },
    update: {
      deviceModel: input.deviceModel,
      osVersion: input.osVersion,
      appVersion: input.appVersion,
      lastSeenAt: new Date(),
    },
  });
}

export async function listDevices(userId: string) {
  return prisma.device.findMany({ where: { userId }, orderBy: { lastSeenAt: "desc" } });
}
