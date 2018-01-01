(function (window) {
    window.Router = Router;

    function Router(modal) {
        this._modal = modal || getRouterModal();
        this._router = {};
        this._when = {};
        this._otherwise = "";
        this.init();
    }

    Router.prototype = {
        "init": function () {
            var self = this;
            var listen = "";
            if ("hash" === self._modal) {
                listen = "hashchange";
                self.go = hashEvent.go.bind(self);
                self.refresh = hashEvent.refresh.bind(self);
            } else {
                listen = "popstate";
                self.go = historyEvent.go.bind(self);
                self.refresh = historyEvent.refresh.bind(self);
            }
            window.addEventListener(listen, self.refresh.bind(self));
        },
        "state": function (state, options) {
            options.name = state;
            options.parent = state.split(".");
            this._router[state] = options;
            return this;
        },
        "otherwise": function (url) {
            this._otherwise = url;
        },
        "when": function (url, toUrl) {
            this._when[url] = toUrl;
            return this;
        },
        "start": function () {
            initRouter(this._router);
            this.refresh();
        },
        "getRedirect": function (url) {
            var current = {
                "url": url,
                "redirect": false
            };
            each(this._when, function (val, key) {
                if (current.url === key) {
                    current.url = val;
                    current.redirect = true;
                    return false;
                }
            });
            var flag = false;
            each(this._router, function (val) {
                if (current.url === val.redirectUrl) {
                    flag = true;
                    return false;
                }
            });
            if (!flag) {
                current.url = this._otherwise;
                current.redirect = true;
            }
            return current;
        },
        "render": function () {
            var el = {
                "value": document
            };
            setTemplate(getRouterState(this._router, this._modal), el);
        }
    };

    var hashEvent = {
        "go": function (state) {
            window.location.hash = "#" + this._router[state].redirectUrl;
        },
        "refresh": function () {
            var url = window.location.hash.slice(1);
            var current = this.getRedirect(url);
            if (current.redirect) {
                window.location.hash = "#" + current.url;
                return;
            }
            this.render();
        }
    };

    var historyEvent = {
        "go": function (state) {
            window.history.pushState(
                null,
                null,
                this._router[state].redirectUrl
            );
            this.refresh();
        },
        "refresh": function () {
            var url = window.location.pathname;
            var current = this.getRedirect(url);
            if (current.redirect) {
                window.history.pushState(null, null, current.url);
            }
            this.render();
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
        each(router, function (val) {
            redirectUrl = "";
            each(val.parent, function (state, key) {
                redirectUrl +=
                    router[val.parent.slice(0, key + 1).join(".")].url;
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
            "hash" === modal ?
                window.location.hash.slice(1) :
                window.location.pathname;
        var array = [];
        each(router, function (val) {
            if (url === val.redirectUrl) {
                each(val.parent, function (state, key) {
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
                "url": router.templateUrl,
                "type": "GET",
                "success": function (data) {
                    if (appendHTML(data, el)) {
                        routers.length > 0 && setTemplate(routers, el);
                    }
                }
            });
        } else if (router.template) {
            if (appendHTML(router.template, el)) {
                routers.length > 0 && setTemplate(routers, el);
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
                !fn.call(context, obj[i], i, obj);
                if (false === value) {
                    break;
                }
            }
        } else {
            var keys = Object.keys(obj);
            for (length = keys.length; i < length; i++) {
                value = fn.call(context, obj[keys[i]], keys[i], obj);
                if (false === value) {
                    break;
                }
            }
        }
    }
})(window);
