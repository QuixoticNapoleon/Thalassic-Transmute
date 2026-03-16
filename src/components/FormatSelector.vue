<script setup>
import { FORMATS } from '../composables/useConverter.js'

const model = defineModel({ required: true })
</script>

<template>
	<div class="flex flex-col gap-2">
		<label class="text-teal-400 text-sm font-medium uppercase tracking-wider">Output format</label>

		<div class="flex flex-wrap gap-2">
			<template v-for="(formats, group) in FORMATS" :key="group">
				<span class="text-teal-600 text-xs self-center uppercase mr-1">{{ group }}</span>
				<button
					v-for="fmt in formats"
					:key="fmt"
					type="button"
					class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border"
					:class="model === fmt
						? 'bg-teal-500 border-teal-500 text-white'
						: 'bg-transparent border-teal-700 text-teal-300 hover:border-teal-500 hover:text-teal-100'"
					@click="model = fmt"
				>
					{{ fmt.toUpperCase() }}
				</button>
			</template>
		</div>
	</div>
</template>
