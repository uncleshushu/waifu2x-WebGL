<template>
  <v-card>
    
    <v-img :src="src"></v-img>

  </v-card>
</template>

<script>
export default {
  props: {
    src: String,
  },

  data: () => {
    return {};
  },
};
</script>