<script lang="ts">
	export let label: string;
	export let value: string;
	export let options: Array<{ value: string; label: string; description?: string }>;
	export let onChange: (pattern: string) => void;
	export let disabled = false;
</script>

<div class="pattern-selector">
	<div class="mb-2 block text-sm font-medium text-gray-700">
		{label}
	</div>

	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
		{#each options as option (option.value)}
			<button
				type="button"
				class="pattern-option relative rounded-lg border p-3 text-left transition-all
					   {value === option.value
					? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
					: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
					   {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
				{disabled}
				on:click={() => !disabled && onChange(option.value)}
			>
				<!-- Selection indicator -->
				{#if value === option.value}
					<div
						class="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500"
					>
						<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				{/if}

				<!-- Option content -->
				<div class="pr-6">
					<div class="text-sm font-medium text-gray-900">
						{option.label}
					</div>
					{#if option.description}
						<div class="mt-1 text-xs text-gray-500">
							{option.description}
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Current selection display -->
	{#if value}
		{@const selectedOption = options.find((opt) => opt.value === value)}
		{#if selectedOption}
			<div class="mt-3 rounded bg-gray-50 p-2 text-sm">
				<span class="font-medium">Selected:</span>
				{selectedOption.label}
				{#if selectedOption.description}
					<span class="text-gray-600">— {selectedOption.description}</span>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.pattern-option:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>
