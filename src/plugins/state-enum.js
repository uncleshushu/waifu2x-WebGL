const State = {
  BEFORE_PROCESSING: 0,
  PROCESSING: 1,
  AFTER_PROCESSING: 2,
};
Object.freeze(State);


export default {
  install(Vue) {
    Vue.prototype.STATE = State;
  },
}