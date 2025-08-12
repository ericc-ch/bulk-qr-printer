import type { BarcodeConfig, ValidationError, ColumnSelectionConfig, FormStep } from './types';
import { validateColumnSelection } from './columnSelectionValidator';

export function validateDimensions(config: BarcodeConfig): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!config.width || config.width < 50 || config.width > 500) {
		errors.push({
			field: 'width',
			message: 'Width must be between 50 and 500 pixels'
		});
	}

	if (!config.height || config.height < 50 || config.height > 500) {
		errors.push({
			field: 'height',
			message: 'Height must be between 50 and 500 pixels'
		});
	}

	return errors;
}

export function validateForm(
	file: File | null,
	config: BarcodeConfig,
	columnConfig?: ColumnSelectionConfig,
	columnStats?: any[]
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!file) {
		errors.push({ field: 'file', message: 'Please select a CSV file' });
	}

	errors.push(...validateDimensions(config));

	if (columnConfig && columnStats) {
		errors.push(...validateColumnSelection(columnConfig, columnStats));
	}

	return errors;
}

export function canProceedToStep(
	currentStep: FormStep,
	nextStep: FormStep,
	formData: {
		file: File | null;
		csvData: any[];
		columnConfig: ColumnSelectionConfig;
		config: BarcodeConfig;
	}
): boolean {
	switch (nextStep) {
		case 'preview':
			return formData.file !== null;

		case 'column-select':
			return formData.file !== null && formData.csvData.length > 0;

		case 'dimensions':
			return formData.columnConfig.selectedColumn !== null;

		case 'ready':
			return (
				formData.columnConfig.selectedColumn !== null &&
				formData.config.width >= 50 &&
				formData.config.width <= 500 &&
				formData.config.height >= 50 &&
				formData.config.height <= 500
			);

		default:
			return true;
	}
}
