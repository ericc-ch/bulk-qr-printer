<script lang="ts">
	import type { ColumnSelectionConfig, QRCustomizationState } from './types';

	interface Props {
		selectedFile: File | null;
		columnConfig: ColumnSelectionConfig;
		qrCustomization: QRCustomizationState;
		processedData: string[];
		onSubmit: () => void;
	}

	let { selectedFile, columnConfig, qrCustomization, processedData, onSubmit }: Props = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">5. Generate QR Codes</h2>
		<span
			class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
		>
			Ready
		</span>
	</div>

	<div class="py-8 text-center">
		<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
			<div class="space-y-2 text-sm text-blue-700">
				<p><strong>File:</strong> {selectedFile?.name}</p>
				<p><strong>Column:</strong> {columnConfig.selectedColumn}</p>
				<p><strong>QR Codes:</strong> {processedData.length}</p>
				<p>
					<strong>Dimensions:</strong>
					{qrCustomization.config.width} × {qrCustomization.config.height} pixels
				</p>
				<p>
					<strong>Style:</strong>
					{qrCustomization.config.dotsOptions.type} dots, {qrCustomization.config.qrOptions
						.errorCorrectionLevel} error correction
				</p>
			</div>
		</div>

		<button
			onclick={onSubmit}
			class="rounded-lg bg-blue-600 px-8 py-4 text-base font-medium text-white shadow-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		>
			🎯 Generate QR Codes
		</button>
	</div>
</div>
