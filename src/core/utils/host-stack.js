/**
* Helper api for enqueing client dom created by a host element.
*
* By default elements are flushed via `_flushProperties` when
* `connectedCallback` is called. Elements attach their client dom to
* themselves at `ready` time which results from this first flush.
* This provides an ordering guarantee that the client dom an element
* creates is flushed before the element itself (i.e. client `ready`
* fires before host `ready`).
*
* However, if `_flushProperties` is called *before* an element is connected,
* as for example `Templatize` does, this ordering guarantee cannot be
* satisfied because no elements are connected. (Note: Bound elements that
* receive data do become enqueued clients and are properly ordered but
* unbound elements are not.)
*
* To maintain the desired "client before host" ordering guarantee for this
* case we rely on the "host stack. Client nodes registers themselves with
* the creating host element when created. This ensures that all client dom
* is readied in the proper order, maintaining the desired guarantee.
*
* @private
*/

export default {
  stack: [],

  /**
   * @param {*} inst Instance to add to hostStack
   * @this {hostStack}
   */
  registerHost (inst) {
    if (this.stack.length) {
      let host = this.stack[this.stack.length - 1];
      host._enqueueClient(inst);
    }
  },

  /**
   * @param {*} inst Instance to begin hosting
   * @this {hostStack}
   */
  beginHosting (inst) {
    this.stack.push(inst);
  },

  /**
   * @param {*} inst Instance to end hosting
   * @this {hostStack}
   */
  endHosting (inst) {
    let stackLen = this.stack.length;
    if (stackLen && this.stack[stackLen - 1] === inst) {
      this.stack.pop();
    }
  }
};
