import { describe, expect, it } from 'vitest';
import { filterStringField, flowScreenOptionsField, uuidStringField } from '../../nodes/KapsoApi/properties/fieldConstraints';
import { broadcastListOptionsField } from '../../nodes/KapsoApi/properties/broadcastList.fields';
import { messageListOptionsField } from '../../nodes/KapsoApi/properties/messageListOptions.fields';
import { platformMessageFields } from '../../nodes/KapsoApi/properties/platformMessage.fields';
import { contactListOptionsField } from '../../nodes/KapsoApi/properties/platformList.fields';
import { optionalLabel } from '../../nodes/KapsoApi/properties/displayNames';
import { kapsoNodeProperties } from '../../nodes/KapsoApi/properties';

describe('optional field labels', () => {
	it('labels filter and uuid factories as optional', () => {
		expect(filterStringField('listAfter', 'After Cursor').displayName).toBe('After Cursor (optional)');
		expect(uuidStringField('conversationId', 'Conversation ID').displayName).toBe(
			'Conversation ID (optional)',
		);
		expect(flowScreenOptionsField().displayName).toBe('Flow Screen (optional)');
	});

	it('does not double-append optional', () => {
		expect(optionalLabel('Caption (optional)')).toBe('Caption (optional)');
	});

	it('labels list option collections consistently', () => {
		const messageBefore = messageListOptionsField.options?.find((field) => field.name === 'messageListBefore');
		expect(messageBefore?.displayName).toBe('Before Cursor (optional)');

		const contactCreatedAfter = contactListOptionsField.options?.find(
			(field) => field.name === 'contactCreatedAfter',
		);
		expect(contactCreatedAfter?.displayName).toBe('Created After (optional)');

		const broadcastStatus = broadcastListOptionsField.options?.find(
			(field) => field.name === 'broadcastStatusFilter',
		);
		expect(broadcastStatus?.displayName).toBe('Status (optional)');

		const platformListOptions = platformMessageFields.find((field) => field.name === 'platformMessageListOptions');
		const platformDirection = platformListOptions?.options?.find(
			(field) => field.name === 'platformMessageDirection',
		);
		expect(platformDirection?.displayName).toBe('Direction (optional)');
	});

	it('labels send location optional fields', () => {
		const locationName = kapsoNodeProperties.find((field) => field.name === 'locationName');
		const locationAddress = kapsoNodeProperties.find((field) => field.name === 'locationAddress');

		expect(locationName?.displayName).toBe('Location Name (optional)');
		expect(locationAddress?.displayName).toBe('Location Address (optional)');
	});
});
