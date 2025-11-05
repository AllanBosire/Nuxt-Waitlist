<template>
  <div>
    <h3 class="font-bold">User Detaills</h3>
    <div class="flex border border-gray-200 m-4 rounded-md pl-8 py-4 shadow-xl">
      <div class="grow-1">
        <div class="flex">
          <span class="pr-16">Username:</span>
          <span>{{ referrerUsername }}</span>
        </div>
        <div class="flex">
          <span class="pr-16">Email:</span>
          <span>{{ referrer.email }}</span>
        </div>
      </div>
      <div class="grow-1">
        <div class="flex">
          <span class="pr-25">Referrer:</span>
          <span>{{ referredBy }}</span>
        </div>
        <div class="flex">
          <span class="pr-16">Date Created:</span>
          <span>{{ referrer.createdAt }}</span>
        </div>
      </div>
    </div>
  </div>

  <h2 class="text-2xl mt-16">List of referrals</h2>
  <ul>
    <!-- <li>ID</li>
    <li>Username</li>
    <li>Email</li>
    <li>Date</li>
    <li>Referrer</li> -->
  </ul>

  <UTable :data="referees"></UTable>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: "admin",
  layout: "admin",
});

const param = useRouteParam("referrer");
const { data: referrer } = await useFetch(
  `/api/referrals/referees/${param.value}`
);

const referrerMMObj = await useFetch("/api/mattermost/Users/getByEmail", {
  method: "POST",
  body: JSON.stringify({ email: referrer.value.email }),
});

const { data: referrersReferrerMM } = await useFetch(
  "/api/mattermost/Users/getById",
  {
    method: "POST",
    body: JSON.stringify({ id: referrer.value?.referrer }),
  }
);

const referredBy = referrersReferrerMM.value?.username;

const referrerUsername = referrerMMObj.data.value?.username || "";

const { data: referees } = await useFetch(
  `/api/referrals/referrers/referees-list`,
  {
    method: "POST",
    body: JSON.stringify({ id: referrerMMObj.data.value.id }),
  }
);
console.log(referrerMMObj.data.value);
console.log(referrer.value?.referrer);
</script>
