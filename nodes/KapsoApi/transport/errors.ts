import { IDataObject } from 'n8n-workflow';

function asObject(value: unknown): IDataObject | undefined {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}

	return undefined;
}

function pickMessage(body: IDataObject | undefined, fallback: string): string {
	const error = asObject(body?.error);

	return (
		(body?.message as string | undefined) ??
		(error?.message as string | undefined) ??
		(body?.error_description as string | undefined) ??
		(body?.detail as string | undefined) ??
		fallback
	);
}

export function normalizeKapsoError(error: unknown): IDataObject {
	const err = asObject(error) ?? {};
	const response = asObject(err.response);
	const responseBody =
		asObject(err.error) ?? asObject(response?.data) ?? asObject(err.body) ?? asObject(err);
	const statusCode =
		(err.statusCode as number | undefined) ??
		(err.status as number | undefined) ??
		(response?.status as number | undefined);
	const fallback = (err.message as string | undefined) ?? 'Kapso API request failed';
	const message = pickMessage(responseBody, fallback);

	const normalized: IDataObject = {
		message: statusCode ? `Kapso API error ${statusCode}: ${message}` : message,
		description: responseBody ? JSON.stringify(responseBody) : fallback,
	};

	if (statusCode) {
		normalized.httpCode = String(statusCode);
	}

	return normalized;
}
