import { deLocalizeUrl } from '$lib/paraglide/runtime'

export const reroute = (request: Request): string => deLocalizeUrl(request.url).pathname
