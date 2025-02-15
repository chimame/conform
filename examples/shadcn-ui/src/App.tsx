import { getMetadata, isInput, isTouched, useFormControl } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { useRef } from 'react';
import { z } from 'zod';
import {
	Field,
	FieldError,
	Button,
	Label,
	Input,
	Textarea,
	DatePicker,
	CountryPicker,
	RadioGroup,
	Checkbox,
	Select,
	Slider,
	Switch,
	SingleToggleGroup,
	MultiToggleGroup,
	InputOTP,
} from './components/form';

const schema = coerceZodFormData(
	z.object({
		name: z.string().min(3),
		dateOfBirth: z
			.date()
			.max(new Date(), { message: 'Date of birth cannot be in the future' }),
		country: z.string(),
		gender: z.enum(['male', 'female', 'other']),
		agreeToTerms: z.boolean(),
		job: z.enum(['developer', 'designer', 'manager']),
		age: z.number().min(18),
		isAdult: z
			.boolean()
			.optional()
			.refine((val) => val == true, 'You must be an adult'),
		description: z.string().min(10),
		accountType: z.enum(['personal', 'business']),
		accountTypes: z.array(z.enum(['personal', 'business'])).min(1),
		interests: z.array(z.string()).min(3),
		code: z.string().length(6),
	}),
);

export default function App() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, handleSubmit, intent } = useFormControl(formRef, {
		onValidate(value) {
			return resolveZodResult(schema.safeParse(value));
		},
		onSubmit(event, { value }) {
			event.preventDefault();
			alert(JSON.stringify(value, null, 2));
		},
	});
	const { fields } = getMetadata(state, {
		defaultValue: {
			dateOfBirth: new Date('2000-01-01'),
			country: 'US',
			agreeToTerms: true,
			job: 'developer',
			age: 20,
			code: '000000',
			isAdult: true,
			gender: 'female',
			accountType: 'business',
			interests: ['ember', 'react', 'next'],
		},
	});

	return (
		<div className="flex flex-col gap-6 p-10">
			<h1 className="text-2xl">Shadcn + Conform example</h1>
			<form
				method="POST"
				ref={formRef}
				onSubmit={handleSubmit}
				onBlur={(event) => {
					if (isInput(event.target) && !isTouched(state, event.target.name)) {
						intent.validate(event.target.name);
					}
				}}
				onInput={(event) => {
					if (isInput(event.target) && isTouched(state, event.target.name)) {
						intent.validate(event.target.name);
					}
				}}
				className="flex flex-col gap-4 items-start"
			>
				<Field>
					<Label>Name</Label>
					<Input name={fields.name.name} type="text" />
					<FieldError>{fields.name.errors}</FieldError>
				</Field>
				<Field>
					<Label>Birth date</Label>
					<DatePicker
						name={fields.dateOfBirth.name}
						defaultValue={fields.dateOfBirth.defaultValue}
					/>
					<FieldError>{fields.dateOfBirth.errors}</FieldError>
				</Field>
				<Field>
					<Label>Country</Label>
					<CountryPicker
						name={fields.country.name}
						defaultValue={fields.country.defaultValue}
					/>
					<FieldError>{fields.country.errors}</FieldError>
				</Field>
				<Field>
					<Label>Gender</Label>
					<RadioGroup
						name={fields.gender.name}
						defaultValue={fields.gender.defaultValue}
						items={[
							{ value: 'male', label: 'male' },
							{ value: 'female', label: 'female' },
							{ value: 'other', label: 'other' },
						]}
					/>
					<FieldError>{fields.gender.errors}</FieldError>
				</Field>
				<Field>
					<div className="flex gap-2 items-center">
						<Checkbox
							name={fields.agreeToTerms.name}
							defaultChecked={fields.agreeToTerms.defaultValue === 'on'}
						/>
						<Label>Agree to terms</Label>
					</div>
					<FieldError>{fields.agreeToTerms.errors}</FieldError>
				</Field>
				<Field>
					<Label>Job</Label>
					<Select
						placeholder="Select a job"
						name={fields.job.name}
						defaultValue={fields.job.defaultSelected}
						items={[
							{ value: 'developer', name: 'Developer' },
							{ value: 'designer', name: 'Design' },
							{ value: 'manager', name: 'Manager' },
						]}
					/>
					<FieldError>{fields.job.errors}</FieldError>
				</Field>
				<Field>
					<Label>Age</Label>
					<Slider
						name={fields.age.name}
						defaultValue={fields.age.defaultValue}
					/>
					<FieldError>{fields.age.errors}</FieldError>
				</Field>
				<Field>
					<div className="flex items-center gap-2">
						<Label>Is adult</Label>
						<Switch
							name={fields.isAdult.name}
							defaultChecked={fields.isAdult.defaultValue === 'on'}
						/>
					</div>
					<FieldError>{fields.isAdult.errors}</FieldError>
				</Field>
				<Field>
					<Label>Description</Label>
					<Textarea name={fields.description.name} />
					<FieldError>{fields.description.errors}</FieldError>
				</Field>
				<Field>
					<Label>Account type</Label>
					<SingleToggleGroup
						name={fields.accountType.name}
						defaultValue={fields.accountType.defaultValue}
						items={[
							{ value: 'personal', label: 'Personal' },
							{ value: 'business', label: 'Business' },
						]}
					/>
					<FieldError>{fields.accountType.errors}</FieldError>
				</Field>
				<Field>
					<Label>Account types</Label>
					<MultiToggleGroup
						name={fields.accountTypes.name}
						defaultValue={fields.accountType.defaultSelected}
						items={[
							{ value: 'personal', label: 'Personal' },
							{ value: 'business', label: 'Business' },
							{ value: 'business2', label: 'Business2' },
						]}
					/>
					<FieldError>{fields.accountTypes.errors}</FieldError>
				</Field>
				<Field>
					<fieldset>Interests</fieldset>
					{[
						{ value: 'react', name: 'React' },
						{ value: 'vue', name: 'Vue' },
						{ value: 'svelte', name: 'Svelte' },
						{ value: 'angular', name: 'Angular' },
						{ value: 'ember', name: 'Ember' },
						{ value: 'next', name: 'Next' },
						{ value: 'nuxt', name: 'Nuxt' },
						{ value: 'sapper', name: 'Sapper' },
						{ value: 'glimmer', name: 'Glimmer' },
					].map((option) => (
						<div key={option.value} className="flex items-center gap-2">
							<Checkbox
								name={fields.interests.name}
								value={option.value}
								defaultChecked={fields.interests.defaultSelected?.includes(
									option.value,
								)}
							/>
							<label>{option.name}</label>
						</div>
					))}
					<FieldError>{fields.interests.errors}</FieldError>
				</Field>
				<Field>
					<Label>Code</Label>
					<InputOTP
						name={fields.code.name}
						defaultValue={fields.code.defaultValue}
						length={6}
					/>
					<FieldError>{fields.code.errors}</FieldError>
				</Field>

				<div className="flex gap-2">
					<Button type="submit">Submit</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => intent.reset()}
					>
						Reset
					</Button>
				</div>
			</form>
		</div>
	);
}
