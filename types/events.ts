export type PlausibleEvents = {
	'Network-Add to Wallet': never
	'Account-Sign in': never
	'Account-Add to Watch List': never
	'Account-Private Tag': never
	'Faucet-Generate tweet': never
	'Faucet-Claim': never
	'Explorer-Change Mode': { Mode: string }
	'Token-Add to wallet': { TokenName: string; WalletName: string }
	'Contract-Verify Contract': { Address?: string }
	'Verify Contract-Verify and Publish': never
	'Verify Contract-Reset': never
	'Verify Contract-Return to Main': never
	'Dev Tools-Submit': { Command: string }
	'Dapp-Project Name': { Name?: string }
	'Dapp-Try Now': { DappNameJumpto?: string }
	'Dapp-Recommend': { DappNameRecommend: string }
	'Search-Content': { ContentType: string }
	'AI-Ask': never
	'AI-Ask Question': { Question: string }
	'Portal-Native Bridge': never
	'Portal-Native Bridge Deposit': never
	'Portal-Native Bridge Withdraw': never
	'Portal-Bridge Name': { BridgeName: string }
	'AD-Click': { ProjectLink: string }
}
