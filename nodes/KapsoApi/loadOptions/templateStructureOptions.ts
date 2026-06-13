import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	requireLoadOptionsDependency,
} from './helpers';
import { fetchSelectedTemplateDefinition } from './templateFetch';

async function loadDefinition(context: ILoadOptionsFunctions) {
	await assertKapsoLoadOptionsReady(context);
	requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number');
	requireLoadOptionsDependency(context, 'templateName', 'a template');

	return fetchSelectedTemplateDefinition(context, 'phoneNumberId');
}

export async function getTemplateSummary(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const definition = await loadDefinition(this);

	if (!definition) {
		return [{ name: 'Select a template to see detected structure', value: 'pending' }];
	}

	const parts: string[] = [];
	parts.push(`layout ${definition.componentMode === 'carousel' ? 'Carousel' : 'Standard'}`);

	const headerFormat = definition.headerFormat;
	const headerLabel =
		headerFormat === 'text'
			? definition.headerTextHasVariable
				? 'Text (with variable)'
				: 'Text'
			: headerFormat === 'image' || headerFormat === 'video' || headerFormat === 'document'
				? headerFormat.charAt(0).toUpperCase() + headerFormat.slice(1)
				: 'None';
	parts.push(`header ${headerLabel}`);

	const varCount = definition.bodyVariables.length;
	if (varCount === 0) {
		parts.push('no body variables');
	} else {
		const format = definition.parameterFormat === 'named' ? 'named' : 'positional';
		const names = definition.bodyVariables
			.slice(0, 3)
			.map((v) => `{{${v.parameterName ?? v.positionalIndex ?? v.id}}}`)
			.join(', ');
		const extra = varCount > 3 ? `, +${varCount - 3} more` : '';
		parts.push(`body ${varCount} ${format} (${names}${extra})`);
	}

	const dynamicButtons = definition.buttonSlots.filter((slot) => slot.dynamicKind);
	if (dynamicButtons.length === 0) {
		parts.push('no dynamic buttons');
	} else {
		const kinds = dynamicButtons.map((slot) => slot.dynamicKind).join(', ');
		parts.push(`${dynamicButtons.length} dynamic button${dynamicButtons.length > 1 ? 's' : ''} (${kinds})`);
	}

	return [{ name: `✓ ${parts.join(' · ')}`, value: 'detected' }];
}
