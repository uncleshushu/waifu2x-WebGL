import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'

import StateEnum from './plugins/state-enum'
Vue.use(StateEnum)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
