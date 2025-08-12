<script lang="ts">
	import QRCustomization from './QRCustomization.svelte';
	import { appState } from '../stores/ApplicationState.svelte';
	import type { QRCustomizationState } from './types';
	import type { ColumnSelectionEvent, QRConfigEvent } from '../stores/ApplicationState.svelte';

	interface Props {
		qrCustomization: QRCustomizationState;
		onConfigChange: (config: typeof qrCustomization.config) => void;
		onValidationChange: (isValid: boolean, errors: string[]) => void;
	}

	let { qrCustomization, onConfigChange, onValidationChange }: Props = $props();

	let isComplete = $derived(Boolean(qrCustomization.isValid));
	let previewUpdateCount = $state(0);
	let lastPreviewUpdate = $state<string>('');

	// Listen for column selection changes to show real-time feedback
	$effect(() => {
		const unsubscribeColumnChange = appState.addEventListener<ColumnSelectionEvent>(
			'column:selected',
			(event) => {
				console.log('QR Section received column change event:', event.payload.config);
			}
		);

		const unsubscribePreviewUpdate = appState.addEventListener<QRConfigEvent>(
			'qr:preview-updated',
			(event) => {
				previewUpdateCount++;
				lastPreviewUpdate = new Date().toLocaleTimeString();
				console.log('QR preview updated:', event.payload.previewData);
			}
		);

		const unsubscribeQRValidated = appState.addEventListener<QRConfigEvent>(
			'qr:validated',
			(event) => {
				console.log('QR validation event:', event.payload.validation);
			}
		);

		return () => {
			unsubscribeColumnChange();
			unsubscribePreviewUpdate();
			unsubscribeQRValidated();
		};
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">4. Customize QR Codes</h2>
		{#if isComplete}
			<span
				class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
			>
				✓ Complete
			</span>
		{/if}
	</div>

	<!-- Real-time preview status indicator -->
	{#if qrCustomization.previewData && previewUpdateCount > 0}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
			<p class="text-xs text-blue-600">
				🔄 Preview updated {previewUpdateCount} times • Last update: {lastPreviewUpdate}
			</p>
			<p class="mt-1 text-xs text-blue-500">
				Current preview data: "{qrCustomization.previewData.substring(0, 50)}{qrCustomization
					.previewData.length > 50
					? '...'
					: ''}"
			</p>
		</div>
	{/if}

	<QRCustomization
		config={qrCustomization.config}
		previewData={qrCustomization.previewData}
		{onConfigChange}
		{onValidationChange}
	/>

	{#if qrCustomization.errors.length > 0}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-red-800">QR Configuration Errors</h3>
			<ul class="space-y-1 text-sm text-red-700">
				{#each qrCustomization.errors as error, index (index)}
					<li>• {error}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if isComplete}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-800">
				QR customization complete! Style: {qrCustomization.config.dotsOptions.type} dots,
				{qrCustomization.config.width}×{qrCustomization.config.height}px
			</p>
			<p class="mt-1 text-xs text-green-600">✅ Ready for bulk generation</p>
		</div>
	{/if}
</div>
