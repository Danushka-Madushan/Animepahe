import { useState } from 'react'
import { EpisodeResult, FetchedEpisodes, FetchedEpisodesDlinks, SearchItem } from 'fetch/requests'
import { BreadcrumbItem, Breadcrumbs, Button, Chip, Link, Pagination, Spinner, useDisclosure } from '@nextui-org/react'
import SearchBar from './components/SearchBar'
import SearchResultItem from './components/SearchResultItem'
import Episode from './components/Episode'
import useAxios from './hooks/useAxios'
import { ANIME } from './config/config'
import BulkDownloadModel from './components/BulkDownloadModel'

const fetched_eps: FetchedEpisodes = {}
const fetched_eps_dlinks: FetchedEpisodesDlinks = {}

const App = () => {
  const supportsSeasonZip =
    typeof window !== 'undefined' &&
    typeof (window as { showSaveFilePicker?: unknown }).showSaveFilePicker === 'function';

  const [SearchResult, setSearchResult] = useState<SearchItem[]>([])
  const [Episodes, setEpisodes] = useState<EpisodeResult['episodes']>([])
  const [SelectedSeriesID, setSelectedSeriesID] = useState<string>('')
  const [isHomeActive, setHomeActive] = useState(true)

  const [curPagination, setPagination] = useState(0)
  const [SelctedAnime, setSelectedAnime] = useState('')

  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onOpenChange: onBulkOpenChange } = useDisclosure()

  const setBreadcrumbs = (title: string) => {
    setSelectedAnime(title);
    setHomeActive(false)
  }

  const { isLoading, request } = useAxios()

  const onSeriesUpdate = (
    episodes: EpisodeResult['episodes'],
    breadcrumbs: string,
    session: string,
    pagination: number
  ) => {
    setEpisodes(episodes)
    setBreadcrumbs(breadcrumbs)
    setSelectedSeriesID(session)
    setPagination(pagination)
  }

  const onPaginationChange = async (page: number) => {
    if (fetched_eps[SelectedSeriesID][page] === undefined) {
      const response = await request<EpisodeResult>({
        server: ANIME,
        endpoint: `/?method=series&session=${SelectedSeriesID}&page=${page}`,
        method: 'GET'
      })
      if (response) {
        setEpisodes(response.episodes)
        fetched_eps[SelectedSeriesID] = { ...fetched_eps[SelectedSeriesID], [page]: response.episodes }
      }
      return;
    }
    setEpisodes(fetched_eps[SelectedSeriesID][page])
  }

  return (
    <div>
      <div className='flex justify-center mt-2'>
        <Chip
          color='secondary'
          variant="flat"
          size='lg'
        >Animepahe CLI Released! <Link color='secondary' underline="always" isExternal showAnchorIcon href='https://github.com/Danushka-Madushan/animepahe-cli'>latest version</Link></Chip>
      </div>
      <div className='mt-4 mb-4'>
        <SearchBar setSearchResult={setSearchResult} setHomeActive={setHomeActive} />
        <div className='flex justify-center mt-4'>
          <Breadcrumbs variant='bordered'>
            <BreadcrumbItem onPress={() => setHomeActive(true)}>Home</BreadcrumbItem>
            {isHomeActive ? false : <BreadcrumbItem>{SelctedAnime}</BreadcrumbItem>}
          </Breadcrumbs>
        </div>
        {
          isHomeActive ?
            <div className='flex flex-wrap justify-center'>
              {
                SearchResult.map(({ title, poster, episodes, status, id, type, year, score, session }) => {
                  return <SearchResultItem
                    key={id}
                    title={title}
                    poster={poster}
                    episodes={episodes}
                    status={status}
                    type={type}
                    year={year}
                    score={score}
                    session={session}
                    onSeriesUpdate={onSeriesUpdate}
                    fetched_eps={fetched_eps}
                  />
                })
              }
            </div> :
            <div>
              <div className='flex justify-center mt-4'>
                <div className='flex gap-x-3 items-center'>
                  <Pagination showControls onChange={onPaginationChange} total={curPagination} initialPage={1} />
                  {
                    supportsSeasonZip && (
                      <Button
                        color="secondary"
                        variant="flat"
                        onPress={onBulkOpen}
                        isDisabled={!SelectedSeriesID || Episodes.length === 0}
                      >
                        Download Season
                      </Button>
                    )
                  }
                </div>
              </div>
              <div className='flex flex-wrap justify-center'>
                {
                  isLoading ? <div className='flex h-96 justify-center items-center'><Spinner size='lg' /></div> : Episodes.map(({ episode, session, snapshot }) => {
                    fetched_eps_dlinks[SelectedSeriesID] ??= {};
                    return <Episode linkCache={fetched_eps_dlinks} seriesname={SelctedAnime} key={session} series={SelectedSeriesID} episode={episode} session={session} snapshot={snapshot} />
                  })
                }
              </div>
              {
                supportsSeasonZip && (
                  <BulkDownloadModel
                    isOpen={isBulkOpen}
                    onOpenChange={onBulkOpenChange}
                    animeServer={ANIME}
                    seriesId={SelectedSeriesID}
                    seriesName={SelctedAnime}
                    totalPages={curPagination}
                    currentEpisodes={Episodes}
                  />
                )
              }
            </div>
        }
      </div>
    </div>
  )
}

export default App
