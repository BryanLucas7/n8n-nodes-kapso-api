import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { assertKapsoLoadOptionsReady, requireLoadOptionsDependency } from './helpers';
import { fetchBroadcastTemplateDefinitionForLoadOptions } from './broadcastTemplateFetch';
import {
	detectedComponentModeOptions,
	detectedHeaderFormatOptions,
} from './detectedTemplateStructureOptions';

export const BROADCAST_MPM_HINT_NO = 'no';
export const BROADCAST_MPM_HINT_YES = 'yes';

async function loadDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'broadcastId', 'a broadcast');

	return fetchBroadcastTemplateDefinitionForLoadOptions(context);
}

export async function getBroadcastDetectedHeaderFormat(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	return detectedHeaderFormatOptions(definition);
}

export async function getBroadcastDetectedComponentMode(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	return detectedComponentModeOptions(definition);
}

export async function getBroadcastMpmButtonHint(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);
	const hasMpm = definition?.buttonSlots.some((slot) => slot.dynamicKind === 'mpm') ?? false;

	return [
		{
			name: hasMpm ? 'MPM buttons detected' : 'No MPM buttons',
			value: hasMpm ? BROADCAST_MPM_HINT_YES : BROADCAST_MPM_HINT_NO,
		},
	];
}
