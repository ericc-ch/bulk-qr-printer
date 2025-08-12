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
}

export type FormStep = 'upload' | 'preview' | 'column-select' | 'dimensions' | 'ready';

export interface CsvUploadForm {
	file: File | null;
	config: BarcodeConfig;
	csvData: CsvRow[];
	columnConfig: ColumnSelectionConfig;
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
