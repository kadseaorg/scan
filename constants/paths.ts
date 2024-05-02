function path(root: string, sublink: string) {
	return `${root}${sublink}`
}

const ROOTS_BRIDGE = '/bridge'

export const PATH_BRIDGE = {
	root: ROOTS_BRIDGE,
	official: '/',
	external: '/external',
}
