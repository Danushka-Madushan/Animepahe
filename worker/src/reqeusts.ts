interface iFetchResponse {
	"total": number,
	"per_page": number,
	"current_page": number,
	"last_page": number,
	"next_page_url": null | string,
	"prev_page_url": null | string,
	"from": number,
	"to": number,
	"data": Array<{
		"id": number,
		"anime_id": number,
		"episode": number,
		"episode2": number,
		"edition": string,
		"title": string,
		"snapshot": string,
		"disc": string,
		"audio": "jpn" | "eng",
		"duration": string,
		"session": string,
		"filler": number,
		"created_at": string
	}>
}

export class AnimePahe {
	constructor(
		private readonly streamUrl: string,
		private readonly userAgent: string
	) { }

	private static Headers(streamUrl: string | false, userAgent: string) {
		return {
			'accept': 'application/json, text/javascript, */*; q=0.01',
			'cookie': 'cf_clearance=Origin;',
			'referer': streamUrl ? `https://animepahe.ru/anime/${ streamUrl }` : 'https://animepahe.ru',
			'user-agent': userAgent,
		}
	}

	private async Series() {
		const res = /<h1><span>(?<title>[^<]+)<\/span>/.exec(await fetch(`https://animepahe.ru/anime/${this.streamUrl}`, {
			headers: AnimePahe.Headers(this.streamUrl, this.userAgent)
		}).then(async (res) => await res.text())) as RegExpExecArray
		return (res.groups as Record<string, string>)['title']
	}

	private async Extract(page: string | false) {
		return await fetch(`https://animepahe.ru/api?m=release&id=${this.streamUrl}&sort=episode_asc&page=${page ? page : 1}`, {
			headers: AnimePahe.Headers(this.streamUrl, this.userAgent)
		}).then((res) => res.json<iFetchResponse>());
	}

	private async Kwix(pahe: string) {
		const res = /href="(?<kwik>https:\/\/kwik.cx\/[^"]+)"/.exec(
			await fetch(pahe).then(async (res) => await res.text())
		) as RegExpExecArray
		return (res.groups as Record<string, string>)['kwik']
	}

	public async Episodes(page: string | false) {
		const [title, { data, total }] = await Promise.all([
			this.Series(),
			this.Extract(page)
		])

		const response: {
			title: string,
			total: number,
			next: boolean,
			episodes: Array<Record<string, string | number>>
		} = {
			title: title,
			total: total,
			next: false,
			episodes: []
		}

		if (total > 30 && data.length > (total - 30)) {
			response.next = true
		}

		for (const { episode, session, snapshot } of data) {
			response.episodes.push({ episode: String(episode).padStart(2, '0'), session, snapshot })
		}

		return response
	}

	public async Links(session: string) {
		return await fetch(`https://animepahe.ru/play/${this.streamUrl}/${session}`, {
			headers: AnimePahe.Headers(this.streamUrl, this.userAgent)
		}).then(async (res) => {
			const raw = await res.text()
			const data: { link: string, name: string }[] = []
			let m;

			const regex = /href="(?<link>https?:\/\/pahe[.]win\/[^"]+)"[^>]+>(?<name>[^<]+)/g
			const KwixArray: Array<Promise<string>> = []

			while ((m = regex.exec(raw.replace(/\n/g, '')) as RegExpExecArray) !== null) {
				if (m.index === regex.lastIndex) {
					regex.lastIndex++;
				}

				KwixArray.push(this.Kwix((m.groups as Record<string, string>)['link']))

				data.push({
					link: '',
					name: (m.groups as Record<string, string>)['name'].replace(/&middot;./g, '')
				})
			}

			const resolved = await Promise.all(KwixArray)

			for (const item in resolved) {
				data[item].link = resolved[item]
			}
			return data
		});
	}

	public static async search(query: string, userAgent: string) {
		const res = await fetch(`https://animepahe.ru/api?m=search&q=${ query }`, {
			headers: AnimePahe.Headers(false, userAgent)
		}).then(async (data) => {
			return await data.json<object>()
		})
		return res
	}
}
