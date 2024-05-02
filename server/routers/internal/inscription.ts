import { z } from 'zod'
import prisma from '../../prisma'
import { internalProcedure, router } from '../../trpc'

export const getEstimatedTransactionCount = async (): Promise<number> => {
	const res = (await prisma.$queryRaw`
    SELECT reltuples::bigint AS estimate
    FROM pg_class
    WHERE relname = 'inscriptions';
  `) as { estimate: string }[]

	return Number(res[0].estimate) < 0 ? 0 : Number(res[0].estimate)
}

export const inscriptionRouter = router({
	getInscriptionList: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { take, cursor, desc } = input
			const list = (await prisma.$queryRawUnsafe(`
    SELECT
    w.tick,
    w.standard,
    w.max_supply,
    w.deploy_txhash AS deploy_hash,
    w.timestamp,
    s.minted_count AS total_minted,
    s.holder_count,
    s.tx_count
FROM
    inscription_whitelist w
JOIN
    mv_inscription_summary s ON w.tick = s.tick
ORDER BY s.holder_count DESC
LIMIT ${take} OFFSET ${cursor ? cursor : 0};
`)) as any[]
			return {
				list,
				nextCursor: list.length == take ? (cursor || 0) + (take || 0) : null,
			}
		}),
	getTransactions: internalProcedure
		.input(
			z.object({
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { take, cursor, desc } = input
			const txCount = getEstimatedTransactionCount()
			const txs = prisma.$queryRawUnsafe(`
    SELECT
      inscriptions.transaction_hash,
      (inscriptions.full_inscription->>'tick') AS tick,
      (inscriptions.full_inscription->>'op') AS operation,
      inscriptions.block_number,
      inscriptions.from_address,
      (inscriptions.full_inscription->>'amt')::bigint AS amount,
      inscriptions.gas_price,
      inscriptions.timestamp
    FROM
      inscriptions
    WHERE
      inscriptions.full_inscription->>'tick' IS NOT NULL
    ORDER BY
      inscriptions.timestamp DESC
    LIMIT ${take} OFFSET ${cursor ? cursor : 0};
    `)
			const [count, list] = (await Promise.all([txCount, txs])) as [any, any[]]
			return {
				count: count,
				list,
				nextCursor: list.length == take ? (cursor || 0) + (take || 0) : null,
			}
		}),

	getInscriptionDetail: internalProcedure
		.input(
			z.object({
				tick: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const { tick } = input
			const inscription = (await prisma.$queryRawUnsafe(`
    SELECT
    w.tick,
    w.standard,
    w.max_supply,
    w.limit_per_mint,
    w.deploy_txhash,
    w.timestamp AS deploy_time,
    s.minted_count,
    s.holder_count,
    s.tx_count
FROM
    mv_inscription_summary s
JOIN
    inscription_whitelist w ON s.tick = w.tick
WHERE
    w.tick = '${tick}';`)) as any[]

			return {
				...inscription[0],
			}
		}),

	getInscriptionHolders: internalProcedure
		.input(
			z.object({
				tick: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const { tick, take, cursor } = input
			const holders = prisma.$queryRawUnsafe(`
    WITH minter_counts AS (
      SELECT
        from_address AS address,
        SUM(amt) AS minted_count
      FROM
        mv_inscription_mint_txs
      WHERE
        tick = '${tick}'
      GROUP BY
        from_address
    ), ranked_minters AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY minted_count DESC) AS rank,
        address,
        minted_count
      FROM
        minter_counts
    )
    SELECT
      rank,
      address,
      minted_count
    FROM
      ranked_minters
    ${cursor ? `WHERE rank > ${cursor}` : ''}
    ORDER BY rank
  LIMIT ${take};
    `)
			const maxSupplyQuery = prisma.$queryRawUnsafe(
				`SELECT max_supply FROM inscription_whitelist WHERE tick = '${tick}';`,
			)
			const [list, ins] = (await Promise.all([holders, maxSupplyQuery])) as [
				any[],
				any[],
			]
			const maxSupply = ins[0].max_supply
			list.forEach((item) => {
				// console.log('minted_count: ',typeof item.minted_count, typeof maxSupply)
				item.percentage =
					maxSupply > 0
						? parseFloat(
								(item.minted_count.toNumber() / Number(maxSupply)).toFixed(6),
						  )
						: 0
				// console.log('item.percentage: ', item.minted_count.toNumber(), Number(maxSupply))
			})
			return {
				list,
				nextCursor:
					list.length > 0 && list.length == take
						? list[list.length - 1].rank
						: null,
			}
		}),

	getInscriptionTxs: internalProcedure
		.input(
			z.object({
				tick: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const { tick, take, cursor, desc } = input
			const txs = (await prisma.$queryRawUnsafe(`
    SELECT
    inscriptions.transaction_hash,
    (inscriptions.full_inscription->>'tick') AS tick,
    (inscriptions.full_inscription->>'op') AS operation,
    inscriptions.block_number,
    inscriptions.from_address,
    (inscriptions.full_inscription->>'amt')::bigint AS amount,
    inscriptions.gas_price,
    inscriptions.timestamp
  FROM
    inscriptions
  WHERE
    inscriptions.full_inscription->>'tick' = '${tick}'
    ${cursor ? ` AND timestamp ${desc ? '<' : '>'} ${cursor}` : ''}
  ORDER BY
    inscriptions.timestamp DESC
    LIMIT ${take};
    `)) as any[]
			return {
				list: txs,
				nextCursor:
					txs.length > 0 && txs.length == take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),

	getInscriptionsForAddress: internalProcedure
		.input(
			z.object({
				address: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.trim().toLowerCase()
			const inscriptions = (await prisma.$queryRawUnsafe(`
      SELECT
        tick,
        SUM(amt) AS balance
      FROM
        mv_inscription_mint_txs
      WHERE
        from_address = '${address}'
      GROUP BY
        tick
      ORDER BY
        balance DESC;
    `)) as any[]
			return inscriptions
		}),

	getTxsForAddress: internalProcedure
		.input(
			z.object({
				address: z.string(),
				take: z.number().int().max(50).default(20).optional(),
				cursor: z.number().nullish(),
				desc: z.boolean().default(true),
			}),
		)
		.query(async ({ input }) => {
			const address = input.address.trim().toLowerCase()
			const { take, cursor, desc } = input
			const txs = (await prisma.$queryRawUnsafe(`
    SELECT
    inscriptions.transaction_hash,
    (inscriptions.full_inscription->>'tick') AS tick,
    (inscriptions.full_inscription->>'op') AS operation,
    inscriptions.block_number,
    inscriptions.from_address,
    (inscriptions.full_inscription->>'amt')::bigint AS amount,
    inscriptions.gas_price,
    inscriptions.timestamp
  FROM
    inscriptions
  WHERE
    inscriptions.from_address = '${address}'
    ${cursor ? ` AND timestamp ${desc ? '<' : '>'} ${cursor}` : ''}
  ORDER BY
    inscriptions.timestamp DESC
    LIMIT ${take};
    `)) as any[]
			return {
				list: txs,
				nextCursor:
					txs.length > 0 && txs.length == take
						? txs[txs.length - 1].timestamp
						: null,
			}
		}),
})
