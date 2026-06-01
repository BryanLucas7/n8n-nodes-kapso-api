import { buildKapsoRequestOptions } from '../../nodes/KapsoApi/transport/request';
import { KapsoRequestArgs } from '../../nodes/KapsoApi/transport/types';
import { requestWithNodeHttps } from './http';
import type { LiveKapsoCredentials } from './kapsoCredentials';
import { businessAccountIdFromPhoneDetail } from './liveEnv';

export async function kapsoLiveRequest(
	credentials: LiveKapsoCredentials,
	args: KapsoRequestArgs,
): Promise<unknown> {
	return requestWithNodeHttps(buildKapsoRequestOptions(credentials, args));
}

export async function resolveLiveBusinessAccountId(
	credentials: LiveKapsoCredentials,
	phoneNumberId = credentials.phoneNumberId,
): Promise<string> {
	const response = await kapsoLiveRequest(credentials, {
		api: 'platform',
		method: 'GET',
		path: `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId)}`,
	});

	const wabaId = businessAccountIdFromPhoneDetail(response);
	if (!wabaId) {
		throw new Error(`Could not resolve business_account_id for phone number ${phoneNumberId}.`);
	}

	return wabaId;
}

export function expectListResponse(response: unknown): unknown[] {
	if (!response || typeof response !== 'object') {
		throw new Error('Expected a list response object.');
	}

	const data = (response as { data?: unknown }).data;
	if (!Array.isArray(data)) {
		throw new Error('Expected response.data to be an array.');
	}

	return data;
}
