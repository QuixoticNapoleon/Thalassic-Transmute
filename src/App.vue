<script setup>
import { ref } from 'vue'
import TabBar from './components/TabBar.vue'
import MediaConverter from './components/MediaConverter.vue'
import DocConverter from './components/DocConverter.vue'

const activeTab = ref('media')
</script>

<template>
	<div
		class="min-h-screen text-white flex flex-col items-center justify-center px-4 py-12"
		style="background: linear-gradient(160deg, #040F11 0%, #041416 28%, #032022 58%, #003636 100%);"
	>
		<div class="w-full max-w-xl flex flex-col gap-8">

			<!-- Header -->
			<div>
				<h1
					class="text-3xl font-bold text-teal-300 tracking-tight"
					style="text-shadow: 0 0 6px rgba(45, 212, 191, 0.38), 0 0 14px rgba(34, 211, 238, 0.18);"
				>
					Thalassic Transmute
				</h1>
				<p class="text-gray-400 text-sm mt-1">Private browser-based media converter. Your files never leave your device!</p>
			</div>

			<!-- Tab bar -->
			<TabBar v-model="activeTab" />

			<!-- Main card -->
			<div class="bg-[#0B2228] rounded-2xl p-6 flex flex-col gap-6 border border-[#1D3A42]">
				<MediaConverter v-if="activeTab === 'media'" />
				<DocConverter v-else-if="activeTab === 'documents'" />
			</div>

			<!-- Footer -->
			<p class="text-center text-xs text-[#969FAD]">
				Runs entirely in your browser &middot; No uploads &middot; No servers
			</p>

		</div>
	</div>
</template>
