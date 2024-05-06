import { generateOpenApiDocument } from 'trpc-openapi'

import { appRouter } from './_app'

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
	title: 'L2Scan OpenAPI',
	version: '0.0.1',
	baseUrl:
		process.env.NODE_ENV === 'production'
			? 'https://scan.kadchain.cc/api'
			: 'http://localhost:3000/api',
})
