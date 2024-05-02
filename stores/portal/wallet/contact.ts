import { produce } from 'immer'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEY } from '@/constants'

export type IWalletContractType = {
	name: string
	address: string
}

export type PortalWalletContactStore = {
	walletContacts: Record<string, IWalletContractType[]>
	setWalletContact: (
		walletAddress: string,
		walletContact: IWalletContractType,
	) => void
	editWalletContact: (
		walletAddress: string,
		oldWalletContact: IWalletContractType,
		newWalletContact: IWalletContractType,
	) => void
	deleteWalletContact: (walletAddress: string, name: string) => void
}

export const usePortalWalletContactStore = create<PortalWalletContactStore>()(
	persist(
		(set, get) => ({
			walletContacts: {},
			setWalletContact: (walletAddress, walletContact) =>
				set({
					walletContacts: produce(get().walletContacts, (draft) => {
						if (draft?.[walletAddress]) {
							draft?.[walletAddress]?.every(
								(item) => item.name !== walletContact.name,
							) && draft[walletAddress].push(walletContact)
						} else {
							draft[walletAddress] = [walletContact]
						}
					}),
				}),
			editWalletContact: (walletAddress, oldWalletContact, newWalletContact) =>
				set({
					walletContacts: produce(get().walletContacts, (draft) => {
						draft[walletAddress] = draft[walletAddress]?.map((item) =>
							item.name === oldWalletContact.name ? newWalletContact : item,
						)
					}),
				}),
			deleteWalletContact: (walletAddress, name) =>
				set({
					walletContacts: produce(get().walletContacts, (draft) => {
						draft[walletAddress] = draft[walletAddress]?.filter(
							(item) => item.name !== name,
						)
					}),
				}),
		}),
		{
			name: STORAGE_KEY.WALLET.CONTACTS,
		},
	),
)
