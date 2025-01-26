import { getFieldset, isInput, useForm } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { z } from 'zod';
import {
	TextField,
	Button,
	Stack,
	Container,
	Typography,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	RadioGroup,
	Radio,
	Switch,
} from '@mui/material';
import { useRef } from 'react';
import {
	ExampleSelect,
	ExampleAutocomplete,
	ExampleRating,
	ExampleSlider,
} from './form';

const schema = coerceZodFormData(
	z.object({
		email: z.string(),
		description: z.string(),
		language: z.string(),
		movie: z.string(),
		subscribe: z.boolean(),
		active: z.string(),
		enabled: z.boolean(),
		score: z.number(),
		progress: z.number().min(3).max(7),
	}),
);

export default function App() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, initialValue, handleSubmit, intent } = useForm(formRef, {
		onValidate(value) {
			const result = schema.safeParse(value);
			return resolveZodResult(result);
		},
		onSubmit(e, { value }) {
			e.preventDefault();
			alert(JSON.stringify(value, null, 2));
		},
	});
	const fields = getFieldset(initialValue, state);

	return (
		<Container maxWidth="sm">
			<form
				ref={formRef}
				onSubmit={handleSubmit}
				onBlur={(event) => {
					if (
						isInput(event.target) &&
						!state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				onInput={(event) => {
					if (
						isInput(event.target) &&
						state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				noValidate
			>
				<Stack spacing={4} marginY={4}>
					<header>
						<Typography variant="h6" component="h1">
							Material UI Example
						</Typography>
						<Typography variant="subtitle1">
							This example shows you how to integrate Inputs components with
							Conform.
						</Typography>
					</header>

					<TextField
						label="Email (TextField)"
						type="email"
						name="email"
						error={!fields.email.valid}
						helperText={fields.email.error}
					/>

					<TextField
						label="Description (TextField - multline)"
						name={fields.description.name}
						error={!fields.description.valid}
						helperText={fields.description.error}
						inputProps={{
							minLength: 10,
						}}
						multiline
					/>

					<ExampleSelect
						label="Language (Select)"
						name={fields.language.name}
						error={fields.language.error}
					/>

					<ExampleAutocomplete
						label="Movie (Autocomplete)"
						name={fields.movie.name}
						error={fields.movie.error}
					/>

					<FormControl
						component="fieldset"
						variant="standard"
						error={!fields.subscribe.valid}
					>
						<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={<Checkbox name={fields.subscribe.name} />}
								label="Newsletter"
							/>
						</FormGroup>
						<FormHelperText>{fields.subscribe.error}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={!fields.active.valid}>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup name={fields.active.name}>
							<FormControlLabel value="yes" control={<Radio />} label="Yes" />
							<FormControlLabel value="no" control={<Radio />} label="No" />
						</RadioGroup>
						<FormHelperText>{fields.active.error}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={Boolean(fields.enabled.error)}>
						<FormLabel>Enabled (Switch)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={<Switch name={fields.enabled.name} />}
								label="Enabled"
							/>
						</FormGroup>
						<FormHelperText>{fields.enabled.error}</FormHelperText>
					</FormControl>

					<ExampleRating
						label="Score (Rating)"
						name={fields.score.name}
						error={fields.score.error}
					/>

					<ExampleSlider
						label="Progress (Slider)"
						name={fields.progress.name}
						error={fields.progress.error}
					/>

					<Stack direction="row" justifyContent="flex-end" spacing={2}>
						<Button
							type="button"
							variant="outlined"
							onClick={() => intent.reset()}
						>
							Reset
						</Button>
						<Button type="submit" variant="contained">
							Submit
						</Button>
					</Stack>
				</Stack>
			</form>
		</Container>
	);
}
