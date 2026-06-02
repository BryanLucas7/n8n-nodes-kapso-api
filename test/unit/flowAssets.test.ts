import { describe, expect, it } from 'vitest';
import {
	extractDefaultScreen,
	extractScreenDataSchema,
	extractScreenIds,
} from '../../nodes/KapsoApi/loadOptions/flowAssets';

const sampleFlowJson = {
	version: '7.0',
	routing_model: {
		BOOKING: ['CONFIRM'],
		CONFIRM: [],
	},
	screens: [
		{
			id: 'BOOKING',
			data: {
				available_dates: {
					type: 'array',
					__example__: ['2024-01-15', '2024-01-16'],
				},
				customer_name: {
					type: 'string',
					__example__: 'Jessica',
				},
			},
		},
		{
			id: 'CONFIRM',
			data: {},
		},
	],
};

describe('flowAssets', () => {
	it('extracts screen ids and default screen from routing model', () => {
		expect(extractScreenIds(sampleFlowJson)).toEqual(['BOOKING', 'CONFIRM']);
		expect(extractDefaultScreen(sampleFlowJson)).toBe('BOOKING');
	});

	it('extracts initial data schema keys for a screen', () => {
		expect(extractScreenDataSchema(sampleFlowJson, 'BOOKING')).toEqual([
			{
				key: 'available_dates',
				type: 'array',
				example: ['2024-01-15', '2024-01-16'],
			},
			{
				key: 'customer_name',
				type: 'string',
				example: 'Jessica',
			},
		]);
	});

	it('returns an empty schema when the screen has no data block', () => {
		expect(extractScreenDataSchema(sampleFlowJson, 'CONFIRM')).toEqual([]);
	});
});
