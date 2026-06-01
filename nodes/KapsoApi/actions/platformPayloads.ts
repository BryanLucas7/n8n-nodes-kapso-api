import { ApplicationError, IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { parseJsonObject } from '../transport/json';
import {
	buildMetaTemplateComponents,
	type TemplateComponentsInput,
} from './templateComponents';
import { buildRecipientTemplateComponentsInput } from './templateInput';
import type { TemplateButtonParameterCollection } from './templateButtonInput';
import {
	getFixedCollectionItems,
	getOptionalJsonObject,
	getString,
	readMetaPhoneResourceLocatorValue,
	tryReadE164PhoneResourceLocatorValue,
	getE164PhoneResourceLocatorValue,
} from './nodeHelpers';
import {
	assertE164Phone,
	assertMetaRecipientPhone,
	assertPublicMediaUrl,
	validateOptionalUuid,
} from './validation';

type BodyParameterCollection = {
	bodyParameterValues?: Array<{ parameterName?: string; parameterText: string }>;
};

type ButtonParameterCollection = TemplateButtonParameterCollection;

type BroadcastRecipientInput = Omit<
	TemplateComponentsInput,
	'bodyParameters' | 'buttonParameters' | 'carouselCards' | 'advancedComponentsJson'
> & {
	phoneNumber?: string | IDataObject;
	whatsappContactId?: string;
	bodyParameters?: BodyParameterCollection;
	buttonParameters?: ButtonParameterCollection;
	recipientComponentsJson?: string;
	carouselCards?: {
		cardValues?: Array<{
			cardIndex: number;
			cardHeaderType?: string;
			cardHeaderMediaSource?: string;
			cardHeaderMediaUrl?: string;
			cardHeaderMediaId?: string;
			cardBodyParameters?: BodyParameterCollection;
			cardButtonParameters?: ButtonParameterCollection;
		}>;
	};
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
		wa_id: assertE164Phone(
			getE164PhoneResourceLocatorValue(ef, 'contactWaId', itemIndex, 'WhatsApp ID'),
			'WhatsApp ID',
		),
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
	return buildMetaTemplateComponents(buildRecipientTemplateComponentsInput(entry));
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
		const phoneNumber = tryReadE164PhoneResourceLocatorValue(entry.phoneNumber, 'Phone Number');

		if (!phoneNumber && !entry.whatsappContactId?.trim()) {
			throw new ApplicationError('Each broadcast recipient requires a phone number or contact ID.');
		}

		const recipient: IDataObject = {};

		if (entry.whatsappContactId) {
			recipient.whatsapp_contact_id = validateOptionalUuid(
				entry.whatsappContactId,
				'Contact ID',
			);
		}

		if (phoneNumber) {
			recipient.phone_number = assertE164Phone(phoneNumber, 'Phone Number');
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
			source: assertPublicMediaUrl(getString(ef, 'ingestSourceUrl', itemIndex), 'Source URL'),
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
	).map((entry) => ({
		user: assertMetaRecipientPhone(
			readMetaPhoneResourceLocatorValue(entry.user, 'User Phone'),
		),
	}));

	if (!users.length) {
		throw new ApplicationError('Add at least one user to block or unblock.');
	}

	return {
		block_users: users,
	};
}
