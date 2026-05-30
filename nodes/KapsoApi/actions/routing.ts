import {
	ApplicationError,
	IExecuteFunctions,
	IHttpRequestMethods,
} from 'n8n-workflow';
import {
	buildButtonsMessage,
	buildContactMessage,
	buildListMessage,
	buildMarkReadMessage,
	buildMediaMessage,
	buildReactionMessage,
	buildTemplateMessageFromParams,
	buildTextMessage,
	type KapsoButtonInput,
	type KapsoContactInput,
	type KapsoListSectionInput,
	type KapsoTemplateButtonParam,
} from './messagePayloads';
import {
	advancedBodyJson,
	advancedComponentsJson,
	getBoolean,
	getFixedCollectionItems,
	getLinkPreview,
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

	if (!value.startsWith('/')) {
		return `/${value}`;
	}

	return value;
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
				getLinkPreview(ef, itemIndex, getBoolean(ef, 'previewUrl', itemIndex)),
				replyToMessageId,
			),
		};
	}

	if ((messageMediaOperations as readonly string[]).includes(operation)) {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildMediaMessage(
				to,
				mediaOperationType(operation),
				getString(ef, 'mediaSource', itemIndex) as 'id' | 'link',
				getString(ef, 'mediaValue', itemIndex),
				getString(ef, 'caption', itemIndex),
				getString(ef, 'filename', itemIndex),
				replyToMessageId,
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
				getString(ef, 'headerText', itemIndex) || undefined,
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
				replyToMessageId,
			),
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
		const bodyParams = getFixedCollectionItems<{ parameterText: string }>(
			ef,
			'templateBodyParameters',
			'parameterValues',
			itemIndex,
		).map((entry) => entry.parameterText);

		const buttonParams = getFixedCollectionItems<KapsoTemplateButtonParam>(
			ef,
			'templateButtonParameters',
			'buttonValues',
			itemIndex,
		);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildTemplateMessageFromParams(
				to,
				getString(ef, 'templateName', itemIndex),
				getString(ef, 'languageCode', itemIndex),
				bodyParams,
				getString(ef, 'headerParameter', itemIndex) || undefined,
				buttonParams,
				advancedComponentsJson(ef, itemIndex),
			),
		};
	}

	if (operation === 'sendReaction') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildReactionMessage(
				to,
				getString(ef, 'reactionMessageId', itemIndex),
				getString(ef, 'emoji', itemIndex),
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

	if (operation === 'sendRaw') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: advancedBodyJson(ef, itemIndex),
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

		return {
			api: getString(ef, 'customApiSurface', itemIndex) as KapsoRequestArgs['api'],
			method,
			path: customRelativePath(getString(ef, 'customPath', itemIndex)),
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
	};

	const config = configs[`${resource}:${operation}`];
	if (!config) {
		throw new ApplicationError(
			`Operation ${operation} for resource ${resource} is not supported by this Kapso node.`,
		);
	}

	return config();
}
