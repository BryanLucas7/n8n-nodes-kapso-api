import { IDataObject, IExecuteFunctions, ILoadOptionsFunctions, NodeApiError } from 'n8n-workflow';
import { cleanObject } from './json';
import { normalizeKapsoError } from './errors';
import { KapsoCredentials, KapsoRequestArgs, KapsoRequestOptions } from './types';

export const DEFAULT_KAPSO_BASE_URL = 'https://api.kapso.ai';

const API_PREFIX: Record<KapsoRequestArgs['api'], string> = {
	platform: '/platform/v1',
	whatsapp: '/meta/whatsapp/v24.0',
	mediaDownload: '/meta/whatsapp',
};

export function trimSlashes(value: string): string {
	return value.replace(/^\/+|\/+$/g, '');
}

export function joinUrl(baseUrl: string, ...parts: string[]): string {
	const [scheme, rest] = baseUrl.trim().split('://');
	const normalizedBase = rest ? `${scheme}://${trimSlashes(rest)}` : trimSlashes(baseUrl);
	const normalizedParts = parts.map((part) => trimSlashes(part)).filter(Boolean);

	return [normalizedBase, ...normalizedParts].join('/');
}

export function buildKapsoRequestOptions(
	credentials: KapsoCredentials,
	args: KapsoRequestArgs,
): KapsoRequestOptions {
	const requiresAuth = args.requiresAuth ?? true;
	const headers: IDataObject = {
		Accept: 'application/json',
		...(args.formData ? {} : { 'Content-Type': 'application/json' }),
		...(requiresAuth ? { 'X-API-Key': credentials.apiKey } : {}),
		...(args.headers ?? {}),
	};

	const options: KapsoRequestOptions = {
		method: args.method,
		uri: joinUrl(credentials.baseUrl || DEFAULT_KAPSO_BASE_URL, API_PREFIX[args.api], args.path),
		headers,
		json: args.json ?? true,
	};

	const query = cleanObject(args.query);
	if (Object.keys(query).length > 0) {
		options.qs = query;
	}

	if (args.body !== undefined) {
		options.body = args.body;
	}

	if (args.formData !== undefined) {
		options.formData = args.formData;
	}

	if (args.encoding !== undefined) {
		options.encoding = args.encoding;
	}

	if (args.returnFullResponse) {
		options.resolveWithFullResponse = true;
	}

	return options;
}

type KapsoCredentialContext = IExecuteFunctions | ILoadOptionsFunctions;

export async function getKapsoCredentials(context: KapsoCredentialContext): Promise<KapsoCredentials> {
	const credentials = await context.getCredentials('kapsoApi');

	return {
		baseUrl: String(credentials.baseUrl || DEFAULT_KAPSO_BASE_URL),
		apiKey: String(credentials.apiKey || ''),
	};
}

export async function kapsoApiRequest(
	ef: IExecuteFunctions,
	args: KapsoRequestArgs,
	itemIndex?: number,
): Promise<unknown> {
	const credentials = await getKapsoCredentials(ef);
	const options = buildKapsoRequestOptions(credentials, args);

	try {
		return await ef.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(ef.getNode(), normalizeKapsoError(error) as never, { itemIndex });
	}
}
