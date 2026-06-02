import { ILoadOptionsFunctions, ResourceMapperField, ResourceMapperFields } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from '../loadOptions/helpers';
import { fetchBroadcastTemplateDefinitionForLoadOptions } from '../loadOptions/broadcastTemplateFetch';
import {
	TemplateBodyVariable,
	TemplateBodyValueType,
} from '../loadOptions/templateDefinition';
import {
	BODY_MAPPER_EMPTY_NOTICE,
	BUTTON_MAPPER_EMPTY_NOTICE,
	bodyParameterFieldIds,
	bodyVariableToFields,
	bodyVariableToFieldsForCarouselCard,
	buttonFieldForSlot,
	CAROUSEL_BODY_MAPPER_EMPTY_NOTICE,
	readBodyParameterType,
	readCarouselBodyParameterType,
} from './templateParameters';

function readCurrentRecipientBodyMapperValue(context: ILoadOptionsFunctions): Record<string, unknown> {
	const mapper = context.getCurrentNodeParameter('recipientBodyParametersMapper') as
		| { value?: Record<string, unknown> | null }
		| undefined;

	return (mapper?.value ?? {}) as Record<string, unknown>;
}

function readCurrentRecipientCarouselBodyMapperValue(context: ILoadOptionsFunctions): Record<string, unknown> {
	const mapper = context.getCurrentNodeParameter('recipientCarouselBodyParametersMapper') as
		| { value?: Record<string, unknown> | null }
		| undefined;

	return (mapper?.value ?? {}) as Record<string, unknown>;
}

async function loadBroadcastTemplateDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'broadcastId', 'a broadcast');

	return fetchBroadcastTemplateDefinitionForLoadOptions(context);
}

export async function getBroadcastRecipientBodyParameterFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const definition = await loadBroadcastTemplateDefinition(this);

	if (!definition || definition.componentMode === 'carousel') {
		return {
			fields: [],
			emptyFieldsNotice: BODY_MAPPER_EMPTY_NOTICE,
		};
	}

	if (definition.bodyVariables.length === 0) {
		return {
			fields: [],
			emptyFieldsNotice: BODY_MAPPER_EMPTY_NOTICE,
		};
	}

	return {
		fields: definition.bodyVariables.flatMap((variable: TemplateBodyVariable) => {
			const mapperValue = readCurrentRecipientBodyMapperValue(this);
			const selectedType: TemplateBodyValueType = readBodyParameterType(mapperValue, variable);
			return bodyVariableToFields(variable, selectedType);
		}),
	};
}

export async function getBroadcastRecipientButtonParameterFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const definition = await loadBroadcastTemplateDefinition(this);

	if (!definition || definition.componentMode === 'carousel') {
		return {
			fields: [],
			emptyFieldsNotice: BUTTON_MAPPER_EMPTY_NOTICE,
		};
	}

	const fields = definition.buttonSlots
		.map((slot) => buttonFieldForSlot(slot))
		.filter((field): field is ResourceMapperField => Boolean(field));

	if (fields.length === 0) {
		return {
			fields: [],
			emptyFieldsNotice: BUTTON_MAPPER_EMPTY_NOTICE,
		};
	}

	return { fields };
}

export async function getBroadcastRecipientCarouselBodyParameterFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const definition = await loadBroadcastTemplateDefinition(this);

	if (!definition || definition.componentMode !== 'carousel') {
		return {
			fields: [],
			emptyFieldsNotice: CAROUSEL_BODY_MAPPER_EMPTY_NOTICE,
		};
	}

	const hasBodyVariables = definition.carouselCards.some((card) => card.bodyVariables.length > 0);
	if (!hasBodyVariables) {
		return {
			fields: [],
			emptyFieldsNotice: CAROUSEL_BODY_MAPPER_EMPTY_NOTICE,
		};
	}

	const mapperValue = readCurrentRecipientCarouselBodyMapperValue(this);

	return {
		fields: definition.carouselCards.flatMap((card) =>
			card.bodyVariables.flatMap((variable) => {
				const selectedType = readCarouselBodyParameterType(mapperValue, card.cardIndex, variable);
				return bodyVariableToFieldsForCarouselCard(card.cardIndex, variable, selectedType);
			}),
		),
	};
}

export { bodyParameterFieldIds };
