export const POINT_EARN_RATIO_JPY = 100;
export const POINT_REDEEM_RATIO_JPY = 100;

export function calculateEarnedPoints(actualPaidJpy: number): number {
  if (actualPaidJpy <= 0) return 0;
  return Math.floor(actualPaidJpy / POINT_EARN_RATIO_JPY);
}

export function calculateRedeemJpy(points: number): number {
  if (points <= 0) return 0;
  return points * POINT_REDEEM_RATIO_JPY;
}
