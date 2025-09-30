<template>
	<div class="p-6">
		<UContainer>
			<div class="grid gap-6">
				<!-- Header -->
				<div class="flex justify-between items-center">
					<h1 class="text-2xl font-bold">Analytics Dashboard</h1>
				</div>

				<!-- Stats Cards -->
				<div class="grid md:grid-cols-3 gap-6">
					<UCard>
						<div class="text-center">
							<div class="text-sm text-gray-400">Total Sign-ups</div>
							<div class="text-3xl font-bold mt-2">
								{{ userCount?.total_users_count }}
							</div>
						</div>
					</UCard>

					<UCard>
						<div class="text-center">
							<div class="text-sm text-gray-400">This Week's Sign-ups</div>
							<div class="text-3xl font-bold mt-2">{{ weeklySignups }}</div>
						</div>
					</UCard>

					<UCard>
						<div class="text-center">
							<div class="text-sm text-gray-400">Active Users</div>
							<div class="text-3xl font-bold mt-2">{{ activeUsers }}</div>
						</div>
					</UCard>
				</div>

				<!-- Charts -->
				<div class="grid md:grid-cols-2 gap-6">
					<!-- Sign-up Trend -->
					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold">Weekly Sign-up Trend</h3>
						</template>
						<ClientOnly>
							<VChart :option="signupTrendOptions" class="!h-[400px]" />
						</ClientOnly>
					</UCard>

					<UCard>
						<template #header>
							<h3 class="text-lg font-semibold">Top Referrers</h3>
						</template>
						<ClientOnly>
							<VChart :option="referralOptions" class="!h-[400px]" />
						</ClientOnly>
					</UCard>
				</div>

				<UCard>
					<template #header>
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-semibold">System Users</h3>
							<UInput
								v-model="search"
								icon="i-heroicons-magnifying-glass"
								placeholder="Search users..."
							/>
						</div>
					</template>

					<UTable :columns="columns" :rows="users">
						<template #actions-data="{ row }">
							<UButton
								v-if="!row.getValue('create_at')"
								color="error"
								variant="ghost"
								icon="i-heroicons-trash"
								size="xs"
								@click="unsubscribeUser(row.getValue('id'))"
							>
								Unsubscribe
							</UButton>
						</template>
					</UTable>
				</UCard>
			</div>
		</UContainer>
	</div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { MMUser } from "~~/server/utils/mattermost";

definePageMeta({
	middleware: "admin",
});

const search = ref("");

const columns: TableColumn<MMUser>[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
  {
    accessorKey: "username",
    header: "Email",
    cell: (info) => info.getValue(),
  },
	{
		accessorKey: "email",
		header: "Email",
		cell: (info) => info.getValue(),
	},
	{
		accessorKey: "create_at",
		header: "Joined",
		cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
		enableSorting: true,
	},
	{
		id: "actions",
		header: "Actions",
		cell: (info) => {
			return h(
				"button",
				{ onClick: () => console.log("clicked row", info.row.original) },
				"View"
			);
		},
	},
];

interface ReferralCount {
	name: string;
	value: number;
}

// Chart options
const weeklyLabels = ref<string[]>([]);
const referralData = ref<ReferralCount[]>([]);

const signupTrendOptions = computed(
	() =>
		({
			tooltip: {
				trigger: "axis",
			},
			xAxis: {
				type: "category",
				data: weeklyLabels.value,
			},
			yAxis: {
				type: "value",
			},
			series: [
				{
					data: weeklyData.value,
					type: "line",
					smooth: true,
				},
			],
		} satisfies ECOption)
);

const referralOptions = computed(
	() =>
		({
			tooltip: {
				trigger: "item",
			},
			series: [
				{
					type: "pie",
					radius: ["40%", "70%"],
					data: referralData.value,
				},
			],
		} satisfies ECOption)
);

const page = ref(0);
const { data: users } = useFetch<MMUser[]>("/mattermost/api/v4/users", {
	query: {
		page,
		active: true,
	},
});

export interface Stats {
	total_calls: number;
	total_active_calls: number;
	total_active_sessions: number;
	calls_by_day: { [key: string]: number };
	calls_by_month: { [key: string]: number };
	calls_by_channel_type: CallsByChannelType;
	avg_duration: number;
	avg_participants: number;
	recording_jobs_by_day: { [key: string]: number };
	recording_jobs_by_month: { [key: string]: number };
}

export interface CallsByChannelType {
	D: number;
}

const { data: countData } = useFetch<Stats>("/mattermost/plugins/com.mattermost.calls/stats");

const { data: userCount } = useFetch<{ total_users_count: number }>(
	"/mattermost/api/v4/users/stats"
);

const activeUsers = computed(() => {
	return countData.value?.total_active_sessions || 0;
});
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const weeklySignups = computed(() => {
	return users.value?.filter((user) => new Date(user.create_at) > weekAgo).length;
});

const last8Weeks = Array.from({ length: 8 }, (_, i) => {
	const date = new Date(now.getTime() - (7 - i) * 7 * 24 * 60 * 60 * 1000);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});
const weeklyData = computed(() => {
	return last8Weeks.map(
		(week) =>
			users.value?.filter(
				(user) =>
					new Date(user.create_at).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
					}) === week
			).length
	);
});

const toast = useToast();
async function unsubscribeUser(userId: string) {
	const { error } = await execute(
		$fetch(`/mattermost/api/v4/users/${userId}/unsubscribe`, {
			method: "POST",
		})
	);

	if (error) {
		toast.add({
			title: error.message,
			color: "error",
		});
		return;
	}

	toast.add({
		title: "User unsubscribed",
		color: "success",
	});
}

watch(users, console.log)
</script>
