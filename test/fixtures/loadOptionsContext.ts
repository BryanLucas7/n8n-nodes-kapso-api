import { vi } from 'vitest';
import { IDataObject } from 'n8n-workflow';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

export type LoadOptionsContextOptions = {
	parameters?: Record<string, unknown>;
	requestMock?: ReturnType<typeof vi.fn>;
	credentialsError?: Error;
};

export function createLoadOptionsContext(options: LoadOptionsContextOptions = {}) {
	const parameters: Record<string, unknown> = {
		phoneNumberId: TEST_PHONE_NUMBER_ID,
		templateName: 'order_update',
		languageCode: 'en_US',
		...options.parameters,
	};

	return {
		getCredentials: options.credentialsError
			? vi.fn().mockRejectedValue(options.credentialsError)
			: vi.fn().mockResolvedValue({
					baseUrl: 'https://api.kapso.ai',
					apiKey: 'test-key',
				}),
		getCurrentNodeParameter: vi.fn((name: string) => parameters[name]),
		getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
		helpers: {
			request: options.requestMock ?? vi.fn().mockResolvedValue({ data: [] }),
		},
	} as never;
}

export function wabaPhoneResponse(wabaId = 'waba-test'): IDataObject {
	return {
		data: {
			phone_number_id: TEST_PHONE_NUMBER_ID,
			business_account_id: wabaId,
		},
	};
}
