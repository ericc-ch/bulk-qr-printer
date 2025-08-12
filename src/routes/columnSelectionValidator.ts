import type { ColumnSelectionConfig, ColumnStats, CsvRow, ValidationError } from './types';

export function analyzeColumns(data: CsvRow[]): ColumnStats[] {
	if (data.length === 0) return [];

	const headers = Object.keys(data[0]);

	return headers.map((header) => {
		const values = data.map((row) => row[header] || '');
		const nonEmptyValues = values.filter((val) => val.trim() !== '');
		const uniqueValues = new Set(nonEmptyValues);

		return {
			name: header,
			sampleValues: nonEmptyValues.slice(0, 5),
			emptyCount: values.length - nonEmptyValues.length,
			totalCount: values.length,
			uniqueCount: uniqueValues.size,
			dataType: detectDataType(nonEmptyValues)
		};
	});
}

function detectDataType(values: string[]): ColumnStats['dataType'] {
	if (values.length === 0) return 'text';

	let numberCount = 0;
	let emailCount = 0;
	let urlCount = 0;

	for (const value of values.slice(0, 20)) {
		if (/^-?\d+\.?\d*$/.test(value.trim())) {
			numberCount++;
		}
		if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
			emailCount++;
		}
		if (/^https?:\/\/.+/.test(value.trim())) {
			urlCount++;
		}
	}

	const sampleSize = Math.min(values.length, 20);
	const threshold = sampleSize * 0.8;

	if (numberCount >= threshold) return 'number';
	if (emailCount >= threshold) return 'email';
	if (urlCount >= threshold) return 'url';
	if (numberCount > 0 || emailCount > 0 || urlCount > 0) return 'mixed';

	return 'text';
}

export function validateColumnSelection(
	config: ColumnSelectionConfig,
	columnStats: ColumnStats[]
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!config.selectedColumn) {
		errors.push({
			field: 'selectedColumn',
			message: 'Please select a column for barcode data'
		});
		return errors;
	}

	const selectedStats = columnStats.find((stat) => stat.name === config.selectedColumn);

	if (!selectedStats) {
		errors.push({
			field: 'selectedColumn',
			message: 'Selected column does not exist in the CSV data'
		});
		return errors;
	}

	if (selectedStats.emptyCount === selectedStats.totalCount) {
		errors.push({
			field: 'selectedColumn',
			message: 'Selected column contains no data'
		});
	}

	return errors;
}

export function getColumnWarnings(columnStats: ColumnStats, selectedColumn: string): string[] {
	const warnings: string[] = [];

	if (columnStats.name !== selectedColumn) return warnings;

	const emptyPercentage = (columnStats.emptyCount / columnStats.totalCount) * 100;

	if (emptyPercentage > 50) {
		warnings.push(`${emptyPercentage.toFixed(1)}% of values are empty`);
	}

	if (columnStats.uniqueCount === 1 && columnStats.totalCount > 1) {
		warnings.push('All values are identical');
	}

	if (columnStats.uniqueCount < columnStats.totalCount * 0.1 && columnStats.totalCount > 10) {
		warnings.push('Many duplicate values detected');
	}

	return warnings;
}
