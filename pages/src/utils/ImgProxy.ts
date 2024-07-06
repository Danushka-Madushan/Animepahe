import { ANIME } from '../config/config'

export const Prox = (url: string) => {
    return `${ ANIME }/proxy?modify&proxyUrl=${ url }`
}
