<script lang="ts">
	import type { CsvRow } from './types';

	interface Props {
		data: CsvRow[];
		maxRows?: number;
	}

	let { data, maxRows = 10 }: Props = $props();

	let displayData = $derived(data.slice(0, maxRows));
	let headers = $derived(data.length > 0 ? Object.keys(data[0]) : []);
	let hasMoreRows = $derived(data.length > maxRows);
</script>

{#if data.length > 0}
	<div class="mt-6">
		<h3 class="mb-4 text-lg font-medium text-gray-900">CSV Preview</h3>

		<div class="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-300">
					<thead class="bg-gray-50">
						<tr>
							{#each headers as header (header)}
								<th
									class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
								>
									{header}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each displayData as row, index (index)}
							<tr class={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
								{#each headers as header (header)}
									<td class="max-w-xs truncate px-4 py-3 text-sm text-gray-900">
										{row[header] || ''}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="mt-3 flex items-center justify-between text-sm text-gray-600">
			<p>
				Showing {displayData.length} of {data.length} rows
				{#if headers.length > 0}
					• {headers.length} columns
				{/if}
			</p>

			{#if hasMoreRows}
				<p class="text-blue-600">
					+{data.length - maxRows} more rows
				</p>
			{/if}
		</div>
	</div>
{/if}
