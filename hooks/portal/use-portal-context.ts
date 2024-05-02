import { useContext } from 'react'

import { PortalContext, PortalContextType } from '@/context/portal'

export default function usePortalContext(): PortalContextType {
	return useContext(PortalContext)
}
