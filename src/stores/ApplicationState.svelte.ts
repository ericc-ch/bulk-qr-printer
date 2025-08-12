import type {
	BarcodeConfig,
	CsvRow,
	ParsedCsvData,
	ValidationError,
	ColumnSelectionConfig,
	QRCustomizationState,
	QRStylingConfig,
	FormStep
} from '../routes/types';
import { analyzeColumns } from '../routes/columnSelectionValidator';
import { processSelectedColumnData } from '../routes/csvValidator';
import { getDefaultQRConfig } from '../routes/qrDefaults';

// Event system types
export interface AppStateEvent {
	type: string;
	payload?: unknown;
	timestamp: number;
}

export type AppStateEventHandler<T = AppStateEvent> = (event: T) => void;

// Event types for type safety
export interface FileUploadEvent extends AppStateEvent {
	type: 'file:uploaded' | 'file:cleared' | 'file:error';
	payload: {
		file?: File | null;
		parsedData?: ParsedCsvData;
		errors?: ValidationError[];
	};
}

export interface ColumnSelectionEvent extends AppStateEvent {
	type: 'column:selected' | 'column:cleared' | 'header:toggled';
	payload: {
		config: ColumnSelectionConfig;
		previousConfig?: ColumnSelectionConfig;
	};
}

export interface QRConfigEvent extends AppStateEvent {
	type: 'qr:configured' | 'qr:validated' | 'qr:preview-updated';
	payload: {
		config?: QRStylingConfig;
		validation?: { isValid: boolean; errors: string[] };
		previewData?: string;
	};
}

export interface ValidationEvent extends AppStateEvent {
	type: 'validation:triggered' | 'validation:completed' | 'validation:cleared';
	payload: {
		field?: string;
		errors?: ValidationError[];
		triggerSource?: string;
	};
}

class ApplicationStore {
	// Event system
	private eventListeners = new Map<string, Set<AppStateEventHandler>>();

	// Core state with optimized reactivity
	appMode = $state<'form' | 'qr-display'>('form');
	currentStep = $state<FormStep>('upload');

	// File and CSV state
	selectedFile = $state<File | null>(null);
	parsedCsvData = $state<ParsedCsvData>({
		headers: [],
		rows: [],
		rawRows: [],
		hasHeaders: false
	});

	// Configuration state
	config = $state<BarcodeConfig>({
		width: 200,
		height: 200
	});
	columnConfig = $state<ColumnSelectionConfig>({
		selectedColumn: null,
		omitHeaderRow: false,
		availableColumns: []
	});
	qrCustomization = $state<QRCustomizationState>({
		config: getDefaultQRConfig(),
		previewData: '',
		isValid: false,
		errors: []
	});

	// UI state
	errors = $state<ValidationError[]>([]);
	isLoading = $state(false);

	// Optimized derived state with caching
	csvData = $derived<CsvRow[]>(this.parsedCsvData.rows);
	columnStats = $derived(analyzeColumns(this.csvData));
	processedData = $derived(processSelectedColumnData(this.parsedCsvData, this.columnConfig));

	// Step validation with better reactivity
	canProceedFromPreview = $derived(Boolean(this.csvData.length > 0));
	canProceedFromColumnSelect = $derived(Boolean(this.columnConfig.selectedColumn !== null));
	canProceedFromQRCustomization = $derived(Boolean(this.qrCustomization.isValid));

	// File upload validation
	fileUploadValid = $derived(
		Boolean(this.selectedFile && this.csvData.length > 0 && this.errors.length === 0)
	);

	// Helper computed states
	fileError = $derived(this.errors.find((e) => e.field === 'file'));
	columnErrors = $derived(this.errors.filter((e) => e.field === 'selectedColumn'));

	// Overall form validation state
	formValid = $derived(
		this.fileUploadValid &&
			this.canProceedFromColumnSelect &&
			this.canProceedFromQRCustomization &&
			this.errors.length === 0
	);

	// Progress tracking
	progressStatus = $derived(() => ({
		fileUploaded: Boolean(this.selectedFile),
		dataReady: this.csvData.length > 0,
		columnSelected: Boolean(this.columnConfig.selectedColumn),
		qrCustomized: this.qrCustomization.isValid,
		readyToGenerate: this.formValid
	}));

	constructor() {
		// Set up reactive validation cascading
		this.setupValidationCascading();
	}

	// Event system methods
	addEventListener<T extends AppStateEvent = AppStateEvent>(
		eventType: string,
		handler: AppStateEventHandler<T>
	): () => void {
		if (!this.eventListeners.has(eventType)) {
			this.eventListeners.set(eventType, new Set());
		}
		this.eventListeners.get(eventType)!.add(handler as AppStateEventHandler);

		// Return unsubscribe function
		return () => {
			const handlers = this.eventListeners.get(eventType);
			if (handlers) {
				handlers.delete(handler as AppStateEventHandler);
				if (handlers.size === 0) {
					this.eventListeners.delete(eventType);
				}
			}
		};
	}

	private emitEvent<T extends AppStateEvent>(eventType: string, payload?: unknown): void {
		const handlers = this.eventListeners.get(eventType);
		if (handlers) {
			const event: T = {
				type: eventType,
				payload,
				timestamp: Date.now()
			} as T;

			handlers.forEach((handler) => {
				try {
					handler(event);
				} catch (error) {
					console.error(`Error in event handler for ${eventType}:`, error);
				}
			});
		}
	}

	// Enhanced state update methods with event emission
	setSelectedFile(file: File | null, emit = true) {
		const previousFile = this.selectedFile;
		this.selectedFile = file;

		if (emit) {
			if (file && file !== previousFile) {
				this.emitEvent<FileUploadEvent>('file:uploaded', { file });
			} else if (!file && previousFile) {
				this.emitEvent<FileUploadEvent>('file:cleared', { file: null });
			}
		}
	}

	setParsedCsvData(data: ParsedCsvData, emit = true) {
		this.parsedCsvData = data;

		if (emit) {
			this.emitEvent<FileUploadEvent>('file:parsed', { parsedData: data });
			// Trigger column config validation cascade
			this.validateColumnConfiguration();
		}
	}

	setErrors(errors: ValidationError[], emit = true) {
		this.errors = errors;

		if (emit) {
			this.emitEvent<ValidationEvent>('validation:completed', { errors });
		}
	}

	setIsLoading(loading: boolean) {
		this.isLoading = loading;
	}

	setColumnConfig(config: ColumnSelectionConfig, emit = true) {
		const previousConfig = { ...this.columnConfig };
		this.columnConfig = config;

		if (emit) {
			this.emitEvent<ColumnSelectionEvent>('column:selected', {
				config,
				previousConfig
			});
			// Trigger validation cascade
			this.validateQRConfiguration();
		}
	}

	setQRCustomization(customization: Partial<QRCustomizationState>, emit = true) {
		this.qrCustomization = { ...this.qrCustomization, ...customization };

		if (emit) {
			if (customization.config) {
				this.emitEvent<QRConfigEvent>('qr:configured', { config: customization.config });
			}
			if (customization.isValid !== undefined || customization.errors !== undefined) {
				this.emitEvent<QRConfigEvent>('qr:validated', {
					validation: {
						isValid: this.qrCustomization.isValid,
						errors: this.qrCustomization.errors
					}
				});
			}
			if (customization.previewData !== undefined) {
				this.emitEvent<QRConfigEvent>('qr:preview-updated', {
					previewData: customization.previewData
				});
			}
		}
	}

	setCurrentStep(step: FormStep) {
		this.currentStep = step;
	}

	setAppMode(mode: 'form' | 'qr-display') {
		this.appMode = mode;
	}

	// Enhanced validation methods with cascading
	clearFieldErrors(field: string, emit = true) {
		this.errors = this.errors.filter((e) => e.field !== field);

		if (emit) {
			this.emitEvent<ValidationEvent>('validation:cleared', { field });
		}
	}

	addErrors(newErrors: ValidationError[], emit = true) {
		this.errors = [...this.errors, ...newErrors];

		if (emit) {
			this.emitEvent<ValidationEvent>('validation:triggered', { errors: newErrors });
		}
	}

	// Validation cascade methods
	private validateColumnConfiguration() {
		// Clear previous column-related errors
		this.clearFieldErrors('selectedColumn', false);

		// If no data available, clear column configuration
		if (this.csvData.length === 0) {
			this.setColumnConfig(
				{
					...this.columnConfig,
					selectedColumn: null,
					availableColumns: []
				},
				false
			);
			return;
		}

		// Update available columns
		if (this.parsedCsvData.headers.length > 0) {
			this.setColumnConfig(
				{
					...this.columnConfig,
					availableColumns: this.parsedCsvData.headers
				},
				false
			);
		}
	}

	private validateQRConfiguration() {
		// Update QR preview data when column selection changes
		if (this.columnConfig.selectedColumn && this.processedData.length > 0) {
			this.setQRCustomization(
				{
					previewData: this.processedData[0] || 'Sample QR Code'
				},
				false
			);
		} else {
			this.setQRCustomization(
				{
					previewData: '',
					isValid: false,
					errors: ['No data available for QR generation']
				},
				false
			);
		}
	}

	// Setup automatic validation cascading using effects
	private setupValidationCascading() {
		// Listen to file upload events to cascade validation
		this.addEventListener<FileUploadEvent>('file:uploaded', () => {
			this.validateColumnConfiguration();
		});

		this.addEventListener<FileUploadEvent>('file:parsed', () => {
			this.validateColumnConfiguration();
		});

		this.addEventListener<ColumnSelectionEvent>('column:selected', () => {
			this.validateQRConfiguration();
		});

		// Listen to QR configuration changes for form validation
		this.addEventListener<QRConfigEvent>('qr:validated', () => {
			// Clear QR-related errors if validation passed
			if (this.qrCustomization.isValid) {
				this.clearFieldErrors('qr', false);
			}
		});
	}

	// Bulk operations for better performance
	updateState(updates: {
		file?: File | null;
		parsedData?: ParsedCsvData;
		columnConfig?: ColumnSelectionConfig;
		qrCustomization?: Partial<QRCustomizationState>;
		errors?: ValidationError[];
	}) {
		// Apply all updates without emitting events
		if (updates.file !== undefined) {
			this.setSelectedFile(updates.file, false);
		}
		if (updates.parsedData) {
			this.setParsedCsvData(updates.parsedData, false);
		}
		if (updates.columnConfig) {
			this.setColumnConfig(updates.columnConfig, false);
		}
		if (updates.qrCustomization) {
			this.setQRCustomization(updates.qrCustomization, false);
		}
		if (updates.errors) {
			this.setErrors(updates.errors, false);
		}

		// Emit a single batch update event
		this.emitEvent('state:batch-updated', updates);

		// Trigger validation cascade
		this.validateColumnConfiguration();
		this.validateQRConfiguration();
	}

	// Reset application state
	reset() {
		this.appMode = 'form';
		this.currentStep = 'upload';
		this.selectedFile = null;
		this.parsedCsvData = { headers: [], rows: [], rawRows: [], hasHeaders: false };
		this.columnConfig = { selectedColumn: null, omitHeaderRow: false, availableColumns: [] };
		this.qrCustomization = {
			config: getDefaultQRConfig(),
			previewData: '',
			isValid: false,
			errors: []
		};
		this.errors = [];
		this.isLoading = false;

		// Emit reset event
		this.emitEvent('app:reset', {});
	}

	// Utility methods for external components
	getState() {
		return {
			appMode: this.appMode,
			currentStep: this.currentStep,
			selectedFile: this.selectedFile,
			parsedCsvData: this.parsedCsvData,
			config: this.config,
			columnConfig: this.columnConfig,
			qrCustomization: this.qrCustomization,
			errors: this.errors,
			isLoading: this.isLoading,
			csvData: this.csvData,
			columnStats: this.columnStats,
			processedData: this.processedData,
			formValid: this.formValid,
			progressStatus: this.progressStatus
		};
	}

	// Debug utility
	debugState() {
		console.log('Application State:', this.getState());
		console.log('Event Listeners:', this.eventListeners);
	}
}

// Create and export the application store instance
export const appState = new ApplicationStore();
