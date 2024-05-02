export interface IDappItem {
	id: string
	name: string
	team?: string
	logo: string
	description: string
	contract: string
	categories: string[]
	website: string
}
export interface ContractStats {
	count: number
	prev_day_count: number
	growth_percentage: number
	total_count: number
}

export interface DappStats {
	count: number
	prev_day_count: number
	growth_percentage: number
	total_count: number
}
