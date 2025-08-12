<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import QRCodeStyling from 'qr-code-styling';
	import type { QRStylingConfig } from './types.js';

	export let qrData: string[];
	export let config: QRStylingConfig;
	export let onReset: () => void;

	let qrContainer: HTMLDivElement;
	let isGenerating = false;
	let generatedCount = 0;
	let generationError: string | null = null;
	let containerWidth = 0;
	let gridElement: HTMLDivElement;

	interface GridConfig {
		columns: number;
		itemWidth: number;
		gap: number;
	}

	function calculateOptimalGridColumns(
		qrWidth: number,
		containerWidth: number,
		minColumns = 1,
		maxColumns = 8
	): GridConfig {
		if (containerWidth <= 0) {
			return { columns: minColumns, itemWidth: qrWidth + 32, gap: 16 };
		}

		const itemPadding = 32;
		const itemBorder = 2;
		const totalItemWidth = qrWidth + itemPadding + itemBorder;
		const minGap = 16;

		let optimalColumns = Math.floor((containerWidth + minGap) / (totalItemWidth + minGap));
		optimalColumns = Math.max(minColumns, Math.min(maxColumns, optimalColumns));

		const availableWidth = containerWidth - (optimalColumns - 1) * minGap;
		const actualItemWidth = Math.floor(availableWidth / optimalColumns);

		return {
			columns: optimalColumns,
			itemWidth: Math.max(actualItemWidth, totalItemWidth),
			gap: minGap
		};
	}

	function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
		let timeoutId: ReturnType<typeof setTimeout>;
		return ((...args: unknown[]) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func.apply(null, args), delay);
		}) as T;
	}

	$: gridConfig = calculateOptimalGridColumns(config.width || 256, containerWidth);

	$: if (gridElement && gridConfig) {
		gridElement.style.setProperty('--grid-columns', gridConfig.columns.toString());
		gridElement.style.setProperty('--grid-item-width', `${gridConfig.itemWidth}px`);
		gridElement.style.setProperty('--grid-gap', `${gridConfig.gap}px`);
	}

	const updateContainerWidth = debounce(() => {
		if (gridElement) {
			containerWidth = gridElement.offsetWidth;
		}
	}, 150);

	onMount(() => {
		generateAllQRCodes();
		updateContainerWidth();
		window.addEventListener('resize', updateContainerWidth);
	});

	onDestroy(() => {
		cleanup();
		window.removeEventListener('resize', updateContainerWidth);
	});

	async function generateAllQRCodes() {
		if (!qrContainer || typeof window === 'undefined') return;

		isGenerating = true;
		generatedCount = 0;
		generationError = null;

		// Clear any existing content
		// eslint-disable-next-line svelte/no-dom-manipulating
		qrContainer.innerHTML = '';

		try {
			for (let i = 0; i < qrData.length; i++) {
				await generateSingleQR(qrData[i]);
				generatedCount = i + 1;

				// Allow UI to update every 10 QR codes
				if (i % 10 === 0) {
					await new Promise((resolve) => setTimeout(resolve, 10));
				}
			}
		} catch (error) {
			console.error('Failed to generate QR codes:', error);
			generationError = 'Failed to generate some QR codes. Please check your data and try again.';
		} finally {
			isGenerating = false;
		}
	}

	async function generateSingleQR(data: string): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				// Create container for this QR code
				const container = document.createElement('div');
				container.className = 'qr-code-item';
				container.style.cssText = `
					break-inside: avoid;
					padding: 1rem;
					border: 1px solid #000;
					background-color: #fff;
					margin: 0.5rem;
					display: flex;
					flex-direction: column;
					align-items: center;
					page-break-inside: avoid;
				`;

				// Create QR code
				const qrCode = new QRCodeStyling({
					...config,
					qrOptions: {
						...config.qrOptions,
						typeNumber: config.qrOptions.typeNumber as 0
					},
					data: data.trim() || 'Empty Data'
				});

				// Create canvas container
				const canvasContainer = document.createElement('div');
				canvasContainer.style.cssText = 'margin-bottom: 0.5rem;';

				// Add data label
				const label = document.createElement('div');
				label.textContent = data.trim() || 'Empty Data';
				label.style.cssText = `
					font-size: 0.75rem;
					color: #374151;
					text-align: center;
					word-break: break-all;
					max-width: ${config.width}px;
				`;

				// Assemble container
				container.appendChild(canvasContainer);
				container.appendChild(label);
				// eslint-disable-next-line svelte/no-dom-manipulating
				qrContainer.appendChild(container);

				// Generate QR code
				qrCode.append(canvasContainer);

				// Resolve after a short delay to allow rendering
				setTimeout(resolve, 50);
			} catch (error) {
				console.error(`Failed to generate QR code for data: ${data}`, error);
				reject(error);
			}
		});
	}

	function cleanup() {
		if (qrContainer) {
			// Clean up all Canvas elements
			const canvases = qrContainer.querySelectorAll('canvas');
			canvases.forEach((canvas) => {
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
				}
			});
			// eslint-disable-next-line svelte/no-dom-manipulating
			qrContainer.innerHTML = '';
		}
	}

	function handlePrint() {
		window.print();
	}

	function handleExportData() {
		const exportData = {
			totalCodes: qrData.length,
			config: config,
			data: qrData,
			generatedAt: new Date().toISOString()
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'qr-codes-config.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="qr-display">
	<!-- Controls (hidden when printing) -->
	<div class="controls no-print sticky top-0 z-10 border-b bg-gray-50 p-4">
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<div class="flex items-center gap-4">
				<h1 class="text-xl font-semibold text-gray-900">Generated QR Codes</h1>
				{#if isGenerating}
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
						></div>
						Generating... {generatedCount}/{qrData.length}
					</div>
				{:else}
					<span class="text-sm text-gray-600">{qrData.length} QR codes generated</span>
				{/if}
			</div>

			<div class="flex gap-2">
				<button
					onclick={onReset}
					disabled={isGenerating}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700
						   hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
						   disabled:cursor-not-allowed disabled:opacity-50"
				>
					← Back to Form
				</button>

				<button
					onclick={handleExportData}
					disabled={isGenerating}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700
						   hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
						   disabled:cursor-not-allowed disabled:opacity-50"
				>
					📄 Export Config
				</button>

				<button
					onclick={handlePrint}
					disabled={isGenerating}
					class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
						   hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
						   disabled:cursor-not-allowed disabled:opacity-50"
				>
					🖨️ Print
				</button>
			</div>
		</div>
	</div>

	<!-- Error Display -->
	{#if generationError}
		<div class="no-print mx-auto max-w-6xl p-4">
			<div class="rounded-lg border border-red-200 bg-red-50 p-4">
				<h3 class="text-sm font-medium text-red-800">Generation Error</h3>
				<p class="mt-1 text-sm text-red-700">{generationError}</p>
			</div>
		</div>
	{/if}

	<!-- QR Codes Grid -->
	<div class="qr-codes-container">
		<div bind:this={qrContainer} bind:this={gridElement} class="qr-grid"></div>
	</div>

	<!-- Print Instructions (only visible when printing) -->
	<div class="print-only p-4 text-center text-sm text-gray-600">
		<p>Generated with Bulk QR Code Generator</p>
		<p>Total QR Codes: {qrData.length}</p>
	</div>
</div>

<style>
	.qr-grid {
		--grid-columns: 3;
		--grid-item-width: 256px;
		--grid-gap: 16px;

		display: grid;
		grid-template-columns: repeat(var(--grid-columns), 1fr);
		gap: var(--grid-gap);
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		justify-items: center;
	}

	:global(.qr-code-item) {
		width: var(--grid-item-width);
		max-width: 100%;
	}

	/* Print styles */
	@media print {
		:global(body) {
			margin: 0 !important;
			padding: 0 !important;
		}

		.no-print {
			display: none !important;
		}

		.print-only {
			display: block !important;
		}

		.qr-grid {
			--grid-columns: 4;
			--grid-gap: 8px;
			padding: 0;
			max-width: none;
			grid-template-columns: repeat(var(--grid-columns), 1fr);
		}

		:global(.qr-code-item) {
			break-inside: avoid !important;
			page-break-inside: avoid !important;
			margin: 0.25rem !important;
			padding: 0.5rem !important;
		}

		/* Ensure white background for print */
		* {
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}
	}

	.print-only {
		display: none;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.qr-grid {
			--grid-columns: 2;
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		.qr-grid {
			--grid-columns: 1;
			padding: 0.5rem;
		}
	}

	/* Wide screen optimization */
	@media (min-width: 1440px) {
		.qr-grid {
			max-width: 1600px;
		}
	}

	/* Container queries fallback for very narrow containers */
	@container (max-width: 400px) {
		.qr-grid {
			--grid-columns: 1;
		}
	}
</style>
