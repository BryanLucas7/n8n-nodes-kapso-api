import { describe, expect, it } from 'vitest';
import { normalizeContactInput } from '../../nodes/KapsoApi/actions/contactInput';

describe('normalizeContactInput', () => {
	it('flattens Additional Contact Details into the contact payload shape', () => {
		expect(
			normalizeContactInput({
				formattedName: 'Jane Smith',
				firstName: 'Jane',
				lastName: 'Smith',
				phones: {
					phoneValues: [{ phoneNumber: '+15551111111', phoneType: 'MOBILE' }],
				},
				contactAdditionalDetails: {
					middleName: 'Ann',
					namePrefix: 'Dr.',
					birthday: '1990-01-01',
					organization: 'Kapso',
					emails: {
						emailValues: [{ email: 'jane@example.com', emailType: 'WORK' }],
					},
				},
			}),
		).toEqual({
			formattedName: 'Jane Smith',
			firstName: 'Jane',
			lastName: 'Smith',
			middleName: 'Ann',
			namePrefix: 'Dr.',
			nameSuffix: undefined,
			birthday: '1990-01-01',
			phones: {
				phoneValues: [{ phoneNumber: '+15551111111', phoneType: 'MOBILE' }],
			},
			emails: {
				emailValues: [{ email: 'jane@example.com', emailType: 'WORK' }],
			},
			organization: 'Kapso',
			orgDepartment: undefined,
			orgTitle: undefined,
			urls: undefined,
			addresses: undefined,
		});
	});

	it('keeps legacy top-level optional fields working', () => {
		expect(
			normalizeContactInput({
				formattedName: 'John Doe',
				middleName: 'Q',
				phones: {
					phoneValues: [{ phoneNumber: '+15559876543' }],
				},
				emails: {
					emailValues: [{ email: 'john@example.com' }],
				},
			}),
		).toMatchObject({
			formattedName: 'John Doe',
			middleName: 'Q',
			emails: {
				emailValues: [{ email: 'john@example.com' }],
			},
		});
	});
});
