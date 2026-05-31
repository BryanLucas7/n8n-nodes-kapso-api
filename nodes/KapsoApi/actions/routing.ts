import {
	ApplicationError,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
} from 'n8n-workflow';
import {
	buildButtonsMessage,
	buildCallPermissionMessage,
	buildCatalogMessage,
	buildContactMessage,
	buildCtaUrlMessage,
	buildFlowMessage,
	buildListMessage,
	buildLocationMessage,
	buildMarkReadMessage,
	buildMediaMessage,
	buildProductListMessage,
	buildProductMessage,
	buildReactionMessage,
	buildRequestLocationMessage,
	buildStickerMessage,
	buildTemplateMessageFromParams,
	buildTextMessage,
	type CtaHeaderType,
	type KapsoButtonInput,
	type KapsoContactInput,
	type KapsoListSectionInput,
	type KapsoProductSectionInput,
} from './messagePayloads';
import { buildSendTemplateComponentsInput } from './templateInput';
import {
	getBoolean,
	getFixedCollectionItems,
	getLinkPreview,
	getNumber,
	getOptionalJsonObject,
	getReplyToMessageId,
	getString,
	bodyJson,
} from './nodeHelpers';
import { buildMessageQuery, buildOperationQuery } from './queryBuilders';
import {
	buildBlockUsersBody,
	buildBroadcastAddRecipientsBody,
	buildBroadcastCreateBody,
	buildBroadcastScheduleBody,
	buildContactCreateBody,
	buildContactUpdateBody,
	buildConversationStatusBody,
	buildMediaIngestBody,
} from './platformPayloads';
import { CUSTOM_API_CALL, messageMediaOperations } from './operations';
import { KapsoRequestArgs } from '../transport/types';
import { assertCustomRelativePath, requireNonEmptyString } from './validation';

export function pathId(value: string, label: string): string {
	if (!value) {
		throw new ApplicationError(`${label} is required.`);
	}

	return encodeURIComponent(value);
}

export function customRelativePath(value: string): string {
	if (!value) {
		throw new ApplicationError('Custom Relative Path is required.');
	}

	if (/^https?:\/\//i.test(value) || value.startsWith('//')) {
		throw new ApplicationError('Custom Relative Path must be relative, for example /whatsapp/phone_numbers.');
	}

	assertCustomRelativePath(value);

	if (!value.startsWith('/')) {
		return `/${value}`;
	}

	return value;
}

export function resolveWhatsappCustomPath(
	phoneNumberId: string,
	relativePath: string,
): string {
	const path = customRelativePath(relativePath);

	if (!phoneNumberId || /^\/\d+/.test(path) || path.startsWith('/whatsapp')) {
		return path;
	}

	return `/${phoneNumberId}${path}`;
}

function assertWhatsappCustomPhoneRequired(phoneNumberId: string, relativePath: string): void {
	const path = customRelativePath(relativePath);
	const needsPhonePrefix = !(/^\/\d+/.test(path) || path.startsWith('/whatsapp'));

	if (needsPhonePrefix && !phoneNumberId) {
		throw new ApplicationError(
			'Phone Number is required for WhatsApp API paths such as /messages.',
		);
	}
}

function messagePath(ef: IExecuteFunctions, itemIndex: number, suffix = ''): string {
	const phoneNumberId = pathId(getString(ef, 'phoneNumberId', itemIndex), 'Phone Number ID');
	return `/${phoneNumberId}/messages${suffix}`;
}

function mediaOperationType(operation: string): string {
	const map: Record<string, string> = {
		sendImage: 'image',
		sendVideo: 'video',
		sendAudio: 'audio',
		sendDocument: 'document',
	};
	return map[operation] ?? 'image';
}

function extractListRows(
	rowValues: unknown,
): KapsoListSectionInput['rows'] {
	if (!rowValues) {
		return [];
	}

	if (Array.isArray(rowValues)) {
		return rowValues.flatMap((entry) => {
			if (entry && typeof entry === 'object' && 'rowId' in entry) {
				return [
					{
						rowId: String(entry.rowId),
						rowTitle: String(entry.rowTitle),
						rowDescription: entry.rowDescription ? String(entry.rowDescription) : undefined,
					},
				];
			}

			if (entry && typeof entry === 'object' && Array.isArray((entry as { row?: unknown[] }).row)) {
				return ((entry as { row: KapsoListSectionInput['rows'] }).row ?? []).map((row) => ({
					rowId: row.rowId,
					rowTitle: row.rowTitle,
					rowDescription: row.rowDescription,
				}));
			}

			return [];
		});
	}

	if (typeof rowValues === 'object' && Array.isArray((rowValues as { row?: unknown[] }).row)) {
		return ((rowValues as { row: KapsoListSectionInput['rows'] }).row ?? []).map((row) => ({
			rowId: row.rowId,
			rowTitle: row.rowTitle,
			rowDescription: row.rowDescription,
		}));
	}

	return [];
}

function extractProductRetailerIds(productItems: unknown): string[] {
	if (!productItems) {
		return [];
	}

	if (Array.isArray(productItems)) {
		return productItems.flatMap((entry) => {
			if (entry && typeof entry === 'object' && 'productRetailerId' in entry) {
				return [String(entry.productRetailerId)];
			}

			if (entry && typeof entry === 'object' && Array.isArray((entry as { product?: unknown[] }).product)) {
				return ((entry as { product: Array<{ productRetailerId: string }> }).product ?? []).map(
					(product) => product.productRetailerId,
				);
			}

			return [];
		});
	}

	if (typeof productItems === 'object' && Array.isArray((productItems as { product?: unknown[] }).product)) {
		return ((productItems as { product: Array<{ productRetailerId: string }> }).product ?? []).map(
			(product) => product.productRetailerId,
		);
	}

	return [];
}

export function buildMessageRequest(
	ef: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): KapsoRequestArgs {
	const phonePath = messagePath(ef, itemIndex);
	const to = getString(ef, 'recipient', itemIndex);
	const replyToMessageId = getReplyToMessageId(ef, itemIndex);

	if (operation === 'sendText') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildTextMessage(
				to,
				getString(ef, 'textBody', itemIndex),
				getLinkPreview(ef, itemIndex, false),
				replyToMessageId,
			),
		};
	}

	if ((messageMediaOperations as readonly string[]).includes(operation)) {
		const isVoiceNote =
			operation === 'sendAudio' && getBoolean(ef, 'sendAsVoiceNote', itemIndex);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildMediaMessage(
				to,
				mediaOperationType(operation),
				getString(ef, 'mediaSource', itemIndex) as 'id' | 'link',
				getString(ef, 'mediaValue', itemIndex),
				operation === 'sendAudio' ? undefined : getString(ef, 'caption', itemIndex) || undefined,
				getString(ef, 'filename', itemIndex),
				replyToMessageId,
				isVoiceNote,
			),
		};
	}

	if (operation === 'sendButtons') {
		const buttons = getFixedCollectionItems<KapsoButtonInput>(
			ef,
			'buttons',
			'buttonValues',
			itemIndex,
		);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildButtonsMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				buttons,
				getString(ef, 'buttonHeaderType', itemIndex) || 'none',
				getString(ef, 'headerText', itemIndex) || undefined,
				(getString(ef, 'buttonHeaderMediaSource', itemIndex) || 'link') as 'link' | 'id',
				getString(ef, 'buttonHeaderMediaUrl', itemIndex) || undefined,
				getString(ef, 'buttonHeaderMediaId', itemIndex) || undefined,
				getString(ef, 'buttonHeaderDocumentFilename', itemIndex) || undefined,
				getString(ef, 'footerText', itemIndex) || undefined,
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendList') {
		const sectionValues = getFixedCollectionItems<{
			sectionTitle: string;
			rowValues?: Array<{
				rowId: string;
				rowTitle: string;
				rowDescription?: string;
			}>;
		}>(ef, 'sections', 'sectionValues', itemIndex);

		const listSections: KapsoListSectionInput[] = sectionValues.map((section) => ({
			sectionTitle: section.sectionTitle,
			rows: extractListRows(section.rowValues),
		}));

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildListMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				getString(ef, 'listButtonText', itemIndex),
				listSections,
				getString(ef, 'footerText', itemIndex) || undefined,
				getString(ef, 'listHeaderType', itemIndex) || 'none',
				getString(ef, 'listHeaderText', itemIndex) || undefined,
				(getString(ef, 'listHeaderMediaSource', itemIndex) || 'link') as 'link' | 'id',
				getString(ef, 'listHeaderMediaUrl', itemIndex) || undefined,
				getString(ef, 'listHeaderMediaId', itemIndex) || undefined,
				getString(ef, 'listHeaderDocumentFilename', itemIndex) || undefined,
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendLocation') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildLocationMessage(
				to,
				getNumber(ef, 'locationLatitude', itemIndex, 0),
				getNumber(ef, 'locationLongitude', itemIndex, 0),
				getString(ef, 'locationName', itemIndex) || undefined,
				getString(ef, 'locationAddress', itemIndex) || undefined,
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendSticker') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildStickerMessage(
				to,
				getString(ef, 'stickerSource', itemIndex) as 'id' | 'link',
				getString(ef, 'stickerValue', itemIndex),
				replyToMessageId,
			),
		};
	}

	if (operation === 'requestLocation') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildRequestLocationMessage(to, getString(ef, 'bodyText', itemIndex)),
		};
	}

	if (operation === 'sendCtaUrl') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildCtaUrlMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				getString(ef, 'ctaButtonLabel', itemIndex),
				getString(ef, 'ctaButtonUrl', itemIndex),
				getString(ef, 'ctaHeaderType', itemIndex) as CtaHeaderType,
				getString(ef, 'ctaHeaderText', itemIndex) || undefined,
				(getString(ef, 'ctaHeaderMediaSource', itemIndex) || 'link') as 'link' | 'id',
				getString(ef, 'ctaHeaderMediaUrl', itemIndex) || undefined,
				getString(ef, 'ctaHeaderMediaId', itemIndex) || undefined,
				getString(ef, 'ctaHeaderDocumentFilename', itemIndex) || undefined,
				getString(ef, 'footerText', itemIndex) || undefined,
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendProduct') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildProductMessage(
				to,
				getString(ef, 'catalogId', itemIndex),
				getString(ef, 'productRetailerId', itemIndex),
				getString(ef, 'bodyText', itemIndex) || undefined,
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendProductList') {
		const sectionValues = getFixedCollectionItems<IDataObject & {
			sectionTitle: string;
			productItems?: IDataObject | IDataObject[];
		}>(ef, 'productSections', 'sectionValues', itemIndex);

		const productSections: KapsoProductSectionInput[] = sectionValues.map((section) => ({
			sectionTitle: section.sectionTitle,
			productRetailerIds: extractProductRetailerIds(section.productItems),
		}));

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildProductListMessage(
				to,
				getString(ef, 'catalogId', itemIndex),
				getString(ef, 'bodyText', itemIndex),
				productSections,
				getString(ef, 'productListHeaderType', itemIndex) || 'text',
				getString(ef, 'productListHeaderText', itemIndex) || undefined,
				(getString(ef, 'productListHeaderMediaSource', itemIndex) || 'link') as 'link' | 'id',
				getString(ef, 'productListHeaderMediaUrl', itemIndex) || undefined,
				getString(ef, 'productListHeaderMediaId', itemIndex) || undefined,
				getString(ef, 'productListHeaderDocumentFilename', itemIndex) || undefined,
				getString(ef, 'footerText', itemIndex) || undefined,
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendCatalog') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildCatalogMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				getString(ef, 'catalogThumbnailProductId', itemIndex),
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendFlow') {
		const flowAction = getString(ef, 'flowAction', itemIndex) as 'navigate' | 'data_exchange';
		const flowId = getString(ef, 'flowId', itemIndex) || undefined;
		const flowName = getString(ef, 'flowName', itemIndex) || undefined;

		if (!flowId && !flowName) {
			throw new ApplicationError('Provide a Flow ID or Flow Name.');
		}

		if (flowId && flowName) {
			throw new ApplicationError('Provide only one of Flow ID or Flow Name.');
		}

		const flowCta = requireNonEmptyString(getString(ef, 'flowCta', itemIndex), 'Flow CTA');
		const flowToken = requireNonEmptyString(getString(ef, 'flowToken', itemIndex), 'Flow token');

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildFlowMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				flowCta,
				flowToken,
				getString(ef, 'flowMessageVersion', itemIndex) || '3',
				flowAction,
				getString(ef, 'flowScreen', itemIndex) || undefined,
				getOptionalJsonObject(ef, 'flowInitialDataJson', itemIndex, 'Flow Initial Data JSON'),
				replyToMessageId,
				(getString(ef, 'flowMode', itemIndex) || undefined) as 'draft' | 'published' | undefined,
				getString(ef, 'flowHeaderType', itemIndex) || undefined,
				getString(ef, 'flowHeaderText', itemIndex) || undefined,
				(getString(ef, 'flowHeaderMediaSource', itemIndex) || 'link') as 'link' | 'id',
				getString(ef, 'flowHeaderMediaUrl', itemIndex) || undefined,
				getString(ef, 'flowHeaderMediaId', itemIndex) || undefined,
				getString(ef, 'flowHeaderDocumentFilename', itemIndex) || undefined,
				getString(ef, 'flowFooterText', itemIndex) || undefined,
				flowId,
				flowName,
			),
		};
	}

	if (operation === 'sendCallPermission') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildCallPermissionMessage(to, getString(ef, 'bodyText', itemIndex)),
		};
	}

	if (operation === 'sendContact') {
		const contacts = getFixedCollectionItems<KapsoContactInput>(
			ef,
			'contacts',
			'contactValues',
			itemIndex,
		);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildContactMessage(to, contacts),
		};
	}

	if (operation === 'sendTemplate') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildTemplateMessageFromParams(
				to,
				getString(ef, 'templateName', itemIndex),
				getString(ef, 'languageCode', itemIndex),
				buildSendTemplateComponentsInput(ef, itemIndex),
			),
		};
	}

	if (operation === 'sendReaction') {
		const removeReaction = getBoolean(ef, 'removeReaction', itemIndex);
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildReactionMessage(
				to,
				getString(ef, 'reactionMessageId', itemIndex),
				removeReaction ? '' : getString(ef, 'emoji', itemIndex),
			),
		};
	}

	if (operation === 'markRead') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildMarkReadMessage(
				getString(ef, 'messageId', itemIndex),
				getBoolean(ef, 'typingIndicator', itemIndex),
			),
		};
	}

	if (operation === 'list') {
		return {
			api: 'whatsapp',
			method: 'GET' as IHttpRequestMethods,
			path: phonePath,
			query: buildMessageQuery(ef, itemIndex, 'list'),
		};
	}

	if (operation === 'get') {
		return {
			api: 'whatsapp',
			method: 'GET' as IHttpRequestMethods,
			path: messagePath(
				ef,
				itemIndex,
				`/${pathId(getString(ef, 'messageId', itemIndex), 'Message ID')}`,
			),
			query: buildMessageQuery(ef, itemIndex, 'get'),
		};
	}

	throw new ApplicationError(`Unsupported message operation: ${operation}`);
}

export function buildRequest(
	ef: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): KapsoRequestArgs {
	const query = buildOperationQuery(ef, resource, operation, itemIndex);
	if (resource === CUSTOM_API_CALL || operation === CUSTOM_API_CALL) {
		const method = getString(ef, 'customMethod', itemIndex) as IHttpRequestMethods;
		const body = bodyJson(ef, itemIndex);
		const hasBody = Object.keys(body).length > 0;
		const api = getString(ef, 'customApiSurface', itemIndex) as KapsoRequestArgs['api'];
		const relativePath = getString(ef, 'customPath', itemIndex);
		const phoneNumberId = getString(ef, 'phoneNumberId', itemIndex);
		if (api === 'whatsapp') {
			assertWhatsappCustomPhoneRequired(phoneNumberId, relativePath);
		}

		const path =
			api === 'whatsapp'
				? resolveWhatsappCustomPath(phoneNumberId, relativePath)
				: customRelativePath(relativePath);

		return {
			api,
			method,
			path,
			query,
			...(method !== 'GET' || hasBody ? { body } : {}),
		};
	}

	const phoneNumberId = () => pathId(getString(ef, 'phoneNumberId', itemIndex), 'Phone Number ID');
	const conversationId = () => pathId(getString(ef, 'conversationId', itemIndex), 'Conversation ID');
	const contactIdentifier = () =>
		pathId(getString(ef, 'contactIdentifier', itemIndex), 'Contact Identifier');
	const broadcastId = () => pathId(getString(ef, 'broadcastId', itemIndex), 'Broadcast ID');
	const mediaId = () => pathId(getString(ef, 'mediaId', itemIndex), 'Media ID');

	if (resource === 'message') {
		return buildMessageRequest(ef, operation, itemIndex);
	}

	const configs: Record<string, () => KapsoRequestArgs> = {
		'media:uploadFromUrl': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: '/whatsapp/media',
			body: buildMediaIngestBody(ef, itemIndex),
		}),
		'media:getUrl': () => ({
			api: 'whatsapp',
			method: 'GET' as IHttpRequestMethods,
			path: `/${mediaId()}`,
			query,
		}),
		'media:download': () => ({
			api: 'mediaDownload',
			method: 'GET' as IHttpRequestMethods,
			path: '/media_download',
			query: { token: getString(ef, 'downloadToken', itemIndex) },
			requiresAuth: false,
			json: false,
			encoding: null,
			returnFullResponse: true,
		}),
		'media:delete': () => ({
			api: 'whatsapp',
			method: 'DELETE' as IHttpRequestMethods,
			path: `/${mediaId()}`,
			query,
		}),
		'conversation:get': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: `/whatsapp/conversations/${conversationId()}`,
			query,
		}),
		'conversation:list': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: '/whatsapp/conversations',
			query,
		}),
		'conversation:updateStatus': () => ({
			api: 'platform',
			method: 'PATCH' as IHttpRequestMethods,
			path: `/whatsapp/conversations/${conversationId()}`,
			body: buildConversationStatusBody(ef, itemIndex),
		}),
		'contact:get': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: `/whatsapp/contacts/${contactIdentifier()}`,
			query,
		}),
		'contact:list': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: '/whatsapp/contacts',
			query,
		}),
		'contact:create': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: '/whatsapp/contacts',
			body: buildContactCreateBody(ef, itemIndex),
		}),
		'contact:update': () => ({
			api: 'platform',
			method: 'PATCH' as IHttpRequestMethods,
			path: `/whatsapp/contacts/${contactIdentifier()}`,
			body: buildContactUpdateBody(ef, itemIndex),
		}),
		'contact:erase': () => ({
			api: 'platform',
			method: 'DELETE' as IHttpRequestMethods,
			path: `/whatsapp/contacts/${contactIdentifier()}`,
			query,
		}),
		'broadcast:get': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: `/whatsapp/broadcasts/${broadcastId()}`,
			query,
		}),
		'broadcast:list': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: '/whatsapp/broadcasts',
			query,
		}),
		'broadcast:create': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: '/whatsapp/broadcasts',
			body: buildBroadcastCreateBody(ef, itemIndex),
		}),
		'broadcast:addRecipients': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: `/whatsapp/broadcasts/${broadcastId()}/recipients`,
			body: buildBroadcastAddRecipientsBody(ef, itemIndex),
		}),
		'broadcast:listRecipients': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: `/whatsapp/broadcasts/${broadcastId()}/recipients`,
			query,
		}),
		'broadcast:send': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: `/whatsapp/broadcasts/${broadcastId()}/send`,
		}),
		'broadcast:schedule': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: `/whatsapp/broadcasts/${broadcastId()}/schedule`,
			body: buildBroadcastScheduleBody(ef, itemIndex),
		}),
		'broadcast:cancel': () => ({
			api: 'platform',
			method: 'POST' as IHttpRequestMethods,
			path: `/whatsapp/broadcasts/${broadcastId()}/cancel`,
		}),
		'blockUser:block': () => ({
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: `/${phoneNumberId()}/block_users`,
			body: buildBlockUsersBody(ef, itemIndex),
		}),
		'blockUser:unblock': () => ({
			api: 'whatsapp',
			method: 'DELETE' as IHttpRequestMethods,
			path: `/${phoneNumberId()}/block_users`,
			body: buildBlockUsersBody(ef, itemIndex),
		}),
		'platformMessage:list': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: '/whatsapp/messages',
			query,
		}),
		'platformMessage:get': () => ({
			api: 'platform',
			method: 'GET' as IHttpRequestMethods,
			path: `/whatsapp/messages/${pathId(getString(ef, 'platformMessageId', itemIndex), 'Message ID')}`,
		}),
	};

	const config = configs[`${resource}:${operation}`];
	if (!config) {
		throw new ApplicationError(
			`Operation ${operation} for resource ${resource} is not supported by this Kapso node.`,
		);
	}

	return config();
}
