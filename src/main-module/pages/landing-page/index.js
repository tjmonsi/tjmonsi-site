import { ElementMixin } from '../../../core/mixins/element-mixin';
import template from './template.js';

class LandingPage extends ElementMixin(window.HTMLElement) {
  static get is () { return 'landing-page'; }

  template () {
    return template(this);
  }
}

window.customElements.define(LandingPage.is, LandingPage)