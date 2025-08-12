<script lang="ts">
	export let label: string;
	export let value: string;
	export let onChange: (color: string) => void;
	export let disabled = false;

	let textInput: HTMLInputElement;
	let colorInput: HTMLInputElement;

	function handleColorChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newColor = target.value;
		onChange(newColor);
	}

	function handleTextChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newColor = target.value;

		// Validate hex color format
		if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
			onChange(newColor);
		}
	}

	// Sync text input when color picker changes
	$: if (colorInput) {
		colorInput.value = value;
	}

	// Sync color picker when text input changes
	$: if (textInput && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
		textInput.value = value;
	}
</script>

<div class="color-picker">
	<label
		for="color-input-{label.replace(/\s+/g, '-').toLowerCase()}"
		class="mb-2 block text-sm font-medium text-gray-700"
	>
		{label}
	</label>

	<div class="flex items-center gap-2">
		<!-- Color input (visual picker) -->
		<input
			bind:this={colorInput}
			id="color-input-{label.replace(/\s+/g, '-').toLowerCase()}"
			type="color"
			{value}
			{disabled}
			on:input={handleColorChange}
			class="h-10 w-12 cursor-pointer rounded border border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
		/>

		<!-- Text input for hex values -->
		<input
			bind:this={textInput}
			type="text"
			{value}
			{disabled}
			placeholder="#000000"
			on:input={handleTextChange}
			class="flex-1 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm
				   focus:border-blue-500 focus:ring-2 focus:ring-blue-500
				   disabled:cursor-not-allowed disabled:bg-gray-100"
		/>
	</div>

	<!-- Color preview -->
	<div class="mt-2 flex items-center gap-2">
		<div class="h-6 w-6 rounded border border-gray-300" style="background-color: {value}"></div>
		<span class="font-mono text-xs text-gray-500">{value}</span>
	</div>
</div>

<style>
	/* Custom color input styling */
	input[type='color'] {
		-webkit-appearance: none;
		appearance: none;
		border: none;
		cursor: pointer;
	}

	input[type='color']::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	input[type='color']::-webkit-color-swatch {
		border: 1px solid #d1d5db;
		border-radius: 4px;
	}
</style>
