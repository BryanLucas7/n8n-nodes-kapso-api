import { describe, expect, it } from 'vitest';
import { KapsoTrigger } from '../../nodes/KapsoApi/KapsoTrigger.node';
import { KAPSO_WEBHOOK_EVENTS } from '../../nodes/KapsoApi/trigger/events';

describe('KapsoTrigger node', () => {
	it('exposes multi-output webhook configuration', () => {
		const node = new KapsoTrigger();

		expect(node.description.outputs).toHaveLength(KAPSO_WEBHOOK_EVENTS.length);
		expect(node.description.outputNames).toHaveLength(KAPSO_WEBHOOK_EVENTS.length);
		expect(node.description.credentials).toEqual([{ name: 'kapsoApi', required: true }]);
		expect(node.webhook).toBeTypeOf('function');
		expect(node.description.webhooks?.[0]?.path).toBe('kapso');
	});

	it('shows setup and event notices similar to WAHA trigger UX', () => {
		const node = new KapsoTrigger();
		const notices = node.description.properties?.filter((property) => property.type === 'notice') ?? [];

		expect(notices).toHaveLength(2);
		expect(notices[0]?.name).toBe('kapsoSetupNotice');
		expect(String(notices[0]?.displayName)).toContain('API &amp; Webhooks');
		expect(String(notices[0]?.displayName)).toContain('Kapso dashboard');
		expect(String(notices[0]?.displayName)).toContain('webhook documentation');
		expect(String(notices[0]?.displayName)).toContain('<a href="');
		expect(notices[1]?.name).toBe('kapsoEventsNotice');
		expect(String(notices[1]?.displayName)).toContain('Message Received');
	});

	it('exposes documentationUrl for the node panel docs link', () => {
		const node = new KapsoTrigger();

		expect(node.description.documentationUrl).toBe(
			'https://docs.kapso.ai/docs/platform/webhooks/overview',
		);
	});
});
