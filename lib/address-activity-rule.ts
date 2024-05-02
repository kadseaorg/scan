export function calculateDistinctMonthsScore(distinctMonths: number) {
	if (distinctMonths >= 9) {
		return 3
	} else if (distinctMonths >= 6) {
		return 2
	} else if (distinctMonths >= 2) {
		return 1
	} else {
		return 0
	}
}

export function calculateTransactionsCountScore(totalTransactions: number) {
	if (totalTransactions >= 100) {
		return 4
	} else if (totalTransactions >= 25) {
		return 3
	} else if (totalTransactions >= 10) {
		return 2
	} else if (totalTransactions >= 4) {
		return 1
	} else {
		return 0
	}
}

export function calculateVolumeScore(totalVolumeUsd: number) {
	if (totalVolumeUsd >= 250000) {
		return 4
	} else if (totalVolumeUsd >= 100000) {
		return 3
	} else if (totalVolumeUsd >= 50000) {
		return 2
	} else if (totalVolumeUsd >= 10000) {
		return 1
	} else {
		return 0
	}
}

export function calculateBridgeVolumeScore(totalBridgeVolumeUsd: number) {
	if (totalBridgeVolumeUsd >= 250000) {
		return 4
	} else if (totalBridgeVolumeUsd >= 100000) {
		return 3
	} else if (totalBridgeVolumeUsd >= 50000) {
		return 2
	} else if (totalBridgeVolumeUsd >= 10000) {
		return 1
	} else {
		return 0
	}
}
