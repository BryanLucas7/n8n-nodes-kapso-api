import { TemplateDefinition } from '../loadOptions/templateDefinition';
import {
	bodyVariableInputKeys,
	fieldIdForButtonSlot,
} from '../resourceMapping/templateParameters';

export function buildBroadcastInputItemSchemaLines(
	definition: TemplateDefinition,
	phoneField: string,
	contactField?: string,
): string[] {
	const keys = [phoneField];
	if (contactField?.trim()) {
		keys.push(contactField.trim());
	}

	if (definition.componentMode === 'carousel') {
		for (const card of definition.carouselCards) {
			keys.push(
				`card_${card.cardIndex}_headerMediaSource`,
				`card_${card.cardIndex}_headerMediaUrl`,
				`card_${card.cardIndex}_headerMediaId`,
			);
			for (const variable of card.bodyVariables) {
				keys.push(...bodyVariableInputKeys(variable, card.cardIndex));
			}
			for (const slot of card.buttonSlots) {
				const fieldId = fieldIdForButtonSlot(slot, card.cardIndex);
				if (fieldId) {
					keys.push(fieldId);
				}
			}
		}
		return keys;
	}

	if (definition.headerFormat === 'text' && definition.headerTextHasVariable) {
		keys.push('headerText');
	}

	if (['image', 'video', 'document'].includes(definition.headerFormat)) {
		keys.push('headerMediaSource', 'headerMediaUrl', 'headerMediaId');
	}

	if (definition.headerFormat === 'location') {
		keys.push('headerLatitude', 'headerLongitude', 'headerLocationName', 'headerLocationAddress');
	}

	for (const variable of definition.bodyVariables) {
		keys.push(...bodyVariableInputKeys(variable));
	}

	for (const slot of definition.buttonSlots) {
		const fieldId = fieldIdForButtonSlot(slot);
		if (fieldId) {
			keys.push(fieldId);
		}
	}

	return keys;
}

export { fieldIdForButtonSlot };
