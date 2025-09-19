<template>
    <div class="absolute bottom-20 w-full -z-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 314" fill="none">
        <path class="path stroke-sky-500" d="M-2 252.5C126 252.5 280 262.5 223 306.5C197.338 326.309 139.94 179.325 223 164.5C314.547 148.161 561.5 321 475 306.5C388.5 292 515.5 155.5 591 210.5C666.5 265.5 727.5 184.5 735.5 145C746.078 92.7696 727.5 5.5 690 5.5C652.5 5.5 652.411 114 708.5 114C748.678 114 740.5 33 800 33" stroke="black" stroke-width="20"/>
        </svg>
    </div>
</template>

<style scoped>
.path {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: dash 3s ease-in-out 1 forwards;
}

@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
