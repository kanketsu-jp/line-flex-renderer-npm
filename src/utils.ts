export function resolveSize(
	value: string | undefined,
	map: Record<string, string>,
	fallback?: string,
): string | undefined {
	if (!value) return fallback;
	return map[value] ?? value;
}
