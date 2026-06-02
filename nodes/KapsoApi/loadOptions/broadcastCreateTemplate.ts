import { ApplicationError, IExecuteFunctions } from 'n8n-workflow';
import { fetchApprovedTemplateEntriesForPhone } from './templateFetch';
import { findTemplateEntryBySelection, parseTemplateSelection } from './templateSelection';
import { readStringParameterValue, getString } from '../actions/nodeHelpers';

export async function resolveBroadcastCreateTemplateId(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<string> {
	const selection = readStringParameterValue(ef.getNodeParameter('broadcastTemplateId', itemIndex));
	const parsed = parseTemplateSelection(selection);

	if (/^\d+$/.test(selection.trim())) {
		return selection.trim();
	}

	const entries = await fetchApprovedTemplateEntriesForPhone(
		ef,
		getString(ef, 'phoneNumberId', itemIndex) ? 'phoneNumberId' : 'broadcastPhoneNumberId',
		itemIndex,
	);
	const entry = findTemplateEntryBySelection(entries, selection);

	if (!entry) {
		throw new ApplicationError(
			'Could not resolve the selected broadcast template. Choose a template from the list or provide a Meta template ID.',
		);
	}

	const templateId = String(entry.id ?? entry.meta_template_id ?? parsed.id ?? '').trim();
	if (!templateId) {
		throw new ApplicationError('Selected template is missing a Meta template ID.');
	}

	return templateId;
}
