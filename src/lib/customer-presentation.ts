import { packages } from "@/data/packages";

export function packageDisplayName(packageId: string | null | undefined): string {
  if (!packageId) return "—";
  return packages.find((item) => item.id === packageId)?.name ?? packageId;
}

export function projectStatusLabel(status: string): string {
  if (status === "active") return "Aktiv";
  if (status === "archived") return "Archiviert";
  return status;
}

export function accountAccessLabel(banned: boolean | null | undefined): string {
  return banned ? "Konto gesperrt" : "Zugriff erlaubt";
}

export function setupStatusLabel(emailVerified: boolean | null | undefined): string {
  return emailVerified ? "Einrichtung abgeschlossen" : "Einrichtung ausstehend";
}
