import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	NodeOperationError,
} from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	fetchAllApprovedTemplateEntries,
	LIST_SEARCH_INITIAL_SIZE,
	requireLoadOptionsDependency,
	resolveBusinessAccountId,
	templateLabel,
} from './helpers';
import { encodeMessageTemplateValue } from './templateSelection';

function matchesFilter(entry: IDataObject, filter?: string): boolean {
	if (!filter?.trim()) {
		return true;
	}

	const haystack = `${entry.name ?? ''} ${entry.language ?? entry.language_code ?? ''} ${entry.id ?? ''}`.toLowerCase();
	return haystack.includes(filter.trim().toLowerCase());
}

export async function searchBroadcastTemplates(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	await assertKapsoLoadOptionsReady(this);
	requireLoadOptionsDependency(this, 'phoneNumberId', 'Phone Number');

	const wabaId = await resolveBusinessAccountId(this, 'phoneNumberId');
	if (!wabaId) {
		throw new NodeOperationError(
			this.getNode(),
			'Could not resolve the WhatsApp Business Account for the selected phone number. Open Kapso Dashboard > WhatsApp > Phone Numbers and confirm the number is linked to a WABA, then reselect it here.',
			{ level: 'warning' },
		);
	}

	const page = paginationToken ? Number(paginationToken) : 1;
	const entries = (await fetchAllApprovedTemplateEntries(this, wabaId)).filter((entry) =>
		matchesFilter(entry, filter),
	);
	const pageSize = LIST_SEARCH_INITIAL_SIZE;
	const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
	const start = (currentPage - 1) * pageSize;
	const slice = entries.slice(start, start + pageSize);
	const nextPage = start + pageSize < entries.length ? String(currentPage + 1) : undefined;

	return {
		results: slice.map((entry) => ({
			name: templateLabel(entry),
			value: encodeMessageTemplateValue(entry),
		})),
		paginationToken: nextPage,
	};
}
