import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { Theme } from '@/theme/themes'

type Config = {
	theme: Theme['name']
	radius: number
}

const configAtom = atomWithStorage<Config>('config', {
	theme: 'linea',
	radius: 0.5,
})

export function useThemeConfig() {
	return useAtom(configAtom)
}
