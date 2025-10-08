<template>
	<UContainer class="py-8">
		<UCard class="max-w-3xl mx-auto">
			<template #header>
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-bold text-neutral-900 dark:text-white">
							Create Survey
						</h2>
						<p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
							Create and manage surveys for Mattermost channels
						</p>
					</div>
					<UButton
						icon="i-heroicons-question-mark-circle"
						color="neutral"
						variant="ghost"
						@click="showHelp = true"
					/>
				</div>
			</template>

			<UForm :state="form" @submit="onSubmit" class="space-y-6">
				<UAlert
					v-if="error"
					icon="i-heroicons-exclamation-triangle"
					color="error"
					variant="subtle"
					:title="error"
					class="mb-4"
				/>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<UFormField label="Bot" name="bot" required>
						<USelectMenu
							:items="botOptions"
							placeholder="Select a bot"
							required
							@update:model-value="
								(bot) => {
									form.bot = bot.id;
								}
							"
						/>
					</UFormField>

					<UFormField label="Channel ID" name="channelId" required>
						<UInput v-model="form.channelId" placeholder="channel_id_here" required />
					</UFormField>
				</div>

				<UFormField label="Survey Title" name="title" required>
					<UInput v-model="form.title" placeholder="Quarterly Feedback" required />
				</UFormField>

				<div>
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
							Questions
						</h3>
						<div class="flex gap-2">
							<UButton
								icon="i-heroicons-plus"
								label="Add Question"
								@click="addQuestion"
							/>
							<UButton
								icon="i-heroicons-arrow-path"
								label="Reset Template"
								color="neutral"
								variant="outline"
								@click="resetTemplate"
							/>
						</div>
					</div>

					<ClientOnly>
						<VueDraggableNext v-model="form.questions" item-key="_id" class="space-y-4">
							<template v-for="(q, idx) in form.questions">
								<UCard class="relative" :ui="{ body: 'p-4' }">
									<template #header>
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-3">
												<UFormField
													label="Type"
													:name="`question-type-${q._id}`"
													class="mb-0"
												>
													<URadioGroup
														v-model="q.type"
														:items="questionTypeOptions"
														orientation="horizontal"
														class="w-full"
													/>
												</UFormField>
											</div>

											<div class="flex items-center gap-2">
												<UButton
													icon="i-heroicons-clipboard-document"
													color="neutral"
													variant="ghost"
													size="sm"
													:ui="{ base: 'rounded-md' }"
													@click="duplicateQuestion(idx)"
													label="Duplicate"
												/>
												<UButton
													icon="i-heroicons-trash"
													color="error"
													variant="ghost"
													size="sm"
													:ui="{ base: 'rounded-md' }"
													@click="removeQuestion(idx)"
													:disabled="form.questions.length === 1"
													label="Remove"
												/>
												<UDragHandle class="cursor-move" />
											</div>
										</div>
									</template>

									<UFormField
										label="Question Text"
										:name="`question-${q._id}`"
										required
									>
										<UTextarea
											v-model="q.question"
											placeholder="Write the question..."
											:rows="2"
											required
											class="w-full"
										/>
									</UFormField>

									<div v-if="q.type === 'poll'" class="mt-4 space-y-4">
										<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
											<UFormField :name="`multiple-${q._id}`" class="mb-0">
												<UCheckbox
													v-model="q.multiple"
													label="Allow multiple choices"
												/>
											</UFormField>
											<UFormField :name="`progress-${q._id}`" class="mb-0">
												<UCheckbox
													v-model="q.progress"
													label="Show progress"
												/>
											</UFormField>
											<UFormField :name="`anonymous-${q._id}`" class="mb-0">
												<UCheckbox
													v-model="q.anonymous"
													label="Anonymous"
												/>
											</UFormField>
										</div>

										<div class="space-y-3">
											<div class="flex items-center justify-between">
												<span
													class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
												>
													Options
												</span>
												<UButton
													icon="i-heroicons-plus"
													label="Add Option"
													size="sm"
													@click="addOption(q)"
												/>
											</div>

											<AdminDraggableOptions
												v-model="q.options"
												@remove="removeOption(q, $event)"
											/>
										</div>
									</div>

									<div v-else class="mt-4">
										<UFormField
											label="Instructions (optional)"
											:name="`instructions-${q._id}`"
										>
											<UInput
												v-model="q.instructions"
												placeholder="Reply in-thread with your answer"
											/>
										</UFormField>
									</div>
								</UCard>
							</template>
						</VueDraggableNext>
					</ClientOnly>
				</div>

				<div
					class="pt-6 border-t dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4"
				>
					<div class="text-sm text-neutral-500 dark:text-neutral-400">
						<p>Tip: Poll questions will be created using Matterpoll `/poll` command.</p>
					</div>
					<UButton
						type="submit"
						:loading="loading"
						icon="i-heroicons-rocket-launch"
						label="Create Survey"
						size="lg"
					/>
				</div>
			</UForm>

			<template #footer>
				<UAlert
					v-if="result"
					icon="i-heroicons-check-circle"
					color="success"
					variant="subtle"
					title="Survey created successfully!"
					class="mb-4"
				>
					<template #description>
						<div class="mt-2 space-y-2">
							<div class="flex flex-wrap gap-2">
								<UButton
									icon="i-heroicons-clipboard-document"
									label="Copy Parent Post ID"
									@click="copyParentId"
								/>
								<UButton
									v-if="result.survey?.channelId"
									icon="i-heroicons-arrow-top-right-on-square"
									label="Open Channel"
									color="neutral"
									variant="outline"
									:to="`https://your-mattermost-instance.com/your-team/channels/${result.survey.channelId}`"
									target="_blank"
								/>
							</div>
							<div class="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg mt-2">
								<pre class="text-xs overflow-auto">{{ result }}</pre>
							</div>
						</div>
					</template>
				</UAlert>
			</template>
		</UCard>

		<UModal :open="showHelp">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold">Survey Creation Help</h3>
					</template>

					<div class="space-y-4">
						<div>
							<h4 class="font-medium mb-2">Bot Selection</h4>
							<p class="text-sm text-neutral-600 dark:text-neutral-400">
								Choose the bot that will post the survey. Make sure the bot has
								access to the target channel.
							</p>
						</div>

						<div>
							<h4 class="font-medium mb-2">Channel ID</h4>
							<p class="text-sm text-neutral-600 dark:text-neutral-400">
								Find the Channel ID by right-clicking the channel in Mattermost and
								selecting "View Info".
							</p>
						</div>

						<div>
							<h4 class="font-medium mb-2">Question Types</h4>
							<ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
								<li>
									• <strong>Poll:</strong> Multiple choice questions with various
									options
								</li>
								<li>• <strong>Text:</strong> Open-ended text responses</li>
							</ul>
						</div>
					</div>

					<template #footer>
						<div class="flex justify-end">
							<UButton label="Got it" color="primary" @click="showHelp = false" />
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
	</UContainer>
</template>

<script setup lang="ts">
import { VueDraggableNext } from "vue-draggable-next";
interface Question {
	_id: string;
	type: "poll" | "text";
	question: string;
	options: string[];
	multiple: boolean;
	progress: boolean;
	anonymous: boolean;
	flags: string[];
	instructions?: string;
}

interface Form {
	bot?: string;
	channelId: string;
	title: string;
	questions: Question[];
}

// Composables
const $toast = useToast();

function createDefaultQuestion(): Question {
	return {
		_id: generateId(),
		type: "poll",
		question: "",
		options: ["Yes", "No"],
		multiple: false,
		progress: false,
		anonymous: false,
		flags: [],
		instructions: undefined,
	};
}
const form = reactive<Form>({
	bot: undefined,
	channelId: "",
	title: "",
	questions: [createDefaultQuestion()],
});

const loading = ref(false);
const result = ref<Record<string, any> | null>(null);
const error = ref("");
const showHelp = ref(false);

// Constants
const { data: botOptions } = useFetch("/api/mattermost/bots");

const questionTypeOptions = [
	{ label: "Poll", value: "poll" },
	{ label: "Text", value: "text" },
];

// Functions

function generateId(): string {
	return Math.random().toString(36).slice(2, 9);
}

function addQuestion() {
	form.questions.push(createDefaultQuestion());
	$toast.add({
		title: "Question added",
		color: "success",
	});
}

function duplicateQuestion(idx: number) {
	const copy = JSON.parse(JSON.stringify(form.questions[idx]));
	copy._id = generateId();
	form.questions.splice(idx + 1, 0, copy);
	$toast.add({
		title: "Question duplicated",
		color: "success",
	});
}

function removeQuestion(idx: number) {
	if (form.questions.length === 1) {
		$toast.add({
			title: "Cannot remove the last question",
			color: "warning",
		});
		return;
	}
	form.questions.splice(idx, 1);
	$toast.add({
		title: "Question removed",
		color: "success",
	});
}

function addOption(q: Question) {
	q.options.push("New option");
}

function removeOption(q: Question, oi: number) {
	if (q.options.length <= 2) {
		$toast.add({
			title: "Poll must have at least 2 options",
			color: "warning",
		});
		return;
	}
	q.options.splice(oi, 1);
}

function resetTemplate() {
	form.questions = [createDefaultQuestion()];
	$toast.add({
		title: "Template reset",
		color: "success",
	});
}

async function onSubmit() {
	loading.value = true;
	error.value = "";
	result.value = null;

	try {
		const questions = form.questions.map((q) => {
			if (q.type === "poll") {
				const flags = [] as string[];
				if (q.anonymous) flags.push("--anonymous");
				if (q.progress) flags.push("--progress");
				if (q.multiple) flags.push(`--votes=${q.options.length}`);

				return {
					type: "poll",
					question: q.question,
					options: q.options.filter((o: string) => o.trim()),
					multiple: q.multiple,
					flags,
				};
			}

			return {
				type: "text",
				question: q.question,
				instructions: q.instructions || "",
			};
		});

		const res = await $fetch("/api/mattermost/surveys/create", {
			method: "POST",
			body: {
				bot: form.bot,
				channelId: form.channelId,
				title: form.title,
				questions,
			},
		});

		result.value = res;
		$toast.add({
			title: "Survey created successfully!",
			color: "success",
		});
	} catch (err: any) {
		console.error(err);
		error.value = err?.data?.message || err?.message || "Failed to create survey";
		$toast.add({
			title: "Failed to create survey",
			color: "error",
		});
	} finally {
		loading.value = false;
	}
}

function copyParentId() {
	if (result.value?.parentPostId) {
		navigator.clipboard.writeText(result.value.parentPostId);
		$toast.add({
			title: "Parent Post ID copied to clipboard",
			color: "success",
		});
	} else {
		$toast.add({
			title: "Unable to copy, no parent post id found",
			color: "warning",
		});
	}
}
</script>
