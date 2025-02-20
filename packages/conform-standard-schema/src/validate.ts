import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Submission } from 'conform-dom';

export async function standardValidate<T extends StandardSchemaV1>(
	schema: T,
	input: Submission['value'],
) {
	let result = schema['~standard'].validate(input);
	if (result instanceof Promise) result = await result;

	return result;
}
