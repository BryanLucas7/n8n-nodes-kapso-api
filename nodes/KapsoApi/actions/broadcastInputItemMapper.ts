import { IDataObject } from 'n8n-workflow';
import { TemplateDefinition } from '../loadOptions/templateDefinition';
import {
	carouselBodyFieldPrefix,
	CURRENCY_AMOUNT_SUFFIX,
	CURRENCY_CODE_SUFFIX,
	CURRENCY_FALLBACK_SUFFIX,
	DATE_TIME_FALLBACK_SUFFIX,
	DATE_TIME_VALUE_SUFFIX,
	PARAMETER_TYPE_SUFFIX,
} from '../resourceMapping/templateParameters';
import type { TemplateButtonParameterCollection } from './templateButtonInput';
import type { TemplateCarouselCardInput } from './templateComponents';
import { fieldIdForButtonSlot } from '../resourceMapping/templateParameters';
import { bodyParametersForCarouselCard, resolveTemplateHeaderMediaSource } from './templateMapperInput';

function readJsonString(json: IDataObject, key: string): string | undefined {
	const raw = json[key];
	if (raw === undefined || raw === null || String(raw).trim() === '') {
		return undefined;
	}

	return String(raw).trim();
}

export function bodyMapperFromInputItemJson(
	json: IDataObject,
	definition: TemplateDefinition,
): Record<string, unknown> {
	const mapper: Record<string, unknown> = {};

	for (const variable of definition.bodyVariables) {
		const typeFromJson = readJsonString(json, `${variable.id}${PARAMETER_TYPE_SUFFIX}`);
		const valueType = typeFromJson || variable.valueType;

		if (valueType === 'currency') {
			const code =
				readJsonString(json, `${variable.id}${CURRENCY_CODE_SUFFIX}`) ??
				readJsonString(json, `${variable.id}_currency_code`);
			const amount =
				json[`${variable.id}${CURRENCY_AMOUNT_SUFFIX}`] ??
				json[`${variable.id}_currency_amount`] ??
				json[variable.id];
			const fallback =
				readJsonString(json, `${variable.id}${CURRENCY_FALLBACK_SUFFIX}`) ??
				readJsonString(json, `${variable.id}_currency_fallback`);

			if (code) {
				mapper[`${variable.id}${CURRENCY_CODE_SUFFIX}`] = code;
			}
			if (amount !== undefined && amount !== null && String(amount).trim() !== '') {
				mapper[`${variable.id}${CURRENCY_AMOUNT_SUFFIX}`] = amount;
			}
			if (fallback) {
				mapper[`${variable.id}${CURRENCY_FALLBACK_SUFFIX}`] = fallback;
			}
			mapper[`${variable.id}${PARAMETER_TYPE_SUFFIX}`] = 'currency';
			continue;
		}

		if (valueType === 'date_time') {
			const dateTime =
				json[`${variable.id}${DATE_TIME_VALUE_SUFFIX}`] ??
				json[`${variable.id}_date_time`] ??
				json[variable.id];
			const fallback =
				readJsonString(json, `${variable.id}${DATE_TIME_FALLBACK_SUFFIX}`) ??
				readJsonString(json, `${variable.id}_date_time_fallback`);

			if (dateTime !== undefined && dateTime !== null && String(dateTime).trim() !== '') {
				mapper[`${variable.id}${DATE_TIME_VALUE_SUFFIX}`] = dateTime;
			}
			if (fallback) {
				mapper[`${variable.id}${DATE_TIME_FALLBACK_SUFFIX}`] = fallback;
			}
			mapper[`${variable.id}${PARAMETER_TYPE_SUFFIX}`] = 'date_time';
			continue;
		}

		const candidates = [variable.parameterName, variable.id, variable.displayName].filter(Boolean);
		const rawValue = candidates
			.map((key) => (key ? json[key] : undefined))
			.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

		if (rawValue === undefined) {
			continue;
		}

		mapper[variable.id] = String(rawValue);
		mapper[`${variable.id}${PARAMETER_TYPE_SUFFIX}`] = 'text';
	}

	return mapper;
}

function buttonMapperFromInputItemJson(json: IDataObject, definition: TemplateDefinition): Record<string, unknown> {
	const mapper: Record<string, unknown> = {};

	for (const slot of definition.buttonSlots) {
		if (!slot.dynamicKind) {
			continue;
		}

		let fieldId: string | undefined;
		switch (slot.dynamicKind) {
			case 'url_suffix':
				fieldId = `btn_${slot.index}_url_suffix`;
				break;
			case 'quick_reply_text':
				fieldId = `btn_${slot.index}_quick_reply_text`;
				break;
			case 'quick_reply_payload':
				fieldId = `btn_${slot.index}_quick_reply_payload`;
				break;
			case 'flow':
				fieldId = `btn_${slot.index}_flow_token`;
				break;
			case 'copy_code':
				fieldId = `btn_${slot.index}_copy_code`;
				break;
			case 'catalog_thumbnail':
				fieldId = `btn_${slot.index}_catalog_thumbnail`;
				break;
			case 'mpm':
				fieldId = `btn_${slot.index}_mpm`;
				break;
		}

		if (!fieldId) {
			continue;
		}

		const rawValue = json[fieldId] ?? json[`button_${slot.index}`];
		if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
			mapper[fieldId] = rawValue;
		}
	}

	return mapper;
}

function carouselBodyMapperFromInputItemJson(
	json: IDataObject,
	cardDefinition: TemplateDefinition['carouselCards'][number],
): Record<string, unknown> {
	const prefix = carouselBodyFieldPrefix(cardDefinition.cardIndex);
	const localJson: IDataObject = {};

	for (const [key, value] of Object.entries(json)) {
		if (key.startsWith(prefix)) {
			localJson[key.slice(prefix.length)] = value;
		}
	}

	const localMapper = bodyMapperFromInputItemJson(localJson, {
		name: '',
		language: '',
		parameterFormat: 'positional',
		componentMode: 'carousel',
		headerFormat: 'none',
		headerTextHasVariable: false,
		bodyVariables: cardDefinition.bodyVariables,
		buttonSlots: [],
		carouselCards: [],
	});

	const mapper: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(localMapper)) {
		mapper[`${prefix}${key}`] = value;
	}

	return mapper;
}

function carouselCardsFromInputItemJson(
	json: IDataObject,
	definition: TemplateDefinition,
): TemplateCarouselCardInput[] {
	if (definition.componentMode !== 'carousel') {
		return [];
	}

	return definition.carouselCards.map((cardDefinition) => {
		const carouselBodyMapper = carouselBodyMapperFromInputItemJson(json, cardDefinition);
		const bodyParameters =
			cardDefinition.bodyVariables.length > 0
				? bodyParametersForCarouselCard(carouselBodyMapper, cardDefinition)
				: [];

		const buttonParameters = cardDefinition.buttonSlots
			.filter((slot) => slot.dynamicKind)
			.flatMap((slot) => {
				const fieldId = fieldIdForButtonSlot(slot, cardDefinition.cardIndex);
				const rawValue = fieldId ? json[fieldId] : undefined;
				if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
					return [];
				}

				return [
					{
						templateButtonKind: slot.dynamicKind === 'url_suffix' ? 'url' : slot.dynamicKind,
						buttonIndex: slot.index,
						buttonText: String(rawValue),
					},
				];
			});

		return {
			cardIndex: cardDefinition.cardIndex,
			headerMediaSource: resolveTemplateHeaderMediaSource(
				readJsonString(json, `${carouselBodyFieldPrefix(cardDefinition.cardIndex)}headerMediaSource`),
				readJsonString(json, `${carouselBodyFieldPrefix(cardDefinition.cardIndex)}headerMediaUrl`),
				readJsonString(json, `${carouselBodyFieldPrefix(cardDefinition.cardIndex)}headerMediaId`),
			),
			headerMediaUrl: readJsonString(
				json,
				`${carouselBodyFieldPrefix(cardDefinition.cardIndex)}headerMediaUrl`,
			),
			headerMediaId: readJsonString(
				json,
				`${carouselBodyFieldPrefix(cardDefinition.cardIndex)}headerMediaId`,
			),
			bodyParameters,
			buttonParameters,
		};
	});
}

function recipientCarouselBodyMapperFromInputItemJson(
	json: IDataObject,
	definition: TemplateDefinition,
): Record<string, unknown> {
	return definition.carouselCards.reduce<Record<string, unknown>>((mapper, cardDefinition) => {
		return {
			...mapper,
			...carouselBodyMapperFromInputItemJson(json, cardDefinition),
		};
	}, {});
}

export function recipientEntryFromInputItem(json: IDataObject, definition: TemplateDefinition) {
	const carouselCards = carouselCardsFromInputItemJson(json, definition);

	return {
		recipientBodyParametersMapper: {
			mappingMode: 'defineBelow',
			value: bodyMapperFromInputItemJson(json, definition),
		},
		recipientButtonParametersMapper: {
			mappingMode: 'defineBelow',
			value: buttonMapperFromInputItemJson(json, definition),
		},
		...(definition.componentMode === 'carousel'
			? {
					recipientCarouselBodyParametersMapper: {
						mappingMode: 'defineBelow',
						value: recipientCarouselBodyMapperFromInputItemJson(json, definition),
					},
				}
			: {}),
		recipientHeaderText: readJsonString(json, 'headerText'),
		recipientHeaderMediaSource: resolveTemplateHeaderMediaSource(
			readJsonString(json, 'headerMediaSource'),
			readJsonString(json, 'headerMediaUrl'),
			readJsonString(json, 'headerMediaId'),
		),
		recipientHeaderMediaUrl: readJsonString(json, 'headerMediaUrl'),
		recipientHeaderMediaId: readJsonString(json, 'headerMediaId'),
		recipientHeaderLatitude: readJsonString(json, 'headerLatitude'),
		recipientHeaderLongitude: readJsonString(json, 'headerLongitude'),
		recipientHeaderLocationName: readJsonString(json, 'headerLocationName'),
		recipientHeaderLocationAddress: readJsonString(json, 'headerLocationAddress'),
		...(carouselCards.length > 0
			? {
					recipientCarouselCards: {
						cardValues: carouselCards.map((card) => ({
							cardIndex: card.cardIndex,
							cardHeaderMediaSource: card.headerMediaSource,
							cardHeaderMediaUrl: card.headerMediaUrl,
							cardHeaderMediaId: card.headerMediaId,
							cardButtonParameters: {
								buttonParameterValues: card.buttonParameters,
							} as TemplateButtonParameterCollection,
						})),
					},
				}
			: {}),
	};
}
