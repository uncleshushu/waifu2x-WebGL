<template>
  <v-card>
    <v-container fluid grid-list-md>
      <v-layout justify-sapce-between align-center row wrap>
        
        <v-flex sm6>
          <div>Choose an image</div>
          <v-btn
            :disabled="fileInputDisabled"
            block
            depressed
            @click="$refs.fileInput.click()"
          >
            {{imageFilenameDisplay}}
            <input 
              type="file"
              ref="fileInput"
              accept="image/*"
              style="display:none"
              @change="onFileChange"
            />
          </v-btn>   
        </v-flex>

        <v-flex sm6>
          <div>Select a method</div>
          <v-select
            class="compact-v-select"
            :disabled="modelSelectDisabled"
            v-model="modelSelected"
            :items="modelNames"
            @change="onModelChange"
          >
          </v-select>
        </v-flex>

        <v-flex sm6>
          <v-btn
            :disabled="startDisabled"
            block
            round
            class="pink--text"
            @click="onWaifu2xStart()"
          >
            {{startButtonText}}
          </v-btn>
        </v-flex>

        <v-flex sm6>
          <v-btn
            :disabled="downloadDisabled"
            block
            round
            class="teal--text"
            @click="$refs.downloadAnchor.click()"
          >
            Download
            <v-icon right>cloud_download</v-icon>
            <a 
              ref="downloadAnchor" 
              :href="downloadLink" 
              :download="processedImageFileName"
            >
            </a>
          </v-btn>
        </v-flex>

      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
export default {
  props: {
    modelNames: Array,
    defaultModelSelected: String,
    defaultImageFilename: String,
    state: Number,
    downloadLink: String,
  },

  data() {
    return {
      modelSelectDisabled: false,
      modelSelected: this.defaultModelSelected,
      fileInputDisabled: false,
      imageFileName: this.defaultImageFilename,
      imageSrc: null,
      startDisabled: false,
      startButtonText: "Run waifu2x",
      downloadDisabled: true,
    };
  },

  computed: {
    imageName() {
      return this.imageFileName.substring(0, this.imageFileName.lastIndexOf("."));
    },

    imageFilenameDisplay() {
      if(this.imageName.length > 8){
        const extension = this.imageFileName.substring(this.imageFileName.lastIndexOf("."));
        return this.imageName.substring(0, 3) + "..." + this.imageName.substring(this.imageName.length - 3) + extension;
      }
      else{
        return this.imageFileName;
      }
    },

    processedImageFileName() {
      return this.imageName + "_" + this.modelSelected + ".png";
    },
  },

  watch: {
    state: function(){
      switch(this.state){
        case this.STATE.BEFORE_PROCESSING:
          this.startButtonText = "Run waifu2x";
          this.downloadDisabled = true;
          break;

        case this.STATE.PROCESSING:
          this.startDisabled = true;
          this.startButtonText = "Running..."
          this.fileInputDisabled = true;
          this.modelSelectDisabled = true;
          this.downloadDisabled = true;
          break;

        case this.STATE.AFTER_PROCESSING:
          this.startDisabled = false;
          this.startButtonText = "Rerun waifu2x";
          this.fileInputDisabled = false;
          this.modelSelectDisabled = false;
          this.downloadDisabled = false;
          break;
      }
    },
  },

  methods: {
    onWaifu2xStart() {
      this.$emit("waifu2x-start");
    },

    onModelChange() {
      this.$emit('model-change', this.modelSelected);
    },

    onFileChange(event) {
      const imageFile = event.target.files[0];
      this.imageFileName = imageFile.name;
      window.URL.revokeObjectURL(this.imageSrc);
      this.imageSrc = window.URL.createObjectURL(imageFile);
      this.$emit("file-change", this.imageSrc);
    },
  },
};
</script>

<style>
.compact-v-select {
  margin-top: 6px;
  margin-bottom: 6px;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
}

.v-input__slot{
  margin-bottom: 0px;
  height: 36px;
}

.v-text-field__details{
  height: 0;
}

.v-select__selections{
  padding-left: 4px;
}
</style>