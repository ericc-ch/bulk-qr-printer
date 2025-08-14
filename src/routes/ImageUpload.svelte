<script lang="ts">
	import { validateImageFile, validateImageDimensions } from './qrCustomizationValidator.js';
	import type { ValidationError } from './types.js';

	// Props using Svelte 5 runes syntax
	let {
		onImageSelect,
		currentImage = null,
		disabled = false,
		error = null
	}: {
		onImageSelect: (imageDataUrl: string | null) => void;
		currentImage?: string | null;
		disabled?: boolean;
		error?: ValidationError | null;
	} = $props();

	// Local state
	let isDragOver = $state(false);
	let isLoading = $state(false);
	// eslint-disable-next-line svelte/prefer-writable-derived
	let previewUrl = $state<string | null>(currentImage);
	let uploadError = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	// Update preview when currentImage prop changes
	$effect(() => {
		previewUrl = currentImage;
	});

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		if (!disabled) {
			isDragOver = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;

		if (disabled) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	}

	function handleFileInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	}

	function handleFileSelect(file: File) {
		uploadError = null;

		// Validate file
		const fileErrors = validateImageFile(file);
		if (fileErrors.length > 0) {
			uploadError = fileErrors.join(', ');
			return;
		}

		isLoading = true;

		// Create image element to validate dimensions
		const img = new Image();
		img.onload = () => {
			// Validate dimensions
			const dimensionErrors = validateImageDimensions(img.width, img.height);
			if (dimensionErrors.length > 0) {
				uploadError = dimensionErrors.join(', ');
				isLoading = false;
				return;
			}

			// Convert to data URL
			const reader = new FileReader();
			reader.onload = (e) => {
				const dataUrl = e.target?.result as string;
				previewUrl = dataUrl;
				onImageSelect(dataUrl);
				isLoading = false;
			};
			reader.onerror = () => {
				uploadError = 'Failed to read image file';
				isLoading = false;
			};
			reader.readAsDataURL(file);
		};
		img.onerror = () => {
			uploadError = 'Invalid image file';
			isLoading = false;
		};
		img.src = URL.createObjectURL(file);
	}

	function clearImage() {
		previewUrl = null;
		uploadError = null;
		onImageSelect(null);
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function openFileDialog() {
		if (!disabled && fileInput) {
			fileInput.click();
		}
	}
</script>

<div class="image-upload">
	<div class="mb-2 flex items-center justify-between">
		<span class="text-sm font-medium text-gray-700">Center Image</span>
		{#if previewUrl}
			<button
				type="button"
				class="text-sm text-red-600 hover:text-red-700"
				onclick={clearImage}
				{disabled}
			>
				Remove
			</button>
		{/if}
	</div>

	{#if previewUrl}
		<!-- Image Preview -->
		<div class="image-preview rounded-lg border border-gray-200 p-4">
			<div class="flex items-center justify-center">
				<img src={previewUrl} alt="Preview" class="max-h-32 max-w-32 rounded border shadow-sm" />
			</div>
			<div class="mt-2 text-center">
				<button
					type="button"
					class="text-sm text-blue-600 hover:text-blue-700"
					onclick={openFileDialog}
					{disabled}
				>
					Change Image
				</button>
			</div>
		</div>
	{:else}
		<!-- Upload Area -->
		<div
			class="upload-area relative rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors
				   {isDragOver ? 'border-blue-400 bg-blue-50' : ''}
				   {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}"
			role="button"
			tabindex="0"
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			ondrop={handleDrop}
			onclick={openFileDialog}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					openFileDialog();
				}
			}}
		>
			{#if isLoading}
				<div class="flex flex-col items-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
					></div>
					<p class="mt-2 text-sm text-gray-600">Processing image...</p>
				</div>
			{:else}
				<div class="flex flex-col items-center">
					<svg
						class="h-12 w-12 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<p class="mt-2 text-sm font-medium text-gray-900">Upload center image</p>
					<p class="mt-1 text-xs text-gray-500">Drag and drop or click to browse</p>
					<p class="mt-1 text-xs text-gray-400">PNG, JPG, SVG, GIF, WebP (max 5MB)</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Error Display -->
	{#if uploadError || error}
		<div class="mt-2 rounded-md bg-red-50 p-2">
			<div class="flex">
				<svg class="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						clip-rule="evenodd"
					/>
				</svg>
				<p class="ml-2 text-sm text-red-700">
					{uploadError || error?.message}
				</p>
			</div>
		</div>
	{/if}

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
		class="hidden"
		onchange={handleFileInputChange}
		{disabled}
	/>
</div>

<style>
	.upload-area {
		min-height: 120px;
	}

	.image-preview {
		min-height: 120px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
</style>
