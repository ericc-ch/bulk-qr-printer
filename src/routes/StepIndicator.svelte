<script lang="ts">
	import type { FormStep } from './types';

	interface Props {
		currentStep: FormStep;
		completedSteps?: FormStep[];
	}

	let { currentStep, completedSteps = [] }: Props = $props();

	const steps: { id: FormStep; label: string; description: string }[] = [
		{ id: 'upload', label: 'Upload', description: 'Select CSV file' },
		{ id: 'preview', label: 'Preview', description: 'Review data' },
		{ id: 'column-select', label: 'Column', description: 'Choose barcode data' },
		{ id: 'dimensions', label: 'Dimensions', description: 'Set size' },
		{ id: 'ready', label: 'Generate', description: 'Create QR codes' }
	];

	function getStepStatus(stepId: FormStep): 'completed' | 'current' | 'upcoming' {
		if (completedSteps.includes(stepId)) return 'completed';
		if (stepId === currentStep) return 'current';
		return 'upcoming';
	}

	function getStepNumber(index: number): number {
		return index + 1;
	}
</script>

<nav class="mb-8">
	<ol class="flex w-full items-center justify-between">
		{#each steps as step, index}
			{@const status = getStepStatus(step.id)}
			{@const stepNumber = getStepNumber(index)}

			<li class="flex items-center {index < steps.length - 1 ? 'flex-1' : ''}">
				<div class="flex items-center">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors
						{status === 'completed'
							? 'border-blue-600 bg-blue-600 text-white'
							: status === 'current'
								? 'border-blue-600 bg-blue-50 text-blue-600'
								: 'border-gray-300 bg-gray-50 text-gray-500'}"
					>
						{#if status === 'completed'}
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<span class="text-sm font-medium">{stepNumber}</span>
						{/if}
					</div>

					<div class="ml-3 min-w-0">
						<p
							class="text-sm font-medium
							{status === 'current'
								? 'text-blue-600'
								: status === 'completed'
									? 'text-gray-900'
									: 'text-gray-500'}"
						>
							{step.label}
						</p>
						<p class="text-xs text-gray-500">{step.description}</p>
					</div>
				</div>

				{#if index < steps.length - 1}
					<div class="mx-4 flex-1">
						<div
							class="h-0.5 transition-colors
							{completedSteps.includes(step.id) ? 'bg-blue-600' : 'bg-gray-300'}"
						></div>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
