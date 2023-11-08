import { AnimePahe } from './reqeusts';

export interface Env {

}

const CORS = {
	"Access-Control-Allow-Origin": 'http://localhost:* https://anime.disnakamadushan66.workers.dev',
	"Access-Control-Allow-Methods": "GET,POST,HEAD,OPTIONS",
	"Access-Control-Max-Age": "86400",
}

const WorkerResponse = (body: object | string, type: "application/json" | "text/html;charset=UTF-8") => {
	return new Response(typeof body === 'object' ? JSON.stringify(body) : body, {
		headers: {
			...CORS,
			"Content-Type": type
		}
	})
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { searchParams } = new URL(request.url)

		const method = searchParams.get('method')
		const session = searchParams.get('session')

		if (!method || !session) {
			return WorkerResponse({
				session: 'ANIME ID',
				method: 'METHOD - (series | episode)',
				page: 'PAGE NO (Required with series method',
				ep: 'EPIsode ID',
				example: {
					"FETCH-EPISODE-OF-A-SERIES": "https://anime.disnakamadushan66.workers.dev/?method=series&session=5fe211d4-3cef-c32a-ab31-ec777f07fc5f&page=1",
					"REQUEST-LINKS-OF-A-EPISODE": "https://anime.disnakamadushan66.workers.dev/?method=episode&session=5fe211d4-3cef-c32a-ab31-ec777f07fc5f&ep=52f935732970bc1e1482d7e726b34fba1ffdbe040a55f9c9c03cfa0a20dff6ea"
				}
			}, 'application/json')
		}

		const Pahe = new AnimePahe(session)

		try {
			switch (method) {
				case 'series': {
					let page = searchParams.get('page') as string | false
					if (!page) { page = false }

					const response = await Pahe.Episodes(page)
					return WorkerResponse(response, 'application/json')
				}

				case 'episode': {
					let ep = searchParams.get('ep') as string | false
					if (!ep) {
						return WorkerResponse({ status: false }, 'application/json')
					}

					const epdata = await Pahe.Links(ep)
					return WorkerResponse(epdata, 'application/json')
				}

				default: {
					return WorkerResponse({ status: false }, 'application/json')
				}
			}
		} catch (error) {
			return WorkerResponse({ status: false }, 'application/json')
		}
	},
};
