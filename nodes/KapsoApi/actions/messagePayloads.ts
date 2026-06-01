import { ApplicationError, IDataObject } from 'n8n-workflow';
import { parseJsonValue } from '../transport/json';
import {
	buildMetaTemplateComponents,
	type TemplateComponentsInput,
} from './templateComponents';
import {
	assertInteractiveButtonCount,
	assertInteractiveListShape,
	assertProductListShape,
	assertWhatsAppMediaId,
	parseCoordinate,
	validateButtonId,
	validateButtonTitle,
	validateCatalogId,
	validateCtaButtonLabel,
	validateDocumentFilename,
	validateFlowCta,
	validateFlowId,
	validateFlowScreen,
	validateFlowToken,
	validateHttpUrl,
	validateInteractiveBodyText,
	validateInteractiveFooterText,
	validateInteractiveHeaderText,
	validateListButtonText,
	validateListRowDescription,
	validateListRowId,
	validateListRowTitle,
	validateListSectionTitle,
	validateMediaCaption,
	validateProductRetailerId,
	validateTextMessageBody,
} from './validation';

export type KapsoButtonInput = {
	buttonId: string;
	buttonTitle: string;
};

export type KapsoListRowInput = {
	rowId: string;
	rowTitle: string;
	rowDescription?: string;
};

export type KapsoListSectionInput = {
	sectionTitle: string;
	rows: KapsoListRowInput[];
};

export type KapsoContactPhoneInput = {
	phoneNumber: string;
	phoneType?: string;
	waId?: string;
};

export type KapsoContactEmailInput = {
	email: string;
	emailType?: string;
};

export type KapsoContactUrlInput = {
	url: string;
	urlType?: string;
};

export type KapsoContactAddressInput = {
	street?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;
	countryCode?: string;
	addressType?: string;
};

export type KapsoContactInput = {
	formattedName: string;
	firstName?: string;
	middleName?: string;
	lastName?: string;
	namePrefix?: string;
	nameSuffix?: string;
	birthday?: string;
	phones?: { phoneValues?: KapsoContactPhoneInput[] };
	emails?: { emailValues?: KapsoContactEmailInput[] };
	organization?: string;
	orgDepartment?: string;
	orgTitle?: string;
	urls?: { urlValues?: KapsoContactUrlInput[] };
	addresses?: { addressValues?: KapsoContactAddressInput[] };
};

export type KapsoProductSectionInput = {
	sectionTitle: string;
	productRetailerIds: string[];
};

export type CtaHeaderType = 'none' | 'text' | 'image' | 'video' | 'document';
export type InteractiveHeaderType = CtaHeaderType;

function buildInteractiveTextHeader(text: string): IDataObject {
	return {
		type: 'text',
		text,
	};
}

function buildInteractiveMediaHeader(
	type: 'image' | 'video',
	source: 'link' | 'id',
	value: string,
): IDataObject {
	return {
		type,
		[type]: {
			[source === 'id' ? 'id' : 'link']: value,
		},
	};
}

function resolveInteractiveHeader(
	headerType: string,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
): IDataObject | undefined {
	if (headerType === 'text' && headerText) {
		return buildInteractiveTextHeader(validateInteractiveHeaderText(headerText));
	}

	const mediaValue = headerMediaSource === 'id' ? headerMediaId : headerMediaUrl;

	if (headerMediaSource === 'id' && mediaValue) {
		assertWhatsAppMediaId(mediaValue, 'Header Media ID');
	}

	if (headerType === 'image' && mediaValue) {
		return buildInteractiveMediaHeader('image', headerMediaSource, mediaValue);
	}

	if (headerType === 'video' && mediaValue) {
		return buildInteractiveMediaHeader('video', headerMediaSource, mediaValue);
	}

	if (headerType === 'document' && mediaValue) {
		const document: IDataObject = {
			[headerMediaSource === 'id' ? 'id' : 'link']: mediaValue,
		};

		const validatedFilename = validateDocumentFilename(headerDocumentFilename, 'Header Document Filename');
		if (validatedFilename) {
			document.filename = validatedFilename;
		}

		return {
			type: 'document',
			document,
		};
	}

	return undefined;
}

function withReplyContext(message: IDataObject, replyToMessageId?: string): IDataObject {
	if (!replyToMessageId) {
		return message;
	}

	return {
		...message,
		context: {
			message_id: replyToMessageId,
		},
	};
}

export function buildTextMessage(
	to: string,
	body: string,
	previewUrl: boolean,
	replyToMessageId?: string,
): IDataObject {
	const validatedBody = validateTextMessageBody(body);

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'text',
			text: {
				preview_url: previewUrl,
				body: validatedBody,
			},
		},
		replyToMessageId,
	);
}

export function buildMediaMessage(
	to: string,
	mediaType: string,
	mediaSource: 'id' | 'link',
	mediaValue: string,
	caption?: string,
	filename?: string,
	replyToMessageId?: string,
	voice?: boolean,
): IDataObject {
	const media: IDataObject = {
		[mediaSource]: mediaValue,
	};

	const validatedCaption = validateMediaCaption(caption);
	const validatedFilename = validateDocumentFilename(filename, 'Filename');

	if (validatedCaption && mediaType !== 'audio') {
		media.caption = validatedCaption;
	}

	if (validatedFilename && mediaType === 'document') {
		media.filename = validatedFilename;
	}

	if (voice && mediaType === 'audio') {
		media.voice = true;
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: mediaType,
			[mediaType]: media,
		},
		replyToMessageId,
	);
}

export function buildButtonsMessage(
	to: string,
	bodyText: string,
	buttons: KapsoButtonInput[],
	headerType: string,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
	footer?: string,
	replyToMessageId?: string,
): IDataObject {
	assertInteractiveButtonCount(buttons.length);

	const validatedBody = validateInteractiveBodyText(bodyText);
	const validatedButtons = buttons.map((button) => ({
		buttonId: validateButtonId(button.buttonId),
		buttonTitle: validateButtonTitle(button.buttonTitle),
	}));
	const validatedFooter = validateInteractiveFooterText(footer);

	const interactive: IDataObject = {
		type: 'button',
		body: {
			text: validatedBody,
		},
		action: {
			buttons: validatedButtons.map((button) => ({
				type: 'reply',
				reply: {
					id: button.buttonId,
					title: button.buttonTitle,
				},
			})),
		},
	};

	const header = resolveInteractiveHeader(
		headerType,
		headerText,
		headerMediaSource,
		headerMediaUrl,
		headerMediaId,
		headerDocumentFilename,
	);
	if (header) {
		interactive.header = header;
	}

	if (validatedFooter) {
		interactive.footer = {
			text: validatedFooter,
		};
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive,
		},
		replyToMessageId,
	);
}

export function buildListMessage(
	to: string,
	bodyText: string,
	buttonText: string,
	sections: KapsoListSectionInput[],
	footer?: string,
	headerType?: string,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
	replyToMessageId?: string,
): IDataObject {
	const totalRows = sections.reduce((count, section) => count + section.rows.length, 0);
	assertInteractiveListShape(sections.length, totalRows);

	const validatedBody = validateInteractiveBodyText(bodyText);
	const validatedButtonText = validateListButtonText(buttonText);
	const validatedFooter = validateInteractiveFooterText(footer);
	const validatedSections = sections.map((section) => ({
		sectionTitle: validateListSectionTitle(section.sectionTitle),
		rows: section.rows.map((row) => ({
			rowId: validateListRowId(row.rowId),
			rowTitle: validateListRowTitle(row.rowTitle),
			rowDescription: validateListRowDescription(row.rowDescription),
		})),
	}));

	const interactive: IDataObject = {
		type: 'list',
		body: {
			text: validatedBody,
		},
		action: {
			button: validatedButtonText,
			sections: validatedSections.map((section) => ({
				title: section.sectionTitle,
				rows: section.rows.map((row) => ({
					id: row.rowId,
					title: row.rowTitle,
					...(row.rowDescription ? { description: row.rowDescription } : {}),
				})),
			})),
		},
	};

	const header = resolveInteractiveHeader(
		headerType ?? 'none',
		headerText,
		headerMediaSource,
		headerMediaUrl,
		headerMediaId,
		headerDocumentFilename,
	);
	if (header) {
		interactive.header = header;
	}

	if (validatedFooter) {
		interactive.footer = {
			text: validatedFooter,
		};
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive,
		},
		replyToMessageId,
	);
}

export function buildContactMessage(to: string, contacts: KapsoContactInput[]): IDataObject {
	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'contacts',
		contacts: contacts.map((contact) => {
			const phones: IDataObject[] = [];

			for (const phone of contact.phones?.phoneValues ?? []) {
				if (!phone.phoneNumber) {
					continue;
				}

				const entry: IDataObject = {
					phone: phone.phoneNumber,
					type: phone.phoneType || 'MOBILE',
				};

				if (phone.waId) {
					entry.wa_id = phone.waId;
				}

				phones.push(entry);
			}

			if (phones.length === 0) {
				throw new ApplicationError(
					`Contact "${contact.formattedName}" requires at least one phone number.`,
				);
			}

			const emails: IDataObject[] = [];

			for (const email of contact.emails?.emailValues ?? []) {
				if (email.email) {
					emails.push({
						email: email.email,
						type: email.emailType || 'WORK',
					});
				}
			}

			const urls: IDataObject[] = [];

			for (const urlEntry of contact.urls?.urlValues ?? []) {
				if (urlEntry.url) {
					urls.push({
						url: urlEntry.url,
						type: urlEntry.urlType || 'WORK',
					});
				}
			}

			const entry: IDataObject = {
				name: {
					formatted_name: contact.formattedName,
					...(contact.firstName ? { first_name: contact.firstName } : {}),
					...(contact.middleName ? { middle_name: contact.middleName } : {}),
					...(contact.lastName ? { last_name: contact.lastName } : {}),
					...(contact.namePrefix ? { prefix: contact.namePrefix } : {}),
					...(contact.nameSuffix ? { suffix: contact.nameSuffix } : {}),
				},
			};

			if (contact.birthday) {
				entry.birthday = contact.birthday;
			}

			if (phones.length > 0) {
				entry.phones = phones;
			}

			if (emails.length > 0) {
				entry.emails = emails;
			}

			if (urls.length > 0) {
				entry.urls = urls;
			}

			if (contact.organization || contact.orgDepartment || contact.orgTitle) {
				entry.org = {
					...(contact.organization ? { company: contact.organization } : {}),
					...(contact.orgDepartment ? { department: contact.orgDepartment } : {}),
					...(contact.orgTitle ? { title: contact.orgTitle } : {}),
				};
			}

			const addresses = (contact.addresses?.addressValues ?? [])
				.map((address) => {
					const value: IDataObject = {
						type: address.addressType || 'WORK',
					};

					if (address.street) value.street = address.street;
					if (address.city) value.city = address.city;
					if (address.state) value.state = address.state;
					if (address.zip) value.zip = address.zip;
					if (address.country) value.country = address.country;
					if (address.countryCode) value.country_code = address.countryCode;

					return Object.keys(value).length > 1 ? value : undefined;
				})
				.filter((address): address is IDataObject => Boolean(address));

			if (addresses.length > 0) {
				entry.addresses = addresses;
			}

			return entry;
		}),
	};
}

export function buildTemplateMessageFromParams(
	to: string,
	name: string,
	languageCode: string,
	componentsInput: TemplateComponentsInput,
): IDataObject {
	const advancedJson = componentsInput.advancedComponentsJson?.trim();
	if (advancedJson && advancedJson !== '[]') {
		return buildTemplateMessage(to, name, languageCode, advancedJson);
	}

	const components = buildMetaTemplateComponents(componentsInput);
	const template: IDataObject = {
		name,
		language: {
			code: languageCode,
		},
	};

	if (components) {
		template.components = components;
	}

	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'template',
		template,
	};
}

export function buildTemplateMessage(
	to: string,
	name: string,
	languageCode: string,
	componentsJson?: string,
): IDataObject {
	const components = parseJsonValue(componentsJson, 'Advanced Components JSON');
	const template: IDataObject = {
		name,
		language: {
			code: languageCode,
		},
	};

	if (components !== undefined) {
		template.components = components;
	}

	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'template',
		template,
	};
}

export function buildReactionMessage(to: string, messageId: string, emoji: string): IDataObject {
	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'reaction',
		reaction: {
			message_id: messageId,
			emoji,
		},
	};
}

export function buildMarkReadMessage(messageId: string, typingIndicator: boolean): IDataObject {
	return {
		messaging_product: 'whatsapp',
		status: 'read',
		message_id: messageId,
		...(typingIndicator ? { typing_indicator: { type: 'text' } } : {}),
	};
}

export function buildLocationMessage(
	to: string,
	latitude: string | number,
	longitude: string | number,
	name?: string,
	address?: string,
	replyToMessageId?: string,
): IDataObject {
	const location: IDataObject = {
		latitude: parseCoordinate(latitude, 'Latitude'),
		longitude: parseCoordinate(longitude, 'Longitude'),
	};

	if (name) {
		location.name = name;
	}

	if (address) {
		location.address = address;
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'location',
			location,
		},
		replyToMessageId,
	);
}

export function buildStickerMessage(
	to: string,
	mediaSource: 'id' | 'link',
	mediaValue: string,
	replyToMessageId?: string,
): IDataObject {
	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'sticker',
			sticker: {
				[mediaSource]: mediaValue,
			},
		},
		replyToMessageId,
	);
}

export function buildRequestLocationMessage(to: string, bodyText: string): IDataObject {
	const validatedBody = validateInteractiveBodyText(bodyText);

	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'interactive',
		interactive: {
			type: 'location_request_message',
			body: {
				text: validatedBody,
			},
			action: {
				name: 'send_location',
			},
		},
	};
}

export function buildCtaUrlMessage(
	to: string,
	bodyText: string,
	buttonLabel: string,
	buttonUrl: string,
	headerType: CtaHeaderType,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
	footer?: string,
	replyToMessageId?: string,
): IDataObject {
	const validatedBody = validateInteractiveBodyText(bodyText);
	const validatedLabel = validateCtaButtonLabel(buttonLabel);
	const validatedUrl = validateHttpUrl(buttonUrl, 'Button URL');
	const validatedFooter = validateInteractiveFooterText(footer);

	const interactive: IDataObject = {
		type: 'cta_url',
		body: {
			text: validatedBody,
		},
		action: {
			name: 'cta_url',
			parameters: {
				display_text: validatedLabel,
				url: validatedUrl,
			},
		},
	};

	const header = resolveInteractiveHeader(
		headerType,
		headerText,
		headerMediaSource,
		headerMediaUrl,
		headerMediaId,
		headerDocumentFilename,
	);
	if (header) {
		interactive.header = header;
	}

	if (validatedFooter) {
		interactive.footer = {
			text: validatedFooter,
		};
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive,
		},
		replyToMessageId,
	);
}

export function buildProductMessage(
	to: string,
	catalogId: string,
	productRetailerId: string,
	bodyText?: string,
	replyToMessageId?: string,
): IDataObject {
	const validatedCatalogId = validateCatalogId(catalogId);
	const validatedProductId = validateProductRetailerId(productRetailerId);

	const interactive: IDataObject = {
		type: 'product',
		action: {
			catalog_id: validatedCatalogId,
			product_retailer_id: validatedProductId,
		},
	};

	if (bodyText) {
		interactive.body = {
			text: validateInteractiveBodyText(bodyText),
		};
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive,
		},
		replyToMessageId,
	);
}

function requireInteractiveHeader(
	headerType: string,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
): IDataObject {
	const header = resolveInteractiveHeader(
		headerType,
		headerText,
		headerMediaSource,
		headerMediaUrl,
		headerMediaId,
		headerDocumentFilename,
	);

	if (!header) {
		throw new ApplicationError('Product list messages require a valid header.');
	}

	return header;
}

export function buildProductListMessage(
	to: string,
	catalogId: string,
	bodyText: string,
	sections: KapsoProductSectionInput[],
	headerType: string,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
	footer?: string,
	replyToMessageId?: string,
): IDataObject {
	assertProductListShape(sections);

	const validatedCatalogId = validateCatalogId(catalogId);
	const validatedBody = validateInteractiveBodyText(bodyText);
	const validatedFooter = validateInteractiveFooterText(footer);
	const validatedSections = sections.map((section) => ({
		sectionTitle: validateListSectionTitle(section.sectionTitle),
		productRetailerIds: section.productRetailerIds.map((id) => validateProductRetailerId(id)),
	}));

	const interactive: IDataObject = {
		type: 'product_list',
		header: requireInteractiveHeader(
			headerType,
			headerText,
			headerMediaSource,
			headerMediaUrl,
			headerMediaId,
			headerDocumentFilename,
		),
		body: {
			text: validatedBody,
		},
		action: {
			catalog_id: validatedCatalogId,
			sections: validatedSections.map((section) => ({
				title: section.sectionTitle,
				product_items: section.productRetailerIds.map((productRetailerId) => ({
					product_retailer_id: productRetailerId,
				})),
			})),
		},
	};

	if (validatedFooter) {
		interactive.footer = {
			text: validatedFooter,
		};
	}

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive,
		},
		replyToMessageId,
	);
}

export function buildCatalogMessage(
	to: string,
	bodyText: string,
	thumbnailProductRetailerId: string,
	replyToMessageId?: string,
): IDataObject {
	const validatedBody = validateInteractiveBodyText(bodyText);
	const validatedThumbnailId = validateProductRetailerId(
		thumbnailProductRetailerId,
		'Thumbnail Product Retailer ID',
	);

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive: {
				type: 'catalog_message',
				body: {
					text: validatedBody,
				},
				action: {
					name: 'catalog_message',
					parameters: {
						thumbnail_product_retailer_id: validatedThumbnailId,
					},
				},
			},
		},
		replyToMessageId,
	);
}

export function buildFlowMessage(
	to: string,
	bodyText: string,
	flowCta: string,
	flowToken: string,
	flowMessageVersion: string,
	flowAction: 'navigate' | 'data_exchange',
	flowScreen?: string,
	flowInitialData?: IDataObject,
	replyToMessageId?: string,
	flowMode?: 'draft' | 'published',
	headerType?: string,
	headerText?: string,
	headerMediaSource: 'link' | 'id' = 'link',
	headerMediaUrl?: string,
	headerMediaId?: string,
	headerDocumentFilename?: string,
	footer?: string,
	flowId?: string,
	flowName?: string,
): IDataObject {
	const validatedBody = validateInteractiveBodyText(bodyText);
	const validatedCta = validateFlowCta(flowCta);
	const validatedFooter = validateInteractiveFooterText(footer);
	const flowTokenValue = validateFlowToken(flowToken);
	const validatedScreen = validateFlowScreen(flowScreen);
	const validatedFlowId = validateFlowId(flowId);

	const parameters: IDataObject = {
		flow_message_version: flowMessageVersion,
		flow_cta: validatedCta,
		flow_token: flowTokenValue,
		flow_action: flowAction,
	};

	if (validatedFlowId) {
		parameters.flow_id = validatedFlowId;
	}

	if (flowName) {
		parameters.flow_name = flowName;
	}

	if (flowMode) {
		parameters.mode = flowMode;
	}

	if (flowAction === 'navigate') {
		const payload: IDataObject = {};

		if (validatedScreen) {
			payload.screen = validatedScreen;
		}

		if (flowInitialData && Object.keys(flowInitialData).length > 0) {
			payload.data = flowInitialData;
		}

		if (Object.keys(payload).length > 0) {
			parameters.flow_action_payload = payload;
		}
	} else if (flowInitialData && Object.keys(flowInitialData).length > 0) {
		parameters.flow_action_payload = {
			data: flowInitialData,
		};
	}

	const flowHeader = resolveInteractiveHeader(
		headerType ?? 'none',
		headerText,
		headerMediaSource,
		headerMediaUrl,
		headerMediaId,
		headerDocumentFilename,
	);

	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'interactive',
			interactive: {
				type: 'flow',
				...(flowHeader ? { header: flowHeader } : {}),
				body: {
					text: validatedBody,
				},
				...(validatedFooter ? { footer: { text: validatedFooter } } : {}),
				action: {
					name: 'flow',
					parameters,
				},
			},
		},
		replyToMessageId,
	);
}

export function buildCallPermissionMessage(to: string, bodyText: string): IDataObject {
	const validatedBody = validateInteractiveBodyText(bodyText);

	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'interactive',
		interactive: {
			type: 'call_permission_request',
			body: {
				text: validatedBody,
			},
			action: {
				name: 'call_permission_request',
			},
		},
	};
}
