<template>
	<dialog :class="{ 'modal-open': true }" class="modal backdrop-blur-sm">
		<div class="modal-box p-0">
			<ul class="menu bg-base-200 w-full rounded-box p-4">
				<li class="menu-title text-center text-base">Download EP {{ ep }}</li>
				<li v-if="pending" class="flex items-center">
					<span class="loading loading-infinity loading-lg text-primary"></span>
				</li>
				<li v-else v-for="item in (response)">
					<a class="p-2 text-base flex justify-between">
						<span class="font-medium">{{ item.name }}</span>
						<a :href="item.link" target="_blank" rel="noopener noreferrer">
							<button class="btn w-fit btn-primary text-white">Download</button>
						</a>
					</a>
				</li>
			</ul>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button @click="setClose">x</button>
		</form>
	</dialog>
</template>

<script lang="ts" setup>
const { public: { API } } = useRuntimeConfig()
const { session, seriesid, ep } = defineProps(['session', 'seriesid', 'ep'])
type iResponse = Array<{ "link": string, "name": string }>
const emit = defineEmits(['onClose'])

const response = ref([] as iResponse)
const pending = ref(true)

onMounted( async () => {
	const { data } = await useFetch<iResponse>(`${ API }?method=episode&session=${ seriesid }&ep=${ session }`)
	response.value= data.value as iResponse
	pending.value = false
})


const setClose = () => {
	pending.value = !pending
	emit('onClose', false)
}

</script>
