/** Appends "(optional)" when a node field is not required. */
export function optionalLabel(displayName: string): string {
	if (/\(optional\)$/i.test(displayName.trim())) {
		return displayName;
	}

	return `${displayName} (optional)`;
}
