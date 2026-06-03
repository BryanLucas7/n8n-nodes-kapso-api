import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { CUSTOM_API_CALL } from './operations';
import {
	getAdvancedFixedCollectionItems,
	getAdvancedOptionString,
	getContactListOptionString,
	getConversationListOptionBoolean,
	getConversationListOptionString,
	getPlatformMessageListOptionString,
	getBroadcastListOptionString,
	getString,
} from './nodeHelpers';
import { validateFilterString, validateOptionalUuid } from './validation';

type QueryParameterInput = {
	name: string;
	value: string;
};

function appendStringQuery(query: IDataObject, key: string, value: string | undefined): void {
	if (value) {
		query[key] = value;
	}
}

function appendFilterQuery(
	query: IDataObject,
	key: string,
	value: string,
	label: string,
): void {
	appendStringQuery(query, key, validateFilterString(value, label));
}

function appendOptionalUuidQuery(
	query: IDataObject,
	key: string,
	value: string,
	label: string,
): void {
	appendStringQuery(query, key, validateOptionalUuid(value, label));
}

export function buildMessageQuery(
	ef: IExecuteFunctions,
	itemIndex: number,
	operation: 'list' | 'get',
): IDataObject {
	const query: IDataObject = {};

	if (operation === 'list') {
		appendOptionalUuidQuery(
			query,
			'conversation_id',
			getAdvancedOptionString(ef, itemIndex, 'messageListConversationId'),
			'Conversation ID',
		);
		appendFilterQuery(
			query,
			'direction',
			getAdvancedOptionString(ef, itemIndex, 'messageListDirection'),
			'Direction',
		);
		appendFilterQuery(
			query,
			'status',
			getAdvancedOptionString(ef, itemIndex, 'messageListStatus'),
			'Status',
		);
		appendFilterQuery(query, 'since', getAdvancedOptionString(ef, itemIndex, 'messageListSince'), 'Since');
		appendFilterQuery(query, 'until', getAdvancedOptionString(ef, itemIndex, 'messageListUntil'), 'Until');
		appendFilterQuery(query, 'after', getAdvancedOptionString(ef, itemIndex, 'messageListAfter'), 'After');
		appendFilterQuery(
			query,
			'before',
			getAdvancedOptionString(ef, itemIndex, 'messageListBefore'),
			'Before',
		);
	}

	const customFields = getAdvancedOptionString(ef, itemIndex, 'messageResponseFields');
	if (customFields) {
		query.fields = validateFilterString(customFields, 'Custom Response Fields');
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

	appendFilterQuery(
		query,
		'profile_name_contains',
		getContactListOptionString(ef, itemIndex, 'contactProfileNameContains'),
		'Profile Name Contains',
	);
	appendFilterQuery(
		query,
		'wa_id_contains',
		getContactListOptionString(ef, itemIndex, 'contactWaIdContains'),
		'WhatsApp ID Contains',
	);
	appendOptionalUuidQuery(
		query,
		'customer_id',
		getContactListOptionString(ef, itemIndex, 'contactCustomerIdFilter'),
		'Customer ID',
	);
	appendFilterQuery(
		query,
		'customer_external_id',
		getContactListOptionString(ef, itemIndex, 'contactCustomerExternalIdFilter'),
		'Customer External ID',
	);
	appendFilterQuery(
		query,
		'business_scoped_user_id',
		getContactListOptionString(ef, itemIndex, 'contactBusinessScopedUserId'),
		'Business Scoped User ID',
	);
	appendFilterQuery(
		query,
		'created_after',
		getContactListOptionString(ef, itemIndex, 'contactCreatedAfter'),
		'Created After',
	);
	appendFilterQuery(
		query,
		'created_before',
		getContactListOptionString(ef, itemIndex, 'contactCreatedBefore'),
		'Created Before',
	);

	const hasCustomer = getContactListOptionString(ef, itemIndex, 'contactHasCustomer');
	if (hasCustomer === 'true' || hasCustomer === 'false') {
		query.has_customer = hasCustomer === 'true';
	}

	appendFilterQuery(query, 'after', getContactListOptionString(ef, itemIndex, 'listAfter'), 'After Cursor');
	appendFilterQuery(query, 'before', getContactListOptionString(ef, itemIndex, 'listBefore'), 'Before Cursor');

	return query;
}

export function buildConversationListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendOptionalUuidQuery(
		query,
		'phone_number_id',
		getConversationListOptionString(ef, itemIndex, 'conversationPhoneNumberId'),
		'Filter Phone Number ID',
	);
	appendFilterQuery(
		query,
		'phone_number',
		getConversationListOptionString(ef, itemIndex, 'conversationPhoneNumber'),
		'Filter Phone Number',
	);
	appendFilterQuery(
		query,
		'status',
		getConversationListOptionString(ef, itemIndex, 'conversationStatusFilter'),
		'Status',
	);
	appendOptionalUuidQuery(
		query,
		'assigned_user_id',
		getConversationListOptionString(ef, itemIndex, 'conversationAssignedUserId'),
		'Assigned User ID',
	);
	appendBooleanQuery(
		query,
		'unassigned',
		getConversationListOptionBoolean(ef, itemIndex, 'conversationUnassigned', false),
	);
	appendFilterQuery(
		query,
		'created_after',
		getConversationListOptionString(ef, itemIndex, 'conversationCreatedAfter'),
		'Created After',
	);
	appendFilterQuery(
		query,
		'created_before',
		getConversationListOptionString(ef, itemIndex, 'conversationCreatedBefore'),
		'Created Before',
	);
	appendFilterQuery(
		query,
		'last_active_after',
		getConversationListOptionString(ef, itemIndex, 'conversationLastActiveAfter'),
		'Last Active After',
	);
	appendFilterQuery(
		query,
		'last_active_before',
		getConversationListOptionString(ef, itemIndex, 'conversationLastActiveBefore'),
		'Last Active Before',
	);
	appendFilterQuery(query, 'after', getConversationListOptionString(ef, itemIndex, 'listAfter'), 'After Cursor');
	appendFilterQuery(
		query,
		'before',
		getConversationListOptionString(ef, itemIndex, 'listBefore'),
		'Before Cursor',
	);

	return query;
}

export function buildPlatformMessageListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendStringQuery(query, 'phone_number_id', getString(ef, 'phoneNumberId', itemIndex));
	appendOptionalUuidQuery(
		query,
		'conversation_id',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageConversationId'),
		'Conversation ID',
	);
	appendFilterQuery(
		query,
		'phone_number',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessagePhoneNumber'),
		'Phone Number',
	);
	appendFilterQuery(
		query,
		'business_scoped_user_id',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageBusinessScopedUserId'),
		'Business Scoped User ID',
	);
	appendFilterQuery(
		query,
		'direction',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageDirection'),
		'Direction',
	);
	appendFilterQuery(
		query,
		'status',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageStatus'),
		'Status',
	);
	appendFilterQuery(
		query,
		'message_type',
		getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageType'),
		'Message Type',
	);

	const hasMedia = getPlatformMessageListOptionString(ef, itemIndex, 'platformMessageHasMedia');
	if (hasMedia === 'true' || hasMedia === 'false') {
		query.has_media = hasMedia === 'true';
	}

	appendFilterQuery(query, 'after', getPlatformMessageListOptionString(ef, itemIndex, 'listAfter'), 'After Cursor');
	appendFilterQuery(
		query,
		'before',
		getPlatformMessageListOptionString(ef, itemIndex, 'listBefore'),
		'Before Cursor',
	);

	return query;
}

export function buildBroadcastListQuery(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const query: IDataObject = {};

	appendOptionalUuidQuery(
		query,
		'phone_number_id',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastListPhoneNumberId'),
		'Phone Number ID',
	);
	appendFilterQuery(
		query,
		'status',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastStatusFilter'),
		'Status',
	);
	appendFilterQuery(
		query,
		'created_after',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastCreatedAfter'),
		'Created After',
	);
	appendFilterQuery(
		query,
		'created_before',
		getBroadcastListOptionString(ef, itemIndex, 'broadcastCreatedBefore'),
		'Created Before',
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
