/*jslint devel: true, node: true */
/*global */
/*! Copyright (C) 2013 by Andreas F. Bobak, Switzerland. All Rights Reserved. !*/
"use strict";

var buster  = require("buster");
var assert  = buster.assertions.assert;
var refute  = buster.assertions.refute;
var sinon   = require("../node_modules/buster/node_modules/sinon");
var winston = require("winston");

var settings = require("../lib/settings");

// Ignore logging
winston.remove(winston.transports.Console);

// ==== Test Case

buster.testCase("settings-test - init", {
  setUp: function () {
    this.registry = {
      getMeta: this.stub()
    };
  },

  "should get registry meta": function () {
    this.registry.getMeta.returns({});

    settings.init(this.registry);

    assert.calledOnce(this.registry.getMeta);
  },

  "should set defaults and settings to defaults for empty meta": function () {
    this.registry.getMeta.returns({settings: {}});

    var s = settings.init(this.registry);

    var defaults = settings.defaults;
    assert.equals(s.defaults, defaults);
    assert.equals(s.data["forwarder.registry"], defaults["forwarder.registry"]);
    assert.equals(s.data["forwarder.proxy"], defaults["forwarder.proxy"]);
    assert.equals(s.data["forwarder.autoForward"], defaults["forwarder.autoForward"]);
    assert.equals(s.data["forwarder.userAgent"], defaults["forwarder.userAgent"]);
    assert.equals(s.data.hostname, defaults.hostname);
    assert.equals(s.data.port, defaults.port);
  },

  "should set autoForward to default if null": function () {
    this.registry.getMeta.returns({settings: {
      "forwarder.autoForward" : null
    }});

    var s = settings.init(this.registry);

    var defaults = settings.defaults;
    assert.equals(s.data["forwarder.autoForward"], defaults["forwarder.autoForward"]);
  }
});

// ==== Test Case

buster.testCase("settings-test - get/set", {
  setUp: function () {
    this.registry = {
      getMeta: this.stub().returns({
        settings : { "foo" : "bar" }
      })
    };
    this.settings = settings.init(this.registry);
  },

  "should get undefined value": function () {
    refute.defined(this.settings.get("test"));
  },

  "should get bar value": function () {
    assert.equals("bar", this.settings.get("foo"));
  },

  "should get all settings": function () {
    assert.equals({"foo" : "bar"}, this.settings.get());
  },

  "should set foo value to gna": function () {
    this.settings.set("foo", "gna");

    assert.equals("gna", this.settings.get("foo"));
  },

  "should set foo value to number": function () {
    this.settings.set("foo", 1234);

    assert.equals(1234, this.settings.get("foo"));
  }

});

// ==== Test Case

buster.testCase("settings-test - render", {
  setUp: function () {
    this.settings = {
      get      : this.stub(),
      defaults : {
        hostname : "some.host"
      }
    };
    this.renderFn = settings.render(this.settings);
  },

  "should render 'settings'": function () {
    var spy = this.spy();

    this.renderFn({}, {render: spy});

    assert.calledOnce(spy);
  },

  "should use settings data": function () {
    this.settings.get.returns("");
    this.settings.get.withArgs("hostname").returns("localhost");
    var spy = this.spy();

    this.renderFn({}, {render: spy});

    assert.calledWith(spy, "settings", sinon.match({
      settings : {
        hostname : "localhost"
      }
    }));
  },

  "should nullify settings with default values": function () {
    this.settings.get.returns("");
    this.settings.get.withArgs("hostname").returns("some.host");
    var spy = this.spy();

    this.renderFn({}, {render: spy});

    assert.calledWith(spy, "settings", sinon.match({
      settings : {
        hostname : null
      }
    }));
  }
});

// ==== Test Case

buster.testCase("settings-test - save", {
  setUp: function () {
    this.registry = {
      getMeta: this.stub().returns({}),
      writeMeta: this.spy()
    };
    this.settings = {
      get      : this.stub(),
      set      : this.stub(),
      defaults : {
        hostname : "some.host"
      }
    };
    this.saveFn = settings.save(this.registry, this.settings);
  },

  "should render 'settings'": function () {
    var spy = this.spy();

    this.saveFn({
      body : {
      }
    }, {render: spy});

    assert.calledOnce(spy);
  },

  "should set new settings": function () {
    this.saveFn({
      body : {
        hostname     : "localhost",
        port         : "3333",
        registry    : "http://some.registry/",
        proxy       : "http://a.proxy:8080",
        autoForward : null,
        userAgent   : "bla"
      }
    }, {render: this.spy()});

    assert.called(this.settings.set);
    assert.calledWith(this.settings.set, "hostname", "localhost");
    assert.calledWith(this.settings.set, "port", 3333);
    assert.calledWith(this.settings.set, "forwarder.registry",
      "http://some.registry/");
    assert.calledWith(this.settings.set, "forwarder.proxy",
      "http://a.proxy:8080");
    assert.calledWith(this.settings.set, "forwarder.autoForward", false);
    assert.calledWith(this.settings.set, "forwarder.userAgent", "bla");
  },

  "should write new meta": function () {
    this.saveFn({
      body : {
        hostname : "localhost"
      }
    }, {render: this.spy()});

    assert.calledOnce(this.registry.writeMeta);
  }
});