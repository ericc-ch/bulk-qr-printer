<script lang="ts">
	interface SectionStatus {
		id: string;
		label: string;
		status: 'pending' | 'in-progress' | 'completed';
		required: boolean;
	}

	interface Props {
		fileUploaded: boolean;
		dataReady: boolean;
		columnSelected: boolean;
		qrCustomized: boolean;
		readyToGenerate: boolean;
	}

	let { fileUploaded, dataReady, columnSelected, qrCustomized, readyToGenerate }: Props = $props();

	let sections = $derived<SectionStatus[]>([
		{
			id: 'upload',
			label: 'Upload CSV File',
			status: fileUploaded ? 'completed' : 'in-progress',
			required: true
		},
		{
			id: 'preview',
			label: 'Preview Data',
			status: dataReady ? 'completed' : fileUploaded ? 'in-progress' : 'pending',
			required: true
		},
		{
			id: 'column',
			label: 'Select Column',
			status: columnSelected ? 'completed' : dataReady ? 'in-progress' : 'pending',
			required: true
		},
		{
			id: 'customize',
			label: 'Customize QR Codes',
			status: qrCustomized ? 'completed' : columnSelected ? 'in-progress' : 'pending',
			required: true
		},
		{
			id: 'generate',
			label: 'Generate QR Codes',
			status: readyToGenerate ? 'in-progress' : qrCustomized ? 'pending' : 'pending',
			required: true
		}
	]);

	let completedCount = $derived(sections.filter((s) => s.status === 'completed').length);
	let totalCount = $derived(sections.length);
	let progressPercentage = $derived((completedCount / totalCount) * 100);
</script>

<div class="mb-8">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-sm font-medium text-gray-900">Progress</h3>
		<span class="text-sm text-gray-500">{completedCount} of {totalCount} completed</span>
	</div>

	<!-- Progress Bar -->
	<div class="mb-4 h-2 w-full rounded-full bg-gray-200">
		<div
			class="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-in-out"
			style="width: {progressPercentage}%"
		></div>
	</div>

	<!-- Section Status Indicators -->
	<div class="flex justify-between">
		{#each sections as section, index (section.id)}
			<div class="flex flex-col items-center">
				<div
					class="mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 {section.status ===
					'completed'
						? 'border-green-500 bg-green-100 text-green-600'
						: section.status === 'in-progress'
							? 'border-blue-500 bg-blue-100 text-blue-600'
							: 'border-gray-300 bg-gray-100 text-gray-400'}"
				>
					{#if section.status === 'completed'}
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
					{:else if section.status === 'in-progress'}
						<div class="h-2 w-2 animate-pulse rounded-full bg-current"></div>
					{:else}
						<span class="text-xs font-medium">{index + 1}</span>
					{/if}
				</div>
				<span class="max-w-16 text-center text-xs text-gray-600">{section.label}</span>
			</div>
		{/each}
	</div>
</div>
