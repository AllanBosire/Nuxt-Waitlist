<template>
	<div class="max-w-4xl mx-auto container">
		<div class="w-full flex flex-col items-center">
			<UIcon
				name="ill:landing"
				class="md:!text-[250px] sm:!text-[200px] max-sm:!text-[100px]"
			/>
			<h1
				class="font-bold max-md:text-3xl max-w-lg tracking-tight mx-auto text-neutral-900 font-outfit big-text"
			>
				Something big is coming your <span class="underline decoration-purple">Way</span>
			</h1>
			<p
				class="mt-8 max-md:mt-2 m text-lg text-gray-500 max-w-3xl mx-auto leading-7 font-outfit"
			>
				Join the waiting list for
				<span class="underline decoration-purple decoration-2 font-getar tracking-wide"
					>finueva!</span
				>
				Share, and get notified when we launch!
			</p>
		</div>
		<HomeWaitlistForm class="w-full" />
	</div>
</template>
<style>
.container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	column-gap: 2rem;
}


.big-text {
  font-size: clamp(30px, 4vw, 60px);
  line-height: 1.1;
}

@media (width < 62.5rem) {
	.container {
		grid-template-columns: auto;
		grid-auto-flow: row;
	}
}
</style>
