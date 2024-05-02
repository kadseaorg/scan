export function TailwindIndicator() {
	if (process.env.NODE_ENV === 'production') return null

	return (
		<div className="z-50 fixed bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary p-3 font-mono text-xs text-background">
			<div className="block sm:hidden">xs</div>
			<div className="hidden sm:block md:hidden">sm</div>
			<div className="hidden md:block lg:hidden">md</div>
			<div className="hidden lg:block xl:hidden">lg</div>
			<div className="hidden xl:block 2xl:hidden">xl</div>
			<div className="hidden 2xl:block">2xl</div>
		</div>
	)
}
