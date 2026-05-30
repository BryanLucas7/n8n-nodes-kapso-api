import { describe, expect, it } from 'vitest';
import { parseJsonObject, parseJsonValue, cleanObject } from '../../nodes/KapsoApi/transport/json';

describe('transport/json', () => {
	it('parses JSON objects from strings and plain objects', () => {
		expect(parseJsonObject('{"a":1}', 'Body JSON')).toEqual({ a: 1 });
		expect(parseJsonObject({ b: 2 }, 'Body JSON')).toEqual({ b: 2 });
		expect(parseJsonObject(undefined, 'Body JSON')).toEqual({});
	});

	it('rejects non-object JSON values', () => {
		expect(() => parseJsonObject('[]', 'Body JSON')).toThrow(/must be valid JSON object syntax/);
		expect(() => parseJsonObject('{"a":1', 'Body JSON')).toThrow(/must be valid JSON object syntax/);
	});

	it('parses arbitrary JSON values', () => {
		expect(parseJsonValue('["x"]', 'Components')).toEqual(['x']);
		expect(parseJsonValue(undefined, 'Components')).toBeUndefined();
		expect(() => parseJsonValue('{bad', 'Components')).toThrow(/must be valid JSON syntax/);
	});

	it('removes empty query values', () => {
		expect(cleanObject({ keep: 'yes', drop: '', nil: null, missing: undefined })).toEqual({
			keep: 'yes',
		});
	});
});
