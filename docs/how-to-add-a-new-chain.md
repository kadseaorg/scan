# How to add a new chain

Step by step guide to add a new chain to the l2scan.

1. Add the chain to the `types/chain.ts`

```js
export enum EnumChainType {
  SCROLL_SEPOLIA = 'scroll-sepolia',
  SCROLL = 'scroll',
  ZKSYNC = 'zksync-era',
  ZKSYNC_TESTNET = 'zksync-era-testnet',
  ZKSYNC_SEPOLIA = 'zksync-era-sepolia',
  LINEA = 'linea',
  BASE = 'base',
  ARB = 'arb-one',
  MANTA = 'manta-pacific',
  MANTA_TESTNET = 'manta-testnet',
  BSQUARED_TESTNET = 'bsquared-testnet'
  // Add the new chain here
}
```

2. Define the chain in the `constants/chain.ts` if the new chain does not exist in `viem/chains`

```js
export const kadsea = /*#__PURE__*/ defineChain({
	id: 1_102,
	name: 'Kadsea',
	network: 'kadsea',
	nativeCurrency: {
		decimals: 18,
		name: 'KAD',
		symbol: 'KAD',
	},
	rpcUrls: {
		default: { http: ['https://rpchttp.kadsea.org'] },
		public: { http: ['https://rpchttp.kadsea.org'] },
	},
	blockExplorers: {
		default: {
			name: 'Kadsea Explorer',
			url: 'https://scan.kadchain.cc/',
		},
	},
	// contracts: {
	//   multicall3: {
	//     address: '0x211B1643b95Fe76f11eD8880EE810ABD9A4cf56C',
	//     blockCreated: 419915,
	//   },
	// },
	testnet: false,
})
```

3. Add the new defined chain to the `CHAIN_MAP` in `constants/chain.ts`

```js
export const CHAIN_MAP: Record<EnumChainType, IChainItem> = {
...

[EnumChainType.KADSEA]: {
		url: 'https://scan.kadchain.cc/',
		title: 'Kadsea',
		l1Title: 'ETH',
		logo: '/svgs/logo/kadsea.svg',
		description: 'The Native Bitcoin Layer2',
		chainType: EnumChainType.KADSEA,
		darkOnly: true,
		network: {
			chainId: toHex(kadsea.id),
			chainType: 'Kadsea',
		},
		networkSwitchers: [
			{
				name: 'Kadsea',
				explorerUrl: 'https://scan.kadchain.cc/',
			},
		],
		blockExplorerUrl: 'https://scan.kadchain.cc/',
		rpcUrl: kadsea.rpcUrls.default.http[0],
		l1ExplorerUrl: '',
		bridgeContract: [''],
		bridgeDepositMethodId: '', // mintPublic()
	},
}
```

4. Add the new chain to the `PORTAN_CHAIN_MAP` in `constants/chain.ts`

```js
export const PORTAN_CHAIN_MAP: Record<EnumChainType, Chain[]> = {
  ...
  // Add the new chain here
	[EnumChainType.KADSEA]: [kadsea],
}
```


5. Add the new chain to the `ChainSwitcherList` in `constants/chain.ts`

```js
export const ChainSwitcherList = [
	EnumChainType.SCROLL,
	EnumChainType.ZKSYNC,
	EnumChainType.LINEA,
	EnumChainType.BASE,
	EnumChainType.ARB,
  
  // Add the new chain here
  EnumChainType.KADSEA,
]
```

6. Config the theme for the new chain in `chain-themes.css`


```js
...

// Add the new chain theme here
.theme-kadsea {
  --background: 0 0% 95%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 224 71.4% 4.1%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71.4% 4.1%;
  --primary: 227 59% 43%;
  --primary-foreground: 210 20% 98%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --accent: 227 59% 43%;
  --accent-foreground: 220.9 39.3% 11%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 20% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
}

.dark .theme-kadsea {
  --background: 0 0% 0%;
  --foreground: 210 20% 98%;
  --card: 200 5% 11%;
  --card-foreground: 210 20% 98%;
  --popover: 224 71.4% 4.1%;
  --popover-foreground: 210 20% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 210 20% 98%;
  --secondary: 221 86% 23%;
  --secondary-foreground: 210 20% 98%;
  --muted: 221 86% 23%;
  --muted-foreground: 217.9 10.6% 64.9%;
  --accent: 217 91% 60%;
  --accent-foreground: 210 20% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 20% 98%;
  --border: 215 27.9% 16.9%;
  --input: 217 91% 60%;
  --ring: 224 64% 33%;
  --radius: 0.5rem;
}
```

7. Config `theme/themes.ts` for the new chain

```js
export const themes = [
...
// Add the new chain theme here
{
		name: 'kadsea',
		label: 'Kadsea',
		activeColor: {
			light: '266 100% 70%',
			dark: '266 100% 70%',
		},
	},
]
```

8. Config MUI theme for the new chain in `theme/colors/colors_{chain}_dark.ts` and add that corlor theme in `theme/colors/index.ts`(Please remove mui components in the future)

```js
if (process.env.NEXT_PUBLIC_CHAIN === EnumChainType.KADSEA) {
	themeColor.dark = colors_kadsea_dark
}
```


9. Add `home_header_bg.png` and `logo.png` in `public/imgsInTheme/{chain}/`

10. Execute `prisma/schema.sql` to add materialized view for the new chain if needed

11. Execute `prisma/account-notify.sql` to add account notify for the new chain if needed

12. Add Github action matrix config for the new chain in `.github/workflows/docker.yml`

```yml
...
 strategy:
      matrix:
        config:
          ...
          - chain: 'kadsea'
            site_url: 'https://scan.kadchain.cc/'
```