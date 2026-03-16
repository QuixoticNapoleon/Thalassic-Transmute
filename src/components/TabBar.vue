<script setup>
const model = defineModel({ required: true })

const tabs = [
	{ id: 'media', label: 'Media' },
	{ id: 'documents', label: 'Documents' },
]
</script>

<template>
	<div class="flex gap-1 p-1 bg-gray-900 rounded-xl w-fit border border-gray-800">
		<button
			v-for="tab in tabs"
			:key="tab.id"
			type="button"
			class="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
			:class="model === tab.id ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'"
			@click="model = tab.id"
		>
			{{ tab.label }}
		</button>
	</div>
</template>
