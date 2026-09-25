/** 任意の部分木の中で、uri が lockedUris に一致するオブジェクトの数。 */
export function countLockedUris(
	value: unknown,
	lockedUris: readonly string[] | undefined,
): number {
	if (!lockedUris?.length || value === null || typeof value !== "object") {
		return 0;
	}
	if (Array.isArray(value)) {
		return value.reduce(
			(sum, child) => sum + countLockedUris(child, lockedUris),
			0,
		);
	}
	const object = value as Record<string, unknown>;
	const ownCount =
		typeof object.uri === "string" && lockedUris.includes(object.uri) ? 1 : 0;
	return Object.values(object).reduce<number>(
		(sum, child) => sum + countLockedUris(child, lockedUris),
		ownCount,
	);
}

/** 部分木に locked な URI が 1 つでも在るか。 */
export function containsLockedUri(
	value: unknown,
	lockedUris: readonly string[] | undefined,
): boolean {
	return countLockedUris(value, lockedUris) > 0;
}
