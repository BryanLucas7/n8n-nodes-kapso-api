import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from './helpers';
import { fetchSelectedTemplateDefinition } from './templateFetch';
import {
	detectedComponentModeOptions,
	detectedHeaderFormatOptions,
} from './detectedTemplateStructureOptions';

const TEMPLATE_MPM_HINT_NO = 'no';
const TEMPLATE_MPM_HINT_YES = 'yes';
const TEMPLATE_HEADER_TEXT_HINT_NO = 'no';
const TEMPLATE_HEADER_TEXT_HINT_YES = 'yes';

async function loadDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number');
	requireLoadOptionsDependency(context, 'templateName', 'a template');

	return fetchSelectedTemplateDefinition(context, 'phoneNumberId');
}

export async function getTemplateDetectedHeaderFormat(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	return detectedHeaderFormatOptions(definition);
}

export async function getTemplateDetectedComponentMode(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	return detectedComponentModeOptions(definition);
}

export async function getTemplateMpmButtonHint(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	const hasMpm = definition?.buttonSlots.some((slot) => slot.dynamicKind === 'mpm') ?? false;

	return [
		{
			name: hasMpm ? 'MPM buttons detected' : 'No MPM buttons',
			value: hasMpm ? TEMPLATE_MPM_HINT_YES : TEMPLATE_MPM_HINT_NO,
		},
	];
}

export async function getTemplateHeaderTextHasVariable(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	const hasVariable = definition?.headerTextHasVariable ?? false;

	return [
		{
			name: hasVariable ? 'Header has variable' : 'Static header',
			value: hasVariable ? TEMPLATE_HEADER_TEXT_HINT_YES : TEMPLATE_HEADER_TEXT_HINT_NO,
		},
	];
}

export {
	TEMPLATE_MPM_HINT_NO,
	TEMPLATE_MPM_HINT_YES,
	TEMPLATE_HEADER_TEXT_HINT_NO,
	TEMPLATE_HEADER_TEXT_HINT_YES,
};
