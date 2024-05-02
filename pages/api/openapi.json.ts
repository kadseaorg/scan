import { NextApiRequest, NextApiResponse } from 'next'
import cors from 'nextjs-cors'

import { openApiDocument } from '@/server/routers/openapi'

// Respond with our OpenAPI schema
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	// Setup CORS
	await cors(req, res)

	res.status(200).send(openApiDocument)
}

export default handler
