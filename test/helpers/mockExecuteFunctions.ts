import { IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';
import { TEST_PHONE_NUMBER_ID } from './kapsoCredentials';

export type MockExecuteOptions = {
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
	itemIndex?: number;
};

const e164Phone = { mode: 'phone', value: '+15551234567', __rl: true };

const defaultParameters: Record<string, unknown> = {
	advancedOptions: {},
	bodyJson: '{}',
	phoneNumberId: TEST_PHONE_NUMBER_ID,
	businessAccountId: 'biz-100',
	conversationId: '550e8400-e29b-41d4-a716-446655440000',
	assignmentId: 'assign-1',
	contactIdentifier: 'contact-1',
	webhookId: 'webhook-1',
	flowId: 'flow-1',
	flowCta: 'Open flow',
	flowToken: 'flow-token-abc',
	flowAction: 'navigate',
	versionId: 'version-1',
	broadcastId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	mediaId: '425509551842',
	templateId: 'template-1',
	messageId: 'wamid.test',
	platformMessageId: 'wamid.test',
	recipient: { mode: 'phone', value: '15551234567', __rl: true },
	textBody: 'hello',
	mediaSource: 'id',
	stickerSource: 'id',
	stickerMediaId: '425509551842',
	caption: '',
	filename: '',
	bodyText: 'Choose an option',
	listButtonText: 'View options',
	ctaButtonLabel: 'Open',
	ctaButtonUrl: 'https://example.com',
	headerText: '',
	footerText: '',
	buttons: {
		buttonValues: [{ buttonId: 'btn_yes', buttonTitle: 'Yes' }],
	},
	sections: {
		sectionValues: [
			{
				sectionTitle: 'Delivery',
				rowValues: [{ rowId: 'standard', rowTitle: 'Standard', rowDescription: '3-5 days' }],
			},
		],
	},
	contacts: {
		contactValues: [
			{
				formattedName: 'John Doe',
				firstName: 'John',
				lastName: 'Doe',
				phones: {
					phoneValues: [{ phoneNumber: '+15559876543', phoneType: 'MOBILE' }],
				},
				emails: {
					emailValues: [{ email: 'john@example.com', emailType: 'WORK' }],
				},
			},
		],
	},
	templateName: 'hello_world|en_US',
	languageCode: 'en_US',
	templateDetectedHeaderFormat: 'none',
	templateDetectedComponentMode: 'standard',
	templateBodyParametersMapper: {
		mappingMode: 'defineBelow',
		value: { first_name: 'Jessica' },
	},
	templateButtonParametersMapper: {
		mappingMode: 'defineBelow',
		value: null,
	},
	headerParameter: '',
	templateHeaderText: '',
	buttonHeaderType: 'none',
	listHeaderType: 'none',
	reactionMessageId: 'wamid.react',
	reactionMode: 'react',
	emoji: '👍',
	typingIndicator: false,
	downloadToken: 'download-token',
	customMethod: 'GET',
	customApiSurface: 'platform',
	customPath: '/whatsapp/phone_numbers',
	conversationStatus: 'ended',
	contactWaId: e164Phone,
	contactProfileName: 'John Doe',
	contactDisplayName: 'John (VIP)',
	contactCustomerId: '',
	contactMetadataJson: '{}',
	broadcastName: 'Weekend Sale',
	broadcastPhoneNumberId: TEST_PHONE_NUMBER_ID,
	broadcastTemplateId: '784203120908608',
	scheduledAt: '2099-06-01T12:00:00.000Z',
	broadcastRecipients: {
		recipientValues: [{ phoneNumber: e164Phone }],
	},
	recipientsBodyJson: '',
	ingestPhoneNumberId: TEST_PHONE_NUMBER_ID,
	ingestSourceUrl: 'https://example.com/image.png',
	ingestDelivery: 'meta_media',
	catalogId: { mode: 'id', value: 'CATALOG_ID', __rl: true },
	productRetailerId: { mode: 'id', value: 'SKU_1234', __rl: true },
	catalogThumbnailProductId: { mode: 'id', value: 'SKU_THUMB', __rl: true },
	productListHeaderType: 'text',
	productListHeaderText: 'Our products',
	productSections: {
		sectionValues: [
			{
				sectionTitle: 'Popular',
				productItems: {
					product: [{ productRetailerId: 'SKU_1' }],
				},
			},
		],
	},
	blockedUsers: {
		userValues: [{ user: { mode: 'phone', value: '15551234567', __rl: true } }],
	},
};

export function createMockExecuteFunctions(
	parameters: Record<string, unknown> = {},
	options: MockExecuteOptions = {},
): IExecuteFunctions {
	const itemIndex = options.itemIndex ?? 0;
	const merged = { ...defaultParameters, ...parameters };

	return {
		getNodeParameter(name: string, index: number, defaultValue?: unknown) {
			if (index !== itemIndex) {
				throw new Error(`Unexpected item index ${index}`);
			}

			if (Object.prototype.hasOwnProperty.call(merged, name)) {
				return merged[name];
			}

			return defaultValue ?? '';
		},
		getCurrentNodeParameter(name: string) {
			if (Object.prototype.hasOwnProperty.call(merged, name)) {
				return merged[name];
			}

			return '';
		},
		getNode: () => ({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }) as INode,
		getInputData: () => options.items ?? [{ json: {} }],
		getCredentials: async () => ({
			baseUrl: 'https://api.kapso.ai',
			apiKey: 'test-api-key',
		}),
		helpers: {
			request: async () => ({}),
			getBinaryDataBuffer: async () => Buffer.from(''),
			prepareBinaryData: async () => ({}),
		},
		continueOnFail: () => options.continueOnFail ?? false,
	} as unknown as IExecuteFunctions;
}
