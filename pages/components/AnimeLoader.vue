<template>
    <div class="flex justify-center mt-6 gap-2">
        <div class="join justify-center w-full">
            <input v-model="query" class="input input-bordered font-medium join-item text-center w-full max-w-sm"
                placeholder="Anime Name" />
            <button @click="RequestSearchData(query)" class="btn join-item">SEARCH</button>
        </div>
    </div>
    <div v-if="isSearchPanelActive" class="flex flex-wrap justify-center mt-6 gap-4">
        <AnimeCard v-if="!searchpending" v-for="item in (searchData as iSearchResponse).data" :poster="item.poster"
            :type="item.type" :episodes="item.episodes" :status="item.status" :title="item.title" :year="item.year"
            :score="item.score" :season="item.season" :session="item.session" @on-anime-select="(session) => RequestData(session)"/>
    </div>
    <div v-if="!isSearchPanelActive" class="flex flex-wrap justify-center mt-6 gap-4">
        <EpisodeCard @on-download="(session, ep) => setSession(session, ep)" v-if="!ped" v-for="item in (data as iResponse).episodes" :session="item.session" :img="item.snapshot" :ep="item.episode" :series="(data as iResponse).title" />
        <DownloadBox @on-close="isDownload = false" v-if="isDownload" :ep="episodename" :seriesid="seriesid" :session="session"/>
    </div>
</template>

<script lang="ts" setup>
const { public: { API } } = useRuntimeConfig()
interface iResponse {
    title: string,
    total: number,
    next: boolean,
    episodes: Array<{
        episode: string,
        session: string,
        snapshot: string
    }>
}

interface iSearchResponse {
    "data": {
        "title": string,
        "type": string,
        "episodes": number,
        "status": string,
        "season": string,
        "year": number,
        "score": number,
        "poster": string,
        "session": string
    }[]
}

const query = ref('')
const session = ref('')
const seriesid = ref('')
const episodename = ref('')
const isDownload = ref(false)

const isSearchPanelActive = ref(true)

let ped = ref(true);
let data = ref({} as iResponse);

let searchpending = ref(true)
let searchData = ref({} as iSearchResponse)

const setSession = (ep: string, epname: string) => {
    episodename.value = epname
    session.value = ep
    isDownload.value = true
}

const switchPanel = (status: boolean) => {
    isSearchPanelActive.value = status
}

const RequestSearchData = async (query: string) => {
    switchPanel(true)
    if (query.length === 0) { return }
    const { data: response } = await useFetch<iSearchResponse>(`${API}?method=search&query=${query}`)
    searchpending.value = false
    searchData.value = response.value as iSearchResponse
}

const RequestData = async (session: string) => {
    switchPanel(false)
    if (session.length === 0) { return }
    const { data: response } = await useFetch<iResponse>(`${API}?method=series&session=${session}&page=1`)
    ped.value = false
    seriesid.value = session
    data.value = response.value as iResponse
    useHead({
        title: `Anime | ${data.value.title}`
    })
}
</script>
