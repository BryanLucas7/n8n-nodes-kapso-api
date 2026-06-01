import { ApplicationError, IExecuteFunctions } from 'n8n-workflow';
import {
	advancedComponentsJson,
	getFixedCollectionItems,
	getString,
} from './nodeHelpers';
import { mergeTemplateButtonParameterGroups, type TemplateButtonParameterCollection } from './templateButtonInput';
import type {
	TemplateCarouselCardInput,
	TemplateComponentsInput,
} from './templateComponents';
import {
	assertHeaderValuesForTemplate,
	assertTemplateStructureSelection,
	loadSendTemplateDefinition,
	readTemplateHeaderValues,
	resolveBodyParametersForTemplate,
	resolveButtonParametersForTemplate,
} from './templateMapperInput';

function mapCarouselCards(
	ef: IExecuteFunctions,
	itemIndex: number,
): TemplateCarouselCardInput[] {
	const carouselCards = getFixedCollectionItems<{
		cardIndex: number;
		cardHeaderMediaSource?: string;
		cardHeaderMediaUrl?: string;
		cardHeaderMediaId?: string;
		cardBodyParameters?: { parameterValues?: Array<{ parameterName?: string; parameterText: string }> };
		cardButtonParameters?: TemplateButtonParameterCollection;
	}>(ef, 'templateCarouselCards', 'cardValues', itemIndex);

	return carouselCards.map((card) => ({
		cardIndex: card.cardIndex,
		headerMediaSource: card.cardHeaderMediaSource || 'link',
		headerMediaUrl: card.cardHeaderMediaUrl,
		headerMediaId: card.cardHeaderMediaId,
		bodyParameters: card.cardBodyParameters?.parameterValues ?? [],
		buttonParameters: mergeTemplateButtonParameterGroups(card.cardButtonParameters),
	}));
}

function applyCarouselDefinition(
	cards: TemplateCarouselCardInput[],
	definition: Awaited<ReturnType<typeof loadSendTemplateDefinition>>,
): TemplateCarouselCardInput[] {
	if (definition.componentMode !== 'carousel') {
		return cards;
	}

	if (cards.length !== definition.carouselCards.length) {
		throw new ApplicationError(
			`This template requires ${definition.carouselCards.length} carousel card(s), but ${cards.length} were provided.`,
		);
	}

	return cards.map((card) => {
		const cardDefinition = definition.carouselCards.find((entry) => entry.cardIndex === card.cardIndex);

		if (!cardDefinition) {
			throw new ApplicationError(`Carousel card index ${card.cardIndex} is not defined in the selected template.`);
		}

		return {
			...card,
			headerType: cardDefinition.headerFormat,
		};
	});
}

export async function buildSendTemplateComponentsInput(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<TemplateComponentsInput> {
	const definition = await loadSendTemplateDefinition(ef, itemIndex);
	const selectedHeaderFormat = getString(ef, 'templateDetectedHeaderFormat', itemIndex);
	const selectedComponentMode = getString(ef, 'templateDetectedComponentMode', itemIndex);

	assertTemplateStructureSelection(definition, selectedHeaderFormat, selectedComponentMode);

	const headerValues = readTemplateHeaderValues(ef, itemIndex);
	assertHeaderValuesForTemplate(definition, headerValues);

	const carouselCards = applyCarouselDefinition(mapCarouselCards(ef, itemIndex), definition);

	return {
		advancedComponentsJson: advancedComponentsJson(ef, itemIndex),
		componentMode: definition.componentMode,
		headerType: definition.headerFormat,
		headerText: headerValues.headerText,
		headerMediaSource: headerValues.headerMediaSource,
		headerMediaUrl: headerValues.headerMediaUrl,
		headerMediaId: headerValues.headerMediaId,
		headerLatitude: headerValues.headerLatitude,
		headerLongitude: headerValues.headerLongitude,
		headerLocationName: headerValues.headerLocationName,
		headerLocationAddress: headerValues.headerLocationAddress,
		bodyParameters: resolveBodyParametersForTemplate(ef, itemIndex, definition),
		buttonParameters: resolveButtonParametersForTemplate(ef, itemIndex, definition),
		carouselCards,
	};
}

export function buildRecipientTemplateComponentsInput(
	entry: {
		headerType?: string;
		headerText?: string;
		headerMediaSource?: string;
		headerMediaUrl?: string;
		headerMediaId?: string;
		headerLatitude?: string;
		headerLongitude?: string;
		headerLocationName?: string;
		headerLocationAddress?: string;
		componentMode?: string;
		bodyParameters?: { bodyParameterValues?: Array<{ parameterName?: string; parameterText: string }> };
		buttonParameters?: TemplateButtonParameterCollection;
		carouselCards?: {
			cardValues?: Array<{
				cardIndex: number;
				cardHeaderType?: string;
				cardHeaderMediaSource?: string;
				cardHeaderMediaUrl?: string;
				cardHeaderMediaId?: string;
				cardBodyParameters?: {
					parameterValues?: Array<{ parameterName?: string; parameterText: string }>;
					bodyParameterValues?: Array<{ parameterName?: string; parameterText: string }>;
				};
				cardButtonParameters?: TemplateButtonParameterCollection;
			}>;
		};
		recipientComponentsJson?: string;
	},
): TemplateComponentsInput {
	const carouselCards = entry.carouselCards?.cardValues ?? [];

	return {
		advancedComponentsJson: entry.recipientComponentsJson,
		componentMode: entry.componentMode || 'standard',
		headerType: entry.headerType,
		headerText: entry.headerText,
		headerMediaSource: entry.headerMediaSource || 'link',
		headerMediaUrl: entry.headerMediaUrl,
		headerMediaId: entry.headerMediaId,
		headerLatitude: entry.headerLatitude,
		headerLongitude: entry.headerLongitude,
		headerLocationName: entry.headerLocationName,
		headerLocationAddress: entry.headerLocationAddress,
		bodyParameters: entry.bodyParameters?.bodyParameterValues,
		buttonParameters: mergeTemplateButtonParameterGroups(entry.buttonParameters),
		carouselCards: carouselCards.map((card) => ({
			cardIndex: card.cardIndex,
			headerType: card.cardHeaderType || 'image',
			headerMediaSource: card.cardHeaderMediaSource || 'link',
			headerMediaUrl: card.cardHeaderMediaUrl,
			headerMediaId: card.cardHeaderMediaId,
			bodyParameters:
				card.cardBodyParameters?.parameterValues ??
				card.cardBodyParameters?.bodyParameterValues ??
				[],
			buttonParameters: mergeTemplateButtonParameterGroups(card.cardButtonParameters),
		})),
	};
}
