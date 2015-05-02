var getTplName = function(tpl) {
  return tpl.viewName.slice(-(tpl.viewName.length - "Template.".length));
}

var animateIn = function(attrs, element, tpl) {
  if (!attrs || !element) return;
  var classIn = _.isFunction(attrs.in) ? attrs.in.apply(this, [element, tpl]) : attrs.in;
  // Hide the element before inserting to avoid a flickering when applying the "in" class
  element._opacity = element._opacity || element.css("opacity") || 0;
  element.css({ opacity: 0 });
  element.removeClass(classIn);
  var delayIn = attrs.delayIn || 0;
  Tracker.afterFlush(function() {
    setTimeout(function() {
      element.css({ opacity: element._opacity }).addClass(classIn);
    }, delayIn);
  });
}

var animateOut = function(attrs, element, tpl) {
  if (!attrs || !element) return;
  var classIn = _.isFunction(attrs.in) ? attrs.in.apply(this, [element, tpl]) : attrs.in;
  var classOut = _.isFunction(attrs.out) ? attrs.out.apply(this, [element, tpl]) : attrs.out;
  var delayOut = attrs.delayOut || 0;
  setTimeout(function() {
    element.removeClass(classIn).addClass(classOut);
  }, delayOut);
  element.onAnimationEnd(function(animationName) {
    element.remove();
  });
}

var animateInitialElements = function(tplName, animations) {
  if (!tplName || !animations) return;
  _.each(animations, function(attrs, selector) {
    if (!attrs.animateInitial) return;
    Template[tplName].onRendered(function() {
      var animateInitialDelay = attrs.animateInitialDelay || 0;
      $(selector, attrs.container).each(function(i) {
        var element = $(this);
        var animateInitialStep = attrs.animateInitialStep * i || 0;
        var delay = animateInitialDelay + animateInitialStep;
        element._opacity = element.css("opacity");
        element.css({ opacity: 0 });
        setTimeout(function() {
          animateIn(attrs, element);
        }, delay);
      });
    });
  });
}

var getUiHooks = function(animations) {
  var hooks = {};
  _.each(animations, function(attrs, selector) {
    hooks[selector] = {
      container: attrs.container,
      insert: function(node, next, tpl) {
        var element = $(node);
        element.insertBefore(next);
        animateIn(attrs, element, tpl);
      },
      remove: function(node, tpl) {
        var element = $(node);
        if (!attrs.out) return element.remove();
        animateOut(attrs, element, tpl);
      }
    }
  });
  return hooks;
}

Template.prototype.animations = function(animations) {
  var tplName = getTplName(this);
  var hooks = getUiHooks(animations);
  Template[tplName].uihooks(hooks);
  animateInitialElements(tplName, animations);
};
