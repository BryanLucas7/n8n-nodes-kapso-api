import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { CUSTOM_API_CALL } from './operations';
import {
	getAdvancedFixedCollectionItems,
	getAdvancedOptionBoolean,
	getAdvancedOptionString,
	getString,
} from './nodeHelpers';

type QueryParameterInput = {
	name: string;
	value: string;
};

function appendStringQuery(query: IDataObject, key: string, value: string): void {
	if (value) {
		query[key] = value;
	}
}

export function buildMessageQuery(
	ef: IExecuteFunctions,
	itemIndex: number,
	operation: 'list' | 'get',
): IDataObject {
	const query: IDataObject = {};

	if (operation === 'list') {
		appendStringQuery(
			query,
			'conversation_id',
			getAdvancedOptionString(ef, itemIndex, 'messageListConversationId'),
		);
		appendStringQuery(
			query,
			'direction',
			getAdvancedOptionString(ef, itemIndex, 'messageListDirection'),
		);
		appendStringQuery(
			query,
			'status',
			getAdvancedOptionString(ef, itemIndex, 'messageListStatus'),
		);
		appendStringQuery(query, 'since', getAdvancedOptionString(ef, itemIndex, 'messageListSince'));
		appendStringQuery(query, 'until', getAdvancedOptionString(ef, itemIndex, 'messageListUntil'));
		appendStringQuery(query, 'after', getAdvancedOptionString(ef, itemIndex, 'messageListAfter'));
		appendStringQuery(query, 'before', getAdvancedOptionString(ef, itemIndex, 'messageListBefore'));
	}

	const customFields = getAdvancedOptionString(ef, itemIndex, 'messageResponseFields');
	if (customFields) {
		query.fields = customFields;
	} else if (getAdvancedOptionBoolean(ef, itemIndex, 'includeKapsoExtensions', true)) {
		query.fields = 'kapso()';
	}

	return query;
}

export function buildMediaQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};
	appendStringQuery(
		query,
		'phone_number_id',
		getString(ef, 'phoneNumberId', itemIndex),
	);

	return query;
}

export function buildCustomApiQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	for (const entry of getAdvancedFixedCollectionItems<QueryParameterInput>(
		ef,
		'customQueryParameters',
		'parameterValues',
		itemIndex,
	)) {
		if (entry.name) {
			query[entry.name] = entry.value;
		}
	}

	return query;
}

export function buildOperationQuery(
	ef: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): IDataObject {
	if (resource === 'message') {
		if (operation === 'list') {
			return buildMessageQuery(ef, itemIndex, 'list');
		}

		if (operation === 'get') {
			return buildMessageQuery(ef, itemIndex, 'get');
		}

		return {};
	}

	if (resource === 'media' && (operation === 'getUrl' || operation === 'delete')) {
		return buildMediaQuery(ef, itemIndex);
	}

	if (resource === CUSTOM_API_CALL || operation === CUSTOM_API_CALL) {
		return buildCustomApiQuery(ef, itemIndex);
	}

	return {};
}
