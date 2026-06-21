import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@independenceos.ai";
const DEMO_PASSWORD = "DemoPass123!";
const DEMO_CLIENT_DEVICE_ID = "11111111-1111-4111-8111-111111111111";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash, fullName: "Demo Reviewer" },
  });

  const device = await prisma.device.upsert({
    where: { userId_clientDeviceId: { userId: user.id, clientDeviceId: DEMO_CLIENT_DEVICE_ID } },
    update: {},
    create: {
      userId: user.id,
      clientDeviceId: DEMO_CLIENT_DEVICE_ID,
      platform: "ANDROID",
      deviceModel: "Pixel 8 (seed)",
      osVersion: "Android 15",
      appVersion: "1.0.0",
      lastSeenAt: new Date(),
    },
  });

  console.log("Seeded demo account:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  userId:   ${user.id}`);
  console.log(`  deviceId: ${device.id}`);
  console.log("\nPOST /api/v1/sync/health-records with this deviceId to start uploading data.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
