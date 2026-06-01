import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from './helpers';
import { fetchSelectedTemplateDefinition } from './templateFetch';
import { TemplateHeaderFormat } from './templateDefinition';

const HEADER_FORMAT_LABELS: Record<TemplateHeaderFormat, string> = {
	none: 'None',
	text: 'Text',
	image: 'Image',
	video: 'Video',
	document: 'Document',
	location: 'Location',
};

async function loadDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number');
	requireLoadOptionsDependency(context, 'templateName', 'a template');
	requireLoadOptionsDependency(context, 'languageCode', 'a language');

	return fetchSelectedTemplateDefinition(context, 'phoneNumberId');
}

function singleOption(value: string, label: string): INodePropertyOptions[] {
	return [{ name: label, value }];
}

export async function getTemplateDetectedHeaderFormat(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);

	if (!definition || definition.componentMode === 'carousel') {
		return singleOption('none', HEADER_FORMAT_LABELS.none);
	}

	const format = definition.headerFormat;
	return singleOption(format, HEADER_FORMAT_LABELS[format]);
}

export async function getTemplateDetectedComponentMode(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);

	const mode = definition?.componentMode ?? 'standard';
	const label = mode === 'carousel' ? 'Carousel' : 'Standard';

	return singleOption(mode, label);
}
