import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { FormError } from 'conform-dom';
import { formatPaths } from 'conform-dom';

export function resolveStandardSchemaResult<Input, Output>(
	result: StandardSchemaV1.Result<Output>,
): FormError<Input, string[]> | null;
export function resolveStandardSchemaResult<Input, Output>(
	result: StandardSchemaV1.Result<Output>,
): {
	error: FormError<Input, string[]> | null;
	value: Output | undefined;
};
export function resolveStandardSchemaResult<Input, Output, ErrorShape>(
	result: StandardSchemaV1.Result<Output>,
):
	| FormError<Input, Array<string>>
	| null
	| {
			error: FormError<Input, Array<string> | ErrorShape> | null;
			value: Output | undefined;
	  } {
	let error: FormError<Input, Array<string> | ErrorShape> | null = null;
	let value: Output | undefined = undefined;

	if (result.issues) {
		const errorByName: Record<string, Array<StandardSchemaV1.Issue>> = {};

		for (const issue of result.issues) {
			// @ts-expect-error
			const name = formatPaths(issue.path ?? []);

			errorByName[name] ??= [];
			errorByName[name].push(issue);
		}

		const { '': formErrors = null, ...fieldErrors } = Object.entries(
			errorByName,
		).reduce<Record<string, Array<string> | ErrorShape>>(
			(result, [name, issues]) => {
				result[name] = issues.map((issue) => issue.message);

				return result;
			},
			{},
		);

		error = {
			formErrors,
			fieldErrors,
		};
	} else {
		value = result.value;
	}

	return {
		error,
		value,
	};
}
