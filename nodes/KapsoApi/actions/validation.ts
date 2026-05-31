import { ApplicationError } from 'n8n-workflow';

export function parseCoordinate(value: string | number, label: string): number {
	const parsed = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(parsed)) {
		throw new ApplicationError(`${label} must be a valid number.`);
	}

	return parsed;
}

export function assertInteractiveButtonCount(count: number): void {
	if (count < 1 || count > 3) {
		throw new ApplicationError('Interactive button messages support 1 to 3 buttons.');
	}
}

export function assertInteractiveListShape(sectionCount: number, rowCount: number): void {
	if (sectionCount < 1 || sectionCount > 10) {
		throw new ApplicationError('Interactive list messages support 1 to 10 sections.');
	}

	if (rowCount < 1 || rowCount > 10) {
		throw new ApplicationError('Interactive list messages support 1 to 10 rows in total.');
	}
}

export function assertProductListSectionCount(sectionCount: number): void {
	if (sectionCount < 1 || sectionCount > 10) {
		throw new ApplicationError('Product list messages support 1 to 10 sections.');
	}
}

export const PRODUCT_LIST_MAX_PRODUCTS = 30;

export function assertProductListShape(
	sections: Array<{ productRetailerIds: string[] }>,
): void {
	assertProductListSectionCount(sections.length);

	let totalProducts = 0;

	for (const section of sections) {
		if (section.productRetailerIds.length < 1) {
			throw new ApplicationError('Each product list section must include at least one product.');
		}

		totalProducts += section.productRetailerIds.length;
	}

	if (totalProducts > PRODUCT_LIST_MAX_PRODUCTS) {
		throw new ApplicationError(
			`Product list messages support at most ${PRODUCT_LIST_MAX_PRODUCTS} products in total.`,
		);
	}
}

export function requireNonEmptyString(value: string, label: string): string {
	const trimmed = value.trim();

	if (!trimmed) {
		throw new ApplicationError(`${label} is required.`);
	}

	return trimmed;
}

export function assertCustomRelativePath(value: string): void {
	if (/(^|\/)\.\.($|\/)/.test(value)) {
		throw new ApplicationError('Custom Relative Path must not contain .. path segments.');
	}
}
