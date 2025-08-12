export interface CsvRow {
	[key: string]: string;
}

export type RawCsvRow = string[];

export interface ParsedCsvData {
	headers: string[];
	rows: CsvRow[];
	rawRows: RawCsvRow[];
	hasHeaders: boolean;
}

export interface BarcodeConfig {
	width: number;
	height: number;
}

export interface QRStylingConfig {
	width: number;
	height: number;
	data: string;
	margin?: number;
	dotsOptions: {
		color: string;
		type: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
	};
	cornersSquareOptions: {
		color: string;
		type: 'dot' | 'square' | 'extra-rounded';
	};
	cornersDotOptions: {
		color: string;
		type: 'dot' | 'square';
	};
	backgroundOptions: {
		color: string;
	};
	imageOptions?: {
		hideBackgroundDots: boolean;
		imageSize: number;
		margin: number;
		crossOrigin: string;
	};
	qrOptions: {
		typeNumber: number;
		mode: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji';
		errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
	};
}

export interface QRCustomizationState {
	config: QRStylingConfig;
	previewData: string;
	isValid: boolean;
	errors: string[];
}

export interface QRValidationRules {
	width: { min: number; max: number };
	height: { min: number; max: number };
	imageSize: { min: number; max: number };
	requiredFields: (keyof QRStylingConfig)[];
}

export interface ColumnSelectionConfig {
	selectedColumn: string | null;
	omitHeaderRow: boolean;
	availableColumns: string[];
}

export interface ColumnStats {
	name: string;
	sampleValues: string[];
	emptyCount: number;
	totalCount: number;
	uniqueCount: number;
	dataType: 'text' | 'number' | 'email' | 'url' | 'mixed';
}

export interface ProcessingConfig extends BarcodeConfig {
	columnSelection: ColumnSelectionConfig;
	qrStyling: QRStylingConfig;
}

export type FormStep = 'upload' | 'preview' | 'column-select' | 'qr-customization' | 'ready';

export interface CsvUploadForm {
	file: File | null;
	config: BarcodeConfig;
	csvData: CsvRow[];
	columnConfig: ColumnSelectionConfig;
	qrCustomization: QRCustomizationState;
	currentStep: FormStep;
	isValid: boolean;
}

export interface ValidationError {
	field: string;
	message: string;
}

export interface FileUploadResult {
	success: boolean;
	data?: CsvRow[];
	errors?: ValidationError[];
}
