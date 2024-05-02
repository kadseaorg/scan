import { z } from 'zod'

import prisma from '../../prisma'
import sharePrisma from '../../share_prisma'
import { internalProcedure, router } from '../../trpc'

export const labelRouter = router({
	getLabelCount: internalProcedure.query(async (input) => {
		const tags = await sharePrisma.public_tags.findMany({
			select: {
				tags: true,
				address: true,
			},
			where: {
				chain_name: process.env.NEXT_PUBLIC_CHAIN,
			},
		})
		const labelsCloud = tags.map(({ tags, address }) => ({
			label: tags?.replace(`["`, '')?.replace(`"]`, ``) || '',
			count: 1,
		}))
		return labelsCloud
	}),
	getLabelAddresses: internalProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const addresses = await prisma.$queryRaw`
                          SELECT ATL.address, ATL.name
                          FROM address_to_labels AS ATL
                          JOIN label_to_addresses AS LTA ON LTA.label = ${input}
                          WHERE ATL.address = ANY (LTA.addresses);
                          `

			return addresses
		}),
	getLabels: internalProcedure.input(z.string()).query(async ({ input }) => {
		const address = input.toLowerCase()
		const labels = await prisma.address_to_labels.findFirst({
			where: {
				address: address,
			},
			select: {
				name: true,
				address: true,
				labels: true,
				site: true,
			},
		})

		return labels
	}),
})
