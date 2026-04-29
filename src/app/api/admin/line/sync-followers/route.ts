import { prisma } from "@/lib/db";
import { ensureLineCustomer } from "@/lib/line-customers";
import { getAllLineFollowerIds, getLineConfig, getLineProfile } from "@/lib/line";
import { NextResponse } from "next/server";

export async function POST() {
  const config = getLineConfig();
  if (!config.enabled) {
    return NextResponse.json({ error: "LINE is not configured" }, { status: 503 });
  }

  try {
    const allIds = await getAllLineFollowerIds();

    if (allIds.length === 0) {
      return NextResponse.json({ synced: 0, total: 0 });
    }

    const existing = await prisma.lineUser.findMany({
      where: { lineUserId: { in: allIds } },
      select: { lineUserId: true }
    });
    const existingSet = new Set(existing.map((u) => u.lineUserId));
    const missing = allIds.filter((id) => !existingSet.has(id));

    let synced = 0;
    for (const lineUserId of missing) {
      try {
        const profile = await getLineProfile(lineUserId);
        await prisma.$transaction(async (tx) => {
          const lineUser = await tx.lineUser.upsert({
            where: { lineUserId },
            create: {
              lineUserId,
              displayName: profile?.displayName,
              pictureUrl: profile?.pictureUrl,
              statusMessage: profile?.statusMessage,
              isFollowing: true,
              lastSeenAt: new Date()
            },
            update: {
              isFollowing: true,
              displayName: profile?.displayName,
              pictureUrl: profile?.pictureUrl,
              lastSeenAt: new Date()
            },
            select: {
              id: true,
              lineUserId: true,
              customerId: true,
              displayName: true,
              homeEntryToken: true,
              welcomeSentAt: true
            }
          });
          await ensureLineCustomer(tx, lineUser);
        });
        synced++;
      } catch {
        // Skip individual failures, continue with rest
      }
    }

    // Also mark unfollowed users (in DB as following but not in LINE list)
    const followingInDb = await prisma.lineUser.findMany({
      where: { isFollowing: true },
      select: { lineUserId: true }
    });
    const allIdSet = new Set(allIds);
    const toUnfollow = followingInDb
      .map((u) => u.lineUserId)
      .filter((id) => !allIdSet.has(id));

    if (toUnfollow.length > 0) {
      await prisma.lineUser.updateMany({
        where: { lineUserId: { in: toUnfollow } },
        data: { isFollowing: false }
      });
    }

    return NextResponse.json({ synced, total: allIds.length, unsynced: toUnfollow.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
