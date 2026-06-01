import type { LiveKapsoCredentials } from './kapsoCredentials';

export type LiveTestMode = 'all' | 'production-readonly' | 'sandbox';

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is required for live tests.`);
	}

	return String(value);
}

function baseUrl(): string {
	return process.env.KAPSO_BASE_URL || 'https://api.kapso.ai';
}

export function isLiveTestsEnabled(): boolean {
	return process.env.RUN_KAPSO_LIVE_TESTS === '1';
}

export function getLiveTestMode(): LiveTestMode {
	const mode = process.env.RUN_KAPSO_LIVE_MODE;
	if (mode === 'sandbox' || mode === 'production-readonly') {
		return mode;
	}

	return 'all';
}

export function shouldRunSandboxLiveTests(): boolean {
	if (!isLiveTestsEnabled()) {
		return false;
	}

	const mode = getLiveTestMode();
	return mode === 'sandbox' || mode === 'all';
}

export function shouldRunProductionReadonlyLiveTests(): boolean {
	if (!isLiveTestsEnabled()) {
		return false;
	}

	const mode = getLiveTestMode();
	return mode === 'production-readonly' || mode === 'all';
}

export function shouldRunSharedLiveTests(): boolean {
	return isLiveTestsEnabled();
}

export function hasSandboxLiveConfig(): boolean {
	return Boolean(
		process.env.KAPSO_API_KEY &&
			(process.env.KAPSO_SANDBOX_PHONE_NUMBER_ID || process.env.KAPSO_PHONE_NUMBER_ID) &&
			process.env.KAPSO_TEST_RECIPIENT,
	);
}

export function hasProductionReadonlyLiveConfig(): boolean {
	return Boolean(
		process.env.KAPSO_API_KEY &&
			(process.env.KAPSO_PRODUCTION_PHONE_NUMBER_ID || process.env.KAPSO_PHONE_NUMBER_ID),
	);
}

export function loadSandboxLiveCredentials(): LiveKapsoCredentials {
	const phoneNumberId =
		process.env.KAPSO_SANDBOX_PHONE_NUMBER_ID || process.env.KAPSO_PHONE_NUMBER_ID;
	if (!phoneNumberId) {
		throw new Error(
			'KAPSO_SANDBOX_PHONE_NUMBER_ID (or KAPSO_PHONE_NUMBER_ID) is required for sandbox live tests.',
		);
	}

	return {
		apiKey: requireEnv('KAPSO_API_KEY'),
		baseUrl: baseUrl(),
		phoneNumberId,
	};
}

export function loadProductionLiveCredentials(): LiveKapsoCredentials {
	const phoneNumberId =
		process.env.KAPSO_PRODUCTION_PHONE_NUMBER_ID || process.env.KAPSO_PHONE_NUMBER_ID;
	if (!phoneNumberId) {
		throw new Error(
			'KAPSO_PRODUCTION_PHONE_NUMBER_ID (or KAPSO_PHONE_NUMBER_ID) is required for production live tests.',
		);
	}

	return {
		apiKey: requireEnv('KAPSO_API_KEY'),
		baseUrl: baseUrl(),
		phoneNumberId,
	};
}

export function sandboxRecipient(): string {
	return requireEnv('KAPSO_TEST_RECIPIENT');
}

export function isSandboxSendEnabled(): boolean {
	return process.env.RUN_KAPSO_LIVE_SEND_MESSAGE === '1' || getLiveTestMode() === 'sandbox';
}

export function isSandboxSessionWindowError(error: unknown): boolean {
	const serialized = JSON.stringify(error ?? {}).toLowerCase();

	return (
		serialized.includes('24-hour') ||
		serialized.includes('24 hour') ||
		serialized.includes('outside the 24-hour window') ||
		serialized.includes('non-template messages outside')
	);
}

export function businessAccountIdFromPhoneDetail(response: unknown): string | undefined {
	if (!response || typeof response !== 'object') {
		return undefined;
	}

	const record = response as { data?: Record<string, unknown> };
	const entry = record.data ?? (response as Record<string, unknown>);

	return String(
		entry.business_account_id ??
			entry.whatsapp_business_account_id ??
			entry.waba_id ??
			entry.businessAccountId ??
			'',
	).trim() || undefined;
}
