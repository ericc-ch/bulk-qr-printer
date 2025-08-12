<script lang="ts">
	import FileUpload from './FileUpload.svelte';
	import type { ValidationError } from './types';

	interface Props {
		onFileSelect: (file: File) => void;
		selectedFile: File | null;
		isLoading: boolean;
		fileError: ValidationError | undefined;
		csvDataLength: number;
		errors: ValidationError[];
	}

	let { onFileSelect, selectedFile, isLoading, fileError, csvDataLength, errors }: Props = $props();

	let isComplete = $derived(Boolean(selectedFile && csvDataLength > 0 && errors.length === 0));
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">1. Upload CSV File</h2>
		{#if isComplete}
			<span
				class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
			>
				✓ Complete
			</span>
		{/if}
	</div>

	<FileUpload {onFileSelect} error={fileError} disabled={isLoading} />

	{#if isLoading}
		<div class="flex items-center justify-center py-8">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-600">Processing file...</span>
		</div>
	{/if}

	{#if selectedFile && !isLoading}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h3 class="text-sm font-medium text-blue-800">Selected File</h3>
			<p class="text-sm text-blue-700">{selectedFile.name}</p>
			<p class="text-xs text-blue-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
		</div>
	{/if}

	{#if isComplete}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-800">
				File uploaded successfully! {csvDataLength} rows ready for processing.
			</p>
		</div>
	{/if}
</div>
