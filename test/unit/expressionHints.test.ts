import { describe, expect, it } from 'vitest';
import {
	catalogIdField,
	filterStringField,
	flowIdField,
	flowTokenField,
} from '../../nodes/KapsoApi/properties/fieldConstraints';
import {
	KAPSO_DOCS,
	kapsoDocLink,
	withKapsoDoc,
} from '../../nodes/KapsoApi/properties/expressionHints';
import { contactListOptionsField, conversationListOptionsField } from '../../nodes/KapsoApi/properties/platformList.fields';
import { broadcastListOptionsField } from '../../nodes/KapsoApi/properties/broadcastList.fields';
import { messageFields } from '../../nodes/KapsoApi/properties/message.fields';
import { platformMessageFields } from '../../nodes/KapsoApi/properties/platformMessage.fields';
import { messageListOptionsField } from '../../nodes/KapsoApi/properties/messageListOptions.fields';
import { messageSendOptionsField } from '../../nodes/KapsoApi/properties/messageSendOptions.fields';
import { phoneNumberIdFields } from '../../nodes/KapsoApi/properties/shared.fields';
import { configureWebhookNotice, makeKapsoEventNotice } from '../../nodes/KapsoApi/trigger/notes';
import { KAPSO_WEBHOOK_EVENTS } from '../../nodes/KapsoApi/trigger/events';
import { getSendAndWaitProperties } from '../../nodes/KapsoApi/sendAndWait/utils';
import { kapsoNodeProperties } from '../../nodes/KapsoApi/properties';

function fieldHint(name: string): string | undefined {
	const field = kapsoNodeProperties.find((entry) => entry.name === name);
	return field?.hint as string | undefined;
}

function fieldDescription(name: string): string | undefined {
	const field = kapsoNodeProperties.find((entry) => entry.name === name);
	return field?.description as string | undefined;
}

function collectHints(properties: Array<{ hint?: string; options?: Array<{ hint?: string; options?: unknown[] }> }>): string[] {
	const hints: string[] = [];
	for (const property of properties) {
		if (property.hint) hints.push(property.hint);
		for (const option of property.options ?? []) {
			if (option.hint) hints.push(option.hint);
			for (const nested of option.options ?? []) {
				if (typeof nested === 'object' && nested && 'hint' in nested && nested.hint) {
					hints.push(String(nested.hint));
				}
			}
		}
	}
	return hints;
}

describe('Kapso field descriptions', () => {
	it('builds doc-appended descriptions for the ? tooltip', () => {
		expect(withKapsoDoc('Latitude in decimal degrees', KAPSO_DOCS.sendLocation, 'Location')).toBe(
			`Latitude in decimal degrees. ${kapsoDocLink(KAPSO_DOCS.sendLocation, 'Location')}`,
		);
	});

	it('does not expose inline hints on phone number selector fields', () => {
		for (const field of phoneNumberIdFields) {
			expect(field.hint).toBeUndefined();
		}
	});

	it('keeps non-obvious guidance in description instead of hint for template mappers and reactions', () => {
		const reactionField = messageFields.find((field) => field.name === 'reactionMessageId');
		const bodyMapper = messageFields.find((field) => field.name === 'templateBodyParametersMapper');
		const buttonMapper = messageFields.find((field) => field.name === 'templateButtonParametersMapper');

		expect(reactionField?.hint).toBeUndefined();
		expect(reactionField?.description).toContain('message.reaction.message_id');
		expect(bodyMapper?.hint).toBeUndefined();
		expect(bodyMapper?.description).toContain('kapso.content');
		expect(buttonMapper?.hint).toBeUndefined();
		expect(buttonMapper?.description).toContain('Buttons');
	});

	it('adds factory descriptions for flow, catalog, and cursor fields', () => {
		expect(catalogIdField({ show: {} }).hint).toBeUndefined();
		expect(catalogIdField({ show: {} }).description).toContain('Catalog');
		expect(flowIdField({ show: {} }).description).toContain('Flows');
		expect(flowTokenField({ show: {} }).description).toContain('Send Flow');
		expect(filterStringField('listAfter', 'After Cursor', 'Cursor for the next page').hint).toBeUndefined();
		expect(filterStringField('listAfter', 'After Cursor', 'Cursor for the next page').description).toContain('Cursor');
	});

	it('covers resource entry descriptions without inline hints', () => {
		expect(fieldHint('broadcastId')).toBeUndefined();
		expect(fieldDescription('broadcastId')).toContain('Broadcasts');
		expect(fieldDescription('broadcastId')).toContain('Create Broadcast');
		expect(fieldHint('contactIdentifier')).toBeUndefined();
		expect(fieldDescription('contactIdentifier')).toContain('Contacts');
		expect(fieldHint('conversationId')).toBeUndefined();
		expect(fieldHint('binaryPropertyName')).toBeUndefined();
		expect(fieldHint('customPath')).toBeUndefined();
		expect(fieldDescription('customPath')).toContain('API');
		expect(fieldHint('bodyJson')).toBeUndefined();
		expect(fieldDescription('downloadToken')).toContain('download_url');
	});

	it('covers platform and broadcast list filters without inline hints', () => {
		const broadcastPhoneFilter = broadcastListOptionsField.options?.find(
			(field) => field.name === 'broadcastListPhoneNumberId',
		);
		expect(broadcastPhoneFilter?.hint).toBeUndefined();

		const conversationPhoneFilter = conversationListOptionsField.options?.find(
			(field) => field.name === 'conversationPhoneNumber',
		);
		expect(conversationPhoneFilter?.hint).toBeUndefined();

		const contactBsuid = contactListOptionsField.options?.find(
			(field) => field.name === 'contactBusinessScopedUserId',
		);
		expect(contactBsuid?.hint).toBeUndefined();
		expect(contactBsuid?.description).toContain('business_scoped_user_id');
	});

	it('covers platform message list filters without inline hints', () => {
		const messageIdField = platformMessageFields.find((field) => field.name === 'platformMessageId');
		expect(messageIdField?.hint).toBeUndefined();

		const listOptions = platformMessageFields.find((field) => field.name === 'platformMessageListOptions');
		const after = listOptions?.options?.find((field) => field.name === 'listAfter');
		const before = listOptions?.options?.find((field) => field.name === 'listBefore');
		const phone = listOptions?.options?.find((field) => field.name === 'platformMessagePhoneNumber');
		const conversationId = listOptions?.options?.find((field) => field.name === 'platformMessageConversationId');
		const bsuid = listOptions?.options?.find((field) => field.name === 'platformMessageBusinessScopedUserId');

		expect(after?.hint).toBeUndefined();
		expect(before?.hint).toBeUndefined();
		expect(phone?.hint).toBeUndefined();
		expect(conversationId?.hint).toBeUndefined();
		expect(bsuid?.hint).toBeUndefined();
		expect(bsuid?.description).toContain('business_scoped_user_id');
	});

	it('keeps conversation and cursor guidance in dedicated option descriptions only', () => {
		const replyTo = messageSendOptionsField.options?.find((field) => field.name === 'replyToMessageId');
		const after = messageListOptionsField.options?.find((field) => field.name === 'messageListAfter');
		const before = messageListOptionsField.options?.find((field) => field.name === 'messageListBefore');
		const conversationId = messageListOptionsField.options?.find(
			(field) => field.name === 'messageListConversationId',
		);

		expect(replyTo?.hint).toBeUndefined();
		expect(after?.hint).toBeUndefined();
		expect(before?.hint).toBeUndefined();
		expect(conversationId?.hint).toBeUndefined();
		expect(conversationId?.description).toContain('conversation UUID');
	});

	it('includes a single event-types doc link in the setup notice only', () => {
		const setup = String(configureWebhookNotice.displayName);
		expect(setup).toContain('Webhooks');
		expect(setup).toContain('Production URL');
		expect(setup).toContain('Test URL');
		expect(setup).toContain('Webhook Secret');
		expect(setup).toContain('event-types');

		const eventsNotice = makeKapsoEventNotice(KAPSO_WEBHOOK_EVENTS);
		const eventsHtml = String(eventsNotice.displayName);
		expect(eventsHtml).toContain('Message Received');
		expect(eventsHtml).toContain('kapso_event');
		expect(eventsHtml).toContain('Other Event');
		expect(eventsHtml).not.toContain('event-types');
		expect(eventsHtml).not.toContain('security');
	});

	it('documents Send and Wait message field without inline hint', () => {
		const properties = getSendAndWaitProperties();
		const messageField = properties.find((field) => field.name === 'message');
		const docsNotice = properties.find((field) => field.name === 'sendAndWaitDocsNotice');
		expect(messageField?.hint).toBeUndefined();
		expect(messageField?.description).toContain('approval');
		expect(messageField?.description).toContain('Send Text');
		expect(String(docsNotice?.displayName)).toContain('Send Text');
		expect(String(docsNotice?.displayName)).toContain('docs.kapso.ai');
	});

	function collectMissingDescriptions(
		properties: Array<{
			type?: string;
			name?: string;
			displayName?: string;
			description?: string;
			options?: Array<{ values?: unknown[]; options?: unknown[]; type?: string; name?: string; displayName?: string; description?: string }>;
		}>,
		path = '',
	): string[] {
		const missing: string[] = [];
		for (const property of properties) {
			const propertyPath = path
				? `${path} > ${property.displayName ?? property.name}`
				: String(property.displayName ?? property.name);
			const skip =
				property.type === 'notice' ||
				property.type === 'hidden' ||
				property.name === 'resource' ||
				property.name === 'operation';
			if (property.type && !skip && !property.description) {
				missing.push(propertyPath);
			}
			for (const option of property.options ?? []) {
				if (option.values) {
					missing.push(...collectMissingDescriptions(option.values as typeof properties, propertyPath));
				} else if (option.options) {
					missing.push(...collectMissingDescriptions(option.options as typeof properties, propertyPath));
				} else if (option.type && option.type !== 'notice' && option.type !== 'hidden' && !option.description) {
					missing.push(`${propertyPath} > ${option.displayName ?? option.name}`);
				}
			}
		}
		return missing;
	}

	it('covers every node property field with a description', () => {
		const missing = collectMissingDescriptions(kapsoNodeProperties);
		expect(missing).toEqual([]);
	});

	it('does not leave expression examples in node property hints', () => {
		const hints = collectHints(kapsoNodeProperties);
		expect(hints).toHaveLength(0);
		for (const hint of hints) {
			expect(hint).not.toMatch(/=\{\{/);
			expect(hint).not.toMatch(/^Example:/i);
		}
	});
});
