(function () {
    "use strict";

    var commonjsGlobal =
        typeof globalThis !== "undefined"
            ? globalThis
            : typeof window !== "undefined"
            ? window
            : typeof global !== "undefined"
            ? global
            : typeof self !== "undefined"
            ? self
            : {};

    var cash = { exports: {} };

    (function (module, exports) {
        (function () {
            var doc = document;
            var win = window;
            var docEle = doc.documentElement;
            var createElement = doc.createElement.bind(doc);
            var div = createElement("div");
            var table = createElement("table");
            var tbody = createElement("tbody");
            var tr = createElement("tr");
            var isArray = Array.isArray,
                ArrayPrototype = Array.prototype;
            var concat = ArrayPrototype.concat,
                filter = ArrayPrototype.filter,
                indexOf = ArrayPrototype.indexOf,
                map = ArrayPrototype.map,
                push = ArrayPrototype.push,
                slice = ArrayPrototype.slice,
                some = ArrayPrototype.some,
                splice = ArrayPrototype.splice;
            var idRe = /^#(?:[\w-]|\\.|[^\x00-\xa0])*$/;
            var classRe = /^\.(?:[\w-]|\\.|[^\x00-\xa0])*$/;
            var htmlRe = /<.+>/;
            var tagRe = /^\w+$/;
            // @require ./variables.ts
            function find(selector, context) {
                var isFragment = isDocumentFragment(context);
                return !selector || (!isFragment && !isDocument(context) && !isElement(context))
                    ? []
                    : !isFragment && classRe.test(selector)
                    ? context.getElementsByClassName(selector.slice(1).replace(/\\/g, ""))
                    : !isFragment && tagRe.test(selector)
                    ? context.getElementsByTagName(selector)
                    : context.querySelectorAll(selector);
            }
            // @require ./find.ts
            // @require ./variables.ts
            var Cash = /** @class */ (function () {
                function Cash(selector, context) {
                    if (!selector) return;
                    if (isCash(selector)) return selector;
                    var eles = selector;
                    if (isString(selector)) {
                        var ctx = (isCash(context) ? context[0] : context) || doc;
                        eles =
                            idRe.test(selector) && "getElementById" in ctx
                                ? ctx.getElementById(selector.slice(1).replace(/\\/g, ""))
                                : htmlRe.test(selector)
                                ? parseHTML(selector)
                                : find(selector, ctx);
                        if (!eles) return;
                    } else if (isFunction(selector)) {
                        return this.ready(selector); //FIXME: `fn.ready` is not included in `core`, but it's actually a core functionality
                    }
                    if (eles.nodeType || eles === win) eles = [eles];
                    this.length = eles.length;
                    for (var i = 0, l = this.length; i < l; i++) {
                        this[i] = eles[i];
                    }
                }
                Cash.prototype.init = function (selector, context) {
                    return new Cash(selector, context);
                };
                return Cash;
            })();
            var fn = Cash.prototype;
            var cash = fn.init;
            cash.fn = cash.prototype = fn; // Ensuring that `cash () instanceof cash`
            fn.length = 0;
            fn.splice = splice; // Ensuring a cash collection gets printed as array-like in Chrome's devtools
            if (typeof Symbol === "function") {
                // Ensuring a cash collection is iterable
                fn[Symbol["iterator"]] = ArrayPrototype[Symbol["iterator"]];
            }
            function isCash(value) {
                return value instanceof Cash;
            }
            function isWindow(value) {
                return !!value && value === value.window;
            }
            function isDocument(value) {
                return !!value && value.nodeType === 9;
            }
            function isDocumentFragment(value) {
                return !!value && value.nodeType === 11;
            }
            function isElement(value) {
                return !!value && value.nodeType === 1;
            }
            function isText(value) {
                return !!value && value.nodeType === 3;
            }
            function isBoolean(value) {
                return typeof value === "boolean";
            }
            function isFunction(value) {
                return typeof value === "function";
            }
            function isString(value) {
                return typeof value === "string";
            }
            function isUndefined(value) {
                return value === undefined;
            }
            function isNull(value) {
                return value === null;
            }
            function isNumeric(value) {
                return !isNaN(parseFloat(value)) && isFinite(value);
            }
            function isPlainObject(value) {
                if (typeof value !== "object" || value === null) return false;
                var proto = Object.getPrototypeOf(value);
                return proto === null || proto === Object.prototype;
            }
            cash.isWindow = isWindow;
            cash.isFunction = isFunction;
            cash.isArray = isArray;
            cash.isNumeric = isNumeric;
            cash.isPlainObject = isPlainObject;
            function each(arr, callback, _reverse) {
                if (_reverse) {
                    var i = arr.length;
                    while (i--) {
                        if (callback.call(arr[i], i, arr[i]) === false) return arr;
                    }
                } else if (isPlainObject(arr)) {
                    var keys = Object.keys(arr);
                    for (var i = 0, l = keys.length; i < l; i++) {
                        var key = keys[i];
                        if (callback.call(arr[key], key, arr[key]) === false) return arr;
                    }
                } else {
                    for (var i = 0, l = arr.length; i < l; i++) {
                        if (callback.call(arr[i], i, arr[i]) === false) return arr;
                    }
                }
                return arr;
            }
            cash.each = each;
            fn.each = function (callback) {
                return each(this, callback);
            };
            fn.empty = function () {
                return this.each(function (i, ele) {
                    while (ele.firstChild) {
                        ele.removeChild(ele.firstChild);
                    }
                });
            };
            function extend() {
                var sources = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    sources[_i] = arguments[_i];
                }
                var deep = isBoolean(sources[0]) ? sources.shift() : false;
                var target = sources.shift();
                var length = sources.length;
                if (!target) return {};
                if (!length) return extend(deep, cash, target);
                for (var i = 0; i < length; i++) {
                    var source = sources[i];
                    for (var key in source) {
                        if (deep && (isArray(source[key]) || isPlainObject(source[key]))) {
                            if (!target[key] || target[key].constructor !== source[key].constructor)
                                target[key] = new source[key].constructor();
                            extend(deep, target[key], source[key]);
                        } else {
                            target[key] = source[key];
                        }
                    }
                }
                return target;
            }
            cash.extend = extend;
            fn.extend = function (plugins) {
                return extend(fn, plugins);
            };
            // @require ./type_checking.ts
            var splitValuesRe = /\S+/g;
            function getSplitValues(str) {
                return isString(str) ? str.match(splitValuesRe) || [] : [];
            }
            fn.toggleClass = function (cls, force) {
                var classes = getSplitValues(cls);
                var isForce = !isUndefined(force);
                return this.each(function (i, ele) {
                    if (!isElement(ele)) return;
                    each(classes, function (i, c) {
                        if (isForce) {
                            force ? ele.classList.add(c) : ele.classList.remove(c);
                        } else {
                            ele.classList.toggle(c);
                        }
                    });
                });
            };
            fn.addClass = function (cls) {
                return this.toggleClass(cls, true);
            };
            fn.removeAttr = function (attr) {
                var attrs = getSplitValues(attr);
                return this.each(function (i, ele) {
                    if (!isElement(ele)) return;
                    each(attrs, function (i, a) {
                        ele.removeAttribute(a);
                    });
                });
            };
            function attr(attr, value) {
                if (!attr) return;
                if (isString(attr)) {
                    if (arguments.length < 2) {
                        if (!this[0] || !isElement(this[0])) return;
                        var value_1 = this[0].getAttribute(attr);
                        return isNull(value_1) ? undefined : value_1;
                    }
                    if (isUndefined(value)) return this;
                    if (isNull(value)) return this.removeAttr(attr);
                    return this.each(function (i, ele) {
                        if (!isElement(ele)) return;
                        ele.setAttribute(attr, value);
                    });
                }
                for (var key in attr) {
                    this.attr(key, attr[key]);
                }
                return this;
            }
            fn.attr = attr;
            fn.removeClass = function (cls) {
                if (arguments.length) return this.toggleClass(cls, false);
                return this.attr("class", "");
            };
            fn.hasClass = function (cls) {
                return (
                    !!cls &&
                    some.call(this, function (ele) {
                        return isElement(ele) && ele.classList.contains(cls);
                    })
                );
            };
            fn.get = function (index) {
                if (isUndefined(index)) return slice.call(this);
                index = Number(index);
                return this[index < 0 ? index + this.length : index];
            };
            fn.eq = function (index) {
                return cash(this.get(index));
            };
            fn.first = function () {
                return this.eq(0);
            };
            fn.last = function () {
                return this.eq(-1);
            };
            function text(text) {
                if (isUndefined(text)) {
                    return this.get()
                        .map(function (ele) {
                            return isElement(ele) || isText(ele) ? ele.textContent : "";
                        })
                        .join("");
                }
                return this.each(function (i, ele) {
                    if (!isElement(ele)) return;
                    ele.textContent = text;
                });
            }
            fn.text = text;
            // @require core/type_checking.ts
            // @require core/variables.ts
            function computeStyle(ele, prop, isVariable) {
                if (!isElement(ele)) return;
                var style = win.getComputedStyle(ele, null);
                return isVariable ? style.getPropertyValue(prop) || undefined : style[prop] || ele.style[prop];
            }
            // @require ./compute_style.ts
            function computeStyleInt(ele, prop) {
                return parseInt(computeStyle(ele, prop), 10) || 0;
            }
            // @require css/helpers/compute_style_int.ts
            function getExtraSpace(ele, xAxis) {
                return (
                    computeStyleInt(ele, "border".concat(xAxis ? "Left" : "Top", "Width")) +
                    computeStyleInt(ele, "padding".concat(xAxis ? "Left" : "Top")) +
                    computeStyleInt(ele, "padding".concat(xAxis ? "Right" : "Bottom")) +
                    computeStyleInt(ele, "border".concat(xAxis ? "Right" : "Bottom", "Width"))
                );
            }
            // @require css/helpers/compute_style.ts
            var defaultDisplay = {};
            function getDefaultDisplay(tagName) {
                if (defaultDisplay[tagName]) return defaultDisplay[tagName];
                var ele = createElement(tagName);
                doc.body.insertBefore(ele, null);
                var display = computeStyle(ele, "display");
                doc.body.removeChild(ele);
                return (defaultDisplay[tagName] = display !== "none" ? display : "block");
            }
            // @require css/helpers/compute_style.ts
            function isHidden(ele) {
                return computeStyle(ele, "display") === "none";
            }
            // @require ./cash.ts
            function matches(ele, selector) {
                var matches = ele && (ele["matches"] || ele["webkitMatchesSelector"] || ele["msMatchesSelector"]);
                return !!matches && !!selector && matches.call(ele, selector);
            }
            // @require ./matches.ts
            // @require ./type_checking.ts
            function getCompareFunction(comparator) {
                return isString(comparator)
                    ? function (i, ele) {
                          return matches(ele, comparator);
                      }
                    : isFunction(comparator)
                    ? comparator
                    : isCash(comparator)
                    ? function (i, ele) {
                          return comparator.is(ele);
                      }
                    : !comparator
                    ? function () {
                          return false;
                      }
                    : function (i, ele) {
                          return ele === comparator;
                      };
            }
            fn.filter = function (comparator) {
                var compare = getCompareFunction(comparator);
                return cash(
                    filter.call(this, function (ele, i) {
                        return compare.call(ele, i, ele);
                    })
                );
            };
            // @require collection/filter.ts
            function filtered(collection, comparator) {
                return !comparator ? collection : collection.filter(comparator);
            }
            fn.detach = function (comparator) {
                filtered(this, comparator).each(function (i, ele) {
                    if (ele.parentNode) {
                        ele.parentNode.removeChild(ele);
                    }
                });
                return this;
            };
            var fragmentRe = /^\s*<(\w+)[^>]*>/;
            var singleTagRe = /^<(\w+)\s*\/?>(?:<\/\1>)?$/;
            var containers = {
                "*": div,
                tr: tbody,
                td: tr,
                th: tr,
                thead: table,
                tbody: table,
                tfoot: table,
            };
            //TODO: Create elements inside a document fragment, in order to prevent inline event handlers from firing
            //TODO: Ensure the created elements have the fragment as their parent instead of null, this also ensures we can deal with detatched nodes more reliably
            function parseHTML(html) {
                if (!isString(html)) return [];
                if (singleTagRe.test(html)) return [createElement(RegExp.$1)];
                var fragment = fragmentRe.test(html) && RegExp.$1;
                var container = containers[fragment] || containers["*"];
                container.innerHTML = html;
                return cash(container.childNodes).detach().get();
            }
            cash.parseHTML = parseHTML;
            fn.has = function (selector) {
                var comparator = isString(selector)
                    ? function (i, ele) {
                          return find(selector, ele).length;
                      }
                    : function (i, ele) {
                          return ele.contains(selector);
                      };
                return this.filter(comparator);
            };
            fn.not = function (comparator) {
                var compare = getCompareFunction(comparator);
                return this.filter(function (i, ele) {
                    return (!isString(comparator) || isElement(ele)) && !compare.call(ele, i, ele);
                });
            };
            function pluck(arr, prop, deep, until) {
                var plucked = [];
                var isCallback = isFunction(prop);
                var compare = until && getCompareFunction(until);
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (isCallback) {
                        var val_1 = prop(arr[i]);
                        if (val_1.length) push.apply(plucked, val_1);
                    } else {
                        var val_2 = arr[i][prop];
                        while (val_2 != null) {
                            if (until && compare(-1, val_2)) break;
                            plucked.push(val_2);
                            val_2 = deep ? val_2[prop] : null;
                        }
                    }
                }
                return plucked;
            }
            // @require core/pluck.ts
            // @require core/variables.ts
            function getValue(ele) {
                if (ele.multiple && ele.options)
                    return pluck(
                        filter.call(ele.options, function (option) {
                            return option.selected && !option.disabled && !option.parentNode.disabled;
                        }),
                        "value"
                    );
                return ele.value || "";
            }
            function val(value) {
                if (!arguments.length) return this[0] && getValue(this[0]);
                return this.each(function (i, ele) {
                    var isSelect = ele.multiple && ele.options;
                    if (isSelect || checkableRe.test(ele.type)) {
                        var eleValue_1 = isArray(value)
                            ? map.call(value, String)
                            : isNull(value)
                            ? []
                            : [String(value)];
                        if (isSelect) {
                            each(
                                ele.options,
                                function (i, option) {
                                    option.selected = eleValue_1.indexOf(option.value) >= 0;
                                },
                                true
                            );
                        } else {
                            ele.checked = eleValue_1.indexOf(ele.value) >= 0;
                        }
                    } else {
                        ele.value = isUndefined(value) || isNull(value) ? "" : value;
                    }
                });
            }
            fn.val = val;
            fn.is = function (comparator) {
                var compare = getCompareFunction(comparator);
                return some.call(this, function (ele, i) {
                    return compare.call(ele, i, ele);
                });
            };
            cash.guid = 1;
            function unique(arr) {
                return arr.length > 1
                    ? filter.call(arr, function (item, index, self) {
                          return indexOf.call(self, item) === index;
                      })
                    : arr;
            }
            cash.unique = unique;
            fn.add = function (selector, context) {
                return cash(unique(this.get().concat(cash(selector, context).get())));
            };
            fn.children = function (comparator) {
                return filtered(
                    cash(
                        unique(
                            pluck(this, function (ele) {
                                return ele.children;
                            })
                        )
                    ),
                    comparator
                );
            };
            fn.parent = function (comparator) {
                return filtered(cash(unique(pluck(this, "parentNode"))), comparator);
            };
            fn.index = function (selector) {
                var child = selector ? cash(selector)[0] : this[0];
                var collection = selector ? this : cash(child).parent().children();
                return indexOf.call(collection, child);
            };
            fn.closest = function (comparator) {
                var filtered = this.filter(comparator);
                if (filtered.length) return filtered;
                var $parent = this.parent();
                if (!$parent.length) return filtered;
                return $parent.closest(comparator);
            };
            fn.siblings = function (comparator) {
                return filtered(
                    cash(
                        unique(
                            pluck(this, function (ele) {
                                return cash(ele).parent().children().not(ele);
                            })
                        )
                    ),
                    comparator
                );
            };
            fn.find = function (selector) {
                return cash(
                    unique(
                        pluck(this, function (ele) {
                            return find(selector, ele);
                        })
                    )
                );
            };
            // @require core/variables.ts
            // @require collection/filter.ts
            // @require traversal/find.ts
            var HTMLCDATARe = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
            var scriptTypeRe = /^$|^module$|\/(java|ecma)script/i;
            var scriptAttributes = ["type", "src", "nonce", "noModule"];
            function evalScripts(node, doc) {
                var collection = cash(node);
                collection
                    .filter("script")
                    .add(collection.find("script"))
                    .each(function (i, ele) {
                        if (scriptTypeRe.test(ele.type) && docEle.contains(ele)) {
                            // The script type is supported // The element is attached to the DOM // Using `documentElement` for broader browser support
                            var script_1 = createElement("script");
                            script_1.text = ele.textContent.replace(HTMLCDATARe, "");
                            each(scriptAttributes, function (i, attr) {
                                if (ele[attr]) script_1[attr] = ele[attr];
                            });
                            doc.head.insertBefore(script_1, null);
                            doc.head.removeChild(script_1);
                        }
                    });
            }
            // @require ./eval_scripts.ts
            function insertElement(anchor, target, left, inside, evaluate) {
                if (inside) {
                    // prepend/append
                    anchor.insertBefore(target, left ? anchor.firstChild : null);
                } else {
                    // before/after
                    if (anchor.nodeName === "HTML") {
                        anchor.parentNode.replaceChild(target, anchor);
                    } else {
                        anchor.parentNode.insertBefore(target, left ? anchor : anchor.nextSibling);
                    }
                }
                if (evaluate) {
                    evalScripts(target, anchor.ownerDocument);
                }
            }
            // @require ./insert_element.ts
            function insertSelectors(
                selectors,
                anchors,
                inverse,
                left,
                inside,
                reverseLoop1,
                reverseLoop2,
                reverseLoop3
            ) {
                each(
                    selectors,
                    function (si, selector) {
                        each(
                            cash(selector),
                            function (ti, target) {
                                each(
                                    cash(anchors),
                                    function (ai, anchor) {
                                        var anchorFinal = inverse ? target : anchor;
                                        var targetFinal = inverse ? anchor : target;
                                        var indexFinal = inverse ? ti : ai;
                                        insertElement(
                                            anchorFinal,
                                            !indexFinal ? targetFinal : targetFinal.cloneNode(true),
                                            left,
                                            inside,
                                            !indexFinal
                                        );
                                    },
                                    reverseLoop3
                                );
                            },
                            reverseLoop2
                        );
                    },
                    reverseLoop1
                );
                return anchors;
            }
            fn.after = function () {
                return insertSelectors(arguments, this, false, false, false, true, true);
            };
            fn.append = function () {
                return insertSelectors(arguments, this, false, false, true);
            };
            function html(html) {
                if (!arguments.length) return this[0] && this[0].innerHTML;
                if (isUndefined(html)) return this;
                var hasScript = /<script[\s>]/.test(html);
                return this.each(function (i, ele) {
                    if (!isElement(ele)) return;
                    if (hasScript) {
                        cash(ele).empty().append(html);
                    } else {
                        ele.innerHTML = html;
                    }
                });
            }
            fn.html = html;
            fn.appendTo = function (selector) {
                return insertSelectors(arguments, this, true, false, true);
            };
            fn.wrapInner = function (selector) {
                return this.each(function (i, ele) {
                    var $ele = cash(ele);
                    var contents = $ele.contents();
                    contents.length ? contents.wrapAll(selector) : $ele.append(selector);
                });
            };
            fn.before = function () {
                return insertSelectors(arguments, this, false, true);
            };
            fn.wrapAll = function (selector) {
                var structure = cash(selector);
                var wrapper = structure[0];
                while (wrapper.children.length) wrapper = wrapper.firstElementChild;
                this.first().before(structure);
                return this.appendTo(wrapper);
            };
            fn.wrap = function (selector) {
                return this.each(function (i, ele) {
                    var wrapper = cash(selector)[0];
                    cash(ele).wrapAll(!i ? wrapper : wrapper.cloneNode(true));
                });
            };
            fn.insertAfter = function (selector) {
                return insertSelectors(arguments, this, true, false, false, false, false, true);
            };
            fn.insertBefore = function (selector) {
                return insertSelectors(arguments, this, true, true);
            };
            fn.prepend = function () {
                return insertSelectors(arguments, this, false, true, true, true, true);
            };
            fn.prependTo = function (selector) {
                return insertSelectors(arguments, this, true, true, true, false, false, true);
            };
            fn.contents = function () {
                return cash(
                    unique(
                        pluck(this, function (ele) {
                            return ele.tagName === "IFRAME"
                                ? [ele.contentDocument]
                                : ele.tagName === "TEMPLATE"
                                ? ele.content.childNodes
                                : ele.childNodes;
                        })
                    )
                );
            };
            fn.next = function (comparator, _all, _until) {
                return filtered(cash(unique(pluck(this, "nextElementSibling", _all, _until))), comparator);
            };
            fn.nextAll = function (comparator) {
                return this.next(comparator, true);
            };
            fn.nextUntil = function (until, comparator) {
                return this.next(comparator, true, until);
            };
            fn.parents = function (comparator, _until) {
                return filtered(cash(unique(pluck(this, "parentElement", true, _until))), comparator);
            };
            fn.parentsUntil = function (until, comparator) {
                return this.parents(comparator, until);
            };
            fn.prev = function (comparator, _all, _until) {
                return filtered(cash(unique(pluck(this, "previousElementSibling", _all, _until))), comparator);
            };
            fn.prevAll = function (comparator) {
                return this.prev(comparator, true);
            };
            fn.prevUntil = function (until, comparator) {
                return this.prev(comparator, true, until);
            };
            fn.map = function (callback) {
                return cash(
                    concat.apply(
                        [],
                        map.call(this, function (ele, i) {
                            return callback.call(ele, i, ele);
                        })
                    )
                );
            };
            fn.clone = function () {
                return this.map(function (i, ele) {
                    return ele.cloneNode(true);
                });
            };
            fn.offsetParent = function () {
                return this.map(function (i, ele) {
                    var offsetParent = ele.offsetParent;
                    while (offsetParent && computeStyle(offsetParent, "position") === "static") {
                        offsetParent = offsetParent.offsetParent;
                    }
                    return offsetParent || docEle;
                });
            };
            fn.slice = function (start, end) {
                return cash(slice.call(this, start, end));
            };
            // @require ./cash.ts
            var dashAlphaRe = /-([a-z])/g;
            function camelCase(str) {
                return str.replace(dashAlphaRe, function (match, letter) {
                    return letter.toUpperCase();
                });
            }
            fn.ready = function (callback) {
                var cb = function () {
                    return setTimeout(callback, 0, cash);
                };
                if (doc.readyState !== "loading") {
                    cb();
                } else {
                    doc.addEventListener("DOMContentLoaded", cb);
                }
                return this;
            };
            fn.unwrap = function () {
                this.parent().each(function (i, ele) {
                    if (ele.tagName === "BODY") return;
                    var $ele = cash(ele);
                    $ele.replaceWith($ele.children());
                });
                return this;
            };
            fn.offset = function () {
                var ele = this[0];
                if (!ele) return;
                var rect = ele.getBoundingClientRect();
                return {
                    top: rect.top + win.pageYOffset,
                    left: rect.left + win.pageXOffset,
                };
            };
            fn.position = function () {
                var ele = this[0];
                if (!ele) return;
                var isFixed = computeStyle(ele, "position") === "fixed";
                var offset = isFixed ? ele.getBoundingClientRect() : this.offset();
                if (!isFixed) {
                    var doc_1 = ele.ownerDocument;
                    var offsetParent = ele.offsetParent || doc_1.documentElement;
                    while (
                        (offsetParent === doc_1.body || offsetParent === doc_1.documentElement) &&
                        computeStyle(offsetParent, "position") === "static"
                    ) {
                        offsetParent = offsetParent.parentNode;
                    }
                    if (offsetParent !== ele && isElement(offsetParent)) {
                        var parentOffset = cash(offsetParent).offset();
                        offset.top -= parentOffset.top + computeStyleInt(offsetParent, "borderTopWidth");
                        offset.left -= parentOffset.left + computeStyleInt(offsetParent, "borderLeftWidth");
                    }
                }
                return {
                    top: offset.top - computeStyleInt(ele, "marginTop"),
                    left: offset.left - computeStyleInt(ele, "marginLeft"),
                };
            };
            var propMap = {
                /* GENERAL */
                class: "className",
                contenteditable: "contentEditable",
                /* LABEL */
                for: "htmlFor",
                /* INPUT */
                readonly: "readOnly",
                maxlength: "maxLength",
                tabindex: "tabIndex",
                /* TABLE */
                colspan: "colSpan",
                rowspan: "rowSpan",
                /* IMAGE */
                usemap: "useMap",
            };
            fn.prop = function (prop, value) {
                if (!prop) return;
                if (isString(prop)) {
                    prop = propMap[prop] || prop;
                    if (arguments.length < 2) return this[0] && this[0][prop];
                    return this.each(function (i, ele) {
                        ele[prop] = value;
                    });
                }
                for (var key in prop) {
                    this.prop(key, prop[key]);
                }
                return this;
            };
            fn.removeProp = function (prop) {
                return this.each(function (i, ele) {
                    delete ele[propMap[prop] || prop];
                });
            };
            var cssVariableRe = /^--/;
            // @require ./variables.ts
            function isCSSVariable(prop) {
                return cssVariableRe.test(prop);
            }
            // @require core/camel_case.ts
            // @require core/cash.ts
            // @require core/each.ts
            // @require core/variables.ts
            // @require ./is_css_variable.ts
            var prefixedProps = {};
            var style = div.style;
            var vendorsPrefixes = ["webkit", "moz", "ms"];
            function getPrefixedProp(prop, isVariable) {
                if (isVariable === void 0) {
                    isVariable = isCSSVariable(prop);
                }
                if (isVariable) return prop;
                if (!prefixedProps[prop]) {
                    var propCC = camelCase(prop);
                    var propUC = "".concat(propCC[0].toUpperCase()).concat(propCC.slice(1));
                    var props = ""
                        .concat(propCC, " ")
                        .concat(vendorsPrefixes.join("".concat(propUC, " ")))
                        .concat(propUC)
                        .split(" ");
                    each(props, function (i, p) {
                        if (p in style) {
                            prefixedProps[prop] = p;
                            return false;
                        }
                    });
                }
                return prefixedProps[prop];
            }
            // @require core/type_checking.ts
            // @require ./is_css_variable.ts
            var numericProps = {
                animationIterationCount: true,
                columnCount: true,
                flexGrow: true,
                flexShrink: true,
                fontWeight: true,
                gridArea: true,
                gridColumn: true,
                gridColumnEnd: true,
                gridColumnStart: true,
                gridRow: true,
                gridRowEnd: true,
                gridRowStart: true,
                lineHeight: true,
                opacity: true,
                order: true,
                orphans: true,
                widows: true,
                zIndex: true,
            };
            function getSuffixedValue(prop, value, isVariable) {
                if (isVariable === void 0) {
                    isVariable = isCSSVariable(prop);
                }
                return !isVariable && !numericProps[prop] && isNumeric(value) ? "".concat(value, "px") : value;
            }
            function css(prop, value) {
                if (isString(prop)) {
                    var isVariable_1 = isCSSVariable(prop);
                    prop = getPrefixedProp(prop, isVariable_1);
                    if (arguments.length < 2) return this[0] && computeStyle(this[0], prop, isVariable_1);
                    if (!prop) return this;
                    value = getSuffixedValue(prop, value, isVariable_1);
                    return this.each(function (i, ele) {
                        if (!isElement(ele)) return;
                        if (isVariable_1) {
                            ele.style.setProperty(prop, value);
                        } else {
                            ele.style[prop] = value;
                        }
                    });
                }
                for (var key in prop) {
                    this.css(key, prop[key]);
                }
                return this;
            }
            fn.css = css;
            function attempt(fn, arg) {
                try {
                    return fn(arg);
                } catch (_a) {
                    return arg;
                }
            }
            // @require core/attempt.ts
            // @require core/camel_case.ts
            var JSONStringRe = /^\s+|\s+$/;
            function getData(ele, key) {
                var value = ele.dataset[key] || ele.dataset[camelCase(key)];
                if (JSONStringRe.test(value)) return value;
                return attempt(JSON.parse, value);
            }
            // @require core/attempt.ts
            // @require core/camel_case.ts
            function setData(ele, key, value) {
                value = attempt(JSON.stringify, value);
                ele.dataset[camelCase(key)] = value;
            }
            function data(name, value) {
                if (!name) {
                    if (!this[0]) return;
                    var datas = {};
                    for (var key in this[0].dataset) {
                        datas[key] = getData(this[0], key);
                    }
                    return datas;
                }
                if (isString(name)) {
                    if (arguments.length < 2) return this[0] && getData(this[0], name);
                    if (isUndefined(value)) return this;
                    return this.each(function (i, ele) {
                        setData(ele, name, value);
                    });
                }
                for (var key in name) {
                    this.data(key, name[key]);
                }
                return this;
            }
            fn.data = data;
            function getDocumentDimension(doc, dimension) {
                var docEle = doc.documentElement;
                return Math.max(
                    doc.body["scroll".concat(dimension)],
                    docEle["scroll".concat(dimension)],
                    doc.body["offset".concat(dimension)],
                    docEle["offset".concat(dimension)],
                    docEle["client".concat(dimension)]
                );
            }
            each([true, false], function (i, outer) {
                each(["Width", "Height"], function (i, prop) {
                    var name = "".concat(outer ? "outer" : "inner").concat(prop);
                    fn[name] = function (includeMargins) {
                        if (!this[0]) return;
                        if (isWindow(this[0]))
                            return outer
                                ? this[0]["inner".concat(prop)]
                                : this[0].document.documentElement["client".concat(prop)];
                        if (isDocument(this[0])) return getDocumentDimension(this[0], prop);
                        return (
                            this[0]["".concat(outer ? "offset" : "client").concat(prop)] +
                            (includeMargins && outer
                                ? computeStyleInt(this[0], "margin".concat(i ? "Top" : "Left")) +
                                  computeStyleInt(this[0], "margin".concat(i ? "Bottom" : "Right"))
                                : 0)
                        );
                    };
                });
            });
            each(["Width", "Height"], function (index, prop) {
                var propLC = prop.toLowerCase();
                fn[propLC] = function (value) {
                    if (!this[0]) return isUndefined(value) ? undefined : this;
                    if (!arguments.length) {
                        if (isWindow(this[0])) return this[0].document.documentElement["client".concat(prop)];
                        if (isDocument(this[0])) return getDocumentDimension(this[0], prop);
                        return this[0].getBoundingClientRect()[propLC] - getExtraSpace(this[0], !index);
                    }
                    var valueNumber = parseInt(value, 10);
                    return this.each(function (i, ele) {
                        if (!isElement(ele)) return;
                        var boxSizing = computeStyle(ele, "boxSizing");
                        ele.style[propLC] = getSuffixedValue(
                            propLC,
                            valueNumber + (boxSizing === "border-box" ? getExtraSpace(ele, !index) : 0)
                        );
                    });
                };
            });
            var displayProperty = "___cd";
            fn.toggle = function (force) {
                return this.each(function (i, ele) {
                    if (!isElement(ele)) return;
                    var show = isUndefined(force) ? isHidden(ele) : force;
                    if (show) {
                        ele.style.display = ele[displayProperty] || "";
                        if (isHidden(ele)) {
                            ele.style.display = getDefaultDisplay(ele.tagName);
                        }
                    } else {
                        ele[displayProperty] = computeStyle(ele, "display");
                        ele.style.display = "none";
                    }
                });
            };
            fn.hide = function () {
                return this.toggle(false);
            };
            fn.show = function () {
                return this.toggle(true);
            };
            var eventsNamespace = "___ce";
            var eventsNamespacesSeparator = ".";
            var eventsFocus = { focus: "focusin", blur: "focusout" };
            var eventsHover = { mouseenter: "mouseover", mouseleave: "mouseout" };
            var eventsMouseRe = /^(mouse|pointer|contextmenu|drag|drop|click|dblclick)/i;
            // @require ./variables.ts
            function getEventNameBubbling(name) {
                return eventsHover[name] || eventsFocus[name] || name;
            }
            // @require ./variables.ts
            function parseEventName(eventName) {
                var parts = eventName.split(eventsNamespacesSeparator);
                return [parts[0], parts.slice(1).sort()]; // [name, namespace[]]
            }
            fn.trigger = function (event, data) {
                if (isString(event)) {
                    var _a = parseEventName(event),
                        nameOriginal = _a[0],
                        namespaces = _a[1];
                    var name_1 = getEventNameBubbling(nameOriginal);
                    if (!name_1) return this;
                    var type = eventsMouseRe.test(name_1) ? "MouseEvents" : "HTMLEvents";
                    event = doc.createEvent(type);
                    event.initEvent(name_1, true, true);
                    event.namespace = namespaces.join(eventsNamespacesSeparator);
                    event.___ot = nameOriginal;
                }
                event.___td = data;
                var isEventFocus = event.___ot in eventsFocus;
                return this.each(function (i, ele) {
                    if (isEventFocus && isFunction(ele[event.___ot])) {
                        ele["___i".concat(event.type)] = true; // Ensuring the native event is ignored
                        ele[event.___ot]();
                        ele["___i".concat(event.type)] = false; // Ensuring the custom event is not ignored
                    }
                    ele.dispatchEvent(event);
                });
            };
            // @require ./variables.ts
            function getEventsCache(ele) {
                return (ele[eventsNamespace] = ele[eventsNamespace] || {});
            }
            // @require core/guid.ts
            // @require events/helpers/get_events_cache.ts
            function addEvent(ele, name, namespaces, selector, callback) {
                var eventCache = getEventsCache(ele);
                eventCache[name] = eventCache[name] || [];
                eventCache[name].push([namespaces, selector, callback]);
                ele.addEventListener(name, callback);
            }
            function hasNamespaces(ns1, ns2) {
                return (
                    !ns2 ||
                    !some.call(ns2, function (ns) {
                        return ns1.indexOf(ns) < 0;
                    })
                );
            }
            // @require ./get_events_cache.ts
            // @require ./has_namespaces.ts
            // @require ./parse_event_name.ts
            function removeEvent(ele, name, namespaces, selector, callback) {
                var cache = getEventsCache(ele);
                if (!name) {
                    for (name in cache) {
                        removeEvent(ele, name, namespaces, selector, callback);
                    }
                } else if (cache[name]) {
                    cache[name] = cache[name].filter(function (_a) {
                        var ns = _a[0],
                            sel = _a[1],
                            cb = _a[2];
                        if (
                            (callback && cb.guid !== callback.guid) ||
                            !hasNamespaces(ns, namespaces) ||
                            (selector && selector !== sel)
                        )
                            return true;
                        ele.removeEventListener(name, cb);
                    });
                }
            }
            fn.off = function (eventFullName, selector, callback) {
                var _this = this;
                if (isUndefined(eventFullName)) {
                    this.each(function (i, ele) {
                        if (!isElement(ele) && !isDocument(ele) && !isWindow(ele)) return;
                        removeEvent(ele);
                    });
                } else if (!isString(eventFullName)) {
                    for (var key in eventFullName) {
                        this.off(key, eventFullName[key]);
                    }
                } else {
                    if (isFunction(selector)) {
                        callback = selector;
                        selector = "";
                    }
                    each(getSplitValues(eventFullName), function (i, eventFullName) {
                        var _a = parseEventName(eventFullName),
                            nameOriginal = _a[0],
                            namespaces = _a[1];
                        var name = getEventNameBubbling(nameOriginal);
                        _this.each(function (i, ele) {
                            if (!isElement(ele) && !isDocument(ele) && !isWindow(ele)) return;
                            removeEvent(ele, name, namespaces, selector, callback);
                        });
                    });
                }
                return this;
            };
            fn.remove = function (comparator) {
                filtered(this, comparator).detach().off();
                return this;
            };
            fn.replaceWith = function (selector) {
                return this.before(selector).remove();
            };
            fn.replaceAll = function (selector) {
                cash(selector).replaceWith(this);
                return this;
            };
            function on(eventFullName, selector, data, callback, _one) {
                var _this = this;
                if (!isString(eventFullName)) {
                    for (var key in eventFullName) {
                        this.on(key, selector, data, eventFullName[key], _one);
                    }
                    return this;
                }
                if (!isString(selector)) {
                    if (isUndefined(selector) || isNull(selector)) {
                        selector = "";
                    } else if (isUndefined(data)) {
                        data = selector;
                        selector = "";
                    } else {
                        callback = data;
                        data = selector;
                        selector = "";
                    }
                }
                if (!isFunction(callback)) {
                    callback = data;
                    data = undefined;
                }
                if (!callback) return this;
                each(getSplitValues(eventFullName), function (i, eventFullName) {
                    var _a = parseEventName(eventFullName),
                        nameOriginal = _a[0],
                        namespaces = _a[1];
                    var name = getEventNameBubbling(nameOriginal);
                    var isEventHover = nameOriginal in eventsHover;
                    var isEventFocus = nameOriginal in eventsFocus;
                    if (!name) return;
                    _this.each(function (i, ele) {
                        if (!isElement(ele) && !isDocument(ele) && !isWindow(ele)) return;
                        var finalCallback = function (event) {
                            if (event.target["___i".concat(event.type)]) return event.stopImmediatePropagation(); // Ignoring native event in favor of the upcoming custom one
                            if (
                                event.namespace &&
                                !hasNamespaces(namespaces, event.namespace.split(eventsNamespacesSeparator))
                            )
                                return;
                            if (
                                !selector &&
                                ((isEventFocus && (event.target !== ele || event.___ot === name)) ||
                                    (isEventHover && event.relatedTarget && ele.contains(event.relatedTarget)))
                            )
                                return;
                            var thisArg = ele;
                            if (selector) {
                                var target = event.target;
                                while (!matches(target, selector)) {
                                    if (target === ele) return;
                                    target = target.parentNode;
                                    if (!target) return;
                                }
                                thisArg = target;
                            }
                            Object.defineProperty(event, "currentTarget", {
                                configurable: true,
                                get: function () {
                                    return thisArg;
                                },
                            });
                            Object.defineProperty(event, "delegateTarget", {
                                configurable: true,
                                get: function () {
                                    return ele;
                                },
                            });
                            Object.defineProperty(event, "data", {
                                configurable: true,
                                get: function () {
                                    return data;
                                },
                            });
                            var returnValue = callback.call(thisArg, event, event.___td);
                            if (_one) {
                                removeEvent(ele, name, namespaces, selector, finalCallback);
                            }
                            if (returnValue === false) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        };
                        finalCallback.guid = callback.guid = callback.guid || cash.guid++;
                        addEvent(ele, name, namespaces, selector, finalCallback);
                    });
                });
                return this;
            }
            fn.on = on;
            function one(eventFullName, selector, data, callback) {
                return this.on(eventFullName, selector, data, callback, true);
            }
            fn.one = one;
            var queryEncodeCRLFRe = /\r?\n/g;
            function queryEncode(prop, value) {
                return "&"
                    .concat(encodeURIComponent(prop), "=")
                    .concat(encodeURIComponent(value.replace(queryEncodeCRLFRe, "\r\n")));
            }
            var skippableRe = /file|reset|submit|button|image/i;
            var checkableRe = /radio|checkbox/i;
            fn.serialize = function () {
                var query = "";
                this.each(function (i, ele) {
                    each(ele.elements || [ele], function (i, ele) {
                        if (
                            ele.disabled ||
                            !ele.name ||
                            ele.tagName === "FIELDSET" ||
                            skippableRe.test(ele.type) ||
                            (checkableRe.test(ele.type) && !ele.checked)
                        )
                            return;
                        var value = getValue(ele);
                        if (!isUndefined(value)) {
                            var values = isArray(value) ? value : [value];
                            each(values, function (i, value) {
                                query += queryEncode(ele.name, value);
                            });
                        }
                    });
                });
                return query.slice(1);
            };
            // @require core/types.ts
            // @require core/cash.ts
            // @require core/type_checking.ts
            // @require core/variables.ts
            // @require core/each.ts
            // @require core/extend.ts
            // @require core/find.ts
            // @require core/get_compare_function.ts
            // @require core/get_split_values.ts
            // @require core/guid.ts
            // @require core/parse_html.ts
            // @require core/unique.ts
            // @require attributes/add_class.ts
            // @require attributes/attr.ts
            // @require attributes/has_class.ts
            // @require attributes/prop.ts
            // @require attributes/remove_attr.ts
            // @require attributes/remove_class.ts
            // @require attributes/remove_prop.ts
            // @require attributes/toggle_class.ts
            // @require collection/add.ts
            // @require collection/each.ts
            // @require collection/eq.ts
            // @require collection/filter.ts
            // @require collection/first.ts
            // @require collection/get.ts
            // @require collection/index.ts
            // @require collection/last.ts
            // @require collection/map.ts
            // @require collection/slice.ts
            // @require css/css.ts
            // @require data/data.ts
            // @require dimensions/inner_outer.ts
            // @require dimensions/normal.ts
            // @require effects/hide.ts
            // @require effects/show.ts
            // @require effects/toggle.ts
            // @require events/off.ts
            // @require events/on.ts
            // @require events/one.ts
            // @require events/ready.ts
            // @require events/trigger.ts
            // @require forms/serialize.ts
            // @require forms/val.ts
            // @require manipulation/after.ts
            // @require manipulation/append.ts
            // @require manipulation/append_to.ts
            // @require manipulation/before.ts
            // @require manipulation/clone.ts
            // @require manipulation/detach.ts
            // @require manipulation/empty.ts
            // @require manipulation/html.ts
            // @require manipulation/insert_after.ts
            // @require manipulation/insert_before.ts
            // @require manipulation/prepend.ts
            // @require manipulation/prepend_to.ts
            // @require manipulation/remove.ts
            // @require manipulation/replace_all.ts
            // @require manipulation/replace_with.ts
            // @require manipulation/text.ts
            // @require manipulation/unwrap.ts
            // @require manipulation/wrap.ts
            // @require manipulation/wrap_all.ts
            // @require manipulation/wrap_inner.ts
            // @require offset/offset.ts
            // @require offset/offset_parent.ts
            // @require offset/position.ts
            // @require traversal/children.ts
            // @require traversal/closest.ts
            // @require traversal/contents.ts
            // @require traversal/find.ts
            // @require traversal/has.ts
            // @require traversal/is.ts
            // @require traversal/next.ts
            // @require traversal/next_all.ts
            // @require traversal/next_until.ts
            // @require traversal/not.ts
            // @require traversal/parent.ts
            // @require traversal/parents.ts
            // @require traversal/parents_until.ts
            // @require traversal/prev.ts
            // @require traversal/prev_all.ts
            // @require traversal/prev_until.ts
            // @require traversal/siblings.ts
            // @no-require extras/get_script.ts
            // @no-require extras/shorthands.ts
            // @require methods.ts
            {
                // Node.js
                module.exports = cash;
            }
        })();
    })(cash);

    var $ = cash.exports;

    /**
     * SSR Window 4.0.2
     * Better handling for window object in SSR environment
     * https://github.com/nolimits4web/ssr-window
     *
     * Copyright 2021, Vladimir Kharlampidi
     *
     * Licensed under MIT
     *
     * Released on: December 13, 2021
     */
    /* eslint-disable no-param-reassign */
    function isObject$1(obj) {
        return obj !== null && typeof obj === "object" && "constructor" in obj && obj.constructor === Object;
    }
    function extend$1(target = {}, src = {}) {
        Object.keys(src).forEach((key) => {
            if (typeof target[key] === "undefined") target[key] = src[key];
            else if (isObject$1(src[key]) && isObject$1(target[key]) && Object.keys(src[key]).length > 0) {
                extend$1(target[key], src[key]);
            }
        });
    }

    const ssrDocument = {
        body: {},
        addEventListener() {},
        removeEventListener() {},
        activeElement: {
            blur() {},
            nodeName: "",
        },
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        getElementById() {
            return null;
        },
        createEvent() {
            return {
                initEvent() {},
            };
        },
        createElement() {
            return {
                children: [],
                childNodes: [],
                style: {},
                setAttribute() {},
                getElementsByTagName() {
                    return [];
                },
            };
        },
        createElementNS() {
            return {};
        },
        importNode() {
            return null;
        },
        location: {
            hash: "",
            host: "",
            hostname: "",
            href: "",
            origin: "",
            pathname: "",
            protocol: "",
            search: "",
        },
    };
    function getDocument() {
        const doc = typeof document !== "undefined" ? document : {};
        extend$1(doc, ssrDocument);
        return doc;
    }

    const ssrWindow = {
        document: ssrDocument,
        navigator: {
            userAgent: "",
        },
        location: {
            hash: "",
            host: "",
            hostname: "",
            href: "",
            origin: "",
            pathname: "",
            protocol: "",
            search: "",
        },
        history: {
            replaceState() {},
            pushState() {},
            go() {},
            back() {},
        },
        CustomEvent: function CustomEvent() {
            return this;
        },
        addEventListener() {},
        removeEventListener() {},
        getComputedStyle() {
            return {
                getPropertyValue() {
                    return "";
                },
            };
        },
        Image() {},
        Date() {},
        screen: {},
        setTimeout() {},
        clearTimeout() {},
        matchMedia() {
            return {};
        },
        requestAnimationFrame(callback) {
            if (typeof setTimeout === "undefined") {
                callback();
                return null;
            }
            return setTimeout(callback, 0);
        },
        cancelAnimationFrame(id) {
            if (typeof setTimeout === "undefined") {
                return;
            }
            clearTimeout(id);
        },
    };
    function getWindow() {
        const win = typeof window !== "undefined" ? window : {};
        extend$1(win, ssrWindow);
        return win;
    }

    function deleteProps(obj) {
        const object = obj;
        Object.keys(object).forEach((key) => {
            try {
                object[key] = null;
            } catch (e) {
                // no getter for object
            }
            try {
                delete object[key];
            } catch (e) {
                // something got wrong
            }
        });
    }
    function nextTick(callback, delay = 0) {
        return setTimeout(callback, delay);
    }
    function now() {
        return Date.now();
    }
    function getComputedStyle$1(el) {
        const window = getWindow();
        let style;
        if (window.getComputedStyle) {
            style = window.getComputedStyle(el, null);
        }
        if (!style && el.currentStyle) {
            style = el.currentStyle;
        }
        if (!style) {
            style = el.style;
        }
        return style;
    }
    function getTranslate(el, axis = "x") {
        const window = getWindow();
        let matrix;
        let curTransform;
        let transformMatrix;
        const curStyle = getComputedStyle$1(el);
        if (window.WebKitCSSMatrix) {
            curTransform = curStyle.transform || curStyle.webkitTransform;
            if (curTransform.split(",").length > 6) {
                curTransform = curTransform
                    .split(", ")
                    .map((a) => a.replace(",", "."))
                    .join(", ");
            }
            // Some old versions of Webkit choke when 'none' is passed; pass
            // empty string instead in this case
            transformMatrix = new window.WebKitCSSMatrix(curTransform === "none" ? "" : curTransform);
        } else {
            transformMatrix =
                curStyle.MozTransform ||
                curStyle.OTransform ||
                curStyle.MsTransform ||
                curStyle.msTransform ||
                curStyle.transform ||
                curStyle.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,");
            matrix = transformMatrix.toString().split(",");
        }
        if (axis === "x") {
            // Latest Chrome and webkits Fix
            if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41;
            // Crazy IE10 Matrix
            else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
            // Normal Browsers
            else curTransform = parseFloat(matrix[4]);
        }
        if (axis === "y") {
            // Latest Chrome and webkits Fix
            if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42;
            // Crazy IE10 Matrix
            else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
            // Normal Browsers
            else curTransform = parseFloat(matrix[5]);
        }
        return curTransform || 0;
    }
    function isObject(o) {
        return (
            typeof o === "object" &&
            o !== null &&
            o.constructor &&
            Object.prototype.toString.call(o).slice(8, -1) === "Object"
        );
    }
    function isNode(node) {
        // eslint-disable-next-line
        if (typeof window !== "undefined" && typeof window.HTMLElement !== "undefined") {
            return node instanceof HTMLElement;
        }
        return node && (node.nodeType === 1 || node.nodeType === 11);
    }
    function extend(...args) {
        const to = Object(args[0]);
        const noExtend = ["__proto__", "constructor", "prototype"];
        for (let i = 1; i < args.length; i += 1) {
            const nextSource = args[i];
            if (nextSource !== undefined && nextSource !== null && !isNode(nextSource)) {
                const keysArray = Object.keys(Object(nextSource)).filter((key) => noExtend.indexOf(key) < 0);
                for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
                    const nextKey = keysArray[nextIndex];
                    const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        if (isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
                            if (nextSource[nextKey].__swiper__) {
                                to[nextKey] = nextSource[nextKey];
                            } else {
                                extend(to[nextKey], nextSource[nextKey]);
                            }
                        } else if (!isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
                            to[nextKey] = {};
                            if (nextSource[nextKey].__swiper__) {
                                to[nextKey] = nextSource[nextKey];
                            } else {
                                extend(to[nextKey], nextSource[nextKey]);
                            }
                        } else {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
        }
        return to;
    }
    function setCSSProperty(el, varName, varValue) {
        el.style.setProperty(varName, varValue);
    }
    function animateCSSModeScroll({ swiper, targetPosition, side }) {
        const window = getWindow();
        const startPosition = -swiper.translate;
        let startTime = null;
        let time;
        const duration = swiper.params.speed;
        swiper.wrapperEl.style.scrollSnapType = "none";
        window.cancelAnimationFrame(swiper.cssModeFrameID);
        const dir = targetPosition > startPosition ? "next" : "prev";
        const isOutOfBound = (current, target) => {
            return (dir === "next" && current >= target) || (dir === "prev" && current <= target);
        };
        const animate = () => {
            time = new Date().getTime();
            if (startTime === null) {
                startTime = time;
            }
            const progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
            let currentPosition = startPosition + easeProgress * (targetPosition - startPosition);
            if (isOutOfBound(currentPosition, targetPosition)) {
                currentPosition = targetPosition;
            }
            swiper.wrapperEl.scrollTo({
                [side]: currentPosition,
            });
            if (isOutOfBound(currentPosition, targetPosition)) {
                swiper.wrapperEl.style.overflow = "hidden";
                swiper.wrapperEl.style.scrollSnapType = "";
                setTimeout(() => {
                    swiper.wrapperEl.style.overflow = "";
                    swiper.wrapperEl.scrollTo({
                        [side]: currentPosition,
                    });
                });
                window.cancelAnimationFrame(swiper.cssModeFrameID);
                return;
            }
            swiper.cssModeFrameID = window.requestAnimationFrame(animate);
        };
        animate();
    }
    function getSlideTransformEl(slideEl) {
        return (
            slideEl.querySelector(".swiper-slide-transform") ||
            (slideEl.shadowEl && slideEl.shadowEl.querySelector(".swiper-slide-transform")) ||
            slideEl
        );
    }
    function elementChildren(element, selector = "") {
        return [...element.children].filter((el) => el.matches(selector));
    }
    function createElement(tag, classes = []) {
        const el = document.createElement(tag);
        el.classList.add(...(Array.isArray(classes) ? classes : [classes]));
        return el;
    }
    function elementPrevAll(el, selector) {
        const prevEls = [];
        while (el.previousElementSibling) {
            const prev = el.previousElementSibling; // eslint-disable-line
            if (selector) {
                if (prev.matches(selector)) prevEls.push(prev);
            } else prevEls.push(prev);
            el = prev;
        }
        return prevEls;
    }
    function elementNextAll(el, selector) {
        const nextEls = [];
        while (el.nextElementSibling) {
            const next = el.nextElementSibling; // eslint-disable-line
            if (selector) {
                if (next.matches(selector)) nextEls.push(next);
            } else nextEls.push(next);
            el = next;
        }
        return nextEls;
    }
    function elementStyle(el, prop) {
        const window = getWindow();
        return window.getComputedStyle(el, null).getPropertyValue(prop);
    }
    function elementIndex(el) {
        let child = el;
        let i;
        if (child) {
            i = 0;
            // eslint-disable-next-line
            while ((child = child.previousSibling) !== null) {
                if (child.nodeType === 1) i += 1;
            }
            return i;
        }
        return undefined;
    }
    function elementParents(el, selector) {
        const parents = []; // eslint-disable-line
        let parent = el.parentElement; // eslint-disable-line
        while (parent) {
            if (selector) {
                if (parent.matches(selector)) parents.push(parent);
            } else {
                parents.push(parent);
            }
            parent = parent.parentElement;
        }
        return parents;
    }
    function elementTransitionEnd(el, callback) {
        function fireCallBack(e) {
            if (e.target !== el) return;
            callback.call(el, e);
            el.removeEventListener("transitionend", fireCallBack);
        }
        if (callback) {
            el.addEventListener("transitionend", fireCallBack);
        }
    }
    function elementOuterSize(el, size, includeMargins) {
        const window = getWindow();
        if (includeMargins) {
            return (
                el[size === "width" ? "offsetWidth" : "offsetHeight"] +
                parseFloat(
                    window.getComputedStyle(el, null).getPropertyValue(size === "width" ? "margin-right" : "margin-top")
                ) +
                parseFloat(
                    window
                        .getComputedStyle(el, null)
                        .getPropertyValue(size === "width" ? "margin-left" : "margin-bottom")
                )
            );
        }
        return el.offsetWidth;
    }

    let support;
    function calcSupport() {
        const window = getWindow();
        const document = getDocument();
        return {
            smoothScroll: document.documentElement && "scrollBehavior" in document.documentElement.style,
            touch: !!("ontouchstart" in window || (window.DocumentTouch && document instanceof window.DocumentTouch)),
        };
    }
    function getSupport() {
        if (!support) {
            support = calcSupport();
        }
        return support;
    }

    let deviceCached;
    function calcDevice({ userAgent } = {}) {
        const support = getSupport();
        const window = getWindow();
        const platform = window.navigator.platform;
        const ua = userAgent || window.navigator.userAgent;
        const device = {
            ios: false,
            android: false,
        };
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
        let ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
        const windows = platform === "Win32";
        let macos = platform === "MacIntel";

        // iPadOs 13 fix
        const iPadScreens = [
            "1024x1366",
            "1366x1024",
            "834x1194",
            "1194x834",
            "834x1112",
            "1112x834",
            "768x1024",
            "1024x768",
            "820x1180",
            "1180x820",
            "810x1080",
            "1080x810",
        ];
        if (!ipad && macos && support.touch && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0) {
            ipad = ua.match(/(Version)\/([\d.]+)/);
            if (!ipad) ipad = [0, 1, "13_0_0"];
            macos = false;
        }

        // Android
        if (android && !windows) {
            device.os = "android";
            device.android = true;
        }
        if (ipad || iphone || ipod) {
            device.os = "ios";
            device.ios = true;
        }

        // Export object
        return device;
    }
    function getDevice(overrides = {}) {
        if (!deviceCached) {
            deviceCached = calcDevice(overrides);
        }
        return deviceCached;
    }

    let browser;
    function calcBrowser() {
        const window = getWindow();
        let needPerspectiveFix = false;
        function isSafari() {
            const ua = window.navigator.userAgent.toLowerCase();
            return ua.indexOf("safari") >= 0 && ua.indexOf("chrome") < 0 && ua.indexOf("android") < 0;
        }
        if (isSafari()) {
            const ua = String(window.navigator.userAgent);
            if (ua.includes("Version/")) {
                const [major, minor] = ua
                    .split("Version/")[1]
                    .split(" ")[0]
                    .split(".")
                    .map((num) => Number(num));
                needPerspectiveFix = major < 16 || (major === 16 && minor < 2);
            }
        }
        return {
            isSafari: needPerspectiveFix || isSafari(),
            needPerspectiveFix,
            isWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window.navigator.userAgent),
        };
    }
    function getBrowser() {
        if (!browser) {
            browser = calcBrowser();
        }
        return browser;
    }

    function Resize({ swiper, on, emit }) {
        const window = getWindow();
        let observer = null;
        let animationFrame = null;
        const resizeHandler = () => {
            if (!swiper || swiper.destroyed || !swiper.initialized) return;
            emit("beforeResize");
            emit("resize");
        };
        const createObserver = () => {
            if (!swiper || swiper.destroyed || !swiper.initialized) return;
            observer = new ResizeObserver((entries) => {
                animationFrame = window.requestAnimationFrame(() => {
                    const { width, height } = swiper;
                    let newWidth = width;
                    let newHeight = height;
                    entries.forEach(({ contentBoxSize, contentRect, target }) => {
                        if (target && target !== swiper.el) return;
                        newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
                        newHeight = contentRect ? contentRect.height : (contentBoxSize[0] || contentBoxSize).blockSize;
                    });
                    if (newWidth !== width || newHeight !== height) {
                        resizeHandler();
                    }
                });
            });
            observer.observe(swiper.el);
        };
        const removeObserver = () => {
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }
            if (observer && observer.unobserve && swiper.el) {
                observer.unobserve(swiper.el);
                observer = null;
            }
        };
        const orientationChangeHandler = () => {
            if (!swiper || swiper.destroyed || !swiper.initialized) return;
            emit("orientationchange");
        };
        on("init", () => {
            if (swiper.params.resizeObserver && typeof window.ResizeObserver !== "undefined") {
                createObserver();
                return;
            }
            window.addEventListener("resize", resizeHandler);
            window.addEventListener("orientationchange", orientationChangeHandler);
        });
        on("destroy", () => {
            removeObserver();
            window.removeEventListener("resize", resizeHandler);
            window.removeEventListener("orientationchange", orientationChangeHandler);
        });
    }

    function Observer({ swiper, extendParams, on, emit }) {
        const observers = [];
        const window = getWindow();
        const attach = (target, options = {}) => {
            const ObserverFunc = window.MutationObserver || window.WebkitMutationObserver;
            const observer = new ObserverFunc((mutations) => {
                // The observerUpdate event should only be triggered
                // once despite the number of mutations.  Additional
                // triggers are redundant and are very costly
                if (swiper.__preventObserver__) return;
                if (mutations.length === 1) {
                    emit("observerUpdate", mutations[0]);
                    return;
                }
                const observerUpdate = function observerUpdate() {
                    emit("observerUpdate", mutations[0]);
                };
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(observerUpdate);
                } else {
                    window.setTimeout(observerUpdate, 0);
                }
            });
            observer.observe(target, {
                attributes: typeof options.attributes === "undefined" ? true : options.attributes,
                childList: typeof options.childList === "undefined" ? true : options.childList,
                characterData: typeof options.characterData === "undefined" ? true : options.characterData,
            });
            observers.push(observer);
        };
        const init = () => {
            if (!swiper.params.observer) return;
            if (swiper.params.observeParents) {
                const containerParents = elementParents(swiper.el);
                for (let i = 0; i < containerParents.length; i += 1) {
                    attach(containerParents[i]);
                }
            }
            // Observe container
            attach(swiper.el, {
                childList: swiper.params.observeSlideChildren,
            });

            // Observe wrapper
            attach(swiper.wrapperEl, {
                attributes: false,
            });
        };
        const destroy = () => {
            observers.forEach((observer) => {
                observer.disconnect();
            });
            observers.splice(0, observers.length);
        };
        extendParams({
            observer: false,
            observeParents: false,
            observeSlideChildren: false,
        });
        on("init", init);
        on("destroy", destroy);
    }

    /* eslint-disable no-underscore-dangle */

    var eventsEmitter = {
        on(events, handler, priority) {
            const self = this;
            if (!self.eventsListeners || self.destroyed) return self;
            if (typeof handler !== "function") return self;
            const method = priority ? "unshift" : "push";
            events.split(" ").forEach((event) => {
                if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
                self.eventsListeners[event][method](handler);
            });
            return self;
        },
        once(events, handler, priority) {
            const self = this;
            if (!self.eventsListeners || self.destroyed) return self;
            if (typeof handler !== "function") return self;
            function onceHandler(...args) {
                self.off(events, onceHandler);
                if (onceHandler.__emitterProxy) {
                    delete onceHandler.__emitterProxy;
                }
                handler.apply(self, args);
            }
            onceHandler.__emitterProxy = handler;
            return self.on(events, onceHandler, priority);
        },
        onAny(handler, priority) {
            const self = this;
            if (!self.eventsListeners || self.destroyed) return self;
            if (typeof handler !== "function") return self;
            const method = priority ? "unshift" : "push";
            if (self.eventsAnyListeners.indexOf(handler) < 0) {
                self.eventsAnyListeners[method](handler);
            }
            return self;
        },
        offAny(handler) {
            const self = this;
            if (!self.eventsListeners || self.destroyed) return self;
            if (!self.eventsAnyListeners) return self;
            const index = self.eventsAnyListeners.indexOf(handler);
            if (index >= 0) {
                self.eventsAnyListeners.splice(index, 1);
            }
            return self;
        },
        off(events, handler) {
            const self = this;
            if (!self.eventsListeners || self.destroyed) return self;
            if (!self.eventsListeners) return self;
            events.split(" ").forEach((event) => {
                if (typeof handler === "undefined") {
                    self.eventsListeners[event] = [];
                } else if (self.eventsListeners[event]) {
                    self.eventsListeners[event].forEach((eventHandler, index) => {
                        if (
                            eventHandler === handler ||
                            (eventHandler.__emitterProxy && eventHandler.__emitterProxy === handler)
                        ) {
                            self.eventsListeners[event].splice(index, 1);
                        }
                    });
                }
            });
            return self;
        },
        emit(...args) {
            const self = this;
            if (!self.eventsListeners || self.destroyed) return self;
            if (!self.eventsListeners) return self;
            let events;
            let data;
            let context;
            if (typeof args[0] === "string" || Array.isArray(args[0])) {
                events = args[0];
                data = args.slice(1, args.length);
                context = self;
            } else {
                events = args[0].events;
                data = args[0].data;
                context = args[0].context || self;
            }
            data.unshift(context);
            const eventsArray = Array.isArray(events) ? events : events.split(" ");
            eventsArray.forEach((event) => {
                if (self.eventsAnyListeners && self.eventsAnyListeners.length) {
                    self.eventsAnyListeners.forEach((eventHandler) => {
                        eventHandler.apply(context, [event, ...data]);
                    });
                }
                if (self.eventsListeners && self.eventsListeners[event]) {
                    self.eventsListeners[event].forEach((eventHandler) => {
                        eventHandler.apply(context, data);
                    });
                }
            });
            return self;
        },
    };

    function updateSize() {
        const swiper = this;
        let width;
        let height;
        const el = swiper.el;
        if (typeof swiper.params.width !== "undefined" && swiper.params.width !== null) {
            width = swiper.params.width;
        } else {
            width = el.clientWidth;
        }
        if (typeof swiper.params.height !== "undefined" && swiper.params.height !== null) {
            height = swiper.params.height;
        } else {
            height = el.clientHeight;
        }
        if ((width === 0 && swiper.isHorizontal()) || (height === 0 && swiper.isVertical())) {
            return;
        }

        // Subtract paddings
        width =
            width -
            parseInt(elementStyle(el, "padding-left") || 0, 10) -
            parseInt(elementStyle(el, "padding-right") || 0, 10);
        height =
            height -
            parseInt(elementStyle(el, "padding-top") || 0, 10) -
            parseInt(elementStyle(el, "padding-bottom") || 0, 10);
        if (Number.isNaN(width)) width = 0;
        if (Number.isNaN(height)) height = 0;
        Object.assign(swiper, {
            width,
            height,
            size: swiper.isHorizontal() ? width : height,
        });
    }

    function updateSlides() {
        const swiper = this;
        function getDirectionLabel(property) {
            if (swiper.isHorizontal()) {
                return property;
            }
            // prettier-ignore
            return {
	      'width': 'height',
	      'margin-top': 'margin-left',
	      'margin-bottom ': 'margin-right',
	      'margin-left': 'margin-top',
	      'margin-right': 'margin-bottom',
	      'padding-left': 'padding-top',
	      'padding-right': 'padding-bottom',
	      'marginRight': 'marginBottom'
	    }[property];
        }
        function getDirectionPropertyValue(node, label) {
            return parseFloat(node.getPropertyValue(getDirectionLabel(label)) || 0);
        }
        const params = swiper.params;
        const { wrapperEl, slidesEl, size: swiperSize, rtlTranslate: rtl, wrongRTL } = swiper;
        const isVirtual = swiper.virtual && params.virtual.enabled;
        const previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
        const slides = elementChildren(slidesEl, `.${swiper.params.slideClass}, swiper-slide`);
        const slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
        let snapGrid = [];
        const slidesGrid = [];
        const slidesSizesGrid = [];
        let offsetBefore = params.slidesOffsetBefore;
        if (typeof offsetBefore === "function") {
            offsetBefore = params.slidesOffsetBefore.call(swiper);
        }
        let offsetAfter = params.slidesOffsetAfter;
        if (typeof offsetAfter === "function") {
            offsetAfter = params.slidesOffsetAfter.call(swiper);
        }
        const previousSnapGridLength = swiper.snapGrid.length;
        const previousSlidesGridLength = swiper.slidesGrid.length;
        let spaceBetween = params.spaceBetween;
        let slidePosition = -offsetBefore;
        let prevSlideSize = 0;
        let index = 0;
        if (typeof swiperSize === "undefined") {
            return;
        }
        if (typeof spaceBetween === "string" && spaceBetween.indexOf("%") >= 0) {
            spaceBetween = (parseFloat(spaceBetween.replace("%", "")) / 100) * swiperSize;
        }
        swiper.virtualSize = -spaceBetween;

        // reset margins
        slides.forEach((slideEl) => {
            if (rtl) {
                slideEl.style.marginLeft = "";
            } else {
                slideEl.style.marginRight = "";
            }
            slideEl.style.marginBottom = "";
            slideEl.style.marginTop = "";
        });

        // reset cssMode offsets
        if (params.centeredSlides && params.cssMode) {
            setCSSProperty(wrapperEl, "--swiper-centered-offset-before", "");
            setCSSProperty(wrapperEl, "--swiper-centered-offset-after", "");
        }
        const gridEnabled = params.grid && params.grid.rows > 1 && swiper.grid;
        if (gridEnabled) {
            swiper.grid.initSlides(slidesLength);
        }

        // Calc slides
        let slideSize;
        const shouldResetSlideSize =
            params.slidesPerView === "auto" &&
            params.breakpoints &&
            Object.keys(params.breakpoints).filter((key) => {
                return typeof params.breakpoints[key].slidesPerView !== "undefined";
            }).length > 0;
        for (let i = 0; i < slidesLength; i += 1) {
            slideSize = 0;
            let slide;
            if (slides[i]) slide = slides[i];
            if (gridEnabled) {
                swiper.grid.updateSlide(i, slide, slidesLength, getDirectionLabel);
            }
            if (slides[i] && elementStyle(slide, "display") === "none") continue; // eslint-disable-line

            if (params.slidesPerView === "auto") {
                if (shouldResetSlideSize) {
                    slides[i].style[getDirectionLabel("width")] = ``;
                }
                const slideStyles = getComputedStyle(slide);
                const currentTransform = slide.style.transform;
                const currentWebKitTransform = slide.style.webkitTransform;
                if (currentTransform) {
                    slide.style.transform = "none";
                }
                if (currentWebKitTransform) {
                    slide.style.webkitTransform = "none";
                }
                if (params.roundLengths) {
                    slideSize = swiper.isHorizontal()
                        ? elementOuterSize(slide, "width", true)
                        : elementOuterSize(slide, "height", true);
                } else {
                    // eslint-disable-next-line
                    const width = getDirectionPropertyValue(slideStyles, "width");
                    const paddingLeft = getDirectionPropertyValue(slideStyles, "padding-left");
                    const paddingRight = getDirectionPropertyValue(slideStyles, "padding-right");
                    const marginLeft = getDirectionPropertyValue(slideStyles, "margin-left");
                    const marginRight = getDirectionPropertyValue(slideStyles, "margin-right");
                    const boxSizing = slideStyles.getPropertyValue("box-sizing");
                    if (boxSizing && boxSizing === "border-box") {
                        slideSize = width + marginLeft + marginRight;
                    } else {
                        const { clientWidth, offsetWidth } = slide;
                        slideSize =
                            width + paddingLeft + paddingRight + marginLeft + marginRight + (offsetWidth - clientWidth);
                    }
                }
                if (currentTransform) {
                    slide.style.transform = currentTransform;
                }
                if (currentWebKitTransform) {
                    slide.style.webkitTransform = currentWebKitTransform;
                }
                if (params.roundLengths) slideSize = Math.floor(slideSize);
            } else {
                slideSize = (swiperSize - (params.slidesPerView - 1) * spaceBetween) / params.slidesPerView;
                if (params.roundLengths) slideSize = Math.floor(slideSize);
                if (slides[i]) {
                    slides[i].style[getDirectionLabel("width")] = `${slideSize}px`;
                }
            }
            if (slides[i]) {
                slides[i].swiperSlideSize = slideSize;
            }
            slidesSizesGrid.push(slideSize);
            if (params.centeredSlides) {
                slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
                if (prevSlideSize === 0 && i !== 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
                if (i === 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
                if (Math.abs(slidePosition) < 1 / 1000) slidePosition = 0;
                if (params.roundLengths) slidePosition = Math.floor(slidePosition);
                if (index % params.slidesPerGroup === 0) snapGrid.push(slidePosition);
                slidesGrid.push(slidePosition);
            } else {
                if (params.roundLengths) slidePosition = Math.floor(slidePosition);
                if ((index - Math.min(swiper.params.slidesPerGroupSkip, index)) % swiper.params.slidesPerGroup === 0)
                    snapGrid.push(slidePosition);
                slidesGrid.push(slidePosition);
                slidePosition = slidePosition + slideSize + spaceBetween;
            }
            swiper.virtualSize += slideSize + spaceBetween;
            prevSlideSize = slideSize;
            index += 1;
        }
        swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
        if (rtl && wrongRTL && (params.effect === "slide" || params.effect === "coverflow")) {
            wrapperEl.style.width = `${swiper.virtualSize + params.spaceBetween}px`;
        }
        if (params.setWrapperSize) {
            wrapperEl.style[getDirectionLabel("width")] = `${swiper.virtualSize + params.spaceBetween}px`;
        }
        if (gridEnabled) {
            swiper.grid.updateWrapperSize(slideSize, snapGrid, getDirectionLabel);
        }

        // Remove last grid elements depending on width
        if (!params.centeredSlides) {
            const newSlidesGrid = [];
            for (let i = 0; i < snapGrid.length; i += 1) {
                let slidesGridItem = snapGrid[i];
                if (params.roundLengths) slidesGridItem = Math.floor(slidesGridItem);
                if (snapGrid[i] <= swiper.virtualSize - swiperSize) {
                    newSlidesGrid.push(slidesGridItem);
                }
            }
            snapGrid = newSlidesGrid;
            if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
                snapGrid.push(swiper.virtualSize - swiperSize);
            }
        }
        if (isVirtual && params.loop) {
            const size = slidesSizesGrid[0] + spaceBetween;
            if (params.slidesPerGroup > 1) {
                const groups = Math.ceil(
                    (swiper.virtual.slidesBefore + swiper.virtual.slidesAfter) / params.slidesPerGroup
                );
                const groupSize = size * params.slidesPerGroup;
                for (let i = 0; i < groups; i += 1) {
                    snapGrid.push(snapGrid[snapGrid.length - 1] + groupSize);
                }
            }
            for (let i = 0; i < swiper.virtual.slidesBefore + swiper.virtual.slidesAfter; i += 1) {
                if (params.slidesPerGroup === 1) {
                    snapGrid.push(snapGrid[snapGrid.length - 1] + size);
                }
                slidesGrid.push(slidesGrid[slidesGrid.length - 1] + size);
                swiper.virtualSize += size;
            }
        }
        if (snapGrid.length === 0) snapGrid = [0];
        if (params.spaceBetween !== 0) {
            const key = swiper.isHorizontal() && rtl ? "marginLeft" : getDirectionLabel("marginRight");
            slides
                .filter((_, slideIndex) => {
                    if (!params.cssMode || params.loop) return true;
                    if (slideIndex === slides.length - 1) {
                        return false;
                    }
                    return true;
                })
                .forEach((slideEl) => {
                    slideEl.style[key] = `${spaceBetween}px`;
                });
        }
        if (params.centeredSlides && params.centeredSlidesBounds) {
            let allSlidesSize = 0;
            slidesSizesGrid.forEach((slideSizeValue) => {
                allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
            });
            allSlidesSize -= params.spaceBetween;
            const maxSnap = allSlidesSize - swiperSize;
            snapGrid = snapGrid.map((snap) => {
                if (snap < 0) return -offsetBefore;
                if (snap > maxSnap) return maxSnap + offsetAfter;
                return snap;
            });
        }
        if (params.centerInsufficientSlides) {
            let allSlidesSize = 0;
            slidesSizesGrid.forEach((slideSizeValue) => {
                allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
            });
            allSlidesSize -= params.spaceBetween;
            if (allSlidesSize < swiperSize) {
                const allSlidesOffset = (swiperSize - allSlidesSize) / 2;
                snapGrid.forEach((snap, snapIndex) => {
                    snapGrid[snapIndex] = snap - allSlidesOffset;
                });
                slidesGrid.forEach((snap, snapIndex) => {
                    slidesGrid[snapIndex] = snap + allSlidesOffset;
                });
            }
        }
        Object.assign(swiper, {
            slides,
            snapGrid,
            slidesGrid,
            slidesSizesGrid,
        });
        if (params.centeredSlides && params.cssMode && !params.centeredSlidesBounds) {
            setCSSProperty(wrapperEl, "--swiper-centered-offset-before", `${-snapGrid[0]}px`);
            setCSSProperty(
                wrapperEl,
                "--swiper-centered-offset-after",
                `${swiper.size / 2 - slidesSizesGrid[slidesSizesGrid.length - 1] / 2}px`
            );
            const addToSnapGrid = -swiper.snapGrid[0];
            const addToSlidesGrid = -swiper.slidesGrid[0];
            swiper.snapGrid = swiper.snapGrid.map((v) => v + addToSnapGrid);
            swiper.slidesGrid = swiper.slidesGrid.map((v) => v + addToSlidesGrid);
        }
        if (slidesLength !== previousSlidesLength) {
            swiper.emit("slidesLengthChange");
        }
        if (snapGrid.length !== previousSnapGridLength) {
            if (swiper.params.watchOverflow) swiper.checkOverflow();
            swiper.emit("snapGridLengthChange");
        }
        if (slidesGrid.length !== previousSlidesGridLength) {
            swiper.emit("slidesGridLengthChange");
        }
        if (params.watchSlidesProgress) {
            swiper.updateSlidesOffset();
        }
        if (!isVirtual && !params.cssMode && (params.effect === "slide" || params.effect === "fade")) {
            const backFaceHiddenClass = `${params.containerModifierClass}backface-hidden`;
            const hasClassBackfaceClassAdded = swiper.el.classList.contains(backFaceHiddenClass);
            if (slidesLength <= params.maxBackfaceHiddenSlides) {
                if (!hasClassBackfaceClassAdded) swiper.el.classList.add(backFaceHiddenClass);
            } else if (hasClassBackfaceClassAdded) {
                swiper.el.classList.remove(backFaceHiddenClass);
            }
        }
    }

    function updateAutoHeight(speed) {
        const swiper = this;
        const activeSlides = [];
        const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
        let newHeight = 0;
        let i;
        if (typeof speed === "number") {
            swiper.setTransition(speed);
        } else if (speed === true) {
            swiper.setTransition(swiper.params.speed);
        }
        const getSlideByIndex = (index) => {
            if (isVirtual) {
                return swiper.getSlideIndexByData(index);
            }
            return swiper.slides[index];
        };
        // Find slides currently in view
        if (swiper.params.slidesPerView !== "auto" && swiper.params.slidesPerView > 1) {
            if (swiper.params.centeredSlides) {
                (swiper.visibleSlides || []).forEach((slide) => {
                    activeSlides.push(slide);
                });
            } else {
                for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
                    const index = swiper.activeIndex + i;
                    if (index > swiper.slides.length && !isVirtual) break;
                    activeSlides.push(getSlideByIndex(index));
                }
            }
        } else {
            activeSlides.push(getSlideByIndex(swiper.activeIndex));
        }

        // Find new height from highest slide in view
        for (i = 0; i < activeSlides.length; i += 1) {
            if (typeof activeSlides[i] !== "undefined") {
                const height = activeSlides[i].offsetHeight;
                newHeight = height > newHeight ? height : newHeight;
            }
        }

        // Update Height
        if (newHeight || newHeight === 0) swiper.wrapperEl.style.height = `${newHeight}px`;
    }

    function updateSlidesOffset() {
        const swiper = this;
        const slides = swiper.slides;
        // eslint-disable-next-line
        const minusOffset = swiper.isElement
            ? swiper.isHorizontal()
                ? swiper.wrapperEl.offsetLeft
                : swiper.wrapperEl.offsetTop
            : 0;
        for (let i = 0; i < slides.length; i += 1) {
            slides[i].swiperSlideOffset =
                (swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop) - minusOffset;
        }
    }

    function updateSlidesProgress(translate = (this && this.translate) || 0) {
        const swiper = this;
        const params = swiper.params;
        const { slides, rtlTranslate: rtl, snapGrid } = swiper;
        if (slides.length === 0) return;
        if (typeof slides[0].swiperSlideOffset === "undefined") swiper.updateSlidesOffset();
        let offsetCenter = -translate;
        if (rtl) offsetCenter = translate;

        // Visible Slides
        slides.forEach((slideEl) => {
            slideEl.classList.remove(params.slideVisibleClass);
        });
        swiper.visibleSlidesIndexes = [];
        swiper.visibleSlides = [];
        for (let i = 0; i < slides.length; i += 1) {
            const slide = slides[i];
            let slideOffset = slide.swiperSlideOffset;
            if (params.cssMode && params.centeredSlides) {
                slideOffset -= slides[0].swiperSlideOffset;
            }
            const slideProgress =
                (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) /
                (slide.swiperSlideSize + params.spaceBetween);
            const originalSlideProgress =
                (offsetCenter - snapGrid[0] + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) /
                (slide.swiperSlideSize + params.spaceBetween);
            const slideBefore = -(offsetCenter - slideOffset);
            const slideAfter = slideBefore + swiper.slidesSizesGrid[i];
            const isVisible =
                (slideBefore >= 0 && slideBefore < swiper.size - 1) ||
                (slideAfter > 1 && slideAfter <= swiper.size) ||
                (slideBefore <= 0 && slideAfter >= swiper.size);
            if (isVisible) {
                swiper.visibleSlides.push(slide);
                swiper.visibleSlidesIndexes.push(i);
                slides[i].classList.add(params.slideVisibleClass);
            }
            slide.progress = rtl ? -slideProgress : slideProgress;
            slide.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
        }
    }

    function updateProgress(translate) {
        const swiper = this;
        if (typeof translate === "undefined") {
            const multiplier = swiper.rtlTranslate ? -1 : 1;
            // eslint-disable-next-line
            translate = (swiper && swiper.translate && swiper.translate * multiplier) || 0;
        }
        const params = swiper.params;
        const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
        let { progress, isBeginning, isEnd, progressLoop } = swiper;
        const wasBeginning = isBeginning;
        const wasEnd = isEnd;
        if (translatesDiff === 0) {
            progress = 0;
            isBeginning = true;
            isEnd = true;
        } else {
            progress = (translate - swiper.minTranslate()) / translatesDiff;
            const isBeginningRounded = Math.abs(translate - swiper.minTranslate()) < 1;
            const isEndRounded = Math.abs(translate - swiper.maxTranslate()) < 1;
            isBeginning = isBeginningRounded || progress <= 0;
            isEnd = isEndRounded || progress >= 1;
            if (isBeginningRounded) progress = 0;
            if (isEndRounded) progress = 1;
        }
        if (params.loop) {
            const firstSlideIndex = swiper.getSlideIndexByData(0);
            const lastSlideIndex = swiper.getSlideIndexByData(swiper.slides.length - 1);
            const firstSlideTranslate = swiper.slidesGrid[firstSlideIndex];
            const lastSlideTranslate = swiper.slidesGrid[lastSlideIndex];
            const translateMax = swiper.slidesGrid[swiper.slidesGrid.length - 1];
            const translateAbs = Math.abs(translate);
            if (translateAbs >= firstSlideTranslate) {
                progressLoop = (translateAbs - firstSlideTranslate) / translateMax;
            } else {
                progressLoop = (translateAbs + translateMax - lastSlideTranslate) / translateMax;
            }
            if (progressLoop > 1) progressLoop -= 1;
        }
        Object.assign(swiper, {
            progress,
            progressLoop,
            isBeginning,
            isEnd,
        });
        if (params.watchSlidesProgress || (params.centeredSlides && params.autoHeight))
            swiper.updateSlidesProgress(translate);
        if (isBeginning && !wasBeginning) {
            swiper.emit("reachBeginning toEdge");
        }
        if (isEnd && !wasEnd) {
            swiper.emit("reachEnd toEdge");
        }
        if ((wasBeginning && !isBeginning) || (wasEnd && !isEnd)) {
            swiper.emit("fromEdge");
        }
        swiper.emit("progress", progress);
    }

    function updateSlidesClasses() {
        const swiper = this;
        const { slides, params, slidesEl, activeIndex } = swiper;
        const isVirtual = swiper.virtual && params.virtual.enabled;
        const getFilteredSlide = (selector) => {
            return elementChildren(slidesEl, `.${params.slideClass}${selector}, swiper-slide${selector}`)[0];
        };
        slides.forEach((slideEl) => {
            slideEl.classList.remove(params.slideActiveClass, params.slideNextClass, params.slidePrevClass);
        });
        let activeSlide;
        if (isVirtual) {
            if (params.loop) {
                let slideIndex = activeIndex - swiper.virtual.slidesBefore;
                if (slideIndex < 0) slideIndex = swiper.virtual.slides.length + slideIndex;
                if (slideIndex >= swiper.virtual.slides.length) slideIndex -= swiper.virtual.slides.length;
                activeSlide = getFilteredSlide(`[data-swiper-slide-index="${slideIndex}"]`);
            } else {
                activeSlide = getFilteredSlide(`[data-swiper-slide-index="${activeIndex}"]`);
            }
        } else {
            activeSlide = slides[activeIndex];
        }
        if (activeSlide) {
            // Active classes
            activeSlide.classList.add(params.slideActiveClass);

            // Next Slide
            let nextSlide = elementNextAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
            if (params.loop && !nextSlide) {
                nextSlide = slides[0];
            }
            if (nextSlide) {
                nextSlide.classList.add(params.slideNextClass);
            }
            // Prev Slide
            let prevSlide = elementPrevAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
            if (params.loop && !prevSlide === 0) {
                prevSlide = slides[slides.length - 1];
            }
            if (prevSlide) {
                prevSlide.classList.add(params.slidePrevClass);
            }
        }
        swiper.emitSlidesClasses();
    }

    function getActiveIndexByTranslate(swiper) {
        const { slidesGrid, params } = swiper;
        const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
        let activeIndex;
        for (let i = 0; i < slidesGrid.length; i += 1) {
            if (typeof slidesGrid[i + 1] !== "undefined") {
                if (
                    translate >= slidesGrid[i] &&
                    translate < slidesGrid[i + 1] - (slidesGrid[i + 1] - slidesGrid[i]) / 2
                ) {
                    activeIndex = i;
                } else if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1]) {
                    activeIndex = i + 1;
                }
            } else if (translate >= slidesGrid[i]) {
                activeIndex = i;
            }
        }
        // Normalize slideIndex
        if (params.normalizeSlideIndex) {
            if (activeIndex < 0 || typeof activeIndex === "undefined") activeIndex = 0;
        }
        return activeIndex;
    }
    function updateActiveIndex(newActiveIndex) {
        const swiper = this;
        const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
        const {
            snapGrid,
            params,
            activeIndex: previousIndex,
            realIndex: previousRealIndex,
            snapIndex: previousSnapIndex,
        } = swiper;
        let activeIndex = newActiveIndex;
        let snapIndex;
        const getVirtualRealIndex = (aIndex) => {
            let realIndex = aIndex - swiper.virtual.slidesBefore;
            if (realIndex < 0) {
                realIndex = swiper.virtual.slides.length + realIndex;
            }
            if (realIndex >= swiper.virtual.slides.length) {
                realIndex -= swiper.virtual.slides.length;
            }
            return realIndex;
        };
        if (typeof activeIndex === "undefined") {
            activeIndex = getActiveIndexByTranslate(swiper);
        }
        if (snapGrid.indexOf(translate) >= 0) {
            snapIndex = snapGrid.indexOf(translate);
        } else {
            const skip = Math.min(params.slidesPerGroupSkip, activeIndex);
            snapIndex = skip + Math.floor((activeIndex - skip) / params.slidesPerGroup);
        }
        if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
        if (activeIndex === previousIndex) {
            if (snapIndex !== previousSnapIndex) {
                swiper.snapIndex = snapIndex;
                swiper.emit("snapIndexChange");
            }
            if (swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
                swiper.realIndex = getVirtualRealIndex(activeIndex);
            }
            return;
        }
        // Get real index
        let realIndex;
        if (swiper.virtual && params.virtual.enabled && params.loop) {
            realIndex = getVirtualRealIndex(activeIndex);
        } else if (swiper.slides[activeIndex]) {
            realIndex = parseInt(swiper.slides[activeIndex].getAttribute("data-swiper-slide-index") || activeIndex, 10);
        } else {
            realIndex = activeIndex;
        }
        Object.assign(swiper, {
            snapIndex,
            realIndex,
            previousIndex,
            activeIndex,
        });
        swiper.emit("activeIndexChange");
        swiper.emit("snapIndexChange");
        if (previousRealIndex !== realIndex) {
            swiper.emit("realIndexChange");
        }
        if (swiper.initialized || swiper.params.runCallbacksOnInit) {
            swiper.emit("slideChange");
        }
    }

    function updateClickedSlide(e) {
        const swiper = this;
        const params = swiper.params;
        const slide = e.closest(`.${params.slideClass}, swiper-slide`);
        let slideFound = false;
        let slideIndex;
        if (slide) {
            for (let i = 0; i < swiper.slides.length; i += 1) {
                if (swiper.slides[i] === slide) {
                    slideFound = true;
                    slideIndex = i;
                    break;
                }
            }
        }
        if (slide && slideFound) {
            swiper.clickedSlide = slide;
            if (swiper.virtual && swiper.params.virtual.enabled) {
                swiper.clickedIndex = parseInt(slide.getAttribute("data-swiper-slide-index"), 10);
            } else {
                swiper.clickedIndex = slideIndex;
            }
        } else {
            swiper.clickedSlide = undefined;
            swiper.clickedIndex = undefined;
            return;
        }
        if (
            params.slideToClickedSlide &&
            swiper.clickedIndex !== undefined &&
            swiper.clickedIndex !== swiper.activeIndex
        ) {
            swiper.slideToClickedSlide();
        }
    }

    var update = {
        updateSize,
        updateSlides,
        updateAutoHeight,
        updateSlidesOffset,
        updateSlidesProgress,
        updateProgress,
        updateSlidesClasses,
        updateActiveIndex,
        updateClickedSlide,
    };

    function getSwiperTranslate(axis = this.isHorizontal() ? "x" : "y") {
        const swiper = this;
        const { params, rtlTranslate: rtl, translate, wrapperEl } = swiper;
        if (params.virtualTranslate) {
            return rtl ? -translate : translate;
        }
        if (params.cssMode) {
            return translate;
        }
        let currentTranslate = getTranslate(wrapperEl, axis);
        if (rtl) currentTranslate = -currentTranslate;
        return currentTranslate || 0;
    }

    function setTranslate(translate, byController) {
        const swiper = this;
        const { rtlTranslate: rtl, params, wrapperEl, progress } = swiper;
        let x = 0;
        let y = 0;
        const z = 0;
        if (swiper.isHorizontal()) {
            x = rtl ? -translate : translate;
        } else {
            y = translate;
        }
        if (params.roundLengths) {
            x = Math.floor(x);
            y = Math.floor(y);
        }
        if (params.cssMode) {
            wrapperEl[swiper.isHorizontal() ? "scrollLeft" : "scrollTop"] = swiper.isHorizontal() ? -x : -y;
        } else if (!params.virtualTranslate) {
            wrapperEl.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
        }
        swiper.previousTranslate = swiper.translate;
        swiper.translate = swiper.isHorizontal() ? x : y;

        // Check if we need to update progress
        let newProgress;
        const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
        if (translatesDiff === 0) {
            newProgress = 0;
        } else {
            newProgress = (translate - swiper.minTranslate()) / translatesDiff;
        }
        if (newProgress !== progress) {
            swiper.updateProgress(translate);
        }
        swiper.emit("setTranslate", swiper.translate, byController);
    }

    function minTranslate() {
        return -this.snapGrid[0];
    }

    function maxTranslate() {
        return -this.snapGrid[this.snapGrid.length - 1];
    }

    function translateTo(
        translate = 0,
        speed = this.params.speed,
        runCallbacks = true,
        translateBounds = true,
        internal
    ) {
        const swiper = this;
        const { params, wrapperEl } = swiper;
        if (swiper.animating && params.preventInteractionOnTransition) {
            return false;
        }
        const minTranslate = swiper.minTranslate();
        const maxTranslate = swiper.maxTranslate();
        let newTranslate;
        if (translateBounds && translate > minTranslate) newTranslate = minTranslate;
        else if (translateBounds && translate < maxTranslate) newTranslate = maxTranslate;
        else newTranslate = translate;

        // Update progress
        swiper.updateProgress(newTranslate);
        if (params.cssMode) {
            const isH = swiper.isHorizontal();
            if (speed === 0) {
                wrapperEl[isH ? "scrollLeft" : "scrollTop"] = -newTranslate;
            } else {
                if (!swiper.support.smoothScroll) {
                    animateCSSModeScroll({
                        swiper,
                        targetPosition: -newTranslate,
                        side: isH ? "left" : "top",
                    });
                    return true;
                }
                wrapperEl.scrollTo({
                    [isH ? "left" : "top"]: -newTranslate,
                    behavior: "smooth",
                });
            }
            return true;
        }
        if (speed === 0) {
            swiper.setTransition(0);
            swiper.setTranslate(newTranslate);
            if (runCallbacks) {
                swiper.emit("beforeTransitionStart", speed, internal);
                swiper.emit("transitionEnd");
            }
        } else {
            swiper.setTransition(speed);
            swiper.setTranslate(newTranslate);
            if (runCallbacks) {
                swiper.emit("beforeTransitionStart", speed, internal);
                swiper.emit("transitionStart");
            }
            if (!swiper.animating) {
                swiper.animating = true;
                if (!swiper.onTranslateToWrapperTransitionEnd) {
                    swiper.onTranslateToWrapperTransitionEnd = function transitionEnd(e) {
                        if (!swiper || swiper.destroyed) return;
                        if (e.target !== this) return;
                        swiper.wrapperEl.removeEventListener("transitionend", swiper.onTranslateToWrapperTransitionEnd);
                        swiper.onTranslateToWrapperTransitionEnd = null;
                        delete swiper.onTranslateToWrapperTransitionEnd;
                        if (runCallbacks) {
                            swiper.emit("transitionEnd");
                        }
                    };
                }
                swiper.wrapperEl.addEventListener("transitionend", swiper.onTranslateToWrapperTransitionEnd);
            }
        }
        return true;
    }

    var translate = {
        getTranslate: getSwiperTranslate,
        setTranslate,
        minTranslate,
        maxTranslate,
        translateTo,
    };

    function setTransition(duration, byController) {
        const swiper = this;
        if (!swiper.params.cssMode) {
            swiper.wrapperEl.style.transitionDuration = `${duration}ms`;
        }
        swiper.emit("setTransition", duration, byController);
    }

    function transitionEmit({ swiper, runCallbacks, direction, step }) {
        const { activeIndex, previousIndex } = swiper;
        let dir = direction;
        if (!dir) {
            if (activeIndex > previousIndex) dir = "next";
            else if (activeIndex < previousIndex) dir = "prev";
            else dir = "reset";
        }
        swiper.emit(`transition${step}`);
        if (runCallbacks && activeIndex !== previousIndex) {
            if (dir === "reset") {
                swiper.emit(`slideResetTransition${step}`);
                return;
            }
            swiper.emit(`slideChangeTransition${step}`);
            if (dir === "next") {
                swiper.emit(`slideNextTransition${step}`);
            } else {
                swiper.emit(`slidePrevTransition${step}`);
            }
        }
    }

    function transitionStart(runCallbacks = true, direction) {
        const swiper = this;
        const { params } = swiper;
        if (params.cssMode) return;
        if (params.autoHeight) {
            swiper.updateAutoHeight();
        }
        transitionEmit({
            swiper,
            runCallbacks,
            direction,
            step: "Start",
        });
    }

    function transitionEnd(runCallbacks = true, direction) {
        const swiper = this;
        const { params } = swiper;
        swiper.animating = false;
        if (params.cssMode) return;
        swiper.setTransition(0);
        transitionEmit({
            swiper,
            runCallbacks,
            direction,
            step: "End",
        });
    }

    var transition = {
        setTransition,
        transitionStart,
        transitionEnd,
    };

    function slideTo(index = 0, speed = this.params.speed, runCallbacks = true, internal, initial) {
        if (typeof index === "string") {
            index = parseInt(index, 10);
        }
        const swiper = this;
        let slideIndex = index;
        if (slideIndex < 0) slideIndex = 0;
        const {
            params,
            snapGrid,
            slidesGrid,
            previousIndex,
            activeIndex,
            rtlTranslate: rtl,
            wrapperEl,
            enabled,
        } = swiper;
        if ((swiper.animating && params.preventInteractionOnTransition) || (!enabled && !internal && !initial)) {
            return false;
        }
        const skip = Math.min(swiper.params.slidesPerGroupSkip, slideIndex);
        let snapIndex = skip + Math.floor((slideIndex - skip) / swiper.params.slidesPerGroup);
        if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
        const translate = -snapGrid[snapIndex];
        // Normalize slideIndex
        if (params.normalizeSlideIndex) {
            for (let i = 0; i < slidesGrid.length; i += 1) {
                const normalizedTranslate = -Math.floor(translate * 100);
                const normalizedGrid = Math.floor(slidesGrid[i] * 100);
                const normalizedGridNext = Math.floor(slidesGrid[i + 1] * 100);
                if (typeof slidesGrid[i + 1] !== "undefined") {
                    if (
                        normalizedTranslate >= normalizedGrid &&
                        normalizedTranslate < normalizedGridNext - (normalizedGridNext - normalizedGrid) / 2
                    ) {
                        slideIndex = i;
                    } else if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext) {
                        slideIndex = i + 1;
                    }
                } else if (normalizedTranslate >= normalizedGrid) {
                    slideIndex = i;
                }
            }
        }
        // Directions locks
        if (swiper.initialized && slideIndex !== activeIndex) {
            if (!swiper.allowSlideNext && translate < swiper.translate && translate < swiper.minTranslate()) {
                return false;
            }
            if (!swiper.allowSlidePrev && translate > swiper.translate && translate > swiper.maxTranslate()) {
                if ((activeIndex || 0) !== slideIndex) {
                    return false;
                }
            }
        }
        if (slideIndex !== (previousIndex || 0) && runCallbacks) {
            swiper.emit("beforeSlideChangeStart");
        }

        // Update progress
        swiper.updateProgress(translate);
        let direction;
        if (slideIndex > activeIndex) direction = "next";
        else if (slideIndex < activeIndex) direction = "prev";
        else direction = "reset";

        // Update Index
        if ((rtl && -translate === swiper.translate) || (!rtl && translate === swiper.translate)) {
            swiper.updateActiveIndex(slideIndex);
            // Update Height
            if (params.autoHeight) {
                swiper.updateAutoHeight();
            }
            swiper.updateSlidesClasses();
            if (params.effect !== "slide") {
                swiper.setTranslate(translate);
            }
            if (direction !== "reset") {
                swiper.transitionStart(runCallbacks, direction);
                swiper.transitionEnd(runCallbacks, direction);
            }
            return false;
        }
        if (params.cssMode) {
            const isH = swiper.isHorizontal();
            const t = rtl ? translate : -translate;
            if (speed === 0) {
                const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
                if (isVirtual) {
                    swiper.wrapperEl.style.scrollSnapType = "none";
                    swiper._immediateVirtual = true;
                }
                if (isVirtual && !swiper._cssModeVirtualInitialSet && swiper.params.initialSlide > 0) {
                    swiper._cssModeVirtualInitialSet = true;
                    requestAnimationFrame(() => {
                        wrapperEl[isH ? "scrollLeft" : "scrollTop"] = t;
                    });
                } else {
                    wrapperEl[isH ? "scrollLeft" : "scrollTop"] = t;
                }
                if (isVirtual) {
                    requestAnimationFrame(() => {
                        swiper.wrapperEl.style.scrollSnapType = "";
                        swiper._immediateVirtual = false;
                    });
                }
            } else {
                if (!swiper.support.smoothScroll) {
                    animateCSSModeScroll({
                        swiper,
                        targetPosition: t,
                        side: isH ? "left" : "top",
                    });
                    return true;
                }
                wrapperEl.scrollTo({
                    [isH ? "left" : "top"]: t,
                    behavior: "smooth",
                });
            }
            return true;
        }
        swiper.setTransition(speed);
        swiper.setTranslate(translate);
        swiper.updateActiveIndex(slideIndex);
        swiper.updateSlidesClasses();
        swiper.emit("beforeTransitionStart", speed, internal);
        swiper.transitionStart(runCallbacks, direction);
        if (speed === 0) {
            swiper.transitionEnd(runCallbacks, direction);
        } else if (!swiper.animating) {
            swiper.animating = true;
            if (!swiper.onSlideToWrapperTransitionEnd) {
                swiper.onSlideToWrapperTransitionEnd = function transitionEnd(e) {
                    if (!swiper || swiper.destroyed) return;
                    if (e.target !== this) return;
                    swiper.wrapperEl.removeEventListener("transitionend", swiper.onSlideToWrapperTransitionEnd);
                    swiper.onSlideToWrapperTransitionEnd = null;
                    delete swiper.onSlideToWrapperTransitionEnd;
                    swiper.transitionEnd(runCallbacks, direction);
                };
            }
            swiper.wrapperEl.addEventListener("transitionend", swiper.onSlideToWrapperTransitionEnd);
        }
        return true;
    }

    function slideToLoop(index = 0, speed = this.params.speed, runCallbacks = true, internal) {
        if (typeof index === "string") {
            const indexAsNumber = parseInt(index, 10);
            index = indexAsNumber;
        }
        const swiper = this;
        let newIndex = index;
        if (swiper.params.loop) {
            if (swiper.virtual && swiper.params.virtual.enabled) {
                // eslint-disable-next-line
                newIndex = newIndex + swiper.virtual.slidesBefore;
            } else {
                newIndex = swiper.getSlideIndexByData(newIndex);
            }
        }
        return swiper.slideTo(newIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideNext(speed = this.params.speed, runCallbacks = true, internal) {
        const swiper = this;
        const { enabled, params, animating } = swiper;
        if (!enabled) return swiper;
        let perGroup = params.slidesPerGroup;
        if (params.slidesPerView === "auto" && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
            perGroup = Math.max(swiper.slidesPerViewDynamic("current", true), 1);
        }
        const increment = swiper.activeIndex < params.slidesPerGroupSkip ? 1 : perGroup;
        const isVirtual = swiper.virtual && params.virtual.enabled;
        if (params.loop) {
            if (animating && !isVirtual && params.loopPreventsSliding) return false;
            swiper.loopFix({
                direction: "next",
            });
            // eslint-disable-next-line
            swiper._clientLeft = swiper.wrapperEl.clientLeft;
        }
        if (params.rewind && swiper.isEnd) {
            return swiper.slideTo(0, speed, runCallbacks, internal);
        }
        return swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slidePrev(speed = this.params.speed, runCallbacks = true, internal) {
        const swiper = this;
        const { params, snapGrid, slidesGrid, rtlTranslate, enabled, animating } = swiper;
        if (!enabled) return swiper;
        const isVirtual = swiper.virtual && params.virtual.enabled;
        if (params.loop) {
            if (animating && !isVirtual && params.loopPreventsSliding) return false;
            swiper.loopFix({
                direction: "prev",
            });
            // eslint-disable-next-line
            swiper._clientLeft = swiper.wrapperEl.clientLeft;
        }
        const translate = rtlTranslate ? swiper.translate : -swiper.translate;
        function normalize(val) {
            if (val < 0) return -Math.floor(Math.abs(val));
            return Math.floor(val);
        }
        const normalizedTranslate = normalize(translate);
        const normalizedSnapGrid = snapGrid.map((val) => normalize(val));
        let prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
        if (typeof prevSnap === "undefined" && params.cssMode) {
            let prevSnapIndex;
            snapGrid.forEach((snap, snapIndex) => {
                if (normalizedTranslate >= snap) {
                    // prevSnap = snap;
                    prevSnapIndex = snapIndex;
                }
            });
            if (typeof prevSnapIndex !== "undefined") {
                prevSnap = snapGrid[prevSnapIndex > 0 ? prevSnapIndex - 1 : prevSnapIndex];
            }
        }
        let prevIndex = 0;
        if (typeof prevSnap !== "undefined") {
            prevIndex = slidesGrid.indexOf(prevSnap);
            if (prevIndex < 0) prevIndex = swiper.activeIndex - 1;
            if (params.slidesPerView === "auto" && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
                prevIndex = prevIndex - swiper.slidesPerViewDynamic("previous", true) + 1;
                prevIndex = Math.max(prevIndex, 0);
            }
        }
        if (params.rewind && swiper.isBeginning) {
            const lastIndex =
                swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual
                    ? swiper.virtual.slides.length - 1
                    : swiper.slides.length - 1;
            return swiper.slideTo(lastIndex, speed, runCallbacks, internal);
        }
        return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideReset(speed = this.params.speed, runCallbacks = true, internal) {
        const swiper = this;
        return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideToClosest(speed = this.params.speed, runCallbacks = true, internal, threshold = 0.5) {
        const swiper = this;
        let index = swiper.activeIndex;
        const skip = Math.min(swiper.params.slidesPerGroupSkip, index);
        const snapIndex = skip + Math.floor((index - skip) / swiper.params.slidesPerGroup);
        const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
        if (translate >= swiper.snapGrid[snapIndex]) {
            // The current translate is on or after the current snap index, so the choice
            // is between the current index and the one after it.
            const currentSnap = swiper.snapGrid[snapIndex];
            const nextSnap = swiper.snapGrid[snapIndex + 1];
            if (translate - currentSnap > (nextSnap - currentSnap) * threshold) {
                index += swiper.params.slidesPerGroup;
            }
        } else {
            // The current translate is before the current snap index, so the choice
            // is between the current index and the one before it.
            const prevSnap = swiper.snapGrid[snapIndex - 1];
            const currentSnap = swiper.snapGrid[snapIndex];
            if (translate - prevSnap <= (currentSnap - prevSnap) * threshold) {
                index -= swiper.params.slidesPerGroup;
            }
        }
        index = Math.max(index, 0);
        index = Math.min(index, swiper.slidesGrid.length - 1);
        return swiper.slideTo(index, speed, runCallbacks, internal);
    }

    function slideToClickedSlide() {
        const swiper = this;
        const { params, slidesEl } = swiper;
        const slidesPerView = params.slidesPerView === "auto" ? swiper.slidesPerViewDynamic() : params.slidesPerView;
        let slideToIndex = swiper.clickedIndex;
        let realIndex;
        const slideSelector = swiper.isElement ? `swiper-slide` : `.${params.slideClass}`;
        if (params.loop) {
            if (swiper.animating) return;
            realIndex = parseInt(swiper.clickedSlide.getAttribute("data-swiper-slide-index"), 10);
            if (params.centeredSlides) {
                if (
                    slideToIndex < swiper.loopedSlides - slidesPerView / 2 ||
                    slideToIndex > swiper.slides.length - swiper.loopedSlides + slidesPerView / 2
                ) {
                    swiper.loopFix();
                    slideToIndex = swiper.getSlideIndex(
                        elementChildren(slidesEl, `${slideSelector}[data-swiper-slide-index="${realIndex}"]`)[0]
                    );
                    nextTick(() => {
                        swiper.slideTo(slideToIndex);
                    });
                } else {
                    swiper.slideTo(slideToIndex);
                }
            } else if (slideToIndex > swiper.slides.length - slidesPerView) {
                swiper.loopFix();
                slideToIndex = swiper.getSlideIndex(
                    elementChildren(slidesEl, `${slideSelector}[data-swiper-slide-index="${realIndex}"]`)[0]
                );
                nextTick(() => {
                    swiper.slideTo(slideToIndex);
                });
            } else {
                swiper.slideTo(slideToIndex);
            }
        } else {
            swiper.slideTo(slideToIndex);
        }
    }

    var slide = {
        slideTo,
        slideToLoop,
        slideNext,
        slidePrev,
        slideReset,
        slideToClosest,
        slideToClickedSlide,
    };

    function loopCreate(slideRealIndex) {
        const swiper = this;
        const { params, slidesEl } = swiper;
        if (!params.loop || (swiper.virtual && swiper.params.virtual.enabled)) return;
        const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
        slides.forEach((el, index) => {
            el.setAttribute("data-swiper-slide-index", index);
        });
        swiper.loopFix({
            slideRealIndex,
            direction: params.centeredSlides ? undefined : "next",
        });
    }

    function loopFix({
        slideRealIndex,
        slideTo = true,
        direction,
        setTranslate,
        activeSlideIndex,
        byController,
        byMousewheel,
    } = {}) {
        const swiper = this;
        if (!swiper.params.loop) return;
        swiper.emit("beforeLoopFix");
        const { slides, allowSlidePrev, allowSlideNext, slidesEl, params } = swiper;
        swiper.allowSlidePrev = true;
        swiper.allowSlideNext = true;
        if (swiper.virtual && params.virtual.enabled) {
            if (slideTo) {
                if (!params.centeredSlides && swiper.snapIndex === 0) {
                    swiper.slideTo(swiper.virtual.slides.length, 0, false, true);
                } else if (params.centeredSlides && swiper.snapIndex < params.slidesPerView) {
                    swiper.slideTo(swiper.virtual.slides.length + swiper.snapIndex, 0, false, true);
                } else if (swiper.snapIndex === swiper.snapGrid.length - 1) {
                    swiper.slideTo(swiper.virtual.slidesBefore, 0, false, true);
                }
            }
            swiper.allowSlidePrev = allowSlidePrev;
            swiper.allowSlideNext = allowSlideNext;
            swiper.emit("loopFix");
            return;
        }
        const slidesPerView =
            params.slidesPerView === "auto"
                ? swiper.slidesPerViewDynamic()
                : Math.ceil(parseFloat(params.slidesPerView, 10));
        let loopedSlides = params.loopedSlides || slidesPerView;
        if (loopedSlides % params.slidesPerGroup !== 0) {
            loopedSlides += params.slidesPerGroup - (loopedSlides % params.slidesPerGroup);
        }
        swiper.loopedSlides = loopedSlides;
        const prependSlidesIndexes = [];
        const appendSlidesIndexes = [];
        let activeIndex = swiper.activeIndex;
        if (typeof activeSlideIndex === "undefined") {
            activeSlideIndex = swiper.getSlideIndex(
                swiper.slides.filter((el) => el.classList.contains(params.slideActiveClass))[0]
            );
        } else {
            activeIndex = activeSlideIndex;
        }
        const isNext = direction === "next" || !direction;
        const isPrev = direction === "prev" || !direction;
        let slidesPrepended = 0;
        let slidesAppended = 0;
        // prepend last slides before start
        if (activeSlideIndex < loopedSlides) {
            slidesPrepended = Math.max(loopedSlides - activeSlideIndex, params.slidesPerGroup);
            for (let i = 0; i < loopedSlides - activeSlideIndex; i += 1) {
                const index = i - Math.floor(i / slides.length) * slides.length;
                prependSlidesIndexes.push(slides.length - index - 1);
            }
        } else if (activeSlideIndex /* + slidesPerView */ > swiper.slides.length - loopedSlides * 2) {
            slidesAppended = Math.max(
                activeSlideIndex - (swiper.slides.length - loopedSlides * 2),
                params.slidesPerGroup
            );
            for (let i = 0; i < slidesAppended; i += 1) {
                const index = i - Math.floor(i / slides.length) * slides.length;
                appendSlidesIndexes.push(index);
            }
        }
        if (isPrev) {
            prependSlidesIndexes.forEach((index) => {
                slidesEl.prepend(swiper.slides[index]);
            });
        }
        if (isNext) {
            appendSlidesIndexes.forEach((index) => {
                slidesEl.append(swiper.slides[index]);
            });
        }
        swiper.recalcSlides();
        if (params.watchSlidesProgress) {
            swiper.updateSlidesOffset();
        }
        if (slideTo) {
            if (prependSlidesIndexes.length > 0 && isPrev) {
                if (typeof slideRealIndex === "undefined") {
                    const currentSlideTranslate = swiper.slidesGrid[activeIndex];
                    const newSlideTranslate = swiper.slidesGrid[activeIndex + slidesPrepended];
                    const diff = newSlideTranslate - currentSlideTranslate;
                    if (byMousewheel) {
                        swiper.setTranslate(swiper.translate - diff);
                    } else {
                        swiper.slideTo(activeIndex + slidesPrepended, 0, false, true);
                        if (setTranslate) {
                            swiper.touches[swiper.isHorizontal() ? "startX" : "startY"] += diff;
                        }
                    }
                } else {
                    if (setTranslate) {
                        swiper.slideToLoop(slideRealIndex, 0, false, true);
                    }
                }
            } else if (appendSlidesIndexes.length > 0 && isNext) {
                if (typeof slideRealIndex === "undefined") {
                    const currentSlideTranslate = swiper.slidesGrid[activeIndex];
                    const newSlideTranslate = swiper.slidesGrid[activeIndex - slidesAppended];
                    const diff = newSlideTranslate - currentSlideTranslate;
                    if (byMousewheel) {
                        swiper.setTranslate(swiper.translate - diff);
                    } else {
                        swiper.slideTo(activeIndex - slidesAppended, 0, false, true);
                        if (setTranslate) {
                            swiper.touches[swiper.isHorizontal() ? "startX" : "startY"] += diff;
                        }
                    }
                } else {
                    swiper.slideToLoop(slideRealIndex, 0, false, true);
                }
            }
        }
        swiper.allowSlidePrev = allowSlidePrev;
        swiper.allowSlideNext = allowSlideNext;
        if (swiper.controller && swiper.controller.control && !byController) {
            const loopParams = {
                slideRealIndex,
                slideTo: false,
                direction,
                setTranslate,
                activeSlideIndex,
                byController: true,
            };
            if (Array.isArray(swiper.controller.control)) {
                swiper.controller.control.forEach((c) => {
                    if (!c.destroyed && c.params.loop) c.loopFix(loopParams);
                });
            } else if (
                swiper.controller.control instanceof swiper.constructor &&
                swiper.controller.control.params.loop
            ) {
                swiper.controller.control.loopFix(loopParams);
            }
        }
        swiper.emit("loopFix");
    }

    function loopDestroy() {
        const swiper = this;
        const { params, slidesEl } = swiper;
        if (!params.loop || (swiper.virtual && swiper.params.virtual.enabled)) return;
        swiper.recalcSlides();
        const newSlidesOrder = [];
        swiper.slides.forEach((slideEl) => {
            const index =
                typeof slideEl.swiperSlideIndex === "undefined"
                    ? slideEl.getAttribute("data-swiper-slide-index") * 1
                    : slideEl.swiperSlideIndex;
            newSlidesOrder[index] = slideEl;
        });
        swiper.slides.forEach((slideEl) => {
            slideEl.removeAttribute("data-swiper-slide-index");
        });
        newSlidesOrder.forEach((slideEl) => {
            slidesEl.append(slideEl);
        });
        swiper.recalcSlides();
        swiper.slideTo(swiper.realIndex, 0);
    }

    var loop = {
        loopCreate,
        loopFix,
        loopDestroy,
    };

    function setGrabCursor(moving) {
        const swiper = this;
        if (!swiper.params.simulateTouch || (swiper.params.watchOverflow && swiper.isLocked) || swiper.params.cssMode)
            return;
        const el = swiper.params.touchEventsTarget === "container" ? swiper.el : swiper.wrapperEl;
        if (swiper.isElement) {
            swiper.__preventObserver__ = true;
        }
        el.style.cursor = "move";
        el.style.cursor = moving ? "grabbing" : "grab";
        if (swiper.isElement) {
            requestAnimationFrame(() => {
                swiper.__preventObserver__ = false;
            });
        }
    }

    function unsetGrabCursor() {
        const swiper = this;
        if ((swiper.params.watchOverflow && swiper.isLocked) || swiper.params.cssMode) {
            return;
        }
        if (swiper.isElement) {
            swiper.__preventObserver__ = true;
        }
        swiper[swiper.params.touchEventsTarget === "container" ? "el" : "wrapperEl"].style.cursor = "";
        if (swiper.isElement) {
            requestAnimationFrame(() => {
                swiper.__preventObserver__ = false;
            });
        }
    }

    var grabCursor = {
        setGrabCursor,
        unsetGrabCursor,
    };

    // Modified from https://stackoverflow.com/questions/54520554/custom-element-getrootnode-closest-function-crossing-multiple-parent-shadowd
    function closestElement(selector, base = this) {
        function __closestFrom(el) {
            if (!el || el === getDocument() || el === getWindow()) return null;
            if (el.assignedSlot) el = el.assignedSlot;
            const found = el.closest(selector);
            if (!found && !el.getRootNode) {
                return null;
            }
            return found || __closestFrom(el.getRootNode().host);
        }
        return __closestFrom(base);
    }
    function onTouchStart(event) {
        const swiper = this;
        const document = getDocument();
        const window = getWindow();
        const data = swiper.touchEventsData;
        data.evCache.push(event);
        const { params, touches, enabled } = swiper;
        if (!enabled) return;
        if (!params.simulateTouch && event.pointerType === "mouse") return;
        if (swiper.animating && params.preventInteractionOnTransition) {
            return;
        }
        if (!swiper.animating && params.cssMode && params.loop) {
            swiper.loopFix();
        }
        let e = event;
        if (e.originalEvent) e = e.originalEvent;
        let targetEl = e.target;
        if (params.touchEventsTarget === "wrapper") {
            if (!swiper.wrapperEl.contains(targetEl)) return;
        }
        if ("which" in e && e.which === 3) return;
        if ("button" in e && e.button > 0) return;
        if (data.isTouched && data.isMoved) return;

        // change target el for shadow root component
        const swipingClassHasValue = !!params.noSwipingClass && params.noSwipingClass !== "";
        // eslint-disable-next-line
        const eventPath = event.composedPath ? event.composedPath() : event.path;
        if (swipingClassHasValue && e.target && e.target.shadowRoot && eventPath) {
            targetEl = eventPath[0];
        }
        const noSwipingSelector = params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`;
        const isTargetShadow = !!(e.target && e.target.shadowRoot);

        // use closestElement for shadow root element to get the actual closest for nested shadow root element
        if (
            params.noSwiping &&
            (isTargetShadow ? closestElement(noSwipingSelector, targetEl) : targetEl.closest(noSwipingSelector))
        ) {
            swiper.allowClick = true;
            return;
        }
        if (params.swipeHandler) {
            if (!targetEl.closest(params.swipeHandler)) return;
        }
        touches.currentX = e.pageX;
        touches.currentY = e.pageY;
        const startX = touches.currentX;
        const startY = touches.currentY;

        // Do NOT start if iOS edge swipe is detected. Otherwise iOS app cannot swipe-to-go-back anymore

        const edgeSwipeDetection = params.edgeSwipeDetection || params.iOSEdgeSwipeDetection;
        const edgeSwipeThreshold = params.edgeSwipeThreshold || params.iOSEdgeSwipeThreshold;
        if (edgeSwipeDetection && (startX <= edgeSwipeThreshold || startX >= window.innerWidth - edgeSwipeThreshold)) {
            if (edgeSwipeDetection === "prevent") {
                event.preventDefault();
            } else {
                return;
            }
        }
        Object.assign(data, {
            isTouched: true,
            isMoved: false,
            allowTouchCallbacks: true,
            isScrolling: undefined,
            startMoving: undefined,
        });
        touches.startX = startX;
        touches.startY = startY;
        data.touchStartTime = now();
        swiper.allowClick = true;
        swiper.updateSize();
        swiper.swipeDirection = undefined;
        if (params.threshold > 0) data.allowThresholdMove = false;
        let preventDefault = true;
        if (targetEl.matches(data.focusableElements)) {
            preventDefault = false;
            if (targetEl.nodeName === "SELECT") {
                data.isTouched = false;
            }
        }
        if (
            document.activeElement &&
            document.activeElement.matches(data.focusableElements) &&
            document.activeElement !== targetEl
        ) {
            document.activeElement.blur();
        }
        const shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;
        if ((params.touchStartForcePreventDefault || shouldPreventDefault) && !targetEl.isContentEditable) {
            e.preventDefault();
        }
        if (
            swiper.params.freeMode &&
            swiper.params.freeMode.enabled &&
            swiper.freeMode &&
            swiper.animating &&
            !params.cssMode
        ) {
            swiper.freeMode.onTouchStart();
        }
        swiper.emit("touchStart", e);
    }

    function onTouchMove(event) {
        const document = getDocument();
        const swiper = this;
        const data = swiper.touchEventsData;
        const { params, touches, rtlTranslate: rtl, enabled } = swiper;
        if (!enabled) return;
        if (!params.simulateTouch && event.pointerType === "mouse") return;
        let e = event;
        if (e.originalEvent) e = e.originalEvent;
        if (!data.isTouched) {
            if (data.startMoving && data.isScrolling) {
                swiper.emit("touchMoveOpposite", e);
            }
            return;
        }
        const pointerIndex = data.evCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId);
        if (pointerIndex >= 0) data.evCache[pointerIndex] = e;
        const targetTouch = data.evCache.length > 1 ? data.evCache[0] : e;
        const pageX = targetTouch.pageX;
        const pageY = targetTouch.pageY;
        if (e.preventedByNestedSwiper) {
            touches.startX = pageX;
            touches.startY = pageY;
            return;
        }
        if (!swiper.allowTouchMove) {
            if (!e.target.matches(data.focusableElements)) {
                swiper.allowClick = false;
            }
            if (data.isTouched) {
                Object.assign(touches, {
                    startX: pageX,
                    startY: pageY,
                    prevX: swiper.touches.currentX,
                    prevY: swiper.touches.currentY,
                    currentX: pageX,
                    currentY: pageY,
                });
                data.touchStartTime = now();
            }
            return;
        }
        if (params.touchReleaseOnEdges && !params.loop) {
            if (swiper.isVertical()) {
                // Vertical
                if (
                    (pageY < touches.startY && swiper.translate <= swiper.maxTranslate()) ||
                    (pageY > touches.startY && swiper.translate >= swiper.minTranslate())
                ) {
                    data.isTouched = false;
                    data.isMoved = false;
                    return;
                }
            } else if (
                (pageX < touches.startX && swiper.translate <= swiper.maxTranslate()) ||
                (pageX > touches.startX && swiper.translate >= swiper.minTranslate())
            ) {
                return;
            }
        }
        if (document.activeElement) {
            if (e.target === document.activeElement && e.target.matches(data.focusableElements)) {
                data.isMoved = true;
                swiper.allowClick = false;
                return;
            }
        }
        if (data.allowTouchCallbacks) {
            swiper.emit("touchMove", e);
        }
        if (e.targetTouches && e.targetTouches.length > 1) return;
        touches.currentX = pageX;
        touches.currentY = pageY;
        const diffX = touches.currentX - touches.startX;
        const diffY = touches.currentY - touches.startY;
        if (swiper.params.threshold && Math.sqrt(diffX ** 2 + diffY ** 2) < swiper.params.threshold) return;
        if (typeof data.isScrolling === "undefined") {
            let touchAngle;
            if (
                (swiper.isHorizontal() && touches.currentY === touches.startY) ||
                (swiper.isVertical() && touches.currentX === touches.startX)
            ) {
                data.isScrolling = false;
            } else {
                // eslint-disable-next-line
                if (diffX * diffX + diffY * diffY >= 25) {
                    touchAngle = (Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180) / Math.PI;
                    data.isScrolling = swiper.isHorizontal()
                        ? touchAngle > params.touchAngle
                        : 90 - touchAngle > params.touchAngle;
                }
            }
        }
        if (data.isScrolling) {
            swiper.emit("touchMoveOpposite", e);
        }
        if (typeof data.startMoving === "undefined") {
            if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
                data.startMoving = true;
            }
        }
        if (
            data.isScrolling ||
            (swiper.zoom && swiper.params.zoom && swiper.params.zoom.enabled && data.evCache.length > 1)
        ) {
            data.isTouched = false;
            return;
        }
        if (!data.startMoving) {
            return;
        }
        swiper.allowClick = false;
        if (!params.cssMode && e.cancelable) {
            e.preventDefault();
        }
        if (params.touchMoveStopPropagation && !params.nested) {
            e.stopPropagation();
        }
        let diff = swiper.isHorizontal() ? diffX : diffY;
        let touchesDiff = swiper.isHorizontal()
            ? touches.currentX - touches.previousX
            : touches.currentY - touches.previousY;
        if (params.oneWayMovement) {
            diff = Math.abs(diff) * (rtl ? 1 : -1);
            touchesDiff = Math.abs(touchesDiff) * (rtl ? 1 : -1);
        }
        touches.diff = diff;
        diff *= params.touchRatio;
        if (rtl) {
            diff = -diff;
            touchesDiff = -touchesDiff;
        }
        const prevTouchesDirection = swiper.touchesDirection;
        swiper.swipeDirection = diff > 0 ? "prev" : "next";
        swiper.touchesDirection = touchesDiff > 0 ? "prev" : "next";
        const isLoop = swiper.params.loop && !params.cssMode;
        if (!data.isMoved) {
            if (isLoop) {
                swiper.loopFix({
                    direction: swiper.swipeDirection,
                });
            }
            data.startTranslate = swiper.getTranslate();
            swiper.setTransition(0);
            if (swiper.animating) {
                const evt = new window.CustomEvent("transitionend", {
                    bubbles: true,
                    cancelable: true,
                });
                swiper.wrapperEl.dispatchEvent(evt);
            }
            data.allowMomentumBounce = false;
            // Grab Cursor
            if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
                swiper.setGrabCursor(true);
            }
            swiper.emit("sliderFirstMove", e);
        }
        let loopFixed;
        if (data.isMoved && prevTouchesDirection !== swiper.touchesDirection && isLoop && Math.abs(diff) >= 1) {
            // need another loop fix
            swiper.loopFix({
                direction: swiper.swipeDirection,
                setTranslate: true,
            });
            loopFixed = true;
        }
        swiper.emit("sliderMove", e);
        data.isMoved = true;
        data.currentTranslate = diff + data.startTranslate;
        let disableParentSwiper = true;
        let resistanceRatio = params.resistanceRatio;
        if (params.touchReleaseOnEdges) {
            resistanceRatio = 0;
        }
        if (diff > 0) {
            if (
                isLoop &&
                !loopFixed &&
                data.currentTranslate >
                    (params.centeredSlides ? swiper.minTranslate() - swiper.size / 2 : swiper.minTranslate())
            ) {
                swiper.loopFix({
                    direction: "prev",
                    setTranslate: true,
                    activeSlideIndex: 0,
                });
            }
            if (data.currentTranslate > swiper.minTranslate()) {
                disableParentSwiper = false;
                if (params.resistance) {
                    data.currentTranslate =
                        swiper.minTranslate() -
                        1 +
                        (-swiper.minTranslate() + data.startTranslate + diff) ** resistanceRatio;
                }
            }
        } else if (diff < 0) {
            if (
                isLoop &&
                !loopFixed &&
                data.currentTranslate <
                    (params.centeredSlides ? swiper.maxTranslate() + swiper.size / 2 : swiper.maxTranslate())
            ) {
                swiper.loopFix({
                    direction: "next",
                    setTranslate: true,
                    activeSlideIndex:
                        swiper.slides.length -
                        (params.slidesPerView === "auto"
                            ? swiper.slidesPerViewDynamic()
                            : Math.ceil(parseFloat(params.slidesPerView, 10))),
                });
            }
            if (data.currentTranslate < swiper.maxTranslate()) {
                disableParentSwiper = false;
                if (params.resistance) {
                    data.currentTranslate =
                        swiper.maxTranslate() +
                        1 -
                        (swiper.maxTranslate() - data.startTranslate - diff) ** resistanceRatio;
                }
            }
        }
        if (disableParentSwiper) {
            e.preventedByNestedSwiper = true;
        }

        // Directions locks
        if (!swiper.allowSlideNext && swiper.swipeDirection === "next" && data.currentTranslate < data.startTranslate) {
            data.currentTranslate = data.startTranslate;
        }
        if (!swiper.allowSlidePrev && swiper.swipeDirection === "prev" && data.currentTranslate > data.startTranslate) {
            data.currentTranslate = data.startTranslate;
        }
        if (!swiper.allowSlidePrev && !swiper.allowSlideNext) {
            data.currentTranslate = data.startTranslate;
        }

        // Threshold
        if (params.threshold > 0) {
            if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
                if (!data.allowThresholdMove) {
                    data.allowThresholdMove = true;
                    touches.startX = touches.currentX;
                    touches.startY = touches.currentY;
                    data.currentTranslate = data.startTranslate;
                    touches.diff = swiper.isHorizontal()
                        ? touches.currentX - touches.startX
                        : touches.currentY - touches.startY;
                    return;
                }
            } else {
                data.currentTranslate = data.startTranslate;
                return;
            }
        }
        if (!params.followFinger || params.cssMode) return;

        // Update active index in free mode
        if ((params.freeMode && params.freeMode.enabled && swiper.freeMode) || params.watchSlidesProgress) {
            swiper.updateActiveIndex();
            swiper.updateSlidesClasses();
        }
        if (swiper.params.freeMode && params.freeMode.enabled && swiper.freeMode) {
            swiper.freeMode.onTouchMove();
        }
        // Update progress
        swiper.updateProgress(data.currentTranslate);
        // Update translate
        swiper.setTranslate(data.currentTranslate);
    }

    function onTouchEnd(event) {
        const swiper = this;
        const data = swiper.touchEventsData;
        const pointerIndex = data.evCache.findIndex((cachedEv) => cachedEv.pointerId === event.pointerId);
        if (pointerIndex >= 0) {
            data.evCache.splice(pointerIndex, 1);
        }
        if (["pointercancel", "pointerout", "pointerleave"].includes(event.type)) {
            const proceed = event.type === "pointercancel" && (swiper.browser.isSafari || swiper.browser.isWebView);
            if (!proceed) {
                return;
            }
        }
        const { params, touches, rtlTranslate: rtl, slidesGrid, enabled } = swiper;
        if (!enabled) return;
        if (!params.simulateTouch && event.pointerType === "mouse") return;
        let e = event;
        if (e.originalEvent) e = e.originalEvent;
        if (data.allowTouchCallbacks) {
            swiper.emit("touchEnd", e);
        }
        data.allowTouchCallbacks = false;
        if (!data.isTouched) {
            if (data.isMoved && params.grabCursor) {
                swiper.setGrabCursor(false);
            }
            data.isMoved = false;
            data.startMoving = false;
            return;
        }
        // Return Grab Cursor
        if (
            params.grabCursor &&
            data.isMoved &&
            data.isTouched &&
            (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)
        ) {
            swiper.setGrabCursor(false);
        }

        // Time diff
        const touchEndTime = now();
        const timeDiff = touchEndTime - data.touchStartTime;

        // Tap, doubleTap, Click
        if (swiper.allowClick) {
            const pathTree = e.path || (e.composedPath && e.composedPath());
            swiper.updateClickedSlide((pathTree && pathTree[0]) || e.target);
            swiper.emit("tap click", e);
            if (timeDiff < 300 && touchEndTime - data.lastClickTime < 300) {
                swiper.emit("doubleTap doubleClick", e);
            }
        }
        data.lastClickTime = now();
        nextTick(() => {
            if (!swiper.destroyed) swiper.allowClick = true;
        });
        if (
            !data.isTouched ||
            !data.isMoved ||
            !swiper.swipeDirection ||
            touches.diff === 0 ||
            data.currentTranslate === data.startTranslate
        ) {
            data.isTouched = false;
            data.isMoved = false;
            data.startMoving = false;
            return;
        }
        data.isTouched = false;
        data.isMoved = false;
        data.startMoving = false;
        let currentPos;
        if (params.followFinger) {
            currentPos = rtl ? swiper.translate : -swiper.translate;
        } else {
            currentPos = -data.currentTranslate;
        }
        if (params.cssMode) {
            return;
        }
        if (swiper.params.freeMode && params.freeMode.enabled) {
            swiper.freeMode.onTouchEnd({
                currentPos,
            });
            return;
        }

        // Find current slide
        let stopIndex = 0;
        let groupSize = swiper.slidesSizesGrid[0];
        for (let i = 0; i < slidesGrid.length; i += i < params.slidesPerGroupSkip ? 1 : params.slidesPerGroup) {
            const increment = i < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
            if (typeof slidesGrid[i + increment] !== "undefined") {
                if (currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + increment]) {
                    stopIndex = i;
                    groupSize = slidesGrid[i + increment] - slidesGrid[i];
                }
            } else if (currentPos >= slidesGrid[i]) {
                stopIndex = i;
                groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
            }
        }
        let rewindFirstIndex = null;
        let rewindLastIndex = null;
        if (params.rewind) {
            if (swiper.isBeginning) {
                rewindLastIndex =
                    swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual
                        ? swiper.virtual.slides.length - 1
                        : swiper.slides.length - 1;
            } else if (swiper.isEnd) {
                rewindFirstIndex = 0;
            }
        }
        // Find current slide size
        const ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;
        const increment = stopIndex < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
        if (timeDiff > params.longSwipesMs) {
            // Long touches
            if (!params.longSwipes) {
                swiper.slideTo(swiper.activeIndex);
                return;
            }
            if (swiper.swipeDirection === "next") {
                if (ratio >= params.longSwipesRatio)
                    swiper.slideTo(params.rewind && swiper.isEnd ? rewindFirstIndex : stopIndex + increment);
                else swiper.slideTo(stopIndex);
            }
            if (swiper.swipeDirection === "prev") {
                if (ratio > 1 - params.longSwipesRatio) {
                    swiper.slideTo(stopIndex + increment);
                } else if (rewindLastIndex !== null && ratio < 0 && Math.abs(ratio) > params.longSwipesRatio) {
                    swiper.slideTo(rewindLastIndex);
                } else {
                    swiper.slideTo(stopIndex);
                }
            }
        } else {
            // Short swipes
            if (!params.shortSwipes) {
                swiper.slideTo(swiper.activeIndex);
                return;
            }
            const isNavButtonTarget =
                swiper.navigation && (e.target === swiper.navigation.nextEl || e.target === swiper.navigation.prevEl);
            if (!isNavButtonTarget) {
                if (swiper.swipeDirection === "next") {
                    swiper.slideTo(rewindFirstIndex !== null ? rewindFirstIndex : stopIndex + increment);
                }
                if (swiper.swipeDirection === "prev") {
                    swiper.slideTo(rewindLastIndex !== null ? rewindLastIndex : stopIndex);
                }
            } else if (e.target === swiper.navigation.nextEl) {
                swiper.slideTo(stopIndex + increment);
            } else {
                swiper.slideTo(stopIndex);
            }
        }
    }

    let timeout;
    function onResize() {
        const swiper = this;
        const { params, el } = swiper;
        if (el && el.offsetWidth === 0) return;

        // Breakpoints
        if (params.breakpoints) {
            swiper.setBreakpoint();
        }

        // Save locks
        const { allowSlideNext, allowSlidePrev, snapGrid } = swiper;
        const isVirtual = swiper.virtual && swiper.params.virtual.enabled;

        // Disable locks on resize
        swiper.allowSlideNext = true;
        swiper.allowSlidePrev = true;
        swiper.updateSize();
        swiper.updateSlides();
        swiper.updateSlidesClasses();
        const isVirtualLoop = isVirtual && params.loop;
        if (
            (params.slidesPerView === "auto" || params.slidesPerView > 1) &&
            swiper.isEnd &&
            !swiper.isBeginning &&
            !swiper.params.centeredSlides &&
            !isVirtualLoop
        ) {
            swiper.slideTo(swiper.slides.length - 1, 0, false, true);
        } else {
            if (swiper.params.loop && !isVirtual) {
                swiper.slideToLoop(swiper.realIndex, 0, false, true);
            } else {
                swiper.slideTo(swiper.activeIndex, 0, false, true);
            }
        }
        if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
                    swiper.autoplay.resume();
                }
            }, 500);
        }
        // Return locks after resize
        swiper.allowSlidePrev = allowSlidePrev;
        swiper.allowSlideNext = allowSlideNext;
        if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
            swiper.checkOverflow();
        }
    }

    function onClick(e) {
        const swiper = this;
        if (!swiper.enabled) return;
        if (!swiper.allowClick) {
            if (swiper.params.preventClicks) e.preventDefault();
            if (swiper.params.preventClicksPropagation && swiper.animating) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }
    }

    function onScroll() {
        const swiper = this;
        const { wrapperEl, rtlTranslate, enabled } = swiper;
        if (!enabled) return;
        swiper.previousTranslate = swiper.translate;
        if (swiper.isHorizontal()) {
            swiper.translate = -wrapperEl.scrollLeft;
        } else {
            swiper.translate = -wrapperEl.scrollTop;
        }
        // eslint-disable-next-line
        if (swiper.translate === 0) swiper.translate = 0;
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
        let newProgress;
        const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
        if (translatesDiff === 0) {
            newProgress = 0;
        } else {
            newProgress = (swiper.translate - swiper.minTranslate()) / translatesDiff;
        }
        if (newProgress !== swiper.progress) {
            swiper.updateProgress(rtlTranslate ? -swiper.translate : swiper.translate);
        }
        swiper.emit("setTranslate", swiper.translate, false);
    }

    const processLazyPreloader = (swiper, imageEl) => {
        if (!swiper || swiper.destroyed || !swiper.params) return;
        const slideSelector = () => (swiper.isElement ? `swiper-slide` : `.${swiper.params.slideClass}`);
        const slideEl = imageEl.closest(slideSelector());
        if (slideEl) {
            const lazyEl = slideEl.querySelector(`.${swiper.params.lazyPreloaderClass}`);
            if (lazyEl) lazyEl.remove();
        }
    };

    function onLoad(e) {
        const swiper = this;
        processLazyPreloader(swiper, e.target);
        swiper.update();
    }

    let dummyEventAttached = false;
    function dummyEventListener() {}
    const events = (swiper, method) => {
        const document = getDocument();
        const { params, el, wrapperEl, device } = swiper;
        const capture = !!params.nested;
        const domMethod = method === "on" ? "addEventListener" : "removeEventListener";
        const swiperMethod = method;

        // Touch Events
        el[domMethod]("pointerdown", swiper.onTouchStart, {
            passive: false,
        });
        document[domMethod]("pointermove", swiper.onTouchMove, {
            passive: false,
            capture,
        });
        document[domMethod]("pointerup", swiper.onTouchEnd, {
            passive: true,
        });
        document[domMethod]("pointercancel", swiper.onTouchEnd, {
            passive: true,
        });
        document[domMethod]("pointerout", swiper.onTouchEnd, {
            passive: true,
        });
        document[domMethod]("pointerleave", swiper.onTouchEnd, {
            passive: true,
        });

        // Prevent Links Clicks
        if (params.preventClicks || params.preventClicksPropagation) {
            el[domMethod]("click", swiper.onClick, true);
        }
        if (params.cssMode) {
            wrapperEl[domMethod]("scroll", swiper.onScroll);
        }

        // Resize handler
        if (params.updateOnWindowResize) {
            swiper[swiperMethod](
                device.ios || device.android ? "resize orientationchange observerUpdate" : "resize observerUpdate",
                onResize,
                true
            );
        } else {
            swiper[swiperMethod]("observerUpdate", onResize, true);
        }

        // Images loader
        el[domMethod]("load", swiper.onLoad, {
            capture: true,
        });
    };
    function attachEvents() {
        const swiper = this;
        const document = getDocument();
        const { params } = swiper;
        swiper.onTouchStart = onTouchStart.bind(swiper);
        swiper.onTouchMove = onTouchMove.bind(swiper);
        swiper.onTouchEnd = onTouchEnd.bind(swiper);
        if (params.cssMode) {
            swiper.onScroll = onScroll.bind(swiper);
        }
        swiper.onClick = onClick.bind(swiper);
        swiper.onLoad = onLoad.bind(swiper);
        if (!dummyEventAttached) {
            document.addEventListener("touchstart", dummyEventListener);
            dummyEventAttached = true;
        }
        events(swiper, "on");
    }
    function detachEvents() {
        const swiper = this;
        events(swiper, "off");
    }
    var events$1 = {
        attachEvents,
        detachEvents,
    };

    const isGridEnabled = (swiper, params) => {
        return swiper.grid && params.grid && params.grid.rows > 1;
    };
    function setBreakpoint() {
        const swiper = this;
        const { realIndex, initialized, params, el } = swiper;
        const breakpoints = params.breakpoints;
        if (!breakpoints || (breakpoints && Object.keys(breakpoints).length === 0)) return;

        // Get breakpoint for window width and update parameters
        const breakpoint = swiper.getBreakpoint(breakpoints, swiper.params.breakpointsBase, swiper.el);
        if (!breakpoint || swiper.currentBreakpoint === breakpoint) return;
        const breakpointOnlyParams = breakpoint in breakpoints ? breakpoints[breakpoint] : undefined;
        const breakpointParams = breakpointOnlyParams || swiper.originalParams;
        const wasMultiRow = isGridEnabled(swiper, params);
        const isMultiRow = isGridEnabled(swiper, breakpointParams);
        const wasEnabled = params.enabled;
        if (wasMultiRow && !isMultiRow) {
            el.classList.remove(`${params.containerModifierClass}grid`, `${params.containerModifierClass}grid-column`);
            swiper.emitContainerClasses();
        } else if (!wasMultiRow && isMultiRow) {
            el.classList.add(`${params.containerModifierClass}grid`);
            if (
                (breakpointParams.grid.fill && breakpointParams.grid.fill === "column") ||
                (!breakpointParams.grid.fill && params.grid.fill === "column")
            ) {
                el.classList.add(`${params.containerModifierClass}grid-column`);
            }
            swiper.emitContainerClasses();
        }

        // Toggle navigation, pagination, scrollbar
        ["navigation", "pagination", "scrollbar"].forEach((prop) => {
            const wasModuleEnabled = params[prop] && params[prop].enabled;
            const isModuleEnabled = breakpointParams[prop] && breakpointParams[prop].enabled;
            if (wasModuleEnabled && !isModuleEnabled) {
                swiper[prop].disable();
            }
            if (!wasModuleEnabled && isModuleEnabled) {
                swiper[prop].enable();
            }
        });
        const directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
        const needsReLoop =
            params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);
        if (directionChanged && initialized) {
            swiper.changeDirection();
        }
        extend(swiper.params, breakpointParams);
        const isEnabled = swiper.params.enabled;
        Object.assign(swiper, {
            allowTouchMove: swiper.params.allowTouchMove,
            allowSlideNext: swiper.params.allowSlideNext,
            allowSlidePrev: swiper.params.allowSlidePrev,
        });
        if (wasEnabled && !isEnabled) {
            swiper.disable();
        } else if (!wasEnabled && isEnabled) {
            swiper.enable();
        }
        swiper.currentBreakpoint = breakpoint;
        swiper.emit("_beforeBreakpoint", breakpointParams);
        if (needsReLoop && initialized) {
            swiper.loopDestroy();
            swiper.loopCreate(realIndex);
            swiper.updateSlides();
        }
        swiper.emit("breakpoint", breakpointParams);
    }

    function getBreakpoint(breakpoints, base = "window", containerEl) {
        if (!breakpoints || (base === "container" && !containerEl)) return undefined;
        let breakpoint = false;
        const window = getWindow();
        const currentHeight = base === "window" ? window.innerHeight : containerEl.clientHeight;
        const points = Object.keys(breakpoints).map((point) => {
            if (typeof point === "string" && point.indexOf("@") === 0) {
                const minRatio = parseFloat(point.substr(1));
                const value = currentHeight * minRatio;
                return {
                    value,
                    point,
                };
            }
            return {
                value: point,
                point,
            };
        });
        points.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
        for (let i = 0; i < points.length; i += 1) {
            const { point, value } = points[i];
            if (base === "window") {
                if (window.matchMedia(`(min-width: ${value}px)`).matches) {
                    breakpoint = point;
                }
            } else if (value <= containerEl.clientWidth) {
                breakpoint = point;
            }
        }
        return breakpoint || "max";
    }

    var breakpoints = {
        setBreakpoint,
        getBreakpoint,
    };

    function prepareClasses(entries, prefix) {
        const resultClasses = [];
        entries.forEach((item) => {
            if (typeof item === "object") {
                Object.keys(item).forEach((classNames) => {
                    if (item[classNames]) {
                        resultClasses.push(prefix + classNames);
                    }
                });
            } else if (typeof item === "string") {
                resultClasses.push(prefix + item);
            }
        });
        return resultClasses;
    }
    function addClasses() {
        const swiper = this;
        const { classNames, params, rtl, el, device } = swiper;
        // prettier-ignore
        const suffixes = prepareClasses(['initialized', params.direction, {
	    'free-mode': swiper.params.freeMode && params.freeMode.enabled
	  }, {
	    'autoheight': params.autoHeight
	  }, {
	    'rtl': rtl
	  }, {
	    'grid': params.grid && params.grid.rows > 1
	  }, {
	    'grid-column': params.grid && params.grid.rows > 1 && params.grid.fill === 'column'
	  }, {
	    'android': device.android
	  }, {
	    'ios': device.ios
	  }, {
	    'css-mode': params.cssMode
	  }, {
	    'centered': params.cssMode && params.centeredSlides
	  }, {
	    'watch-progress': params.watchSlidesProgress
	  }], params.containerModifierClass);
        classNames.push(...suffixes);
        el.classList.add(...classNames);
        swiper.emitContainerClasses();
    }

    function removeClasses() {
        const swiper = this;
        const { el, classNames } = swiper;
        el.classList.remove(...classNames);
        swiper.emitContainerClasses();
    }

    var classes = {
        addClasses,
        removeClasses,
    };

    function checkOverflow() {
        const swiper = this;
        const { isLocked: wasLocked, params } = swiper;
        const { slidesOffsetBefore } = params;
        if (slidesOffsetBefore) {
            const lastSlideIndex = swiper.slides.length - 1;
            const lastSlideRightEdge =
                swiper.slidesGrid[lastSlideIndex] + swiper.slidesSizesGrid[lastSlideIndex] + slidesOffsetBefore * 2;
            swiper.isLocked = swiper.size > lastSlideRightEdge;
        } else {
            swiper.isLocked = swiper.snapGrid.length === 1;
        }
        if (params.allowSlideNext === true) {
            swiper.allowSlideNext = !swiper.isLocked;
        }
        if (params.allowSlidePrev === true) {
            swiper.allowSlidePrev = !swiper.isLocked;
        }
        if (wasLocked && wasLocked !== swiper.isLocked) {
            swiper.isEnd = false;
        }
        if (wasLocked !== swiper.isLocked) {
            swiper.emit(swiper.isLocked ? "lock" : "unlock");
        }
    }
    var checkOverflow$1 = {
        checkOverflow,
    };

    var defaults = {
        init: true,
        direction: "horizontal",
        oneWayMovement: false,
        touchEventsTarget: "wrapper",
        initialSlide: 0,
        speed: 300,
        cssMode: false,
        updateOnWindowResize: true,
        resizeObserver: true,
        nested: false,
        createElements: false,
        enabled: true,
        focusableElements: "input, select, option, textarea, button, video, label",
        // Overrides
        width: null,
        height: null,
        //
        preventInteractionOnTransition: false,
        // ssr
        userAgent: null,
        url: null,
        // To support iOS's swipe-to-go-back gesture (when being used in-app).
        edgeSwipeDetection: false,
        edgeSwipeThreshold: 20,
        // Autoheight
        autoHeight: false,
        // Set wrapper width
        setWrapperSize: false,
        // Virtual Translate
        virtualTranslate: false,
        // Effects
        effect: "slide",
        // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'

        // Breakpoints
        breakpoints: undefined,
        breakpointsBase: "window",
        // Slides grid
        spaceBetween: 0,
        slidesPerView: 1,
        slidesPerGroup: 1,
        slidesPerGroupSkip: 0,
        slidesPerGroupAuto: false,
        centeredSlides: false,
        centeredSlidesBounds: false,
        slidesOffsetBefore: 0,
        // in px
        slidesOffsetAfter: 0,
        // in px
        normalizeSlideIndex: true,
        centerInsufficientSlides: false,
        // Disable swiper and hide navigation when container not overflow
        watchOverflow: true,
        // Round length
        roundLengths: false,
        // Touches
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: true,
        shortSwipes: true,
        longSwipes: true,
        longSwipesRatio: 0.5,
        longSwipesMs: 300,
        followFinger: true,
        allowTouchMove: true,
        threshold: 5,
        touchMoveStopPropagation: false,
        touchStartPreventDefault: true,
        touchStartForcePreventDefault: false,
        touchReleaseOnEdges: false,
        // Unique Navigation Elements
        uniqueNavElements: true,
        // Resistance
        resistance: true,
        resistanceRatio: 0.85,
        // Progress
        watchSlidesProgress: false,
        // Cursor
        grabCursor: false,
        // Clicks
        preventClicks: true,
        preventClicksPropagation: true,
        slideToClickedSlide: false,
        // loop
        loop: false,
        loopedSlides: null,
        loopPreventsSliding: true,
        // rewind
        rewind: false,
        // Swiping/no swiping
        allowSlidePrev: true,
        allowSlideNext: true,
        swipeHandler: null,
        // '.swipe-handler',
        noSwiping: true,
        noSwipingClass: "swiper-no-swiping",
        noSwipingSelector: null,
        // Passive Listeners
        passiveListeners: true,
        maxBackfaceHiddenSlides: 10,
        // NS
        containerModifierClass: "swiper-",
        // NEW
        slideClass: "swiper-slide",
        slideActiveClass: "swiper-slide-active",
        slideVisibleClass: "swiper-slide-visible",
        slideNextClass: "swiper-slide-next",
        slidePrevClass: "swiper-slide-prev",
        wrapperClass: "swiper-wrapper",
        lazyPreloaderClass: "swiper-lazy-preloader",
        // Callbacks
        runCallbacksOnInit: true,
        // Internals
        _emitClasses: false,
    };

    function moduleExtendParams(params, allModulesParams) {
        return function extendParams(obj = {}) {
            const moduleParamName = Object.keys(obj)[0];
            const moduleParams = obj[moduleParamName];
            if (typeof moduleParams !== "object" || moduleParams === null) {
                extend(allModulesParams, obj);
                return;
            }
            if (
                ["navigation", "pagination", "scrollbar"].indexOf(moduleParamName) >= 0 &&
                params[moduleParamName] === true
            ) {
                params[moduleParamName] = {
                    auto: true,
                };
            }
            if (!(moduleParamName in params && "enabled" in moduleParams)) {
                extend(allModulesParams, obj);
                return;
            }
            if (params[moduleParamName] === true) {
                params[moduleParamName] = {
                    enabled: true,
                };
            }
            if (typeof params[moduleParamName] === "object" && !("enabled" in params[moduleParamName])) {
                params[moduleParamName].enabled = true;
            }
            if (!params[moduleParamName])
                params[moduleParamName] = {
                    enabled: false,
                };
            extend(allModulesParams, obj);
        };
    }

    /* eslint no-param-reassign: "off" */
    const prototypes = {
        eventsEmitter,
        update,
        translate,
        transition,
        slide,
        loop,
        grabCursor,
        events: events$1,
        breakpoints,
        checkOverflow: checkOverflow$1,
        classes,
    };
    const extendedDefaults = {};
    class Swiper {
        constructor(...args) {
            let el;
            let params;
            if (
                args.length === 1 &&
                args[0].constructor &&
                Object.prototype.toString.call(args[0]).slice(8, -1) === "Object"
            ) {
                params = args[0];
            } else {
                [el, params] = args;
            }
            if (!params) params = {};
            params = extend({}, params);
            if (el && !params.el) params.el = el;
            const document = getDocument();
            if (params.el && typeof params.el === "string" && document.querySelectorAll(params.el).length > 1) {
                const swipers = [];
                document.querySelectorAll(params.el).forEach((containerEl) => {
                    const newParams = extend({}, params, {
                        el: containerEl,
                    });
                    swipers.push(new Swiper(newParams));
                });
                // eslint-disable-next-line no-constructor-return
                return swipers;
            }

            // Swiper Instance
            const swiper = this;
            swiper.__swiper__ = true;
            swiper.support = getSupport();
            swiper.device = getDevice({
                userAgent: params.userAgent,
            });
            swiper.browser = getBrowser();
            swiper.eventsListeners = {};
            swiper.eventsAnyListeners = [];
            swiper.modules = [...swiper.__modules__];
            if (params.modules && Array.isArray(params.modules)) {
                swiper.modules.push(...params.modules);
            }
            const allModulesParams = {};
            swiper.modules.forEach((mod) => {
                mod({
                    params,
                    swiper,
                    extendParams: moduleExtendParams(params, allModulesParams),
                    on: swiper.on.bind(swiper),
                    once: swiper.once.bind(swiper),
                    off: swiper.off.bind(swiper),
                    emit: swiper.emit.bind(swiper),
                });
            });

            // Extend defaults with modules params
            const swiperParams = extend({}, defaults, allModulesParams);

            // Extend defaults with passed params
            swiper.params = extend({}, swiperParams, extendedDefaults, params);
            swiper.originalParams = extend({}, swiper.params);
            swiper.passedParams = extend({}, params);

            // add event listeners
            if (swiper.params && swiper.params.on) {
                Object.keys(swiper.params.on).forEach((eventName) => {
                    swiper.on(eventName, swiper.params.on[eventName]);
                });
            }
            if (swiper.params && swiper.params.onAny) {
                swiper.onAny(swiper.params.onAny);
            }

            // Extend Swiper
            Object.assign(swiper, {
                enabled: swiper.params.enabled,
                el,
                // Classes
                classNames: [],
                // Slides
                slides: [],
                slidesGrid: [],
                snapGrid: [],
                slidesSizesGrid: [],
                // isDirection
                isHorizontal() {
                    return swiper.params.direction === "horizontal";
                },
                isVertical() {
                    return swiper.params.direction === "vertical";
                },
                // Indexes
                activeIndex: 0,
                realIndex: 0,
                //
                isBeginning: true,
                isEnd: false,
                // Props
                translate: 0,
                previousTranslate: 0,
                progress: 0,
                velocity: 0,
                animating: false,
                // Locks
                allowSlideNext: swiper.params.allowSlideNext,
                allowSlidePrev: swiper.params.allowSlidePrev,
                // Touch Events
                touchEventsData: {
                    isTouched: undefined,
                    isMoved: undefined,
                    allowTouchCallbacks: undefined,
                    touchStartTime: undefined,
                    isScrolling: undefined,
                    currentTranslate: undefined,
                    startTranslate: undefined,
                    allowThresholdMove: undefined,
                    // Form elements to match
                    focusableElements: swiper.params.focusableElements,
                    // Last click time
                    lastClickTime: now(),
                    clickTimeout: undefined,
                    // Velocities
                    velocities: [],
                    allowMomentumBounce: undefined,
                    startMoving: undefined,
                    evCache: [],
                },
                // Clicks
                allowClick: true,
                // Touches
                allowTouchMove: swiper.params.allowTouchMove,
                touches: {
                    startX: 0,
                    startY: 0,
                    currentX: 0,
                    currentY: 0,
                    diff: 0,
                },
                // Images
                imagesToLoad: [],
                imagesLoaded: 0,
            });
            swiper.emit("_swiper");

            // Init
            if (swiper.params.init) {
                swiper.init();
            }

            // Return app instance
            // eslint-disable-next-line no-constructor-return
            return swiper;
        }
        getSlideIndex(slideEl) {
            const { slidesEl, params } = this;
            const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
            const firstSlideIndex = elementIndex(slides[0]);
            return elementIndex(slideEl) - firstSlideIndex;
        }
        getSlideIndexByData(index) {
            return this.getSlideIndex(
                this.slides.filter((slideEl) => slideEl.getAttribute("data-swiper-slide-index") * 1 === index)[0]
            );
        }
        recalcSlides() {
            const swiper = this;
            const { slidesEl, params } = swiper;
            swiper.slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
        }
        enable() {
            const swiper = this;
            if (swiper.enabled) return;
            swiper.enabled = true;
            if (swiper.params.grabCursor) {
                swiper.setGrabCursor();
            }
            swiper.emit("enable");
        }
        disable() {
            const swiper = this;
            if (!swiper.enabled) return;
            swiper.enabled = false;
            if (swiper.params.grabCursor) {
                swiper.unsetGrabCursor();
            }
            swiper.emit("disable");
        }
        setProgress(progress, speed) {
            const swiper = this;
            progress = Math.min(Math.max(progress, 0), 1);
            const min = swiper.minTranslate();
            const max = swiper.maxTranslate();
            const current = (max - min) * progress + min;
            swiper.translateTo(current, typeof speed === "undefined" ? 0 : speed);
            swiper.updateActiveIndex();
            swiper.updateSlidesClasses();
        }
        emitContainerClasses() {
            const swiper = this;
            if (!swiper.params._emitClasses || !swiper.el) return;
            const cls = swiper.el.className.split(" ").filter((className) => {
                return (
                    className.indexOf("swiper") === 0 || className.indexOf(swiper.params.containerModifierClass) === 0
                );
            });
            swiper.emit("_containerClasses", cls.join(" "));
        }
        getSlideClasses(slideEl) {
            const swiper = this;
            if (swiper.destroyed) return "";
            return slideEl.className
                .split(" ")
                .filter((className) => {
                    return className.indexOf("swiper-slide") === 0 || className.indexOf(swiper.params.slideClass) === 0;
                })
                .join(" ");
        }
        emitSlidesClasses() {
            const swiper = this;
            if (!swiper.params._emitClasses || !swiper.el) return;
            const updates = [];
            swiper.slides.forEach((slideEl) => {
                const classNames = swiper.getSlideClasses(slideEl);
                updates.push({
                    slideEl,
                    classNames,
                });
                swiper.emit("_slideClass", slideEl, classNames);
            });
            swiper.emit("_slideClasses", updates);
        }
        slidesPerViewDynamic(view = "current", exact = false) {
            const swiper = this;
            const { params, slides, slidesGrid, slidesSizesGrid, size: swiperSize, activeIndex } = swiper;
            let spv = 1;
            if (params.centeredSlides) {
                let slideSize = slides[activeIndex].swiperSlideSize;
                let breakLoop;
                for (let i = activeIndex + 1; i < slides.length; i += 1) {
                    if (slides[i] && !breakLoop) {
                        slideSize += slides[i].swiperSlideSize;
                        spv += 1;
                        if (slideSize > swiperSize) breakLoop = true;
                    }
                }
                for (let i = activeIndex - 1; i >= 0; i -= 1) {
                    if (slides[i] && !breakLoop) {
                        slideSize += slides[i].swiperSlideSize;
                        spv += 1;
                        if (slideSize > swiperSize) breakLoop = true;
                    }
                }
            } else {
                // eslint-disable-next-line
                if (view === "current") {
                    for (let i = activeIndex + 1; i < slides.length; i += 1) {
                        const slideInView = exact
                            ? slidesGrid[i] + slidesSizesGrid[i] - slidesGrid[activeIndex] < swiperSize
                            : slidesGrid[i] - slidesGrid[activeIndex] < swiperSize;
                        if (slideInView) {
                            spv += 1;
                        }
                    }
                } else {
                    // previous
                    for (let i = activeIndex - 1; i >= 0; i -= 1) {
                        const slideInView = slidesGrid[activeIndex] - slidesGrid[i] < swiperSize;
                        if (slideInView) {
                            spv += 1;
                        }
                    }
                }
            }
            return spv;
        }
        update() {
            const swiper = this;
            if (!swiper || swiper.destroyed) return;
            const { snapGrid, params } = swiper;
            // Breakpoints
            if (params.breakpoints) {
                swiper.setBreakpoint();
            }
            [...swiper.el.querySelectorAll('[loading="lazy"]')].forEach((imageEl) => {
                if (imageEl.complete) {
                    processLazyPreloader(swiper, imageEl);
                }
            });
            swiper.updateSize();
            swiper.updateSlides();
            swiper.updateProgress();
            swiper.updateSlidesClasses();
            function setTranslate() {
                const translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
                const newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
                swiper.setTranslate(newTranslate);
                swiper.updateActiveIndex();
                swiper.updateSlidesClasses();
            }
            let translated;
            if (swiper.params.freeMode && swiper.params.freeMode.enabled) {
                setTranslate();
                if (swiper.params.autoHeight) {
                    swiper.updateAutoHeight();
                }
            } else {
                if (
                    (swiper.params.slidesPerView === "auto" || swiper.params.slidesPerView > 1) &&
                    swiper.isEnd &&
                    !swiper.params.centeredSlides
                ) {
                    translated = swiper.slideTo(swiper.slides.length - 1, 0, false, true);
                } else {
                    translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
                }
                if (!translated) {
                    setTranslate();
                }
            }
            if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
                swiper.checkOverflow();
            }
            swiper.emit("update");
        }
        changeDirection(newDirection, needUpdate = true) {
            const swiper = this;
            const currentDirection = swiper.params.direction;
            if (!newDirection) {
                // eslint-disable-next-line
                newDirection = currentDirection === "horizontal" ? "vertical" : "horizontal";
            }
            if (newDirection === currentDirection || (newDirection !== "horizontal" && newDirection !== "vertical")) {
                return swiper;
            }
            swiper.el.classList.remove(`${swiper.params.containerModifierClass}${currentDirection}`);
            swiper.el.classList.add(`${swiper.params.containerModifierClass}${newDirection}`);
            swiper.emitContainerClasses();
            swiper.params.direction = newDirection;
            swiper.slides.forEach((slideEl) => {
                if (newDirection === "vertical") {
                    slideEl.style.width = "";
                } else {
                    slideEl.style.height = "";
                }
            });
            swiper.emit("changeDirection");
            if (needUpdate) swiper.update();
            return swiper;
        }
        changeLanguageDirection(direction) {
            const swiper = this;
            if ((swiper.rtl && direction === "rtl") || (!swiper.rtl && direction === "ltr")) return;
            swiper.rtl = direction === "rtl";
            swiper.rtlTranslate = swiper.params.direction === "horizontal" && swiper.rtl;
            if (swiper.rtl) {
                swiper.el.classList.add(`${swiper.params.containerModifierClass}rtl`);
                swiper.el.dir = "rtl";
            } else {
                swiper.el.classList.remove(`${swiper.params.containerModifierClass}rtl`);
                swiper.el.dir = "ltr";
            }
            swiper.update();
        }
        mount(element) {
            const swiper = this;
            if (swiper.mounted) return true;

            // Find el
            let el = element || swiper.params.el;
            if (typeof el === "string") {
                el = document.querySelector(el);
            }
            if (!el) {
                return false;
            }
            el.swiper = swiper;
            if (el.shadowEl) {
                swiper.isElement = true;
            }
            const getWrapperSelector = () => {
                return `.${(swiper.params.wrapperClass || "").trim().split(" ").join(".")}`;
            };
            const getWrapper = () => {
                if (el && el.shadowRoot && el.shadowRoot.querySelector) {
                    const res = el.shadowRoot.querySelector(getWrapperSelector());
                    // Children needs to return slot items
                    return res;
                }
                return elementChildren(el, getWrapperSelector())[0];
            };
            // Find Wrapper
            let wrapperEl = getWrapper();
            if (!wrapperEl && swiper.params.createElements) {
                wrapperEl = createElement("div", swiper.params.wrapperClass);
                el.append(wrapperEl);
                elementChildren(el, `.${swiper.params.slideClass}`).forEach((slideEl) => {
                    wrapperEl.append(slideEl);
                });
            }
            Object.assign(swiper, {
                el,
                wrapperEl,
                slidesEl: swiper.isElement ? el : wrapperEl,
                mounted: true,
                // RTL
                rtl: el.dir.toLowerCase() === "rtl" || elementStyle(el, "direction") === "rtl",
                rtlTranslate:
                    swiper.params.direction === "horizontal" &&
                    (el.dir.toLowerCase() === "rtl" || elementStyle(el, "direction") === "rtl"),
                wrongRTL: elementStyle(wrapperEl, "display") === "-webkit-box",
            });
            return true;
        }
        init(el) {
            const swiper = this;
            if (swiper.initialized) return swiper;
            const mounted = swiper.mount(el);
            if (mounted === false) return swiper;
            swiper.emit("beforeInit");

            // Set breakpoint
            if (swiper.params.breakpoints) {
                swiper.setBreakpoint();
            }

            // Add Classes
            swiper.addClasses();

            // Update size
            swiper.updateSize();

            // Update slides
            swiper.updateSlides();
            if (swiper.params.watchOverflow) {
                swiper.checkOverflow();
            }

            // Set Grab Cursor
            if (swiper.params.grabCursor && swiper.enabled) {
                swiper.setGrabCursor();
            }

            // Slide To Initial Slide
            if (swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
                swiper.slideTo(
                    swiper.params.initialSlide + swiper.virtual.slidesBefore,
                    0,
                    swiper.params.runCallbacksOnInit,
                    false,
                    true
                );
            } else {
                swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit, false, true);
            }

            // Create loop
            if (swiper.params.loop) {
                swiper.loopCreate();
            }

            // Attach events
            swiper.attachEvents();
            [...swiper.el.querySelectorAll('[loading="lazy"]')].forEach((imageEl) => {
                if (imageEl.complete) {
                    processLazyPreloader(swiper, imageEl);
                } else {
                    imageEl.addEventListener("load", (e) => {
                        processLazyPreloader(swiper, e.target);
                    });
                }
            });

            // Init Flag
            swiper.initialized = true;

            // Emit
            swiper.emit("init");
            swiper.emit("afterInit");
            return swiper;
        }
        destroy(deleteInstance = true, cleanStyles = true) {
            const swiper = this;
            const { params, el, wrapperEl, slides } = swiper;
            if (typeof swiper.params === "undefined" || swiper.destroyed) {
                return null;
            }
            swiper.emit("beforeDestroy");

            // Init Flag
            swiper.initialized = false;

            // Detach events
            swiper.detachEvents();

            // Destroy loop
            if (params.loop) {
                swiper.loopDestroy();
            }

            // Cleanup styles
            if (cleanStyles) {
                swiper.removeClasses();
                el.removeAttribute("style");
                wrapperEl.removeAttribute("style");
                if (slides && slides.length) {
                    slides.forEach((slideEl) => {
                        slideEl.classList.remove(
                            params.slideVisibleClass,
                            params.slideActiveClass,
                            params.slideNextClass,
                            params.slidePrevClass
                        );
                        slideEl.removeAttribute("style");
                        slideEl.removeAttribute("data-swiper-slide-index");
                    });
                }
            }
            swiper.emit("destroy");

            // Detach emitter events
            Object.keys(swiper.eventsListeners).forEach((eventName) => {
                swiper.off(eventName);
            });
            if (deleteInstance !== false) {
                swiper.el.swiper = null;
                deleteProps(swiper);
            }
            swiper.destroyed = true;
            return null;
        }
        static extendDefaults(newDefaults) {
            extend(extendedDefaults, newDefaults);
        }
        static get extendedDefaults() {
            return extendedDefaults;
        }
        static get defaults() {
            return defaults;
        }
        static installModule(mod) {
            if (!Swiper.prototype.__modules__) Swiper.prototype.__modules__ = [];
            const modules = Swiper.prototype.__modules__;
            if (typeof mod === "function" && modules.indexOf(mod) < 0) {
                modules.push(mod);
            }
        }
        static use(module) {
            if (Array.isArray(module)) {
                module.forEach((m) => Swiper.installModule(m));
                return Swiper;
            }
            Swiper.installModule(module);
            return Swiper;
        }
    }
    Object.keys(prototypes).forEach((prototypeGroup) => {
        Object.keys(prototypes[prototypeGroup]).forEach((protoMethod) => {
            Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
        });
    });
    Swiper.use([Resize, Observer]);

    function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
        if (swiper.params.createElements) {
            Object.keys(checkProps).forEach((key) => {
                if (!params[key] && params.auto === true) {
                    let element = elementChildren(swiper.el, `.${checkProps[key]}`)[0];
                    if (!element) {
                        element = createElement("div", checkProps[key]);
                        element.className = checkProps[key];
                        swiper.el.append(element);
                    }
                    params[key] = element;
                    originalParams[key] = element;
                }
            });
        }
        return params;
    }

    function Navigation({ swiper, extendParams, on, emit }) {
        extendParams({
            navigation: {
                nextEl: null,
                prevEl: null,
                hideOnClick: false,
                disabledClass: "swiper-button-disabled",
                hiddenClass: "swiper-button-hidden",
                lockClass: "swiper-button-lock",
                navigationDisabledClass: "swiper-navigation-disabled",
            },
        });
        swiper.navigation = {
            nextEl: null,
            prevEl: null,
        };
        const makeElementsArray = (el) => {
            if (!Array.isArray(el)) el = [el].filter((e) => !!e);
            return el;
        };
        function getEl(el) {
            let res;
            if (el && typeof el === "string" && swiper.isElement) {
                res = swiper.el.shadowRoot.querySelector(el);
                if (res) return res;
            }
            if (el) {
                if (typeof el === "string") res = [...document.querySelectorAll(el)];
                if (
                    swiper.params.uniqueNavElements &&
                    typeof el === "string" &&
                    res.length > 1 &&
                    swiper.el.querySelectorAll(el).length === 1
                ) {
                    res = swiper.el.querySelector(el);
                }
            }
            if (el && !res) return el;
            // if (Array.isArray(res) && res.length === 1) res = res[0];
            return res;
        }
        function toggleEl(el, disabled) {
            const params = swiper.params.navigation;
            el = makeElementsArray(el);
            el.forEach((subEl) => {
                if (subEl) {
                    subEl.classList[disabled ? "add" : "remove"](...params.disabledClass.split(" "));
                    if (subEl.tagName === "BUTTON") subEl.disabled = disabled;
                    if (swiper.params.watchOverflow && swiper.enabled) {
                        subEl.classList[swiper.isLocked ? "add" : "remove"](params.lockClass);
                    }
                }
            });
        }
        function update() {
            // Update Navigation Buttons
            const { nextEl, prevEl } = swiper.navigation;
            if (swiper.params.loop) {
                toggleEl(prevEl, false);
                toggleEl(nextEl, false);
                return;
            }
            toggleEl(prevEl, swiper.isBeginning && !swiper.params.rewind);
            toggleEl(nextEl, swiper.isEnd && !swiper.params.rewind);
        }
        function onPrevClick(e) {
            e.preventDefault();
            if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind) return;
            swiper.slidePrev();
            emit("navigationPrev");
        }
        function onNextClick(e) {
            e.preventDefault();
            if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind) return;
            swiper.slideNext();
            emit("navigationNext");
        }
        function init() {
            const params = swiper.params.navigation;
            swiper.params.navigation = createElementIfNotDefined(
                swiper,
                swiper.originalParams.navigation,
                swiper.params.navigation,
                {
                    nextEl: "swiper-button-next",
                    prevEl: "swiper-button-prev",
                }
            );
            if (!(params.nextEl || params.prevEl)) return;
            let nextEl = getEl(params.nextEl);
            let prevEl = getEl(params.prevEl);
            Object.assign(swiper.navigation, {
                nextEl,
                prevEl,
            });
            nextEl = makeElementsArray(nextEl);
            prevEl = makeElementsArray(prevEl);
            const initButton = (el, dir) => {
                if (el) {
                    el.addEventListener("click", dir === "next" ? onNextClick : onPrevClick);
                }
                if (!swiper.enabled && el) {
                    el.classList.add(...params.lockClass.split(" "));
                }
            };
            nextEl.forEach((el) => initButton(el, "next"));
            prevEl.forEach((el) => initButton(el, "prev"));
        }
        function destroy() {
            let { nextEl, prevEl } = swiper.navigation;
            nextEl = makeElementsArray(nextEl);
            prevEl = makeElementsArray(prevEl);
            const destroyButton = (el, dir) => {
                el.removeEventListener("click", dir === "next" ? onNextClick : onPrevClick);
                el.classList.remove(...swiper.params.navigation.disabledClass.split(" "));
            };
            nextEl.forEach((el) => destroyButton(el, "next"));
            prevEl.forEach((el) => destroyButton(el, "prev"));
        }
        on("init", () => {
            if (swiper.params.navigation.enabled === false) {
                // eslint-disable-next-line
                disable();
            } else {
                init();
                update();
            }
        });
        on("toEdge fromEdge lock unlock", () => {
            update();
        });
        on("destroy", () => {
            destroy();
        });
        on("enable disable", () => {
            let { nextEl, prevEl } = swiper.navigation;
            nextEl = makeElementsArray(nextEl);
            prevEl = makeElementsArray(prevEl);
            [...nextEl, ...prevEl]
                .filter((el) => !!el)
                .forEach((el) => el.classList[swiper.enabled ? "remove" : "add"](swiper.params.navigation.lockClass));
        });
        on("click", (_s, e) => {
            let { nextEl, prevEl } = swiper.navigation;
            nextEl = makeElementsArray(nextEl);
            prevEl = makeElementsArray(prevEl);
            const targetEl = e.target;
            if (swiper.params.navigation.hideOnClick && !prevEl.includes(targetEl) && !nextEl.includes(targetEl)) {
                if (
                    swiper.pagination &&
                    swiper.params.pagination &&
                    swiper.params.pagination.clickable &&
                    (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl))
                )
                    return;
                let isHidden;
                if (nextEl.length) {
                    isHidden = nextEl[0].classList.contains(swiper.params.navigation.hiddenClass);
                } else if (prevEl.length) {
                    isHidden = prevEl[0].classList.contains(swiper.params.navigation.hiddenClass);
                }
                if (isHidden === true) {
                    emit("navigationShow");
                } else {
                    emit("navigationHide");
                }
                [...nextEl, ...prevEl]
                    .filter((el) => !!el)
                    .forEach((el) => el.classList.toggle(swiper.params.navigation.hiddenClass));
            }
        });
        const enable = () => {
            swiper.el.classList.remove(...swiper.params.navigation.navigationDisabledClass.split(" "));
            init();
            update();
        };
        const disable = () => {
            swiper.el.classList.add(...swiper.params.navigation.navigationDisabledClass.split(" "));
            destroy();
        };
        Object.assign(swiper.navigation, {
            enable,
            disable,
            update,
            init,
            destroy,
        });
    }

    function appendSlide(slides) {
        const swiper = this;
        const { params, slidesEl } = swiper;
        if (params.loop) {
            swiper.loopDestroy();
        }
        const appendElement = (slideEl) => {
            if (typeof slideEl === "string") {
                const tempDOM = document.createElement("div");
                tempDOM.innerHTML = slideEl;
                slidesEl.append(tempDOM.children[0]);
                tempDOM.innerHTML = "";
            } else {
                slidesEl.append(slideEl);
            }
        };
        if (typeof slides === "object" && "length" in slides) {
            for (let i = 0; i < slides.length; i += 1) {
                if (slides[i]) appendElement(slides[i]);
            }
        } else {
            appendElement(slides);
        }
        swiper.recalcSlides();
        if (params.loop) {
            swiper.loopCreate();
        }
        if (!params.observer || swiper.isElement) {
            swiper.update();
        }
    }

    function prependSlide(slides) {
        const swiper = this;
        const { params, activeIndex, slidesEl } = swiper;
        if (params.loop) {
            swiper.loopDestroy();
        }
        let newActiveIndex = activeIndex + 1;
        const prependElement = (slideEl) => {
            if (typeof slideEl === "string") {
                const tempDOM = document.createElement("div");
                tempDOM.innerHTML = slideEl;
                slidesEl.prepend(tempDOM.children[0]);
                tempDOM.innerHTML = "";
            } else {
                slidesEl.prepend(slideEl);
            }
        };
        if (typeof slides === "object" && "length" in slides) {
            for (let i = 0; i < slides.length; i += 1) {
                if (slides[i]) prependElement(slides[i]);
            }
            newActiveIndex = activeIndex + slides.length;
        } else {
            prependElement(slides);
        }
        swiper.recalcSlides();
        if (params.loop) {
            swiper.loopCreate();
        }
        if (!params.observer || swiper.isElement) {
            swiper.update();
        }
        swiper.slideTo(newActiveIndex, 0, false);
    }

    function addSlide(index, slides) {
        const swiper = this;
        const { params, activeIndex, slidesEl } = swiper;
        let activeIndexBuffer = activeIndex;
        if (params.loop) {
            activeIndexBuffer -= swiper.loopedSlides;
            swiper.loopDestroy();
            swiper.recalcSlides();
        }
        const baseLength = swiper.slides.length;
        if (index <= 0) {
            swiper.prependSlide(slides);
            return;
        }
        if (index >= baseLength) {
            swiper.appendSlide(slides);
            return;
        }
        let newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + 1 : activeIndexBuffer;
        const slidesBuffer = [];
        for (let i = baseLength - 1; i >= index; i -= 1) {
            const currentSlide = swiper.slides[i];
            currentSlide.remove();
            slidesBuffer.unshift(currentSlide);
        }
        if (typeof slides === "object" && "length" in slides) {
            for (let i = 0; i < slides.length; i += 1) {
                if (slides[i]) slidesEl.append(slides[i]);
            }
            newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + slides.length : activeIndexBuffer;
        } else {
            slidesEl.append(slides);
        }
        for (let i = 0; i < slidesBuffer.length; i += 1) {
            slidesEl.append(slidesBuffer[i]);
        }
        swiper.recalcSlides();
        if (params.loop) {
            swiper.loopCreate();
        }
        if (!params.observer || swiper.isElement) {
            swiper.update();
        }
        if (params.loop) {
            swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
        } else {
            swiper.slideTo(newActiveIndex, 0, false);
        }
    }

    function removeSlide(slidesIndexes) {
        const swiper = this;
        const { params, activeIndex } = swiper;
        let activeIndexBuffer = activeIndex;
        if (params.loop) {
            activeIndexBuffer -= swiper.loopedSlides;
            swiper.loopDestroy();
        }
        let newActiveIndex = activeIndexBuffer;
        let indexToRemove;
        if (typeof slidesIndexes === "object" && "length" in slidesIndexes) {
            for (let i = 0; i < slidesIndexes.length; i += 1) {
                indexToRemove = slidesIndexes[i];
                if (swiper.slides[indexToRemove]) swiper.slides[indexToRemove].remove();
                if (indexToRemove < newActiveIndex) newActiveIndex -= 1;
            }
            newActiveIndex = Math.max(newActiveIndex, 0);
        } else {
            indexToRemove = slidesIndexes;
            if (swiper.slides[indexToRemove]) swiper.slides[indexToRemove].remove();
            if (indexToRemove < newActiveIndex) newActiveIndex -= 1;
            newActiveIndex = Math.max(newActiveIndex, 0);
        }
        swiper.recalcSlides();
        if (params.loop) {
            swiper.loopCreate();
        }
        if (!params.observer || swiper.isElement) {
            swiper.update();
        }
        if (params.loop) {
            swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
        } else {
            swiper.slideTo(newActiveIndex, 0, false);
        }
    }

    function removeAllSlides() {
        const swiper = this;
        const slidesIndexes = [];
        for (let i = 0; i < swiper.slides.length; i += 1) {
            slidesIndexes.push(i);
        }
        swiper.removeSlide(slidesIndexes);
    }

    function Manipulation({ swiper }) {
        Object.assign(swiper, {
            appendSlide: appendSlide.bind(swiper),
            prependSlide: prependSlide.bind(swiper),
            addSlide: addSlide.bind(swiper),
            removeSlide: removeSlide.bind(swiper),
            removeAllSlides: removeAllSlides.bind(swiper),
        });
    }

    function effectInit(params) {
        const {
            effect,
            swiper,
            on,
            setTranslate,
            setTransition,
            overwriteParams,
            perspective,
            recreateShadows,
            getEffectParams,
        } = params;
        on("beforeInit", () => {
            if (swiper.params.effect !== effect) return;
            swiper.classNames.push(`${swiper.params.containerModifierClass}${effect}`);
            if (perspective && perspective()) {
                swiper.classNames.push(`${swiper.params.containerModifierClass}3d`);
            }
            const overwriteParamsResult = overwriteParams ? overwriteParams() : {};
            Object.assign(swiper.params, overwriteParamsResult);
            Object.assign(swiper.originalParams, overwriteParamsResult);
        });
        on("setTranslate", () => {
            if (swiper.params.effect !== effect) return;
            setTranslate();
        });
        on("setTransition", (_s, duration) => {
            if (swiper.params.effect !== effect) return;
            setTransition(duration);
        });
        on("transitionEnd", () => {
            if (swiper.params.effect !== effect) return;
            if (recreateShadows) {
                if (!getEffectParams || !getEffectParams().slideShadows) return;
                // remove shadows
                swiper.slides.forEach((slideEl) => {
                    slideEl
                        .querySelectorAll(
                            ".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left"
                        )
                        .forEach((shadowEl) => shadowEl.remove());
                });
                // create new one
                recreateShadows();
            }
        });
        let requireUpdateOnVirtual;
        on("virtualUpdate", () => {
            if (swiper.params.effect !== effect) return;
            if (!swiper.slides.length) {
                requireUpdateOnVirtual = true;
            }
            requestAnimationFrame(() => {
                if (requireUpdateOnVirtual && swiper.slides && swiper.slides.length) {
                    setTranslate();
                    requireUpdateOnVirtual = false;
                }
            });
        });
    }

    function effectTarget(effectParams, slideEl) {
        const transformEl = getSlideTransformEl(slideEl);
        if (transformEl !== slideEl) {
            transformEl.style.backfaceVisibility = "hidden";
            transformEl.style["-webkit-backface-visibility"] = "hidden";
        }
        return transformEl;
    }

    function effectVirtualTransitionEnd({ swiper, duration, transformElements, allSlides }) {
        const { activeIndex } = swiper;
        const getSlide = (el) => {
            if (!el.parentElement) {
                // assume shadow root
                const slide = swiper.slides.filter(
                    (slideEl) => slideEl.shadowEl && slideEl.shadowEl === el.parentNode
                )[0];
                return slide;
            }
            return el.parentElement;
        };
        if (swiper.params.virtualTranslate && duration !== 0) {
            let eventTriggered = false;
            let transitionEndTarget;
            if (allSlides) {
                transitionEndTarget = transformElements;
            } else {
                transitionEndTarget = transformElements.filter((transformEl) => {
                    const el = transformEl.classList.contains("swiper-slide-transform")
                        ? getSlide(transformEl)
                        : transformEl;
                    return swiper.getSlideIndex(el) === activeIndex;
                });
            }
            transitionEndTarget.forEach((el) => {
                elementTransitionEnd(el, () => {
                    if (eventTriggered) return;
                    if (!swiper || swiper.destroyed) return;
                    eventTriggered = true;
                    swiper.animating = false;
                    const evt = new window.CustomEvent("transitionend", {
                        bubbles: true,
                        cancelable: true,
                    });
                    swiper.wrapperEl.dispatchEvent(evt);
                });
            });
        }
    }

    function EffectFade({ swiper, extendParams, on }) {
        extendParams({
            fadeEffect: {
                crossFade: false,
            },
        });
        const setTranslate = () => {
            const { slides } = swiper;
            const params = swiper.params.fadeEffect;
            for (let i = 0; i < slides.length; i += 1) {
                const slideEl = swiper.slides[i];
                const offset = slideEl.swiperSlideOffset;
                let tx = -offset;
                if (!swiper.params.virtualTranslate) tx -= swiper.translate;
                let ty = 0;
                if (!swiper.isHorizontal()) {
                    ty = tx;
                    tx = 0;
                }
                const slideOpacity = swiper.params.fadeEffect.crossFade
                    ? Math.max(1 - Math.abs(slideEl.progress), 0)
                    : 1 + Math.min(Math.max(slideEl.progress, -1), 0);
                const targetEl = effectTarget(params, slideEl);
                targetEl.style.opacity = slideOpacity;
                targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`;
            }
        };
        const setTransition = (duration) => {
            const transformElements = swiper.slides.map((slideEl) => getSlideTransformEl(slideEl));
            transformElements.forEach((el) => {
                el.style.transitionDuration = `${duration}ms`;
            });
            effectVirtualTransitionEnd({
                swiper,
                duration,
                transformElements,
                allSlides: true,
            });
        };
        effectInit({
            effect: "fade",
            swiper,
            on,
            setTranslate,
            setTransition,
            overwriteParams: () => ({
                slidesPerView: 1,
                slidesPerGroup: 1,
                watchSlidesProgress: true,
                spaceBetween: 0,
                virtualTranslate: !swiper.params.cssMode,
            }),
        });
    }

    var masonry = { exports: {} };

    var outlayer = { exports: {} };

    var evEmitter = { exports: {} };

    /**
     * EvEmitter v1.1.0
     * Lil' event emitter
     * MIT License
     */

    (function (module) {
        /* jshint unused: true, undef: true, strict: true */

        (function (global, factory) {
            // universal module definition
            /* jshint strict: false */ /* globals define, module, window */
            if (module.exports) {
                // CommonJS - Browserify, Webpack
                module.exports = factory();
            } else {
                // Browser globals
                global.EvEmitter = factory();
            }
        })(typeof window != "undefined" ? window : commonjsGlobal, function () {
            function EvEmitter() {}

            var proto = EvEmitter.prototype;

            proto.on = function (eventName, listener) {
                if (!eventName || !listener) {
                    return;
                }
                // set events hash
                var events = (this._events = this._events || {});
                // set listeners array
                var listeners = (events[eventName] = events[eventName] || []);
                // only add once
                if (listeners.indexOf(listener) == -1) {
                    listeners.push(listener);
                }

                return this;
            };

            proto.once = function (eventName, listener) {
                if (!eventName || !listener) {
                    return;
                }
                // add event
                this.on(eventName, listener);
                // set once flag
                // set onceEvents hash
                var onceEvents = (this._onceEvents = this._onceEvents || {});
                // set onceListeners object
                var onceListeners = (onceEvents[eventName] = onceEvents[eventName] || {});
                // set flag
                onceListeners[listener] = true;

                return this;
            };

            proto.off = function (eventName, listener) {
                var listeners = this._events && this._events[eventName];
                if (!listeners || !listeners.length) {
                    return;
                }
                var index = listeners.indexOf(listener);
                if (index != -1) {
                    listeners.splice(index, 1);
                }

                return this;
            };

            proto.emitEvent = function (eventName, args) {
                var listeners = this._events && this._events[eventName];
                if (!listeners || !listeners.length) {
                    return;
                }
                // copy over to avoid interference if .off() in listener
                listeners = listeners.slice(0);
                args = args || [];
                // once stuff
                var onceListeners = this._onceEvents && this._onceEvents[eventName];

                for (var i = 0; i < listeners.length; i++) {
                    var listener = listeners[i];
                    var isOnce = onceListeners && onceListeners[listener];
                    if (isOnce) {
                        // remove listener
                        // remove before trigger to prevent recursion
                        this.off(eventName, listener);
                        // unset once flag
                        delete onceListeners[listener];
                    }
                    // trigger listener
                    listener.apply(this, args);
                }

                return this;
            };

            proto.allOff = function () {
                delete this._events;
                delete this._onceEvents;
            };

            return EvEmitter;
        });
    })(evEmitter);

    var getSize = { exports: {} };

    /*!
     * getSize v2.0.3
     * measure size of elements
     * MIT license
     */

    (function (module) {
        /* jshint browser: true, strict: true, undef: true, unused: true */
        /* globals console: false */

        (function (window, factory) {
            /* jshint strict: false */ /* globals define, module */
            if (module.exports) {
                // CommonJS
                module.exports = factory();
            } else {
                // browser global
                window.getSize = factory();
            }
        })(window, function factory() {
            // -------------------------- helpers -------------------------- //

            // get a number from a string, not a percentage
            function getStyleSize(value) {
                var num = parseFloat(value);
                // not a percent like '100%', and a number
                var isValid = value.indexOf("%") == -1 && !isNaN(num);
                return isValid && num;
            }

            function noop() {}

            var logError =
                typeof console == "undefined"
                    ? noop
                    : function (message) {
                          console.error(message);
                      };

            // -------------------------- measurements -------------------------- //

            var measurements = [
                "paddingLeft",
                "paddingRight",
                "paddingTop",
                "paddingBottom",
                "marginLeft",
                "marginRight",
                "marginTop",
                "marginBottom",
                "borderLeftWidth",
                "borderRightWidth",
                "borderTopWidth",
                "borderBottomWidth",
            ];

            var measurementsLength = measurements.length;

            function getZeroSize() {
                var size = {
                    width: 0,
                    height: 0,
                    innerWidth: 0,
                    innerHeight: 0,
                    outerWidth: 0,
                    outerHeight: 0,
                };
                for (var i = 0; i < measurementsLength; i++) {
                    var measurement = measurements[i];
                    size[measurement] = 0;
                }
                return size;
            }

            // -------------------------- getStyle -------------------------- //

            /**
             * getStyle, get style of element, check for Firefox bug
             * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
             */
            function getStyle(elem) {
                var style = getComputedStyle(elem);
                if (!style) {
                    logError(
                        "Style returned " +
                            style +
                            ". Are you running this code in a hidden iframe on Firefox? " +
                            "See https://bit.ly/getsizebug1"
                    );
                }
                return style;
            }

            // -------------------------- setup -------------------------- //

            var isSetup = false;

            var isBoxSizeOuter;

            /**
             * setup
             * check isBoxSizerOuter
             * do on first getSize() rather than on page load for Firefox bug
             */
            function setup() {
                // setup once
                if (isSetup) {
                    return;
                }
                isSetup = true;

                // -------------------------- box sizing -------------------------- //

                /**
                 * Chrome & Safari measure the outer-width on style.width on border-box elems
                 * IE11 & Firefox<29 measures the inner-width
                 */
                var div = document.createElement("div");
                div.style.width = "200px";
                div.style.padding = "1px 2px 3px 4px";
                div.style.borderStyle = "solid";
                div.style.borderWidth = "1px 2px 3px 4px";
                div.style.boxSizing = "border-box";

                var body = document.body || document.documentElement;
                body.appendChild(div);
                var style = getStyle(div);
                // round value for browser zoom. desandro/masonry#928
                isBoxSizeOuter = Math.round(getStyleSize(style.width)) == 200;
                getSize.isBoxSizeOuter = isBoxSizeOuter;

                body.removeChild(div);
            }

            // -------------------------- getSize -------------------------- //

            function getSize(elem) {
                setup();

                // use querySeletor if elem is string
                if (typeof elem == "string") {
                    elem = document.querySelector(elem);
                }

                // do not proceed on non-objects
                if (!elem || typeof elem != "object" || !elem.nodeType) {
                    return;
                }

                var style = getStyle(elem);

                // if hidden, everything is 0
                if (style.display == "none") {
                    return getZeroSize();
                }

                var size = {};
                size.width = elem.offsetWidth;
                size.height = elem.offsetHeight;

                var isBorderBox = (size.isBorderBox = style.boxSizing == "border-box");

                // get all measurements
                for (var i = 0; i < measurementsLength; i++) {
                    var measurement = measurements[i];
                    var value = style[measurement];
                    var num = parseFloat(value);
                    // any 'auto', 'medium' value will be 0
                    size[measurement] = !isNaN(num) ? num : 0;
                }

                var paddingWidth = size.paddingLeft + size.paddingRight;
                var paddingHeight = size.paddingTop + size.paddingBottom;
                var marginWidth = size.marginLeft + size.marginRight;
                var marginHeight = size.marginTop + size.marginBottom;
                var borderWidth = size.borderLeftWidth + size.borderRightWidth;
                var borderHeight = size.borderTopWidth + size.borderBottomWidth;

                var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

                // overwrite width and height if we can get it from style
                var styleWidth = getStyleSize(style.width);
                if (styleWidth !== false) {
                    size.width =
                        styleWidth +
                        // add padding and border unless it's already including it
                        (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
                }

                var styleHeight = getStyleSize(style.height);
                if (styleHeight !== false) {
                    size.height =
                        styleHeight +
                        // add padding and border unless it's already including it
                        (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
                }

                size.innerWidth = size.width - (paddingWidth + borderWidth);
                size.innerHeight = size.height - (paddingHeight + borderHeight);

                size.outerWidth = size.width + marginWidth;
                size.outerHeight = size.height + marginHeight;

                return size;
            }

            return getSize;
        });
    })(getSize);

    var utils = { exports: {} };

    var matchesSelector = { exports: {} };

    /**
     * matchesSelector v2.0.2
     * matchesSelector( element, '.selector' )
     * MIT license
     */

    (function (module) {
        /*jshint browser: true, strict: true, undef: true, unused: true */

        (function (window, factory) {
            // universal module definition
            if (module.exports) {
                // CommonJS
                module.exports = factory();
            } else {
                // browser global
                window.matchesSelector = factory();
            }
        })(window, function factory() {
            var matchesMethod = (function () {
                var ElemProto = window.Element.prototype;
                // check for the standard method name first
                if (ElemProto.matches) {
                    return "matches";
                }
                // check un-prefixed
                if (ElemProto.matchesSelector) {
                    return "matchesSelector";
                }
                // check vendor prefixes
                var prefixes = ["webkit", "moz", "ms", "o"];

                for (var i = 0; i < prefixes.length; i++) {
                    var prefix = prefixes[i];
                    var method = prefix + "MatchesSelector";
                    if (ElemProto[method]) {
                        return method;
                    }
                }
            })();

            return function matchesSelector(elem, selector) {
                return elem[matchesMethod](selector);
            };
        });
    })(matchesSelector);

    /**
     * Fizzy UI utils v2.0.7
     * MIT license
     */

    (function (module) {
        /*jshint browser: true, undef: true, unused: true, strict: true */

        (function (window, factory) {
            // universal module definition
            /*jshint strict: false */ /*globals define, module, require */

            if (module.exports) {
                // CommonJS
                module.exports = factory(window, matchesSelector.exports);
            } else {
                // browser global
                window.fizzyUIUtils = factory(window, window.matchesSelector);
            }
        })(window, function factory(window, matchesSelector) {
            var utils = {};

            // ----- extend ----- //

            // extends objects
            utils.extend = function (a, b) {
                for (var prop in b) {
                    a[prop] = b[prop];
                }
                return a;
            };

            // ----- modulo ----- //

            utils.modulo = function (num, div) {
                return ((num % div) + div) % div;
            };

            // ----- makeArray ----- //

            var arraySlice = Array.prototype.slice;

            // turn element or nodeList into an array
            utils.makeArray = function (obj) {
                if (Array.isArray(obj)) {
                    // use object if already an array
                    return obj;
                }
                // return empty array if undefined or null. #6
                if (obj === null || obj === undefined) {
                    return [];
                }

                var isArrayLike = typeof obj == "object" && typeof obj.length == "number";
                if (isArrayLike) {
                    // convert nodeList to array
                    return arraySlice.call(obj);
                }

                // array of single index
                return [obj];
            };

            // ----- removeFrom ----- //

            utils.removeFrom = function (ary, obj) {
                var index = ary.indexOf(obj);
                if (index != -1) {
                    ary.splice(index, 1);
                }
            };

            // ----- getParent ----- //

            utils.getParent = function (elem, selector) {
                while (elem.parentNode && elem != document.body) {
                    elem = elem.parentNode;
                    if (matchesSelector(elem, selector)) {
                        return elem;
                    }
                }
            };

            // ----- getQueryElement ----- //

            // use element as selector string
            utils.getQueryElement = function (elem) {
                if (typeof elem == "string") {
                    return document.querySelector(elem);
                }
                return elem;
            };

            // ----- handleEvent ----- //

            // enable .ontype to trigger from .addEventListener( elem, 'type' )
            utils.handleEvent = function (event) {
                var method = "on" + event.type;
                if (this[method]) {
                    this[method](event);
                }
            };

            // ----- filterFindElements ----- //

            utils.filterFindElements = function (elems, selector) {
                // make array of elems
                elems = utils.makeArray(elems);
                var ffElems = [];

                elems.forEach(function (elem) {
                    // check that elem is an actual element
                    if (!(elem instanceof HTMLElement)) {
                        return;
                    }
                    // add elem if no selector
                    if (!selector) {
                        ffElems.push(elem);
                        return;
                    }
                    // filter & find items if we have a selector
                    // filter
                    if (matchesSelector(elem, selector)) {
                        ffElems.push(elem);
                    }
                    // find children
                    var childElems = elem.querySelectorAll(selector);
                    // concat childElems to filterFound array
                    for (var i = 0; i < childElems.length; i++) {
                        ffElems.push(childElems[i]);
                    }
                });

                return ffElems;
            };

            // ----- debounceMethod ----- //

            utils.debounceMethod = function (_class, methodName, threshold) {
                threshold = threshold || 100;
                // original method
                var method = _class.prototype[methodName];
                var timeoutName = methodName + "Timeout";

                _class.prototype[methodName] = function () {
                    var timeout = this[timeoutName];
                    clearTimeout(timeout);

                    var args = arguments;
                    var _this = this;
                    this[timeoutName] = setTimeout(function () {
                        method.apply(_this, args);
                        delete _this[timeoutName];
                    }, threshold);
                };
            };

            // ----- docReady ----- //

            utils.docReady = function (callback) {
                var readyState = document.readyState;
                if (readyState == "complete" || readyState == "interactive") {
                    // do async to allow for other scripts to run. metafizzy/flickity#441
                    setTimeout(callback);
                } else {
                    document.addEventListener("DOMContentLoaded", callback);
                }
            };

            // ----- htmlInit ----- //

            // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
            utils.toDashed = function (str) {
                return str
                    .replace(/(.)([A-Z])/g, function (match, $1, $2) {
                        return $1 + "-" + $2;
                    })
                    .toLowerCase();
            };

            var console = window.console;
            /**
             * allow user to initialize classes via [data-namespace] or .js-namespace class
             * htmlInit( Widget, 'widgetName' )
             * options are parsed from data-namespace-options
             */
            utils.htmlInit = function (WidgetClass, namespace) {
                utils.docReady(function () {
                    var dashedNamespace = utils.toDashed(namespace);
                    var dataAttr = "data-" + dashedNamespace;
                    var dataAttrElems = document.querySelectorAll("[" + dataAttr + "]");
                    var jsDashElems = document.querySelectorAll(".js-" + dashedNamespace);
                    var elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems));
                    var dataOptionsAttr = dataAttr + "-options";
                    var jQuery = window.jQuery;

                    elems.forEach(function (elem) {
                        var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
                        var options;
                        try {
                            options = attr && JSON.parse(attr);
                        } catch (error) {
                            // log error, do not initialize
                            if (console) {
                                console.error("Error parsing " + dataAttr + " on " + elem.className + ": " + error);
                            }
                            return;
                        }
                        // initialize
                        var instance = new WidgetClass(elem, options);
                        // make available via $().data('namespace')
                        if (jQuery) {
                            jQuery.data(elem, namespace, instance);
                        }
                    });
                });
            };

            // -----  ----- //

            return utils;
        });
    })(utils);

    var item = { exports: {} };

    /**
     * Outlayer Item
     */

    (function (module) {
        (function (window, factory) {
            // universal module definition
            /* jshint strict: false */ /* globals define, module, require */
            if (module.exports) {
                // CommonJS - Browserify, Webpack
                module.exports = factory(evEmitter.exports, getSize.exports);
            } else {
                // browser global
                window.Outlayer = {};
                window.Outlayer.Item = factory(window.EvEmitter, window.getSize);
            }
        })(window, function factory(EvEmitter, getSize) {
            // ----- helpers ----- //

            function isEmptyObj(obj) {
                for (var prop in obj) {
                    return false;
                }
                prop = null;
                return true;
            }

            // -------------------------- CSS3 support -------------------------- //

            var docElemStyle = document.documentElement.style;

            var transitionProperty = typeof docElemStyle.transition == "string" ? "transition" : "WebkitTransition";
            var transformProperty = typeof docElemStyle.transform == "string" ? "transform" : "WebkitTransform";

            var transitionEndEvent = {
                WebkitTransition: "webkitTransitionEnd",
                transition: "transitionend",
            }[transitionProperty];

            // cache all vendor properties that could have vendor prefix
            var vendorProperties = {
                transform: transformProperty,
                transition: transitionProperty,
                transitionDuration: transitionProperty + "Duration",
                transitionProperty: transitionProperty + "Property",
                transitionDelay: transitionProperty + "Delay",
            };

            // -------------------------- Item -------------------------- //

            function Item(element, layout) {
                if (!element) {
                    return;
                }

                this.element = element;
                // parent layout class, i.e. Masonry, Isotope, or Packery
                this.layout = layout;
                this.position = {
                    x: 0,
                    y: 0,
                };

                this._create();
            }

            // inherit EvEmitter
            var proto = (Item.prototype = Object.create(EvEmitter.prototype));
            proto.constructor = Item;

            proto._create = function () {
                // transition objects
                this._transn = {
                    ingProperties: {},
                    clean: {},
                    onEnd: {},
                };

                this.css({
                    position: "absolute",
                });
            };

            // trigger specified handler for event type
            proto.handleEvent = function (event) {
                var method = "on" + event.type;
                if (this[method]) {
                    this[method](event);
                }
            };

            proto.getSize = function () {
                this.size = getSize(this.element);
            };

            /**
             * apply CSS styles to element
             * @param {Object} style
             */
            proto.css = function (style) {
                var elemStyle = this.element.style;

                for (var prop in style) {
                    // use vendor property if available
                    var supportedProp = vendorProperties[prop] || prop;
                    elemStyle[supportedProp] = style[prop];
                }
            };

            // measure position, and sets it
            proto.getPosition = function () {
                var style = getComputedStyle(this.element);
                var isOriginLeft = this.layout._getOption("originLeft");
                var isOriginTop = this.layout._getOption("originTop");
                var xValue = style[isOriginLeft ? "left" : "right"];
                var yValue = style[isOriginTop ? "top" : "bottom"];
                var x = parseFloat(xValue);
                var y = parseFloat(yValue);
                // convert percent to pixels
                var layoutSize = this.layout.size;
                if (xValue.indexOf("%") != -1) {
                    x = (x / 100) * layoutSize.width;
                }
                if (yValue.indexOf("%") != -1) {
                    y = (y / 100) * layoutSize.height;
                }
                // clean up 'auto' or other non-integer values
                x = isNaN(x) ? 0 : x;
                y = isNaN(y) ? 0 : y;
                // remove padding from measurement
                x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
                y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

                this.position.x = x;
                this.position.y = y;
            };

            // set settled position, apply padding
            proto.layoutPosition = function () {
                var layoutSize = this.layout.size;
                var style = {};
                var isOriginLeft = this.layout._getOption("originLeft");
                var isOriginTop = this.layout._getOption("originTop");

                // x
                var xPadding = isOriginLeft ? "paddingLeft" : "paddingRight";
                var xProperty = isOriginLeft ? "left" : "right";
                var xResetProperty = isOriginLeft ? "right" : "left";

                var x = this.position.x + layoutSize[xPadding];
                // set in percentage or pixels
                style[xProperty] = this.getXValue(x);
                // reset other property
                style[xResetProperty] = "";

                // y
                var yPadding = isOriginTop ? "paddingTop" : "paddingBottom";
                var yProperty = isOriginTop ? "top" : "bottom";
                var yResetProperty = isOriginTop ? "bottom" : "top";

                var y = this.position.y + layoutSize[yPadding];
                // set in percentage or pixels
                style[yProperty] = this.getYValue(y);
                // reset other property
                style[yResetProperty] = "";

                this.css(style);
                this.emitEvent("layout", [this]);
            };

            proto.getXValue = function (x) {
                var isHorizontal = this.layout._getOption("horizontal");
                return this.layout.options.percentPosition && !isHorizontal
                    ? (x / this.layout.size.width) * 100 + "%"
                    : x + "px";
            };

            proto.getYValue = function (y) {
                var isHorizontal = this.layout._getOption("horizontal");
                return this.layout.options.percentPosition && isHorizontal
                    ? (y / this.layout.size.height) * 100 + "%"
                    : y + "px";
            };

            proto._transitionTo = function (x, y) {
                this.getPosition();
                // get current x & y from top/left
                var curX = this.position.x;
                var curY = this.position.y;

                var didNotMove = x == this.position.x && y == this.position.y;

                // save end position
                this.setPosition(x, y);

                // if did not move and not transitioning, just go to layout
                if (didNotMove && !this.isTransitioning) {
                    this.layoutPosition();
                    return;
                }

                var transX = x - curX;
                var transY = y - curY;
                var transitionStyle = {};
                transitionStyle.transform = this.getTranslate(transX, transY);

                this.transition({
                    to: transitionStyle,
                    onTransitionEnd: {
                        transform: this.layoutPosition,
                    },
                    isCleaning: true,
                });
            };

            proto.getTranslate = function (x, y) {
                // flip cooridinates if origin on right or bottom
                var isOriginLeft = this.layout._getOption("originLeft");
                var isOriginTop = this.layout._getOption("originTop");
                x = isOriginLeft ? x : -x;
                y = isOriginTop ? y : -y;
                return "translate3d(" + x + "px, " + y + "px, 0)";
            };

            // non transition + transform support
            proto.goTo = function (x, y) {
                this.setPosition(x, y);
                this.layoutPosition();
            };

            proto.moveTo = proto._transitionTo;

            proto.setPosition = function (x, y) {
                this.position.x = parseFloat(x);
                this.position.y = parseFloat(y);
            };

            // ----- transition ----- //

            /**
             * @param {Object} style - CSS
             * @param {Function} onTransitionEnd
             */

            // non transition, just trigger callback
            proto._nonTransition = function (args) {
                this.css(args.to);
                if (args.isCleaning) {
                    this._removeStyles(args.to);
                }
                for (var prop in args.onTransitionEnd) {
                    args.onTransitionEnd[prop].call(this);
                }
            };

            /**
             * proper transition
             * @param {Object} args - arguments
             *   @param {Object} to - style to transition to
             *   @param {Object} from - style to start transition from
             *   @param {Boolean} isCleaning - removes transition styles after transition
             *   @param {Function} onTransitionEnd - callback
             */
            proto.transition = function (args) {
                // redirect to nonTransition if no transition duration
                if (!parseFloat(this.layout.options.transitionDuration)) {
                    this._nonTransition(args);
                    return;
                }

                var _transition = this._transn;
                // keep track of onTransitionEnd callback by css property
                for (var prop in args.onTransitionEnd) {
                    _transition.onEnd[prop] = args.onTransitionEnd[prop];
                }
                // keep track of properties that are transitioning
                for (prop in args.to) {
                    _transition.ingProperties[prop] = true;
                    // keep track of properties to clean up when transition is done
                    if (args.isCleaning) {
                        _transition.clean[prop] = true;
                    }
                }

                // set from styles
                if (args.from) {
                    this.css(args.from);
                    // force redraw. http://blog.alexmaccaw.com/css-transitions
                    this.element.offsetHeight;
                }
                // enable transition
                this.enableTransition(args.to);
                // set styles that are transitioning
                this.css(args.to);

                this.isTransitioning = true;
            };

            // dash before all cap letters, including first for
            // WebkitTransform => -webkit-transform
            function toDashedAll(str) {
                return str.replace(/([A-Z])/g, function ($1) {
                    return "-" + $1.toLowerCase();
                });
            }

            var transitionProps = "opacity," + toDashedAll(transformProperty);

            proto.enableTransition = function (/* style */) {
                // HACK changing transitionProperty during a transition
                // will cause transition to jump
                if (this.isTransitioning) {
                    return;
                }

                // make `transition: foo, bar, baz` from style object
                // HACK un-comment this when enableTransition can work
                // while a transition is happening
                // var transitionValues = [];
                // for ( var prop in style ) {
                //   // dash-ify camelCased properties like WebkitTransition
                //   prop = vendorProperties[ prop ] || prop;
                //   transitionValues.push( toDashedAll( prop ) );
                // }
                // munge number to millisecond, to match stagger
                var duration = this.layout.options.transitionDuration;
                duration = typeof duration == "number" ? duration + "ms" : duration;
                // enable transition styles
                this.css({
                    transitionProperty: transitionProps,
                    transitionDuration: duration,
                    transitionDelay: this.staggerDelay || 0,
                });
                // listen for transition end event
                this.element.addEventListener(transitionEndEvent, this, false);
            };

            // ----- events ----- //

            proto.onwebkitTransitionEnd = function (event) {
                this.ontransitionend(event);
            };

            proto.onotransitionend = function (event) {
                this.ontransitionend(event);
            };

            // properties that I munge to make my life easier
            var dashedVendorProperties = {
                "-webkit-transform": "transform",
            };

            proto.ontransitionend = function (event) {
                // disregard bubbled events from children
                if (event.target !== this.element) {
                    return;
                }
                var _transition = this._transn;
                // get property name of transitioned property, convert to prefix-free
                var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName;

                // remove property that has completed transitioning
                delete _transition.ingProperties[propertyName];
                // check if any properties are still transitioning
                if (isEmptyObj(_transition.ingProperties)) {
                    // all properties have completed transitioning
                    this.disableTransition();
                }
                // clean style
                if (propertyName in _transition.clean) {
                    // clean up style
                    this.element.style[event.propertyName] = "";
                    delete _transition.clean[propertyName];
                }
                // trigger onTransitionEnd callback
                if (propertyName in _transition.onEnd) {
                    var onTransitionEnd = _transition.onEnd[propertyName];
                    onTransitionEnd.call(this);
                    delete _transition.onEnd[propertyName];
                }

                this.emitEvent("transitionEnd", [this]);
            };

            proto.disableTransition = function () {
                this.removeTransitionStyles();
                this.element.removeEventListener(transitionEndEvent, this, false);
                this.isTransitioning = false;
            };

            /**
             * removes style property from element
             * @param {Object} style
             **/
            proto._removeStyles = function (style) {
                // clean up transition styles
                var cleanStyle = {};
                for (var prop in style) {
                    cleanStyle[prop] = "";
                }
                this.css(cleanStyle);
            };

            var cleanTransitionStyle = {
                transitionProperty: "",
                transitionDuration: "",
                transitionDelay: "",
            };

            proto.removeTransitionStyles = function () {
                // remove transition
                this.css(cleanTransitionStyle);
            };

            // ----- stagger ----- //

            proto.stagger = function (delay) {
                delay = isNaN(delay) ? 0 : delay;
                this.staggerDelay = delay + "ms";
            };

            // ----- show/hide/remove ----- //

            // remove element from DOM
            proto.removeElem = function () {
                this.element.parentNode.removeChild(this.element);
                // remove display: none
                this.css({ display: "" });
                this.emitEvent("remove", [this]);
            };

            proto.remove = function () {
                // just remove element if no transition support or no transition
                if (!transitionProperty || !parseFloat(this.layout.options.transitionDuration)) {
                    this.removeElem();
                    return;
                }

                // start transition
                this.once("transitionEnd", function () {
                    this.removeElem();
                });
                this.hide();
            };

            proto.reveal = function () {
                delete this.isHidden;
                // remove display: none
                this.css({ display: "" });

                var options = this.layout.options;

                var onTransitionEnd = {};
                var transitionEndProperty = this.getHideRevealTransitionEndProperty("visibleStyle");
                onTransitionEnd[transitionEndProperty] = this.onRevealTransitionEnd;

                this.transition({
                    from: options.hiddenStyle,
                    to: options.visibleStyle,
                    isCleaning: true,
                    onTransitionEnd: onTransitionEnd,
                });
            };

            proto.onRevealTransitionEnd = function () {
                // check if still visible
                // during transition, item may have been hidden
                if (!this.isHidden) {
                    this.emitEvent("reveal");
                }
            };

            /**
             * get style property use for hide/reveal transition end
             * @param {String} styleProperty - hiddenStyle/visibleStyle
             * @returns {String}
             */
            proto.getHideRevealTransitionEndProperty = function (styleProperty) {
                var optionStyle = this.layout.options[styleProperty];
                // use opacity
                if (optionStyle.opacity) {
                    return "opacity";
                }
                // get first property
                for (var prop in optionStyle) {
                    return prop;
                }
            };

            proto.hide = function () {
                // set flag
                this.isHidden = true;
                // remove display: none
                this.css({ display: "" });

                var options = this.layout.options;

                var onTransitionEnd = {};
                var transitionEndProperty = this.getHideRevealTransitionEndProperty("hiddenStyle");
                onTransitionEnd[transitionEndProperty] = this.onHideTransitionEnd;

                this.transition({
                    from: options.visibleStyle,
                    to: options.hiddenStyle,
                    // keep hidden stuff hidden
                    isCleaning: true,
                    onTransitionEnd: onTransitionEnd,
                });
            };

            proto.onHideTransitionEnd = function () {
                // check if still hidden
                // during transition, item may have been un-hidden
                if (this.isHidden) {
                    this.css({ display: "none" });
                    this.emitEvent("hide");
                }
            };

            proto.destroy = function () {
                this.css({
                    position: "",
                    left: "",
                    right: "",
                    top: "",
                    bottom: "",
                    transition: "",
                    transform: "",
                });
            };

            return Item;
        });
    })(item);

    /*!
     * Outlayer v2.1.1
     * the brains and guts of a layout library
     * MIT license
     */

    (function (module) {
        (function (window, factory) {
            // universal module definition
            /* jshint strict: false */ /* globals define, module, require */
            if (module.exports) {
                // CommonJS - Browserify, Webpack
                module.exports = factory(window, evEmitter.exports, getSize.exports, utils.exports, item.exports);
            } else {
                // browser global
                window.Outlayer = factory(
                    window,
                    window.EvEmitter,
                    window.getSize,
                    window.fizzyUIUtils,
                    window.Outlayer.Item
                );
            }
        })(window, function factory(window, EvEmitter, getSize, utils, Item) {
            // ----- vars ----- //

            var console = window.console;
            var jQuery = window.jQuery;
            var noop = function () {};

            // -------------------------- Outlayer -------------------------- //

            // globally unique identifiers
            var GUID = 0;
            // internal store of all Outlayer intances
            var instances = {};

            /**
             * @param {Element, String} element
             * @param {Object} options
             * @constructor
             */
            function Outlayer(element, options) {
                var queryElement = utils.getQueryElement(element);
                if (!queryElement) {
                    if (console) {
                        console.error(
                            "Bad element for " + this.constructor.namespace + ": " + (queryElement || element)
                        );
                    }
                    return;
                }
                this.element = queryElement;
                // add jQuery
                if (jQuery) {
                    this.$element = jQuery(this.element);
                }

                // options
                this.options = utils.extend({}, this.constructor.defaults);
                this.option(options);

                // add id for Outlayer.getFromElement
                var id = ++GUID;
                this.element.outlayerGUID = id; // expando
                instances[id] = this; // associate via id

                // kick it off
                this._create();

                var isInitLayout = this._getOption("initLayout");
                if (isInitLayout) {
                    this.layout();
                }
            }

            // settings are for internal use only
            Outlayer.namespace = "outlayer";
            Outlayer.Item = Item;

            // default options
            Outlayer.defaults = {
                containerStyle: {
                    position: "relative",
                },
                initLayout: true,
                originLeft: true,
                originTop: true,
                resize: true,
                resizeContainer: true,
                // item options
                transitionDuration: "0.4s",
                hiddenStyle: {
                    opacity: 0,
                    transform: "scale(0.001)",
                },
                visibleStyle: {
                    opacity: 1,
                    transform: "scale(1)",
                },
            };

            var proto = Outlayer.prototype;
            // inherit EvEmitter
            utils.extend(proto, EvEmitter.prototype);

            /**
             * set options
             * @param {Object} opts
             */
            proto.option = function (opts) {
                utils.extend(this.options, opts);
            };

            /**
             * get backwards compatible option value, check old name
             */
            proto._getOption = function (option) {
                var oldOption = this.constructor.compatOptions[option];
                return oldOption && this.options[oldOption] !== undefined
                    ? this.options[oldOption]
                    : this.options[option];
            };

            Outlayer.compatOptions = {
                // currentName: oldName
                initLayout: "isInitLayout",
                horizontal: "isHorizontal",
                layoutInstant: "isLayoutInstant",
                originLeft: "isOriginLeft",
                originTop: "isOriginTop",
                resize: "isResizeBound",
                resizeContainer: "isResizingContainer",
            };

            proto._create = function () {
                // get items from children
                this.reloadItems();
                // elements that affect layout, but are not laid out
                this.stamps = [];
                this.stamp(this.options.stamp);
                // set container style
                utils.extend(this.element.style, this.options.containerStyle);

                // bind resize method
                var canBindResize = this._getOption("resize");
                if (canBindResize) {
                    this.bindResize();
                }
            };

            // goes through all children again and gets bricks in proper order
            proto.reloadItems = function () {
                // collection of item elements
                this.items = this._itemize(this.element.children);
            };

            /**
             * turn elements into Outlayer.Items to be used in layout
             * @param {Array or NodeList or HTMLElement} elems
             * @returns {Array} items - collection of new Outlayer Items
             */
            proto._itemize = function (elems) {
                var itemElems = this._filterFindItemElements(elems);
                var Item = this.constructor.Item;

                // create new Outlayer Items for collection
                var items = [];
                for (var i = 0; i < itemElems.length; i++) {
                    var elem = itemElems[i];
                    var item = new Item(elem, this);
                    items.push(item);
                }

                return items;
            };

            /**
             * get item elements to be used in layout
             * @param {Array or NodeList or HTMLElement} elems
             * @returns {Array} items - item elements
             */
            proto._filterFindItemElements = function (elems) {
                return utils.filterFindElements(elems, this.options.itemSelector);
            };

            /**
             * getter method for getting item elements
             * @returns {Array} elems - collection of item elements
             */
            proto.getItemElements = function () {
                return this.items.map(function (item) {
                    return item.element;
                });
            };

            // ----- init & layout ----- //

            /**
             * lays out all items
             */
            proto.layout = function () {
                this._resetLayout();
                this._manageStamps();

                // don't animate first layout
                var layoutInstant = this._getOption("layoutInstant");
                var isInstant = layoutInstant !== undefined ? layoutInstant : !this._isLayoutInited;
                this.layoutItems(this.items, isInstant);

                // flag for initalized
                this._isLayoutInited = true;
            };

            // _init is alias for layout
            proto._init = proto.layout;

            /**
             * logic before any new layout
             */
            proto._resetLayout = function () {
                this.getSize();
            };

            proto.getSize = function () {
                this.size = getSize(this.element);
            };

            /**
             * get measurement from option, for columnWidth, rowHeight, gutter
             * if option is String -> get element from selector string, & get size of element
             * if option is Element -> get size of element
             * else use option as a number
             *
             * @param {String} measurement
             * @param {String} size - width or height
             * @private
             */
            proto._getMeasurement = function (measurement, size) {
                var option = this.options[measurement];
                var elem;
                if (!option) {
                    // default to 0
                    this[measurement] = 0;
                } else {
                    // use option as an element
                    if (typeof option == "string") {
                        elem = this.element.querySelector(option);
                    } else if (option instanceof HTMLElement) {
                        elem = option;
                    }
                    // use size of element, if element
                    this[measurement] = elem ? getSize(elem)[size] : option;
                }
            };

            /**
             * layout a collection of item elements
             * @api public
             */
            proto.layoutItems = function (items, isInstant) {
                items = this._getItemsForLayout(items);

                this._layoutItems(items, isInstant);

                this._postLayout();
            };

            /**
             * get the items to be laid out
             * you may want to skip over some items
             * @param {Array} items
             * @returns {Array} items
             */
            proto._getItemsForLayout = function (items) {
                return items.filter(function (item) {
                    return !item.isIgnored;
                });
            };

            /**
             * layout items
             * @param {Array} items
             * @param {Boolean} isInstant
             */
            proto._layoutItems = function (items, isInstant) {
                this._emitCompleteOnItems("layout", items);

                if (!items || !items.length) {
                    // no items, emit event with empty array
                    return;
                }

                var queue = [];

                items.forEach(function (item) {
                    // get x/y object from method
                    var position = this._getItemLayoutPosition(item);
                    // enqueue
                    position.item = item;
                    position.isInstant = isInstant || item.isLayoutInstant;
                    queue.push(position);
                }, this);

                this._processLayoutQueue(queue);
            };

            /**
             * get item layout position
             * @param {Outlayer.Item} item
             * @returns {Object} x and y position
             */
            proto._getItemLayoutPosition = function (/* item */) {
                return {
                    x: 0,
                    y: 0,
                };
            };

            /**
             * iterate over array and position each item
             * Reason being - separating this logic prevents 'layout invalidation'
             * thx @paul_irish
             * @param {Array} queue
             */
            proto._processLayoutQueue = function (queue) {
                this.updateStagger();
                queue.forEach(function (obj, i) {
                    this._positionItem(obj.item, obj.x, obj.y, obj.isInstant, i);
                }, this);
            };

            // set stagger from option in milliseconds number
            proto.updateStagger = function () {
                var stagger = this.options.stagger;
                if (stagger === null || stagger === undefined) {
                    this.stagger = 0;
                    return;
                }
                this.stagger = getMilliseconds(stagger);
                return this.stagger;
            };

            /**
             * Sets position of item in DOM
             * @param {Outlayer.Item} item
             * @param {Number} x - horizontal position
             * @param {Number} y - vertical position
             * @param {Boolean} isInstant - disables transitions
             */
            proto._positionItem = function (item, x, y, isInstant, i) {
                if (isInstant) {
                    // if not transition, just set CSS
                    item.goTo(x, y);
                } else {
                    item.stagger(i * this.stagger);
                    item.moveTo(x, y);
                }
            };

            /**
             * Any logic you want to do after each layout,
             * i.e. size the container
             */
            proto._postLayout = function () {
                this.resizeContainer();
            };

            proto.resizeContainer = function () {
                var isResizingContainer = this._getOption("resizeContainer");
                if (!isResizingContainer) {
                    return;
                }
                var size = this._getContainerSize();
                if (size) {
                    this._setContainerMeasure(size.width, true);
                    this._setContainerMeasure(size.height, false);
                }
            };

            /**
             * Sets width or height of container if returned
             * @returns {Object} size
             *   @param {Number} width
             *   @param {Number} height
             */
            proto._getContainerSize = noop;

            /**
             * @param {Number} measure - size of width or height
             * @param {Boolean} isWidth
             */
            proto._setContainerMeasure = function (measure, isWidth) {
                if (measure === undefined) {
                    return;
                }

                var elemSize = this.size;
                // add padding and border width if border box
                if (elemSize.isBorderBox) {
                    measure += isWidth
                        ? elemSize.paddingLeft +
                          elemSize.paddingRight +
                          elemSize.borderLeftWidth +
                          elemSize.borderRightWidth
                        : elemSize.paddingBottom +
                          elemSize.paddingTop +
                          elemSize.borderTopWidth +
                          elemSize.borderBottomWidth;
                }

                measure = Math.max(measure, 0);
                this.element.style[isWidth ? "width" : "height"] = measure + "px";
            };

            /**
             * emit eventComplete on a collection of items events
             * @param {String} eventName
             * @param {Array} items - Outlayer.Items
             */
            proto._emitCompleteOnItems = function (eventName, items) {
                var _this = this;
                function onComplete() {
                    _this.dispatchEvent(eventName + "Complete", null, [items]);
                }

                var count = items.length;
                if (!items || !count) {
                    onComplete();
                    return;
                }

                var doneCount = 0;
                function tick() {
                    doneCount++;
                    if (doneCount == count) {
                        onComplete();
                    }
                }

                // bind callback
                items.forEach(function (item) {
                    item.once(eventName, tick);
                });
            };

            /**
             * emits events via EvEmitter and jQuery events
             * @param {String} type - name of event
             * @param {Event} event - original event
             * @param {Array} args - extra arguments
             */
            proto.dispatchEvent = function (type, event, args) {
                // add original event to arguments
                var emitArgs = event ? [event].concat(args) : args;
                this.emitEvent(type, emitArgs);

                if (jQuery) {
                    // set this.$element
                    this.$element = this.$element || jQuery(this.element);
                    if (event) {
                        // create jQuery event
                        var $event = jQuery.Event(event);
                        $event.type = type;
                        this.$element.trigger($event, args);
                    } else {
                        // just trigger with type if no event available
                        this.$element.trigger(type, args);
                    }
                }
            };

            // -------------------------- ignore & stamps -------------------------- //

            /**
             * keep item in collection, but do not lay it out
             * ignored items do not get skipped in layout
             * @param {Element} elem
             */
            proto.ignore = function (elem) {
                var item = this.getItem(elem);
                if (item) {
                    item.isIgnored = true;
                }
            };

            /**
             * return item to layout collection
             * @param {Element} elem
             */
            proto.unignore = function (elem) {
                var item = this.getItem(elem);
                if (item) {
                    delete item.isIgnored;
                }
            };

            /**
             * adds elements to stamps
             * @param {NodeList, Array, Element, or String} elems
             */
            proto.stamp = function (elems) {
                elems = this._find(elems);
                if (!elems) {
                    return;
                }

                this.stamps = this.stamps.concat(elems);
                // ignore
                elems.forEach(this.ignore, this);
            };

            /**
             * removes elements to stamps
             * @param {NodeList, Array, or Element} elems
             */
            proto.unstamp = function (elems) {
                elems = this._find(elems);
                if (!elems) {
                    return;
                }

                elems.forEach(function (elem) {
                    // filter out removed stamp elements
                    utils.removeFrom(this.stamps, elem);
                    this.unignore(elem);
                }, this);
            };

            /**
             * finds child elements
             * @param {NodeList, Array, Element, or String} elems
             * @returns {Array} elems
             */
            proto._find = function (elems) {
                if (!elems) {
                    return;
                }
                // if string, use argument as selector string
                if (typeof elems == "string") {
                    elems = this.element.querySelectorAll(elems);
                }
                elems = utils.makeArray(elems);
                return elems;
            };

            proto._manageStamps = function () {
                if (!this.stamps || !this.stamps.length) {
                    return;
                }

                this._getBoundingRect();

                this.stamps.forEach(this._manageStamp, this);
            };

            // update boundingLeft / Top
            proto._getBoundingRect = function () {
                // get bounding rect for container element
                var boundingRect = this.element.getBoundingClientRect();
                var size = this.size;
                this._boundingRect = {
                    left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
                    top: boundingRect.top + size.paddingTop + size.borderTopWidth,
                    right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
                    bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth),
                };
            };

            /**
             * @param {Element} stamp
             **/
            proto._manageStamp = noop;

            /**
             * get x/y position of element relative to container element
             * @param {Element} elem
             * @returns {Object} offset - has left, top, right, bottom
             */
            proto._getElementOffset = function (elem) {
                var boundingRect = elem.getBoundingClientRect();
                var thisRect = this._boundingRect;
                var size = getSize(elem);
                var offset = {
                    left: boundingRect.left - thisRect.left - size.marginLeft,
                    top: boundingRect.top - thisRect.top - size.marginTop,
                    right: thisRect.right - boundingRect.right - size.marginRight,
                    bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom,
                };
                return offset;
            };

            // -------------------------- resize -------------------------- //

            // enable event handlers for listeners
            // i.e. resize -> onresize
            proto.handleEvent = utils.handleEvent;

            /**
             * Bind layout to window resizing
             */
            proto.bindResize = function () {
                window.addEventListener("resize", this);
                this.isResizeBound = true;
            };

            /**
             * Unbind layout to window resizing
             */
            proto.unbindResize = function () {
                window.removeEventListener("resize", this);
                this.isResizeBound = false;
            };

            proto.onresize = function () {
                this.resize();
            };

            utils.debounceMethod(Outlayer, "onresize", 100);

            proto.resize = function () {
                // don't trigger if size did not change
                // or if resize was unbound. See #9
                if (!this.isResizeBound || !this.needsResizeLayout()) {
                    return;
                }

                this.layout();
            };

            /**
             * check if layout is needed post layout
             * @returns Boolean
             */
            proto.needsResizeLayout = function () {
                var size = getSize(this.element);
                // check that this.size and size are there
                // IE8 triggers resize on body size change, so they might not be
                var hasSizes = this.size && size;
                return hasSizes && size.innerWidth !== this.size.innerWidth;
            };

            // -------------------------- methods -------------------------- //

            /**
             * add items to Outlayer instance
             * @param {Array or NodeList or Element} elems
             * @returns {Array} items - Outlayer.Items
             **/
            proto.addItems = function (elems) {
                var items = this._itemize(elems);
                // add items to collection
                if (items.length) {
                    this.items = this.items.concat(items);
                }
                return items;
            };

            /**
             * Layout newly-appended item elements
             * @param {Array or NodeList or Element} elems
             */
            proto.appended = function (elems) {
                var items = this.addItems(elems);
                if (!items.length) {
                    return;
                }
                // layout and reveal just the new items
                this.layoutItems(items, true);
                this.reveal(items);
            };

            /**
             * Layout prepended elements
             * @param {Array or NodeList or Element} elems
             */
            proto.prepended = function (elems) {
                var items = this._itemize(elems);
                if (!items.length) {
                    return;
                }
                // add items to beginning of collection
                var previousItems = this.items.slice(0);
                this.items = items.concat(previousItems);
                // start new layout
                this._resetLayout();
                this._manageStamps();
                // layout new stuff without transition
                this.layoutItems(items, true);
                this.reveal(items);
                // layout previous items
                this.layoutItems(previousItems);
            };

            /**
             * reveal a collection of items
             * @param {Array of Outlayer.Items} items
             */
            proto.reveal = function (items) {
                this._emitCompleteOnItems("reveal", items);
                if (!items || !items.length) {
                    return;
                }
                var stagger = this.updateStagger();
                items.forEach(function (item, i) {
                    item.stagger(i * stagger);
                    item.reveal();
                });
            };

            /**
             * hide a collection of items
             * @param {Array of Outlayer.Items} items
             */
            proto.hide = function (items) {
                this._emitCompleteOnItems("hide", items);
                if (!items || !items.length) {
                    return;
                }
                var stagger = this.updateStagger();
                items.forEach(function (item, i) {
                    item.stagger(i * stagger);
                    item.hide();
                });
            };

            /**
             * reveal item elements
             * @param {Array}, {Element}, {NodeList} items
             */
            proto.revealItemElements = function (elems) {
                var items = this.getItems(elems);
                this.reveal(items);
            };

            /**
             * hide item elements
             * @param {Array}, {Element}, {NodeList} items
             */
            proto.hideItemElements = function (elems) {
                var items = this.getItems(elems);
                this.hide(items);
            };

            /**
             * get Outlayer.Item, given an Element
             * @param {Element} elem
             * @param {Function} callback
             * @returns {Outlayer.Item} item
             */
            proto.getItem = function (elem) {
                // loop through items to get the one that matches
                for (var i = 0; i < this.items.length; i++) {
                    var item = this.items[i];
                    if (item.element == elem) {
                        // return item
                        return item;
                    }
                }
            };

            /**
             * get collection of Outlayer.Items, given Elements
             * @param {Array} elems
             * @returns {Array} items - Outlayer.Items
             */
            proto.getItems = function (elems) {
                elems = utils.makeArray(elems);
                var items = [];
                elems.forEach(function (elem) {
                    var item = this.getItem(elem);
                    if (item) {
                        items.push(item);
                    }
                }, this);

                return items;
            };

            /**
             * remove element(s) from instance and DOM
             * @param {Array or NodeList or Element} elems
             */
            proto.remove = function (elems) {
                var removeItems = this.getItems(elems);

                this._emitCompleteOnItems("remove", removeItems);

                // bail if no items to remove
                if (!removeItems || !removeItems.length) {
                    return;
                }

                removeItems.forEach(function (item) {
                    item.remove();
                    // remove item from collection
                    utils.removeFrom(this.items, item);
                }, this);
            };

            // ----- destroy ----- //

            // remove and disable Outlayer instance
            proto.destroy = function () {
                // clean up dynamic styles
                var style = this.element.style;
                style.height = "";
                style.position = "";
                style.width = "";
                // destroy items
                this.items.forEach(function (item) {
                    item.destroy();
                });

                this.unbindResize();

                var id = this.element.outlayerGUID;
                delete instances[id]; // remove reference to instance by id
                delete this.element.outlayerGUID;
                // remove data for jQuery
                if (jQuery) {
                    jQuery.removeData(this.element, this.constructor.namespace);
                }
            };

            // -------------------------- data -------------------------- //

            /**
             * get Outlayer instance from element
             * @param {Element} elem
             * @returns {Outlayer}
             */
            Outlayer.data = function (elem) {
                elem = utils.getQueryElement(elem);
                var id = elem && elem.outlayerGUID;
                return id && instances[id];
            };

            // -------------------------- create Outlayer class -------------------------- //

            /**
             * create a layout class
             * @param {String} namespace
             */
            Outlayer.create = function (namespace, options) {
                // sub-class Outlayer
                var Layout = subclass(Outlayer);
                // apply new options and compatOptions
                Layout.defaults = utils.extend({}, Outlayer.defaults);
                utils.extend(Layout.defaults, options);
                Layout.compatOptions = utils.extend({}, Outlayer.compatOptions);

                Layout.namespace = namespace;

                Layout.data = Outlayer.data;

                // sub-class Item
                Layout.Item = subclass(Item);

                // -------------------------- declarative -------------------------- //

                utils.htmlInit(Layout, namespace);

                // -------------------------- jQuery bridge -------------------------- //

                // make into jQuery plugin
                if (jQuery && jQuery.bridget) {
                    jQuery.bridget(namespace, Layout);
                }

                return Layout;
            };

            function subclass(Parent) {
                function SubClass() {
                    Parent.apply(this, arguments);
                }

                SubClass.prototype = Object.create(Parent.prototype);
                SubClass.prototype.constructor = SubClass;

                return SubClass;
            }

            // ----- helpers ----- //

            // how many milliseconds are in each unit
            var msUnits = {
                ms: 1,
                s: 1000,
            };

            // munge time-like parameter into millisecond number
            // '0.4s' -> 40
            function getMilliseconds(time) {
                if (typeof time == "number") {
                    return time;
                }
                var matches = time.match(/(^\d*\.?\d*)(\w*)/);
                var num = matches && matches[1];
                var unit = matches && matches[2];
                if (!num.length) {
                    return 0;
                }
                num = parseFloat(num);
                var mult = msUnits[unit] || 1;
                return num * mult;
            }

            // ----- fin ----- //

            // back in global
            Outlayer.Item = Item;

            return Outlayer;
        });
    })(outlayer);

    /*!
     * Masonry v4.2.2
     * Cascading grid layout library
     * https://masonry.desandro.com
     * MIT License
     * by David DeSandro
     */

    (function (module) {
        (function (window, factory) {
            // universal module definition
            /* jshint strict: false */ /*globals define, module, require */
            if (module.exports) {
                // CommonJS
                module.exports = factory(outlayer.exports, getSize.exports);
            } else {
                // browser global
                window.Masonry = factory(window.Outlayer, window.getSize);
            }
        })(window, function factory(Outlayer, getSize) {
            // -------------------------- masonryDefinition -------------------------- //

            // create an Outlayer layout class
            var Masonry = Outlayer.create("masonry");
            // isFitWidth -> fitWidth
            Masonry.compatOptions.fitWidth = "isFitWidth";

            var proto = Masonry.prototype;

            proto._resetLayout = function () {
                this.getSize();
                this._getMeasurement("columnWidth", "outerWidth");
                this._getMeasurement("gutter", "outerWidth");
                this.measureColumns();

                // reset column Y
                this.colYs = [];
                for (var i = 0; i < this.cols; i++) {
                    this.colYs.push(0);
                }

                this.maxY = 0;
                this.horizontalColIndex = 0;
            };

            proto.measureColumns = function () {
                this.getContainerWidth();
                // if columnWidth is 0, default to outerWidth of first item
                if (!this.columnWidth) {
                    var firstItem = this.items[0];
                    var firstItemElem = firstItem && firstItem.element;
                    // columnWidth fall back to item of first element
                    this.columnWidth =
                        (firstItemElem && getSize(firstItemElem).outerWidth) ||
                        // if first elem has no width, default to size of container
                        this.containerWidth;
                }

                var columnWidth = (this.columnWidth += this.gutter);

                // calculate columns
                var containerWidth = this.containerWidth + this.gutter;
                var cols = containerWidth / columnWidth;
                // fix rounding errors, typically with gutters
                var excess = columnWidth - (containerWidth % columnWidth);
                // if overshoot is less than a pixel, round up, otherwise floor it
                var mathMethod = excess && excess < 1 ? "round" : "floor";
                cols = Math[mathMethod](cols);
                this.cols = Math.max(cols, 1);
            };

            proto.getContainerWidth = function () {
                // container is parent if fit width
                var isFitWidth = this._getOption("fitWidth");
                var container = isFitWidth ? this.element.parentNode : this.element;
                // check that this.size and size are there
                // IE8 triggers resize on body size change, so they might not be
                var size = getSize(container);
                this.containerWidth = size && size.innerWidth;
            };

            proto._getItemLayoutPosition = function (item) {
                item.getSize();
                // how many columns does this brick span
                var remainder = item.size.outerWidth % this.columnWidth;
                var mathMethod = remainder && remainder < 1 ? "round" : "ceil";
                // round if off by 1 pixel, otherwise use ceil
                var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
                colSpan = Math.min(colSpan, this.cols);
                // use horizontal or top column position
                var colPosMethod = this.options.horizontalOrder ? "_getHorizontalColPosition" : "_getTopColPosition";
                var colPosition = this[colPosMethod](colSpan, item);
                // position the brick
                var position = {
                    x: this.columnWidth * colPosition.col,
                    y: colPosition.y,
                };
                // apply setHeight to necessary columns
                var setHeight = colPosition.y + item.size.outerHeight;
                var setMax = colSpan + colPosition.col;
                for (var i = colPosition.col; i < setMax; i++) {
                    this.colYs[i] = setHeight;
                }

                return position;
            };

            proto._getTopColPosition = function (colSpan) {
                var colGroup = this._getTopColGroup(colSpan);
                // get the minimum Y value from the columns
                var minimumY = Math.min.apply(Math, colGroup);

                return {
                    col: colGroup.indexOf(minimumY),
                    y: minimumY,
                };
            };

            /**
             * @param {Number} colSpan - number of columns the element spans
             * @returns {Array} colGroup
             */
            proto._getTopColGroup = function (colSpan) {
                if (colSpan < 2) {
                    // if brick spans only one column, use all the column Ys
                    return this.colYs;
                }

                var colGroup = [];
                // how many different places could this brick fit horizontally
                var groupCount = this.cols + 1 - colSpan;
                // for each group potential horizontal position
                for (var i = 0; i < groupCount; i++) {
                    colGroup[i] = this._getColGroupY(i, colSpan);
                }
                return colGroup;
            };

            proto._getColGroupY = function (col, colSpan) {
                if (colSpan < 2) {
                    return this.colYs[col];
                }
                // make an array of colY values for that one group
                var groupColYs = this.colYs.slice(col, col + colSpan);
                // and get the max value of the array
                return Math.max.apply(Math, groupColYs);
            };

            // get column position based on horizontal index. #873
            proto._getHorizontalColPosition = function (colSpan, item) {
                var col = this.horizontalColIndex % this.cols;
                var isOver = colSpan > 1 && col + colSpan > this.cols;
                // shift to next row if item can't fit on current row
                col = isOver ? 0 : col;
                // don't let zero-size items take up space
                var hasSize = item.size.outerWidth && item.size.outerHeight;
                this.horizontalColIndex = hasSize ? col + colSpan : this.horizontalColIndex;

                return {
                    col: col,
                    y: this._getColGroupY(col, colSpan),
                };
            };

            proto._manageStamp = function (stamp) {
                var stampSize = getSize(stamp);
                var offset = this._getElementOffset(stamp);
                // get the columns that this stamp affects
                var isOriginLeft = this._getOption("originLeft");
                var firstX = isOriginLeft ? offset.left : offset.right;
                var lastX = firstX + stampSize.outerWidth;
                var firstCol = Math.floor(firstX / this.columnWidth);
                firstCol = Math.max(0, firstCol);
                var lastCol = Math.floor(lastX / this.columnWidth);
                // lastCol should not go over if multiple of columnWidth #425
                lastCol -= lastX % this.columnWidth ? 0 : 1;
                lastCol = Math.min(this.cols - 1, lastCol);
                // set colYs to bottom of the stamp

                var isOriginTop = this._getOption("originTop");
                var stampMaxY = (isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;
                for (var i = firstCol; i <= lastCol; i++) {
                    this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
                }
            };

            proto._getContainerSize = function () {
                this.maxY = Math.max.apply(Math, this.colYs);
                var size = {
                    height: this.maxY,
                };

                if (this._getOption("fitWidth")) {
                    size.width = this._getContainerFitWidth();
                }

                return size;
            };

            proto._getContainerFitWidth = function () {
                var unusedCols = 0;
                // count unused columns
                var i = this.cols;
                while (--i) {
                    if (this.colYs[i] !== 0) {
                        break;
                    }
                    unusedCols++;
                }
                // fit container to columns that have been used
                return (this.cols - unusedCols) * this.columnWidth - this.gutter;
            };

            proto.needsResizeLayout = function () {
                var previousWidth = this.containerWidth;
                this.getContainerWidth();
                return previousWidth != this.containerWidth;
            };

            return Masonry;
        });
    })(masonry);

    var Masonry = masonry.exports;

    (function () {
        /**
         * Initialize Contact Sheet instances
         */
        $(document).ready(function () {
            if ($(".layout-contact-sheet").length) {
                console.log("contact sheet initialized");

                $(window).on("load", function () {
                    $(".layout-contact-sheet").each(function () {
                        var container = $(this).find(".contact-sheet")[0];

                        new Masonry(container, {
                            itemSelector: ".contact-sheet-image",
                            transitionDuration: 0,
                        });
                    });
                });
            }
        });
    })();

    (function () {
        $(document).ready(function () {
            Swiper.use([EffectFade, Manipulation, Navigation]);

            $("button[data-action='lightbox-single']").on("click", function (_e) {
                var html = $(_e.target).parents("button[data-action='lightbox-single']").next().html();
                $(".lightbox-image").html(html);
                $(".lightbox").addClass("is-visible").removeClass("no-pointer");
            });

            /**
             * Initialize contextual slider
             */
            $('.layout-contact-sheet [data-action="lightbox-slider"]').on("click", function (_e) {
                var container = $(_e.target).closest(".contact-sheet")[0];
                var index = $(_e.target).closest(".contact-sheet-image").attr("data-index");
                var slides = $(container).find(".contact-sheet-image");
                var buttonPrev = $(".lightbox-button-prev")[0];
                var buttonNext = $(".lightbox-button-next")[0];
                var swiper = new Swiper(".lightbox-content", {
                    // autoHeight: true,
                    // centeredSlides: true,
                    // cssMode: true,
                    effect: "fade",
                    initialSlide: parseInt(index),
                    // spaceBetween: window.innerWidth / 12,
                    // loop: false,
                    // slidesPerView: 1,
                    // loopedSlides: 2,
                    modules: [EffectFade, Manipulation, Navigation],
                    navigation: {
                        nextEl: buttonNext,
                        prevEl: buttonPrev,
                    },
                });

                slides.each(function () {
                    var index = $(this).attr("data-index");
                    var html = $(this).find(".image-element").html();
                    var caption = $(this).find(".caption");

                    swiper.appendSlide(`<div class="swiper-slide" data-index="${index}">${html}</div>`);

                    if (caption.length) {
                        $(".lightbox-description").append(
                            `<div class="caption text-white" data-index="${index}">${caption.html()}</div>`
                        );
                    }
                });

                swiper.update();
                console.log(swiper);

                $(".lightbox-controls").removeClass("hidden");
                $(".lightbox").addClass("is-visible").removeClass("no-pointer");
            });

            $("button[data-action='close-lightbox']").on("click", function () {
                $(".lightbox-controls").addClass("hidden");
                $(".lightbox-description").html(null);
                $(".lightbox-image").html(null);
                $(".lightbox").removeClass("is-visible").addClass("no-pointer");
            });
        });
    })();

    $(window).on("load", function () {
        console.log("site-has-loaded");
        $("html").addClass("site-has-loaded");
    });
})();
//# sourceMappingURL=script.site.js.map
