import { Input } from '@nextui-org/react'
import { Command, LoaderCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import useAxios from '../hooks/useAxios'
import { ANIME } from '../config/config'
import { SearchItem, SearchResult } from 'fetch/requests'

interface SearchBarProps {
  setSearchResult: Dispatch<SetStateAction<SearchItem[]>>,
  setHomeActive: Dispatch<SetStateAction<boolean>>
}

const SearchBar = ({ setSearchResult, setHomeActive }: SearchBarProps) => {
  const { isLoading, request } = useAxios()
  const [QueryString, setQueryString] = useState('')

  const FetchSearchResult = async (key: string) => {
    if (key !== 'Enter' || QueryString.length === 0) { return; }

    const response = await request<SearchResult>({
      server: ANIME,
      endpoint: `/?method=search&query=${QueryString}`,
      method: 'GET'
    })
    if (response) {
      setSearchResult(response.data)
      setHomeActive(true)
    }
  }

  return (
    <div className='flex w-full justify-center'>
      <Input
        onKeyDown={({ key }) => FetchSearchResult(key)}
        size='lg'
        fullWidth
        onChange={({ target: { value } }) => setQueryString(value)}
        value={QueryString}
        className='w-full max-w-sm'
        classNames={{
          input: [
            "text-center font-medium text-gray-600",
          ]
        }}
        spellCheck={false}
        type="text"
        color='primary'
        variant='bordered'
        placeholder="Search Anime"
        endContent={
          isLoading ? <LoaderCircle className='animate-spin' /> : <Command className='text-default' />
        }
      />
    </div>
  )
}

export default SearchBar
