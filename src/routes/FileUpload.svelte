<script lang="ts">
	import type { ValidationError } from './types';

	interface Props {
		onFileSelect: (file: File) => void;
		error?: ValidationError | null;
		disabled?: boolean;
	}

	let { onFileSelect, error = null, disabled = false }: Props = $props();

	let fileInput: HTMLInputElement;
	let isDragOver = $state(false);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			onFileSelect(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		const file = event.dataTransfer?.files[0];
		if (file) {
			onFileSelect(file);
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="w-full">
	<label for="csv-file" class="mb-2 block text-sm font-medium text-gray-700"> CSV File </label>

	<div
		class="rounded-lg border-2 border-dashed p-8 text-center transition-colors
			{isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
			{disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={triggerFileInput}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
	>
		<svg
			class="mx-auto h-12 w-12 text-gray-400"
			stroke="currentColor"
			fill="none"
			viewBox="0 0 48 48"
		>
			<path
				d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>

		<p class="mt-2 text-sm text-gray-600">
			<span class="font-medium">Click to upload</span> or drag and drop
		</p>
		<p class="text-xs text-gray-500">CSV files only</p>
	</div>

	<input
		bind:this={fileInput}
		id="csv-file"
		type="file"
		accept=".csv,.txt"
		class="hidden"
		{disabled}
		onchange={handleFileSelect}
	/>

	{#if error}
		<p class="mt-2 text-sm text-red-600">{error.message}</p>
	{/if}
</div>
