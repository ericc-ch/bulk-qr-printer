<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import QRCodeStyling from 'qr-code-styling';
	import type { QRStylingConfig } from './types.js';
	import { validateQRConfig } from './qrCustomizationValidator.js';
	import {
		qrStylePresets,
		dotTypeOptions,
		cornerSquareTypeOptions,
		cornerDotTypeOptions,
		errorCorrectionLevels
	} from './qrDefaults.js';
	import ColorPicker from './ColorPicker.svelte';
	import PatternSelector from './PatternSelector.svelte';

	// Props
	export let config: QRStylingConfig;
	export let previewData: string;
	export let onConfigChange: (config: QRStylingConfig) => void;
	export let onValidationChange: (isValid: boolean, errors: string[]) => void;

	// Canvas handling
	let canvasContainer: HTMLDivElement;
	let qrCode: QRCodeStyling | null = null;
	let isLoading = false;
	let updateTimeout: number | null = null;

	// Local state for form controls
	let activeTab: 'basic' | 'advanced' = 'basic';
	let showPresets = false;

	onMount(() => {
		initializeQRCode();
	});

	onDestroy(() => {
		cleanup();
	});

	function initializeQRCode() {
		if (typeof window === 'undefined') return; // SSR guard

		try {
			isLoading = true;
			qrCode = new QRCodeStyling({
				...config,
				qrOptions: {
					...config.qrOptions,
					typeNumber: config.qrOptions.typeNumber as 0
				},
				data: previewData || 'Sample QR Code'
			});

			if (canvasContainer && qrCode) {
				qrCode.append(canvasContainer);
			}
		} catch (error) {
			console.error('Failed to initialize QR code:', error);
		} finally {
			isLoading = false;
		}
	}

	function updateQRCode() {
		if (!qrCode || typeof window === 'undefined') return;

		// Clear any pending update
		if (updateTimeout) {
			clearTimeout(updateTimeout);
		}

		// Debounce updates to prevent excessive re-rendering
		updateTimeout = window.setTimeout(() => {
			try {
				isLoading = true;
				qrCode?.update({
					...config,
					qrOptions: {
						...config.qrOptions,
						typeNumber: config.qrOptions.typeNumber as 0
					},
					data: previewData || 'Sample QR Code'
				});
			} catch (error) {
				console.error('Failed to update QR code:', error);
			} finally {
				isLoading = false;
			}
		}, 150);
	}

	function cleanup() {
		if (updateTimeout) {
			clearTimeout(updateTimeout);
		}
		if (canvasContainer) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			canvasContainer.innerHTML = '';
		}
		qrCode = null;
	}

	function handleConfigUpdate(newConfig: QRStylingConfig) {
		config = newConfig;
		onConfigChange(config);
		validateAndUpdate();
		updateQRCode();
	}

	function validateAndUpdate() {
		const validation = validateQRConfig(config);
		onValidationChange(validation.isValid, validation.errors);
	}

	function applyPreset(presetName: keyof typeof qrStylePresets) {
		const preset = qrStylePresets[presetName];
		handleConfigUpdate({
			...preset,
			data: config.data,
			width: config.width,
			height: config.height
		});
		showPresets = false;
	}

	function updateDimensions(width: number, height: number) {
		handleConfigUpdate({
			...config,
			width,
			height
		});
	}

	function updateMargin(margin: number) {
		handleConfigUpdate({
			...config,
			margin
		});
	}

	function updateDotsOptions(updates: Partial<typeof config.dotsOptions>) {
		handleConfigUpdate({
			...config,
			dotsOptions: {
				...config.dotsOptions,
				...updates
			}
		});
	}

	function updateCornersSquareOptions(updates: Partial<typeof config.cornersSquareOptions>) {
		handleConfigUpdate({
			...config,
			cornersSquareOptions: {
				...config.cornersSquareOptions,
				...updates
			}
		});
	}

	function updateCornersDotOptions(updates: Partial<typeof config.cornersDotOptions>) {
		handleConfigUpdate({
			...config,
			cornersDotOptions: {
				...config.cornersDotOptions,
				...updates
			}
		});
	}

	function updateBackgroundOptions(updates: Partial<typeof config.backgroundOptions>) {
		handleConfigUpdate({
			...config,
			backgroundOptions: {
				...config.backgroundOptions,
				...updates
			}
		});
	}

	function updateQrOptions(updates: Partial<typeof config.qrOptions>) {
		handleConfigUpdate({
			...config,
			qrOptions: {
				...config.qrOptions,
				...updates
			}
		});
	}

	// Reactive validation
	$: if (config) {
		validateAndUpdate();
	}
</script>

<div class="qr-customization mx-auto max-w-6xl p-6">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Preview Section -->
		<div class="preview-section">
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-900">Preview</h3>
					{#if isLoading}
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
							></div>
							Updating...
						</div>
					{/if}
				</div>

				<div
					class="canvas-container flex min-h-[320px] items-center justify-center rounded-lg bg-gray-50 p-4"
				>
					<div bind:this={canvasContainer} class="qr-preview"></div>
				</div>

				<div class="mt-4 text-sm text-gray-600">
					<p><strong>Preview data:</strong> {previewData || 'Sample QR Code'}</p>
					<p><strong>Size:</strong> {config.width} × {config.height}px</p>
					<p><strong>Padding:</strong> {config.margin || 0}px</p>
				</div>
			</div>
		</div>

		<!-- Controls Section -->
		<div class="controls-section">
			<div class="rounded-lg border bg-white shadow-sm">
				<!-- Preset Templates -->
				<div class="border-b border-gray-200 p-6">
					<div class="mb-3 flex items-center justify-between">
						<h4 class="font-medium text-gray-900">Quick Presets</h4>
						<button
							type="button"
							class="text-sm text-blue-600 hover:text-blue-700"
							on:click={() => (showPresets = !showPresets)}
						>
							{showPresets ? 'Hide' : 'Show'} Presets
						</button>
					</div>

					{#if showPresets}
						<div class="grid grid-cols-2 gap-2">
							{#each Object.entries(qrStylePresets) as [key, preset] (key)}
								<button
									type="button"
									class="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
									on:click={() => applyPreset(key as keyof typeof qrStylePresets)}
								>
									<div class="text-sm font-medium capitalize">{key}</div>
									<div class="mt-1 text-xs text-gray-500">
										{preset.dotsOptions.type} style
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Tab Navigation -->
				<div class="border-b border-gray-200">
					<nav class="flex">
						<button
							type="button"
							class="border-b-2 px-6 py-3 text-sm font-medium transition-colors
								   {activeTab === 'basic'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'}"
							on:click={() => (activeTab = 'basic')}
						>
							Basic Settings
						</button>
						<button
							type="button"
							class="border-b-2 px-6 py-3 text-sm font-medium transition-colors
								   {activeTab === 'advanced'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700'}"
							on:click={() => (activeTab = 'advanced')}
						>
							Advanced
						</button>
					</nav>
				</div>

				<!-- Tab Content -->
				<div class="space-y-6 p-6">
					{#if activeTab === 'basic'}
						<!-- Basic Settings -->

						<!-- Dimensions -->
						<div class="space-y-4">
							<h5 class="font-medium text-gray-900">Size & Spacing</h5>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="width-input" class="mb-1 block text-sm font-medium text-gray-700"
										>Width</label
									>
									<input
										id="width-input"
										type="number"
										min="50"
										max="1000"
										step="10"
										value={config.width}
										on:input={(e) =>
											updateDimensions(
												parseInt((e.target as HTMLInputElement).value),
												config.height
											)}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
									<p class="mt-1 text-xs text-gray-500">Range: 50-1000 pixels</p>
								</div>
								<div>
									<label for="height-input" class="mb-1 block text-sm font-medium text-gray-700"
										>Height</label
									>
									<input
										id="height-input"
										type="number"
										min="50"
										max="1000"
										step="10"
										value={config.height}
										on:input={(e) =>
											updateDimensions(
												config.width,
												parseInt((e.target as HTMLInputElement).value)
											)}
										class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
									/>
									<p class="mt-1 text-xs text-gray-500">Range: 50-1000 pixels</p>
								</div>
							</div>
							<div>
								<label for="margin-input" class="mb-1 block text-sm font-medium text-gray-700"
									>Padding (Margin)</label
								>
								<input
									id="margin-input"
									type="number"
									min="0"
									max="50"
									step="1"
									value={config.margin || 0}
									on:input={(e) =>
										updateMargin(parseInt((e.target as HTMLInputElement).value) || 0)}
									class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
								/>
								<p class="mt-1 text-xs text-gray-500">
									Padding around QR code content (0-50 pixels)
								</p>
							</div>
							<div class="rounded-lg bg-gray-50 p-3">
								<h6 class="mb-2 text-xs font-medium tracking-wide text-gray-700 uppercase">
									Preview Info
								</h6>
								<div class="space-y-1 text-xs text-gray-600">
									<div class="flex justify-between">
										<span>Size:</span>
										<span>{config.width} × {config.height} pixels</span>
									</div>
									<div class="flex justify-between">
										<span>Aspect ratio:</span>
										<span>{(config.width / config.height).toFixed(2)}:1</span>
									</div>
									<div class="flex justify-between">
										<span>Padding:</span>
										<span>{config.margin || 0} pixels</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Colors -->
						<div class="space-y-4">
							<h5 class="font-medium text-gray-900">Colors</h5>

							<ColorPicker
								label="Dot Color"
								value={config.dotsOptions.color}
								onChange={(color) => updateDotsOptions({ color })}
							/>

							<ColorPicker
								label="Background Color"
								value={config.backgroundOptions.color}
								onChange={(color) => updateBackgroundOptions({ color })}
							/>
						</div>

						<!-- Dot Pattern -->
						<PatternSelector
							label="Dot Style"
							value={config.dotsOptions.type}
							options={[...dotTypeOptions]}
							onChange={(type: string) =>
								updateDotsOptions({ type: type as typeof config.dotsOptions.type })}
						/>
					{:else}
						<!-- Advanced Settings -->

						<!-- Corner Square Settings -->
						<div class="space-y-4">
							<h5 class="font-medium text-gray-900">Corner Squares</h5>

							<ColorPicker
								label="Corner Square Color"
								value={config.cornersSquareOptions.color}
								onChange={(color) => updateCornersSquareOptions({ color })}
							/>

							<PatternSelector
								label="Corner Square Style"
								value={config.cornersSquareOptions.type}
								options={[...cornerSquareTypeOptions]}
								onChange={(type: string) =>
									updateCornersSquareOptions({
										type: type as typeof config.cornersSquareOptions.type
									})}
							/>
						</div>

						<!-- Corner Dot Settings -->
						<div class="space-y-4">
							<h5 class="font-medium text-gray-900">Corner Dots</h5>

							<ColorPicker
								label="Corner Dot Color"
								value={config.cornersDotOptions.color}
								onChange={(color) => updateCornersDotOptions({ color })}
							/>

							<PatternSelector
								label="Corner Dot Style"
								value={config.cornersDotOptions.type}
								options={[...cornerDotTypeOptions]}
								onChange={(type: string) =>
									updateCornersDotOptions({ type: type as typeof config.cornersDotOptions.type })}
							/>
						</div>

						<!-- Error Correction -->
						<PatternSelector
							label="Error Correction Level"
							value={config.qrOptions.errorCorrectionLevel}
							options={[...errorCorrectionLevels]}
							onChange={(level: string) =>
								updateQrOptions({
									errorCorrectionLevel: level as typeof config.qrOptions.errorCorrectionLevel
								})}
						/>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.qr-preview :global(canvas) {
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}
</style>
