import { INodePropertyOptions } from 'n8n-workflow';
import { TemplateDefinition, TemplateHeaderFormat } from './templateDefinition';

const HEADER_FORMAT_LABELS: Record<TemplateHeaderFormat, string> = {
	none: 'None',
	text: 'Text',
	image: 'Image',
	video: 'Video',
	document: 'Document',
	location: 'Location',
};

function singleOption(value: string, label: string): INodePropertyOptions[] {
	return [{ name: label, value }];
}

export function detectedHeaderFormatOptions(
	definition: TemplateDefinition | undefined,
): INodePropertyOptions[] {
	if (!definition || definition.componentMode === 'carousel') {
		return singleOption('none', HEADER_FORMAT_LABELS.none);
	}

	return singleOption(definition.headerFormat, HEADER_FORMAT_LABELS[definition.headerFormat]);
}

export function detectedComponentModeOptions(
	definition: TemplateDefinition | undefined,
): INodePropertyOptions[] {
	const mode = definition?.componentMode ?? 'standard';
	return singleOption(mode, mode === 'carousel' ? 'Carousel' : 'Standard');
}
