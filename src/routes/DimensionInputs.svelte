<script lang="ts">
	import type { BarcodeConfig, ValidationError } from './types';

	interface Props {
		config: BarcodeConfig;
		onConfigChange: (config: BarcodeConfig) => void;
		errors?: ValidationError[];
		disabled?: boolean;
	}

	let { config, onConfigChange, errors = [], disabled = false }: Props = $props();

	function handleWidthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const width = parseInt(target.value) || 0;
		onConfigChange({ ...config, width });
	}

	function handleHeightChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const height = parseInt(target.value) || 0;
		onConfigChange({ ...config, height });
	}

	function getErrorMessage(field: string): string | undefined {
		return errors.find((error) => error.field === field)?.message;
	}

	let widthError = $derived(getErrorMessage('width'));
	let heightError = $derived(getErrorMessage('height'));
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<div>
		<label for="width" class="mb-2 block text-sm font-medium text-gray-700"> Width (pixels) </label>
		<input
			id="width"
			type="number"
			min="50"
			max="500"
			value={config.width}
			{disabled}
			oninput={handleWidthChange}
			class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500
				{widthError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
			placeholder="200"
		/>
		{#if widthError}
			<p class="mt-1 text-sm text-red-600">{widthError}</p>
		{/if}
		<p class="mt-1 text-xs text-gray-500">Range: 50-500 pixels</p>
	</div>

	<div>
		<label for="height" class="mb-2 block text-sm font-medium text-gray-700">
			Height (pixels)
		</label>
		<input
			id="height"
			type="number"
			min="50"
			max="500"
			value={config.height}
			{disabled}
			oninput={handleHeightChange}
			class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500
				{heightError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
			placeholder="200"
		/>
		{#if heightError}
			<p class="mt-1 text-sm text-red-600">{heightError}</p>
		{/if}
		<p class="mt-1 text-xs text-gray-500">Range: 50-500 pixels</p>
	</div>
</div>

<div class="mt-4 rounded-lg bg-gray-50 p-4">
	<h4 class="mb-2 text-sm font-medium text-gray-700">Preview Dimensions</h4>
	<div class="flex items-center space-x-4 text-sm text-gray-600">
		<span>Size: {config.width} × {config.height} pixels</span>
		<span>•</span>
		<span>Aspect ratio: {(config.width / config.height).toFixed(2)}:1</span>
	</div>
</div>
