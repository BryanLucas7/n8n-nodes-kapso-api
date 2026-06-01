import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSelectedTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateFetch';
import { approvedTemplateList, namedOrderUpdateRaw } from '../fixtures/metaTemplates';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

const kapsoApiRequestMock = vi.fn();

vi.mock('../../nodes/KapsoApi/transport/request', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../nodes/KapsoApi/transport/request')>();
	return {
		...actual,
		kapsoApiRequest: (...args: unknown[]) => kapsoApiRequestMock(...args),
	};
});

function createExecuteContextWithRequest(
	parameters: Record<string, unknown>,
	requestMock: ReturnType<typeof vi.fn>,
) {
	const ef = createMockExecuteFunctions(parameters);
	ef.helpers.request = requestMock;
	return ef;
}

describe('fetchSelectedTemplateDefinition', () => {
	beforeEach(() => {
		kapsoApiRequestMock.mockReset();
	});

	it('returns undefined when template name or language is missing', async () => {
		const ef = createMockExecuteFunctions({
			templateName: '',
			languageCode: 'en_US',
		});

		await expect(fetchSelectedTemplateDefinition(ef)).resolves.toBeUndefined();
		expect(kapsoApiRequestMock).not.toHaveBeenCalled();
	});

	it('returns undefined when the approved template list does not contain the selection', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-test' } })
			.mockResolvedValueOnce({ data: approvedTemplateList });
		const ef = createExecuteContextWithRequest(
			{
				templateName: 'missing_template',
				languageCode: 'en_US',
			},
			request,
		);

		await expect(fetchSelectedTemplateDefinition(ef)).resolves.toBeUndefined();
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('loads a parsed template definition from the execute context', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-test' } })
			.mockResolvedValueOnce({ data: approvedTemplateList });
		const ef = createExecuteContextWithRequest(
			{
				templateName: 'order_update',
				languageCode: 'en_US',
				phoneNumberId: TEST_PHONE_NUMBER_ID,
			},
			request,
		);

		const definition = await fetchSelectedTemplateDefinition(ef);

		expect(definition?.name).toBe('order_update');
		expect(definition?.bodyVariables.map((entry) => entry.id)).toEqual(['first_name', 'order_id']);
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('loads template definitions through the execute transport when request helper is unavailable', async () => {
		kapsoApiRequestMock
			.mockResolvedValueOnce({
				data: { business_account_id: 'waba-test' },
			})
			.mockResolvedValueOnce({ data: approvedTemplateList });

		const ef = createMockExecuteFunctions({
			templateName: 'order_update',
			languageCode: 'en_US',
			phoneNumberId: TEST_PHONE_NUMBER_ID,
		});
		delete (ef.helpers as { request?: unknown }).request;

		const definition = await fetchSelectedTemplateDefinition(ef);

		expect(definition?.name).toBe('order_update');
		expect(kapsoApiRequestMock).toHaveBeenCalledTimes(2);
	});

	it('loads template definitions from the loadOptions context path', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-test' } })
			.mockResolvedValueOnce({ data: [namedOrderUpdateRaw] });

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => {
				if (name === 'phoneNumberId') return TEST_PHONE_NUMBER_ID;
				if (name === 'templateName') return 'order_update';
				if (name === 'languageCode') return 'en_US';
				return '';
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		const definition = await fetchSelectedTemplateDefinition(context, 'phoneNumberId');

		expect(definition?.language).toBe('en_US');
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('treats undefined loadOptions parameters as empty strings', async () => {
		const context = {
			getCurrentNodeParameter: vi.fn().mockReturnValue(undefined),
			helpers: { request: vi.fn() },
		} as never;

		await expect(fetchSelectedTemplateDefinition(context)).resolves.toBeUndefined();
	});

	it('returns no templates when phone number id is empty in loadOptions context', async () => {
		const context = {
			getCurrentNodeParameter: vi.fn().mockReturnValue(''),
			helpers: { request: vi.fn() },
		} as never;

		await expect(fetchSelectedTemplateDefinition(context)).resolves.toBeUndefined();
	});

	it('returns no templates when phone number id is empty on the execute path', async () => {
		const ef = createMockExecuteFunctions({
			phoneNumberId: '',
			templateName: 'order_update',
			languageCode: 'en_US',
		});
		delete (ef.helpers as { request?: unknown }).request;

		await expect(fetchSelectedTemplateDefinition(ef)).resolves.toBeUndefined();
		expect(kapsoApiRequestMock).not.toHaveBeenCalled();
	});

	it('returns no templates when the loadOptions WABA id cannot be resolved', async () => {
		const request = vi.fn().mockResolvedValueOnce({
			data: { phone_number_id: TEST_PHONE_NUMBER_ID },
		});
		const ef = createExecuteContextWithRequest(
			{
				templateName: 'order_update',
				languageCode: 'en_US',
				phoneNumberId: TEST_PHONE_NUMBER_ID,
			},
			request,
		);

		await expect(fetchSelectedTemplateDefinition(ef)).resolves.toBeUndefined();
		expect(request).toHaveBeenCalledOnce();
	});

	it('returns no templates when the execute WABA id cannot be resolved', async () => {
		kapsoApiRequestMock.mockResolvedValueOnce({
			data: { phone_number_id: TEST_PHONE_NUMBER_ID },
		});

		const ef = createMockExecuteFunctions({
			templateName: 'order_update',
			languageCode: 'en_US',
			phoneNumberId: TEST_PHONE_NUMBER_ID,
		});
		delete (ef.helpers as { request?: unknown }).request;

		await expect(fetchSelectedTemplateDefinition(ef)).resolves.toBeUndefined();
		expect(kapsoApiRequestMock).toHaveBeenCalledOnce();
	});

	it.each([
		['business_account_id', { business_account_id: 'waba-direct' }],
		['whatsapp_business_account_id', { whatsapp_business_account_id: 'waba-waba' }],
		['waba_id', { waba_id: 'waba-id-key' }],
		['businessAccountId', { businessAccountId: 'waba-camel' }],
	])('resolves execute WABA ids from %s', async (_label, phonePayload) => {
		kapsoApiRequestMock
			.mockResolvedValueOnce(phonePayload)
			.mockResolvedValueOnce({ data: approvedTemplateList });

		const ef = createMockExecuteFunctions({
			templateName: 'order_update',
			languageCode: 'en_US',
			phoneNumberId: TEST_PHONE_NUMBER_ID,
		});
		delete (ef.helpers as { request?: unknown }).request;

		const definition = await fetchSelectedTemplateDefinition(ef);

		expect(definition?.name).toBe('order_update');
		expect(kapsoApiRequestMock).toHaveBeenCalledTimes(2);
	});

	it('returns no templates when execute parameters resolve to undefined', async () => {
		kapsoApiRequestMock.mockReset();

		const context = {
			getNodeParameter: vi.fn().mockReturnValue(undefined),
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: {},
		} as never;

		await expect(fetchSelectedTemplateDefinition(context, 'phoneNumberId', 0)).resolves.toBeUndefined();
		expect(kapsoApiRequestMock).not.toHaveBeenCalled();
	});

	it('reads template parameters from execute contexts without getCurrentNodeParameter', async () => {
		kapsoApiRequestMock
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-test' } })
			.mockResolvedValueOnce({ data: [namedOrderUpdateRaw] });

		const context = {
			getNodeParameter: vi.fn((name: string) => {
				if (name === 'phoneNumberId') return TEST_PHONE_NUMBER_ID;
				if (name === 'templateName') return 'order_update';
				if (name === 'languageCode') return 'en_US';
				return undefined;
			}),
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: {},
		} as never;

		const definition = await fetchSelectedTemplateDefinition(context, 'phoneNumberId', 0);

		expect(definition?.name).toBe('order_update');
		expect(kapsoApiRequestMock).toHaveBeenCalledTimes(2);
	});
});
