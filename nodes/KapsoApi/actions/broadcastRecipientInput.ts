import { ApplicationError, IDataObject, IExecuteFunctions, ResourceMapperValue } from 'n8n-workflow';
import { loadBroadcastTemplateDefinition } from '../loadOptions/broadcastTemplateFetch';
import { TemplateDefinition } from '../loadOptions/templateDefinition';
import { mergeTemplateButtonParameterGroups, type TemplateButtonParameterCollection } from './templateButtonInput';
import type { TemplateCarouselCardInput, TemplateComponentsInput } from './templateComponents';
import { getString, readStringParameterValue } from './nodeHelpers';
import {
	assertHeaderValuesForTemplate,
	assertTemplateStructureSelection,
	bodyParametersForCarouselCard,
	bodyParametersFromMapper,
	buttonParametersFromMapper,
	readResourceMapperRecord,
	resolveButtonParametersFromSources,
	resolveRecipientCarouselBodyMapper,
	resolveTemplateHeaderMediaSource,
} from './templateMapperInput';
import { applyCarouselDefinition } from './templateInput';
import { recipientEntryFromInputItem } from './broadcastInputItemMapper';

type BroadcastRecipientEntry = {
	phoneNumber?: string | IDataObject;
	whatsappContactId?: string;
	recipientBodyParametersMapper?: ResourceMapperValue;
	recipientButtonParametersMapper?: ResourceMapperValue;
	recipientButtonParameters?: TemplateButtonParameterCollection;
	recipientCarouselBodyParametersMapper?: ResourceMapperValue;
	recipientHeaderText?: string;
	recipientHeaderMediaSource?: string;
	recipientHeaderMediaUrl?: string;
	recipientHeaderMediaId?: string;
	recipientHeaderLatitude?: string;
	recipientHeaderLongitude?: string;
	recipientHeaderLocationName?: string;
	recipientHeaderLocationAddress?: string;
	recipientCarouselCards?: {
		cardValues?: Array<{
			cardIndex: number;
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
};

function readRecipientHeaderValues(entry: BroadcastRecipientEntry) {
	const headerMediaUrl = readStringParameterValue(entry.recipientHeaderMediaUrl);
	const headerMediaId = readStringParameterValue(entry.recipientHeaderMediaId);

	return {
		headerText: readStringParameterValue(entry.recipientHeaderText),
		headerMediaSource: resolveTemplateHeaderMediaSource(
			readStringParameterValue(entry.recipientHeaderMediaSource),
			headerMediaUrl,
			headerMediaId,
		),
		headerMediaUrl,
		headerMediaId,
		headerLatitude: readStringParameterValue(entry.recipientHeaderLatitude),
		headerLongitude: readStringParameterValue(entry.recipientHeaderLongitude),
		headerLocationName: readStringParameterValue(entry.recipientHeaderLocationName),
		headerLocationAddress: readStringParameterValue(entry.recipientHeaderLocationAddress),
	};
}

function mapRecipientCarouselCards(
	entry: BroadcastRecipientEntry,
	definition: TemplateDefinition,
): TemplateCarouselCardInput[] {
	const carouselCards = entry.recipientCarouselCards?.cardValues ?? [];
	const carouselBodyMapper =
		definition.componentMode === 'carousel'
			? resolveRecipientCarouselBodyMapper(entry, definition)
			: {};

	return carouselCards.map((card) => {
		const cardDefinition = definition.carouselCards.find(
			(cardEntry) => cardEntry.cardIndex === card.cardIndex,
		);
		const legacyBodyParameters =
			card.cardBodyParameters?.parameterValues ??
			card.cardBodyParameters?.bodyParameterValues ??
			[];
		const bodyParameters =
			cardDefinition && cardDefinition.bodyVariables.length > 0
				? bodyParametersForCarouselCard(carouselBodyMapper, cardDefinition)
				: legacyBodyParameters;

		return {
			cardIndex: card.cardIndex,
			headerMediaSource: readStringParameterValue(card.cardHeaderMediaSource) || 'link',
			headerMediaUrl: readStringParameterValue(card.cardHeaderMediaUrl),
			headerMediaId: readStringParameterValue(card.cardHeaderMediaId),
			bodyParameters,
			buttonParameters: mergeTemplateButtonParameterGroups(card.cardButtonParameters),
		};
	});
}

function buildRecipientComponentsInput(
	entry: BroadcastRecipientEntry,
	definition: TemplateDefinition,
	detectedHeaderFormat: string,
	detectedComponentMode: string,
): TemplateComponentsInput {
	if (entry.recipientComponentsJson?.trim()) {
		return {
			advancedComponentsJson: entry.recipientComponentsJson,
			componentMode: definition.componentMode,
			headerType: definition.headerFormat,
		};
	}

	assertTemplateStructureSelection(definition, detectedHeaderFormat, detectedComponentMode);

	const headerValues = readRecipientHeaderValues(entry);
	assertHeaderValuesForTemplate(definition, headerValues);

	const bodyMapper = readResourceMapperRecord(entry.recipientBodyParametersMapper);
	const buttonMapper = readResourceMapperRecord(entry.recipientButtonParametersMapper);

	const carouselCards = applyCarouselDefinition(
		mapRecipientCarouselCards(entry, definition),
		definition,
	);

	return {
		componentMode: definition.componentMode,
		parameterFormat: definition.parameterFormat,
		headerType: definition.headerFormat,
		headerText: definition.headerTextHasVariable ? entry.recipientHeaderText : undefined,
		headerVariable: definition.headerVariable,
		headerMediaSource: headerValues.headerMediaSource,
		headerMediaUrl: headerValues.headerMediaUrl,
		headerMediaId: headerValues.headerMediaId,
		headerLatitude: headerValues.headerLatitude,
		headerLongitude: headerValues.headerLongitude,
		headerLocationName: headerValues.headerLocationName,
		headerLocationAddress: headerValues.headerLocationAddress,
		bodyParameters: bodyParametersFromMapper(bodyMapper, definition),
		buttonParameters: resolveButtonParametersFromSources(
			mergeTemplateButtonParameterGroups(entry.recipientButtonParameters),
			buttonParametersFromMapper(buttonMapper, definition),
			definition,
		),
		carouselCards,
	};
}

export async function buildBroadcastRecipientComponentsInputs(
	ef: IExecuteFunctions,
	itemIndex: number,
	entries: BroadcastRecipientEntry[],
): Promise<TemplateComponentsInput[]> {
	const definition = await loadBroadcastTemplateDefinition(ef, itemIndex);
	const detectedHeaderFormat = getString(ef, 'broadcastDetectedHeaderFormat', itemIndex);
	const detectedComponentMode = getString(ef, 'broadcastDetectedComponentMode', itemIndex);

	return entries.map((entry) =>
		buildRecipientComponentsInput(entry, definition, detectedHeaderFormat, detectedComponentMode),
	);
}

export async function buildBroadcastRecipientsFromInputItems(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<BroadcastRecipientEntry[]> {
	const definition = await loadBroadcastTemplateDefinition(ef, itemIndex);
	const phoneField = getString(ef, 'broadcastRecipientPhoneField', itemIndex) || 'phone';
	const contactField = getString(ef, 'broadcastRecipientContactIdField', itemIndex);

	const item = ef.getInputData()[itemIndex];
	if (!item) {
		throw new ApplicationError(`Input item ${itemIndex} is missing.`);
	}

	const json = item.json;
	const phone = json[phoneField];
	const contactId = contactField ? json[contactField] : undefined;

	if (
		(phone === undefined || phone === null || String(phone).trim() === '') &&
		(contactId === undefined || contactId === null || String(contactId).trim() === '')
	) {
		throw new ApplicationError(
			`Input item ${itemIndex} is missing a phone number in "${phoneField}" or contact ID${contactField ? ` in "${contactField}"` : ''}.`,
		);
	}

	return [
		{
			...(recipientEntryFromInputItem(json, definition) as BroadcastRecipientEntry),
			phoneNumber:
				phone !== undefined && phone !== null && String(phone).trim() !== ''
					? String(phone).trim()
					: undefined,
			whatsappContactId:
				contactId !== undefined && contactId !== null && String(contactId).trim() !== ''
					? String(contactId).trim()
					: undefined,
		},
	];
}

export type { BroadcastRecipientEntry };
