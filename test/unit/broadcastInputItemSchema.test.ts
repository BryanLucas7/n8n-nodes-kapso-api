import { describe, expect, it } from 'vitest';
import { carouselPromoDefinition } from '../fixtures/metaTemplates';
import { buildBroadcastInputItemSchemaLines } from '../../nodes/KapsoApi/actions/broadcastInputItemSchema';
import { fieldIdForButtonSlot } from '../../nodes/KapsoApi/resourceMapping/templateParameters';

describe('broadcastInputItemSchema', () => {
	it('emits carousel button keys that match fieldIdForButtonSlot', () => {
		const card = carouselPromoDefinition.carouselCards[0];
		const slot = card.buttonSlots.find((entry) => entry.dynamicKind);

		expect(slot).toBeDefined();

		const fieldId = fieldIdForButtonSlot(slot!, card.cardIndex);
		const keys = buildBroadcastInputItemSchemaLines(carouselPromoDefinition, 'phone');

		expect(keys).toContain(fieldId);
	});
});
