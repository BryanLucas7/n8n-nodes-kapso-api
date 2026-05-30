import https from 'node:https';
import { KapsoRequestOptions } from '../../nodes/KapsoApi/transport/types';

export async function requestWithNodeHttps(options: KapsoRequestOptions): Promise<unknown> {
	const url = new URL(options.uri as string);

	for (const [key, value] of Object.entries(options.qs ?? {})) {
		url.searchParams.set(key, String(value));
	}

	return await new Promise((resolve, reject) => {
		const request = https.request(
			url,
			{
				method: options.method,
				headers: options.headers as Record<string, string>,
			},
			(response) => {
				const chunks: Buffer[] = [];

				response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
				response.on('end', () => {
					const body = Buffer.concat(chunks).toString('utf8');
					const parsed = body ? JSON.parse(body) : {};

					if ((response.statusCode ?? 500) >= 400) {
						reject({
							statusCode: response.statusCode,
							error: parsed,
							message: response.statusMessage,
						});
						return;
					}

					resolve(parsed);
				});
			},
		);

		request.on('error', reject);

		if (options.body !== undefined) {
			request.write(JSON.stringify(options.body));
		}

		request.end();
	});
}
