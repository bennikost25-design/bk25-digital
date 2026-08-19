export function maxCorrectionRounds(packageId: string | null | undefined): number {
  if (packageId === "komplett") return 2;
  return 1;
}
