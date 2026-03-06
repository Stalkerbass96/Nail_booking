export const POINT_EARN_RATIO_JPY = 100;
export const POINT_REDEEM_RATIO_JPY = 100;

export function calculateEarnedPoints(actualPaidJpy: number, earnRatioJpy = POINT_EARN_RATIO_JPY): number {
  if (actualPaidJpy <= 0) return 0;
  const ratio = Number.isFinite(earnRatioJpy) && earnRatioJpy > 0 ? earnRatioJpy : POINT_EARN_RATIO_JPY;
  return Math.floor(actualPaidJpy / ratio);
}

export function calculateRedeemJpy(points: number, redeemRatioJpy = POINT_REDEEM_RATIO_JPY): number {
  if (points <= 0) return 0;
  const ratio = Number.isFinite(redeemRatioJpy) && redeemRatioJpy > 0 ? redeemRatioJpy : POINT_REDEEM_RATIO_JPY;
  return points * ratio;
}
