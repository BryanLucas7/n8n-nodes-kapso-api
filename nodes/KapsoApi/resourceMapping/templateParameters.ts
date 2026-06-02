import { ILoadOptionsFunctions, ResourceMapperField, ResourceMapperFields } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from '../loadOptions/helpers';
import { fetchSelectedTemplateDefinition } from '../loadOptions/templateFetch';
import {
	TemplateBodyVariable,
	TemplateBodyValueType,
	TemplateButtonDynamicKind,
	TemplateButtonSlot,
	TemplateCarouselCardDefinition,
} from '../loadOptions/templateDefinition';
import {
	parseCurrencyExample,
	parseDateTimeExample,
} from '../loadOptions/templateBodyParameterUtils';
import { isoCurrencyOptions } from './currencyOptions';

export const BODY_MAPPER_EMPTY_NOTICE =
	'This template has no body text variables, or layout is carousel (use Carousel Body Parameters instead)';
export const CAROUSEL_BODY_MAPPER_EMPTY_NOTICE =
	'This template has no carousel card body variables, or layout is standard (use Body Text Parameters instead)';
export const BUTTON_MAPPER_EMPTY_NOTICE = 'This template has no dynamic button parameters';

export function carouselBodyFieldPrefix(cardIndex: number): string {
	return `card_${cardIndex}_`;
}

export const PARAMETER_TYPE_SUFFIX = '__parameter_type';
export const CURRENCY_CODE_SUFFIX = '__currency_code';
export const CURRENCY_AMOUNT_SUFFIX = '__currency_amount';
export const CURRENCY_FALLBACK_SUFFIX = '__currency_fallback';
export const DATE_TIME_VALUE_SUFFIX = '__date_time';
export const DATE_TIME_FALLBACK_SUFFIX = '__date_time_fallback';

const PARAMETER_TYPE_OPTIONS = [
	{ name: 'Text', value: 'text' },
	{ name: 'Currency', value: 'currency' },
	{ name: 'Date & Time', value: 'date_time' },
];

function prefixedFieldId(idPrefix: string, fieldId: string): string {
	return `${idPrefix}${fieldId}`;
}

function carouselFieldDisplayName(cardIndex: number, variableDisplayName: string): string {
	return `Card ${cardIndex} · ${variableDisplayName}`;
}

function parameterTypeField(
	variable: TemplateBodyVariable,
	idPrefix = '',
	displayNamePrefix?: string,
): ResourceMapperField {
	const label = displayNamePrefix ?? variable.displayName;
	return {
		id: prefixedFieldId(idPrefix, `${variable.id}${PARAMETER_TYPE_SUFFIX}`),
		displayName: `${label} · Type`,
		required: true,
		defaultMatch: false,
		display: true,
		type: 'options',
		options: PARAMETER_TYPE_OPTIONS,
		defaultValue: variable.valueType,
	};
}

function textValueField(
	variable: TemplateBodyVariable,
	idPrefix = '',
	displayNamePrefix?: string,
): ResourceMapperField {
	const defaultValue =
		variable.valueType === 'text' ? variable.exampleValue ?? '' : undefined;
	const label = displayNamePrefix ?? variable.displayName;

	return {
		id: prefixedFieldId(idPrefix, variable.id),
		displayName: `${label} · Text`,
		required: true,
		defaultMatch: false,
		display: true,
		type: 'string',
		defaultValue,
	};
}

function currencyFields(
	variable: TemplateBodyVariable,
	idPrefix = '',
	displayNamePrefix?: string,
): ResourceMapperField[] {
	const parsed = variable.exampleValue ? parseCurrencyExample(variable.exampleValue) : undefined;
	const label = displayNamePrefix ?? variable.displayName;

	return [
		{
			id: prefixedFieldId(idPrefix, `${variable.id}${CURRENCY_CODE_SUFFIX}`),
			displayName: `${label} · Currency Code`,
			required: true,
			defaultMatch: false,
			display: true,
			type: 'options',
			options: isoCurrencyOptions(),
			defaultValue: parsed?.code ?? 'USD',
		},
		{
			id: prefixedFieldId(idPrefix, `${variable.id}${CURRENCY_AMOUNT_SUFFIX}`),
			displayName: `${label} · Amount`,
			required: true,
			defaultMatch: false,
			display: true,
			type: 'number',
			defaultValue: parsed?.amount,
		},
		{
			id: prefixedFieldId(idPrefix, `${variable.id}${CURRENCY_FALLBACK_SUFFIX}`),
			displayName: `${label} · Fallback Text`,
			required: true,
			defaultMatch: false,
			display: true,
			type: 'string',
			defaultValue: parsed?.fallback ?? variable.exampleValue ?? '',
		},
	];
}

function dateTimeFields(
	variable: TemplateBodyVariable,
	idPrefix = '',
	displayNamePrefix?: string,
): ResourceMapperField[] {
	const parsed = variable.exampleValue ? parseDateTimeExample(variable.exampleValue) : undefined;
	const label = displayNamePrefix ?? variable.displayName;

	return [
		{
			id: prefixedFieldId(idPrefix, `${variable.id}${DATE_TIME_VALUE_SUFFIX}`),
			displayName: `${label} · Date & Time`,
			required: true,
			defaultMatch: false,
			display: true,
			type: 'dateTime',
			defaultValue: parsed?.iso,
		},
		{
			id: prefixedFieldId(idPrefix, `${variable.id}${DATE_TIME_FALLBACK_SUFFIX}`),
			displayName: `${label} · Fallback Text`,
			required: true,
			defaultMatch: false,
			display: true,
			type: 'string',
			defaultValue: parsed?.fallback ?? variable.exampleValue ?? '',
		},
	];
}

function valueFieldsForType(
	variable: TemplateBodyVariable,
	valueType: TemplateBodyValueType,
	idPrefix = '',
	displayNamePrefix?: string,
): ResourceMapperField[] {
	switch (valueType) {
		case 'currency':
			return currencyFields(variable, idPrefix, displayNamePrefix);
		case 'date_time':
			return dateTimeFields(variable, idPrefix, displayNamePrefix);
		default:
			return [textValueField(variable, idPrefix, displayNamePrefix)];
	}
}

export function bodyVariableToFields(
	variable: TemplateBodyVariable,
	selectedType: TemplateBodyValueType = variable.valueType,
	idPrefix = '',
	displayNamePrefix?: string,
): ResourceMapperField[] {
	return [
		parameterTypeField(variable, idPrefix, displayNamePrefix),
		...valueFieldsForType(variable, selectedType, idPrefix, displayNamePrefix),
	];
}

export function bodyVariableToFieldsForCarouselCard(
	cardIndex: number,
	variable: TemplateBodyVariable,
	selectedType: TemplateBodyValueType = variable.valueType,
): ResourceMapperField[] {
	const idPrefix = carouselBodyFieldPrefix(cardIndex);
	return bodyVariableToFields(
		variable,
		selectedType,
		idPrefix,
		carouselFieldDisplayName(cardIndex, variable.displayName),
	);
}

export function readCarouselBodyParameterType(
	mapperValue: Record<string, unknown>,
	cardIndex: number,
	variable: TemplateBodyVariable,
): TemplateBodyValueType {
	return readBodyParameterType(mapperValue, variable, carouselBodyFieldPrefix(cardIndex));
}

export function carouselBodyParameterFieldIds(
	carouselCards: TemplateCarouselCardDefinition[],
	mapperValue?: Record<string, unknown>,
): string[] {
	return carouselCards.flatMap((card) =>
		bodyParameterFieldIds(card.bodyVariables, mapperValue, carouselBodyFieldPrefix(card.cardIndex)),
	);
}

export function bodyParameterFieldIds(
	definitionBodyVariables: TemplateBodyVariable[],
	mapperValue?: Record<string, unknown>,
	idPrefix = '',
): string[] {
	return definitionBodyVariables.flatMap((variable) => {
		const selectedType = mapperValue
			? readBodyParameterType(mapperValue, variable, idPrefix)
			: variable.valueType;
		return bodyVariableToFields(variable, selectedType, idPrefix).map((field) => field.id);
	});
}

function readCurrentBodyMapperValue(context: ILoadOptionsFunctions): Record<string, unknown> {
	const mapper = context.getCurrentNodeParameter('templateBodyParametersMapper') as
		| { value?: Record<string, unknown> | null }
		| undefined;

	return (mapper?.value ?? {}) as Record<string, unknown>;
}

function readCurrentCarouselBodyMapperValue(
	context: ILoadOptionsFunctions,
	parameterName: string,
): Record<string, unknown> {
	const mapper = context.getCurrentNodeParameter(parameterName) as
		| { value?: Record<string, unknown> | null }
		| undefined;

	return (mapper?.value ?? {}) as Record<string, unknown>;
}

export function readBodyParameterType(
	mapperValue: Record<string, unknown>,
	variable: TemplateBodyVariable,
	idPrefix = '',
): TemplateBodyValueType {
	const rawType = mapperValue?.[prefixedFieldId(idPrefix, `${variable.id}${PARAMETER_TYPE_SUFFIX}`)];
	const normalized = String(rawType ?? variable.valueType).trim();

	if (normalized === 'currency' || normalized === 'date_time') {
		return normalized;
	}

	return 'text';
}

function buttonFieldLabel(slot: TemplateButtonSlot, suffix: string): string {
	return `Button ${slot.index} · ${suffix}`;
}

export function fieldIdForButtonSlot(
	slot: TemplateButtonSlot,
	cardIndex?: number,
): string | undefined {
	if (!slot.dynamicKind) {
		return undefined;
	}

	const prefix = cardIndex === undefined ? '' : `card_${cardIndex}_`;
	return `${prefix}btn_${slot.index}_${slot.dynamicKind}`;
}

export function bodyVariableInputKeys(variable: TemplateBodyVariable, cardIndex?: number): string[] {
	const prefix = cardIndex === undefined ? '' : `card_${cardIndex}_`;

	if (variable.valueType === 'currency') {
		return [
			`${prefix}${variable.id}`,
			`${prefix}${variable.id}${CURRENCY_CODE_SUFFIX}`,
			`${prefix}${variable.id}${CURRENCY_AMOUNT_SUFFIX}`,
			`${prefix}${variable.id}${CURRENCY_FALLBACK_SUFFIX}`,
		];
	}

	if (variable.valueType === 'date_time') {
		return [
			`${prefix}${variable.id}`,
			`${prefix}${variable.id}${DATE_TIME_VALUE_SUFFIX}`,
			`${prefix}${variable.id}${DATE_TIME_FALLBACK_SUFFIX}`,
		];
	}

	return [`${prefix}${variable.id}`];
}

export function buttonFieldForSlot(slot: TemplateButtonSlot): ResourceMapperField | undefined {
	switch (slot.dynamicKind) {
		case 'url_suffix':
			return {
				id: `btn_${slot.index}_url_suffix`,
				displayName: buttonFieldLabel(slot, 'URL suffix'),
				required: true,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		case 'quick_reply_text':
			return {
				id: `btn_${slot.index}_quick_reply_text`,
				displayName: buttonFieldLabel(slot, 'Quick Reply text'),
				required: true,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		case 'quick_reply_payload':
			return {
				id: `btn_${slot.index}_quick_reply_payload`,
				displayName: buttonFieldLabel(slot, 'Quick Reply payload'),
				required: true,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		case 'flow':
			return {
				id: `btn_${slot.index}_flow_token`,
				displayName: buttonFieldLabel(slot, 'Flow token'),
				required: true,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		case 'copy_code':
			return {
				id: `btn_${slot.index}_copy_code`,
				displayName: buttonFieldLabel(slot, 'Coupon code'),
				required: true,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		case 'catalog_thumbnail':
			return {
				id: `btn_${slot.index}_catalog_thumbnail`,
				displayName: buttonFieldLabel(slot, 'Thumbnail SKU'),
				required: false,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		case 'mpm':
			return undefined;
		default:
			return undefined;
	}
}

async function loadTemplateDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number');
	requireLoadOptionsDependency(context, 'templateName', 'a template');

	return fetchSelectedTemplateDefinition(context, 'phoneNumberId');
}

export async function getTemplateBodyParameterFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const definition = await loadTemplateDefinition(this);

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
		fields: definition.bodyVariables.flatMap((variable) => {
			const mapperValue = readCurrentBodyMapperValue(this);
			const selectedType = readBodyParameterType(mapperValue, variable);
			return bodyVariableToFields(variable, selectedType);
		}),
	};
}

export async function getTemplateCarouselBodyParameterFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const definition = await loadTemplateDefinition(this);

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

	const mapperValue = readCurrentCarouselBodyMapperValue(this, 'templateCarouselBodyParametersMapper');

	return {
		fields: definition.carouselCards.flatMap((card) =>
			card.bodyVariables.flatMap((variable) => {
				const selectedType = readCarouselBodyParameterType(mapperValue, card.cardIndex, variable);
				return bodyVariableToFieldsForCarouselCard(card.cardIndex, variable, selectedType);
			}),
		),
	};
}

export async function getTemplateButtonParameterFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const definition = await loadTemplateDefinition(this);

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

export function buttonDynamicKindFromFieldId(fieldId: string): TemplateButtonDynamicKind | undefined {
	if (fieldId.endsWith('_url_suffix')) return 'url_suffix';
	if (fieldId.endsWith('_quick_reply_text')) return 'quick_reply_text';
	if (fieldId.endsWith('_quick_reply_payload')) return 'quick_reply_payload';
	if (fieldId.endsWith('_flow_token')) return 'flow';
	if (fieldId.endsWith('_copy_code')) return 'copy_code';
	if (fieldId.endsWith('_catalog_thumbnail')) return 'catalog_thumbnail';
	if (fieldId.endsWith('_mpm')) return 'mpm';
	return undefined;
}

export function buttonIndexFromFieldId(fieldId: string): number | undefined {
	const match = /^btn_(\d+)_/.exec(fieldId);
	if (!match) {
		return undefined;
	}

	const index = Number.parseInt(match[1], 10);
	return Number.isFinite(index) ? index : undefined;
}
