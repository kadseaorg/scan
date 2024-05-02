import { useState } from 'react'

import { Dialog, DialogContent } from '@mui/material'
import { scaleLog } from '@visx/scale'
import { Text } from '@visx/text'
import Wordcloud from '@visx/wordcloud/lib/Wordcloud'
import Link from 'next/link'

import DialogTitle from '../common/dialog/DialogTitle'

export interface WordData {
	text: string
	value: number
}

interface WordCloudProps {
	words: WordData[]
	width: number
	height: number
	showControls?: boolean
}

const colors = ['#143059', '#2F6B9A', '#82a6c2']

function getRotationDegree() {
	const rand = Math.random()
	const degree = rand > 0.5 ? 60 : -60
	return rand * degree
}

const fixedValueGenerator = () => 0.5

type SpiralType = 'archimedean' | 'rectangular'

export default function WordCloud({
	words,
	width,
	height,
	showControls,
}: WordCloudProps) {
	const [spiralType, setSpiralType] = useState<SpiralType>('archimedean')
	const [withRotation, setWithRotation] = useState(false)
	const [openLabelModal, setOpenLabelModal] = useState(false)
	const [selectedLabelData, setSelectedLabelData] = useState<any>()

	const fontScale = scaleLog({
		domain: [
			Math.min(...words.map((w) => w.value)),
			Math.max(...words.map((w) => w.value)),
		],
		range: [10, 100],
	})
	const fontSizeSetter = (datum: WordData) => fontScale(datum.value)

	const onClose = () => setOpenLabelModal(false)

	return (
		<div className="wordcloud">
			<Wordcloud
				words={words}
				width={width}
				height={height}
				fontSize={fontSizeSetter}
				font={'Impact'}
				padding={2}
				spiral={spiralType}
				rotate={withRotation ? getRotationDegree : 0}
				random={fixedValueGenerator}
			>
				{(cloudWords) =>
					cloudWords.map((w, i) => (
						<Text
							key={w.text}
							fill={colors[i % colors.length]}
							textAnchor={'middle'}
							transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
							fontSize={w.size}
							fontFamily={w.font}
							cursor={'pointer'}
							onClick={() => {
								setSelectedLabelData(w)
								setOpenLabelModal(true)
							}}
						>
							{w.text}
						</Text>
					))
				}
			</Wordcloud>

			<Dialog open={openLabelModal} onClose={onClose} maxWidth="sm" fullWidth>
				<DialogTitle title={selectedLabelData?.text} onClose={onClose} />
				<DialogContent sx={{ pb: 4 }}>
					<Link href={`/label/${selectedLabelData?.text}`}>
						Tags ({selectedLabelData?.value})
					</Link>
				</DialogContent>
			</Dialog>

			<style jsx>{`
        .wordcloud {
          display: flex;
          flex-direction: column;
          user-select: none;
        }
        .wordcloud svg {
          margin: 1rem 0;
          cursor: pointer;
        }

        .wordcloud label {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          margin-right: 8px;
        }
        .wordcloud textarea {
          min-height: 100px;
        }
      `}</style>
		</div>
	)
}
