import { ApplicationError, IExecuteFunctions, ResourceMapperValue } from 'n8n-workflow';
import { parseJsonValue } from '../transport/json';
import {
	bodyParameterFieldIds,
	carouselBodyFieldPrefix,
	carouselBodyParameterFieldIds,
	CURRENCY_AMOUNT_SUFFIX,
	CURRENCY_CODE_SUFFIX,
	CURRENCY_FALLBACK_SUFFIX,
	DATE_TIME_FALLBACK_SUFFIX,
	DATE_TIME_VALUE_SUFFIX,
	readBodyParameterType,
} from '../resourceMapping/templateParameters';
import { fetchSelectedTemplateDefinition } from '../loadOptions/templateFetch';
import { TemplateDefinition, TemplateCarouselCardDefinition } from '../loadOptions/templateDefinition';
import type { TemplateBodyParameterInput, TemplateButtonParameterInput } from './templateComponents';
import { getString } from './nodeHelpers';
import { mergeTemplateButtonParameterGroups, type TemplateButtonParameterCollection } from './templateButtonInput';
import {
	buttonDynamicKindFromFieldId,
	buttonIndexFromFieldId,
} from '../resourceMapping/templateParameters';

type ResourceMapperRecord = Record<string, unknown>;

export function readResourceMapperRecord(value: unknown): ResourceMapperRecord {
	if (value && typeof value === 'object' && 'value' in value) {
		return ((value as ResourceMapperValue).value ?? {}) as ResourceMapperRecord;
	}

	return (value ?? {}) as ResourceMapperRecord;
}

function readResourceMapperValue(
	ef: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
): ResourceMapperRecord {
	return readResourceMapperRecord(
		ef.getNodeParameter(parameterName, itemIndex, {
			mappingMode: 'defineBelow',
			value: null,
		}),
	);
}

function readMapperString(mapperValue: ResourceMapperRecord, fieldId: string): string {
	const rawValue = mapperValue?.[fieldId];
	return rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();
}

function prefixedFieldId(idPrefix: string, fieldId: string): string {
	return `${idPrefix}${fieldId}`;
}

function bodyParameterFromVariable(
	mapperValue: ResourceMapperRecord,
	variable: TemplateDefinition['bodyVariables'][number],
	options?: {
		idPrefix?: string;
		displayName?: string;
	},
): TemplateBodyParameterInput {
	const idPrefix = options?.idPrefix ?? '';
	const displayName = options?.displayName ?? variable.displayName;
	const valueType = readBodyParameterType(mapperValue, variable, idPrefix);

	if (valueType === 'currency') {
		const code = readMapperString(
			mapperValue,
			prefixedFieldId(idPrefix, `${variable.id}${CURRENCY_CODE_SUFFIX}`),
		);
		const amountRaw = mapperValue?.[prefixedFieldId(idPrefix, `${variable.id}${CURRENCY_AMOUNT_SUFFIX}`)];
		const fallback = readMapperString(
			mapperValue,
			prefixedFieldId(idPrefix, `${variable.id}${CURRENCY_FALLBACK_SUFFIX}`),
		);

		if (!code || amountRaw === null || amountRaw === undefined || amountRaw === '' || !fallback) {
			throw new ApplicationError(`Body parameter "${displayName}" is required for this template.`);
		}

		const amount = Number(amountRaw);
		if (!Number.isFinite(amount)) {
			throw new ApplicationError(`Body parameter "${displayName}" amount must be a number.`);
		}

		return {
			parameterName: variable.parameterName,
			valueType: 'currency',
			currency: {
				code,
				fallback_value: fallback,
				amount_1000: Math.round(amount * 1000),
			},
		};
	}

	if (valueType === 'date_time') {
		const dateTimeRaw = mapperValue?.[prefixedFieldId(idPrefix, `${variable.id}${DATE_TIME_VALUE_SUFFIX}`)];
		const fallback = readMapperString(
			mapperValue,
			prefixedFieldId(idPrefix, `${variable.id}${DATE_TIME_FALLBACK_SUFFIX}`),
		);

		if (!dateTimeRaw || !fallback) {
			throw new ApplicationError(`Body parameter "${displayName}" is required for this template.`);
		}

		const parsedDate = new Date(String(dateTimeRaw));
		if (Number.isNaN(parsedDate.getTime())) {
			throw new ApplicationError(`Body parameter "${displayName}" date/time is invalid.`);
		}

		return {
			parameterName: variable.parameterName,
			valueType: 'date_time',
			dateTime: {
				fallback_value: fallback,
				timestamp: Math.floor(parsedDate.getTime() / 1000),
			},
		};
	}

	const text = readMapperString(mapperValue, prefixedFieldId(idPrefix, variable.id));
	if (!text) {
		throw new ApplicationError(`Body parameter "${displayName}" is required for this template.`);
	}

	return {
		parameterName: variable.parameterName,
		valueType: 'text',
		parameterText: text,
	};
}

export function bodyParametersFromMapper(
	mapperValue: ResourceMapperRecord,
	definition: TemplateDefinition,
): TemplateBodyParameterInput[] {
	const allowedIds = new Set(bodyParameterFieldIds(definition.bodyVariables, mapperValue));
	const parameters: TemplateBodyParameterInput[] = [];

	for (const variable of definition.bodyVariables) {
		parameters.push(bodyParameterFromVariable(mapperValue, variable));
	}

	assertMapperFieldIds(mapperValue, allowedIds);

	return parameters;
}

function assertMapperFieldIds(mapperValue: ResourceMapperRecord, allowedIds: Set<string>): void {
	for (const fieldId of Object.keys(mapperValue)) {
		if (!allowedIds.has(fieldId)) {
			throw new ApplicationError(`Unexpected body parameter "${fieldId}" for the selected template.`);
		}
	}
}

export function bodyParametersForCarouselCard(
	mapperValue: ResourceMapperRecord,
	cardDefinition: TemplateCarouselCardDefinition,
): TemplateBodyParameterInput[] {
	const idPrefix = carouselBodyFieldPrefix(cardDefinition.cardIndex);

	return cardDefinition.bodyVariables.map((variable) =>
		bodyParameterFromVariable(mapperValue, variable, {
			idPrefix,
			displayName: `Card ${cardDefinition.cardIndex} · ${variable.displayName}`,
		}),
	);
}

function validateCarouselBodyMapperKeys(
	mapperValue: ResourceMapperRecord,
	definition: TemplateDefinition,
): void {
	if (definition.componentMode !== 'carousel') {
		return;
	}

	const allowedIds = new Set(carouselBodyParameterFieldIds(definition.carouselCards, mapperValue));

	for (const fieldId of Object.keys(mapperValue)) {
		if (!allowedIds.has(fieldId)) {
			throw new ApplicationError(
				`Unexpected carousel body parameter "${fieldId}" for the selected template.`,
			);
		}
	}
}

export function resolveCarouselBodyParametersForTemplate(
	ef: IExecuteFunctions,
	itemIndex: number,
	definition: TemplateDefinition,
): ResourceMapperRecord {
	const mapperValue = readResourceMapperValue(ef, 'templateCarouselBodyParametersMapper', itemIndex);
	validateCarouselBodyMapperKeys(mapperValue, definition);
	return mapperValue;
}

export function resolveRecipientCarouselBodyMapper(
	entry: { recipientCarouselBodyParametersMapper?: ResourceMapperValue },
	definition: TemplateDefinition,
): ResourceMapperRecord {
	const mapperValue = readResourceMapperRecord(entry.recipientCarouselBodyParametersMapper);
	validateCarouselBodyMapperKeys(mapperValue, definition);
	return mapperValue;
}

function mpmSectionsFromJson(value: unknown, buttonIndex: number) {
	const parsed = parseJsonValue(
		typeof value === 'string' ? value : JSON.stringify(value ?? '[]'),
		`Button ${buttonIndex} MPM sections JSON`,
	);

	if (!Array.isArray(parsed)) {
		throw new ApplicationError(`Button ${buttonIndex} MPM sections JSON must be an array.`);
	}

	return parsed.map((section, sectionIndex) => {
		if (!section || typeof section !== 'object') {
			throw new ApplicationError(`Button ${buttonIndex} MPM section ${sectionIndex} must be an object.`);
		}

		const record = section as Record<string, unknown>;
		const sectionTitle = String(record.title ?? record.sectionTitle ?? '').trim();
		const productItems = Array.isArray(record.product_items)
			? record.product_items
			: Array.isArray(record.productItems)
				? record.productItems
				: [];

		const productRetailerIds = productItems
			.map((item) => {
				if (!item || typeof item !== 'object') {
					return '';
				}

				const record = item as Record<string, unknown>;
				const snakeCaseId = record.product_retailer_id;
				const camelCaseId = record.productRetailerId;
				const retailerId = snakeCaseId ?? camelCaseId ?? '';

				return String(retailerId).trim();
			})
			.filter(Boolean);

		return {
			sectionTitle,
			productRetailerIds,
		};
	});
}

export function buttonParametersFromMapper(
	mapperValue: ResourceMapperRecord,
	definition: TemplateDefinition,
): TemplateButtonParameterInput[] {
	const expectedFieldIds = new Set(
		definition.buttonSlots
			.map((slot) => {
				switch (slot.dynamicKind) {
					case 'url_suffix':
						return `btn_${slot.index}_url_suffix`;
					case 'quick_reply_text':
						return `btn_${slot.index}_quick_reply_text`;
					case 'quick_reply_payload':
						return `btn_${slot.index}_quick_reply_payload`;
					case 'flow':
						return `btn_${slot.index}_flow_token`;
					case 'copy_code':
						return `btn_${slot.index}_copy_code`;
					case 'catalog_thumbnail':
						return `btn_${slot.index}_catalog_thumbnail`;
					case 'mpm':
						return `btn_${slot.index}_mpm`;
					default:
						return undefined;
				}
			})
			.filter((fieldId): fieldId is string => Boolean(fieldId)),
	);

	const buttons: TemplateButtonParameterInput[] = [];

	for (const [fieldId, rawValue] of Object.entries(mapperValue)) {
		if (!expectedFieldIds.has(fieldId)) {
			throw new ApplicationError(`Unexpected button parameter "${fieldId}" for the selected template.`);
		}

		const buttonIndex = buttonIndexFromFieldId(fieldId);
		const dynamicKind = buttonDynamicKindFromFieldId(fieldId);
		const slot = definition.buttonSlots.find((entry) => entry.index === buttonIndex);

		if (buttonIndex === undefined || !dynamicKind || !slot) {
			continue;
		}

		const textValue = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();

		switch (dynamicKind) {
			case 'url_suffix':
				if (!textValue) {
					throw new ApplicationError(`Button ${buttonIndex} URL suffix is required for this template.`);
				}
				buttons.push({
					buttonSubType: 'url',
					buttonIndex,
					buttonText: textValue,
				});
				break;
			case 'quick_reply_text':
				if (!textValue) {
					throw new ApplicationError(`Button ${buttonIndex} quick reply text is required for this template.`);
				}
				buttons.push({
					buttonSubType: 'quick_reply',
					buttonParameterType: 'text',
					buttonIndex,
					buttonText: textValue,
				});
				break;
			case 'quick_reply_payload':
				if (!textValue) {
					throw new ApplicationError(
						`Button ${buttonIndex} quick reply payload is required for this template.`,
					);
				}
				buttons.push({
					buttonSubType: 'quick_reply',
					buttonParameterType: 'payload',
					buttonIndex,
					buttonPayload: textValue,
				});
				break;
			case 'flow':
				if (!textValue) {
					throw new ApplicationError(`Button ${buttonIndex} flow token is required for this template.`);
				}
				buttons.push({
					buttonSubType: 'flow',
					buttonIndex,
					flowToken: textValue,
				});
				break;
			case 'copy_code':
				if (!textValue) {
					throw new ApplicationError(`Button ${buttonIndex} coupon code is required for this template.`);
				}
				buttons.push({
					buttonSubType: 'copy_code',
					buttonIndex,
					buttonText: textValue,
				});
				break;
			case 'catalog_thumbnail':
				buttons.push({
					buttonSubType: 'catalog',
					buttonIndex,
					catalogThumbnailProductRetailerId: textValue,
				});
				break;
			case 'mpm': {
				const mpmSections = mpmSectionsFromJson(rawValue, buttonIndex);
				buttons.push({
					buttonSubType: 'mpm',
					buttonIndex,
					mpmSections,
				});
				break;
			}
		}
	}

	for (const slot of definition.buttonSlots) {
		if (!slot.dynamicKind) {
			continue;
		}

		const fieldId = [...expectedFieldIds].find((candidate) => buttonIndexFromFieldId(candidate) === slot.index);
		const rawValue = fieldId ? mapperValue?.[fieldId] : undefined;
		const isMissing =
			rawValue === undefined ||
			rawValue === null ||
			(typeof rawValue === 'string' && !rawValue.trim() && slot.dynamicKind !== 'catalog_thumbnail');

		if (isMissing && slot.dynamicKind !== 'catalog_thumbnail') {
			throw new ApplicationError(`Button ${slot.index} (${slot.subType}) is missing required send parameters.`);
		}
	}

	return buttons.sort((left, right) => (left.buttonIndex ?? 0) - (right.buttonIndex ?? 0));
}

export function resolveBodyParametersForTemplate(
	ef: IExecuteFunctions,
	itemIndex: number,
	definition: TemplateDefinition,
): TemplateBodyParameterInput[] {
	if (definition.bodyVariables.length === 0) {
		return [];
	}

	return bodyParametersFromMapper(
		readResourceMapperValue(ef, 'templateBodyParametersMapper', itemIndex),
		definition,
	);
}

export function resolveButtonParametersFromSources(
	structuredButtons: TemplateButtonParameterInput[],
	mapperButtons: TemplateButtonParameterInput[],
	definition: TemplateDefinition,
): TemplateButtonParameterInput[] {
	if (structuredButtons.length === 0) {
		return mapperButtons;
	}

	return mergeButtonParameterSources(mapperButtons, structuredButtons, definition);
}

export function resolveButtonParametersForTemplate(
	ef: IExecuteFunctions,
	itemIndex: number,
	definition: TemplateDefinition,
): TemplateButtonParameterInput[] {
	if (!definition.buttonSlots.some((slot) => slot.dynamicKind)) {
		return [];
	}

	const structuredButtons = mergeTemplateButtonParameterGroups(
		ef.getNodeParameter('templateButtonParameters', itemIndex, {}) as TemplateButtonParameterCollection,
	);
	const mapperButtons = buttonParametersFromMapper(
		readResourceMapperValue(ef, 'templateButtonParametersMapper', itemIndex),
		definition,
	);

	return resolveButtonParametersFromSources(structuredButtons, mapperButtons, definition);
}

function mergeButtonParameterSources(
	mapperButtons: TemplateButtonParameterInput[],
	structuredButtons: TemplateButtonParameterInput[],
	definition: TemplateDefinition,
): TemplateButtonParameterInput[] {
	const byIndex = new Map<number, TemplateButtonParameterInput>();

	for (const button of mapperButtons) {
		byIndex.set(button.buttonIndex ?? 0, button);
	}

	for (const button of structuredButtons) {
		byIndex.set(button.buttonIndex ?? 0, button);
	}

	for (const slot of definition.buttonSlots) {
		if (!slot.dynamicKind) {
			continue;
		}

		const button = byIndex.get(slot.index);
		const isMissing =
			!button ||
			(slot.dynamicKind === 'mpm'
				? !button.mpmSections?.length
				: slot.dynamicKind !== 'catalog_thumbnail' &&
					!button.buttonText?.trim() &&
					!button.buttonPayload?.trim() &&
					!button.flowToken?.trim());

		if (isMissing && slot.dynamicKind !== 'catalog_thumbnail') {
			if (slot.dynamicKind === 'mpm') {
				throw new ApplicationError(
					`Button ${slot.index} (MPM) requires structured sections under Button Parameters.`,
				);
			}

			throw new ApplicationError(`Button ${slot.index} (${slot.subType}) is missing required send parameters.`);
		}
	}

	return [...byIndex.values()].sort((left, right) => (left.buttonIndex ?? 0) - (right.buttonIndex ?? 0));
}

export function assertTemplateStructureSelection(
	definition: TemplateDefinition,
	selectedHeaderFormat: string,
	selectedComponentMode: string,
): void {
	if (selectedComponentMode && selectedComponentMode !== definition.componentMode) {
		throw new ApplicationError(
			`Selected component mode "${selectedComponentMode}" does not match the template (${definition.componentMode}). Refresh template options.`,
		);
	}

	if (definition.componentMode === 'carousel') {
		return;
	}

	if (selectedHeaderFormat && selectedHeaderFormat !== definition.headerFormat) {
		throw new ApplicationError(
			`Selected header format "${selectedHeaderFormat}" does not match the template (${definition.headerFormat}). Refresh template options.`,
		);
	}
}

export function assertHeaderValuesForTemplate(
	definition: TemplateDefinition,
	values: {
		headerText?: string;
		headerMediaSource?: string;
		headerMediaUrl?: string;
		headerMediaId?: string;
		headerLatitude?: string;
		headerLongitude?: string;
	},
): void {
	if (definition.componentMode === 'carousel' || definition.headerFormat === 'none') {
		return;
	}

	if (definition.headerFormat === 'text') {
		if (!definition.headerTextHasVariable && values.headerText?.trim()) {
			throw new ApplicationError(
				'This template has a static text header and does not accept a header parameter.',
			);
		}

		if (definition.headerTextHasVariable && !values.headerText?.trim()) {
			throw new ApplicationError('Header text is required for this template.');
		}
		return;
	}

	if (definition.headerFormat === 'location') {
		if (!values.headerLatitude?.trim() || !values.headerLongitude?.trim()) {
			throw new ApplicationError('Header latitude and longitude are required for this template.');
		}
		return;
	}

	if (['image', 'video', 'document'].includes(definition.headerFormat)) {
		const usesId = values.headerMediaSource === 'id';
		const mediaValue = usesId ? values.headerMediaId : values.headerMediaUrl;
		if (!mediaValue?.trim()) {
			throw new ApplicationError(`Header ${definition.headerFormat} media is required for this template.`);
		}
	}
}

export async function loadSendTemplateDefinition(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<TemplateDefinition> {
	const definition = await fetchSelectedTemplateDefinition(ef, 'phoneNumberId', itemIndex);

	if (!definition) {
		throw new ApplicationError(
			'Could not load the selected template definition. Check phone number and template selection.',
		);
	}

	return definition;
}

export function resolveTemplateHeaderMediaSource(
	explicitSource?: string,
	mediaUrl?: string,
	mediaId?: string,
): 'link' | 'id' {
	const source = explicitSource?.trim();
	if (source === 'id' || source === 'link') {
		return source;
	}

	if (mediaId?.trim() && !mediaUrl?.trim()) {
		return 'id';
	}

	return 'link';
}

export function readTemplateHeaderValues(ef: IExecuteFunctions, itemIndex: number) {
	const headerMediaUrl = getString(ef, 'templateHeaderMediaUrl', itemIndex);
	const headerMediaId = getString(ef, 'templateHeaderMediaId', itemIndex);

	return {
		headerText: getString(ef, 'templateHeaderText', itemIndex),
		headerMediaSource: resolveTemplateHeaderMediaSource(
			getString(ef, 'templateHeaderMediaSource', itemIndex),
			headerMediaUrl,
			headerMediaId,
		),
		headerMediaUrl,
		headerMediaId,
		headerDocumentFilename: getString(ef, 'templateHeaderDocumentFilename', itemIndex),
		headerLatitude: getString(ef, 'templateHeaderLatitude', itemIndex),
		headerLongitude: getString(ef, 'templateHeaderLongitude', itemIndex),
		headerLocationName: getString(ef, 'templateHeaderLocationName', itemIndex),
		headerLocationAddress: getString(ef, 'templateHeaderLocationAddress', itemIndex),
	};
}
