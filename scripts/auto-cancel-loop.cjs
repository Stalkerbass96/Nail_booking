const { PrismaClient, AppointmentStatus } = require("@prisma/client");

const prisma = new PrismaClient();
const intervalMs = Number.parseInt(process.env.AUTO_CANCEL_INTERVAL_MS || "300000", 10);

async function runOnce() {
  const now = new Date();

  const result = await prisma.appointment.updateMany({
    where: {
      status: AppointmentStatus.pending,
      autoCancelAt: { lte: now }
    },
    data: {
      status: AppointmentStatus.canceled,
      cancelReason: "Auto-canceled: pending timeout"
    }
  });

  console.log(
    JSON.stringify({
      type: "auto-cancel",
      canceledCount: result.count,
      executedAt: now.toISOString()
    })
  );
}

async function main() {
  const every = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 300000;
  console.log(`auto-cancel worker started (intervalMs=${every})`);

  while (true) {
    try {
      await runOnce();
    } catch (error) {
      console.error("auto-cancel worker error:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, every));
  }
}

main()
  .catch((error) => {
    console.error("auto-cancel worker fatal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
