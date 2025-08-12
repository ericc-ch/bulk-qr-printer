<script lang="ts">
	import ColumnSelection from './ColumnSelection.svelte';
	import { appState } from '../stores/ApplicationState.svelte';
	import type { CsvRow, ColumnSelectionConfig, ValidationError } from './types';

	interface Props {
		csvData: CsvRow[];
		columnConfig: ColumnSelectionConfig;
		onConfigChange: (config: ColumnSelectionConfig) => void;
		columnErrors: ValidationError[];
		isLoading: boolean;
	}

	let { csvData, columnConfig, onConfigChange, columnErrors, isLoading }: Props = $props();

	let isComplete = $derived(Boolean(columnConfig.selectedColumn !== null));
	let previewRowCount = $derived(appState.processedData.length);
	let hasDataPreview = $derived(previewRowCount > 0);

	// Listen for file parsing events to show real-time feedback
	let fileParsingStatus = $state<'idle' | 'parsing' | 'parsed' | 'error'>('idle');

	$effect(() => {
		const unsubscribeFileParsed = appState.addEventListener('file:parsed', () => {
			fileParsingStatus = 'parsed';
		});

		const unsubscribeFileError = appState.addEventListener('file:error', () => {
			fileParsingStatus = 'error';
		});

		return () => {
			unsubscribeFileParsed();
			unsubscribeFileError();
		};
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">3. Select QR Code Data Column</h2>
		{#if isComplete}
			<span
				class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
			>
				✓ Complete
			</span>
		{/if}
	</div>

	<ColumnSelection
		{csvData}
		config={columnConfig}
		{onConfigChange}
		errors={columnErrors}
		disabled={isLoading}
	/>

	{#if isComplete}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-800">
				Column selected: <strong>{columnConfig.selectedColumn}</strong>
			</p>
			{#if hasDataPreview}
				<p class="mt-1 text-xs text-green-600">
					{previewRowCount} rows ready for QR generation
				</p>
			{/if}
		</div>
	{/if}

	<!-- Real-time status updates from event system -->
	{#if fileParsingStatus === 'parsing'}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<p class="text-sm text-blue-800">🔄 Parsing file data for column selection...</p>
		</div>
	{:else if fileParsingStatus === 'parsed' && csvData.length > 0}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-800">
				✅ File parsed successfully! {csvData.length} rows available.
			</p>
		</div>
	{/if}
</div>
