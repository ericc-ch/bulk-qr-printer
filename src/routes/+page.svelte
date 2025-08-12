<script lang="ts">
	import FileUpload from './FileUpload.svelte';
	import CsvPreview from './CsvPreview.svelte';
	import ColumnSelection from './ColumnSelection.svelte';
	import QRCustomization from './QRCustomization.svelte';
	import QRCodeDisplay from './QRCodeDisplay.svelte';
	import StepIndicator from './StepIndicator.svelte';
	import type {
		BarcodeConfig,
		CsvRow,
		ParsedCsvData,
		ValidationError,
		ColumnSelectionConfig,
		QRCustomizationState,
		FormStep
	} from './types';
	import { validateFile, parseCsv, processSelectedColumnData } from './csvValidator';
	import { validateForm } from './formValidation';
	import { analyzeColumns } from './columnSelectionValidator';
	import { getDefaultQRConfig } from './qrDefaults';

	// App mode state
	let appMode: 'form' | 'qr-display' = $state('form');
	let currentStep: FormStep = $state('upload');

	// File and CSV state
	let selectedFile: File | null = $state(null);
	let parsedCsvData: ParsedCsvData = $state({
		headers: [],
		rows: [],
		rawRows: [],
		hasHeaders: false
	});
	let csvData: CsvRow[] = $derived(parsedCsvData.rows);

	// Configuration state
	let config: BarcodeConfig = $state({
		width: 200,
		height: 200
	});
	let columnConfig: ColumnSelectionConfig = $state({
		selectedColumn: null,
		omitHeaderRow: false,
		availableColumns: []
	});
	let qrCustomization: QRCustomizationState = $state({
		config: getDefaultQRConfig(),
		previewData: '',
		isValid: false,
		errors: []
	});

	// UI state
	let errors: ValidationError[] = $state([]);
	let isLoading = $state(false);

	// Derived state
	let columnStats = $derived(analyzeColumns(csvData));
	let processedData = $derived(processSelectedColumnData(parsedCsvData, columnConfig));
	let completedSteps = $derived.by(() => {
		const completed: FormStep[] = [];
		if (selectedFile && csvData.length > 0) completed.push('upload');
		if (csvData.length > 0) completed.push('preview');
		if (columnConfig.selectedColumn) completed.push('column-select');
		if (qrCustomization.isValid) completed.push('qr-customization');
		return completed;
	});

	// Step validation
	let canProceedFromUpload = $derived(
		Boolean(selectedFile && csvData.length > 0 && errors.length === 0)
	);
	let canProceedFromPreview = $derived(Boolean(csvData.length > 0));
	let canProceedFromColumnSelect = $derived(Boolean(columnConfig.selectedColumn !== null));
	let canProceedFromQRCustomization = $derived(Boolean(qrCustomization.isValid));

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

			// Auto-advance if successful
			if (result.errors.length === 0 && result.data.rows.length > 0) {
				currentStep = 'preview';
			}
		} catch (e) {
			console.error('Failed to process file:', e);
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

		// Update QR customization preview data
		if (newColumnConfig.selectedColumn && processedData.length > 0) {
			qrCustomization.previewData = processedData[0] || 'Sample QR Code';
		}

		// If header mode changed and we have a file, re-parse it
		if (wasHeaderModeChanged && selectedFile) {
			handleFileSelect(selectedFile);
		}
	}

	function handleQRConfigChange(newQRConfig: typeof qrCustomization.config) {
		qrCustomization.config = newQRConfig;
	}

	function handleQRValidationChange(isValid: boolean, validationErrors: string[]) {
		qrCustomization.isValid = isValid;
		qrCustomization.errors = validationErrors;
	}

	function handleNext() {
		const stepOrder: FormStep[] = [
			'upload',
			'preview',
			'column-select',
			'qr-customization',
			'ready'
		];
		const currentIndex = stepOrder.indexOf(currentStep);

		if (currentIndex < stepOrder.length - 1) {
			const nextStep = stepOrder[currentIndex + 1];

			// Validate current step before proceeding
			let canProceed: boolean = false;
			switch (currentStep) {
				case 'upload':
					canProceed = canProceedFromUpload;
					break;
				case 'preview':
					canProceed = canProceedFromPreview;
					break;
				case 'column-select':
					canProceed = canProceedFromColumnSelect;
					break;
				case 'qr-customization':
					canProceed = canProceedFromQRCustomization;
					break;
				default:
					canProceed = false;
			}

			if (canProceed) {
				currentStep = nextStep;
			}
		}
	}

	function handlePrevious() {
		const stepOrder: FormStep[] = [
			'upload',
			'preview',
			'column-select',
			'qr-customization',
			'ready'
		];
		const currentIndex = stepOrder.indexOf(currentStep);

		if (currentIndex > 0) {
			currentStep = stepOrder[currentIndex - 1];
		}
	}

	function handleSubmit() {
		// Final validation
		const formErrors = validateForm(selectedFile, config, columnConfig, columnStats);

		if (formErrors.length > 0 || !qrCustomization.isValid) {
			errors = [
				...formErrors,
				...qrCustomization.errors.map((msg) => ({ field: 'qr', message: msg }))
			];
			return;
		}

		// Transition to QR display mode
		appMode = 'qr-display';

		console.log('Generating QR codes with configuration:', {
			file: selectedFile?.name,
			dataRows: processedData.length,
			selectedColumn: columnConfig.selectedColumn,
			qrConfig: qrCustomization.config,
			sampleData: processedData.slice(0, 3)
		});
	}

	function handleReset() {
		appMode = 'form';
		currentStep = 'upload';
	}

	// Update QR preview data when processed data changes
	$effect(() => {
		if (processedData.length > 0) {
			qrCustomization.previewData = processedData[0] || 'Sample QR Code';
		}
	});

	let fileError = $derived(errors.find((e) => e.field === 'file'));
	let columnErrors = $derived(errors.filter((e) => e.field === 'selectedColumn'));
</script>

{#if appMode === 'form'}
	<div class="min-h-screen bg-gray-50 py-12">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="overflow-hidden rounded-lg bg-white shadow-xl">
				<div class="border-b border-gray-200 px-6 py-8">
					<h1 class="text-3xl font-bold text-gray-900">Bulk QR Code Generator</h1>
					<p class="mt-2 text-gray-600">Upload a CSV file and customize your QR codes</p>
				</div>

				<div class="px-6 py-8">
					<!-- Step Indicator -->
					<StepIndicator {currentStep} {completedSteps} />

					<div class="space-y-8">
						<!-- File Upload Step -->
						{#if currentStep === 'upload'}
							<div class="space-y-6">
								<h2 class="text-lg font-semibold text-gray-900">Upload CSV File</h2>
								<FileUpload
									onFileSelect={handleFileSelect}
									error={fileError}
									disabled={isLoading}
								/>

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

								{#if canProceedFromUpload}
									<div class="flex justify-end">
										<button
											onclick={handleNext}
											class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											Next: Preview Data
										</button>
									</div>
								{/if}
							</div>
						{/if}

						<!-- CSV Preview Step -->
						{#if currentStep === 'preview'}
							<div class="space-y-6">
								<h2 class="text-lg font-semibold text-gray-900">Preview Data</h2>
								<CsvPreview data={csvData} />

								<div class="flex justify-between">
									<button
										onclick={handlePrevious}
										class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
									>
										← Back
									</button>
									{#if canProceedFromPreview}
										<button
											onclick={handleNext}
											class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											Next: Select Column
										</button>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Column Selection Step -->
						{#if currentStep === 'column-select'}
							<div class="space-y-6">
								<h2 class="text-lg font-semibold text-gray-900">Select QR Code Data Column</h2>
								<ColumnSelection
									{csvData}
									config={columnConfig}
									onConfigChange={handleColumnConfigChange}
									errors={columnErrors}
									disabled={isLoading}
								/>

								<div class="flex justify-between">
									<button
										onclick={handlePrevious}
										class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
									>
										← Back
									</button>
									{#if canProceedFromColumnSelect}
										<button
											onclick={handleNext}
											class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											Next: Customize QR Codes
										</button>
									{/if}
								</div>
							</div>
						{/if}

						<!-- QR Customization Step -->
						{#if currentStep === 'qr-customization'}
							<div class="space-y-6">
								<h2 class="text-lg font-semibold text-gray-900">Customize QR Codes</h2>
								<QRCustomization
									config={qrCustomization.config}
									previewData={qrCustomization.previewData}
									onConfigChange={handleQRConfigChange}
									onValidationChange={handleQRValidationChange}
								/>

								{#if qrCustomization.errors.length > 0}
									<div class="rounded-lg border border-red-200 bg-red-50 p-4">
										<h3 class="mb-2 text-sm font-medium text-red-800">QR Configuration Errors</h3>
										<ul class="space-y-1 text-sm text-red-700">
											{#each qrCustomization.errors as error, index (index)}
												<li>• {error}</li>
											{/each}
										</ul>
									</div>
								{/if}

								<div class="flex justify-between">
									<button
										onclick={handlePrevious}
										class="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
									>
										← Back
									</button>
									{#if canProceedFromQRCustomization}
										<button
											onclick={handleNext}
											class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											Next: Generate QR Codes
										</button>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Ready to Generate Step -->
						{#if currentStep === 'ready'}
							<div class="space-y-6">
								<h2 class="text-lg font-semibold text-gray-900">Generate QR Codes</h2>
								<div class="py-8 text-center">
									<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
										<div class="space-y-2 text-sm text-blue-700">
											<p><strong>File:</strong> {selectedFile?.name}</p>
											<p><strong>Column:</strong> {columnConfig.selectedColumn}</p>
											<p><strong>QR Codes:</strong> {processedData.length}</p>
											<p>
												<strong>Dimensions:</strong>
												{qrCustomization.config.width} × {qrCustomization.config.height} pixels
											</p>
											<p>
												<strong>Style:</strong>
												{qrCustomization.config.dotsOptions.type} dots, {qrCustomization.config
													.qrOptions.errorCorrectionLevel} error correction
											</p>
										</div>
									</div>

									<div class="flex justify-center gap-4">
										<button
											onclick={handlePrevious}
											class="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											← Back to Customization
										</button>
										<button
											onclick={handleSubmit}
											class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
										>
											Generate QR Codes
										</button>
									</div>
								</div>
							</div>
						{/if}

						<!-- General Errors -->
						{#if errors.length > 0}
							<div class="rounded-lg border border-red-200 bg-red-50 p-4">
								<h3 class="mb-2 text-sm font-medium text-red-800">Errors</h3>
								<ul class="space-y-1 text-sm text-red-700">
									{#each errors as error (error.field + error.message)}
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
{:else}
	<!-- QR Display Mode -->
	<QRCodeDisplay qrData={processedData} config={qrCustomization.config} onReset={handleReset} />
{/if}
