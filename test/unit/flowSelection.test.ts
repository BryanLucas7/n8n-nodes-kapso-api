import { describe, expect, it } from 'vitest';
import {
	encodeFlowSelection,
	parseFlowSelection,
	resolveFlowAction,
	resolveFlowCta,
	resolveFlowMessageVersion,
	resolveFlowMode,
	resolveFlowToken,
} from '../../nodes/KapsoApi/loadOptions/flowSelection';

describe('flowSelection', () => {
	it('round-trips encoded flow list values', () => {
		const encoded = encodeFlowSelection({
			kapsoUuid: 'kapso-uuid',
			metaFlowId: '1197715005513101',
			status: 'draft',
			jsonVersion: '3.0',
			hasDataEndpoint: true,
			defaultScreen: 'BOOKING',
			flowName: 'Book appointment',
			singleScreen: false,
			flowsEncryptionConfigured: false,
			previewUrl: 'https://example.com/preview',
		});

		expect(parseFlowSelection(encoded)).toEqual({
			kapsoUuid: 'kapso-uuid',
			metaFlowId: '1197715005513101',
			status: 'draft',
			jsonVersion: '3.0',
			hasDataEndpoint: true,
			defaultScreen: 'BOOKING',
			flowName: 'Book appointment',
			singleScreen: false,
			flowsEncryptionConfigured: false,
			previewUrl: 'https://example.com/preview',
			hasInitialDataFields: false,
		});
	});

	it('auto-applies draft mode for draft flows when mode is default', () => {
		expect(
			resolveFlowMode('', {
				metaFlowId: '1197715005513101',
				status: 'draft',
			}),
		).toBe('draft');
	});

	it('prefers data exchange when the flow has a data endpoint', () => {
		expect(
			resolveFlowAction('', {
				metaFlowId: '1197715005513101',
				hasDataEndpoint: true,
			}),
		).toBe('data_exchange');
	});

	it('uses flow message version 3 regardless of encoded flow json version', () => {
		expect(
			resolveFlowMessageVersion('', {
				metaFlowId: '1197715005513101',
				jsonVersion: '7.2',
			}),
		).toBe('3');
		expect(resolveFlowMessageVersion('4', { metaFlowId: '1197715005513101' })).toBe('4');
	});

	it('defaults flow token to meta flow id when empty', () => {
		expect(resolveFlowToken('', '1197715005513101')).toBe('1197715005513101');
		expect(resolveFlowToken('custom-token', '1197715005513101')).toBe('custom-token');
	});

	it('defaults flow cta from flow name when empty', () => {
		expect(resolveFlowCta('', 'Book now')).toBe('Book now');
		expect(resolveFlowCta('', 'A very long flow name that exceeds twenty chars')).toBe(
			'A very long flow nam',
		);
		expect(resolveFlowCta('Custom CTA', 'Book now')).toBe('Custom CTA');
	});
});
