import { describe, expect, it } from 'vitest';
import { readFlowInitialData } from '../../nodes/KapsoApi/actions/flowMapperInput';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

describe('flowMapperInput', () => {
	it('builds initial data object from the resource mapper', () => {
		const data = readFlowInitialData(
			createMockExecuteFunctions({
				flowInitialDataMapper: {
					mappingMode: 'defineBelow',
					value: {
						customer_name: 'Jessica',
						available_dates: '["2024-01-15"]',
					},
				},
			}),
			0,
		);

		expect(data).toEqual({
			customer_name: 'Jessica',
			available_dates: ['2024-01-15'],
		});
	});

	it('returns undefined when the mapper is empty', () => {
		expect(
			readFlowInitialData(
				createMockExecuteFunctions({
					flowInitialDataMapper: {
						mappingMode: 'defineBelow',
						value: null,
					},
				}),
				0,
			),
		).toBeUndefined();
	});
});
