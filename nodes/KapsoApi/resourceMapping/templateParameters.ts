import { ILoadOptionsFunctions, ResourceMapperField, ResourceMapperFields } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from '../loadOptions/helpers';
import { fetchSelectedTemplateDefinition } from '../loadOptions/templateFetch';
import {
	TemplateBodyVariable,
	TemplateButtonDynamicKind,
	TemplateButtonSlot,
} from '../loadOptions/templateDefinition';

const BODY_MAPPER_EMPTY_NOTICE =
	'This template has no body text variables. You can continue without filling body parameters.';
const BUTTON_MAPPER_EMPTY_NOTICE =
	'This template has no dynamic button parameters at send time.';

function bodyVariableToField(variable: TemplateBodyVariable): ResourceMapperField {
	return {
		id: variable.id,
		displayName: variable.displayName,
		required: true,
		defaultMatch: false,
		display: true,
		type: 'string',
	};
}

function buttonFieldLabel(slot: TemplateButtonSlot, suffix: string): string {
	return `Button ${slot.index} · ${suffix}`;
}

function buttonFieldForSlot(slot: TemplateButtonSlot): ResourceMapperField | undefined {
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
			return {
				id: `btn_${slot.index}_mpm`,
				displayName: buttonFieldLabel(slot, 'MPM sections JSON'),
				required: true,
				defaultMatch: false,
				display: true,
				type: 'string',
			};
		default:
			return undefined;
	}
}

async function loadTemplateDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number');
	requireLoadOptionsDependency(context, 'templateName', 'a template');
	requireLoadOptionsDependency(context, 'languageCode', 'a language');

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
		fields: definition.bodyVariables.map(bodyVariableToField),
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
