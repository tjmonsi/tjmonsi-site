import { ElementMixin } from '../../mixins/element-mixin';
import A11yKeysMixin from '../../mixins/a11y-keys-mixin';
import { timeOut } from '@polymer/polymer/lib/utils/async';
import template from './template';

var Utility = {
  distance: function (x1, y1, x2, y2) {
    var xDelta = (x1 - x2);
    var yDelta = (y1 - y2);

    return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
  },

  now: window.performance && window.performance.now
    ? window.performance.now.bind(window.performance) : Date.now
};

/**
 * @param {HTMLElement} element
 * @constructor
 */
function ElementMetrics (element) {
  this.element = element;
  this.width = this.boundingRect.width;
  this.height = this.boundingRect.height;

  this.size = Math.max(this.width, this.height);
}

ElementMetrics.prototype = {
  get boundingRect () {
    return this.element.getBoundingClientRect();
  },

  furthestCornerDistanceFrom: function (x, y) {
    var topLeft = Utility.distance(x, y, 0, 0);
    var topRight = Utility.distance(x, y, this.width, 0);
    var bottomLeft = Utility.distance(x, y, 0, this.height);
    var bottomRight = Utility.distance(x, y, this.width, this.height);

    return Math.max(topLeft, topRight, bottomLeft, bottomRight);
  }
};

/**
 * @param {HTMLElement} element
 * @constructor
 */
function Ripple (element) {
  this.element = element;
  this.color = window.getComputedStyle(element).color;

  this.wave = document.createElement('div');
  this.waveContainer = document.createElement('div');
  this.wave.style.backgroundColor = this.color;
  this.wave.classList.add('wave');
  this.waveContainer.classList.add('wave-container');
  this.waveContainer.appendChild(this.wave);

  this.resetInteractionState();
}

Ripple.MAX_RADIUS = 300;

Ripple.prototype = {
  get recenters () {
    return this.element.recenters;
  },

  get center () {
    return this.element.center;
  },

  get mouseDownElapsed () {
    var elapsed;

    if (!this.mouseDownStart) {
      return 0;
    }

    elapsed = Utility.now() - this.mouseDownStart;

    if (this.mouseUpStart) {
      elapsed -= this.mouseUpElapsed;
    }

    return elapsed;
  },

  get mouseUpElapsed () {
    return this.mouseUpStart
      ? Utility.now() - this.mouseUpStart : 0;
  },

  get mouseDownElapsedSeconds () {
    return this.mouseDownElapsed / 1000;
  },

  get mouseUpElapsedSeconds () {
    return this.mouseUpElapsed / 1000;
  },

  get mouseInteractionSeconds () {
    return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds;
  },

  get initialOpacity () {
    return this.element.initialOpacity;
  },

  get opacityDecayVelocity () {
    return this.element.opacityDecayVelocity;
  },

  get radius () {
    var width2 = this.containerMetrics.width * this.containerMetrics.width;
    var height2 = this.containerMetrics.height * this.containerMetrics.height;
    var waveRadius = Math.min(
      Math.sqrt(width2 + height2),
      Ripple.MAX_RADIUS
    ) * 1.1 + 5;

    var duration = 1.1 - 0.2 * (waveRadius / Ripple.MAX_RADIUS);
    var timeNow = this.mouseInteractionSeconds / duration;
    var size = waveRadius * (1 - Math.pow(80, -timeNow));

    return Math.abs(size);
  },

  get opacity () {
    if (!this.mouseUpStart) {
      return this.initialOpacity;
    }

    return Math.max(
      0,
      this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity
    );
  },

  get outerOpacity () {
    // Linear increase in background opacity, capped at the opacity
    // of the wavefront (waveOpacity).
    var outerOpacity = this.mouseUpElapsedSeconds * 0.3;
    var waveOpacity = this.opacity;

    return Math.max(
      0,
      Math.min(outerOpacity, waveOpacity)
    );
  },

  get isOpacityFullyDecayed () {
    return this.opacity < 0.01 &&
      this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
  },

  get isRestingAtMaxRadius () {
    return this.opacity >= this.initialOpacity &&
      this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
  },

  get isAnimationComplete () {
    return this.mouseUpStart
      ? this.isOpacityFullyDecayed : this.isRestingAtMaxRadius;
  },

  get translationFraction () {
    return Math.min(
      1,
      this.radius / this.containerMetrics.size * 2 / Math.sqrt(2)
    );
  },

  get xNow () {
    if (this.xEnd) {
      return this.xStart + this.translationFraction * (this.xEnd - this.xStart);
    }

    return this.xStart;
  },

  get yNow () {
    if (this.yEnd) {
      return this.yStart + this.translationFraction * (this.yEnd - this.yStart);
    }

    return this.yStart;
  },

  get isMouseDown () {
    return this.mouseDownStart && !this.mouseUpStart;
  },

  resetInteractionState: function () {
    this.maxRadius = 0;
    this.mouseDownStart = 0;
    this.mouseUpStart = 0;

    this.xStart = 0;
    this.yStart = 0;
    this.xEnd = 0;
    this.yEnd = 0;
    this.slideDistance = 0;

    this.containerMetrics = new ElementMetrics(this.element);
  },

  draw: function () {
    var scale;
    // var translateString
    var dx;
    var dy;

    this.wave.style.opacity = this.opacity;

    scale = this.radius / (this.containerMetrics.size / 2);
    dx = this.xNow - (this.containerMetrics.width / 2);
    dy = this.yNow - (this.containerMetrics.height / 2);

    // 2d transform for safari because of border-radius and overflow:hidden clipping bug.
    // https://bugs.webkit.org/show_bug.cgi?id=98538
    this.waveContainer.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';
    this.waveContainer.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
    this.wave.style.webkitTransform = 'scale(' + scale + ',' + scale + ')';
    this.wave.style.transform = 'scale3d(' + scale + ',' + scale + ',1)';
  },

  /** @param {Event=} event */
  downAction: function (event) {
    var xCenter = this.containerMetrics.width / 2;
    var yCenter = this.containerMetrics.height / 2;

    this.resetInteractionState();
    this.mouseDownStart = Utility.now();

    if (this.center) {
      this.xStart = xCenter;
      this.yStart = yCenter;
      this.slideDistance = Utility.distance(
        this.xStart, this.yStart, this.xEnd, this.yEnd
      );
    } else {
      var x = event && event.detail && event.detail.x ? event.detail.x : event.pageX;
      var y = event && event.detail && event.detail.y ? event.detail.y : event.pageY;
      this.xStart = x
        ? x - this.containerMetrics.boundingRect.left
        : this.containerMetrics.width / 2;
      this.yStart = y
        ? y - this.containerMetrics.boundingRect.top
        : this.containerMetrics.height / 2;
    }

    if (this.recenters) {
      this.xEnd = xCenter;
      this.yEnd = yCenter;
      this.slideDistance = Utility.distance(
        this.xStart, this.yStart, this.xEnd, this.yEnd
      );
    }

    this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(
      this.xStart,
      this.yStart
    );

    this.waveContainer.style.top =
      (this.containerMetrics.height - this.containerMetrics.size) / 2 + 'px';
    this.waveContainer.style.left =
      (this.containerMetrics.width - this.containerMetrics.size) / 2 + 'px';

    this.waveContainer.style.width = this.containerMetrics.size + 'px';
    this.waveContainer.style.height = this.containerMetrics.size + 'px';
  },

  /** @param {Event=} event */
  upAction: function (event) {
    if (!this.isMouseDown) {
      return;
    }

    this.mouseUpStart = Utility.now();
  },

  remove: function () {
    this.waveContainer.parentNode.removeChild(
      this.waveContainer
    );
  }
};

class RippleEffect extends A11yKeysMixin(ElementMixin(window.HTMLElement)) {
  static get is () { return 'ripple-effect'; }

  static get properties () {
    return {
      /**
       * The initial opacity set on the wave.
       *
       * @attribute initialOpacity
       * @type number
       * @default 0.25
       */
      initialOpacity: {
        type: Number,
        value: 0.25
      },

      /**
       * How fast (opacity per second) the wave fades out.
       *
       * @attribute opacityDecayVelocity
       * @type number
       * @default 0.8
       */
      opacityDecayVelocity: {
        type: Number,
        value: 0.8
      },

      /**
       * If true, ripples will exhibit a gravitational pull towards
       * the center of their container as they fade away.
       *
       * @attribute recenters
       * @type boolean
       * @default false
       */
      recenters: {
        type: Boolean,
        value: false
      },

      /**
       * If true, ripples will center inside its container
       *
       * @attribute recenters
       * @type boolean
       * @default false
       */
      center: {
        type: Boolean,
        value: false
      },

      /**
       * A list of the visual ripples.
       *
       * @attribute ripples
       * @type Array
       * @default []
       */
      ripples: {
        type: Array,
        value: function () {
          return [];
        }
      },

      /**
       * True when there are visible ripples animating within the
       * element.
       */
      animating: {
        type: Boolean,
        readOnly: true,
        reflectToAttribute: true,
        value: false
      },

      /**
       * If true, the ripple will remain in the "down" state until `holdDown`
       * is set to false again.
       */
      holdDown: {
        type: Boolean,
        value: false,
        observer: '_holdDownChanged'
      },

      /**
       * If true, the ripple will not generate a ripple effect
       * via pointer interaction.
       * Calling ripple's imperative api like `simulatedRipple` will
       * still generate the ripple effect.
       */
      noink: {
        type: Boolean,
        value: false
      },

      _animating: {
        type: Boolean
      },

      _boundAnimate: {
        type: Function,
        value: function () {
          return this.animate.bind(this);
        }
      }
    };
  }

  get target () {
    return this.keyEventTarget;
  }

  constructor () {
    super();
    this.keyBindings = {
      'enter:keydown': '_onEnterKeydown',
      'space:keydown': '_onSpaceKeydown',
      'space:keyup': '_onSpaceKeyup'
    };
    this._boundUiUpAction = this.uiUpAction.bind(this);
    this._boundUiDownAction = this.uiDownAction.bind(this);
  }

  connectedCallback () {
    super.connectedCallback();
    // Set up a11yKeysBehavior to listen to key events on the target,
    // so that space and enter activate the ripple even if the target doesn't
    // handle key events. The key handlers deal with `noink` themselves.
    if (this.parentNode.nodeType === 11) { // DOCUMENT_FRAGMENT_NODE
      this.keyEventTarget = this.getRootNode().host;
    } else {
      this.keyEventTarget = this.parentNode;
    }
    var keyEventTarget = /** @type {!EventTarget} */ (this.keyEventTarget);
    keyEventTarget.addEventListener('mouseup', this._boundUiUpAction);
    keyEventTarget.addEventListener('up', this._boundUiUpAction);
    keyEventTarget.addEventListener('down', this._boundUiDownAction);
    keyEventTarget.addEventListener('mousedown', this._boundUiDownAction);
  }

  disconnectedCallback () {
    this.keyEventTarget.removeEventListener('up', this._boundUiUpAction);
    this.keyEventTarget.removeEventListener('down', this._boundUiDownAction);
    this.keyEventTarget.removeEventListener('mouseup', this._boundUiUpAction);
    this.keyEventTarget.removeEventListener('mousedown', this._boundUiDownAction);
    this.keyEventTarget = null;
  }

  get shouldKeepAnimating () {
    for (var index = 0; index < this.ripples.length; ++index) {
      if (!this.ripples[index].isAnimationComplete) {
        return true;
      }
    }
    return false;
  }

  template () {
    return template();
  }

  simulatedRipple () {
    this.downAction(null);

    // Please see polymer/polymer#1305
    timeOut.after(1).run(() => {
      this.upAction();
    });
    // this.async(, 1)
  }

  /**
   * Provokes a ripple down effect via a UI event,
   * respecting the `noink` property.
   * @param {Event=} event
   */
  uiDownAction (event) {
    if (!this.noink) {
      this.downAction(event);
    }
  }

  /**
   * Provokes a ripple down effect via a UI event,
   * *not* respecting the `noink` property.
   * @param {Event=} event
   */
  downAction (event) {
    if (this.holdDown && this.ripples.length > 0) {
      return;
    }

    var ripple = this.addRipple();

    ripple.downAction(event);

    if (!this._animating) {
      this._animating = true;
      this.animate();
    }
  }

  /**
   * Provokes a ripple up effect via a UI event,
   * respecting the `noink` property.
   * @param {Event=} event
   */

  uiUpAction (event) {
    if (!this.noink) {
      this.upAction(event);
    }
  }

  /**
   * Provokes a ripple up effect via a UI event,
   * *not* respecting the `noink` property.
   * @param {Event=} event
   */
  upAction (event) {
    if (this.holdDown) {
      return;
    }

    this.ripples.forEach(function (ripple) {
      ripple.upAction(event);
    });

    this._animating = true;
    this.animate();
  }

  onAnimationComplete () {
    this._animating = false;
    this.shadowRoot.querySelector('#background').style.backgroundColor = null;
    this.dispatchEvent(new window.CustomEvent('transitionend'));
    // this.fire('transitionend')
  }

  addRipple () {
    var ripple = new Ripple(this);

    this.shadowRoot.querySelector('#waves').appendChild(ripple.waveContainer);
    this.shadowRoot.querySelector('#background').style.backgroundColor = ripple.color;
    this.ripples.push(ripple);

    this._setAnimating(true);

    return ripple;
  }

  removeRipple (ripple) {
    var rippleIndex = this.ripples.indexOf(ripple);

    if (rippleIndex < 0) {
      return;
    }

    this.ripples.splice(rippleIndex, 1);

    ripple.remove();

    if (!this.ripples.length) {
      this._setAnimating(false);
    }
  }

  /**
   * This conflicts with Element#antimate().
   * https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
   * @suppress {checkTypes}
   */
  animate () {
    if (!this._animating) {
      return;
    }
    var index;
    var ripple;

    for (index = 0; index < this.ripples.length; ++index) {
      ripple = this.ripples[index];

      ripple.draw();

      this.shadowRoot.querySelector('#background').style.opacity = ripple.outerOpacity;

      if (ripple.isOpacityFullyDecayed && !ripple.isRestingAtMaxRadius) {
        this.removeRipple(ripple);
      }
    }

    if (!this.shouldKeepAnimating && this.ripples.length === 0) {
      this.onAnimationComplete();
    } else {
      window.requestAnimationFrame(this._boundAnimate);
    }
  }

  _onEnterKeydown () {
    this.uiDownAction();
    this.async(this.uiUpAction, 1);
  }

  _onSpaceKeydown () {
    this.uiDownAction();
  }

  _onSpaceKeyup () {
    this.uiUpAction();
  }

  // note: holdDown does not respect noink since it can be a focus based
  // effect.
  _holdDownChanged (newVal, oldVal) {
    if (oldVal === undefined) {
      return;
    }
    if (newVal) {
      this.downAction();
    } else {
      this.upAction();
    }
  }

  /**
  Fired when the animation finishes.
  This is useful if you want to wait until
  the ripple animation finishes to perform some action.

  @event transitionend
  @param {{node: Object}} detail Contains the animated node.
  */
}

window.customElements.define(RippleEffect.is, RippleEffect);
