import { ApplicationError, IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { assertBroadcastDraftForRecipients } from './broadcastPreflight';
import { parseJsonObject } from '../transport/json';
import { buildMetaTemplateComponents } from './templateComponents';
import {
	buildBroadcastRecipientComponentsInputs,
	buildBroadcastRecipientsFromInputItems,
	type BroadcastRecipientEntry,
} from './broadcastRecipientInput';
import { resolveBroadcastCreateTemplateId } from '../loadOptions/broadcastCreateTemplate';
import {
	getFixedCollectionItems,
	getOptionalJsonObject,
	getString,
	readMetaPhoneResourceLocatorValue,
	readStringParameterValue,
	tryReadE164PhoneResourceLocatorValue,
	getE164PhoneResourceLocatorValue,
} from './nodeHelpers';
import {
	assertE164Phone,
	assertMetaRecipientPhone,
	assertPublicMediaUrl,
	validateOptionalUuid,
} from './validation';

function resolveBroadcastPhoneNumberId(ef: IExecuteFunctions, itemIndex: number): string {
	const phoneNumberId = getString(ef, 'phoneNumberId', itemIndex);
	if (phoneNumberId) {
		return phoneNumberId;
	}

	return getString(ef, 'broadcastPhoneNumberId', itemIndex);
}

function resolveRecipientPhone(
	entry: BroadcastRecipientEntry,
	allowPlainPhone: boolean,
): string | undefined {
	if (typeof entry.phoneNumber === 'string') {
		if (!allowPlainPhone) {
			throw new ApplicationError('Phone Number must use the phone number selector');
		}

		return assertE164Phone(entry.phoneNumber, 'Phone Number');
	}

	return tryReadE164PhoneResourceLocatorValue(entry.phoneNumber, 'Phone Number');
}

function mapRecipientPayload(
	entry: BroadcastRecipientEntry,
	componentsInputIndex: number,
	componentsInputs: Awaited<ReturnType<typeof buildBroadcastRecipientComponentsInputs>>,
	allowPlainPhone: boolean,
): IDataObject {
	const phoneNumber = resolveRecipientPhone(entry, allowPlainPhone);

	const whatsappContactId = readStringParameterValue(entry.whatsappContactId).trim();

	if (!phoneNumber && !whatsappContactId) {
		throw new ApplicationError('Each broadcast recipient requires a phone number or contact ID.');
	}

	const recipient: IDataObject = {};

	if (whatsappContactId) {
		recipient.whatsapp_contact_id = validateOptionalUuid(whatsappContactId, 'Contact ID');
	}

	if (phoneNumber) {
		recipient.phone_number = phoneNumber;
	}

	const components = buildMetaTemplateComponents(componentsInputs[componentsInputIndex]);
	if (components) {
		recipient.components = components;
	}

	return recipient;
}

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
			getE164PhoneResourceLocatorValue(ef, 'contactWaId', itemIndex, 'Contact Phone Number'),
			'Contact Phone Number',
		),
	};

	const profileName = getString(ef, 'contactProfileName', itemIndex);
	if (profileName) contact.profile_name = profileName;

	const displayName = getString(ef, 'contactDisplayName', itemIndex);
	if (displayName) contact.display_name = displayName;

	const customerId = getString(ef, 'contactCustomerId', itemIndex);
	if (customerId) contact.customer_id = validateOptionalUuid(customerId, 'Customer ID');

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
	if (customerId) contact.customer_id = validateOptionalUuid(customerId, 'Customer ID');

	const metadata = getOptionalJsonObject(ef, 'contactMetadataJson', itemIndex, 'Contact Metadata');
	if (metadata) contact.metadata = metadata;

	if (Object.keys(contact).length === 0) {
		throw new ApplicationError('Provide at least one contact field to update.');
	}

	return { contact };
}

export async function buildBroadcastCreateBody(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const phoneNumberId = resolveBroadcastPhoneNumberId(ef, itemIndex);
	if (!phoneNumberId) {
		throw new ApplicationError('Phone Number is required to create a broadcast.');
	}

	return {
		whatsapp_broadcast: {
			name: getString(ef, 'broadcastName', itemIndex),
			phone_number_id: phoneNumberId,
			whatsapp_template_id: await resolveBroadcastCreateTemplateId(ef, itemIndex),
		},
	};
}

export const BROADCAST_RECIPIENTS_MAX = 1000;

function countRecipientsInAdvancedBody(body: IDataObject): number {
	const nested = body.whatsapp_broadcast;
	if (nested && typeof nested === 'object') {
		const recipients = (nested as IDataObject).recipients;
		if (Array.isArray(recipients)) {
			return recipients.length;
		}
	}

	if (Array.isArray(body.recipients)) {
		return body.recipients.length;
	}

	return 0;
}

export function buildBroadcastScheduleBody(ef: IExecuteFunctions, itemIndex: number): IDataObject {
	const scheduledAt = getString(ef, 'scheduledAt', itemIndex);
	const scheduledTime = Date.parse(scheduledAt);

	if (!scheduledAt.trim() || Number.isNaN(scheduledTime)) {
		throw new ApplicationError('Scheduled At must be a valid ISO 8601 date and time with timezone.');
	}

	if (scheduledTime <= Date.now()) {
		throw new ApplicationError('Scheduled At must be in the future.');
	}

	return {
		scheduled_at: scheduledAt,
	};
}

export async function buildBroadcastAddRecipientsBody(
	ef: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	await assertBroadcastDraftForRecipients(ef, itemIndex);

	const advancedJson = getString(ef, 'recipientsBodyJson', itemIndex);
	if (advancedJson.trim()) {
		const body = parseJsonObject(advancedJson, 'Recipients Body JSON');
		const recipientCount = countRecipientsInAdvancedBody(body);
		if (recipientCount > BROADCAST_RECIPIENTS_MAX) {
			throw new ApplicationError(
				`Kapso accepts up to ${BROADCAST_RECIPIENTS_MAX} recipients per Add Recipients request. Split larger lists across multiple nodes.`,
			);
		}

		return body;
	}

	const source = getString(ef, 'broadcastRecipientSource', itemIndex) || 'builder';
	const allowPlainPhone = source === 'inputItems';
	const entries =
		source === 'inputItems'
			? await buildBroadcastRecipientsFromInputItems(ef, itemIndex)
			: getFixedCollectionItems<BroadcastRecipientEntry>(
					ef,
					'broadcastRecipients',
					'recipientValues',
					itemIndex,
				);

	if (!entries.length) {
		throw new ApplicationError('Add at least one broadcast recipient.');
	}

	if (entries.length > BROADCAST_RECIPIENTS_MAX) {
		throw new ApplicationError(
			`Kapso accepts up to ${BROADCAST_RECIPIENTS_MAX} recipients per Add Recipients request. Split larger lists across multiple nodes.`,
		);
	}

	const componentsInputs = await buildBroadcastRecipientComponentsInputs(ef, itemIndex, entries);

	const recipients = entries.map((entry, index) =>
		mapRecipientPayload(entry, index, componentsInputs, allowPlainPhone),
	);

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
