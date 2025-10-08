<template>
	<UContainer class="py-8">
		<UCard>
			<template #header>
				<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div>
						<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
							Survey Analytics
						</h2>
						<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
							Analyze survey results and response patterns
						</p>
					</div>

					<div class="flex flex-col sm:flex-row gap-3">
						<UInput
							v-model="parentPostIdInput"
							placeholder="Enter Parent Post ID"
							icon="i-heroicons-document-text"
							class="min-w-64"
						/>
						<USelect
							v-model="bot"
							:options="botOptions"
							placeholder="Select Bot"
							icon="i-heroicons-robot"
							class="min-w-48"
						/>
						<UButton
							icon="i-heroicons-chart-bar"
							label="Load Analytics"
							:loading="loading"
							@click="fetchStats"
						/>
					</div>
				</div>
			</template>

			<!-- Loading State -->
			<div v-if="loading" class="space-y-4">
				<USkeleton class="h-8 w-1/3" />
				<USkeleton class="h-4 w-full" />
				<div class="space-y-3">
					<USkeleton v-for="n in 3" :key="n" class="h-32 w-full" />
				</div>
			</div>

			<!-- Error State -->
			<UAlert
				v-else-if="error"
				icon="i-heroicons-exclamation-triangle"
				color="error"
				variant="subtle"
				:title="error"
				class="mb-4"
			/>

			<!-- Stats Display -->
			<div v-else-if="stats" class="space-y-6">
				<!-- Survey Header -->
				<UCard
					class="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20"
				>
					<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div class="space-y-2">
							<h3 class="text-xl font-semibold text-gray-900 dark:text-white">
								{{ stats.title }}
							</h3>
							<div
								class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400"
							>
								<div class="flex items-center gap-1">
									<UIcon name="i-heroicons-finger-print" class="w-4 h-4" />
									<span>Survey ID: {{ stats.surveyId }}</span>
								</div>
								<div class="flex items-center gap-1">
									<UIcon name="i-heroicons-link" class="w-4 h-4" />
									<span>Parent: {{ stats.parentPostId }}</span>
								</div>
							</div>
						</div>

						<div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
							<UCard class="text-center p-3">
								<div
									class="text-2xl font-bold text-primary-600 dark:text-primary-400"
								>
									{{ stats.aggregate.totalQuestions }}
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">
									Questions
								</div>
							</UCard>
							<UCard class="text-center p-3">
								<div class="text-2xl font-bold text-green-600 dark:text-green-400">
									{{ stats.aggregate.totalPollVotes }}
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">
									Total Votes
								</div>
							</UCard>
							<UCard class="text-center p-3">
								<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{{ stats.aggregate.totalTextResponses }}
								</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">
									Text Responses
								</div>
							</UCard>
						</div>
					</div>
				</UCard>

				<!-- Questions Results -->
				<div class="space-y-6">
					<UCard
						v-for="r in stats.results"
						:key="r.index"
						class="hover:shadow-lg transition-shadow duration-200"
					>
						<template #header>
							<div
								class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
							>
								<div class="flex items-center gap-3">
									<UBadge
										:color="r.type === 'poll' ? 'primary' : 'success'"
										variant="subtle"
										class="text-sm"
									>
										Q{{ r.index + 1 }}
									</UBadge>
									<div>
										<h4 class="font-semibold text-gray-900 dark:text-white">
											<span v-if="r.type === 'poll'">Poll Question</span>
											<span v-else>Text Question</span>
										</h4>
										<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
											{{
												r.type === "poll"
													? r.stats.question
													: `Text responses (${r.responses.length})`
											}}
										</p>
									</div>
								</div>

								<div v-if="r.type === 'poll'" class="flex items-center gap-2">
									<UIcon name="i-heroicons-users" class="w-4 h-4 text-gray-400" />
									<span
										class="text-sm font-medium text-gray-700 dark:text-gray-300"
									>
										{{ r.stats.total_votes }} votes
									</span>
								</div>
							</div>
						</template>

						<!-- Poll Results -->
						<div v-if="r.type === 'poll'" class="space-y-6">
							<client-only>
								<VChart
									:option="chartOption(r.stats)"
									autoresize
									style="height: 320px; width: 100%"
								/>
							</client-only>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								<UCard
									v-for="(opt, index) in r.stats.options"
									:key="opt"
									class="relative overflow-hidden"
									:ui="{ body: 'p-4' }"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3 flex-1">
											<UBadge
												variant="solid"
												:color="getBadgeColor(index)"
												class="min-w-8 text-center"
											>
												{{ index + 1 }}
											</UBadge>
											<span
												class="text-sm font-medium text-gray-900 dark:text-white flex-1"
											>
												{{ opt }}
											</span>
										</div>
										<div
											class="text-lg font-bold text-gray-900 dark:text-white ml-3"
										>
											{{ r.stats.votes[opt] ?? 0 }}
										</div>
									</div>

									<!-- Progress bar -->
									<div class="mt-2">
										<div
											class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1"
										>
											<span>Votes</span>
											<span>
												{{
													Math.round(
														((r.stats.votes[opt] ?? 0) /
															r.stats.total_votes) *
															100
													) || 0
												}}%
											</span>
										</div>
										<UProgress
											:value="r.stats.votes[opt] ?? 0"
											:max="r.stats.total_votes"
											size="sm"
											:color="getProgressColor(index)"
										/>
									</div>
								</UCard>
							</div>
						</div>

						<!-- Text Responses -->
						<div v-else class="space-y-4">
							<UAlert
								v-if="r.responses.length === 0"
								icon="i-heroicons-chat-bubble-left-right"
								color="neutral"
								variant="subtle"
								title="No text responses yet"
								description="Waiting for participants to submit their responses"
							/>

							<div v-else class="space-y-3">
								<UCard
									v-for="resp in r.responses"
									:key="resp.id"
									class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
									:ui="{ body: 'p-4' }"
								>
									<div class="space-y-2">
										<p class="text-gray-700 dark:text-gray-300 leading-relaxed">
											{{ resp.message }}
										</p>
										<div
											class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
										>
											<div class="flex items-center gap-2">
												<UIcon name="i-heroicons-user" class="w-3 h-3" />
												<span>{{ resp.user_id }}</span>
											</div>
											<div class="flex items-center gap-2">
												<UIcon
													name="i-heroicons-calendar"
													class="w-3 h-3"
												/>
												<span>{{ formatDate(resp.create_at) }}</span>
											</div>
										</div>
									</div>
								</UCard>
							</div>
						</div>
					</UCard>
				</div>
			</div>

			<!-- Empty State -->
			<div v-else class="text-center py-12">
				<UIcon
					name="i-heroicons-chart-bar"
					class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto"
				/>
				<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
					No survey data loaded
				</h3>
				<p class="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
					Enter a Parent Post ID and select a bot to load survey analytics and response
					data.
				</p>
			</div>

			<template #footer>
				<div
					class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400"
				>
					<div class="flex items-center gap-2">
						<UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
						<span>Data is fetched in real-time from Mattermost</span>
					</div>
					<div class="flex items-center gap-4">
						<span
							>Last loaded:
							{{ lastLoaded ? formatRelativeTime(lastLoaded) : "Never" }}</span
						>
						<UButton
							v-if="stats"
							icon="i-heroicons-arrow-down-tray"
							label="Export Data"
							color="neutral"
							variant="ghost"
							size="sm"
							@click="exportData"
						/>
					</div>
				</div>
			</template>
		</UCard>
	</UContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { defineAsyncComponent } from "vue";

// Lazy-load vue-echarts
const VChart = defineAsyncComponent(() => import("vue-echarts"));

// State
const parentPostIdInput = ref("");
const bot = ref("inviteBot");
const loading = ref(false);
const stats = ref(null as any);
const error = ref("");
const lastLoaded = ref<Date | null>(null);

// Constants
const botOptions = [
	{ label: "Invite Bot", value: "inviteBot" },
	{ label: "Survey Bot", value: "surveyBot" },
	{ label: "Feedback Bot", value: "feedbackBot" },
];

// Color schemes for charts and badges
const colors = ["primary", "success", "warning", "error", "neutral"] as const;
// Functions
async function fetchStats() {
	if (!parentPostIdInput.value) {
		error.value = "Please enter a Parent Post ID";
		return;
	}

	loading.value = true;
	error.value = "";
	stats.value = null;

	try {
		const url = `/api/surveys/${encodeURIComponent(parentPostIdInput.value)}${
			bot.value ? `?bot=${encodeURIComponent(bot.value)}` : ""
		}`;
		const res = await $fetch(url);
		stats.value = res.stats;
		lastLoaded.value = new Date();
	} catch (err: any) {
		console.error(err);
		error.value = err?.data?.message || err?.message || "Failed to fetch survey stats";
	} finally {
		loading.value = false;
	}
}

function chartOption(pollStats: any) {
	const categories = pollStats.options;
	const data = categories.map((c: string) => pollStats.votes[c] ?? 0);

	// Calculate percentages for tooltip
	const total = pollStats.total_votes || 1;
	const percentages = data.map((value) => ((value / total) * 100).toFixed(1));

	return {
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "shadow" },
			formatter: (params: any[]) => {
				const param = params[0];
				const percentage = percentages[param.dataIndex];
				return `${param.name}<br/>${param.marker} ${param.seriesName}: ${param.value} (${percentage}%)`;
			},
		},
		xAxis: {
			type: "category",
			data: categories,
			axisLabel: {
				interval: 0,
				rotate: categories.some((c: string) => c.length > 15) ? 30 : 0,
				fontSize: 12,
			},
		},
		yAxis: { type: "value" },
		series: [
			{
				type: "bar",
				data,
				barWidth: "60%",
				itemStyle: {
					color: function (params: any) {
						const colors = [
							"#3b82f6",
							"#10b981",
							"#f59e0b",
							"#ef4444",
							"#8b5cf6",
							"#ec4899",
							"#6366f1",
							"#06b6d4",
						];
						return colors[params.dataIndex % colors.length];
					},
				},
				emphasis: {
					itemStyle: {
						shadowBlur: 10,
						shadowColor: "rgba(0, 0, 0, 0.5)",
					},
				},
			},
		],
		grid: {
			left: "3%",
			right: "3%",
			bottom: categories.some((c: string) => c.length > 15) ? "20%" : "10%",
			containLabel: true,
		},
	};
}

function getBadgeColor(index: number) {
	return colors[index % colors.length];
}

function getProgressColor(index: number) {
	return colors[index % colors.length];
}

function formatDate(ts: number) {
	try {
		const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return "Invalid date";
	}
}

function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) return "Just now";
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
	return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function exportData() {
	if (!stats.value) return;

	const dataStr = JSON.stringify(stats.value, null, 2);
	const dataBlob = new Blob([dataStr], { type: "application/json" });
	const url = URL.createObjectURL(dataBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `survey-${stats.value.surveyId}-${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
</script>
