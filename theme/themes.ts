export const themes = [
	{
		name: 'scroll',
		label: 'Scroll',
		activeColor: {
			light: '34.4 87.2% 84.7%',
			dark: '34.4 87.2% 84.7%',
		},
	},
	{
		name: 'linea',
		label: 'Linea',
		activeColor: {
			light: '191 97% 61%',
			dark: '191 97% 61%',
		},
	},
	{
		name: 'zksync-era',
		label: 'zkSync Era',
		activeColor: {
			light: '221.2 83.2% 53.3%',
			dark: '221.2 83.2% 53.3%',
		},
	},
	{
		name: 'base',
		label: 'Base',
		activeColor: {
			light: '217.2 91.2% 59.8%',
			dark: '217.2 91.2% 59.8%',
		},
	},
	{
		name: 'manta-pacific',
		label: 'Manta',
		activeColor: {
			light: '207, 100%, 43%',
			dark: '207, 100%, 43%',
		},
	},
	{
		name: 'arb-one',
		label: 'Arbitrum',
		activeColor: {
			light: '207, 100%, 43%',
			dark: '207, 100%, 43%',
		},
	},
	{
		name: 'kadsea',
		label: 'Kadsea',
		activeColor: {
			light: '266 100% 70%',
			dark: '266 100% 70%',
		},
	},
	{
		name: 'okx1',
		label: 'OKX1',
		activeColor: {
			light: '79, 100%, 59%, 0.4',
			dark: '79, 100%, 59%, 0.4',
		},
	},
	{
		name: 'oro',
		label: 'Oro',
		activeColor: {
			light: '100 91.3% 68.4%',
			dark: '100 91.3% 68.4%',
		},
	},
] as const

// export const themes = [
//   {
//     name: 'zinc',
//     label: 'Zinc',
//     activeColor: {
//       light: '240 5.9% 10%',
//       dark: '240 5.2% 33.9%'
//     }
//   },
//   {
//     name: 'slate',
//     label: 'Slate',
//     activeColor: {
//       light: '215.4 16.3% 46.9%',
//       dark: '215.3 19.3% 34.5%'
//     }
//   },
//   {
//     name: 'stone',
//     label: 'Stone',
//     activeColor: {
//       light: '25 5.3% 44.7%',
//       dark: '33.3 5.5% 32.4%'
//     }
//   },
//   {
//     name: 'gray',
//     label: 'Gray',
//     activeColor: {
//       light: '220 8.9% 46.1%',
//       dark: '215 13.8% 34.1%'
//     }
//   },
//   {
//     name: 'neutral',
//     label: 'Neutral',
//     activeColor: {
//       light: '0 0% 45.1%',
//       dark: '0 0% 32.2%'
//     }
//   },
//   {
//     name: 'red',
//     label: 'Red',
//     activeColor: {
//       light: '0 72.2% 50.6%',
//       dark: '0 72.2% 50.6%'
//     }
//   },
//   {
//     name: 'rose',
//     label: 'Rose',
//     activeColor: {
//       light: '346.8 77.2% 49.8%',
//       dark: '346.8 77.2% 49.8%'
//     }
//   },
//   {
//     name: 'orange',
//     label: 'Orange',
//     activeColor: {
//       light: '24.6 95% 53.1%',
//       dark: '20.5 90.2% 48.2%'
//     }
//   },
//   {
//     name: 'green',
//     label: 'Green',
//     activeColor: {
//       light: '142.1 76.2% 36.3%',
//       dark: '142.1 70.6% 45.3%'
//     }
//   },
//   {
//     name: 'blue',
//     label: 'Blue',
//     activeColor: {
//       light: '221.2 83.2% 53.3%',
//       dark: '217.2 91.2% 59.8%'
//     }
//   },
//   {
//     name: 'yellow',
//     label: 'Yellow',
//     activeColor: {
//       light: '47.9 95.8% 53.1%',
//       dark: '47.9 95.8% 53.1%'
//     }
//   },
//   {
//     name: 'violet',
//     label: 'Violet',
//     activeColor: {
//       light: '262.1 83.3% 57.8%',
//       dark: '263.4 70% 50.4%'
//     }
//   }
// ] as const

export type Theme = (typeof themes)[number]
