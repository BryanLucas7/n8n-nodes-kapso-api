import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { CUSTOM_API_CALL } from './operations';
import {
	getAdvancedFixedCollectionItems,
	getAdvancedOptionString,
	getPlatformListOptionBoolean,
	getPlatformListOptionString,
	getPlatformMessageListOptionString,
	getBroadcastListOptionString,
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
	} else if (operation === 'list' || operation === 'get') {
		query.fields = 'kapso()';
	}

	return query;
}

function appendBooleanQuery(query: IDataObject, key: string, value: boolean): void {
	if (value) {
		query[key] = true;
	}
}

export function buildContactListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendStringQuery(
		query,
		'profile_name_contains',
		getPlatformListOptionString(ef, itemIndex, 'contactProfileNameContains'),
	);
	appendStringQuery(
		query,
		'wa_id_contains',
		getPlatformListOptionString(ef, itemIndex, 'contactWaIdContains'),
	);
	appendStringQuery(
		query,
		'customer_id',
		getPlatformListOptionString(ef, itemIndex, 'contactCustomerIdFilter'),
	);
	appendStringQuery(
		query,
		'customer_external_id',
		getPlatformListOptionString(ef, itemIndex, 'contactCustomerExternalIdFilter'),
	);
	appendStringQuery(
		query,
		'business_scoped_user_id',
		getPlatformListOptionString(ef, itemIndex, 'contactBusinessScopedUserId'),
	);
	appendStringQuery(
		query,
		'created_after',
		getPlatformListOptionString(ef, itemIndex, 'contactCreatedAfter'),
	);
	appendStringQuery(
		query,
		'created_before',
		getPlatformListOptionString(ef, itemIndex, 'contactCreatedBefore'),
	);

	const hasCustomer = getPlatformListOptionString(ef, itemIndex, 'contactHasCustomer');
	if (hasCustomer === 'true' || hasCustomer === 'false') {
		query.has_customer = hasCustomer === 'true';
	}

	appendStringQuery(query, 'after', getPlatformListOptionString(ef, itemIndex, 'listAfter'));
	appendStringQuery(query, 'before', getPlatformListOptionString(ef, itemIndex, 'listBefore'));

	return query;
}

export function buildConversationListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendStringQuery(
		query,
		'phone_number_id',
		getPlatformListOptionString(ef, itemIndex, 'conversationPhoneNumberId'),
	);
	appendStringQuery(
		query,
		'phone_number',
		getPlatformListOptionString(ef, itemIndex, 'conversationPhoneNumber'),
	);
	appendStringQuery(
		query,
		'status',
		getPlatformListOptionString(ef, itemIndex, 'conversationStatusFilter'),
	);
	appendStringQuery(
		query,
		'assigned_user_id',
		getPlatformListOptionString(ef, itemIndex, 'conversationAssignedUserId'),
	);
	appendBooleanQuery(
		query,
		'unassigned',
		getPlatformListOptionBoolean(ef, itemIndex, 'conversationUnassigned', false),
	);
	appendStringQuery(
		query,
		'created_after',
		getPlatformListOptionString(ef, itemIndex, 'conversationCreatedAfter'),
	);
	appendStringQuery(
		query,
		'created_before',
		getPlatformListOptionString(ef, itemIndex, 'conversationCreatedBefore'),
	);
	appendStringQuery(
		query,
		'last_active_after',
		getPlatformListOptionString(ef, itemIndex, 'conversationLastActiveAfter'),
	);
	appendStringQuery(
		query,
		'last_active_before',
		getPlatformListOptionString(ef, itemIndex, 'conversationLastActiveBefore'),
	);
	appendStringQuery(query, 'after', getPlatformListOptionString(ef, itemIndex, 'listAfter'));
	appendStringQuery(query, 'before', getPlatformListOptionString(ef, itemIndex, 'listBefore'));

	return query;
}

export function buildPlatformMessageListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendStringQuery(query, 'phone_number_id', getString(ef, 'phoneNumberId', itemIndex));
	appendStringQuery(
		query,
		'conversation_id',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageConversationId'),
	);
	appendStringQuery(
		query,
		'phone_number',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessagePhoneNumber'),
	);
	appendStringQuery(
		query,
		'business_scoped_user_id',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageBusinessScopedUserId'),
	);
	appendStringQuery(
		query,
		'direction',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageDirection'),
	);
	appendStringQuery(
		query,
		'status',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageStatus'),
	);
	appendStringQuery(
		query,
		'message_type',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageType'),
	);

	const hasMedia = getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageHasMedia');
	if (hasMedia === 'true' || hasMedia === 'false') {
		query.has_media = hasMedia === 'true';
	}

	appendStringQuery(query, 'after', getPlatformMessageListOptionString(ef, itemIndex, 'listAfter'));
	appendStringQuery(query, 'before', getPlatformMessageListOptionString(ef, itemIndex, 'listBefore'));

	return query;
}

export function buildBroadcastListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendStringQuery(
		query,
		'phone_number_id',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastListPhoneNumberId'),
	);
	appendStringQuery(
		query,
		'status',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastStatusFilter'),
	);
	appendStringQuery(
		query,
		'created_after',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastCreatedAfter'),
	);
	appendStringQuery(
		query,
		'created_before',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastCreatedBefore'),
	);

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

	if (resource === 'contact' && operation === 'list') {
		return buildContactListQuery(ef, itemIndex);
	}

	if (resource === 'conversation' && operation === 'list') {
		return buildConversationListQuery(ef, itemIndex);
	}

	if (resource === 'platformMessage' && operation === 'list') {
		return buildPlatformMessageListQuery(ef, itemIndex);
	}

	if (resource === 'broadcast' && operation === 'list') {
		return buildBroadcastListQuery(ef, itemIndex);
	}

	if (resource === 'media' && (operation === 'getUrl' || operation === 'delete')) {
		return buildMediaQuery(ef, itemIndex);
	}

	if (resource === CUSTOM_API_CALL || operation === CUSTOM_API_CALL) {
		return buildCustomApiQuery(ef, itemIndex);
	}

	return {};
}
