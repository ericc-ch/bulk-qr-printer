<script lang="ts">
	import CsvPreview from './CsvPreview.svelte';
	import type { CsvRow } from './types';

	interface Props {
		csvData: CsvRow[];
	}

	let { csvData }: Props = $props();

	let isComplete = $derived(Boolean(csvData.length > 0));
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">2. Preview Data</h2>
		{#if isComplete}
			<span
				class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
			>
				✓ Complete
			</span>
		{/if}
	</div>

	<CsvPreview data={csvData} />

	{#if isComplete}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-800">
				Data preview ready! {csvData.length} rows available for QR code generation.
			</p>
		</div>
	{/if}
</div>
