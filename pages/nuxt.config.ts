// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	ssr: true,
	devtools: { enabled: false },
	modules: ['@nuxtjs/tailwindcss', "@nuxt/image"],
	app: {
		head: {
			title: 'Animepahe Downloader',
		}
	},
	runtimeConfig: {
		public: {
			DEV: false,
			API: 'https://anime.disnakamadushan66.workers.dev/',
		}
	},
	image: {
		dir: 'assets'
	},
	nitro: {
		prerender: {
			routes: [
				'/_ipx/h_205&f_png&blur_10&q_50/pahe.png',
				'/_ipx/h_384&f_png&blur_10&q_50/pahe.png'
			]
		}
	}
})
