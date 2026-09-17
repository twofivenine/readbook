export const clsx = (...xs: Array<string | false | null | undefined>): string => xs.filter(Boolean).join(" ");
