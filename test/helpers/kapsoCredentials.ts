export const TEST_PHONE_NUMBER_ID = '100000000000000';

export type LiveKapsoCredentials = {
	apiKey: string;
	baseUrl: string;
	phoneNumberId: string;
};

export function loadLiveCredentials(): LiveKapsoCredentials {
	const apiKey = process.env.KAPSO_API_KEY;
	if (!apiKey) {
		throw new Error('KAPSO_API_KEY is required for live tests.');
	}

	const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;
	if (!phoneNumberId) {
		throw new Error('KAPSO_PHONE_NUMBER_ID is required for live tests.');
	}

	return {
		apiKey: String(apiKey),
		baseUrl: process.env.KAPSO_BASE_URL || 'https://api.kapso.ai',
		phoneNumberId,
	};
}
