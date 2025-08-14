import type { QRStylingConfig, QRValidationRules } from './types.js';

export const qrValidationRules: QRValidationRules = {
	width: { min: 100, max: 1000 },
	height: { min: 100, max: 1000 },
	imageSize: { min: 0.1, max: 0.5 },
	imageFileSize: { max: 5 * 1024 * 1024 }, // 5MB
	imageDimensions: { min: 50, max: 2000 }, // pixels
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

	// Image options validation
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

	// Validate image readability
	const qrSize = Math.min(config.width, config.height);
	if (!validateImageReadability(qrSize, config.imageOptions.imageSize)) {
		errors.push('Image size may affect QR code readability. Consider using a smaller image.');
	}

	// Image URL validation (if provided)
	if (config.image) {
		const imageUrlErrors = validateImageUrl(config.image);
		errors.push(...imageUrlErrors);
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

export function validateImageFile(file: File): string[] {
	const errors: string[] = [];

	// File size validation
	if (file.size > qrValidationRules.imageFileSize.max) {
		const maxSizeMB = qrValidationRules.imageFileSize.max / (1024 * 1024);
		errors.push(`Image file size must not exceed ${maxSizeMB}MB`);
	}

	// File type validation
	const allowedTypes = [
		'image/png',
		'image/jpeg',
		'image/jpg',
		'image/gif',
		'image/svg+xml',
		'image/webp'
	];
	if (!allowedTypes.includes(file.type)) {
		errors.push('Invalid image format. Only PNG, JPG, GIF, SVG, and WebP are supported');
	}

	return errors;
}

export function validateImageDimensions(width: number, height: number): string[] {
	const errors: string[] = [];
	const { min, max } = qrValidationRules.imageDimensions;

	if (width < min || height < min) {
		errors.push(`Image dimensions must be at least ${min}x${min} pixels`);
	}

	if (width > max || height > max) {
		errors.push(`Image dimensions must not exceed ${max}x${max} pixels`);
	}

	return errors;
}

export function validateImageReadability(qrSize: number, imageSize: number): boolean {
	// Ensure image size doesn't exceed safe limits for QR readability
	// Higher error correction levels can tolerate larger images
	const maxSafeRatio = 0.3; // 30% of QR code size
	const actualImagePixels = qrSize * imageSize;
	const maxSafePixels = qrSize * maxSafeRatio;
	return actualImagePixels <= maxSafePixels;
}

export function getImageSizeRecommendation(qrSize: number): number {
	// Recommend 20% of QR size for optimal readability
	// Scale recommendation based on QR code size
	const sizeAdjustment = qrSize > 300 ? 0.25 : 0.2;
	const maxAllowedRatio = qrValidationRules.imageSize.max;
	return Math.min(sizeAdjustment, maxAllowedRatio);
}

export function validateImageUrl(imageUrl: string): string[] {
	const errors: string[] = [];

	if (!imageUrl || imageUrl.trim().length === 0) {
		return errors; // Empty URL is valid (no image)
	}

	// Validate data URL format
	if (imageUrl.startsWith('data:')) {
		const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/i;
		if (!dataUrlPattern.test(imageUrl)) {
			errors.push('Invalid image data format');
		}
	} else {
		// Validate HTTP/HTTPS URL
		try {
			const url = new URL(imageUrl);
			if (!['http:', 'https:'].includes(url.protocol)) {
				errors.push('Image URL must use HTTP or HTTPS protocol');
			}
		} catch {
			errors.push('Invalid image URL format');
		}
	}

	return errors;
}
