import { ApplicationError, IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { parseJsonObject, parseJsonValue } from '../transport/json';
import {
	getFixedCollectionItems,
	getOptionalJsonObject,
	getString,
} from './nodeHelpers';

type BodyParameterCollection = {
	bodyParameterValues?: Array<{ parameterName?: string; parameterText: string }>;
};

type ButtonParameterCollection = {
	buttonParameterValues?: Array<{
		buttonSubType?: string;
		buttonIndex?: number;
		buttonText: string;
	}>;
};

type BroadcastRecipientInput = {
	phoneNumber?: string;
	whatsappContactId?: string;
	bodyParameters?: BodyParameterCollection;
	headerType?: string;
	headerText?: string;
	headerImageUrl?: string;
	buttonParameters?: ButtonParameterCollection;
	recipientComponentsJson?: string;
};

export function buildConversationStatusBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	return {
		whatsapp_conversation: {
			status: getString(ef, 'conversationStatus', itemIndex),
		},
	};
}

export function buildContactCreateBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const contact: IDataObject = {
		wa_id: getString(ef, 'contactWaId', itemIndex),
	};

	const profileName = getString(ef, 'contactProfileName', itemIndex);
	if (profileName) contact.profile_name = profileName;

	const displayName = getString(ef, 'contactDisplayName', itemIndex);
	if (displayName) contact.display_name = displayName;

	const customerId = getString(ef, 'contactCustomerId', itemIndex);
	if (customerId) contact.customer_id = customerId;

	const metadata = getOptionalJsonObject(ef, 'contactMetadataJson', itemIndex, 'Contact Metadata');
	if (metadata) contact.metadata = metadata;

	return { contact };
}

export function buildContactUpdateBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const contact: IDataObject = {};

	const profileName = getString(ef, 'contactProfileName', itemIndex);
	if (profileName) contact.profile_name = profileName;

	const displayName = getString(ef, 'contactDisplayName', itemIndex);
	if (displayName) contact.display_name = displayName;

	const customerId = getString(ef, 'contactCustomerId', itemIndex);
	if (customerId) contact.customer_id = customerId;

	const metadata = getOptionalJsonObject(ef, 'contactMetadataJson', itemIndex, 'Contact Metadata');
	if (metadata) contact.metadata = metadata;

	if (Object.keys(contact).length === 0) {
		throw new ApplicationError('Provide at least one contact field to update.');
	}

	return { contact };
}

export function buildBroadcastCreateBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	return {
		whatsapp_broadcast: {
			name: getString(ef, 'broadcastName', itemIndex),
			phone_number_id: getString(ef, 'broadcastPhoneNumberId', itemIndex),
			whatsapp_template_id: getString(ef, 'broadcastTemplateId', itemIndex),
		},
	};
}

export function buildBroadcastScheduleBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	return {
		whatsapp_broadcast: {
			scheduled_at: getString(ef, 'scheduledAt', itemIndex),
		},
	};
}

function buildRecipientTemplateComponents(entry: BroadcastRecipientInput): IDataObject[] | undefined {
	const advancedJson = entry.recipientComponentsJson?.trim();
	if (advancedJson) {
		const parsed = parseJsonValue(advancedJson, 'Advanced Components JSON');
		return Array.isArray(parsed) ? (parsed as IDataObject[]) : undefined;
	}

	const components: IDataObject[] = [];

	if (entry.headerType === 'text' && entry.headerText) {
		components.push({
			type: 'header',
			parameters: [{ type: 'text', text: entry.headerText }],
		});
	} else if (entry.headerType === 'image' && entry.headerImageUrl) {
		components.push({
			type: 'header',
			parameters: [{ type: 'image', image: { link: entry.headerImageUrl } }],
		});
	}

	const bodyParams = entry.bodyParameters?.bodyParameterValues ?? [];
	if (bodyParams.length > 0) {
		components.push({
			type: 'body',
			parameters: bodyParams.map((parameter) => {
				const value: IDataObject = {
					type: 'text',
					text: parameter.parameterText,
				};

				if (parameter.parameterName) {
					value.parameter_name = parameter.parameterName;
				}

				return value;
			}),
		});
	}

	const buttonParams = entry.buttonParameters?.buttonParameterValues ?? [];
	buttonParams.forEach((button) => {
		components.push({
			type: 'button',
			sub_type: button.buttonSubType || 'url',
			index: button.buttonIndex ?? 0,
			parameters: [{ type: 'text', text: button.buttonText }],
		});
	});

	return components.length > 0 ? components : undefined;
}

export function buildBroadcastAddRecipientsBody(
	ef: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const advancedJson = getString(ef, 'recipientsBodyJson', itemIndex);
	if (advancedJson.trim()) {
		return parseJsonObject(advancedJson, 'Recipients Body JSON');
	}

	const recipients = getFixedCollectionItems<BroadcastRecipientInput>(
		ef,
		'broadcastRecipients',
		'recipientValues',
		itemIndex,
	).map((entry) => {
		const recipient: IDataObject = {};

		if (entry.whatsappContactId) {
			recipient.whatsapp_contact_id = entry.whatsappContactId;
		}

		if (entry.phoneNumber) {
			recipient.phone_number = entry.phoneNumber;
		}

		const components = buildRecipientTemplateComponents(entry);
		if (components) {
			recipient.components = components;
		}

		return recipient;
	});

	if (!recipients.length) {
		throw new ApplicationError('Add at least one broadcast recipient.');
	}

	return {
		whatsapp_broadcast: {
			recipients,
		},
	};
}

export function buildMediaIngestBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	return {
		media_ingest: {
			phone_number_id: getString(ef, 'ingestPhoneNumberId', itemIndex),
			source: getString(ef, 'ingestSourceUrl', itemIndex),
			delivery: getString(ef, 'ingestDelivery', itemIndex) || 'meta_media',
		},
	};
}

export function buildBlockUsersBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const users = getFixedCollectionItems<{ user: string }>(
		ef,
		'blockedUsers',
		'userValues',
		itemIndex,
	).map((entry) => ({ user: entry.user }));

	if (!users.length) {
		throw new ApplicationError('Add at least one user to block or unblock.');
	}

	return {
		block_users: users,
		messaging_product: 'whatsapp',
	};
}
