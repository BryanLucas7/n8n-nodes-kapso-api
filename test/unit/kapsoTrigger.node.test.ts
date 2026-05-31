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
});
