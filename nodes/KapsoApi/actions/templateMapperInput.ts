import { ApplicationError, IExecuteFunctions, ResourceMapperValue } from 'n8n-workflow';
import { parseJsonValue } from '../transport/json';
import {
	buttonDynamicKindFromFieldId,
	buttonIndexFromFieldId,
} from '../resourceMapping/templateParameters';
import { fetchSelectedTemplateDefinition } from '../loadOptions/templateFetch';
import { TemplateDefinition } from '../loadOptions/templateDefinition';
import type { TemplateBodyParameterInput, TemplateButtonParameterInput } from './templateComponents';
import { getString } from './nodeHelpers';

type ResourceMapperRecord = Record<string, unknown>;

function readResourceMapperValue(
	ef: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
): ResourceMapperRecord {
	const mapper = ef.getNodeParameter(parameterName, itemIndex, {
		mappingMode: 'defineBelow',
		value: null,
	}) as ResourceMapperValue;

	return (mapper.value ?? {}) as ResourceMapperRecord;
}

function bodyParametersFromMapper(
	mapperValue: ResourceMapperRecord,
	definition: TemplateDefinition,
): TemplateBodyParameterInput[] {
	const allowedIds = new Set(definition.bodyVariables.map((variable) => variable.id));
	const parameters: TemplateBodyParameterInput[] = [];

	for (const variable of definition.bodyVariables) {
		const rawValue = mapperValue?.[variable.id];
		const text = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();

		if (!text) {
			throw new ApplicationError(`Body parameter "${variable.displayName}" is required for this template.`);
		}

		parameters.push({
			parameterName: variable.parameterName,
			parameterText: text,
		});
	}

	for (const fieldId of Object.keys(mapperValue)) {
		if (!allowedIds.has(fieldId)) {
			throw new ApplicationError(`Unexpected body parameter "${fieldId}" for the selected template.`);
		}
	}

	return parameters;
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

function buttonParametersFromMapper(
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

export function resolveButtonParametersForTemplate(
	ef: IExecuteFunctions,
	itemIndex: number,
	definition: TemplateDefinition,
): TemplateButtonParameterInput[] {
	if (!definition.buttonSlots.some((slot) => slot.dynamicKind)) {
		return [];
	}

	return buttonParametersFromMapper(
		readResourceMapperValue(ef, 'templateButtonParametersMapper', itemIndex),
		definition,
	);
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
			'Could not load the selected template definition. Check phone number, template name, and language.',
		);
	}

	return definition;
}

export function readTemplateHeaderValues(ef: IExecuteFunctions, itemIndex: number) {
	return {
		headerText: getString(ef, 'templateHeaderText', itemIndex),
		headerMediaSource: getString(ef, 'templateHeaderMediaSource', itemIndex) || 'link',
		headerMediaUrl: getString(ef, 'templateHeaderMediaUrl', itemIndex),
		headerMediaId: getString(ef, 'templateHeaderMediaId', itemIndex),
		headerLatitude: getString(ef, 'templateHeaderLatitude', itemIndex),
		headerLongitude: getString(ef, 'templateHeaderLongitude', itemIndex),
		headerLocationName: getString(ef, 'templateHeaderLocationName', itemIndex),
		headerLocationAddress: getString(ef, 'templateHeaderLocationAddress', itemIndex),
	};
}
