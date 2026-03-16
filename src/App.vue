<script setup>
import { ref } from 'vue'
import TabBar from './components/TabBar.vue'
import MediaConverter from './components/MediaConverter.vue'
import DocConverter from './components/DocConverter.vue'

const activeTab = ref('media')
</script>

<template>
	<div class="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">
		<div class="w-full max-w-xl flex flex-col gap-8">

			<!-- Header -->
			<div>
				<h1 class="text-3xl font-bold text-teal-400 tracking-tight">Thalassic Convert</h1>
				<p class="text-gray-400 text-sm mt-1">Private browser-based media converter. Your files never leave your device!</p>
			</div>

			<!-- Tab bar -->
			<TabBar v-model="activeTab" />

			<!-- Main card -->
			<div class="bg-gray-900 rounded-2xl p-6 flex flex-col gap-6 border border-gray-800">
				<MediaConverter v-if="activeTab === 'media'" />
				<DocConverter v-else-if="activeTab === 'documents'" />
			</div>

			<!-- Footer -->
			<p class="text-center text-xs text-gray-700">
				Runs entirely in your browser &middot; No uploads &middot; No servers
			</p>

		</div>
	</div>
</template>
