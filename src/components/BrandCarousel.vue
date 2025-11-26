<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";

const props = defineProps({
  id: { type: String, required: true },
  height: { type: Number, default: 44 },
  width: { type: Number, default: 240 },
  interval: { type: Number, default: 2000 },
});


const slides = computed(() => ([
  { src: new URL("@/assets/Logo XT Servicios.png", import.meta.url).href, alt: "Logo XT Servicios" },
  { src: new URL("@/assets/xtreme mining con fondo.jpg", import.meta.url).href, alt: "Xtreme Mining" },
  { src: new URL("@/assets/Xtreme Hormigoenes y mortero.png", import.meta.url).href, alt: "Xtreme Hormigones y Mortero" },
]));

const carouselEl = ref(null);
let carouselInst = null;

function startCarousel() {
  const Carousel = window.bootstrap?.Carousel;
  if (!Carousel || !carouselEl.value) return;


  carouselInst?.dispose();
  carouselInst = Carousel.getOrCreateInstance(carouselEl.value, {
    interval: props.interval,
    ride: "carousel",
    pause: false,
    touch: true,
    wrap: true,
  });


  carouselInst.cycle();
}

onMounted(() => startCarousel());
watch(() => props.interval, () => startCarousel());

onBeforeUnmount(() => {
  carouselInst?.dispose();
  carouselInst = null;
});
</script>

<template>
  <div
    class="xt-carousel"
    :style="{ width: width + 'px' }"
    role="region"
    aria-label="Carrusel de logos"
  >
    <div
      ref="carouselEl"
      class="carousel slide carousel-fade"
      :id="id"
    >
      <div class="carousel-inner">
        <div
          v-for="(s, i) in slides"
          :key="s.src"
          class="carousel-item"
          :class="{ active: i === 0 }"
        >
          <div class="xt-frame" :style="{ height: height + 'px' }">
            <img :src="s.src" :alt="s.alt" class="xt-img" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.xt-carousel{
  display: inline-flex;
  align-items: center;
}


.xt-frame{
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 0;
  position: relative;
  padding: 0 16px;
  background: var(--xt-red, #c62828);
}


.xt-img{
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}


.carousel-indicators,
.carousel-control-prev,
.carousel-control-next{
  display: none !important;
}


.carousel-item{
  transition: opacity .35s ease-in-out;
}


.xt-frame::before,
.xt-frame::after{
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 26px;
  pointer-events: none;
  z-index: 2;
}


.xt-frame::before{
  left: 0;
  background: linear-gradient(
    to right,
    var(--xt-red, #c62828) 35%,
    rgba(198, 40, 40, 0) 100%
  );
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.xt-frame::after{
  right: 0;
  background: linear-gradient(
    to left,
    var(--xt-red, #c62828) 35%,
    rgba(198, 40, 40, 0) 100%
  );
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
</style>
