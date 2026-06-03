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
	buildCtaCallMessage,
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
	type KapsoListSectionInput,
	type KapsoProductSectionInput,
} from './messagePayloads';
import { normalizeContactInputs } from './contactInput';
import { validateFlowInitialDataAtExecute } from './flowMapperInput';
import { buildSendTemplateComponentsInput } from './templateInput';
import {
	resolveBusinessAccountIdForExecute,
	resolveSendTemplateContext,
} from '../loadOptions/templateFetch';
import {
	parseFlowSelection,
	resolveFlowAction,
	resolveFlowCta,
	resolveFlowMessageVersion,
	resolveFlowMode,
	resolveFlowToken,
} from '../loadOptions/flowSelection';
import { readFlowModeFromExecuteParameters } from '../loadOptions/flowModeHelpers';
import { enrichFlowSelectionForExecute } from '../loadOptions/flowAssets';
import {
	getBoolean,
	getFixedCollectionItems,
	getLinkPreview,
	getMetaPhoneResourceLocatorValue,
	getNumber,
	getReplyToMessageId,
	getString,
	getValidatedMediaSourceValue,
	readStringParameterValue,
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
import {
	assertCustomRelativePath,
	assertMetaRecipientPhone,
	assertReactionEmoji,
	assertUuid,
	assertWamid,
	validateDownloadToken,
} from './validation';

export function pathId(value: string, label: string): string {
	if (!value) {
		throw new ApplicationError(`${label} is required.`);
	}

	return encodeURIComponent(value);
}

export function pathUuidId(value: string, label: string): string {
	return encodeURIComponent(assertUuid(value, label));
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
				return (entry as { row: KapsoListSectionInput['rows'] }).row.map((row) => ({
					rowId: row.rowId,
					rowTitle: row.rowTitle,
					rowDescription: row.rowDescription,
				}));
			}

			return [];
		});
	}

	if (typeof rowValues === 'object' && Array.isArray((rowValues as { row?: unknown[] }).row)) {
		return (rowValues as { row: KapsoListSectionInput['rows'] }).row.map((row) => ({
			rowId: row.rowId,
			rowTitle: row.rowTitle,
			rowDescription: row.rowDescription,
		}));
	}

	return [];
}

function readProductRetailerId(value: unknown): string {
	return readStringParameterValue(value).trim();
}

function extractProductRetailerIds(productItems: unknown): string[] {
	if (!productItems) {
		return [];
	}

	if (Array.isArray(productItems)) {
		return productItems.flatMap((entry) => {
			if (entry && typeof entry === 'object' && 'productRetailerId' in entry) {
				const retailerId = readProductRetailerId((entry as { productRetailerId?: unknown }).productRetailerId);
				return retailerId ? [retailerId] : [];
			}

			if (entry && typeof entry === 'object' && Array.isArray((entry as { product?: unknown[] }).product)) {
				return (entry as { product: Array<{ productRetailerId?: unknown }> }).product
					.map((product) => readProductRetailerId(product.productRetailerId))
					.filter(Boolean);
			}

			return [];
		});
	}

	if (typeof productItems === 'object' && Array.isArray((productItems as { product?: unknown[] }).product)) {
		return (productItems as { product: Array<{ productRetailerId?: unknown }> }).product
			.map((product) => readProductRetailerId(product.productRetailerId))
			.filter(Boolean);
	}

	return [];
}

export function buildMessageRequest(
	ef: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): KapsoRequestArgs {
	const phonePath = messagePath(ef, itemIndex);

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

	if (operation === 'markRead') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildMarkReadMessage(
				assertWamid(getString(ef, 'messageId', itemIndex), 'Message ID'),
				getBoolean(ef, 'typingIndicator', itemIndex),
			),
		};
	}

	const to = assertMetaRecipientPhone(
		getMetaPhoneResourceLocatorValue(ef, 'recipient', itemIndex, 'Recipient Phone'),
	);
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
		const media = getValidatedMediaSourceValue(
			ef,
			'mediaSource',
			'mediaId',
			'mediaUrl',
			itemIndex,
			{ id: 'Media ID', url: 'Public URL' },
		);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildMediaMessage(
				to,
				mediaOperationType(operation),
				media.source,
				media.value,
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
		const sticker = getValidatedMediaSourceValue(
			ef,
			'stickerSource',
			'stickerMediaId',
			'stickerMediaUrl',
			itemIndex,
			{ id: 'Sticker Media ID', url: 'Public URL' },
		);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildStickerMessage(
				to,
				sticker.source,
				sticker.value,
				replyToMessageId,
			),
		};
	}

	if (operation === 'requestLocation') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildRequestLocationMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendCta') {
		const ctaType = getString(ef, 'ctaType', itemIndex) || 'url';

		if (ctaType === 'phone') {
			return {
				api: 'whatsapp',
				method: 'POST' as IHttpRequestMethods,
				path: phonePath,
				body: buildCtaCallMessage(
					to,
					getString(ef, 'bodyText', itemIndex),
					getString(ef, 'ctaButtonLabel', itemIndex),
					getString(ef, 'ctaButtonPhone', itemIndex),
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
		throw new ApplicationError('Use buildSendFlowRequest for sendFlow operations.');
	}

	if (operation === 'sendCallPermission') {
		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildCallPermissionMessage(
				to,
				getString(ef, 'bodyText', itemIndex),
				replyToMessageId,
			),
		};
	}

	if (operation === 'sendContact') {
		const contacts = normalizeContactInputs(
			getFixedCollectionItems<IDataObject>(ef, 'contacts', 'contactValues', itemIndex),
		);

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildContactMessage(to, contacts, getReplyToMessageId(ef, itemIndex)),
		};
	}

	if (operation === 'sendTemplate') {
		throw new ApplicationError(
			'Send Template requests are built asynchronously. Use buildSendTemplateRequest instead of buildRequest.',
		);
	}

	if (operation === 'sendReaction') {
		const reactionMode = getString(ef, 'reactionMode', itemIndex) || 'react';
		const reactionMessageId = assertWamid(
			getString(ef, 'reactionMessageId', itemIndex),
			'React To Message ID',
		);
		const emoji =
			reactionMode === 'remove' ? '' : assertReactionEmoji(getString(ef, 'emoji', itemIndex));

		return {
			api: 'whatsapp',
			method: 'POST' as IHttpRequestMethods,
			path: phonePath,
			body: buildReactionMessage(
				to,
				reactionMessageId,
				emoji,
			),
		};
	}

	throw new ApplicationError(`Unsupported message operation: ${operation}`);
}

export async function buildSendFlowRequest(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<KapsoRequestArgs> {
	const phonePath = messagePath(ef, itemIndex);
	const to = assertMetaRecipientPhone(
		getMetaPhoneResourceLocatorValue(ef, 'recipient', itemIndex, 'Recipient Phone'),
	);
	const replyToMessageId = getReplyToMessageId(ef, itemIndex);
	const flowSelection = await enrichFlowSelectionForExecute(
		ef,
		itemIndex,
		parseFlowSelection(getString(ef, 'flowId', itemIndex)),
	);

	if (!flowSelection.metaFlowId) {
		throw new ApplicationError('Select a Flow or provide a Meta Flow ID.');
	}

	const flowCta = resolveFlowCta(getString(ef, 'flowCta', itemIndex), flowSelection.flowName);
	const flowToken = resolveFlowToken(getString(ef, 'flowToken', itemIndex), flowSelection.metaFlowId);
	const userFlowAction = getString(ef, 'flowAction', itemIndex);
	const flowAction = resolveFlowAction(userFlowAction, flowSelection);
	const flowOptions = ef.getNodeParameter('flowOptions', itemIndex, {}) as { flowMode?: string };
	const flowMode = resolveFlowMode(
		readFlowModeFromExecuteParameters(ef.getNodeParameter('flowMode', itemIndex), flowOptions),
		flowSelection,
	);
	let flowScreen = getString(ef, 'flowScreen', itemIndex) || undefined;

	if (!flowScreen && flowAction === 'navigate') {
		flowScreen = flowSelection.defaultScreen;
	}

	if (
		flowAction === 'data_exchange' &&
		flowSelection.hasDataEndpoint === true &&
		flowSelection.flowsEncryptionConfigured === false
	) {
		throw new ApplicationError(
			'This Flow uses a data endpoint but Flow encryption is not configured. Configure it in Kapso Dashboard > WhatsApp > Flows > [Flow] > Encryption before sending data-exchange messages.',
		);
	}

	return {
		api: 'whatsapp',
		method: 'POST' as IHttpRequestMethods,
		path: phonePath,
		body: buildFlowMessage(
			to,
			getString(ef, 'bodyText', itemIndex),
			flowCta,
			flowToken,
			resolveFlowMessageVersion('', flowSelection),
			flowAction,
			flowScreen,
			await validateFlowInitialDataAtExecute(ef, itemIndex),
			replyToMessageId,
			flowMode,
			getString(ef, 'flowHeaderType', itemIndex) || undefined,
			getString(ef, 'flowHeaderText', itemIndex) || undefined,
			(getString(ef, 'flowHeaderMediaSource', itemIndex) || 'link') as 'link' | 'id',
			getString(ef, 'flowHeaderMediaUrl', itemIndex) || undefined,
			getString(ef, 'flowHeaderMediaId', itemIndex) || undefined,
			getString(ef, 'flowHeaderDocumentFilename', itemIndex) || undefined,
			getString(ef, 'flowFooterText', itemIndex) || undefined,
			flowSelection.metaFlowId,
			undefined,
		),
	};
}

export async function buildGetCatalogRequest(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<KapsoRequestArgs> {
	const phoneNumberId = getString(ef, 'phoneNumberId', itemIndex);
	const wabaId = await resolveBusinessAccountIdForExecute(ef, phoneNumberId, itemIndex);

	if (!wabaId) {
		throw new ApplicationError(
			'Could not resolve the WhatsApp Business Account for the selected phone number.',
		);
	}

	return {
		api: 'whatsapp',
		method: 'GET' as IHttpRequestMethods,
		path: `/${pathId(wabaId, 'WhatsApp Business Account ID')}/product_catalogs`,
	};
}

export async function buildSendTemplateRequest(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<KapsoRequestArgs> {
	const phoneNumberId = pathId(getString(ef, 'phoneNumberId', itemIndex), 'Phone Number ID');
	const to = assertMetaRecipientPhone(
		getMetaPhoneResourceLocatorValue(ef, 'recipient', itemIndex, 'Recipient Phone'),
	);

	const { identity, definition } = await resolveSendTemplateContext(ef, itemIndex);

	return {
		api: 'whatsapp',
		method: 'POST' as IHttpRequestMethods,
		path: `/${phoneNumberId}/messages`,
		body: buildTemplateMessageFromParams(
			to,
			identity.name,
			identity.language,
			await buildSendTemplateComponentsInput(ef, itemIndex, definition),
		),
	};
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
	const conversationId = () => pathUuidId(getString(ef, 'conversationId', itemIndex), 'Conversation ID');
	const contactIdentifier = () =>
		pathId(getString(ef, 'contactIdentifier', itemIndex), 'Contact Identifier');
	const broadcastId = () => pathUuidId(getString(ef, 'broadcastId', itemIndex), 'Broadcast ID');
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
			query: { token: validateDownloadToken(getString(ef, 'downloadToken', itemIndex)) },
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
		'broadcast:create': () => {
			throw new ApplicationError(
				'Broadcast create requests are built asynchronously. Use buildBroadcastCreateRequest instead of buildRequest.',
			);
		},
		'broadcast:addRecipients': () => {
			throw new ApplicationError(
				'Add Recipients requests are built asynchronously. Use buildBroadcastAddRecipientsRequest instead of buildRequest.',
			);
		},
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

export async function buildBroadcastCreateRequest(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<KapsoRequestArgs> {
	return {
		api: 'platform',
		method: 'POST' as IHttpRequestMethods,
		path: '/whatsapp/broadcasts',
		body: await buildBroadcastCreateBody(ef, itemIndex),
	};
}

export async function buildBroadcastAddRecipientsRequest(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<KapsoRequestArgs> {
	return {
		api: 'platform',
		method: 'POST' as IHttpRequestMethods,
		path: `/whatsapp/broadcasts/${pathUuidId(getString(ef, 'broadcastId', itemIndex), 'Broadcast ID')}/recipients`,
		body: await buildBroadcastAddRecipientsBody(ef, itemIndex),
	};
}
