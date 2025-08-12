<script lang="ts">
	import type { ColumnSelectionConfig, ColumnStats, ValidationError } from './types';
	import { analyzeColumns, getColumnWarnings } from './columnSelectionValidator';

	interface Props {
		csvData: Record<string, string>[];
		config: ColumnSelectionConfig;
		onConfigChange: (config: ColumnSelectionConfig) => void;
		errors?: ValidationError[];
		disabled?: boolean;
	}

	let { csvData, config, onConfigChange, errors = [], disabled = false }: Props = $props();

	let columnStats = $derived(analyzeColumns(csvData));
	let selectedColumnStats = $derived(
		columnStats.find((stat) => stat.name === config.selectedColumn)
	);
	let warnings = $derived(
		selectedColumnStats ? getColumnWarnings(selectedColumnStats, config.selectedColumn!) : []
	);
	let validationErrors = $derived(errors.filter((e) => e.field === 'selectedColumn'));

	function handleColumnSelect(columnName: string) {
		if (disabled) return;

		onConfigChange({
			...config,
			selectedColumn: columnName
		});
	}

	function handleHeaderToggle() {
		if (disabled) return;

		onConfigChange({
			...config,
			omitHeaderRow: !config.omitHeaderRow
		});
	}

	function getDataTypeIcon(dataType: ColumnStats['dataType']): string {
		switch (dataType) {
			case 'number':
				return '🔢';
			case 'email':
				return '📧';
			case 'url':
				return '🔗';
			case 'mixed':
				return '📊';
			default:
				return '📝';
		}
	}

	function getDataTypeLabel(dataType: ColumnStats['dataType']): string {
		switch (dataType) {
			case 'number':
				return 'Numbers';
			case 'email':
				return 'Email addresses';
			case 'url':
				return 'URLs';
			case 'mixed':
				return 'Mixed data';
			default:
				return 'Text';
		}
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="mb-4 text-lg font-medium text-gray-900">Select Barcode Data Column</h3>
		<p class="mb-6 text-sm text-gray-600">
			Choose which column contains the data you want to encode as QR codes.
		</p>
	</div>

	{#if columnStats.length === 0}
		<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
			<p class="text-sm text-yellow-800">No columns found in the CSV data.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each columnStats as column (column.name)}
				<label
					class="relative flex cursor-pointer rounded-lg border p-4 focus-within:ring-2 focus-within:ring-blue-500 hover:bg-gray-50
						{config.selectedColumn === column.name ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
						{disabled ? 'cursor-not-allowed opacity-50' : ''}"
				>
					<input
						type="radio"
						name="selectedColumn"
						value={column.name}
						checked={config.selectedColumn === column.name}
						{disabled}
						onchange={() => handleColumnSelect(column.name)}
						class="sr-only"
					/>

					<div class="flex-1">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<span class="text-lg">{getDataTypeIcon(column.dataType)}</span>
								<div>
									<h4 class="text-sm font-medium text-gray-900">{column.name}</h4>
									<p class="text-xs text-gray-500">{getDataTypeLabel(column.dataType)}</p>
								</div>
							</div>

							<div class="text-right">
								<p class="text-xs text-gray-500">
									{column.totalCount - column.emptyCount} / {column.totalCount} values
								</p>
								<p class="text-xs text-gray-500">
									{column.uniqueCount} unique
								</p>
							</div>
						</div>

						{#if column.sampleValues.length > 0}
							<div class="mt-3">
								<p class="mb-1 text-xs text-gray-600">Sample values:</p>
								<div class="flex flex-wrap gap-1">
									{#each column.sampleValues as value, index (index)}
										<span
											class="inline-block max-w-32 truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
										>
											{value}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						{#if column.emptyCount > 0}
							<div class="mt-2">
								<p class="text-xs text-amber-600">
									⚠️ {column.emptyCount} empty values ({Math.round(
										(column.emptyCount / column.totalCount) * 100
									)}%)
								</p>
							</div>
						{/if}
					</div>

					{#if config.selectedColumn === column.name}
						<div class="absolute top-4 right-4">
							<svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
					{/if}
				</label>
			{/each}
		</div>
	{/if}

	{#if warnings.length > 0}
		<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
			<h4 class="mb-2 text-sm font-medium text-amber-800">Data Quality Warnings</h4>
			<ul class="space-y-1 text-sm text-amber-700">
				{#each warnings as warning, index (index)}
					<li>• {warning}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="border-t border-gray-200 pt-6">
		<label class="flex items-center">
			<input
				type="checkbox"
				checked={config.omitHeaderRow}
				{disabled}
				onchange={handleHeaderToggle}
				class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
			/>
			<span class="ml-3 text-sm text-gray-700">
				Treat first row as column headers (skip for QR codes)
			</span>
		</label>
		<p class="mt-1 ml-6 text-xs text-gray-500">
			Check this if the first row contains column names instead of data to be processed
		</p>
	</div>

	{#if validationErrors.length > 0}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<ul class="space-y-1 text-sm text-red-700">
				{#each validationErrors as error (error.field + error.message)}
					<li>• {error.message}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if selectedColumnStats}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h4 class="mb-2 text-sm font-medium text-blue-800">Selected Column Summary</h4>
			<div class="space-y-1 text-sm text-blue-700">
				<p>
					<strong>{selectedColumnStats.name}</strong> - {getDataTypeLabel(
						selectedColumnStats.dataType
					)}
				</p>
				<p>
					{selectedColumnStats.totalCount - selectedColumnStats.emptyCount} values will be processed
					for QR code generation
				</p>
				{#if config.omitHeaderRow}
					<p>First row treated as headers (excluded from QR code generation)</p>
				{:else}
					<p>All rows including first row will be processed for QR codes</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
