import { useEffect } from 'react'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useLogin } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/router'
import parseUrl from 'parse-url'

import { Button } from '@/components/ui/button'
import useTheme from '@/hooks/common/useTheme'
import { IsKadsea } from '@/constants'

const Login = (props) => {
	const { palette } = useTheme()
	const router = useRouter()
	const redirectPath = router?.query?.redirect ?? '/'
	const getURL = () => {
		let redirectInUrl = redirectPath
		if (redirectPath === '/' && window.location.href.includes('redirect')) {
			//FIXME: give one more try
			redirectInUrl = parseUrl(window.location.href).query.redirect
		}
		// izumi test
		let url =
			process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
			process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
			'http://localhost:3000'
		// Make sure to include `https://` when not localhost.
		url = url.includes('http') ? url : `https://${url}`
		// Make sure to including trailing `/`.
		url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
		return url + (redirectInUrl === '/' ? '' : redirectInUrl)
	}

	const { login } = useLogin({
		onComplete: (user, isNewUser, wasAlreadyAuthenticated) => {
			console.log(user, isNewUser, wasAlreadyAuthenticated)
			const url = getURL()
			setTimeout(() => {
				router.replace(url)
			}, 500)
		},
		onError: (error) => {
			console.log(error)
			// Any logic you'd like to execute after a user exits the login flow or there is an error
		},
	})
	const { ready, authenticated, user, logout } = usePrivy()
	const { wallets } = useWallets()
	const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi()

	useEffect(() => {
		if (!ready || authenticated) {
			return
		}

		login()
	}, [ready, authenticated])

	const handleLogin = () => {
		if (!ready) {
			return
		}
		login()
	}

	if (ready && authenticated) {
		const url = getURL()
		router.replace(url)
		return
	}
	console.log('authenticated: ', authenticated)
	return (
		<div className="px-2 py-6 drop-shadow-sm bg-white rounded-xl max-w-[420px] m-auto absolute left-0 right-0 top-0 bottom-0 h-fit">
			<div className="text-center text-2xl font-bold text-gray-700 mt-7 mx-8">
				Welcome to {IsKadsea ? 'Kadsea' : 'L2'}scan
			</div>
			{!authenticated && (
				<div className="m-auto flex-center mt-7">
					<Button
						className="bg-primary text-accent-foreground hover:bg-primary/90 px-4 py-2 h-8  rounded-full "
						onClick={handleLogin}
					>
						Sign In
					</Button>
				</div>
			)}
			<div
				id="render-privy"
				className="z-[2] mx-auto min-w-[360px] max-w-[360px] pt-8 md:mx-0 md:pt-0"
			/>
			{/*
      <div className="text-gray-600 mt-7 mb-3 mx-8 flex items-center justify-center">
        {!authenticated && (
          <Button className="font-bold" onClick={handleLogin}>
            Sign In
          </Button>
        )}
        {authenticated && <Button onClick={() => logout()}>Sign out</Button>}
      </div>*/}

			{/* <div className="px-7 text-gray-700">
        <h2>Active Wallet {activeWallet?.address}</h2>
        <ul>
          {wallets.map(wallet => (
            <li key={wallet.address}>
              <button onClick={() => setActiveWallet(wallet)}>Activate {wallet.address}</button>
            </li>
          ))}
        </ul>
        <div>
          <button onClick={() => logout()}>logout</button>
        </div> */}

			{/* <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: {
                borderRadius: '5px'
                // borderColor: 'rgba(0,0,0,0)'
              }
            },
            variables: {
              default: {
                colors: {
                  brand: palette.primary.main,
                  brandAccent: palette.primary.light,
                  // inputBorder: '#f3ccb6',
                  inputBorderHover: palette.primary.main,
                  inputBorderFocus: palette.primary.main
                }
              }
            }
          }}
          providers={['google', 'github']}
          socialLayout="horizontal"
          magicLink
          redirectTo={getURL()}
        /> */}
		</div>
	)
}

export default Login
