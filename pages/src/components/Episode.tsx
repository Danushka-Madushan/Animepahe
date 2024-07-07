import { Card, CardFooter, Image, Button, Spinner, useDisclosure } from "@nextui-org/react";
import { Prox } from '../utils/ImgProxy';
import useAxios from '../hooks/useAxios';
import { ANIME } from '../config/config';
import DownloadModel from './DownloadModel';
import { DownloadLinks, FetchedEpisodesDlinks } from 'fetch/requests';
import { useState } from 'react';

interface EpisodeProps {
  session: string,
  episode: string,
  snapshot: string,
  series: string,
  seriesname: string,
  linkCache: FetchedEpisodesDlinks
}

const Episode = ({ episode, session, snapshot, series, seriesname, linkCache }: EpisodeProps) => {
  const { isLoading, request } = useAxios()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const [dlinks, setDlinks] = useState<DownloadLinks>([])

  const RequestLinks = async () => {
    if (linkCache[series][session] === undefined) {
      const response = await request<DownloadLinks>({
        server: ANIME,
        endpoint: `/?method=episode&session=${ series }&ep=${ session }`,
        method: 'GET'
      })
      if (response) {
        setDlinks(response)
        linkCache[series] = {...linkCache[series], [session]: response}
        onOpen()
      }
      return
    }
    setDlinks(linkCache[series][session]);
    onOpen();
  }

  return (
    <Card
      isFooterBlurred
      radius="lg"
      className="m-3 hover:border-primary border-1"
    >
      <Image
        alt="episode"
        className="object-cover"
        src={Prox(snapshot)}
        width={350}
      />
      <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <p className="text-sm text-white/80 line-clamp-1">{seriesname} {episode}</p>
        <Button onPress={RequestLinks} className="text-base text-white bg-primary w-24" variant="flat" color="default" radius="lg" size="md">
          { isLoading ? <Spinner color='default' size='sm'/> : 'EP ' + episode }
        </Button>
      </CardFooter>
      <DownloadModel epName={`${seriesname} : EP ${episode}`} isOpen={isOpen} links={dlinks} onOpenChange={onOpenChange}/>
    </Card>
  );
}

export default Episode
