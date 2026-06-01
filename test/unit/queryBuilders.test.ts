import { describe, expect, it } from 'vitest';
import {
	buildContactListQuery,
	buildConversationListQuery,
	buildCustomApiQuery,
	buildMediaQuery,
	buildMessageQuery,
	buildOperationQuery,
	buildPlatformMessageListQuery,
} from '../../nodes/KapsoApi/actions/queryBuilders';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const CONV_UUID = '550e8400-e29b-41d4-a716-446655440000';
const CUST_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('queryBuilders', () => {
	it('builds message list filters from dedicated fields', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				messageListConversationId: CONV_UUID,
				messageListDirection: 'inbound',
				messageListStatus: 'delivered',
				messageListSince: '2024-01-15T00:00:00.000Z',
				messageListAfter: 'cursor-after',
			},
		});

		expect(buildMessageQuery(ef, 0, 'list')).toEqual({
			conversation_id: CONV_UUID,
			direction: 'inbound',
			status: 'delivered',
			since: '2024-01-15T00:00:00.000Z',
			after: 'cursor-after',
			fields: 'kapso()',
		});
	});

	it('prefers custom response fields over the Kapso extensions toggle', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				messageResponseFields: 'kapso(direction,status)',
			},
		});

		expect(buildMessageQuery(ef, 0, 'get')).toEqual({
			fields: 'kapso(direction,status)',
		});
	});

	it('builds media query with phone number id', () => {
		const ef = createMockExecuteFunctions({
			phoneNumberId: '1234567890',
		});

		expect(buildMediaQuery(ef, 0)).toEqual({
			phone_number_id: '1234567890',
		});
	});

	it('builds custom API query parameters from fixed collection', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				customQueryParameters: {
					parameterValues: [
						{ name: 'page', value: '2' },
						{ name: 'status', value: 'open' },
					],
				},
			},
		});

		expect(buildCustomApiQuery(ef, 0)).toEqual({
			page: '2',
			status: 'open',
		});
	});

	it('routes operation-specific query builders', () => {
		const mediaEf = createMockExecuteFunctions({
			resource: 'media',
			operation: 'getUrl',
			phoneNumberId: '1234567890',
		});

		expect(buildOperationQuery(mediaEf, 'media', 'getUrl', 0)).toEqual({
			phone_number_id: '1234567890',
		});
	});

	it('builds contact list filters and cursor pagination', () => {
		const ef = createMockExecuteFunctions({
			contactListOptions: {
				contactProfileNameContains: 'Ana',
				contactWaIdContains: '5511',
				contactCustomerIdFilter: CUST_UUID,
				contactHasCustomer: 'true',
				listAfter: 'cursor-after',
			},
		});

		expect(buildContactListQuery(ef, 0)).toEqual({
			profile_name_contains: 'Ana',
			wa_id_contains: '5511',
			customer_id: CUST_UUID,
			has_customer: true,
			after: 'cursor-after',
		});
	});

	it('builds conversation list filters and cursor pagination', () => {
		const ef = createMockExecuteFunctions({
			conversationListOptions: {
				conversationPhoneNumberId: '1234567890',
				conversationStatusFilter: 'active',
				conversationUnassigned: true,
				listBefore: 'cursor-before',
			},
		});

		expect(buildConversationListQuery(ef, 0)).toEqual({
			phone_number_id: '1234567890',
			status: 'active',
			unassigned: true,
			before: 'cursor-before',
		});
	});

	it('builds platform message list filters and cursor pagination', () => {
		const ef = createMockExecuteFunctions({
			phoneNumberId: '1234567890',
			platformMessageListOptions: {
				platformMessageConversationId: CONV_UUID,
				platformMessageDirection: 'inbound',
				platformMessageHasMedia: 'true',
				listAfter: 'cursor-after',
			},
		});

		expect(buildPlatformMessageListQuery(ef, 0)).toEqual({
			phone_number_id: '1234567890',
			conversation_id: CONV_UUID,
			direction: 'inbound',
			has_media: true,
			after: 'cursor-after',
		});
	});
});
