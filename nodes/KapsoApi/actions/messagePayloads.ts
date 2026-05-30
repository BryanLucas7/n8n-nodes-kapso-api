import { IDataObject } from 'n8n-workflow';
import { parseJsonValue } from '../transport/json';

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

export type KapsoContactInput = {
	formattedName: string;
	firstName?: string;
	lastName?: string;
	phoneNumber: string;
	phoneType?: string;
	email?: string;
	organization?: string;
	url?: string;
};

export type KapsoTemplateButtonParam = {
	buttonText: string;
};

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
	return withReplyContext(
		{
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to,
			type: 'text',
			text: {
				preview_url: previewUrl,
				body,
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
): IDataObject {
	const media: IDataObject = {
		[mediaSource]: mediaValue,
	};

	if (caption) {
		media.caption = caption;
	}

	if (filename && mediaType === 'document') {
		media.filename = filename;
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
	header?: string,
	footer?: string,
	replyToMessageId?: string,
): IDataObject {
	const interactive: IDataObject = {
		type: 'button',
		body: {
			text: bodyText,
		},
		action: {
			buttons: buttons.map((button) => ({
				type: 'reply',
				reply: {
					id: button.buttonId,
					title: button.buttonTitle,
				},
			})),
		},
	};

	if (header) {
		interactive.header = {
			type: 'text',
			text: header,
		};
	}

	if (footer) {
		interactive.footer = {
			text: footer,
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
	replyToMessageId?: string,
): IDataObject {
	const interactive: IDataObject = {
		type: 'list',
		body: {
			text: bodyText,
		},
		action: {
			button: buttonText,
			sections: sections.map((section) => ({
				title: section.sectionTitle,
				rows: section.rows.map((row) => ({
					id: row.rowId,
					title: row.rowTitle,
					...(row.rowDescription ? { description: row.rowDescription } : {}),
				})),
			})),
		},
	};

	if (footer) {
		interactive.footer = {
			text: footer,
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
			const entry: IDataObject = {
				name: {
					formatted_name: contact.formattedName,
					...(contact.firstName ? { first_name: contact.firstName } : {}),
					...(contact.lastName ? { last_name: contact.lastName } : {}),
				},
				phones: [
					{
						phone: contact.phoneNumber,
						type: contact.phoneType || 'MOBILE',
					},
				],
			};

			if (contact.email) {
				entry.emails = [
					{
						email: contact.email,
						type: 'WORK',
					},
				];
			}

			if (contact.organization) {
				entry.org = {
					company: contact.organization,
				};
			}

			if (contact.url) {
				entry.urls = [
					{
						url: contact.url,
						type: 'WORK',
					},
				];
			}

			return entry;
		}),
	};
}

export function buildTemplateMessageFromParams(
	to: string,
	name: string,
	languageCode: string,
	bodyParams: string[],
	headerParam?: string,
	buttonParams?: KapsoTemplateButtonParam[],
	componentsJson?: string,
): IDataObject {
	if (componentsJson && componentsJson.trim() && componentsJson.trim() !== '[]') {
		return buildTemplateMessage(to, name, languageCode, componentsJson);
	}

	const components: IDataObject[] = [];

	if (headerParam) {
		components.push({
			type: 'header',
			parameters: [
				{
					type: 'text',
					text: headerParam,
				},
			],
		});
	}

	if (bodyParams.length > 0) {
		components.push({
			type: 'body',
			parameters: bodyParams.map((text) => ({
				type: 'text',
				text,
			})),
		});
	}

	if (buttonParams && buttonParams.length > 0) {
		buttonParams.forEach((button, index) => {
			components.push({
				type: 'button',
				sub_type: 'quick_reply',
				index: String(index),
				parameters: [
					{
						type: 'text',
						text: button.buttonText,
					},
				],
			});
		});
	}

	const template: IDataObject = {
		name,
		language: {
			code: languageCode,
		},
	};

	if (components.length > 0) {
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

export function buildInteractiveMessage(to: string, interactiveJson: string): IDataObject {
	return {
		messaging_product: 'whatsapp',
		recipient_type: 'individual',
		to,
		type: 'interactive',
		interactive: parseJsonValue(interactiveJson, 'Interactive JSON') as IDataObject,
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
