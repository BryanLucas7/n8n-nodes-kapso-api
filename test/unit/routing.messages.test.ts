import { describe, expect, it } from 'vitest';
import { ApplicationError } from 'n8n-workflow';
import { buildMessageRequest, customRelativePath } from '../../nodes/KapsoApi/actions/routing';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

describe('routing message edge cases', () => {
	it('throws for unsupported message operations', () => {
		const ef = createMockExecuteFunctions();

		expect(() => buildMessageRequest(ef, 'unsupported', 0)).toThrow(ApplicationError);
	});

	it('requires custom relative paths', () => {
		expect(() => customRelativePath('')).toThrow(/Custom Relative Path is required/);
	});
});
