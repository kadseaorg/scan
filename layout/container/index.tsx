import { PropsWithChildren } from 'react'
import Scrollbars from 'react-custom-scrollbars'

import { ConfigProvider } from 'antd'
import classNames from 'classnames'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { MainNav } from '@/components/main-nav'
import { BROWSER_TITLE, CURRENT_CHAIN_ITEM } from '@/constants'
import ROUTES from '@/constants/routes'
import useAntdTheme from '@/hooks/common/useAntdTheme'
import useTheme from '@/hooks/common/useTheme'
import Footer from '@/layout/footer'
import Header from '@/layout/header'
import { cn } from '@/lib/utils'

const Container: React.FC<
	PropsWithChildren<{ contentClassName?: string; showFooter?: boolean }>
> = ({ contentClassName, showFooter = false, children }) => {
	const router = useRouter()
	const { themeMode } = useTheme()
	const antdTheme = useAntdTheme()

	const chain = CURRENT_CHAIN_ITEM.chainType.includes('scroll')
		? 'scroll'
		: CURRENT_CHAIN_ITEM.chainType

	return (
		<ConfigProvider prefixCls="l2scan" theme={antdTheme[themeMode]}>
			<Head>
				<link
					rel="icon"
					type="image/svg"
					sizes="32x32"
					href={CURRENT_CHAIN_ITEM.logo}
				/>
				<title>{BROWSER_TITLE}</title>
				<meta
					name="viewport"
					content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0"
				/>
			</Head>
			<section className="flex bg-background">
				<div className="bg-card">
					<MainNav />
				</div>
				<section className="flex-1 sm:w-full">
					<Header />
					<main
						className={classNames(
							'w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-56px-36px)]',
							router.pathname !== ROUTES.HOME && 'sm:h-[calc(100vh-56px-42px)]',
						)}
					>
						<Scrollbars universal={true} autoHide>
							<section className={cn('p-6 lmd:px-[15px]', contentClassName)}>
								{children}
								{showFooter && <Footer />}
							</section>
						</Scrollbars>
					</main>
				</section>
			</section>
		</ConfigProvider>
	)
}

export default Container
