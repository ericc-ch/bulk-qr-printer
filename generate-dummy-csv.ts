import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';

// Generate 100 random SKUs
const skus = Array.from(
	{ length: 100 },
	() =>
		faker.commerce.productName().replace(/\s+/g, '-').toUpperCase() +
		'-' +
		faker.string.alphanumeric(8).toUpperCase()
);

// Create CSV content
const csvContent = 'skus\n' + skus.join('\n');

// Write to file
writeFileSync('dummy-skus.csv', csvContent);

console.log('Generated dummy-skus.csv with 100 random SKUs');
