const { PrismaClient, AppointmentStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
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
      canceledCount: result.count,
      executedAt: now.toISOString()
    })
  );
}

main()
  .catch((error) => {
    console.error("auto-cancel failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
