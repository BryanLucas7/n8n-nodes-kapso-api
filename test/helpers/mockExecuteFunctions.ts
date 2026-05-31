import { IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';
import { TEST_PHONE_NUMBER_ID } from './kapsoCredentials';

export type MockExecuteOptions = {
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
	itemIndex?: number;
};

const defaultParameters: Record<string, unknown> = {
	advancedOptions: {},
	bodyJson: '{}',
	phoneNumberId: TEST_PHONE_NUMBER_ID,
	businessAccountId: 'biz-100',
	conversationId: 'conv-1',
	assignmentId: 'assign-1',
	contactIdentifier: 'contact-1',
	webhookId: 'webhook-1',
	flowId: 'flow-1',
	flowName: '',
	flowCta: 'Open flow',
	flowToken: 'flow-token-abc',
	flowAction: 'navigate',
	versionId: 'version-1',
	broadcastId: 'broadcast-1',
	mediaId: 'media-1',
	templateId: 'template-1',
	messageId: 'wamid.test',
	platformMessageId: 'wamid.test',
	recipient: '15551234567',
	textBody: 'hello',
	mediaSource: 'id',
	mediaValue: 'media-id',
	caption: '',
	filename: '',
	bodyText: 'Choose an option',
	listButtonText: 'View options',
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
	templateName: 'hello_world',
	languageCode: 'en_US',
	templateBodyParameters: {
		parameterValues: [{ parameterText: 'Jessica' }],
	},
	headerParameter: '',
	templateHeaderType: 'none',
	templateHeaderText: '',
	templateHeaderImageUrl: '',
	buttonHeaderType: 'none',
	listHeaderType: 'none',
	templateButtonParameters: {},
	reactionMessageId: 'wamid.react',
	emoji: '👍',
	typingIndicator: false,
	downloadToken: 'download-token',
	customMethod: 'GET',
	customApiSurface: 'platform',
	customPath: '/whatsapp/phone_numbers',
	conversationStatus: 'ended',
	contactWaId: '+15551234567',
	contactProfileName: 'John Doe',
	contactDisplayName: 'John (VIP)',
	contactCustomerId: '',
	contactMetadataJson: '{}',
	broadcastName: 'Weekend Sale',
	broadcastPhoneNumberId: TEST_PHONE_NUMBER_ID,
	broadcastTemplateId: '784203120908608',
	scheduledAt: '2026-06-01T12:00:00.000Z',
	broadcastRecipients: {
		recipientValues: [{ phoneNumber: '+15551234567' }],
	},
	recipientsBodyJson: '',
	ingestPhoneNumberId: TEST_PHONE_NUMBER_ID,
	ingestSourceUrl: 'https://example.com/image.png',
	ingestDelivery: 'meta_media',
	catalogId: 'CATALOG_ID',
	productRetailerId: 'SKU_1234',
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
	catalogThumbnailProductId: 'SKU_THUMB',
	blockedUsers: {
		userValues: [{ user: '15551234567' }],
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
