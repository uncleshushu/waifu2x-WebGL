<template>
  <v-app id="waifu2x">

    <v-toolbar app color='pink lighten-2'>
      <v-toolbar-title class="headline text-uppercase">
        <span>waifu2x</span>
        <span class="font-weight-light">-WebGL</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn flat href="https://github.com/vuetifyjs/vuetify/releases/latest" target="_blank">
        <span class="mr-2">Github Repo</span>
      </v-btn>
    </v-toolbar>

    <v-content>
      <v-container fluid grid-list-lg>
        <v-layout justify-center>

          <v-flex md10 lg8 xl6>
            <v-card color="teal lighten-5">
              <v-container fluid grid-list-lg>
                <v-layout justify-center align-center row wrap>
                  
                  <v-flex xs8 sm6>
                    <SettingPanel
                      ref="settingPanel"
                      :default-model-selected="waifu2xModelNameSelected"
                      :model-names="waifu2xModelNames"
                      @file-change="onFileChange"
                      @model-change="onModelChange" 
                      @start-waifu2x="onStartWaifu2x"
                    />
                  </v-flex>

                  <v-flex xs6>
                    <ImagePreview
                      ref="preview"
                      :src="imageSrc"
                    />
                  </v-flex>

                  <v-flex xs12>      
                    <ProcessingCanvas
                      ref="canvas"
                      :imgsrc="imageSrc"
                    />
                  </v-flex>

                </v-layout>
              </v-container>         
            </v-card>  
          </v-flex>

        </v-layout>
      </v-container>
    </v-content>
    
  </v-app>
</template>

<script>
import SettingPanel from "./components/setting-panel";
import ImagePreview from "./components/image-preview";
import ProcessingCanvas from "./components/processing-canvas";

import waifu2x from "./utils/waifu2x.js";

export default {
  name: "App",

  components: {
    SettingPanel,
    ImagePreview,
    ProcessingCanvas,
  },

  data() {
    return {
      imageSrc: require("./assets/tom.jpg"),
      imageName: "tom",
      waifu2xModelNames: Object.keys(waifu2x.MODEL_INFO_MAP),
      waifu2xModelNameSelected: "UpConv-7",
      waifu2xModel: null,
    };
  },

   created: async function() {
    this.waifu2xModel =  await waifu2x.loadModel(this.waifu2xModelPath);
  },

  computed: {
    waifu2xModelInfo() {
      return waifu2x.MODEL_INFO_MAP[this.waifu2xModelNameSelected];
    },

    waifu2xModelPath() {
      return `${process.env.BASE_URL}tfjs_models/${this.waifu2xModelInfo.dir_name}/model.json`;
    }
  },

  watch: {
    waifu2xModelNameSelected: async function() {
      if(this.waifu2xModel){
        this.waifu2xModel.dispose();
      }
      this.waifu2xModel =  await waifu2x.loadModel(this.waifu2xModelPath);
    },
  },

  methods: {
    async onStartWaifu2x(updatePanel) {
      // const waifu2xWithTFTiming = (image, canvas) => waifu2x.tf_time(
      //                             waifu2x.enlarge_split_overlapped_no_async, 
      //                             image, canvas, 
      //                             this.waifu2xModel,
      //                             this.waifu2xModelInfo.margin_size,
      //                             this.waifu2xModelInfo.patch_size);

      // await this.$refs.canvas.processImage(waifu2xWithTFTiming);

      let patchSize = this.waifu2xModelInfo.patch_size;
      if (/Mobi|Android/.test(navigator.userAgent)) {
        // mobile!
        patchSize = Math.round(patchSize / 2);
      }
 
      const waifu2xProcess = (image, canvas) => waifu2x.enlarge_split_overlapped(
                                image, canvas, 
                                this.waifu2xModel,
                                this.waifu2xModelInfo.margin_size,
                                patchSize);
      await this.$refs.canvas.processImage(waifu2xProcess);
      updatePanel();
    },

    onModelChange(waifu2xModelNameSelected) {
      this.waifu2xModelNameSelected = waifu2xModelNameSelected;
      this.$refs.canvas.preview();
    },

    onFileChange(imageSrc, imageName) {
      this.imageSrc = imageSrc;
      this.imageName = imageName;
    },
  },
};
</script>
