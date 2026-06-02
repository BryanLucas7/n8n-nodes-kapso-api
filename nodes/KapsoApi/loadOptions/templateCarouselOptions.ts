import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchSelectedTemplateDefinition } from './templateFetch';
import { assertKapsoLoadOptionsReady, requireLoadOptionsDependency } from './helpers';

export async function getTemplateCarouselCardIndices(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'phoneNumberId', 'Phone Number');
	requireLoadOptionsDependency(this, 'templateName', 'Template');

	const definition = await fetchSelectedTemplateDefinition(this, 'phoneNumberId');
	if (!definition || definition.componentMode !== 'carousel' || definition.carouselCards.length === 0) {
		return [{ name: 'No carousel cards detected', value: 0 }];
	}

	return definition.carouselCards.map((card) => ({
		name: `Card ${card.cardIndex} (${card.headerFormat} header, ${card.bodyVariables.length} body variable(s))`,
		value: card.cardIndex,
	}));
}

export async function getTemplateCarouselGuidanceNotice(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'phoneNumberId', 'Phone Number');
	requireLoadOptionsDependency(this, 'templateName', 'Template');

	const definition = await fetchSelectedTemplateDefinition(this, 'phoneNumberId');
	if (!definition || definition.componentMode !== 'carousel') {
		return [{ name: 'Select a carousel template to see card guidance', value: '' }];
	}

	const summary = definition.carouselCards
		.map(
			(card) =>
				`Card ${card.cardIndex}: ${card.headerFormat} header, ${card.bodyVariables.length} body placeholder(s), ${card.buttonSlots.filter((slot) => slot.dynamicKind).length} dynamic button(s)`,
		)
		.join(' · ');

	return [{ name: summary, value: '' }];
}
