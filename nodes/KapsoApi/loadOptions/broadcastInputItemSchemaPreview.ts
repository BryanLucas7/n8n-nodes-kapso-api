import { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { fetchBroadcastTemplateDefinitionForLoadOptions } from './broadcastTemplateFetch';
import { assertKapsoLoadOptionsReady, requireLoadOptionsDependency } from './helpers';
import { readNodeParameterString } from './resourceLocatorHelpers';
import { buildBroadcastInputItemSchemaLines } from '../actions/broadcastInputItemSchema';

export async function getBroadcastInputItemSchemaPreview(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'broadcastId', 'Broadcast');

	const phoneField = readNodeParameterString(this, 'broadcastRecipientPhoneField') || 'phone';
	const contactField = readNodeParameterString(this, 'broadcastRecipientContactIdField');

	try {
		const definition = await fetchBroadcastTemplateDefinitionForLoadOptions(this);
		if (!definition) {
			return [{ name: 'Select a Draft Broadcast to Preview Expected Input Item Keys', value: '' }];
		}

		const lines = buildBroadcastInputItemSchemaLines(definition, phoneField, contactField);
		return [{ name: lines.join(', '), value: '' }];
	} catch {
		return [{ name: 'Select a Draft Broadcast to Preview Expected Input Item Keys', value: '' }];
	}
}
