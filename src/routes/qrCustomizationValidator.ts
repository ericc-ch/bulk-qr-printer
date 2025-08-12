import type { QRStylingConfig, QRValidationRules } from './types.js';

export const qrValidationRules: QRValidationRules = {
	width: { min: 100, max: 1000 },
	height: { min: 100, max: 1000 },
	imageSize: { min: 0.1, max: 0.5 },
	requiredFields: ['width', 'height', 'dotsOptions', 'backgroundOptions']
};

export function validateQRConfig(config: QRStylingConfig): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Size validation
	if (config.width < qrValidationRules.width.min || config.width > qrValidationRules.width.max) {
		errors.push(
			`Width must be between ${qrValidationRules.width.min} and ${qrValidationRules.width.max}`
		);
	}

	if (
		config.height < qrValidationRules.height.min ||
		config.height > qrValidationRules.height.max
	) {
		errors.push(
			`Height must be between ${qrValidationRules.height.min} and ${qrValidationRules.height.max}`
		);
	}

	// Color validation
	if (!isValidColor(config.dotsOptions.color)) {
		errors.push('Invalid dot color format. Use hex colors like #000000');
	}

	if (!isValidColor(config.cornersSquareOptions.color)) {
		errors.push('Invalid corner square color format. Use hex colors like #000000');
	}

	if (!isValidColor(config.cornersDotOptions.color)) {
		errors.push('Invalid corner dot color format. Use hex colors like #000000');
	}

	if (!isValidColor(config.backgroundOptions.color)) {
		errors.push('Invalid background color format. Use hex colors like #ffffff');
	}

	// Image options validation (if provided)
	if (config.imageOptions) {
		if (
			config.imageOptions.imageSize < qrValidationRules.imageSize.min ||
			config.imageOptions.imageSize > qrValidationRules.imageSize.max
		) {
			errors.push(
				`Image size must be between ${qrValidationRules.imageSize.min} and ${qrValidationRules.imageSize.max}`
			);
		}

		if (config.imageOptions.margin < 0 || config.imageOptions.margin > 50) {
			errors.push('Image margin must be between 0 and 50');
		}
	}

	// Type validation
	const validDotTypes = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
	if (!validDotTypes.includes(config.dotsOptions.type)) {
		errors.push('Invalid dot type selected');
	}

	const validCornerSquareTypes = ['dot', 'square', 'extra-rounded'];
	if (!validCornerSquareTypes.includes(config.cornersSquareOptions.type)) {
		errors.push('Invalid corner square type selected');
	}

	const validCornerDotTypes = ['dot', 'square'];
	if (!validCornerDotTypes.includes(config.cornersDotOptions.type)) {
		errors.push('Invalid corner dot type selected');
	}

	const validErrorCorrectionLevels = ['L', 'M', 'Q', 'H'];
	if (!validErrorCorrectionLevels.includes(config.qrOptions.errorCorrectionLevel)) {
		errors.push('Invalid error correction level selected');
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

function isValidColor(color: string): boolean {
	// Check for hex color format
	const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
	if (hexPattern.test(color)) {
		return true;
	}

	// Check for CSS color names (basic validation)
	const cssColors = [
		'transparent',
		'white',
		'black',
		'red',
		'green',
		'blue',
		'yellow',
		'cyan',
		'magenta'
	];
	if (cssColors.includes(color.toLowerCase())) {
		return true;
	}

	// Check for rgb/rgba format
	const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i;
	return rgbPattern.test(color);
}

export function sanitizeQRData(data: string): string {
	// Remove or replace characters that might cause issues with QR generation
	return (
		data
			.trim()
			// eslint-disable-next-line no-control-regex
			.replace(/[\u0000-\u001F\u007F]/g, '') // Remove control characters using Unicode escapes
			.substring(0, 2000)
	); // Limit length to prevent oversized QR codes
}
