import { IDataObject } from 'n8n-workflow';

function isPlainObject(value: unknown): value is IDataObject {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseJsonObject(raw: string | IDataObject | undefined, fieldName: string): IDataObject {
	if (raw === undefined || raw === '') {
		return {};
	}

	if (isPlainObject(raw)) {
		return raw;
	}

	if (typeof raw !== 'string') {
		throw new Error(`${fieldName} must be a JSON object.`);
	}

	try {
		const parsed = JSON.parse(raw);
		if (!isPlainObject(parsed)) {
			throw new Error('not_object');
		}
		return parsed;
	} catch (error) {
		throw new Error(
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

	try {
		return JSON.parse(raw);
	} catch (error) {
		throw new Error(
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
