import { create } from 'zustand'

import { IPortalWalletToken } from '@/stores/portal/wallet'

export enum EWalletSendStep {
	CHOOSE_TOKEN = 'CHOOSE_TOKEN',
	CHOOSE_CONTACT = 'CHOOSE_CONTACT',
	SEND = 'SEND',
}

export type PortalWalletSendStore = {
	sendPrePage?: 'FROM_CHOOSE_CONTACT' | 'FROM_CONTACT_TAB'
	sendStep: EWalletSendStep
	sendToken?: IPortalWalletToken
	sendTo?: string
	setSendPrePage: (sendPrePage: PortalWalletSendStore['sendPrePage']) => void
	setSendStep: (sendStep?: PortalWalletSendStore['sendStep']) => void
	setSendToken: (
		sendToken: PortalWalletSendStore['sendToken'],
		toContact?: boolean,
	) => void
	setSendTo: (sendTo: PortalWalletSendStore['sendTo']) => void
}

export const usePortalWalletSendStore = create<PortalWalletSendStore>()(
	(set, get) => ({
		sendStep: EWalletSendStep.CHOOSE_TOKEN,
		setSendPrePage: (sendPrePage) => set({ sendPrePage }),
		setSendStep: (sendStep) => {
			switch (sendStep) {
				case EWalletSendStep.CHOOSE_CONTACT:
					set({ sendStep, sendTo: undefined })
					return

				case EWalletSendStep.CHOOSE_TOKEN:
					set({ sendStep, sendToken: undefined })
					return

				default:
					set({ sendStep })
					return
			}
		},
		setSendToken: (sendToken, toContact) =>
			set({
				sendStep: !!toContact ? EWalletSendStep.CHOOSE_CONTACT : get().sendStep,
				sendToken,
			}),
		setSendTo: (sendTo) => set({ sendStep: EWalletSendStep.SEND, sendTo }),
	}),
)
