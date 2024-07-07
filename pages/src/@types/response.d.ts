declare module 'fetch/requests' {
    interface SearchItem {
        "id": number,
        "title": string,
        "type": string,
        "episodes": number,
        "status": string,
        "season": string,
        "year": number,
        "score": null | number,
        "poster": string,
        "session": string
    }

    interface SearchResult {
        "total": number,
        "per_page": number,
        "current_page": number,
        "last_page": number,
        "from": number,
        "to": number,
        "data": SearchItem[]
    }

    interface EpisodeResult {
        "title": string,
        "total": number,
        "page": number,
        "total_pages": number,
        "next": boolean,
        "episodes": {
            "episode": string,
            "session": string,
            "snapshot": string
        }[]
    }

    type DownloadLinks = {
        "link": string,
        "name": string
    }[]

    interface DirectLink {
        "status": boolean,
        "content": {
            "url": string
        }
    }

    interface FetchedEpisodes {
        [key: string]: {
            total_page: number,
            [key: number]: EpisodeResult['episodes']
        }
    }

    interface FetchedEpisodesDlinks {
        [key: string]: {
            [key: string]: DownloadLinks
        }
    }
}
