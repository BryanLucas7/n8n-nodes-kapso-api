import { describe, expect, it } from 'vitest';
import { SEND_AND_WAIT_OPERATION } from 'n8n-workflow';
import { KapsoApi } from '../../nodes/KapsoApi/KapsoApi.node';
import {
	buildKapsoSendAndWaitTextBody,
	buildSendAndWaitMessagePayload,
	resolveSendAndWaitDeliveryMode,
} from '../../nodes/KapsoApi/sendAndWait/message';
import type { SendAndWaitConfig } from '../../nodes/KapsoApi/sendAndWait/utils';

describe('Kapso send and wait', () => {
	it('registers send and wait on the node description', () => {
		const node = new KapsoApi();
		const operations = node.description.properties
			.filter((property) => property.name === 'operation' && property.displayOptions?.show?.resource?.includes('message'))
			.flatMap((property) => property.options ?? [])
			.map((option) => String(option.value));

		expect(operations).toContain(SEND_AND_WAIT_OPERATION);
		expect(node.description.webhooks?.length).toBeGreaterThan(0);
		expect(node.customOperations?.message?.[SEND_AND_WAIT_OPERATION]).toBeTypeOf('function');
		expect(node.description.properties.some((property) => property.name === 'sendAndWaitDeliveryMode')).toBe(
			true,
		);
		expect(node.description.properties.some((property) => property.name === 'subject')).toBe(false);
	});

	it('builds approval links without attribution by default', () => {
		const config: SendAndWaitConfig = {
			message: 'Please review this request.',
			options: [
				{ label: '✗ Decline', url: 'https://n8n.example/resume?approved=false' },
				{ label: '✓ Approve', url: 'https://n8n.example/resume?approved=true' },
			],
		};

		const body = buildKapsoSendAndWaitTextBody(config, 'instance-123');

		expect(body).toContain('Please review this request.');
		expect(body).toContain('*✗ Decline:*');
		expect(body).toContain('https://n8n.example/resume?approved=false');
		expect(body).toContain('*✓ Approve:*');
		expect(body).not.toContain('n8n.io/?utm_source=n8n-internal');
	});

	it('includes n8n attribution when explicitly enabled', () => {
		const config: SendAndWaitConfig = {
			message: 'Please review this request.',
			appendAttribution: true,
			options: [{ label: '✓ Approve', url: 'https://n8n.example/resume?approved=true' }],
		};

		const body = buildKapsoSendAndWaitTextBody(config, 'instance-123');

		expect(body).toContain('https://n8n.io/?utm_source=n8n-internal');
		expect(body).toContain('instance-123');
	});

	it('falls back to text links for double approval even when CTA is requested', () => {
		expect(resolveSendAndWaitDeliveryMode('ctaButton', 'double')).toBe('textLinks');
		expect(resolveSendAndWaitDeliveryMode('ctaButton', 'single')).toBe('ctaButton');
	});

	it('builds a CTA URL payload for single approval session delivery', () => {
		const payload = buildSendAndWaitMessagePayload(
			'15551234567',
			{
				message: 'Tap to approve',
				options: [{ label: '✓ Approve', url: 'https://n8n.example/resume?approved=true' }],
			},
			'ctaButton',
			'instance-123',
		);

		expect(payload.type).toBe('interactive');
		expect((payload.interactive as { type?: string }).type).toBe('cta_url');
	});
});
