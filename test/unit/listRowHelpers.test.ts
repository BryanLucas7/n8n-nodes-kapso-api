import { describe, expect, it } from 'vitest';
import { extractListRows } from '../../nodes/KapsoApi/actions/listRowHelpers';

const rl = (value: string) => ({ mode: 'text', value });

describe('listRowHelpers', () => {
	it('normalizes legacy row strings', () => {
		expect(
			extractListRows({
				row: [{ rowId: 'legacy-id', rowTitle: 'Legacy', rowDescription: 'Old shape' }],
			}),
		).toEqual([
			{ rowId: 'legacy-id', rowTitle: 'Legacy', rowDescription: 'Old shape' },
		]);
	});

	it('normalizes Resource Locator row values', () => {
		expect(
			extractListRows({
				row: [
					{
						rowId: rl('rl-id'),
						rowTitle: rl('Resource Locator'),
						rowDescription: rl('New shape'),
					},
				],
			}),
		).toEqual([
			{ rowId: 'rl-id', rowTitle: 'Resource Locator', rowDescription: 'New shape' },
		]);
	});
});
