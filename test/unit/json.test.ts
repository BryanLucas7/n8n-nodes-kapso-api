import { describe, expect, it } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import { parseJsonObject, parseJsonValue, cleanObject } from '../../nodes/KapsoApi/transport/json';
import { JSON_PAYLOAD_MAX_BYTES } from '../../nodes/KapsoApi/properties/fieldConstraints';

describe('transport/json', () => {
	it('parses JSON objects from strings and plain objects', () => {
		expect(parseJsonObject('{"a":1}', 'Body JSON')).toEqual({ a: 1 });
		expect(parseJsonObject({ b: 2 }, 'Body JSON')).toEqual({ b: 2 });
		expect(parseJsonObject(undefined, 'Body JSON')).toEqual({});
	});

	it('rejects non-object JSON values', () => {
		expect(() => parseJsonObject('[]', 'Body JSON')).toThrow(/must be a JSON object/);
		expect(() => parseJsonObject('{"a":1', 'Body JSON')).toThrow(/must be valid JSON object syntax/);
		expect(() => parseJsonObject(123 as never, 'Body JSON')).toThrow(/must be a JSON object/);
	});

	it('rejects JSON payloads larger than the execution limit', () => {
		const oversized = JSON.stringify({ data: 'x'.repeat(JSON_PAYLOAD_MAX_BYTES) });

		expect(() => parseJsonObject(oversized, 'Body JSON')).toThrow(/maximum size/);
		expect(() => parseJsonValue(oversized, 'Components')).toThrow(/maximum size/);
	});

	it('parses arbitrary JSON values', () => {
		expect(parseJsonValue('["x"]', 'Components')).toEqual(['x']);
		expect(parseJsonValue(undefined, 'Components')).toBeUndefined();
		expect(parseJsonValue({ ready: true }, 'Components')).toEqual({ ready: true });
		expect(() => parseJsonValue('{bad', 'Components')).toThrow(/must be valid JSON syntax/);
	});

	it('removes empty query values', () => {
		expect(cleanObject({ keep: 'yes', drop: '', nil: null, missing: undefined })).toEqual({
			keep: 'yes',
		});
	});
});
