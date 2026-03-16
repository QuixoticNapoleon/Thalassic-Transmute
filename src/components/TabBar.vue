<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

const model = defineModel({ required: true })

const tabs = [
	{ id: 'media', label: 'Media' },
	{ id: 'documents', label: 'Documents' },
]

const buttonRefs = ref([])
const containerRef = ref(null)
const sliderLeft = ref(0)
const sliderWidth = ref(0)
const ready = ref(false)

function updateSlider() {
	const activeIndex = tabs.findIndex(t => t.id === model.value)
	const btn = buttonRefs.value[activeIndex]
	if (!btn || !containerRef.value) return

	const containerRect = containerRef.value.getBoundingClientRect()
	const btnRect = btn.getBoundingClientRect()

	sliderLeft.value = btnRect.left - containerRect.left
	sliderWidth.value = btnRect.width
	ready.value = true
}

watch(model, () => nextTick(updateSlider))
onMounted(() => nextTick(updateSlider))
</script>

<template>
	<div
		ref="containerRef"
		class="relative flex w-fit p-1 bg-gray-900 rounded-xl border border-gray-800"
	>
		<!-- Sliding background pill -->
		<div
			class="absolute rounded-lg bg-teal-600"
			:class="ready ? 'transition-all duration-300 ease-in-out' : ''"
			:style="{
				top: '4px',
				bottom: '4px',
				left: `${sliderLeft}px`,
				width: `${sliderWidth}px`,
			}"
		/>

		<!-- Buttons -->
		<button
			v-for="(tab, i) in tabs"
			:key="tab.id"
			:ref="el => { if (el) buttonRefs[i] = el }"
			type="button"
			class="relative z-10 px-5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 select-none"
			:class="model === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'"
			@click="model = tab.id"
		>
			{{ tab.label }}
		</button>
	</div>
</template>
