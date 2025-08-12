<script lang="ts">
	import FileUpload from './FileUpload.svelte';
	import CsvPreview from './CsvPreview.svelte';
	import ColumnSelection from './ColumnSelection.svelte';
	import DimensionInputs from './DimensionInputs.svelte';
	import type {
		BarcodeConfig,
		CsvRow,
		ParsedCsvData,
		ValidationError,
		ColumnSelectionConfig
	} from './types';
	import { validateFile, parseCsv, processSelectedColumnData } from './csvValidator';
	import { validateForm } from './formValidation';
	import { analyzeColumns } from './columnSelectionValidator';

	let selectedFile: File | null = $state(null);
	let parsedCsvData: ParsedCsvData = $state({
		headers: [],
		rows: [],
		rawRows: [],
		hasHeaders: false
	});
	let csvData: CsvRow[] = $derived(parsedCsvData.rows);
	let config: BarcodeConfig = $state({
		width: 200,
		height: 200
	});
	let columnConfig: ColumnSelectionConfig = $state({
		selectedColumn: null,
		omitHeaderRow: false,
		availableColumns: []
	});
	let errors: ValidationError[] = $state([]);
	let isLoading = $state(false);

	let columnStats = $derived(analyzeColumns(csvData));
	let processedData = $derived(processSelectedColumnData(parsedCsvData, columnConfig));

	async function handleFileSelect(file: File) {
		selectedFile = file;
		errors = [];

		const fileErrors = validateFile(file);
		if (fileErrors.length > 0) {
			errors = fileErrors;
			parsedCsvData = { headers: [], rows: [], rawRows: [], hasHeaders: false };
			return;
		}

		isLoading = true;
		try {
			const result = await parseCsv(file, columnConfig.omitHeaderRow);
			parsedCsvData = result.data;
			errors = result.errors;

			if (result.data.headers.length > 0) {
				columnConfig.availableColumns = result.data.headers;
			}
		} catch (error) {
			errors = [{ field: 'csv', message: 'Failed to process file' }];
			parsedCsvData = { headers: [], rows: [], rawRows: [], hasHeaders: false };
		} finally {
			isLoading = false;
		}
	}

	function handleColumnConfigChange(newColumnConfig: ColumnSelectionConfig) {
		const wasHeaderModeChanged = columnConfig.omitHeaderRow !== newColumnConfig.omitHeaderRow;
		columnConfig = newColumnConfig;

		// Clear validation errors for column selection
		const validationErrors = errors.filter((e) => e.field !== 'selectedColumn');
		errors = validationErrors;

		// If header mode changed and we have a file, re-parse it
		if (wasHeaderModeChanged && selectedFile) {
			handleFileSelect(selectedFile);
		}
	}

	function handleConfigChange(newConfig: BarcodeConfig) {
		config = newConfig;

		const validationErrors = errors.filter((e) => e.field !== 'width' && e.field !== 'height');
		errors = validationErrors;
	}

	function handleSubmit() {
		const formErrors = validateForm(selectedFile, config, columnConfig, columnStats);

		if (formErrors.length > 0) {
			errors = formErrors;
			return;
		}

		console.log('Form is valid!', {
			file: selectedFile?.name,
			config,
			dataRows: csvData.length,
			selectedColumn: columnConfig.selectedColumn,
			processedValues: processedData.length,
			sampleData: processedData.slice(0, 5)
		});
	}

	let canSubmit = $derived(
		selectedFile &&
			csvData.length > 0 &&
			columnConfig.selectedColumn &&
			config.width >= 50 &&
			config.height >= 50 &&
			errors.length === 0
	);

	let fileError = $derived(errors.find((e) => e.field === 'file'));
	let dimensionErrors = $derived(errors.filter((e) => ['width', 'height'].includes(e.field)));
	let columnErrors = $derived(errors.filter((e) => e.field === 'selectedColumn'));
</script>

<div class="min-h-screen bg-gray-50 py-12">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<div class="overflow-hidden rounded-lg bg-white shadow-xl">
			<div class="border-b border-gray-200 px-6 py-8">
				<h1 class="text-3xl font-bold text-gray-900">Bulk QR Code Generator</h1>
				<p class="mt-2 text-gray-600">Upload a CSV file and configure your QR code dimensions</p>
			</div>

			<div class="px-6 py-8">
				<div class="space-y-8">
					<!-- File Upload Section -->
					<div class="space-y-6">
						<h2 class="text-lg font-semibold text-gray-900">1. Upload CSV File</h2>
						<FileUpload onFileSelect={handleFileSelect} error={fileError} disabled={isLoading} />

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
					</div>

					<!-- CSV Preview Section -->
					{#if csvData.length > 0}
						<div class="space-y-6">
							<h2 class="text-lg font-semibold text-gray-900">2. Preview Data</h2>
							<CsvPreview data={csvData} />
						</div>
					{/if}

					<!-- Column Selection Section -->
					{#if csvData.length > 0}
						<div class="space-y-6">
							<h2 class="text-lg font-semibold text-gray-900">3. Select QR Code Data Column</h2>
							<ColumnSelection
								{csvData}
								config={columnConfig}
								onConfigChange={handleColumnConfigChange}
								errors={columnErrors}
								disabled={isLoading}
							/>
						</div>
					{/if}

					<!-- Dimensions Section -->
					{#if columnConfig.selectedColumn}
						<div class="space-y-6">
							<h2 class="text-lg font-semibold text-gray-900">4. Configure Dimensions</h2>
							<DimensionInputs
								{config}
								onConfigChange={handleConfigChange}
								errors={dimensionErrors}
								disabled={isLoading}
							/>

							<div class="rounded-lg border border-green-200 bg-green-50 p-4">
								<h4 class="mb-2 text-sm font-medium text-green-800">Processing Summary</h4>
								<div class="space-y-1 text-sm text-green-700">
									<p><strong>Selected Column:</strong> {columnConfig.selectedColumn}</p>
									<p><strong>QR Codes to Generate:</strong> {processedData.length}</p>
									{#if columnConfig.omitHeaderRow}
										<p><strong>Header Row:</strong> Will be skipped</p>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- Ready Section -->
					{#if canSubmit}
						<div class="space-y-6">
							<h2 class="text-lg font-semibold text-gray-900">5. Generate QR Codes</h2>
							<div class="py-8 text-center">
								<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
									<div class="space-y-2 text-sm text-blue-700">
										<p><strong>File:</strong> {selectedFile?.name}</p>
										<p><strong>Column:</strong> {columnConfig.selectedColumn}</p>
										<p><strong>QR Codes:</strong> {processedData.length}</p>
										<p><strong>Dimensions:</strong> {config.width} × {config.height} pixels</p>
									</div>
								</div>
								<button
									onclick={handleSubmit}
									class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white
										hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
								>
									Generate QR Codes
								</button>
							</div>
						</div>
					{/if}

					{#if errors.length > 0}
						<div class="rounded-lg border border-red-200 bg-red-50 p-4">
							<h3 class="mb-2 text-sm font-medium text-red-800">Errors</h3>
							<ul class="space-y-1 text-sm text-red-700">
								{#each errors as error}
									<li>• {error.message}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
