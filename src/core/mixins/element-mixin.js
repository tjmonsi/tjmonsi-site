import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin';
import * as caseMap$0 from '@polymer/polymer/lib/utils/case-map';
// import { cssFromModuleImports, cssFromTemplate } from '@polymer/polymer/lib/utils/style-gather';
// import { resolveUrl as resolveUrl$0 } from '@polymer/polymer/lib/utils/resolve-url';
import { render, html } from 'lit-html';
import { PropertyEffects } from './property-effects';
const { camelToDashCase } = caseMap$0;

const JSCompiler_renameProperty = (prop, obj) => { // eslint-disable-line camelcase
  return prop;
};

export const ElementMixin = dedupingMixin(base => {
  /**
   * @constructor
   * @extends {base}
   * @implements {Polymer_PropertyEffects}
   */
  const polymerElementBase = PropertyEffects(base);

  let caseMap = caseMap$0;

  /**
   * Returns the `properties` object specifically on `klass`. Use for:
   * (1) super chain mixes togther to make `propertiesForClass` which is
   * then used to make `observedAttributes`.
   * (2) properties effects and observers are created from it at `finalize` time.
   *
   * @param {HTMLElement} klass Element class
   * @return {Object} Object containing own properties for this class
   * @private
   */
  function ownPropertiesForClass (klass) {
    if (!klass.hasOwnProperty(
      JSCompiler_renameProperty('__ownProperties', klass))) {
      klass.__ownProperties =
        klass.hasOwnProperty(JSCompiler_renameProperty('properties', klass))
          ? /** @type PolymerElementConstructor */ (klass).properties : {};
    }
    return klass.__ownProperties;
  }

  /**
   * Returns the `observers` array specifically on `klass`. Use for
   * setting up observers.
   *
   * @param {HTMLElement} klass Element class
   * @return {Array} Array containing own observers for this class
   * @private
   */
  function ownObserversForClass (klass) {
    if (!klass.hasOwnProperty(
      JSCompiler_renameProperty('__ownObservers', klass))) {
      klass.__ownObservers =
        klass.hasOwnProperty(JSCompiler_renameProperty('observers', klass))
          ? /** @type PolymerElementConstructor */ (klass).observers : [];
    }
    return klass.__ownObservers;
  }

  /**
   * Mixes `props` into `flattenedProps` but upgrades shorthand type
   * syntax to { type: Type}.
   *
   * @param {Object} flattenedProps Bag to collect flattened properties into
   * @param {Object} props Bag of properties to add to `flattenedProps`
   * @return {Object} The input `flattenedProps` bag
   * @private
   */
  function flattenProperties (flattenedProps, props) {
    for (let p in props) {
      let o = props[p];
      if (typeof o === 'function') {
        o = { type: o };
      }
      flattenedProps[p] = o;
    }
    return flattenedProps;
  }

  /**
   * Returns a flattened list of properties mixed together from the chain of all
   * constructor's `config.properties`. This list is used to create
   * (1) observedAttributes,
   * (2) class property default values
   *
   * @param {PolymerElementConstructor} klass Element class
   * @return {PolymerElementProperties} Flattened properties for this class
   * @suppress {missingProperties} class.prototype is not a property for some reason?
   * @private
   */
  function propertiesForClass (klass) {
    if (!klass.hasOwnProperty(
      JSCompiler_renameProperty('__classProperties', klass))) {
      klass.__classProperties =
      flattenProperties({}, ownPropertiesForClass(klass));
      let superCtor = Object.getPrototypeOf(klass.prototype).constructor;
      if (superCtor.prototype instanceof PolymerElement) {
        klass.__classProperties = Object.assign(
          Object.create(propertiesForClass(/** @type PolymerElementConstructor */(superCtor))),
          klass.__classProperties);
      }
    }
    return klass.__classProperties;
  }

  /**
   * Returns a list of properties with default values.
   * This list is created as an optimization since it is a subset of
   * the list returned from `propertiesForClass`.
   * This list is used in `_initializeProperties` to set property defaults.
   *
   * @param {PolymerElementConstructor} klass Element class
   * @return {PolymerElementProperties} Flattened properties for this class
   *   that have default values
   * @private
   */
  function propertyDefaultsForClass (klass) {
    if (!klass.hasOwnProperty(
      JSCompiler_renameProperty('__classPropertyDefaults', klass))) {
      klass.__classPropertyDefaults = null;
      let props = propertiesForClass(klass);
      for (let p in props) {
        let info = props[p];
        if ('value' in info) {
          klass.__classPropertyDefaults = klass.__classPropertyDefaults || {};
          klass.__classPropertyDefaults[p] = info;
        }
      }
    }
    return klass.__classPropertyDefaults;
  }

  /**
   * Returns true if a `klass` has finalized. Called in `ElementClass.finalize()`
   * @param {PolymerElementConstructor} klass Element class
   * @return {boolean} True if all metaprogramming for this class has been
   *   completed
   * @private
   */
  function hasClassFinalized (klass) {
    return klass.hasOwnProperty(JSCompiler_renameProperty('__finalized', klass));
  }

  /**
   * Called by `ElementClass.finalize()`. Ensures this `klass` and
   * *all superclasses* are finalized by traversing the prototype chain
   * and calling `klass.finalize()`.
   *
   * @param {PolymerElementConstructor} klass Element class
   * @private
   */
  function finalizeClassAndSuper (klass) {
    let proto = /** @type PolymerElementConstructor */ (klass).prototype;
    let superCtor = Object.getPrototypeOf(proto).constructor;
    if (superCtor.prototype instanceof PolymerElement) {
      superCtor.finalize();
    }
    finalizeClass(klass);
  }

  /**
   * Configures a `klass` based on a staic `klass.config` object and
   * a `template`. This includes creating accessors and effects
   * for properties in `config` and the `template` as well as preparing the
   * `template` for stamping.
   *
   * @param {PolymerElementConstructor} klass Element class
   * @private
   */
  function finalizeClass (klass) {
    klass.__finalized = true;
    let proto = /** @type PolymerElementConstructor */ (klass).prototype;
    if (klass.hasOwnProperty(
      JSCompiler_renameProperty('is', klass)) && klass.is) {
      register(proto);
    }
    let props = ownPropertiesForClass(klass);
    if (props) {
      finalizeProperties(proto, props);
    }
    let observers = ownObserversForClass(klass);
    if (observers) {
      finalizeObservers(proto, observers, props);
    }
    // note: create "working" template that is finalized at instance time
    // let template = /** @type PolymerElementConstructor */ (klass).template;
    // if (template) {
    //   if (typeof template === 'string') {
    //     let t = document.createElement('template');
    //     t.innerHTML = template;
    //     template = t;
    //   } else {
    //     template = template.cloneNode(true);
    //   }
    //   proto._template = template;
    // }
  }

  /**
   * Configures a `proto` based on a `properties` object.
   * Leverages `PropertyEffects` to create property accessors and effects
   * supporting, observers, reflecting to attributes, change notification,
   * computed properties, and read only properties.
   * @param {PolymerElement} proto Element class prototype to add accessors
   *    and effects to
   * @param {Object} properties Flattened bag of property descriptors for
   *    this class
   * @private
   */
  function finalizeProperties (proto, properties) {
    for (let p in properties) {
      createPropertyFromConfig(proto, p, properties[p], properties);
    }
  }

  /**
   * Configures a `proto` based on a `observers` array.
   * Leverages `PropertyEffects` to create observers.
   * @param {PolymerElement} proto Element class prototype to add accessors
   *   and effects to
   * @param {Object} observers Flattened array of observer descriptors for
   *   this class
   * @param {Object} dynamicFns Object containing keys for any properties
   *   that are functions and should trigger the effect when the function
   *   reference is changed
   * @private
   */
  function finalizeObservers (proto, observers, dynamicFns) {
    for (let i = 0; i < observers.length; i++) {
      proto._createMethodObserver(observers[i], dynamicFns);
    }
  }

  /**
   * Creates effects for a property.
   *
   * Note, once a property has been set to
   * `readOnly`, `computed`, `reflectToAttribute`, or `notify`
   * these values may not be changed. For example, a subclass cannot
   * alter these settings. However, additional `observers` may be added
   * by subclasses.
   *
   * The info object should may contain property metadata as follows:
   *
   * * `type`: {function} type to which an attribute matching the property
   * is deserialized. Note the property is camel-cased from a dash-cased
   * attribute. For example, 'foo-bar' attribute is dersialized to a
   * property named 'fooBar'.
   *
   * * `readOnly`: {boolean} creates a readOnly property and
   * makes a private setter for the private of the form '_setFoo' for a
   * property 'foo',
   *
   * * `computed`: {string} creates a computed property. A computed property
   * also automatically is set to `readOnly: true`. The value is calculated
   * by running a method and arguments parsed from the given string. For
   * example 'compute(foo)' will compute a given property when the
   * 'foo' property changes by executing the 'compute' method. This method
   * must return the computed value.
   *
   * * `reflectToAttriute`: {boolean} If true, the property value is reflected
   * to an attribute of the same name. Note, the attribute is dash-cased
   * so a property named 'fooBar' is reflected as 'foo-bar'.
   *
   * * `notify`: {boolean} sends a non-bubbling notification event when
   * the property changes. For example, a property named 'foo' sends an
   * event named 'foo-changed' with `event.detail` set to the value of
   * the property.
   *
   * * observer: {string} name of a method that runs when the property
   * changes. The arguments of the method are (value, previousValue).
   *
   * Note: Users may want control over modifying property
   * effects via subclassing. For example, a user might want to make a
   * reflectToAttribute property not do so in a subclass. We've chosen to
   * disable this because it leads to additional complication.
   * For example, a readOnly effect generates a special setter. If a subclass
   * disables the effect, the setter would fail unexpectedly.
   * Based on feedback, we may want to try to make effects more malleable
   * and/or provide an advanced api for manipulating them.
   * Also consider adding warnings when an effect cannot be changed.
   *
   * @param {PolymerElement} proto Element class prototype to add accessors
   *   and effects to
   * @param {string} name Name of the property.
   * @param {Object} info Info object from which to create property effects.
   * Supported keys:
   * @param {Object} allProps Flattened map of all properties defined in this
   *   element (including inherited properties)
   * @private
   */
  function createPropertyFromConfig (proto, name, info, allProps) {
    // computed forces readOnly...
    if (info.computed) {
      info.readOnly = true;
    }
    // Note, since all computed properties are readOnly, this prevents
    // adding additional computed property effects (which leads to a confusing
    // setup where multiple triggers for setting a property)
    // While we do have `hasComputedEffect` this is set on the property's
    // dependencies rather than itself.
    if (info.computed && !proto._hasReadOnlyEffect(name)) {
      proto._createComputedProperty(name, info.computed, allProps);
    }
    if (info.readOnly && !proto._hasReadOnlyEffect(name)) {
      proto._createReadOnlyProperty(name, !info.computed);
    }
    if (info.reflectToAttribute && !proto._hasReflectEffect(name)) {
      proto._createReflectedProperty(name);
    }
    if (info.notify && !proto._hasNotifyEffect(name)) {
      proto._createNotifyingProperty(name);
    }
    // always add observer
    if (info.observer) {
      proto._createPropertyObserver(name, info.observer, allProps[info.observer]);
    }
  }

  /**
   * @polymer
   * @mixinClass
   * @unrestricted
   * @implements {Polymer_ElementMixin}
   */
  class PolymerElement extends polymerElementBase {
    /**
     * Standard Custom Elements V1 API.  The default implementation returns
     * a list of dash-cased attributes based on a flattening of all properties
     * declared in `static get properties()` for this element and any
     * superclasses.
     *
     * @return {Array} Observed attribute list
     */
    static get observedAttributes () {
      if (!this.hasOwnProperty(JSCompiler_renameProperty('__observedAttributes', this))) {
        let list = [];
        let properties = propertiesForClass(this);
        for (let prop in properties) {
          list.push(camelToDashCase(prop));
        }
        this.__observedAttributes = list;
      }
      return this.__observedAttributes;
    }

    /**
     * Called automatically when the first element instance is created to
     * ensure that class finalization work has been completed.
     * May be called by users to eagerly perform class finalization work
     * prior to the creation of the first element instance.
     *
     * Class finalization work generally includes meta-programming such as
     * creating property accessors and any property effect metadata needed for
     * the features used.
     *
     * @public
     */
    static finalize () {
      if (!hasClassFinalized(this)) {
        finalizeClassAndSuper(this);
      }
    }

    /**
     * Overrides the default `Polymer.PropertyAccessors` to ensure class
     * metaprogramming related to property accessors and effects has
     * completed (calls `finalize`).
     *
     * It also initializes any property defaults provided via `value` in
     * `properties` metadata.
     *
     * @override
     * @suppress {invalidCasts}
     */
    _initializeProperties () {
      instanceCount++;
      this.constructor.finalize();
      // // note: finalize template when we have access to `localName` to
      // // avoid dependence on `is` for polyfilling styling.
      // if (this._template && !this._template.__polymerFinalized) {
      //   this._template.__polymerFinalized = true;
      //   const baseURI =
      //     importPath ? resolveUrl$0(importPath) : '';
      //   finalizeTemplate(/** @type {!PolymerElement} */(this.__proto__), this._template, baseURI,
      //     /** @type {!HTMLElement} */(this).localName);
      // }
      super._initializeProperties();
      // apply property defaults...
      let p$ = propertyDefaultsForClass(this.constructor);
      if (!p$) {
        return;
      }
      for (let p in p$) {
        let info = p$[p];
        // Don't set default value if there is already an own property, which
        // happens when a `properties` property with default but no effects had
        // a property set (e.g. bound) by its host before upgrade
        if (!this.hasOwnProperty(p)) {
          let value = typeof info.value === 'function'
            ? info.value.call(this)
            : info.value;
          // Set via `_setProperty` if there is an accessor, to enable
          // initializing readOnly property defaults
          if (this._hasAccessor(p)) {
            this._setPendingProperty(p, value, true);
          } else {
            this[p] = value;
          }
        }
      }
    }

    /**
     * Provides a default implementation of the standard Custom Elements
     * `connectedCallback`.
     *
     * The default implementation enables the property effects system and
     * flushes any pending properties, and updates shimmed CSS properties
     * when using the ShadyCSS scoping/custom properties polyfill.
     *
     * @suppress {invalidCasts}
     */
    connectedCallback () {
      if (window.ShadyCSS) {
        var template = document.createElement('template');
        render(this.template(), template.content);
        window.ShadyCSS.prepareTemplate(template, this.constructor.is);
        window.ShadyCSS.styleElement(/** @type {!HTMLElement} */(this));
      }

      this._enableProperties();
    }

    /**
     * Provides a default implementation of the standard Custom Elements
     * `disconnectedCallback`.
     */
    disconnectedCallback () {}

    ready () {
      var props = propertiesForClass(this.constructor);
      for (var i in props) {
        this._createPropertyAccessor(i, props[i].readOnly);
      }
      super.ready();
    }

    /**
     * Implements `PropertyEffects`'s `_readyClients` call. Attaches
     * element dom by calling `_attachDom` with the dom stamped from the
     * element's template via `_stampTemplate`. Note that this allows
     * client dom to be attached to the element prior to any observers
     * running.
     *
     * @override
     */
    _readyClients () {
      this._attachDom();

      // The super._readyClients here sets the clients initialized flag.
      // We must wait to do this until after client dom is created/attached
      // so that this flag can be checked to prevent notifications fired
      // during this process from being handled before clients are ready.
      super._readyClients();
    }

    /**
     * Attaches an element's stamped dom to itself. By default,
     * this method creates a `shadowRoot` and adds the dom to it.
     * However, this method may be overridden to allow an element
     * to put its dom in another location.
     *
     * @throws {Error}
     * @suppress {missingReturn}
     * @param {StampedTemplate} dom to attach to the element.
     * @return {ShadowRoot} node to which the dom has been attached.
     */
    _attachDom () {
      if (this.attachShadow) {
        if (!this.shadowRoot) {
          this.attachShadow({mode: 'open'});
        }
        this.render();
      } else {
        throw new Error('ShadowDOM not available. ' +
          // TODO(sorvell): move to compile-time conditional when supported
        'Polymer.Element can create dom as children instead of in ' +
        'ShadowDOM by setting `this.root = this;` before `ready`.');
      }
    }

    /**
     * Provides a default implementation of the standard Custom Elements
     * `attributeChangedCallback`.
     *
     * By default, attributes declared in `properties` metadata are
     * deserialized using their `type` information to properties of the
     * same name.  "Dash-cased" attributes are deserialzed to "camelCase"
     * properties.
     *
     * @param {string} name Name of attribute.
     * @param {?string} old Old value of attribute.
     * @param {?string} value Current value of attribute.
     * @override
     */
    attributeChangedCallback (name, old, value) {
      if (old !== value) {
        let property = caseMap.dashToCamelCase(name);
        let type = propertiesForClass(this.constructor)[property].type;
        if (!this._hasReadOnlyEffect(property)) {
          this._attributeToProperty(name, value, type);
        }
      }
    }

    /**
     * When using the ShadyCSS scoping and custom property shim, causes all
     * shimmed styles in this element (and its subtree) to be updated
     * based on current custom property values.
     *
     * The optional parameter overrides inline custom property styles with an
     * object of properties where the keys are CSS properties, and the values
     * are strings.
     *
     * Example: `this.updateStyles({'--color': 'blue'})`
     *
     * These properties are retained unless a value of `null` is set.
     *
     * @param {Object=} properties Bag of custom property key/values to
     *   apply to this element.
     * @suppress {invalidCasts}
     */
    updateStyles (properties) {
      if (window.ShadyCSS) {
        window.ShadyCSS.styleSubtree(/** @type {!HTMLElement} */(this), properties);
      }
    }

    render () {
      render(this.template(this), this.shadowRoot);
    }

    template () {
      return html``;
    }
  }

  return PolymerElement;
});

export let instanceCount = 0;
export const registrations = [];

export function _regLog (prototype) {
  console.log('[' + prototype.is + ']: registered');
}

export function register (prototype) {
  registrations.push(prototype);
  undefined && _regLog(prototype);
}

export function dumpRegistrations () {
  registrations.forEach(_regLog);
}

export const updateStyles = (props) => {
  if (window.ShadyCSS) {
    window.ShadyCSS.styleDocument(props);
  }
};
