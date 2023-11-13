<template>
    <div class="card w-96 h-[205px] bg-base-100 shadow-xl image-full">
        <figure>
            <NuxtImg format="png"
            :placeholder="NxtImg('/pahe.png', { h: 205, f: 'png', blur: 10, q: 50 })"
                :src="Prox(API, img)"
                alt="snapshot" />
        </figure>
        <div class="card-body justify-between">
            <h2 class="card-title">EP {{ ep }}</h2>
            <p>{{ series }}</p>
            <div class="card-actions justify-end">
                <button @click="$emit('onDownload', session, ep)" type="submit" class="btn btn-primary text-white">Download</button>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { Prox } from '~/composables/ImgProxy';
const { public: { API } } = useRuntimeConfig()
const { img, ep, series, session } = defineProps(['img', 'ep', 'series', 'session'])
const NxtImg = useImage()
const emit = defineEmits(['onDownload'])
</script>
