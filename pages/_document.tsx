import Document, { Head, Html, Main, NextScript } from 'next/document'

import { IsKadsea } from '@/constants'

class MyDocument extends Document {
	render() {
		return (
			<Html>
				<Head>
					{/* Global Site Tag (gtag.js) - Google Analytics */}
					<script
						async
						src={`https://www.googletagmanager.com/gtag/js?id=G-S4DQLTTL5Z`}
					/>
					<script
						dangerouslySetInnerHTML={{
							__html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'G-S4DQLTTL5Z');
            `,
						}}
					/>
					<link
						rel="stylesheet"
						href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
					/>
					{IsKadsea && (
						<script
							defer
							data-domain="scan.kadseachain.io"
							src="https://plausible.io/js/script.js"
						></script>
					)}
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		)
	}
}

export default MyDocument
