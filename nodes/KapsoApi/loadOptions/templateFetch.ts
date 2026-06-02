import { ApplicationError, IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { kapsoApiRequest } from '../transport/request';
import { parseTemplateDefinition, TemplateDefinition } from './templateDefinition';
import {
	findTemplateEntryBySelection,
	parseTemplateSelection,
	templateIdentityFromEntry,
} from './templateSelection';
import {
	extractResponseData,
	kapsoLoadOptionsRequest,
	LOAD_OPTIONS_MAX_PAGES,
	LOAD_OPTIONS_PAGE_SIZE,
	resolveBusinessAccountId,
} from './helpers';
import { resolveBusinessAccountIdForExecute } from './businessAccount';
import { readExecuteNodeParameterString, readNodeParameterString } from './resourceLocatorHelpers';

type TemplateSelectionContext = ILoadOptionsFunctions | IExecuteFunctions;

export type SendTemplateContext = {
	identity: { name: string; language: string };
	definition: TemplateDefinition;
};

function readTemplateSelection(
	context: TemplateSelectionContext,
	itemIndex = 0,
): string {
	if ('getCurrentNodeParameter' in context) {
		return readNodeParameterString(context as ILoadOptionsFunctions, 'templateName');
	}

	return readExecuteNodeParameterString(context as IExecuteFunctions, 'templateName', itemIndex);
}

function readNodeParameter(
	context: TemplateSelectionContext,
	parameterName: string,
	itemIndex = 0,
): string {
	if (parameterName === 'templateName') {
		return readTemplateSelection(context, itemIndex);
	}

	if ('getCurrentNodeParameter' in context) {
		return String(context.getCurrentNodeParameter(parameterName) ?? '').trim();
	}

	return String(context.getNodeParameter(parameterName, itemIndex) ?? '').trim();
}

async function fetchAllApprovedTemplateEntriesForContext(
	context: TemplateSelectionContext,
	wabaId: string,
	itemIndex = 0,
): Promise<IDataObject[]> {
	const collected: IDataObject[] = [];
	let after: string | undefined;

	for (let page = 0; page < LOAD_OPTIONS_MAX_PAGES; page += 1) {
		const query = {
			status: 'APPROVED',
			limit: LOAD_OPTIONS_PAGE_SIZE,
			...(after ? { after } : {}),
		};

		const response =
			'helpers' in context && 'request' in context.helpers
				? await kapsoLoadOptionsRequest(context as ILoadOptionsFunctions, {
						api: 'whatsapp',
						method: 'GET',
						path: `/${encodeURIComponent(wabaId)}/message_templates`,
						query,
					})
				: await kapsoApiRequest(
						context as IExecuteFunctions,
						{
							api: 'whatsapp',
							method: 'GET',
							path: `/${encodeURIComponent(wabaId)}/message_templates`,
							query,
						},
						itemIndex,
					);

		collected.push(...extractResponseData(response));

		const nextAfter = (response as { paging?: { cursors?: { after?: string } } }).paging?.cursors
			?.after;
		if (!nextAfter || nextAfter === after) {
			break;
		}

		after = nextAfter;
	}

	return collected;
}

export async function fetchApprovedTemplateEntriesForPhone(
	context: TemplateSelectionContext,
	phoneParameterName: string,
	itemIndex = 0,
): Promise<IDataObject[]> {
	const phoneNumberId = readNodeParameter(context, phoneParameterName, itemIndex);
	if (!phoneNumberId) {
		return [];
	}

	if ('helpers' in context && 'request' in context.helpers) {
		const wabaId = await resolveBusinessAccountId(context as ILoadOptionsFunctions, phoneParameterName);
		if (!wabaId) {
			return [];
		}

		return fetchAllApprovedTemplateEntriesForContext(context, wabaId, itemIndex);
	}

	const wabaId = await resolveBusinessAccountIdForExecute(context as IExecuteFunctions, phoneNumberId, itemIndex);
	if (!wabaId) {
		return [];
	}

	return fetchAllApprovedTemplateEntriesForContext(context, wabaId, itemIndex);
}

export { resolveBusinessAccountIdForExecute } from './businessAccount';

export async function fetchSelectedTemplateDefinition(
	context: TemplateSelectionContext,
	phoneParameterName = 'phoneNumberId',
	itemIndex = 0,
): Promise<TemplateDefinition | undefined> {
	const templateSelection = readNodeParameter(context, 'templateName', itemIndex);
	const legacyLanguageCode = readNodeParameter(context, 'languageCode', itemIndex);
	const parsed = parseTemplateSelection(templateSelection, legacyLanguageCode);

	if (!templateSelection || (!parsed.language && !parsed.id && !parsed.name)) {
		return undefined;
	}

	const entries = await fetchApprovedTemplateEntriesForPhone(context, phoneParameterName, itemIndex);
	const entry = findTemplateEntryBySelection(entries, templateSelection, legacyLanguageCode);

	return entry ? parseTemplateDefinition(entry) : undefined;
}

export async function resolveSelectedTemplateIdentity(
	context: TemplateSelectionContext,
	phoneParameterName = 'phoneNumberId',
	itemIndex = 0,
): Promise<{ name: string; language: string } | undefined> {
	const templateSelection = readNodeParameter(context, 'templateName', itemIndex);
	const legacyLanguageCode = readNodeParameter(context, 'languageCode', itemIndex);

	if (!templateSelection) {
		return undefined;
	}

	const entries = await fetchApprovedTemplateEntriesForPhone(context, phoneParameterName, itemIndex);
	const entry = findTemplateEntryBySelection(entries, templateSelection, legacyLanguageCode);

	if (entry) {
		return templateIdentityFromEntry(entry);
	}

	const parsed = parseTemplateSelection(templateSelection, legacyLanguageCode);
	if (parsed.name && parsed.language) {
		return { name: parsed.name, language: parsed.language };
	}

	return undefined;
}

export async function resolveSendTemplateContext(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<SendTemplateContext> {
	const templateSelection = readTemplateSelection(context, itemIndex);
	const legacyLanguageCode = readNodeParameter(context, 'languageCode', itemIndex);

	if (!templateSelection) {
		throw new ApplicationError('Template is required.');
	}

	const entries = await fetchApprovedTemplateEntriesForPhone(context, 'phoneNumberId', itemIndex);
	const entry = findTemplateEntryBySelection(entries, templateSelection, legacyLanguageCode);

	if (!entry) {
		throw new ApplicationError(
			'Could not resolve the selected template name and language. Refresh template options or use template_name|language_code.',
		);
	}

	return {
		identity: templateIdentityFromEntry(entry),
		definition: parseTemplateDefinition(entry),
	};
}
