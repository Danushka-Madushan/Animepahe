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
			'authority': 'animepahe.si',
			'accept': 'application/json, text/javascript, */*; q=0.01',
			'accept-language': 'en-US,en;q=0.9',
			'cookie': '__ddg2_=;',
			'dnt': '1',
			'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-origin',
			'x-requested-with': 'XMLHttpRequest',
			'referer': streamUrl ? `https://animepahe.si/anime/${ streamUrl }` : 'https://animepahe.si',
			'user-agent': userAgent,
		}
	}

	private async Series() {
		const res = /<h1[^>]*><span[^>]*>(?<title>[^<]+)<\/span>/.exec(await fetch(`https://animepahe.si/anime/${this.streamUrl}`, {
			headers: AnimePahe.Headers(this.streamUrl, this.userAgent)
		}).then(async (res) => await res.text())) as RegExpExecArray
		return (res.groups as Record<string, string>)['title']
	}

	private async Extract(page: string | false) {
		return await fetch(`https://animepahe.si/api?m=release&id=${this.streamUrl}&sort=episode_asc&page=${page ? page : 1}`, {
			headers: AnimePahe.Headers(this.streamUrl, this.userAgent)
		}).then((res) => res.json<iFetchResponse>());
	}

	private decoder (QM: string, Y_: number, eZ: number) {
		const g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
		const h = g.slice(0, Y_);
		const i = g.slice(0, eZ);

		let j = QM.split("").reverse().reduce((wM, Js, Ra) => {
			if (h.indexOf(Js) !== -1) {
				return wM += h.indexOf(Js) * (Math.pow(Y_, Ra))
			}
			return 0
		}, 0);

		let k = "";
		while (j > 0) {
			k = i[j % eZ] + k;
			j = (j - (j % eZ)) / eZ
		}
		return k || 0
	}

	private decodeContent(encString: string, num1: number, encToken: string, num2: number, num3: number, num4: number | string) {
		num4 = "";
		for (let i = 0, len = encString.length; i < len; i ++) {
			let s = "";
			while (encString[i] !== encToken[num3]) {
				s += encString[i];
				i ++
			}
			for (let j = 0; j < encToken.length; j ++) {
				s = s.replace(new RegExp(encToken[j], "g"), j.toString());
			}
			num4 += String.fromCharCode(Number(this.decoder(s, num3, 10)) - num2)
		}
		const value = decodeURIComponent(encodeURI(num4))
		return value;
	}

	private DecodePaheWin(kwikText: string) {
		const bodyString = /\(("(?<encString>.+?)",(?<num1>\d+),"(?<encToken>.+?)",(?<num2>\d+),(?<num3>\d+),(?<num4>\d+).+?\))/.exec(kwikText) as RegExpExecArray
		const Tokens = bodyString.groups as {
			encString: string | false,
			encToken: string | false
			num1: string | false,
			num2: string | false,
			num3: string | false,
			num4: string | false,
		}
		if (
			Tokens.encString &&
			Tokens.encToken &&
			Tokens.num1 &&
			Tokens.num2 &&
			Tokens.num3 &&
			Tokens.num4
		) {
			const { encString, num1, encToken, num2, num3, num4 } = Tokens
			const decoded = this.decodeContent(encString, parseInt(num1), encToken, parseInt(num2), parseInt(num3), parseInt(num4))
			return decoded;
		}
		return false;
	}

	private async Kwix(pahe: string) {
		const response = await fetch(pahe).then(async (res) => await res.text())
		const res = /(?<kwik>https?:\/\/kwik.[a-z]+\/f\/.[^"]+)/.exec(response) as RegExpExecArray
		if (res) {
			return (res.groups as Record<string, string>)['kwik']
		}
		const content = this.DecodePaheWin(response);
		if (content) {
			const res = /(?<kwik>https?:\/\/kwik\.[^/\s"]+\/[^/\s"]+\/[^"\s]*)/.exec(content) as RegExpExecArray
			if (res) {
				const modifiedUrl = (res.groups as Record<string, string>)['kwik'].replace("/d/", "/f/");
				return modifiedUrl;
			}
		}
		return false;
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
			page: number,
			total_pages: number,
			episodes: Array<Record<string, string | number>>
		} = {
			title: title,
			total: total,
			page: parseInt(page || "1"),
			total_pages: Math.ceil(total / 30),
			next: false,
			episodes: []
		}

		if (total > 30 && (total - (30 * parseInt(page || "1")) > 0)) {
			response.next = true
		}

		for (const { episode, session, snapshot } of data) {
			response.episodes.push({ episode: String(episode).padStart(2, '0'), session, snapshot })
		}

		return response
	}

	public async Links(session: string) {
		return await fetch(`https://animepahe.si/play/${this.streamUrl}/${session}`, {
			headers: AnimePahe.Headers(this.streamUrl, this.userAgent)
		}).then(async (res) => {
			const raw = await res.text()
			const data: { link: string, name: string }[] = []
			let m;

			const regex = /href="(?<link>https?:\/\/pahe[.]win\/[^"]+)"[^>]+>(?<name>[^<]+)/g
			const KwixArray: Array<Promise<string | false>> = []

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
				const content = resolved[item];
				if (content) {
					data[item].link = content;
				} else {
					data[item].link = "null";
				}
			}

			return data.filter(obj => obj.link !== "null");
		});
	}

	public static async search(query: string, userAgent: string) {
		const res = await fetch(`https://animepahe.si/api?m=search&q=${ query }`, {
			headers: AnimePahe.Headers(false, userAgent)
		}).then(async (data) => {
			return await data.json<object>()
		})
		return res
	}
}
