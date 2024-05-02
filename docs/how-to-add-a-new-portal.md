# How to add a new portal

Step by step guide to add a new portal to the l2scan.

1. Config `portalNetworks` in `components/portal/wallet-network-group/index.tsx` file.

```js
// portalNetworks
const portalNetworks =
		IsKadsea || IsArbitrum
			? [EPortalNetwork.MAINNET]
			: IsBsquaredTestnet
			  ? [EPortalNetwork.TESTNET]
			  : Object.values(EPortalNetwork)

// network
if (IsArbitrum || IsKadsea) {
		setNetwork(EPortalNetwork.MAINNET)
    } else if (IsBsquaredTestnet) {
		setNetwork(EPortalNetwork.TESTNET)
	}
```

2. Config `PORTAN_CHAIN_MAP` in `constants/chain.ts` file.

```js
export const PORTAN_CHAIN_MAP: Record<EnumChainType, Chain[]> = {
...
[EnumChainType.KADSEA]: [kadsea],
...
}
```

3. Config `NATIVE_ICON_URL` in `constants/index.ts` file.

```js
export const NATIVE_ICON_URL =
	IsBsquaredTestnet || IsKadsea ? BTC_ICON_URL : ETH_ICON_URL
```

4. Config token list in `hooks/portal/wallet/use-token-list.ts` file.

config chainid and fetch token list from some api or write a static token list.

5. Config `correctNetwork` in `hooks/portal/wallet/use-wallet-send.ts` file.

```js
	const correctNetwork = useMemo(() => {
		if (IsScroll) {
			return isMainnet ? _scroll : _scrollSepolia
		}
		if (IsZkSync) {
			return isMainnet ? _zkSync : _zkSyncTestnet
		}
		if (IsBsquaredTestnet) {
			return bsquaredTestnet
		}
		if (IsKadsea) {
			return kadsea
		}

		if (IsOKX1) {
			return okx1Testnet
		}
	}, [isMainnet])
```

6. Config `ROUTES_MENUS` in `layout/menu/config.tsx` file.

```js
	// show only portal menu
	if (
		![
			EnumChainType.SCROLL,
			EnumChainType.SCROLL_SEPOLIA,
			EnumChainType.ZKSYNC,
			EnumChainType.MANTA,
			EnumChainType.BSQUARED_TESTNET,
			EnumChainType.KADSEA,
			EnumChainType.ARB,
			EnumChainType.OKX1_TESTNET,
		].includes(CHAIN_TYPE) &&
		menuItem.label === 'Portal'
	) {
		return false
	}
```

7. Config `getAccountWalletTransactions` and `bridgeContract` in `server/routers/internal/transaction.ts` file.

```js
		if (IsScroll || IsBsquaredTestnet || IsKadsea || IsArbitrum) {
				ethTxs = await prismaInstance.$queryRawUnsafe(`
                    SELECT hash, from_address, to_address, value, timestamp
                    FROM transactions
                    WHERE (from_address = '${address}' OR to_address = '${address}') AND method_id = '0x' AND input = '0x'
                    ${
											cursor
												? `AND transactions.timestamp ${
														desc ? '<' : '>'
												  } ${cursor}`
												: ''
										}
                    ORDER BY transactions.timestamp ${desc ? 'DESC' : 'ASC'}
                    LIMIT ${take}
                    `)
			}


            const bridgeContract = [
				'0x0000000000000000000000000000000000008001',
				...(CHAIN_MAP.scroll.bridgeContract || []),
				...(CHAIN_MAP['scroll-sepolia'].bridgeContract || []),
				...(CHAIN_MAP['zksync-era'].bridgeContract || []),
				...(CHAIN_MAP['zksync-era-testnet'].bridgeContract || []),
				...(CHAIN_MAP['zksync-era-sepolia'].bridgeContract || []),
				...(CHAIN_MAP['bsquared-testnet'].bridgeContract || []),
				...(CHAIN_MAP['kadsea'].bridgeContract || []),
				...(CHAIN_MAP['arb-one'].bridgeContract || []),
			]
```
