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
                      :default-image-filename="defaultImageFileName"
                      :download-link="downloadLink"
                      :state="state"
                      @file-change="onFileChange"
                      @model-change="onModelChange" 
                      @waifu2x-start="onWaifu2xStart"
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
                      :processing-function="waifu2xProcessingFunction"
                      :state="state"
                      @processing-complete="onWaifu2xComplete"
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
      defaultImageFileName: "tom.jpg",
      waifu2xModelNames: Object.keys(waifu2x.MODEL_INFO_MAP),
      waifu2xModelNameSelected: "UpConv-7",
      waifu2xModel: null,
      waifu2xProcessingFunction: null,
      state: this.STATE.BEFORE_PROCESSING,
      downloadLink: null,
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
    onWaifu2xStart() {
      // const waifu2xWithTFTiming = (image, canvas) => waifu2x.tf_time(
      //                             waifu2x.enlarge_split_overlapped_no_async, 
      //                             image, canvas, 
      //                             this.waifu2xModel,
      //                             this.waifu2xModelInfo.margin_size,
      //                             this.waifu2xModelInfo.patch_size);

      let patchSize = this.waifu2xModelInfo.patch_size;
      if (/Mobi|Android/.test(navigator.userAgent)) {
        // mobile!
        patchSize = Math.round(patchSize / 2);
      }
 
      this.waifu2xProcessingFunction = (image, canvas) => waifu2x.enlarge_split_overlapped(
                                                            image, canvas, 
                                                            this.waifu2xModel,
                                                            this.waifu2xModelInfo.margin_size,
                                                            patchSize);
      this.state = this.STATE.PROCESSING;
    },

    onWaifu2xComplete(downloadLink) {
      this.state = this.STATE.AFTER_PROCESSING;
      this.downloadLink = downloadLink;
    },

    onModelChange(waifu2xModelNameSelected) {
      this.waifu2xModelNameSelected = waifu2xModelNameSelected;
      this.state = this.STATE.BEFORE_PROCESSING;
    },

    onFileChange(imageSrc) {
      this.imageSrc = imageSrc;
      this.state = this.STATE.BEFORE_PROCESSING;
    },
  },
};
</script>
