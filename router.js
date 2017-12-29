(function(window) {
  window.Router = Router;

  function Router(options) {
    this.modal = options.modal || getRouterModal();
    this._router = options.router || {};
    this._when = {};
    this._otherwise = "";
  }

  Router.prototype = {
    start: function(options) {
      var self = this;
      initRouter(this._router);
      if ("hash" === this.modal) {
        window.addEventListener("hashchange", self.refresh.bind(self));
      } else {
        window.addEventListener("popstate", self.refresh.bind(self));
      }
      self.refresh();
    },
    refresh: function() {
      if ("hash" === this.modal) {
        this.refreshHash();
      } else {
        this.refreshHistory();
      }
    },
    refreshHash: function() {
      var hash = window.location.hash.slice(1);
      var toHash = this.getRedirect(hash);
      if (!toHash && this._otherwise) {
        window.location.hash = "#" + this._otherwise;
        return;
      }
      this.render();
    },
    refreshHistory: function() {
      var url = window.location.pathname;
      var toUrl = this.getRedirect(url);
      if (!toUrl && this._otherwise) {
        window.history.pushState(null, null, this._otherwise);
      }
      this.render();
    },
    state: function(state, options) {
      options.name = state;
      options.parent = state.split(".");
      this._router[state] = options;
      return this;
    },
    otherwise: function(url) {
      this._otherwise = url;
    },
    when: function(url, toUrl) {
      this._when[url] = toUrl;
      return this;
    },
    go: function(state) {
      if ("hash" === this.modal) {
        window.location.hash = "#" + this._router[state].redirectUrl;
      } else {
        window.history.pushState(null, null, this._router[state].redirectUrl);
        this.refresh();
      }
    },
    getRedirect: function(url) {
      var currentUrl = url;
      each(this._when, function(val) {
        if (currentUrl === val) {
          currentUrl = val;
          return false;
        }
      });
      var flag = false;
      each(this._router, function(val) {
        if (currentUrl === val.redirectUrl) {
          flag = true;
          return false;
        }
      });
      return flag;
    },
    render: function() {
      var el = { value: document };
      setTemplate(getRouterState(this._router, this.modal), el);
    }
  };

  /**
   * 获取默认的路由机制
   *
   * @returns string 路由的机制
   */
  function getRouterModal() {
    if ("function" === typeof window.history.pushState) {
      return "history";
    }
    return "hash";
  }

  /**
   * 初始化路由信息
   *
   * @param {array} router 路由状态数据
   */
  function initRouter(router) {
    var redirectUrl = "";
    each(router, function(val) {
      redirectUrl = "";
      each(val.parent, function(state, key) {
        redirectUrl += router[val.parent.slice(0, key + 1).join(".")].url;
      });
      val.redirectUrl = redirectUrl;
    });
  }

  /**
   * 获取当前地址下的所有关联的路由信息
   *
   * @param {array} router 路由状态数据
   * @param {string} modal 路由的机制
   * @returns array 符合条件的路由数据
   */
  function getRouterState(router, modal) {
    var url =
      "hash" === modal
        ? window.location.hash.slice(1)
        : window.location.pathname;
    var array = [];
    each(router, function(val) {
      if (url === val.redirectUrl) {
        each(val.parent, function(state, key) {
          array.push(router[val.parent.slice(0, key + 1).join(".")]);
        });
        return false;
      }
    });
    return array;
  }

  /**
   * 加载模板
   *
   * @param {array} routers 路由状态数据
   * @param {object} el DOM对象
   */
  function setTemplate(routers, el) {
    var router = routers.shift();
    if (router.templateUrl) {
      $.ajax({
        url: router.templateUrl,
        type: "GET",
        success: function(data) {
          if (appendHTML(data, el)) {
            routers.length > 0 && setTemplate(routers, el);
          }
        }
      });
    } else if (router.template) {
      if (appendHTML(router.template, v)) {
        routers.length > 0 && setTemplate(routers, v);
      }
    }
  }

  /**
   * 模板加载到 html 中
   *
   * @param {string} template 模板内容
   * @param {object} el DOM对象
   * @returns boolean 是否继续
   */
  function appendHTML(template, el) {
    var views = $(el.value).find("router-view");
    if (views.length > 0) {
      var view = $(views[0]);
      view.empty();
      view.append(template);
      el.value = view;
      return true;
    }
    return false;
  }

  /**
   * 循环
   *
   * @param {object/array} obj 对象或者数组
   * @param {function} fn 回调函数
   * @param {scope} context 作用域
   */
  function each(obj, fn, context) {
    var i = 0,
      length,
      value;
    if ("[object Array]" === Object.prototype.toString.call(obj)) {
      for (length = obj.length; i < length; i++) {
        value = fn.call(context, obj[i], i, obj);
        if (value === false) {
          break;
        }
      }
    } else {
      var keys = Object.keys(obj);
      for (length = keys.length; i < length; i++) {
        value = fn.call(context, obj[keys[i]], keys[i], obj);
        if (value === false) {
          break;
        }
      }
    }
  }
})(window);
