import { describe, expect, it } from 'vitest';
import { normalizeKapsoError } from '../../nodes/KapsoApi/transport/errors';

describe('normalizeKapsoError', () => {
	it('prefers nested API error messages and status codes', () => {
		expect(
			normalizeKapsoError({
				statusCode: 422,
				response: {
					status: 422,
					data: {
						error: {
							message: 'Template parameter mismatch',
						},
					},
				},
			}),
		).toEqual({
			message: 'Kapso API error 422: Template parameter mismatch',
			description: JSON.stringify({
				error: { message: 'Template parameter mismatch' },
			}),
			httpCode: '422',
		});
	});

	it('falls back to top-level message and description fields', () => {
		expect(
			normalizeKapsoError({
				message: 'Request failed locally',
				body: {
					error_description: 'Invalid OAuth token',
				},
			}),
		).toEqual({
			message: 'Invalid OAuth token',
			description: JSON.stringify({
				error_description: 'Invalid OAuth token',
			}),
		});
	});

	it('uses detail and plain error payloads when message fields are absent', () => {
		expect(
			normalizeKapsoError({
				status: 503,
				error: {
					detail: 'Service unavailable',
				},
			}),
		).toEqual({
			message: 'Kapso API error 503: Service unavailable',
			description: JSON.stringify({
				detail: 'Service unavailable',
			}),
			httpCode: '503',
		});
	});

	it('returns a generic fallback for unknown error shapes', () => {
		expect(normalizeKapsoError('network down')).toEqual({
			message: 'Kapso API request failed',
			description: 'Kapso API request failed',
		});
	});

	it('uses status when statusCode is not present', () => {
		expect(
			normalizeKapsoError({
				status: 418,
				message: 'Teapot',
			}),
		).toEqual({
			message: 'Kapso API error 418: Teapot',
			description: JSON.stringify({
				status: 418,
				message: 'Teapot',
			}),
			httpCode: '418',
		});
	});

	it('uses response status when top-level statusCode is absent', () => {
		expect(
			normalizeKapsoError({
				response: {
					status: 502,
				},
				message: 'Bad gateway',
			}),
		).toEqual({
			message: 'Kapso API error 502: Bad gateway',
			description: JSON.stringify({
				response: { status: 502 },
				message: 'Bad gateway',
			}),
			httpCode: '502',
		});
	});
});
