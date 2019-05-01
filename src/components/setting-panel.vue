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
            {{fileNameDisplay}}
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
            @click="onStartWaifu2x()"
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
            @click=";"
          >
            Download
            <v-icon right>cloud_download</v-icon>
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
  },

  data() {
    return {
      modelSelectDisabled: false,
      modelSelected: this.defaultModelSelected,
      fileInputDisabled: false,
      fileName: "tom.jpg",
      startDisabled: false,
      startButtonText: "Run waifu2x",
      downloadDisabled: true,
    };
  },

  computed: {
    imageName() {
      return this.fileName.substring(0, this.fileName.lastIndexOf("."));
    },

    fileNameDisplay() {
      if(this.imageName.length > 8){
        const extension = this.fileName.substring(this.fileName.lastIndexOf("."));
        return this.imageName.substring(0, 3) + "..." + this.imageName.substring(this.imageName.length - 3) + extension;
      }
      else{
        return this.fileName;
      }
    },
  },

  methods: {
    onStartWaifu2x() {
      this.startDisabled = true;
      this.startButtonText = "Running..."
      this.fileInputDisabled = true;
      this.modelSelectDisabled = true;
      this.downloadDisabled = true;

      let self = this;
      this.$emit("start-waifu2x", () => {
        self.startDisabled = false;
        self.startButtonText = "Rerun waifu2x";
        self.fileInputDisabled = false;
        self.modelSelectDisabled = false;
        self.downloadDisabled = false;
      });
    },

    onModelChange() {
      this.startButtonText = "Run waifu2x";
      this.downloadDisabled = true;
      this.$emit('model-change', this.modelSelected);
    },

    onFileChange(event) {
      const imageFile = event.target.files[0];
      this.fileName = imageFile.name;
      const imageSrc = window.URL.createObjectURL(imageFile);
      this.startButtonText = "Run waifu2x";
      this.downloadDisabled = true;
      this.$emit("file-change", imageSrc, this.imageName);
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