<template>
    <div v-if="DEV">
        <UnderDev />
    </div>
    <div v-else>
        <div>
            <ClientOnly>
                <div class="container mx-auto p-4">
                    <slot />
                </div>
                <!-- Content -->
                <template #fallback>
                    <FallbackLoader />
                </template>
            </ClientOnly>
        </div>
    </div>
</template>

<script lang="ts" setup>
const { public: { DEV } } = useRuntimeConfig()
</script>
