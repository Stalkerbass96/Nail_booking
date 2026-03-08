import { CustomerCreatedFrom, CustomerType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createLineLinkToken } from "@/lib/line";

type Tx = Prisma.TransactionClient;

function fallbackCustomerName(displayName: string | null | undefined, lineUserId: string): string {
  const value = displayName?.trim();
  if (value) return value.slice(0, 80);
  return `LINE-${lineUserId.slice(-8)}`;
}

export async function ensureLineCustomer(tx: Tx, input: {
  id: bigint;
  lineUserId: string;
  customerId: bigint | null;
  displayName: string | null;
  homeEntryToken: string | null;
}) {
  let customerId = input.customerId;

  if (!customerId) {
    const customer = await tx.customer.create({
      data: {
        name: fallbackCustomerName(input.displayName, input.lineUserId),
        email: null,
        customerType: CustomerType.lead,
        createdFrom: CustomerCreatedFrom.line
      },
      select: { id: true }
    });

    customerId = customer.id;
  }

  const lineUser = await tx.lineUser.update({
    where: { id: input.id },
    data: {
      customerId,
      linkedAt: new Date(),
      homeEntryToken: input.homeEntryToken || createLineLinkToken()
    },
    include: {
      customer: true
    }
  });

  return lineUser;
}

export async function ensureLineCustomerByLineUserId(lineUserId: bigint) {
  return prisma.$transaction(async (tx) => {
    const lineUser = await tx.lineUser.findUnique({
      where: { id: lineUserId },
      select: {
        id: true,
        lineUserId: true,
        customerId: true,
        displayName: true,
        homeEntryToken: true
      }
    });

    if (!lineUser) return null;
    return ensureLineCustomer(tx, lineUser);
  });
}

export async function findLineEntryByToken(entryToken: string) {
  if (!entryToken.trim()) return null;

  return prisma.lineUser.findUnique({
    where: { homeEntryToken: entryToken.trim() },
    include: {
      customer: true
    }
  });
}
