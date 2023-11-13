<template>
    <dialog :class="{ 'modal-open': true }" class="modal">
        <div class="modal-box">
            <div class="flex flex-col items-center">
                <span class="font-thin text-8xl lg:text-9xl">{{ error.statusCode }}</span>
                <span class="font-thin text-2xl text-center">Seems like you're lost</span>
            </div>
            <div class="modal-action justify-center">
                <form method="dialog">
                    <button @click="onErrorClear" class="btn btn-primary">Go Home</button>
                </form>
            </div>
        </div>
    </dialog>
</template>

<script setup>
defineProps(['error'])

const onErrorClear = () => clearError({ redirect: '/' })
</script>

<style scoped>
.wierd-corners {
    border-radius: 0.75rem 0 0.75rem 0;
}
</style>
