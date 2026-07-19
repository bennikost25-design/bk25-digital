export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function externalRel(isExternal: boolean): string | undefined {
  return isExternal ? "noopener noreferrer" : undefined;
}
