export const Prox = (API: string, url: string) => {
    return `${ API }proxy?modify&proxyUrl=${ url }`
}
