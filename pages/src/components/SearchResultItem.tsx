import { Card, CardHeader, CardBody, Image, Divider, Chip, Spinner } from '@nextui-org/react'
import { Prox } from '../utils/ImgProxy'
import useAxios from '../hooks/useAxios'
import { ANIME } from '../config/config'
import { EpisodeResult, FetchedEpisodes } from 'fetch/requests'

interface SearchResultItemProps {
  title: string,
  episodes: number,
  poster: string,
  status: string,
  type: string,
  year: number,
  session: string,
  score: number | null,
  fetched_eps: FetchedEpisodes,
  onSeriesUpdate: (
    episodes: EpisodeResult['episodes'],
    breadcrumbs: string,
    session: string,
    pagination: number
  ) => void
}

const SearchResultItem = ({ 
  session, title, episodes, poster, status, type, year, score, fetched_eps, onSeriesUpdate
}: SearchResultItemProps) => {
  const { isLoading, request } = useAxios()

  const FetchEpisodes = async (page: number) => {
    if (fetched_eps[session] === undefined) {
      const response = await request<EpisodeResult>({
        server: ANIME,
        endpoint: `/?method=series&session=${session}&page=${page}`,
        method: 'GET'
      })
      if (response) {
        onSeriesUpdate(response.episodes, title, session, response.total_pages)
        fetched_eps[session] = {
          total_page: response.total_pages,
          [page] : response.episodes
        }
      }
      return
    }
    onSeriesUpdate(fetched_eps[session][page], title, session, fetched_eps[session]['total_page'])
  }

  return (
    <Card isPressable disableRipple onPress={() => {
      /* clear previously selected serieses 
      const keys = Object.keys(fetched_eps);
      if (keys.length === 1 && keys[0] !== session) {
        keys.forEach(key => delete fetched_eps[key]);
      }
      */
      FetchEpisodes(1)
      }} className="m-4 w-72 cursor-pointer hover:border-primary border-1">
      <CardHeader className="pb-0 pt-2 px-4 flex-col text-left items-start h-32 overflow-hidden">
        <div className='flex flex-col gap-y-2 my-2'>
          <span className="text-default-500">{episodes} Episodes</span>
          <p className="text-tiny uppercase font-bold">{status}</p>
        </div>
        <Divider />
        <h4 className="font-bold text-large line-clamp-2">{title}</h4>
      </CardHeader>
      <CardBody className="relative overflow-hidden items-center py-4 gap-y-2 flex flex-col justify-center">
        <Image
          isBlurred
          alt="background"
          className="object-cover rounded-xl h-[350px]"
          src={Prox(poster)}
          width={240}
        />
        <div className='flex gap-x-2 mt-4'>
          <Chip variant='shadow' radius='sm' color='primary'>{type}</Chip>
          <Chip variant='shadow' radius='sm' color='secondary'>{year}</Chip>
          {score && <Chip className='text-white' variant='shadow' radius='sm' color='success'>Score {score}</Chip>}
        </div>
        {
          isLoading && <Spinner className='absolute z-10 top-36' size='lg' />
        }
      </CardBody>
    </Card>
  )
}

export default SearchResultItem
