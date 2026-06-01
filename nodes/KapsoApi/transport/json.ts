import { ApplicationError, IDataObject } from 'n8n-workflow';
import { JSON_PAYLOAD_MAX_BYTES } from '../properties/fieldConstraints';

function isPlainObject(value: unknown): value is IDataObject {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function assertJsonPayloadSize(
	raw: string,
	fieldName: string,
	maxBytes = JSON_PAYLOAD_MAX_BYTES,
): void {
	if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
		throw new ApplicationError(
			`${fieldName} exceeds the maximum size of ${maxBytes} bytes.`,
		);
	}
}

export function parseJsonObject(raw: string | IDataObject | undefined, fieldName: string): IDataObject {
	if (raw === undefined || raw === '') {
		return {};
	}

	if (isPlainObject(raw)) {
		return raw;
	}

	if (typeof raw !== 'string') {
		throw new ApplicationError(`${fieldName} must be a JSON object.`);
	}

	assertJsonPayloadSize(raw, fieldName);

	try {
		const parsed = JSON.parse(raw);
		if (!isPlainObject(parsed)) {
			throw new ApplicationError(`${fieldName} must be a JSON object.`);
		}
		return parsed;
	} catch (error) {
		if (error instanceof ApplicationError) {
			throw error;
		}

		throw new ApplicationError(
			`${fieldName} must be valid JSON object syntax. Received: ${raw.slice(0, 120)}`,
		);
	}
}

export function parseJsonValue(raw: string | IDataObject | undefined, fieldName: string): unknown {
	if (raw === undefined || raw === '') {
		return undefined;
	}

	if (typeof raw !== 'string') {
		return raw;
	}

	assertJsonPayloadSize(raw, fieldName);

	try {
		return JSON.parse(raw);
	} catch {
		throw new ApplicationError(
			`${fieldName} must be valid JSON syntax. Received: ${raw.slice(0, 120)}`,
		);
	}
}

export function cleanObject(input: IDataObject | undefined): IDataObject {
	const output: IDataObject = {};

	for (const [key, value] of Object.entries(input ?? {})) {
		if (value === undefined || value === null || value === '') {
			continue;
		}

		output[key] = value as IDataObject[keyof IDataObject];
	}

	return output;
}
