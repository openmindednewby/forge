/**
 * Checks if a value is defined (not null and not undefined).
 * Provides a type-safe way to narrow nullable types.
 */
export const isValueDefined = <T>(
  value: T | null | undefined,
  // eslint-disable-next-line no-null-check/no-null-check -- This IS the null-check utility implementation
): value is T => value !== null && value !== undefined;

/**
 * Checks if a value is null or undefined.
 * Inverse of isValueDefined.
 */
export const isNullOrUndefined = (
  value: unknown,
  // eslint-disable-next-line no-null-check/no-null-check -- This IS the null-check utility implementation
): value is null | undefined => value === null || value === undefined;
