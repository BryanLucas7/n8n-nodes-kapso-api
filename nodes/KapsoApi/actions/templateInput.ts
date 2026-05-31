import { IExecuteFunctions } from 'n8n-workflow';
import {
	advancedComponentsJson,
	getFixedCollectionItems,
	getString,
} from './nodeHelpers';
import type {
	TemplateButtonParameterInput,
	TemplateCarouselCardInput,
	TemplateComponentsInput,
} from './templateComponents';

export function buildSendTemplateComponentsInput(
	ef: IExecuteFunctions,
	itemIndex: number,
): TemplateComponentsInput {
	const componentMode = getString(ef, 'templateComponentMode', itemIndex) || 'standard';

	const bodyParameters = getFixedCollectionItems<{ parameterName?: string; parameterText: string }>(
		ef,
		'templateBodyParameters',
		'parameterValues',
		itemIndex,
	);

	const buttonParameters = getFixedCollectionItems<TemplateButtonParameterInput>(
		ef,
		'templateButtonParameters',
		'buttonValues',
		itemIndex,
	);

	const carouselCards = getFixedCollectionItems<{
		cardIndex: number;
		cardHeaderType?: string;
		cardHeaderMediaSource?: string;
		cardHeaderMediaUrl?: string;
		cardHeaderMediaId?: string;
		cardBodyParameters?: { parameterValues?: Array<{ parameterName?: string; parameterText: string }> };
		cardButtonParameters?: { buttonValues?: TemplateButtonParameterInput[] };
	}>(ef, 'templateCarouselCards', 'cardValues', itemIndex);

	const mappedCarouselCards: TemplateCarouselCardInput[] = carouselCards.map((card) => ({
		cardIndex: card.cardIndex,
		headerType: card.cardHeaderType || 'image',
		headerMediaSource: card.cardHeaderMediaSource || 'link',
		headerMediaUrl: card.cardHeaderMediaUrl,
		headerMediaId: card.cardHeaderMediaId,
		bodyParameters: card.cardBodyParameters?.parameterValues ?? [],
		buttonParameters: card.cardButtonParameters?.buttonValues ?? [],
	}));

	return {
		advancedComponentsJson: advancedComponentsJson(ef, itemIndex),
		componentMode,
		headerType: getString(ef, 'templateHeaderType', itemIndex),
		headerText: getString(ef, 'templateHeaderText', itemIndex),
		headerMediaSource: getString(ef, 'templateHeaderMediaSource', itemIndex) || 'link',
		headerMediaUrl: getString(ef, 'templateHeaderMediaUrl', itemIndex),
		headerMediaId: getString(ef, 'templateHeaderMediaId', itemIndex),
		headerLatitude: getString(ef, 'templateHeaderLatitude', itemIndex),
		headerLongitude: getString(ef, 'templateHeaderLongitude', itemIndex),
		headerLocationName: getString(ef, 'templateHeaderLocationName', itemIndex),
		headerLocationAddress: getString(ef, 'templateHeaderLocationAddress', itemIndex),
		bodyParameters,
		buttonParameters,
		carouselCards: mappedCarouselCards,
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
		buttonParameters?: { buttonParameterValues?: TemplateButtonParameterInput[] };
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
				cardButtonParameters?: {
					buttonValues?: TemplateButtonParameterInput[];
					buttonParameterValues?: TemplateButtonParameterInput[];
				};
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
		buttonParameters: entry.buttonParameters?.buttonParameterValues,
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
			buttonParameters:
				card.cardButtonParameters?.buttonValues ??
				card.cardButtonParameters?.buttonParameterValues ??
				[],
		})),
	};
}
