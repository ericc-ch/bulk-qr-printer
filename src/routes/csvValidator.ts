import Papa from 'papaparse';
import type {
	CsvRow,
	RawCsvRow,
	ParsedCsvData,
	ValidationError,
	ColumnSelectionConfig
} from './types';

export function validateFile(file: File): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!file) {
		errors.push({ field: 'file', message: 'Please select a file' });
		return errors;
	}

	if (file.size === 0) {
		errors.push({ field: 'file', message: 'File is empty' });
	}

	if (file.size > 5 * 1024 * 1024) {
		errors.push({ field: 'file', message: 'File size must be less than 5MB' });
	}

	const allowedTypes = ['text/csv', 'text/plain', 'application/csv'];
	const hasValidExtension =
		file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt');

	if (!allowedTypes.includes(file.type) && !hasValidExtension) {
		errors.push({ field: 'file', message: 'Please select a CSV file' });
	}

	return errors;
}

export function parseCsv(
	file: File,
	omitHeaderRow: boolean = true
): Promise<{ data: ParsedCsvData; errors: ValidationError[] }> {
	return new Promise((resolve) => {
		Papa.parse(file, {
			header: false,
			skipEmptyLines: true,
			complete: (results) => {
				const errors: ValidationError[] = [];

				if (results.errors.length > 0) {
					results.errors.forEach((error) => {
						errors.push({
							field: 'csv',
							message: `Row ${error.row}: ${error.message}`
						});
					});
				}

				const rawRows = results.data as RawCsvRow[];

				if (rawRows.length === 0) {
					errors.push({ field: 'csv', message: 'CSV file contains no data' });
					resolve({
						data: { headers: [], rows: [], rawRows: [], hasHeaders: false },
						errors
					});
					return;
				}

				let headers: string[];
				let dataRows: RawCsvRow[];
				let hasHeaders: boolean;

				if (omitHeaderRow) {
					// Use first row as headers, process remaining rows as data
					headers = rawRows[0].map((header, index) => header.trim() || `Column ${index + 1}`);
					dataRows = rawRows.slice(1);
					hasHeaders = true;
				} else {
					// Generate column names, treat all rows as data
					const maxColumns = Math.max(...rawRows.map((row) => row.length));
					headers = Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`);
					dataRows = rawRows;
					hasHeaders = false;
				}

				const rows: CsvRow[] = dataRows.map((row) => {
					const obj: CsvRow = {};
					headers.forEach((header, index) => {
						obj[header] = row[index] || '';
					});
					return obj;
				});

				const data: ParsedCsvData = {
					headers,
					rows,
					rawRows,
					hasHeaders
				};

				resolve({ data, errors });
			},
			error: (error) => {
				resolve({
					data: { headers: [], rows: [], rawRows: [], hasHeaders: false },
					errors: [{ field: 'csv', message: `Failed to parse CSV: ${error.message}` }]
				});
			}
		});
	});
}

export function processSelectedColumnData(
	parsedData: ParsedCsvData,
	columnConfig: ColumnSelectionConfig
): string[] {
	if (!columnConfig.selectedColumn || parsedData.rows.length === 0) {
		return [];
	}

	// Extract values from selected column - no additional skipping needed
	// The parsing already handled header vs data row distinction
	return parsedData.rows
		.map((row) => row[columnConfig.selectedColumn!] || '')
		.filter((value) => value.trim() !== ''); // Remove empty values
}
