import { IDataObject } from 'n8n-workflow';
import {
	inferValueTypeFromExample,
	normalizeBodyVariableType,
} from './templateBodyParameterUtils';

export type TemplateHeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document' | 'location';
export type TemplateComponentMode = 'standard' | 'carousel';
export type TemplateParameterFormat = 'named' | 'positional';

export type TemplateBodyValueType = 'text' | 'currency' | 'date_time';

export type TemplateBodyVariable = {
	id: string;
	displayName: string;
	parameterName?: string;
	positionalIndex?: number;
	valueType: TemplateBodyValueType;
	exampleValue?: string;
};

export type TemplateButtonDynamicKind =
	| 'url_suffix'
	| 'quick_reply_text'
	| 'quick_reply_payload'
	| 'flow'
	| 'copy_code'
	| 'catalog_thumbnail'
	| 'mpm';

export type TemplateButtonSlot = {
	index: number;
	subType: string;
	dynamicKind?: TemplateButtonDynamicKind;
};

export type TemplateCarouselCardDefinition = {
	cardIndex: number;
	headerFormat: 'image' | 'video';
	bodyVariables: TemplateBodyVariable[];
	buttonSlots: TemplateButtonSlot[];
};

export type TemplateDefinition = {
	name: string;
	language: string;
	parameterFormat: TemplateParameterFormat;
	componentMode: TemplateComponentMode;
	headerFormat: TemplateHeaderFormat;
	headerTextHasVariable: boolean;
	headerVariable?: TemplateBodyVariable;
	bodyVariables: TemplateBodyVariable[];
	buttonSlots: TemplateButtonSlot[];
	carouselCards: TemplateCarouselCardDefinition[];
};

const NAMED_VARIABLE_PATTERN = /\{\{([a-z][a-z0-9_]*)\}\}/g;
const POSITIONAL_VARIABLE_PATTERN = /\{\{(\d+)\}\}/g;

function normalizeComponentType(value: unknown): string {
	return String(value ?? '').trim().toUpperCase();
}

function normalizeParameterFormat(
	value: unknown,
	components: IDataObject[] = [],
): TemplateParameterFormat {
	const normalized = String(value ?? '').trim().toUpperCase();

	if (normalized === 'NAMED') {
		return 'named';
	}

	if (normalized === 'POSITIONAL') {
		return 'positional';
	}

	return inferParameterFormatFromComponents(components);
}

function inferParameterFormatFromComponents(components: IDataObject[]): TemplateParameterFormat {
	let hasNamed = false;
	let hasPositional = false;

	for (const component of components) {
		const text = String(component.text ?? '');

		if (extractNamedVariables(text).length > 0) {
			hasNamed = true;
		}

		if (extractPositionalCount(text) > 0) {
			hasPositional = true;
		}
	}

	if (hasNamed && !hasPositional) {
		return 'named';
	}

	return 'positional';
}

function normalizeHeaderFormat(value: unknown): TemplateHeaderFormat {
	const normalized = String(value ?? '').trim().toUpperCase();

	switch (normalized) {
		case 'TEXT':
			return 'text';
		case 'IMAGE':
			return 'image';
		case 'VIDEO':
			return 'video';
		case 'DOCUMENT':
			return 'document';
		case 'LOCATION':
			return 'location';
		default:
			return 'none';
	}
}

function extractNamedVariables(text: string): string[] {
	const names = new Set<string>();

	for (const match of text.matchAll(NAMED_VARIABLE_PATTERN)) {
		names.add(match[1]);
	}

	return [...names];
}

function extractPositionalCount(text: string): number {
	const indices = new Set<number>();

	for (const match of text.matchAll(POSITIONAL_VARIABLE_PATTERN)) {
		const index = Number.parseInt(match[1], 10);
		if (Number.isFinite(index) && index > 0) {
			indices.add(index);
		}
	}

	if (indices.size === 0) {
		return 0;
	}

	return Math.max(...indices);
}

function resolveHeaderVariable(
	headerText: string,
	parameterFormat: TemplateParameterFormat,
): TemplateBodyVariable | undefined {
	if (parameterFormat === 'named') {
		const [name] = extractNamedVariables(headerText);
		if (!name) {
			return undefined;
		}

		return {
			id: name,
			displayName: name,
			parameterName: name,
			valueType: 'text',
		};
	}

	if (extractPositionalCount(headerText) === 0) {
		return undefined;
	}

	return {
		id: 'param_1',
		displayName: 'Parameter 1',
		positionalIndex: 1,
		valueType: 'text',
	};
}

function bodyVariablesFromExample(
	example: unknown,
	parameterFormat: TemplateParameterFormat,
	libraryParamTypes?: unknown[],
): TemplateBodyVariable[] {
	if (!example || typeof example !== 'object') {
		return [];
	}

	const record = example as IDataObject;
	const namedParams = record.body_text_named_params;

	if (Array.isArray(namedParams)) {
		return namedParams.flatMap((entry, index) => {
			if (!entry || typeof entry !== 'object') {
				return [];
			}

			const paramRecord = entry as IDataObject;
			const paramName = String(paramRecord.param_name ?? '').trim();
			if (!paramName) {
				return [];
			}

			const exampleValue = String(paramRecord.example ?? '').trim();
			const valueType = inferValueTypeFromExample(
				exampleValue,
				paramRecord.type ?? paramRecord.param_type ?? libraryParamTypes?.[index],
			);

			return [
				{
					id: paramName,
					displayName: paramName,
					parameterName: paramName,
					valueType,
					exampleValue,
				} satisfies TemplateBodyVariable,
			];
		});
	}

	if (parameterFormat === 'positional' && Array.isArray(record.body_text)) {
		const firstExample = record.body_text[0];
		if (Array.isArray(firstExample)) {
			return firstExample.map((exampleValue, index) => {
				const exampleText =
					typeof exampleValue === 'string'
						? exampleValue
						: exampleValue && typeof exampleValue === 'object'
							? String((exampleValue as IDataObject).fallback_value ?? '')
							: '';

				return {
					id: `param_${index + 1}`,
					displayName: `Parameter ${index + 1}`,
					positionalIndex: index + 1,
					valueType: inferValueTypeFromExample(
						exampleText,
						exampleValue && typeof exampleValue === 'object'
							? (exampleValue as IDataObject).type
							: libraryParamTypes?.[index],
					),
					exampleValue: exampleText,
				};
			});
		}
	}

	return [];
}

function applyLibraryBodyParamTypes(
	variables: TemplateBodyVariable[],
	libraryParamTypes: unknown[] | undefined,
): TemplateBodyVariable[] {
	if (!Array.isArray(libraryParamTypes) || libraryParamTypes.length === 0) {
		return variables;
	}

	return variables.map((variable, index) => {
		const libraryType = libraryParamTypes[index];
		if (!libraryType) {
			return variable;
		}

		const valueType = normalizeBodyVariableType(libraryType);
		return valueType === 'text' ? variable : { ...variable, valueType };
	});
}

function bodyVariablesFromText(text: string, parameterFormat: TemplateParameterFormat): TemplateBodyVariable[] {
	if (parameterFormat === 'named') {
		return extractNamedVariables(text).map((name) => ({
			id: name,
			displayName: name,
			parameterName: name,
			valueType: 'text' as const,
		}));
	}

	const count = extractPositionalCount(text);
	return Array.from({ length: count }, (_, index) => ({
		id: `param_${index + 1}`,
		displayName: `Parameter ${index + 1}`,
		positionalIndex: index + 1,
		valueType: 'text' as const,
	}));
}

function resolveBodyVariables(
	text: string,
	example: unknown,
	parameterFormat: TemplateParameterFormat,
	libraryParamTypes?: unknown[],
): TemplateBodyVariable[] {
	const fromExample = bodyVariablesFromExample(example, parameterFormat, libraryParamTypes);
	if (fromExample.length > 0) {
		return applyLibraryBodyParamTypes(fromExample, libraryParamTypes);
	}

	return applyLibraryBodyParamTypes(bodyVariablesFromText(text, parameterFormat), libraryParamTypes);
}

function normalizeButtonSubType(type: unknown): string {
	const normalized = String(type ?? '').trim().toUpperCase();

	switch (normalized) {
		case 'URL':
			return 'url';
		case 'QUICK_REPLY':
			return 'quick_reply';
		case 'PHONE_NUMBER':
			return 'phone_number';
		case 'FLOW':
			return 'flow';
		case 'COPY_CODE':
			return 'copy_code';
		case 'CATALOG':
			return 'catalog';
		case 'MPM':
			return 'mpm';
		default:
			return normalized.toLowerCase();
	}
}

function containsPositionalPlaceholder(text: string): boolean {
	return /\{\{\d+\}\}/.test(text);
}

function containsNamedPlaceholder(text: string): boolean {
	return /\{\{[a-z][a-z0-9_]*\}\}/i.test(text);
}

function buttonDynamicKind(button: IDataObject): TemplateButtonDynamicKind | undefined {
	const subType = normalizeButtonSubType(button.type);
	const url = String(button.url ?? '');

	if (subType === 'url' && containsPositionalPlaceholder(url)) {
		return 'url_suffix';
	}

	if (subType === 'flow') {
		return 'flow';
	}

	if (subType === 'copy_code') {
		return 'copy_code';
	}

	if (subType === 'catalog') {
		return 'catalog_thumbnail';
	}

	if (subType === 'mpm') {
		return 'mpm';
	}

	if (subType === 'quick_reply') {
		const text = String(button.text ?? button.title ?? '');
		if (containsNamedPlaceholder(text) || containsPositionalPlaceholder(text)) {
			return 'quick_reply_text';
		}
	}

	return undefined;
}

function parseButtonSlots(buttons: unknown): TemplateButtonSlot[] {
	if (!Array.isArray(buttons)) {
		return [];
	}

	return buttons.map((button, index) => {
		const record = (button ?? {}) as IDataObject;
		const subType = normalizeButtonSubType(record.type);

		return {
			index,
			subType,
			dynamicKind: buttonDynamicKind(record),
		};
	});
}

function parseCarouselCards(
	components: IDataObject[],
	parameterFormat: TemplateParameterFormat,
): TemplateCarouselCardDefinition[] {
	const carouselComponent = components.find(
		(component) => normalizeComponentType(component.type) === 'CAROUSEL',
	);

	if (!carouselComponent || !Array.isArray(carouselComponent.cards)) {
		return [];
	}

	return carouselComponent.cards.map((card, cardIndex) => {
		const cardRecord = (card ?? {}) as IDataObject;
		const cardComponents = Array.isArray(cardRecord.components)
			? (cardRecord.components as IDataObject[])
			: [];

		const headerComponent = cardComponents.find(
			(component) => normalizeComponentType(component.type) === 'HEADER',
		);
		const bodyComponent = cardComponents.find(
			(component) => normalizeComponentType(component.type) === 'BODY',
		);
		const buttonsComponent = cardComponents.find(
			(component) => normalizeComponentType(component.type) === 'BUTTONS',
		);

		const headerFormatRaw = normalizeHeaderFormat(headerComponent?.format);
		const headerFormat = headerFormatRaw === 'video' ? 'video' : 'image';

		return {
			cardIndex,
			headerFormat,
			bodyVariables: resolveBodyVariables(
				String(bodyComponent?.text ?? ''),
				bodyComponent?.example,
				parameterFormat,
			),
			buttonSlots: parseButtonSlots(buttonsComponent?.buttons),
		};
	});
}

export function parseTemplateDefinition(entry: IDataObject): TemplateDefinition {
	const name = String(entry.name ?? '');
	const language = String(entry.language ?? entry.language_code ?? '');
	const components = Array.isArray(entry.components) ? (entry.components as IDataObject[]) : [];
	const parameterFormat = normalizeParameterFormat(entry.parameter_format, components);

	const carouselCards = parseCarouselCards(components, parameterFormat);
	const componentMode: TemplateComponentMode = carouselCards.length > 0 ? 'carousel' : 'standard';

	const headerComponent = components.find(
		(component) => normalizeComponentType(component.type) === 'HEADER',
	);
	const bodyComponent = components.find((component) => normalizeComponentType(component.type) === 'BODY');
	const buttonsComponent = components.find(
		(component) => normalizeComponentType(component.type) === 'BUTTONS',
	);

	const headerText = String(headerComponent?.text ?? '');
	const headerFormat = headerComponent ? normalizeHeaderFormat(headerComponent.format) : 'none';
	const headerVariable =
		headerFormat === 'text' ? resolveHeaderVariable(headerText, parameterFormat) : undefined;

	const libraryParamTypes = Array.isArray(entry.body_param_types)
		? (entry.body_param_types as unknown[])
		: undefined;

	return {
		name,
		language,
		parameterFormat,
		componentMode,
		headerFormat,
		headerTextHasVariable: Boolean(headerVariable),
		headerVariable,
		bodyVariables: resolveBodyVariables(
			String(bodyComponent?.text ?? ''),
			bodyComponent?.example,
			parameterFormat,
			libraryParamTypes,
		),
		buttonSlots: parseButtonSlots(buttonsComponent?.buttons),
		carouselCards,
	};
}

export function findTemplateEntry(
	entries: IDataObject[],
	templateName: string,
	languageCode: string,
): IDataObject | undefined {
	return entries.find(
		(entry) =>
			String(entry.name ?? '') === templateName &&
			String(entry.language ?? entry.language_code ?? '') === languageCode,
	);
}
