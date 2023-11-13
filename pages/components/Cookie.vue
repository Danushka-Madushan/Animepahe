<template>
	<dialog :class="{ 'modal-open': !isCookieAccepted }" class="modal modal-bottom sm:modal-middle">
		<div class="card w-96 bg-neutral text-neutral-content">
			<div class="card-body items-center text-center">
				<h2 class="card-title">Cookies!</h2>
				<p>We are using cookies for no reason.</p>
				<div class="card-actions justify-end">
					<button @click="toggleModal" class="btn btn-primary">Accept</button>
				</div>
			</div>
		</div>
	</dialog>
</template>
<script lang="ts" setup>
const isCookieAccepted = useCookie('cookieaccept', {
    default: () => false,
    expires: new Date(Date.now() + 600 * 600 * 600)
})

function toggleModal(): void {
	isCookieAccepted.value = !isCookieAccepted.value;
}
</script>
