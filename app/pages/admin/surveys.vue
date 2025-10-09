<template>
	<UContainer class="py-8 space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-neutral-900 dark:text-white">Survey Management</h1>
			<p class="text-lg text-neutral-600 dark:text-neutral-400 mt-2">
				Create, manage, and analyze your Mattermost surveys
			</p>
		</div>

		<!-- Stats Overview -->
		<UCard>
			<template #header>
				<h2 class="text-xl font-semibold text-neutral-900 dark:text-white">Overview</h2>
			</template>

			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<UCard
					class="text-center p-4 bg-gradient-to-br from-primary-50 to-cyan-50 dark:from-primary-900/20 dark:to-cyan-900/20"
				>
					<UIcon
						name="i-heroicons-document-text"
						class="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto"
					/>
					<div class="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
						{{ surveysData?.surveys?.length }}
					</div>
					<div class="text-sm text-neutral-600 dark:text-neutral-400">Total Surveys</div>
				</UCard>

				<UCard
					class="text-center p-4 bg-gradient-to-br from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20"
				>
					<UIcon
						name="i-heroicons-chart-bar"
						class="w-8 h-8 text-success-600 dark:text-success-400 mx-auto"
					/>
					<div class="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
						{{ openSurveysCount }}
					</div>
					<div class="text-sm text-neutral-600 dark:text-neutral-400">Active Surveys</div>
				</UCard>

				<UCard
					class="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
				>
					<UIcon
						name="i-heroicons-users"
						class="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto"
					/>
					<div class="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
						{{ totalResponses }}
					</div>
					<div class="text-sm text-neutral-600 dark:text-neutral-400">
						Total Responses
					</div>
				</UCard>

				<UCard
					class="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
				>
					<UIcon
						name="i-heroicons-clock"
						class="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto"
					/>
					<div class="text-2xl font-bold text-neutral-900 dark:text-white mt-2">
						{{ recentSurveysCount }}
					</div>
					<div class="text-sm text-neutral-600 dark:text-neutral-400">
						Recent (7 days)
					</div>
				</UCard>
			</div>
		</UCard>

		<!-- Main Content Tabs -->
		<UTabs :items="tabItems" v-model="selectedTab">
			<template #content="{ item }">
				<div v-if="!item.key || item.key === 'create'" class="space-y-6">
					<AdminMakeSurvey @survey-created="handleSurveyCreated" />
				</div>

				<div v-else-if="item.key === 'analytics'" class="space-y-6">
					<AdminSurveyAnalytics />
				</div>

				<div v-else-if="item.key === 'surveys'" class="space-y-6">
					<!-- Surveys Table -->
					<UCard>
						<template #header>
							<div
								class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
							>
								<div>
									<h3
										class="text-lg font-semibold text-neutral-900 dark:text-white"
									>
										Recent Surveys
									</h3>
									<p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
										Manage and view your survey results
									</p>
								</div>
								<div class="flex gap-2">
									<UInput
										v-model="searchQuery"
										placeholder="Search surveys..."
										icon="i-heroicons-magnifying-glass"
										class="min-w-64"
									/>
									<USelect
										v-model="statusFilter"
										:options="statusOptions"
										placeholder="Filter by status"
									/>
								</div>
							</div>
						</template>

						<UTable
							v-model:sort="sort"
							:columns="columns"
							:rows="filteredSurveys"
							:loading="loadingSurveys"
							class="w-full"
						>
							<!-- Status Column -->
							<template #status-data="{ row }">
								<UBadge
									:color="getStatusColor(row.status)"
									variant="subtle"
									class="capitalize"
								>
									{{ row.status }}
								</UBadge>
							</template>

							<!-- Questions Column -->
							<template #questions-data="{ row }">
								<div
									class="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400"
								>
									<UIcon
										name="i-heroicons-chat-bubble-left-right"
										class="w-4 h-4"
									/>
									<span>{{ row.questions }}</span>
								</div>
							</template>

							<!-- Responses Column -->
							<template #responses-data="{ row }">
								<div
									class="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400"
								>
									<UIcon name="i-heroicons-users" class="w-4 h-4" />
									<span>{{ row.responses }}</span>
								</div>
							</template>

							<!-- Actions Column -->
							<template #actions-data="{ row }">
								<div class="flex items-center gap-2">
									<UButton
										icon="i-heroicons-chart-bar"
										color="primary"
										variant="ghost"
										size="sm"
										:ui="{ base: 'rounded-md' }"
										@click="viewAnalytics(row)"
										label="Results"
									/>
									<UButton
										v-if="row.status === 'open'"
										icon="i-heroicons-lock-closed"
										color="warning"
										variant="ghost"
										size="sm"
										:ui="{ base: 'rounded-md' }"
										@click="closeSurvey(row)"
										:label="'Close'"
									/>
									<UButton
										v-else
										icon="i-heroicons-arrow-path"
										color="success"
										variant="ghost"
										size="sm"
										:ui="{ base: 'rounded-md' }"
										@click="reopenSurvey(row)"
										:label="'Reopen'"
									/>
									<UButton
										icon="i-heroicons-trash"
										color="error"
										variant="ghost"
										size="sm"
										:ui="{ base: 'rounded-md' }"
										@click="deleteSurvey(row)"
										:label="'Delete'"
									/>
								</div>
							</template>

							<!-- Empty State -->
							<template #empty-state>
								<div class="text-center py-8">
									<UIcon
										name="i-heroicons-document-text"
										class="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto"
									/>
									<h3
										class="mt-4 text-sm font-medium text-neutral-900 dark:text-white"
									>
										No surveys
									</h3>
									<p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
										Get started by creating a new survey.
									</p>
									<div class="mt-6">
										<UButton
											icon="i-heroicons-plus"
											label="Create Survey"
											@click="selectedTab = 'create'"
										/>
									</div>
								</div>
							</template>
						</UTable>

						<!-- Pagination -->
						<template #footer>
							<div
								class="flex flex-col sm:flex-row items-center justify-between gap-4"
							>
								<div class="text-sm text-neutral-500 dark:text-neutral-400">
									Showing {{ filteredSurveys?.length }} of
									{{ surveysData?.length }} surveys
								</div>
								<UPagination
									v-model="page"
									:page-count="pageCount"
									:total="filteredSurveys?.length"
								/>
							</div>
						</template>
					</UCard>
				</div>
			</template>
		</UTabs>

		<!-- Analytics Modal -->
		<UModal v-model="showAnalyticsModal" :ui="{ base: 'w-full max-w-7xl' }">
			<UCard>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
							Survey Analytics: {{ selectedSurvey?.title }}
						</h3>
						<UButton
							icon="i-heroicons-x-mark"
							color="neutral"
							variant="ghost"
							@click="showAnalyticsModal = false"
						/>
					</div>
				</template>

				<AdminSurveyAnalytics
					v-if="selectedSurvey"
					:key="selectedSurvey.id"
					:parent-post-id="selectedSurvey.parentPostId"
					:bot="selectedSurvey.bot"
				/>
			</UCard>
		</UModal>

		<!-- Close Survey Modal -->
		<UModal v-model="showCloseModal">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
							Close Survey
						</h3>
					</template>

					<p class="text-neutral-600 dark:text-neutral-400">
						Are you sure you want to close "{{ selectedSurvey?.title }}"? This will
						prevent any further responses.
					</p>

					<template #footer>
						<div class="flex justify-end gap-3">
							<UButton
								label="Cancel"
								color="neutral"
								variant="ghost"
								@click="showCloseModal = false"
							/>
							<UButton
								label="Close Survey"
								color="error"
								@click="confirmCloseSurvey"
							/>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- Delete Survey Modal -->
		<UModal v-model="showDeleteModal">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
						Delete Survey
					</h3>
				</template>

				<p class="text-neutral-600 dark:text-neutral-400">
					Are you sure you want to delete "{{ selectedSurvey?.title }}"? This action
					cannot be undone.
				</p>

				<template #footer>
					<div class="flex justify-end gap-3">
						<UButton
							label="Cancel"
							color="neutral"
							variant="ghost"
							@click="showDeleteModal = false"
						/>
						<UButton label="Delete Survey" color="error" @click="confirmDeleteSurvey" />
					</div>
				</template>
			</UCard>
		</UModal>
	</UContainer>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
	middleware: "admin",
	layout: "admin",
});

// Types
interface Survey {
	id: string;
	title: string;
	channelId: string;
	parentPostId: string;
	bot: string;
	status: "open" | "closed";
	questions: number;
	responses: number;
	createdAt: string;
	updatedAt: string;
}

// Composables
const { $toast } = useNuxtApp();

// State
const selectedTab = ref("create");
const loadingSurveys = ref(false);
const selectedSurvey = ref<Survey | null>(null);
const searchQuery = ref("");
const statusFilter = ref("all");
const page = ref(1);
const pageCount = 10;

// Modal states
const showAnalyticsModal = ref(false);
const showCloseModal = ref(false);
const showDeleteModal = ref(false);

const { data: surveysData, refresh } = useFetch("/api/mattermost/surveys");
// Table configuration
const sort = ref({ column: "createdAt", direction: "desc" as const });

const columns: TableColumn<any>[] = [
	{
		accessorKey: "title",
		header: "Survey Title",
	},
	{
		accessorKey: "channelId",
		header: "Channel ID",
	},
	{
		accessorKey: "status",
		header: "Status",
	},
	{
		accessorKey: "questions",
		header: "Questions",
	},
	{
		accessorKey: "responses",
		header: "Responses",
	},
	{
		accessorKey: "createdAt",
		header: "Created",
	},
	{
		accessorKey: "actions",
		header: "Actions",
	},
];

const tabItems = [
	{ key: "create", label: "Create Survey" },
	{ key: "surveys", label: "Manage Surveys" },
	{ key: "analytics", label: "Analytics" },
];

const statusOptions = [
	{ label: "All Status", value: "all" },
	{ label: "Open", value: "open" },
	{ label: "Closed", value: "closed" },
];

const filteredSurveys = computed(() => {
	let filtered = surveysData.value?.surveys;
	// Apply search filter
	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered?.filter(
			({ results: survey }: any) =>
				survey?.title.toLowerCase().includes(query) ||
				survey?.channelId.toLowerCase().includes(query) ||
				survey?.parentPostId.toLowerCase().includes(query)
		);
	}

	// Apply status filter
	if (statusFilter.value !== "all") {
		filtered = filtered?.filter((survey) => survey.status === statusFilter.value);
	}

	// Apply sorting
	const { column, direction } = sort.value;
	// if (column) {
	// 	filtered = filtered?.sort((a, b) => {
	// 		let aVal = a[column as keyof Survey];
	// 		let bVal = b[column as keyof Survey];

	// 		// Handle date sorting
	// 		if (column === "createdAt" || column === "updatedAt") {
	// 			aVal = new Date(aVal as string).getTime();
	// 			bVal = new Date(bVal as string).getTime();
	// 		}

	// 		if (aVal < bVal) return direction === "asc" ? -1 : 1;
	// 		if (aVal > bVal) return direction === "asc" ? 1 : -1;
	// 		return 0;
	// 	});
	// }

	return filtered;
});

const openSurveysCount = computed(
	() => surveysData.value?.surveys.filter((s) => s.status === "open")?.length
);

const recentSurveysCount = computed(() => {
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
	return surveysData.value?.surveys.filter((s) => new Date() > oneWeekAgo)?.length;
});

const totalResponses = computed(() =>
	surveysData.value?.surveys.reduce((sum, survey) => sum + survey.results, 0)
);

// Functions
function getStatusColor(status: string): any {
	const colors: Record<string, string> = {
		open: "success",
		closed: "neutral",
	};
	return colors[status] || "neutral";
}

function viewAnalytics(survey: Survey) {
	selectedSurvey.value = survey;
	showAnalyticsModal.value = true;
}

function closeSurvey(survey: Survey) {
	selectedSurvey.value = survey;
	showCloseModal.value = true;
}

function reopenSurvey(survey: Survey) {
	selectedSurvey.value = survey;
	// Implement reopen logic
	updateSurveyStatus(survey.id, "open");
}

function deleteSurvey(survey: Survey) {
	selectedSurvey.value = survey;
	showDeleteModal.value = true;
}

async function confirmCloseSurvey() {
	if (!selectedSurvey.value) return;

	try {
		await updateSurveyStatus(selectedSurvey.value.id, "closed");
		showCloseModal.value = false;
		$toast.success("Survey closed successfully");
	} catch (error) {
		console.error("Failed to close survey:", error);
		$toast.error("Failed to close survey");
	}
}

async function confirmDeleteSurvey() {
	if (!selectedSurvey.value) return;

	try {
		// Replace with your actual API endpoint
		await $fetch(`/api/surveys/${selectedSurvey.value.id}`, {
			method: "DELETE",
		});

		refresh();
		showDeleteModal.value = false;
		$toast.success("Survey deleted successfully");
	} catch (error) {
		console.error("Failed to delete survey:", error);
		$toast.error("Failed to delete survey");
	}
}

async function updateSurveyStatus(surveyId: string, status: "open" | "closed") {
	// Replace with your actual API endpoint
	await $fetch(`/api/surveys/${surveyId}/status`, {
		method: "PATCH",
		body: { status },
	});

	// Update local state
	refresh();
}

function handleSurveyCreated(newSurvey: any) {
	// Add the new survey to the list
	const survey: Survey = {
		id: newSurvey.surveyId,
		title: newSurvey.title,
		channelId: newSurvey.channelId,
		parentPostId: newSurvey.parentPostId,
		bot: newSurvey.bot,
		status: "open",
		questions: newSurvey.questions?.length || 0,
		responses: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	refresh();
	selectedTab.value = "surveys";
	$toast.success("Survey created successfully!");
}
</script>

<style scoped>
/* Custom styles for better mobile experience */
@media (max-base: 640px) {
	:deep(.table-container) {
		overflow-x: auto;
	}
}
</style>
