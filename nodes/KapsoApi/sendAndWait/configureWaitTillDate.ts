import {
	ApplicationError,
	IDataObject,
	IExecuteFunctions,
	NodeOperationError,
	WAIT_INDEFINITELY,
} from 'n8n-workflow';

export function configureWaitTillDate(context: IExecuteFunctions): Date {
	let waitTill = WAIT_INDEFINITELY;
	const limitOptions = context.getNodeParameter('options.limitWaitTime.values', 0, {}) as IDataObject;

	if (Object.keys(limitOptions).length > 0) {
		try {
			if (limitOptions.limitType === 'afterTimeInterval') {
				let waitAmount = Number(limitOptions.resumeAmount ?? 1);

				if (limitOptions.resumeUnit === 'minutes') {
					waitAmount *= 60;
				}
				if (limitOptions.resumeUnit === 'hours') {
					waitAmount *= 60 * 60;
				}
				if (limitOptions.resumeUnit === 'days') {
					waitAmount *= 60 * 60 * 24;
				}

				waitAmount *= 1000;
				waitTill = new Date(Date.now() + waitAmount);
			} else {
				waitTill = new Date(String(limitOptions.maxDateAndTime ?? ''));
			}

			if (Number.isNaN(waitTill.getTime())) {
				throw new ApplicationError('Invalid date format');
			}
		} catch (error) {
			throw new NodeOperationError(context.getNode(), 'Could not configure Limit Wait Time', {
				description: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return waitTill;
}
