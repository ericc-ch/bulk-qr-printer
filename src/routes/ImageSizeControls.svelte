<script lang="ts">
	import {
		getImageSizeRecommendation,
		validateImageReadability
	} from './qrCustomizationValidator.js';
	import type { QRStylingConfig } from './types.js';

	// Props using Svelte 5 runes syntax
	let {
		config,
		onImageOptionsChange,
		hasImage = false
	}: {
		config: QRStylingConfig;
		onImageOptionsChange: (options: Partial<NonNullable<QRStylingConfig['imageOptions']>>) => void;
		hasImage?: boolean;
	} = $props();

	// Local state for better UX
	let imageSize = $state(config.imageOptions.imageSize);
	let imageMargin = $state(config.imageOptions.margin);
	let hideBackgroundDots = $state(config.imageOptions.hideBackgroundDots);

	// Computed values
	let qrSize = $derived(Math.min(config.width, config.height));
	let imageSizePixels = $derived(Math.round(qrSize * imageSize));
	let isReadable = $derived(validateImageReadability(qrSize, imageSize));
	let recommendedSize = $derived(getImageSizeRecommendation(qrSize));

	// Update local state when config changes
	$effect(() => {
		imageSize = config.imageOptions.imageSize;
		imageMargin = config.imageOptions.margin;
		hideBackgroundDots = config.imageOptions.hideBackgroundDots;
	});

	function updateImageSize(value: number) {
		imageSize = value;
		onImageOptionsChange({ imageSize: value });
	}

	function updateImageMargin(value: number) {
		imageMargin = value;
		onImageOptionsChange({ margin: value });
	}

	function updateHideBackgroundDots(value: boolean) {
		hideBackgroundDots = value;
		onImageOptionsChange({ hideBackgroundDots: value });
	}

	function resetToRecommended() {
		const recommended = getImageSizeRecommendation(qrSize);
		updateImageSize(recommended);
	}

	function handleSizeSliderChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateImageSize(parseFloat(target.value));
	}

	function handleSizeInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseFloat(target.value);
		if (!isNaN(value) && value >= 0.1 && value <= 0.5) {
			updateImageSize(value);
		}
	}

	function handleMarginChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (!isNaN(value) && value >= 0 && value <= 50) {
			updateImageMargin(value);
		}
	}
</script>

<div
	class="image-size-controls space-y-4"
	class:opacity-50={!hasImage}
	class:pointer-events-none={!hasImage}
>
	<div class="flex items-center justify-between">
		<h5 class="font-medium text-gray-900">Image Size & Position</h5>
		{#if hasImage}
			<button
				type="button"
				class="text-sm text-blue-600 hover:text-blue-700"
				onclick={resetToRecommended}
			>
				Use Recommended
			</button>
		{/if}
	</div>

	<!-- Image Size Controls -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<label for="image-size-slider" class="text-sm font-medium text-gray-700"> Image Size </label>
			<div class="flex items-center gap-2">
				<input
					type="number"
					min="0.1"
					max="0.5"
					step="0.01"
					value={imageSize.toFixed(2)}
					onchange={handleSizeInputChange}
					class="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
					disabled={!hasImage}
				/>
				<span class="text-sm text-gray-500">({imageSizePixels}px)</span>
			</div>
		</div>

		<div class="space-y-2">
			<input
				id="image-size-slider"
				type="range"
				min="0.1"
				max="0.5"
				step="0.01"
				value={imageSize}
				onchange={handleSizeSliderChange}
				oninput={handleSizeSliderChange}
				class="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
				disabled={!hasImage}
			/>
			<div class="flex justify-between text-xs text-gray-500">
				<span>Small (10%)</span>
				<span>Medium (30%)</span>
				<span>Large (50%)</span>
			</div>
		</div>

		<!-- Readability Warning -->
		{#if hasImage && !isReadable}
			<div class="rounded-md bg-yellow-50 p-3">
				<div class="flex">
					<svg class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					<div class="ml-2">
						<p class="text-sm text-yellow-700">Large image size may affect QR code readability</p>
						<p class="mt-1 text-xs text-yellow-600">
							Recommended: {Math.round(recommendedSize * 100)}% ({Math.round(
								qrSize * recommendedSize
							)}px)
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Readability Indicator -->
		{#if hasImage}
			<div class="rounded-lg bg-gray-50 p-3">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-700">Readability:</span>
					<span
						class="font-medium"
						class:text-green-600={isReadable}
						class:text-yellow-600={!isReadable}
					>
						{isReadable ? 'Good' : 'Caution'}
					</span>
				</div>
				<div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
					<div
						class="h-full transition-all duration-300"
						class:bg-green-500={isReadable}
						class:bg-yellow-500={!isReadable}
						style="width: {Math.min((1 - imageSize) * 100, 100)}%"
					></div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Image Margin -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<label for="image-margin" class="text-sm font-medium text-gray-700"> Image Padding </label>
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500">{imageMargin}px</span>
			</div>
		</div>

		<input
			id="image-margin"
			type="range"
			min="0"
			max="20"
			step="1"
			value={imageMargin}
			onchange={handleMarginChange}
			oninput={handleMarginChange}
			class="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
			disabled={!hasImage}
		/>
		<div class="flex justify-between text-xs text-gray-500">
			<span>None (0px)</span>
			<span>Medium (10px)</span>
			<span>Large (20px)</span>
		</div>
	</div>

	<!-- Advanced Options -->
	<div class="space-y-3">
		<h6 class="text-sm font-medium text-gray-700">Advanced Options</h6>

		<div class="flex items-center">
			<input
				id="hide-background-dots"
				type="checkbox"
				checked={hideBackgroundDots}
				onchange={(e) => updateHideBackgroundDots((e.target as HTMLInputElement).checked)}
				class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				disabled={!hasImage}
			/>
			<label for="hide-background-dots" class="ml-2 text-sm text-gray-700">
				Hide dots behind image
			</label>
		</div>
		<p class="ml-6 text-xs text-gray-500">
			Improves image visibility by hiding QR dots in the background
		</p>
	</div>

	<!-- Size Information -->
	{#if hasImage}
		<div class="rounded-lg bg-gray-50 p-3">
			<h6 class="mb-2 text-xs font-medium tracking-wide text-gray-700 uppercase">
				Size Information
			</h6>
			<div class="space-y-1 text-xs text-gray-600">
				<div class="flex justify-between">
					<span>QR Code Size:</span>
					<span>{config.width} × {config.height} pixels</span>
				</div>
				<div class="flex justify-between">
					<span>Image Size:</span>
					<span>{imageSizePixels} × {imageSizePixels} pixels</span>
				</div>
				<div class="flex justify-between">
					<span>Image Ratio:</span>
					<span>{Math.round(imageSize * 100)}% of QR size</span>
				</div>
				<div class="flex justify-between">
					<span>Image Padding:</span>
					<span>{imageMargin} pixels</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.slider {
		background: linear-gradient(to right, #e5e7eb 0%, #3b82f6 50%, #ef4444 100%);
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 18px;
		width: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid #ffffff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider::-moz-range-thumb {
		height: 18px;
		width: 18px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: 2px solid #ffffff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}
</style>
