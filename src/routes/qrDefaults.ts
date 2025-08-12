import type { QRStylingConfig } from './types.js';

export function getDefaultQRConfig(): QRStylingConfig {
	return {
		width: 300,
		height: 300,
		data: '',
		dotsOptions: {
			color: '#000000',
			type: 'square'
		},
		cornersSquareOptions: {
			color: '#000000',
			type: 'square'
		},
		cornersDotOptions: {
			color: '#000000',
			type: 'square'
		},
		backgroundOptions: {
			color: '#ffffff'
		},
		qrOptions: {
			typeNumber: 0,
			mode: 'Byte',
			errorCorrectionLevel: 'M'
		}
	};
}

export const qrStylePresets = {
	classic: getDefaultQRConfig(),
	modern: {
		...getDefaultQRConfig(),
		dotsOptions: { color: '#1a1a1a', type: 'rounded' as const },
		cornersSquareOptions: { color: '#1a1a1a', type: 'extra-rounded' as const }
	},
	colorful: {
		...getDefaultQRConfig(),
		dotsOptions: { color: '#3b82f6', type: 'classy' as const },
		cornersSquareOptions: { color: '#ef4444', type: 'extra-rounded' as const }
	},
	minimal: {
		...getDefaultQRConfig(),
		dotsOptions: { color: '#374151', type: 'dots' as const },
		cornersSquareOptions: { color: '#374151', type: 'dot' as const },
		cornersDotOptions: { color: '#374151', type: 'dot' as const }
	}
};

export const dotTypeOptions = [
	{ value: 'square', label: 'Square', description: 'Classic square dots' },
	{ value: 'rounded', label: 'Rounded', description: 'Rounded square dots' },
	{ value: 'dots', label: 'Dots', description: 'Circular dots' },
	{ value: 'classy', label: 'Classy', description: 'Stylized squares' },
	{ value: 'classy-rounded', label: 'Classy Rounded', description: 'Stylized rounded squares' },
	{ value: 'extra-rounded', label: 'Extra Rounded', description: 'Very rounded squares' }
] as const;

export const cornerSquareTypeOptions = [
	{ value: 'square', label: 'Square', description: 'Square corners' },
	{ value: 'extra-rounded', label: 'Rounded', description: 'Rounded corners' },
	{ value: 'dot', label: 'Dot', description: 'Circular corners' }
] as const;

export const cornerDotTypeOptions = [
	{ value: 'square', label: 'Square', description: 'Square corner dots' },
	{ value: 'dot', label: 'Dot', description: 'Circular corner dots' }
] as const;

export const errorCorrectionLevels = [
	{ value: 'L', label: 'Low (7%)', description: 'Recovers 7% of data' },
	{ value: 'M', label: 'Medium (15%)', description: 'Recovers 15% of data' },
	{ value: 'Q', label: 'Quartile (25%)', description: 'Recovers 25% of data' },
	{ value: 'H', label: 'High (30%)', description: 'Recovers 30% of data' }
] as const;
