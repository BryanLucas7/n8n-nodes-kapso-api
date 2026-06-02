import { describe, expect, it } from 'vitest';
import { getNodeParameters } from 'n8n-workflow';
import { kapsoNodeProperties } from '../../nodes/KapsoApi/properties';

function visibleParameterNames(values: Record<string, unknown>): string[] {
	return Object.keys(values);
}

describe('sendTemplate parameter visibility', () => {
	it('shows text header input only when the detected header has a variable', () => {
		const parameters = getNodeParameters(
			kapsoNodeProperties,
			{
				resource: 'message',
				operation: 'sendTemplate',
				templateDetectedHeaderFormat: 'text',
				templateDetectedComponentMode: 'standard',
				templateHeaderTextHasVariable: 'yes',
			},
			true,
			false,
			null,
			{ properties: kapsoNodeProperties },
		);

		expect(visibleParameterNames(parameters)).toEqual(
			expect.arrayContaining(['templateHeaderText', 'templateBodyParametersMapper']),
		);
		expect(visibleParameterNames(parameters)).not.toContain('templateHeaderMediaUrl');
	});

	it('hides text header input for static text headers', () => {
		const parameters = getNodeParameters(
			kapsoNodeProperties,
			{
				resource: 'message',
				operation: 'sendTemplate',
				templateDetectedHeaderFormat: 'text',
				templateDetectedComponentMode: 'standard',
				templateHeaderTextHasVariable: 'no',
			},
			true,
			false,
			null,
			{ properties: kapsoNodeProperties },
		);

		expect(visibleParameterNames(parameters)).not.toContain('templateHeaderText');
		expect(visibleParameterNames(parameters)).toContain('templateBodyParametersMapper');
	});

	it('shows image header media fields when the detected header format is image', () => {
		const parameters = getNodeParameters(
			kapsoNodeProperties,
			{
				resource: 'message',
				operation: 'sendTemplate',
				templateDetectedHeaderFormat: 'image',
				templateDetectedComponentMode: 'standard',
				templateHeaderMediaSource: 'link',
			},
			true,
			false,
			null,
			{ properties: kapsoNodeProperties },
		);

		expect(visibleParameterNames(parameters)).toEqual(
			expect.arrayContaining(['templateHeaderMediaSource', 'templateHeaderMediaUrl']),
		);
		expect(visibleParameterNames(parameters)).not.toContain('templateHeaderText');
	});

	it('shows location header fields when the detected header format is location', () => {
		const parameters = getNodeParameters(
			kapsoNodeProperties,
			{
				resource: 'message',
				operation: 'sendTemplate',
				templateDetectedHeaderFormat: 'location',
				templateDetectedComponentMode: 'standard',
			},
			true,
			false,
			null,
			{ properties: kapsoNodeProperties },
		);

		expect(visibleParameterNames(parameters)).toEqual(
			expect.arrayContaining([
				'templateHeaderLatitude',
				'templateHeaderLongitude',
				'templateHeaderLocationName',
				'templateHeaderLocationAddress',
			]),
		);
	});

	it('shows carousel card collection when component mode is carousel', () => {
		const parameters = getNodeParameters(
			kapsoNodeProperties,
			{
				resource: 'message',
				operation: 'sendTemplate',
				templateDetectedHeaderFormat: 'none',
				templateDetectedComponentMode: 'carousel',
			},
			true,
			false,
			null,
			{ properties: kapsoNodeProperties },
		);

		expect(visibleParameterNames(parameters)).toContain('templateCarouselCards');
		expect(visibleParameterNames(parameters)).toContain('templateCarouselBodyParametersMapper');
		expect(visibleParameterNames(parameters)).not.toContain('templateBodyParametersMapper');
	});
});
