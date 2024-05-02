import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { castCommandsGrouop } from '@/constants/cast-commands'
import Container from '@/layout/container'

export default function Devtools() {
	return (
		<Container>
			<div className="flex flex-col gap-8 mx-auto my-8 justify-center items-center">
				<h1 className="text-2xl font-bold text-center dark:text-foreground">
					Development Tools
				</h1>
				<div className="flex flex-col gap-7">
					{castCommandsGrouop.map((group) => (
						<div key={group.name} className="flex flex-col gap-3">
							<div className="text-sm font-bold dark:text-foreground">
								{group.name}
							</div>
							<div className="flex flex-wrap gap-2">
								{group.commands.map((command) => (
									<Button variant="outline" size="sm" key={command.name}>
										<Link href={`/devtools/${command.name}`}>
											{command.name}
										</Link>
									</Button>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</Container>
	)
}
