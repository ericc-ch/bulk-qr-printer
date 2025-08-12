<script lang="ts">
	import FileUploadSection from './FileUploadSection.svelte';
	import DataPreviewSection from './DataPreviewSection.svelte';
	import ColumnConfigSection from './ColumnConfigSection.svelte';
	import QRCustomizationSection from './QRCustomizationSection.svelte';
	import GenerationSummarySection from './GenerationSummarySection.svelte';
	import QRCodeDisplay from './QRCodeDisplay.svelte';
	import ProgressTracker from './ProgressTracker.svelte';
	import { appState } from '../stores/ApplicationState.svelte';
	import type { ColumnSelectionConfig } from './types';
	import type {
		QRConfigEvent,
		ValidationEvent,
		ColumnSelectionEvent
	} from '../stores/ApplicationState.svelte';
	import { validateFile, parseCsv } from './csvValidator';
	import { validateForm } from './formValidation';

	// Event-driven handlers with automatic validation cascading
	async function handleFileSelect(file: File) {
		appState.setSelectedFile(file);
		appState.setErrors([]);

		const fileErrors = validateFile(file);
		if (fileErrors.length > 0) {
			appState.setErrors(fileErrors);
			appState.setParsedCsvData({ headers: [], rows: [], rawRows: [], hasHeaders: false });
			return;
		}

		appState.setIsLoading(true);
		try {
			const result = await parseCsv(file, appState.columnConfig.omitHeaderRow);
			appState.setParsedCsvData(result.data);
			appState.setErrors(result.errors);

			// Validation cascading is now handled automatically by the store
		} catch (e) {
			console.error('Failed to process file:', e);
			appState.setErrors([{ field: 'csv', message: 'Failed to process file' }]);
			appState.setParsedCsvData({ headers: [], rows: [], rawRows: [], hasHeaders: false });
		} finally {
			appState.setIsLoading(false);
		}
	}

	function handleColumnConfigChange(newColumnConfig: ColumnSelectionConfig) {
		const wasHeaderModeChanged =
			appState.columnConfig.omitHeaderRow !== newColumnConfig.omitHeaderRow;

		// Update configuration - this will trigger automatic validation cascading
		appState.setColumnConfig(newColumnConfig);

		// Clear validation errors for column selection
		appState.clearFieldErrors('selectedColumn');

		// If header mode changed and we have a file, re-parse it
		if (wasHeaderModeChanged && appState.selectedFile) {
			handleFileSelect(appState.selectedFile);
		}
	}

	function handleQRConfigChange(newQRConfig: typeof appState.qrCustomization.config) {
		appState.setQRCustomization({ config: newQRConfig });
	}

	function handleQRValidationChange(isValid: boolean, validationErrors: string[]) {
		appState.setQRCustomization({
			isValid,
			errors: validationErrors
		});
	}

	function handleSubmit() {
		// Final validation
		const formErrors = validateForm(
			appState.selectedFile,
			appState.config,
			appState.columnConfig,
			appState.columnStats
		);

		if (formErrors.length > 0 || !appState.qrCustomization.isValid) {
			appState.setErrors([
				...formErrors,
				...appState.qrCustomization.errors.map((msg) => ({ field: 'qr', message: msg }))
			]);
			return;
		}

		// Transition to QR display mode
		appState.setAppMode('qr-display');

		console.log('Generating QR codes with configuration:', {
			file: appState.selectedFile?.name,
			dataRows: appState.processedData.length,
			selectedColumn: appState.columnConfig.selectedColumn,
			qrConfig: appState.qrCustomization.config,
			sampleData: appState.processedData.slice(0, 3)
		});
	}

	function handleReset() {
		appState.reset();
	}

	// Set up event listeners for cross-section communication
	$effect(() => {
		// Listen for QR preview updates to ensure real-time synchronization
		const unsubscribeQRPreview = appState.addEventListener<QRConfigEvent>(
			'qr:preview-updated',
			(event) => {
				console.log('QR preview updated:', event.payload.previewData);
			}
		);

		// Listen for validation events to provide user feedback
		const unsubscribeValidation = appState.addEventListener<ValidationEvent>(
			'validation:completed',
			(event) => {
				if (event.payload.errors && event.payload.errors.length > 0) {
					console.log('Validation completed with errors:', event.payload.errors);
				}
			}
		);

		// Listen for column selection changes to update dependent sections
		const unsubscribeColumnSelection = appState.addEventListener<ColumnSelectionEvent>(
			'column:selected',
			(event) => {
				console.log('Column configuration changed:', event.payload.config);
			}
		);

		// Cleanup event listeners
		return () => {
			unsubscribeQRPreview();
			unsubscribeValidation();
			unsubscribeColumnSelection();
		};
	});
</script>

{#if appState.appMode === 'form'}
	<div class="min-h-screen bg-gray-50 py-12">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="overflow-hidden rounded-lg bg-white shadow-xl">
				<div class="border-b border-gray-200 px-6 py-8">
					<h1 class="text-3xl font-bold text-gray-900">Bulk QR Code Generator</h1>
					<p class="mt-2 text-gray-600">Upload a CSV file and customize your QR codes</p>
				</div>

				<div class="px-6 py-8">
					<!-- Progress Tracker - Enhanced with new progress status -->
					<ProgressTracker
						fileUploaded={appState.progressStatus().fileUploaded}
						dataReady={appState.progressStatus().dataReady}
						columnSelected={appState.progressStatus().columnSelected}
						qrCustomized={appState.progressStatus().qrCustomized}
						readyToGenerate={appState.progressStatus().readyToGenerate}
					/>

					<div class="space-y-8">
						<!-- File Upload Section - Always Visible -->
						<div class="rounded-lg border border-gray-200 p-6">
							<FileUploadSection
								onFileSelect={handleFileSelect}
								selectedFile={appState.selectedFile}
								isLoading={appState.isLoading}
								fileError={appState.fileError}
								csvDataLength={appState.csvData.length}
								errors={appState.errors}
							/>
						</div>

						<!-- Data Preview Section - Visible when file is uploaded -->
						{#if appState.selectedFile && appState.csvData.length > 0}
							<div class="rounded-lg border border-gray-200 p-6">
								<DataPreviewSection csvData={appState.csvData} />
							</div>
						{/if}

						<!-- Column Configuration Section - Visible when data is available -->
						{#if appState.csvData.length > 0}
							<div class="rounded-lg border border-gray-200 p-6">
								<ColumnConfigSection
									csvData={appState.csvData}
									columnConfig={appState.columnConfig}
									onConfigChange={handleColumnConfigChange}
									columnErrors={appState.columnErrors}
									isLoading={appState.isLoading}
								/>
							</div>
						{/if}

						<!-- QR Customization Section - Visible when column is selected -->
						{#if appState.columnConfig.selectedColumn}
							<div class="rounded-lg border border-gray-200 p-6">
								<QRCustomizationSection
									qrCustomization={appState.qrCustomization}
									onConfigChange={handleQRConfigChange}
									onValidationChange={handleQRValidationChange}
								/>
							</div>
						{/if}

						<!-- Generation Summary Section - Visible when QR customization is valid -->
						{#if appState.qrCustomization.isValid}
							<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
								<GenerationSummarySection
									selectedFile={appState.selectedFile}
									columnConfig={appState.columnConfig}
									qrCustomization={appState.qrCustomization}
									processedData={appState.processedData}
									onSubmit={handleSubmit}
								/>
							</div>
						{/if}

						<!-- General Errors -->
						{#if appState.errors.length > 0}
							<div class="rounded-lg border border-red-200 bg-red-50 p-4">
								<h3 class="mb-2 text-sm font-medium text-red-800">Errors</h3>
								<ul class="space-y-1 text-sm text-red-700">
									{#each appState.errors as error (error.field + error.message)}
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
	<QRCodeDisplay
		qrData={appState.processedData}
		config={appState.qrCustomization.config}
		onReset={handleReset}
	/>
{/if}
