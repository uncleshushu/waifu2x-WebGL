<template>
  <v-card ref="vcard">

    <canvas ref="canvas"></canvas>
    
    <v-card-title primary-title>
      State: {{stateString}}
    </v-card-title>

    <v-card-title primary-title>
      Original Size: {{image.width}} × {{image.height}}
    </v-card-title>

    <v-card-title primary-title>
      Scaled Size: {{image.width * 2}} × {{image.height * 2}}
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
    processingFunction: Function,
    state: Number,
  },

  data: () => ({ 
      stateString: "Before processing",
      image: new Image(),
      kernelTimeSecond: 0,
      wallTimeSecond: 0,
  }),

  computed: {
    canvas: function() {
      return this.$refs.canvas;
    },

    context2D: function() {
      return this.canvas.getContext("2d");
    },
  },

  watch: {
    imgsrc: function(){
      let image = new Image();
      image.src = this.imgsrc;
      image.onload = () => {
        this.image = image;
        this.preview();
      };
    },

    state: function(){
      switch(this.state){
        case this.STATE.BEFORE_PROCESSING:
          this.stateString = "Before processing";
          this.wallTimeSecond = 0;
          this.preview();
          break;

        case this.STATE.PROCESSING:
          this.stateString = "Processing...";
          this.processImage();
          break;

        case this.STATE.AFTER_PROCESSING:
          this.stateString = "Processing complete";
          break;
      }
    }
  },

  created: function(){
    let image = new Image();
    image.src = this.imgsrc;
    image.onload = () => {
      this.image = image;
      this.preview();
    };
  },

  methods: {
    preview() { 
      this.canvas.width = this.image.naturalWidth * 2;
      this.canvas.height = this.image.naturalHeight * 2;
      this.context2D.globalAlpha = 0.5;
      this.context2D.drawImage(this.image, 0, 0, 
                              this.canvas.width,
                              this.canvas.height);
    },

    async processImage() {
      if(this.context2D.globalAlpha == 1.0){
        // rerun 
        this.preview();
      }

      this.wallTimeSecond = 0;
      const timeStart = performance.now();
      let timerID = setInterval(() => this.wallTimeSecond += 1, 1000);

      this.context2D.globalAlpha = 1.0;
      await this.processingFunction(this.image, this.context2D);
      
      clearInterval(timerID);
      const timeEnd = performance.now();
      this.wallTimeSecond = ((timeEnd - timeStart) / 1000).toFixed(2);
      // must emit here, not outside (unless `processImage` is awaited)
      this.$emit("processing-complete");
      
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
