import {
	IMessage,
	NotificationBell,
	NovuProvider,
	PopoverNotificationCenter,
} from '@novu/notification-center'
import { usePrivy } from '@privy-io/react-auth'
import { useUser } from '@supabase/auth-helpers-react'

import useTheme from '@/hooks/common/useTheme'

export const Notification = () => {
	// const user = useUser()
	const { ready, authenticated, user } = usePrivy()

	const { isLight } = useTheme()
	const colorScheme = isLight ? 'light' : 'dark'

	function onNotificationClick(message: IMessage) {
		if (message?.payload?.explorer_url) {
			window.location.href = message?.payload?.explorer_url
		}
	}

	return (
		<NovuProvider
			subscriberId={user?.id}
			applicationIdentifier={'DOk1B77HRnjO'}
		>
			<PopoverNotificationCenter
				colorScheme={colorScheme}
				onNotificationClick={onNotificationClick}
			>
				{({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
			</PopoverNotificationCenter>
		</NovuProvider>
	)
}
