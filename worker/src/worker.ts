import { AnimePahe } from './reqeusts';
import { Proxy } from './proxy';
import { Env, WorkerResponse } from './config';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const userAgent = request.headers.get('user-agent')
		
		const { searchParams, pathname } = new URL(request.url)

		const method = searchParams.get('method')
		const session = searchParams.get('session')

		switch (pathname) {
			case '/proxy': {
				return Proxy(request, env, ctx);
			}
		}

		if (!userAgent) {
			return WorkerResponse({ userAgent: false }, 'application/json')
		}

		if (!method) {
			return WorkerResponse({
				session: 'ANIME ID',
				method: 'METHOD - (series | episode)',
				page: 'PAGE NO (Required with series method',
				ep: 'EPIsode ID',
				example: {
					"SEARCH-ANIME": 'https://anime.apex-cloud.workers.dev/?method=search&query=Words',
					"FETCH-EPISODE-OF-A-SERIES": "https://anime.apex-cloud.workers.dev/?method=series&session=5fe211d4-3cef-c32a-ab31-ec777f07fc5f&page=1",
					"REQUEST-LINKS-OF-A-EPISODE": "https://anime.apex-cloud.workers.dev/?method=episode&session=5fe211d4-3cef-c32a-ab31-ec777f07fc5f&ep=52f935732970bc1e1482d7e726b34fba1ffdbe040a55f9c9c03cfa0a20dff6ea"
				}
			}, 'application/json')
		}

		
		try {
			switch (method) {
				case 'series': {
					let page = searchParams.get('page') as string | false
					if (!page) { page = false }
					if (!session) {
						return WorkerResponse({ status: false }, 'application/json')
					}

					const Pahe = new AnimePahe(session, userAgent)
					const response = await Pahe.Episodes(page)
					return WorkerResponse(response, 'application/json')
				}

				case 'episode': {
					let ep = searchParams.get('ep') as string | false
					if (!ep || !session) {
						return WorkerResponse({ status: false }, 'application/json')
					}
					
					const Pahe = new AnimePahe(session, userAgent)
					const epdata = await Pahe.Links(ep)
					return WorkerResponse(epdata, 'application/json')
				}

				case 'search': {
					let query = searchParams.get('query') as string | false
					if (!query) {
						return WorkerResponse({ status: false }, 'application/json')
					}
					const result = await AnimePahe.search(query, userAgent)
					return WorkerResponse(result, 'application/json')
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
