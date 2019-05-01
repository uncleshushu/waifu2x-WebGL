<template>
  <v-card ref="vcard">

    <canvas ref="canvas"></canvas>
    
    <v-card-title primary-title>
      State: {{state}}
    </v-card-title>

    <v-card-title primary-title>
      Original Size: {{imageWidth}} × {{imageHeight}}
    </v-card-title>

    <v-card-title primary-title>
      Scaled Size: {{imageWidth * 2}} × {{imageHeight * 2}}
    </v-card-title>

    <v-card-title primary-title ref="timeInfo">  
      <div>Time: {{wallTimeSecond}} s</div>
    </v-card-title>

  </v-card>
</template>

<script>
export default {
  props: {
    imgsrc: String,
  },

  data: () => ({ 
      state: "Before processing",
      imageWidth: 0,
      imageHeight: 0,
      kernelTimeSecond: 0,
      wallTimeSecond: 0,
  }),

  computed: {
    image: function() {
      let image = new Image();
      image.src = this.imgsrc;
      return image;
    },

    canvas: function() {
      return this.$refs.canvas;
    },

    context: function() {
      return this.canvas.getContext("2d");
    },
  },

  watch: {
    imgsrc: function(){
      this.image.onload = this.preview;
    },
  },

  created: function(){
    this.image.onload = this.preview;
  },

  methods: {
    preview() { 
      this.state = "Before processing";
      this.imageWidth = this.image.naturalWidth;
      this.imageHeight = this.image.naturalHeight;
      this.wallTimeSecond = 0;
      this.canvas.width = this.image.naturalWidth * 2;
      this.canvas.height = this.image.naturalHeight * 2;
      this.context.globalAlpha = 0.5;
      this.context.drawImage(this.image, 0, 0, 
                              this.canvas.width,
                              this.canvas.height);
    },

    async processImage(processFunction) {
      if(this.context.globalAlpha == 1.0){
        this.preview();
      }

      this.state = "Processing..."
      this.context.globalAlpha = 1.0;
      const timeStart = performance.now();
      let timerID = setInterval(() => this.wallTimeSecond += 1, 1000);
      await processFunction(this.image, this.context);
      clearInterval(timerID);
      const timeEnd = performance.now();
      this.wallTimeSecond = ((timeEnd - timeStart) / 1000).toFixed(2);
      this.state = "Processing complete";
      
      // const timeInfo = await processFunction(this.image, this.$refs.canvas);
      // this.kernelTimeSecond = (timeInfo.kernelMs / 1000).toFixed(2);
      // this.wallTimeSecond = (timeInfo.wallMs / 1000).toFixed(2);
      // /* eslint-disable no-console */
      // console.log(`kernelMs: ${timeInfo.kernelMs}, wallTimeMs: ${timeInfo.wallMs}`);
    },
  },
};
</script>

<style scoped>
canvas {
  width: 100%;
  height: auto;
}
</style>
