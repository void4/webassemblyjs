(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webassemblyjs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkEndianness = checkEndianness;
var buff = new ArrayBuffer(16);

function checkEndianness() {
  var viewInt16 = new Int16Array(buff);
  var viewInt8 = new Int8Array(buff);
  viewInt16[0] = 0x6373;
  return viewInt8[0] === 0x73 && viewInt8[1] === 0x63;
}
},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCompiledModule = createCompiledModule;
exports.Module = void 0;

var _wastIdentifierToIndex = require("@webassemblyjs/ast/lib/transform/wast-identifier-to-index");

var _denormalizeTypeReferences = require("@webassemblyjs/ast/lib/transform/denormalize-type-references");

var _validation = _interopRequireDefault(require("@webassemblyjs/validation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var t = require("@webassemblyjs/ast");

var _require = require("../../errors"),
    CompileError = _require.CompileError;

var Module = function Module(ast, exports, imports, start) {
  _classCallCheck(this, Module);

  this._ast = ast;
  this._start = start;
  this.exports = exports;
  this.imports = imports;
};

exports.Module = Module;

function createCompiledModule(ast) {
  var exports = [];
  var imports = [];
  var start; // Do compile-time ast manipulation in order to remove WAST
  // semantics during execution

  (0, _denormalizeTypeReferences.transform)(ast);
  (0, _wastIdentifierToIndex.transform)(ast);
  console.log(ast);
  (0, _validation.default)(ast);
  t.traverse(ast, {
    ModuleExport: function (_ModuleExport) {
      function ModuleExport(_x) {
        return _ModuleExport.apply(this, arguments);
      }

      ModuleExport.toString = function () {
        return _ModuleExport.toString();
      };

      return ModuleExport;
    }(function (_ref) {
      var node = _ref.node;

      if (node.descr.exportType === "Func") {
        exports.push({
          name: node.name,
          kind: "function"
        });
      }
    }),
    Start: function (_Start) {
      function Start(_x2) {
        return _Start.apply(this, arguments);
      }

      Start.toString = function () {
        return _Start.toString();
      };

      return Start;
    }(function (_ref2) {
      var node = _ref2.node;

      if (typeof start !== "undefined") {
        throw new CompileError("Multiple start functions is not allowed");
      }

      start = node.index;
    })
  });
  /**
   * Adds missing end instructions
   */

  t.traverse(ast, {
    Func: function (_Func) {
      function Func(_x3) {
        return _Func.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func.toString();
      };

      return Func;
    }(function (_ref3) {
      var node = _ref3.node;
      node.body.push(t.instruction("end"));
    }),
    Global: function (_Global) {
      function Global(_x4) {
        return _Global.apply(this, arguments);
      }

      Global.toString = function () {
        return _Global.toString();
      };

      return Global;
    }(function (_ref4) {
      var node = _ref4.node;
      node.init.push(t.instruction("end"));
    }),
    IfInstruction: function (_IfInstruction) {
      function IfInstruction(_x5) {
        return _IfInstruction.apply(this, arguments);
      }

      IfInstruction.toString = function () {
        return _IfInstruction.toString();
      };

      return IfInstruction;
    }(function (_ref5) {
      var node = _ref5.node;
      node.test.push(t.instruction("end"));
      node.consequent.push(t.instruction("end"));
      node.alternate.push(t.instruction("end"));
    }),
    BlockInstruction: function (_BlockInstruction) {
      function BlockInstruction(_x6) {
        return _BlockInstruction.apply(this, arguments);
      }

      BlockInstruction.toString = function () {
        return _BlockInstruction.toString();
      };

      return BlockInstruction;
    }(function (_ref6) {
      var node = _ref6.node;
      node.instr.push(t.instruction("end"));
    }),
    LoopInstruction: function (_LoopInstruction) {
      function LoopInstruction(_x7) {
        return _LoopInstruction.apply(this, arguments);
      }

      LoopInstruction.toString = function () {
        return _LoopInstruction.toString();
      };

      return LoopInstruction;
    }(function (_ref7) {
      var node = _ref7.node;
      node.instr.push(t.instruction("end"));
    })
  });
  return new Module(ast, exports, imports, start);
}
},{"../../errors":3,"@webassemblyjs/ast":29,"@webassemblyjs/ast/lib/transform/denormalize-type-references":34,"@webassemblyjs/ast/lib/transform/wast-identifier-to-index":35,"@webassemblyjs/validation":54}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LinkError = exports.CompileError = exports.RuntimeError = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null) return null; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var RuntimeError =
/*#__PURE__*/
function (_Error) {
  _inherits(RuntimeError, _Error);

  function RuntimeError() {
    _classCallCheck(this, RuntimeError);

    return _possibleConstructorReturn(this, _getPrototypeOf(RuntimeError).apply(this, arguments));
  }

  return RuntimeError;
}(_wrapNativeSuper(Error));

exports.RuntimeError = RuntimeError;

var CompileError =
/*#__PURE__*/
function (_Error2) {
  _inherits(CompileError, _Error2);

  function CompileError() {
    _classCallCheck(this, CompileError);

    return _possibleConstructorReturn(this, _getPrototypeOf(CompileError).apply(this, arguments));
  }

  return CompileError;
}(_wrapNativeSuper(Error));

exports.CompileError = CompileError;

var LinkError =
/*#__PURE__*/
function (_Error3) {
  _inherits(LinkError, _Error3);

  function LinkError() {
    _classCallCheck(this, LinkError);

    return _possibleConstructorReturn(this, _getPrototypeOf(LinkError).apply(this, arguments));
  }

  return LinkError;
}(_wrapNativeSuper(Error));

exports.LinkError = LinkError;
},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHostfunc = createHostfunc;
exports.executeStackFrameAndGetResult = executeStackFrameAndGetResult;

var _errors = require("../errors");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var t = require("@webassemblyjs/ast");

var _require = require("./runtime/castIntoStackLocalOfType"),
    castIntoStackLocalOfType = _require.castIntoStackLocalOfType;

var _require2 = require("./kernel/exec"),
    executeStackFrame = _require2.executeStackFrame;

var _require3 = require("./kernel/stackframe"),
    createStackFrame = _require3.createStackFrame;

var label = require("./runtime/values/label");

var _require4 = require("./kernel/signals"),
    ExecutionHasBeenTrapped = _require4.ExecutionHasBeenTrapped;

function createHostfunc(moduleinst, exportinst, allocator, _ref) {
  var checkForI64InSignature = _ref.checkForI64InSignature,
      returnStackLocal = _ref.returnStackLocal;
  return function hostfunc() {
    var _stackFrame$locals;

    var exportinstAddr = exportinst.value.addr;
    /**
     * Find callable in instantiated function in the module funcaddrs
     */

    var hasModuleInstantiatedFunc = moduleinst.funcaddrs.indexOf(exportinstAddr);

    if (hasModuleInstantiatedFunc === -1) {
      throw new _errors.RuntimeError("Function at addr ".concat(exportinstAddr.index, " has not been initialized in the module.") + "Probably an internal failure");
    }

    var funcinst = allocator.get(exportinstAddr);

    if (funcinst === null) {
      throw new _errors.RuntimeError("Function was not found at addr ".concat(exportinstAddr.index));
    }

    var funcinstArgs = funcinst.type[0];

    if (checkForI64InSignature === true) {
      var funcinstResults = funcinst.type[1];
      /**
       * If the signature contains an i64 (as argument or result), the host
       * function immediately throws a TypeError when called.
       */

      var funcinstArgsHasi64 = funcinstArgs.indexOf("i64") !== -1;
      var funcinstResultsHasi64 = funcinstResults.indexOf("i64") !== -1;

      if (funcinstArgsHasi64 === true || funcinstResultsHasi64 === true) {
        throw new TypeError("Can not call this function from JavaScript: " + "i64 in signature.");
      }
    }
    /**
     * Check number of argument passed vs the function arity
     */


    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (args.length !== funcinstArgs.length) {
      throw new _errors.RuntimeError("Function ".concat(exportinstAddr.index, " called with ").concat(args.length, " arguments but ") + funcinst.type[0].length + " expected");
    }

    var argsWithType = args.map(function (value, i) {
      return castIntoStackLocalOfType(funcinstArgs[i], value);
    });
    var stackFrame = createStackFrame(funcinst.code, argsWithType, funcinst.module, allocator); // push func's params into stackFrame locals

    (_stackFrame$locals = stackFrame.locals).push.apply(_stackFrame$locals, _toConsumableArray(argsWithType)); // 2. Enter the block instr∗ with label


    stackFrame.values.push(label.createValue(exportinst.name));
    stackFrame.labels.push({
      value: funcinst,
      arity: funcinstArgs.length,
      id: t.identifier(exportinst.name)
    }); // function trace(depth, pc, i, frame) {
    //   function ident() {
    //     let out = "";
    //     for (let i = 0; i < depth; i++) {
    //       out += "\t|";
    //     }
    //     return out;
    //   }
    //   console.log(
    //     ident(),
    //     `-------------- pc: ${pc} - depth: ${depth} --------------`
    //   );
    //   console.log(ident(), "instruction:", i.id);
    //   console.log(ident(), "locals:");
    //   frame.locals.forEach((stackLocal: StackLocal) => {
    //     console.log(
    //       ident(),
    //       `\t- type: ${stackLocal.type}, value: ${stackLocal.value}`
    //     );
    //   });
    //   console.log(ident(), "values:");
    //   frame.values.forEach((stackLocal: StackLocal) => {
    //     console.log(
    //       ident(),
    //       `\t- type: ${stackLocal.type}, value: ${stackLocal.value}`
    //     );
    //   });
    //   console.log(ident(), "");
    //   console.log(ident(), "labels:");
    //   frame.labels.forEach((label, k) => {
    //     let value = "unknown";
    //     if (label.id != null) {
    //       value = label.id.value;
    //     }
    //     console.log(ident(), `\t- ${k} id: ${value}`);
    //   });
    //   console.log(
    //     ident(),
    //     "--------------------------------------------------\n"
    //   );
    // }
    // stackFrame.trace = trace;

    return executeStackFrameAndGetResult(stackFrame, returnStackLocal);
  };
}

function executeStackFrameAndGetResult(stackFrame, returnStackLocal) {
  try {
    var res = executeStackFrame(stackFrame);

    if (returnStackLocal === true) {
      return res;
    }

    if (res != null && res.value != null) {
      return res.value.toNumber();
    }
  } catch (e) {
    if (e instanceof ExecutionHasBeenTrapped) {
      throw e;
    } else {
      var err = new _errors.RuntimeError(e.message);
      err.stack = e.stack;
      throw err;
    }
  }
}
},{"../errors":3,"./kernel/exec":7,"./kernel/signals":11,"./kernel/stackframe":12,"./runtime/castIntoStackLocalOfType":14,"./runtime/values/label":22,"@webassemblyjs/ast":29}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walk = walk;

function walk(object, visitor) {
  Object.keys(object).forEach(function (key) {
    Object.keys(object[key]).forEach(function (key2) {
      var val = object[key][key2];
      visitor(key, key2, val);
    });
  });
}
},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Instance = void 0;

var _ast = require("@webassemblyjs/ast");

var _module = require("../compiler/compile/module");

var _errors = require("../errors");

var _hostFunc = require("./host-func");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var modulevalue = require("./runtime/values/module");

var _require = require("./kernel/memory"),
    createAllocator = _require.createAllocator;

var importObjectUtils = require("./import-object");

var _require2 = require("./kernel/stackframe"),
    createStackFrame = _require2.createStackFrame;

var Instance =
/*#__PURE__*/
function () {
  /**
   * Map id to external elements or callable functions
   */
  function Instance(module, importObject) {
    var _this = this;

    _classCallCheck(this, Instance);

    if (module instanceof _module.Module === false) {
      throw new TypeError("module must be of type WebAssembly.Module, " + _typeof(module) + " given.");
    }

    this._externalElements = {};
    this.exports = {};
    /**
     * Create Module's default memory allocator
     */

    this._allocator = createAllocator();
    /**
     * Pass internal options
     */

    var internalInstanceOptions = {
      checkForI64InSignature: true,
      returnStackLocal: false
    };

    if (_typeof(importObject._internalInstanceOptions) === "object") {
      internalInstanceOptions = importObject._internalInstanceOptions;
    }
    /**
     * importObject.
     */


    if (_typeof(importObject) === "object") {
      importObjectUtils.walk(importObject, function (key, key2, value) {
        if (_typeof(_this._externalElements[key]) !== "object") {
          _this._externalElements[key] = {};
        }

        _this._externalElements[key][key2] = value;
      });
    }

    var moduleNode = getModuleFromProgram(module._ast);

    if (moduleNode === null) {
      throw new _errors.RuntimeError("Module not found");
    }

    var moduleInstance = modulevalue.createInstance(this._allocator, // $FlowIgnore: that's the correct type but Flow fails to get it
    moduleNode, this._externalElements);
    moduleInstance.exports.forEach(function (exportinst) {
      if (exportinst.value.type === "Func") {
        _this.exports[exportinst.name] = (0, _hostFunc.createHostfunc)(moduleInstance, exportinst, _this._allocator, internalInstanceOptions);
      }

      if (exportinst.value.type === "Global") {
        var globalinst = _this._allocator.get(exportinst.value.addr);

        if (globalinst == null) {
          throw new _errors.RuntimeError("Global instance has not been instantiated");
        }

        if (internalInstanceOptions.returnStackLocal === true) {
          _this.exports[exportinst.name] = globalinst;
        } else {
          _this.exports[exportinst.name] = globalinst.value.toNumber();
        }
      }

      if (exportinst.value.type === "Memory") {
        var memoryinst = _this._allocator.get(exportinst.value.addr);

        if (memoryinst == null) {
          throw new _errors.RuntimeError("Memory instance has not been instantiated");
        }

        _this.exports[exportinst.name] = memoryinst;
      }
    });
    this._moduleInstance = moduleInstance;

    if (module._start != null && module._start.type === "NumberLiteral") {
      // $FlowIgnore: the NumberLiteral type ensure that the value is present
      var value = module._start.value;
      this.executeStartFunc(value);
    }
  }

  _createClass(Instance, [{
    key: "executeStartFunc",
    value: function executeStartFunc(value) {
      var funcinstAddr = this._moduleInstance.funcaddrs[value];

      if (typeof funcinstAddr === "undefined") {
        throw new _errors.RuntimeError("Start function not found, index: " + value);
      }

      var funcinst = this._allocator.get(funcinstAddr); // The type of C.funcs[x] must be []→[].


      var _funcinst$type = _slicedToArray(funcinst.type, 2),
          params = _funcinst$type[0],
          results = _funcinst$type[1];

      if (params.length !== 0 || results.length !== 0) {
        throw new _errors.RuntimeError("Start function can not have arguments or results");
      }

      var stackFrame = createStackFrame(funcinst.code, params, funcinst.module, this._allocator); // Ignore the result

      (0, _hostFunc.executeStackFrameAndGetResult)(stackFrame,
      /* returnStackLocal */
      true);
    }
  }]);

  return Instance;
}();

exports.Instance = Instance;

function getModuleFromProgram(ast) {
  var module = null;
  (0, _ast.traverse)(ast, {
    Module: function Module(_ref) {
      var node = _ref.node;
      module = node;
    }
  });
  return module;
}
},{"../compiler/compile/module":2,"../errors":3,"./host-func":4,"./import-object":5,"./kernel/memory":10,"./kernel/stackframe":12,"./runtime/values/module":24,"@webassemblyjs/ast":29}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeStackFrame = executeStackFrame;
exports.executeStack = executeStack;

var _memory2 = require("../runtime/values/memory");

var _errors = require("../../errors");

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var t = require("@webassemblyjs/ast");

var _require = require("./instruction/binop"),
    binopi32 = _require.binopi32,
    binopi64 = _require.binopi64,
    binopf32 = _require.binopf32,
    binopf64 = _require.binopf64;

var _require2 = require("./instruction/unop"),
    unopi32 = _require2.unopi32,
    unopi64 = _require2.unopi64,
    unopf32 = _require2.unopf32,
    unopf64 = _require2.unopf64;

var _require3 = require("../runtime/castIntoStackLocalOfType"),
    castIntoStackLocalOfType = _require3.castIntoStackLocalOfType;

var i32 = require("../runtime/values/i32");

var i64 = require("../runtime/values/i64");

var f32 = require("../runtime/values/f32");

var f64 = require("../runtime/values/f64");

var label = require("../runtime/values/label");

var stackframe = require("./stackframe");

var _require4 = require("./signals"),
    createTrap = _require4.createTrap; // Syntactic sugar for the Syntactic sugar
// TODO(sven): do it AOT?


function addEndInstruction(body) {
  body.push(t.instruction("end"));
}

function assertStackDepth(depth) {
  if (depth >= 300) {
    throw new _errors.RuntimeError("Maximum call stack depth reached (".concat(depth, ")"));
  }
}

function executeStackFrame(firstFrame) {
  var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var stack = [firstFrame];
  return executeStack(stack, depth);
}

function executeStack(stack) {
  var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var framepointer = depth; // eax

  var returnRegister = null;

  function run() {
    assertStackDepth(framepointer);
    var frame = stack[framepointer];

    if (!(frame !== undefined)) {
      throw new _errors.RuntimeError('frame !== undefined' + " error: " + ("no frame at " + framepointer || "unknown"));
    }

    framepointer++;

    function getLocalByIndex(index) {
      var local = frame.locals[index];

      if (typeof local === "undefined") {
        throw newRuntimeError("Assertion error: no local value at index " + index);
      }

      frame.values.push(local);
    }

    function setLocalByIndex(index, value) {
      if (!(typeof index === "number")) {
        throw new _errors.RuntimeError('typeof index === "number"' + " error: " + (undefined || "unknown"));
      }

      frame.locals[index] = value;
    }

    function pushResult(res) {
      if (typeof res === "undefined") {
        return;
      }

      frame.values.push(res);
    }

    function popArrayOfValTypes(types) {
      if (frame.values.length < types.length) {
        throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(types.length) + " on the stack, found " + frame.values.length);
      }

      return types.map(function (type) {
        return pop1OfType(type);
      });
    }

    function pop1OfType(type) {
      if (frame.values.length < 1) {
        throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(1) + " on the stack, found " + frame.values.length);
      }

      var v = frame.values.pop();

      if (typeof type === "string" && v.type !== type) {
        throw newRuntimeError("Internal failure: expected value of type " + type + " on top of the stack, type given: " + v.type);
      }

      return v;
    }

    function pop1() {
      if (frame.values.length < 1) {
        throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(1) + " on the stack, found " + frame.values.length);
      }

      return frame.values.pop();
    }

    function pop2(type1, type2) {
      if (frame.values.length < 2) {
        throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(2) + " on the stack, found " + frame.values.length);
      }

      var c2 = frame.values.pop();
      var c1 = frame.values.pop();

      if (c2.type !== type2) {
        throw newRuntimeError("Internal failure: expected c2 value of type " + type2 + " on top of the stack, give type: " + c2.type);
      }

      if (c1.type !== type1) {
        throw newRuntimeError("Internal failure: expected c1 value of type " + type1 + " on top of the stack, give type: " + c1.type);
      }

      return [c1, c2];
    }

    function getLabel(index) {
      var code;

      if (index.type === "NumberLiteral") {
        var _label = index; // WASM

        code = frame.labels.find(function (l) {
          return l.value.value === _label.value;
        });
      } else if (index.type === "Identifier") {
        var _label2 = index; // WAST

        code = frame.labels.find(function (l) {
          if (l.id == null) {
            return false;
          }

          return l.id.value === _label2.value;
        });
      }

      if (typeof code !== "undefined") {
        return code.value;
      }
    }

    function br(label) {
      var code = getLabel(label);

      if (typeof code === "undefined") {
        throw newRuntimeError("Label ".concat(label.value, " doesn't exist"));
      } // FIXME(sven): find a more generic way to handle label and its code
      // Currently func body and block instr*.


      var childStackFrame = stackframe.createChildStackFrame(frame, code.body || code.instr);
      return executeStackFrame(childStackFrame, depth + 1);
    }

    function getMemoryOffset(instruction) {
      if (instruction.namedArgs && instruction.namedArgs.offset) {
        var offset = instruction.namedArgs.offset.value;

        if (offset < 0) {
          throw newRuntimeError("offset must be positive");
        }

        if (offset > 0xffffffff) {
          throw newRuntimeError("offset must be less than or equal to 0xffffffff");
        }

        return offset;
      } else {
        return 0;
      }
    }

    function getMemory() {
      if (frame.originatingModule.memaddrs.length !== 1) {
        throw newRuntimeError("unknown memory");
      }

      var memAddr = frame.originatingModule.memaddrs[0];
      return frame.allocator.get(memAddr);
    }

    function newRuntimeError(msg) {
      return new _errors.RuntimeError(msg);
    }

    function createAndExecuteChildStackFrame(instrs) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          passCurrentContext = _ref.passCurrentContext;

      // FIXME(sven): that's wrong
      var frame = stack[framepointer - 1];

      if (!(frame !== undefined)) {
        throw new _errors.RuntimeError('frame !== undefined' + " error: " + ("no active frame" || "unknown"));
      }

      var nextStackFrame = stackframe.createChildStackFrame(frame, instrs);

      if (passCurrentContext === true) {
        nextStackFrame.values = frame.values;
        nextStackFrame.labels = frame.labels;
      } // Push the frame on top of the stack


      stack[framepointer] = nextStackFrame; // Jump and execute the next frame

      run();

      if (returnRegister !== null) {
        var _frame$values;

        (_frame$values = frame.values).push.apply(_frame$values, _toConsumableArray(returnRegister));

        returnRegister = null;
      }
    }

    while (true) {
      var instruction = frame.code[frame._pc]; //console.log(frame._pc)
      //when expanding, shows only last frame in debugger
      //original object only in preview
      //console.log(stack, frame)
      //console.log(JSON.stringify(stack, null, 4))
      //console.log(JSON.stringify(frame, null, 4))
      //console.log(instruction)

      if (!(instruction !== undefined)) {
        throw new _errors.RuntimeError('instruction !== undefined' + " error: " + ("no instruction at pc ".concat(frame._pc, " in frame ").concat(framepointer) || "unknown"));
      }

      if (typeof frame.trace === "function") {
        frame.trace(framepointer, frame._pc, instruction, frame);
      }

      frame._pc++;

      switch (instruction.type) {
        /**
         * Function declaration
         *
         * FIXME(sven): seems unspecified in the spec but it's required for the `call`
         * instruction.
         */
        case "Func":
          {
            var func = instruction;
            /**
             * Register the function into the stack frame labels
             */

            if (_typeof(func.name) === "object") {
              if (func.name.type === "Identifier") {
                if (func.signature.type !== "Signature") {
                  throw newRuntimeError("Function signatures must be denormalised before execution");
                }

                frame.labels.push({
                  value: func,
                  arity: func.signature.params.length,
                  id: func.name
                });
              }
            }

            break;
          }
      }

      switch (instruction.id) {
        case "const":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-const
            var _n = instruction.args[0];

            if (typeof _n === "undefined") {
              throw newRuntimeError("const requires one argument, none given.");
            }

            if (_n.type !== "NumberLiteral" && _n.type !== "LongNumberLiteral" && _n.type !== "FloatLiteral") {
              throw newRuntimeError("const: unsupported value of type: " + _n.type);
            }

            pushResult(castIntoStackLocalOfType(instruction.object, _n.value));
            break;
          }

        /**
         * Control Instructions
         *
         * https://webassembly.github.io/spec/core/exec/instructions.html#control-instructions
         */

        case "nop":
          {
            // Do nothing
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-nop
            break;
          }

        case "loop":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-loop
            var loop = instruction;

            if (!(_typeof(loop.instr) === "object" && typeof loop.instr.length !== "undefined")) {
              throw new _errors.RuntimeError('typeof loop.instr === "object" && typeof loop.instr.length !== "undefined"' + " error: " + (undefined || "unknown"));
            }

            // 2. Enter the block instr∗ with label
            frame.labels.push({
              value: loop,
              arity: 0,
              id: loop.label
            });
            pushResult(label.createValue(loop.label.value));

            if (loop.instr.length > 0) {
              createAndExecuteChildStackFrame(loop.instr, {
                passCurrentContext: true
              });
            }

            break;
          }

        case "drop":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-drop
            // 1. Assert: due to validation, a value is on the top of the stack.
            if (frame.values.length < 1) {
              throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(1) + " on the stack, found " + frame.values.length);
            }

            // 2. Pop the value valval from the stack.
            pop1();
            break;
          }

        case "call":
          {
            // According to the spec call doesn't support an Identifier as argument
            // but the Script syntax supports it.
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-call
            var call = instruction;

            if (call.index.type === "Identifier") {
              throw newRuntimeError("Internal compiler error: Identifier argument in call must be " + "transformed to a NumberLiteral node");
            } // WASM


            if (call.index.type === "NumberLiteral") {
              var index = call.index.value;

              if (!(typeof frame.originatingModule !== "undefined")) {
                throw new _errors.RuntimeError('typeof frame.originatingModule !== "undefined"' + " error: " + (undefined || "unknown"));
              }

              // 2. Assert: due to validation, F.module.funcaddrs[x] exists.
              var funcaddr = frame.originatingModule.funcaddrs[index];

              if (typeof funcaddr === "undefined") {
                throw newRuntimeError("No function were found in module at address ".concat(index));
              } // 3. Let a be the function address F.module.funcaddrs[x]


              var subroutine = frame.allocator.get(funcaddr);

              if (_typeof(subroutine) !== "object") {
                throw newRuntimeError("Cannot call function at address ".concat(funcaddr, ": not a function"));
              } // 4. Invoke the function instance at address a
              // FIXME(sven): assert that res has type of resultType


              var _subroutine$type = _slicedToArray(subroutine.type, 2),
                  argTypes = _subroutine$type[0],
                  resultType = _subroutine$type[1]; //console.log(subroutine)


              var args = popArrayOfValTypes(argTypes);

              if (subroutine.isExternal === false) {
                createAndExecuteChildStackFrame(subroutine.code);
              } else {
                if (subroutine.code.name == "usegas") {
                  //XXX debug, check full path!
                  args["stack"] = stack;
                  args["framepointer"] = framepointer; //subroutine.code(stack, framepointer)
                } // else {


                var res = subroutine.code(args.map(function (arg) {
                  return arg.value;
                }));

                if (typeof res !== "undefined") {
                  pushResult(castIntoStackLocalOfType(resultType, res));
                } //}

              }
            }

            break;
          }

        case "block":
          {
            var _ret = function () {
              // https://webassembly.github.io/spec/core/exec/instructions.html#blocks
              var block = instruction;
              /**
               * Used to keep track of the number of values added on top of the stack
               * because we need to remove the label after the execution of this block.
               */

              var numberOfValuesAddedOnTopOfTheStack = 0; // 2. Enter the block instr∗ with label

              frame.labels.push({
                value: block,
                arity: 0,
                id: block.label
              });

              if (block.label.type === "Identifier") {
                pushResult(label.createValue(block.label.value));
              } else {
                throw newRuntimeError("Block has no id");
              }

              if (!(_typeof(block.instr) === "object" && typeof block.instr.length !== "undefined")) {
                throw new _errors.RuntimeError('typeof block.instr === "object" && typeof block.instr.length !== "undefined"' + " error: " + (undefined || "unknown"));
              }

              if (block.instr.length > 0) {
                var oldStackSize = frame.values.length;
                createAndExecuteChildStackFrame(block.instr, {
                  passCurrentContext: true
                });
                numberOfValuesAddedOnTopOfTheStack = frame.values.length - oldStackSize;
              }
              /**
               * Wen exiting the block
               *
               * > Let m be the number of values on the top of the stack
               *
               * The Stack (values) are seperated by StackFrames and we are running on
               * one single thread, there's no need to check if values were added.
               *
               * We tracked it in numberOfValuesAddedOnTopOfTheStack anyway.
               */


              var topOfTheStack = frame.values.slice(frame.values.length - numberOfValuesAddedOnTopOfTheStack);
              frame.values.splice(frame.values.length - numberOfValuesAddedOnTopOfTheStack); // 3. Assert: due to validation, the label LL is now on the top of the stack.
              // 4. Pop the label from the stack.

              pop1OfType("label");
              frame.values = _toConsumableArray(frame.values).concat(_toConsumableArray(topOfTheStack)); // Remove label

              frame.labels = frame.labels.filter(function (x) {
                if (x.id == null) {
                  return true;
                }

                return x.id.value !== block.label.value;
              });
              return "break";
            }();

            if (_ret === "break") break;
          }

        case "br":
          {
            var _ret2 = function () {
              // https://webassembly.github.io/spec/core/exec/instructions.html#exec-br
              var _instruction$args = _toArray(instruction.args),
                  label = _instruction$args[0],
                  children = _instruction$args.slice(1);

              if (label.type === "Identifier") {
                throw newRuntimeError("Internal compiler error: Identifier argument in br must be " + "transformed to a NumberLiteral node");
              }

              var l = label.value; // 1. Assert: due to validation, the stack contains at least l+1 labels.

              if (frame.values.length < l + 1) {
                throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(l + 1) + " on the stack, found " + frame.values.length);
              }

              // 2. Let L be the l-th label appearing on the stack, starting from the top and counting from zero.
              var seenLabels = 0;
              var labelidx = {
                value: "unknown"
              }; // for (var i = 0, len = frame.values.length; i < len; i++) {

              for (var i = frame.values.length; i--;) {
                if (frame.values[i].type === "label") {
                  if (seenLabels === l) {
                    labelidx = frame.values[i];
                    break;
                  }

                  seenLabels++;
                }
              } // $FlowIgnore


              var L = frame.labels.find(function (x) {
                return x.id.value === labelidx.value;
              });

              if (typeof L === "undefined") {
                throw newRuntimeError("br: unknown label ".concat(labelidx.value));
              } // 3. Let n be the arity of L.


              var n = L.arity; // 4. Assert: due to validation, there are at least nn values on the top of the stack.

              if (frame.values.length < n) {
                throw new _errors.RuntimeError("Assertion error: expected " + JSON.stringify(n) + " on the stack, found " + frame.values.length);
              }

              // 5. Pop the values valn from the stack
              var val = frame.values[n];
              var bottomOfTheStack = frame.values.slice(0, n);
              var topOfTheStack = frame.values.slice(n + 1);
              frame.values = _toConsumableArray(bottomOfTheStack).concat(_toConsumableArray(topOfTheStack)); // 6. Repeat l+1 times:

              for (var _i2 = 0; _i2 < l + 1; _i2++) {
                // a. While the top of the stack is a value, do:
                // i. Pop the value from the stack
                var value = frame.values[frame.values.length - 1];

                if (typeof value === "undefined") {
                  break;
                }

                if (value.type !== "label") {
                  pop1();
                }
              } // b. Assert: due to validation, the top of the stack now is a label.
              // c. Pop the label from the stack.


              pop1OfType("label"); // 7. Push the values valn to the stack.

              pushResult(val); // 0 is the current frame, 1 is it's parent.

              stack = stack.slice(0, -(l + 1));
              framepointer -= l + 1; // execute childrens

              addEndInstruction(children);
              createAndExecuteChildStackFrame(children, {
                passCurrentContext: true
              });
              return {
                v: void 0
              };
            }();

            if (_typeof(_ret2) === "object") return _ret2.v;
          }

        case "br_if":
          {
            var _instruction$args2 = _toArray(instruction.args),
                _label3 = _instruction$args2[0],
                children = _instruction$args2.slice(1); // execute childrens


            addEndInstruction(children);
            createAndExecuteChildStackFrame(children, {
              passCurrentContext: true
            }); // 1. Assert: due to validation, a value of type i32 is on the top of the stack.
            // 2. Pop the value ci32.const c from the stack.

            var c = pop1OfType("i32");

            if (!c.value.eqz().isTrue()) {
              // 3. If c is non-zero, then
              // 3. a. Execute the instruction (br l).
              var _res = br(_label3);

              pushResult(_res);
            } else {// 4. Else:
              // 4. a. Do nothing.
            }

            break;
          }

        case "if":
          {
            if (instruction.test.length > 0) {
              createAndExecuteChildStackFrame(instruction.test);
            } // 1. Assert: due to validation, a value of value type i32 is on the top of the stack.
            // 2. Pop the value i32.const from the stack.


            var _c = pop1OfType("i32");

            if (_c.value.eqz().isTrue() === false) {
              /**
               * Execute consequent
               */
              createAndExecuteChildStackFrame(instruction.consequent);
            } else if (typeof instruction.alternate !== "undefined" && instruction.alternate.length > 0) {
              /**
               * Execute alternate
               */
              createAndExecuteChildStackFrame(instruction.alternate);
            }

            break;
          }

        /**
         * Administrative Instructions
         *
         * https://webassembly.github.io/spec/core/exec/runtime.html#administrative-instructions
         */

        case "unreachable": // https://webassembly.github.io/spec/core/exec/instructions.html#exec-unreachable

        case "trap":
          {
            // signalling abrupt termination
            // https://webassembly.github.io/spec/core/exec/runtime.html#syntax-trap
            throw createTrap();
          }

        case "local":
          {
            var _instruction$args3 = _slicedToArray(instruction.args, 1),
                valtype = _instruction$args3[0];

            var init = castIntoStackLocalOfType(valtype.name, 0);
            frame.locals.push(init);
            break;
          }

        /**
         * Memory Instructions
         *
         * https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions
         */

        case "get_local":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-local
            var _index = instruction.args[0];

            if (typeof _index === "undefined") {
              throw newRuntimeError("get_local requires one argument, none given.");
            }

            if (_index.type === "NumberLiteral" || _index.type === "FloatLiteral") {
              getLocalByIndex(_index.value);
            } else {
              throw newRuntimeError("get_local: unsupported index of type: " + _index.type);
            }

            break;
          }

        case "set_local":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-local
            var _index2 = instruction.args[0];
            var _init = instruction.args[1];

            if (typeof _init !== "undefined" && _init.type === "Instr") {
              // WAST
              var code = [_init];
              addEndInstruction(code);
              createAndExecuteChildStackFrame(code, {
                passCurrentContext: true
              });

              var _res2 = pop1();

              setLocalByIndex(_index2.value, _res2);
            } else if (_index2.type === "NumberLiteral") {
              // WASM
              // 4. Pop the value val from the stack
              var val = pop1(); // 5. Replace F.locals[x] with the value val

              setLocalByIndex(_index2.value, val);
            } else {
              throw newRuntimeError("set_local: unsupported index of type: " + _index2.type);
            }

            break;
          }

        case "tee_local":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-tee-local
            var _index3 = instruction.args[0];
            var _init2 = instruction.args[1];

            if (typeof _init2 !== "undefined" && _init2.type === "Instr") {
              // WAST
              var _code = [_init2];
              addEndInstruction(_code);
              createAndExecuteChildStackFrame(_code, {
                passCurrentContext: true
              });

              var _res3 = pop1();

              setLocalByIndex(_index3.value, _res3);
              pushResult(_res3);
            } else if (_index3.type === "NumberLiteral") {
              // WASM
              // 1. Assert: due to validation, a value is on the top of the stack.
              // 2. Pop the value val from the stack.
              var _val = pop1(); // 3. Push the value valval to the stack.


              pushResult(_val); // 4. Push the value valval to the stack.

              pushResult(_val); // 5. Execute the instruction (set_local x).
              // 5. 4. Pop the value val from the stack

              var val2 = pop1(); // 5. 5. Replace F.locals[x] with the value val

              setLocalByIndex(_index3.value, val2);
            } else {
              throw newRuntimeError("tee_local: unsupported index of type: " + _index3.type);
            }

            break;
          }

        case "set_global":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-set-global
            var _instruction$args4 = _slicedToArray(instruction.args, 2),
                _index4 = _instruction$args4[0],
                right = _instruction$args4[1]; // Interpret right branch first if it's a child instruction


            if (typeof right !== "undefined") {
              var _code2 = [right];
              addEndInstruction(_code2);
              createAndExecuteChildStackFrame(_code2, {
                passCurrentContext: true
              });
            } // 2. Assert: due to validation, F.module.globaladdrs[x] exists.


            var globaladdr = frame.originatingModule.globaladdrs[_index4.value];

            if (typeof globaladdr === "undefined") {
              throw newRuntimeError("Global address ".concat(_index4.value, " not found"));
            } // 4. Assert: due to validation, S.globals[a] exists.


            var globalinst = frame.allocator.get(globaladdr);

            if (_typeof(globalinst) !== "object") {
              throw newRuntimeError("Unexpected data for global at ".concat(globaladdr));
            } // 7. Pop the value val from the stack.


            var _val2 = pop1(); // 8. Replace glob.value with the value val.


            globalinst.value = _val2.value;
            frame.allocator.set(globaladdr, globalinst);
            break;
          }

        case "get_global":
          {
            // https://webassembly.github.io/spec/core/exec/instructions.html#exec-get-global
            var _index5 = instruction.args[0]; // 2. Assert: due to validation, F.module.globaladdrs[x] exists.

            var _globaladdr = frame.originatingModule.globaladdrs[_index5.value];

            if (typeof _globaladdr === "undefined") {
              throw newRuntimeError("Unknown global at index: ".concat(_index5.value));
            } // 4. Assert: due to validation, S.globals[a] exists.


            var _globalinst = frame.allocator.get(_globaladdr);

            if (_typeof(_globalinst) !== "object") {
              throw newRuntimeError("Unexpected data for global at ".concat(_globaladdr));
            } // 7. Pop the value val from the stack.


            pushResult(_globalinst);
            break;
          }

        case "return":
          {
            var _args = instruction.args;

            if (_args.length > 0) {
              addEndInstruction(_args);
              createAndExecuteChildStackFrame(_args, {
                passCurrentContext: true
              });
            } // Abort execution and return the first item on the stack


            returnRegister = [pop1()];
            return;
          }

        /**
         * Memory operations
         */
        // https://webassembly.github.io/spec/core/exec/instructions.html#exec-storen

        case "store":
        case "store8":
        case "store16":
        case "store32":
          {
            var id = instruction.id,
                object = instruction.object,
                _args2 = instruction.args; // Interpret children first
            // only WAST

            if (typeof _args2 !== "undefined" && _args2.length > 0) {
              addEndInstruction(_args2);
              createAndExecuteChildStackFrame(_args2, {
                passCurrentContext: true
              });
            }

            var memory = getMemory();

            var _pop = pop2("i32", object),
                _pop2 = _slicedToArray(_pop, 2),
                c1 = _pop2[0],
                c2 = _pop2[1];

            var ptr = c1.value.toNumber() + getMemoryOffset(instruction);
            var valueBuffer = c2.value.toByteArray();

            switch (id) {
              case "store8":
                valueBuffer = valueBuffer.slice(0, 1);
                break;

              case "store16":
                valueBuffer = valueBuffer.slice(0, 2);
                break;

              case "store32":
                valueBuffer = valueBuffer.slice(0, 4);
                break;
            }

            if (ptr + valueBuffer.length > memory.buffer.byteLength) {
              throw newRuntimeError("memory access out of bounds");
            }

            var memoryBuffer = new Uint8Array(memory.buffer); // load / store use little-endian order

            for (var ptrOffset = 0; ptrOffset < valueBuffer.length; ptrOffset++) {
              memoryBuffer[ptr + ptrOffset] = valueBuffer[ptrOffset];
            }

            break;
          }
        // https://webassembly.github.io/spec/core/exec/instructions.html#and

        case "load":
        case "load16_s":
        case "load16_u":
        case "load8_s":
        case "load8_u":
        case "load32_s":
        case "load32_u":
          {
            var _id = instruction.id,
                _object = instruction.object,
                _args3 = instruction.args; // Interpret children first
            // only WAST

            if (typeof _args3 !== "undefined" && _args3.length > 0) {
              addEndInstruction(_args3);
              createAndExecuteChildStackFrame(_args3, {
                passCurrentContext: true
              });
            }

            var _memory = getMemory();

            var _ptr = pop1OfType("i32").value.toNumber() + getMemoryOffset(instruction); // for i32 / i64 ops, handle extended load


            var extend = 0; // for i64 values, increase the bitshift by 4 bytes

            var extendOffset = _object === "i32" ? 0 : 32;
            var signed = false;

            switch (_id) {
              case "load16_s":
                extend = 16 + extendOffset;
                signed = true;
                break;

              case "load16_u":
                extend = 16 + extendOffset;
                signed = false;
                break;

              case "load8_s":
                extend = 24 + extendOffset;
                signed = true;
                break;

              case "load8_u":
                extend = 24 + extendOffset;
                signed = false;
                break;

              case "load32_u":
                extend = 0 + extendOffset;
                signed = false;
                break;

              case "load32_s":
                extend = 0 + extendOffset;
                signed = true;
                break;
            } // check for memory access out of bounds


            switch (_object) {
              case "i32":
              case "f32":
                if (_ptr + 4 > _memory.buffer.byteLength) {
                  throw newRuntimeError("memory access out of bounds");
                }

                break;

              case "i64":
              case "f64":
                if (_ptr + 8 > _memory.buffer.byteLength) {
                  throw newRuntimeError("memory access out of bounds");
                }

                break;
            }

            switch (_object) {
              case "i32":
              case "u32":
                pushResult(i32.createValueFromArrayBuffer(_memory.buffer, _ptr, extend, signed));
                break;

              case "i64":
                pushResult(i64.createValueFromArrayBuffer(_memory.buffer, _ptr, extend, signed));
                break;

              case "f32":
                pushResult(f32.createValueFromArrayBuffer(_memory.buffer, _ptr));
                break;

              case "f64":
                pushResult(f64.createValueFromArrayBuffer(_memory.buffer, _ptr));
                break;

              default:
                throw new _errors.RuntimeError("Unsupported " + _object + " load");
            }

            break;
          }

        /**
         * Binary operations
         */

        case "add":
        case "mul":
        case "sub":
        /**
         * There are two seperated operation for both signed and unsigned integer,
         * but since the host environment will handle that, we don't have too :)
         */

        case "div_s":
        case "div_u":
        case "rem_s":
        case "rem_u":
        case "shl":
        case "shr_s":
        case "shr_u":
        case "rotl":
        case "rotr":
        case "div":
        case "min":
        case "max":
        case "copysign":
        case "or":
        case "xor":
        case "and":
        case "eq":
        case "ne":
        case "lt_s":
        case "lt_u":
        case "le_s":
        case "le_u":
        case "gt":
        case "gt_s":
        case "gt_u":
        case "ge_s":
        case "ge_u":
          {
            var binopFn = void 0;

            switch (instruction.object) {
              case "i32":
                binopFn = binopi32;
                break;

              case "i64":
                binopFn = binopi64;
                break;

              case "f32":
                binopFn = binopf32;
                break;

              case "f64":
                binopFn = binopf64;
                break;

              default:
                throw createTrap("Unsupported operation " + instruction.id + " on " + instruction.object);
            }

            var _instruction$args5 = _slicedToArray(instruction.args, 2),
                left = _instruction$args5[0],
                _right = _instruction$args5[1]; // Interpret left branch first if it's a child instruction


            if (typeof left !== "undefined") {
              var _code3 = [left];
              addEndInstruction(_code3);
              createAndExecuteChildStackFrame(_code3, {
                passCurrentContext: true
              });
            } // Interpret right branch first if it's a child instruction


            if (typeof _right !== "undefined") {
              var _code4 = [_right];
              addEndInstruction(_code4);
              createAndExecuteChildStackFrame(_code4, {
                passCurrentContext: true
              });
            }

            var _pop3 = pop2(instruction.object, instruction.object),
                _pop4 = _slicedToArray(_pop3, 2),
                _c2 = _pop4[0],
                _c3 = _pop4[1];

            pushResult(binopFn(_c2, _c3, instruction.id));
            break;
          }

        /**
         * Unary operations
         */

        case "abs":
        case "neg":
        case "clz":
        case "ctz":
        case "popcnt":
        case "eqz":
        case "reinterpret/f32":
        case "reinterpret/f64":
          {
            var unopFn = void 0; // for conversion operations, the operand type appears after the forward-slash
            // e.g. with i32.reinterpret/f32, the oprand is f32, and the resultant is i32

            var opType = instruction.id.indexOf("/") !== -1 ? instruction.id.split("/")[1] : instruction.object;

            switch (opType) {
              case "i32":
                unopFn = unopi32;
                break;

              case "i64":
                unopFn = unopi64;
                break;

              case "f32":
                unopFn = unopf32;
                break;

              case "f64":
                unopFn = unopf64;
                break;

              default:
                throw createTrap("Unsupported operation " + instruction.id + " on " + opType);
            }

            var _instruction$args6 = _slicedToArray(instruction.args, 1),
                operand = _instruction$args6[0]; // Interpret argument first if it's a child instruction


            if (typeof operand !== "undefined") {
              var _code5 = [operand];
              addEndInstruction(_code5);
              createAndExecuteChildStackFrame(_code5, {
                passCurrentContext: true
              });
            }

            var _c4 = pop1OfType(opType);

            pushResult(unopFn(_c4, instruction.id));
            break;
          }

        case "end":
          {
            // Pop active frame from the stack
            stack.pop();
            framepointer--; // Return the item on top of the values/stack;

            if (frame.values.length > 0) {
              var _res4 = pop1();

              if (_res4.type !== "label") {
                returnRegister = [_res4];
              } else {
                // Push label back
                pushResult(_res4);
              }
            }

            return;
          }
      }
    }
  }

  run();

  if (returnRegister !== null) {
    // FIXME(sven): handle multiple results in hostfunc
    return returnRegister[0];
  }
}
},{"../../errors":3,"../runtime/castIntoStackLocalOfType":14,"../runtime/values/f32":16,"../runtime/values/f64":17,"../runtime/values/i32":20,"../runtime/values/i64":21,"../runtime/values/label":22,"../runtime/values/memory":23,"./instruction/binop":8,"./instruction/unop":9,"./signals":11,"./stackframe":12,"@webassemblyjs/ast":29}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.binopi32 = binopi32;
exports.binopi64 = binopi64;
exports.binopf32 = binopf32;
exports.binopf64 = binopf64;

var i32 = require("../../runtime/values/i32");

var i64 = require("../../runtime/values/i64");

var f32 = require("../../runtime/values/f32");

var f64 = require("../../runtime/values/f64");

function binop(_ref, _ref2, sign, createValue) {
  var value1 = _ref.value;
  var value2 = _ref2.value;

  switch (sign) {
    case "add":
      return createValue(value1.add(value2));

    case "sub":
      return createValue(value1.sub(value2));

    case "mul":
      return createValue(value1.mul(value2));

    case "div_s":
      return createValue(value1.div_s(value2));

    case "div_u":
      return createValue(value1.div_u(value2));

    case "rem_s":
      return createValue(value1.rem_s(value2));

    case "rem_u":
      return createValue(value1.rem_u(value2));

    case "shl":
      return createValue(value1.shl(value2));

    case "shr_s":
      return createValue(value1.shr_s(value2));

    case "shr_u":
      return createValue(value1.shr_u(value2));

    case "rotl":
      return createValue(value1.rotl(value2));

    case "rotr":
      return createValue(value1.rotr(value2));

    case "div":
      return createValue(value1.div(value2));

    case "and":
      return createValue(value1.and(value2));

    case "eq":
      return createValue(value1.eq(value2));

    case "ne":
      return createValue(value1.ne(value2));

    case "lt_s":
      return createValue(value1.lt_s(value2));

    case "lt_u":
      return createValue(value1.lt_u(value2));

    case "le_s":
      return createValue(value1.le_s(value2));

    case "le_u":
      return createValue(value1.le_u(value2));

    case "gt":
      return createValue(value1.gt(value2));

    case "gt_s":
      return createValue(value1.gt_s(value2));

    case "gt_u":
      return createValue(value1.gt_u(value2));

    case "ge_s":
      return createValue(value1.ge_s(value2));

    case "ge_u":
      return createValue(value1.ge_u(value2));

    case "or":
      return createValue(value1.or(value2));

    case "xor":
      return createValue(value1.xor(value2));

    case "min":
      return createValue(value1.min(value2));

    case "max":
      return createValue(value1.max(value2));

    case "copysign":
      return createValue(value1.copysign(value2));
  }

  throw new Error("Unsupported binop: " + sign);
}

function binopi32(value1, value2, sign) {
  return binop(value1, value2, sign, i32.createValue);
}

function binopi64(value1, value2, sign) {
  return binop(value1, value2, sign, i64.createValue);
}

function binopf32(value1, value2, sign) {
  return binop(value1, value2, sign, f32.createValue);
}

function binopf64(value1, value2, sign) {
  return binop(value1, value2, sign, f64.createValue);
}
},{"../../runtime/values/f32":16,"../../runtime/values/f64":17,"../../runtime/values/i32":20,"../../runtime/values/i64":21}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unopi32 = unopi32;
exports.unopi64 = unopi64;
exports.unopf32 = unopf32;
exports.unopf64 = unopf64;

var i32 = _interopRequireWildcard(require("../../runtime/values/i32"));

var i64 = _interopRequireWildcard(require("../../runtime/values/i64"));

var f32 = _interopRequireWildcard(require("../../runtime/values/f32"));

var f64 = _interopRequireWildcard(require("../../runtime/values/f64"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

// https://webassembly.github.io/spec/core/exec/instructions.html#exec-binop
function unop(_ref, operation, createValue) {
  var value = _ref.value;

  switch (operation) {
    case "abs":
      return createValue(value.abs());

    case "neg":
      return createValue(value.neg());

    case "clz":
      return createValue(value.clz());

    case "ctz":
      return createValue(value.ctz());

    case "popcnt":
      return createValue(value.popcnt());

    case "eqz":
      return createValue(value.eqz());

    case "reinterpret/f32":
      return i32.createValue(value.reinterpret());

    case "reinterpret/f64":
      return i64.createValue(value.reinterpret());
  }

  throw new Error("Unsupported unop: " + operation);
}

function unopi32(c, operation) {
  return unop(c, operation, i32.createValue);
}

function unopi64(c, operation) {
  return unop(c, operation, i64.createValue);
}

function unopf32(c, operation) {
  return unop(c, operation, f32.createValue);
}

function unopf64(c, operation) {
  return unop(c, operation, f64.createValue);
}
},{"../../runtime/values/f32":16,"../../runtime/values/f64":17,"../../runtime/values/i32":20,"../../runtime/values/i64":21}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAllocator = createAllocator;
exports.NULL = void 0;
var NULL = 0x0; // Allocates memory addresses within the store
// https://webassembly.github.io/spec/core/exec/modules.html#alloc

exports.NULL = NULL;

function createAllocator() {
  // https://webassembly.github.io/spec/core/exec/runtime.html#store
  var store = [];
  var offset = 0;

  function malloc(size) {
    offset += size;
    return {
      index: offset,
      size: size
    };
  }

  function get(p) {
    return store[p.index];
  }

  function set(p, value) {
    store[p.index] = value;
  }

  function free(p) {
    store[p.index] = NULL;
  }

  return {
    store: store,
    offset: offset,
    malloc: malloc,
    free: free,
    get: get,
    set: set
  };
}
},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTrap = createTrap;
exports.ExecutionHasBeenTrapped = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null) return null; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var ExecutionHasBeenTrapped =
/*#__PURE__*/
function (_Error) {
  _inherits(ExecutionHasBeenTrapped, _Error);

  function ExecutionHasBeenTrapped() {
    _classCallCheck(this, ExecutionHasBeenTrapped);

    return _possibleConstructorReturn(this, _getPrototypeOf(ExecutionHasBeenTrapped).apply(this, arguments));
  }

  return ExecutionHasBeenTrapped;
}(_wrapNativeSuper(Error));
/**
 * Trap: signalling abrupt termination
 * https://webassembly.github.io/spec/core/exec/runtime.html#syntax-trap
 *
 * It triggered using the `trap` instruction
 */


exports.ExecutionHasBeenTrapped = ExecutionHasBeenTrapped;

function createTrap() {
  var reason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "Execution has been trapped";
  return new ExecutionHasBeenTrapped(reason);
}
},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStackFrame = createStackFrame;
exports.createChildStackFrame = createChildStackFrame;

function createStackFrame(code, locals, originatingModule, allocator) {
  return {
    code: code,
    locals: locals,
    globals: [],

    /**
     * Labels are named block of code.
     * We maintain a map to access the block for a given identifier.
     *
     * https://webassembly.github.io/spec/core/exec/runtime.html#labels
     */
    labels: [],

    /**
     * Local applicatif Stack for the current stackframe.
     *
     * https://webassembly.github.io/spec/core/exec/runtime.html#stack
     */
    values: [],

    /**
     * We keep a reference to its originating module.
     *
     * When we need to lookup a function by addr for example.
     */
    originatingModule: originatingModule,

    /**
     * For shared memory operations
     */
    allocator: allocator,

    /**
     * Program counter, used to track the execution of the code
     */
    _pc: 0
  };
}

function createChildStackFrame(parent, code) {
  var locals = parent.locals,
      originatingModule = parent.originatingModule,
      allocator = parent.allocator,
      trace = parent.trace;
  var frame = createStackFrame(code, locals, originatingModule, allocator);
  frame.trace = trace;
  return frame;
}
},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evaluate = evaluate;

var t = require("@webassemblyjs/ast");

var _require = require("./kernel/exec"),
    executeStackFrame = _require.executeStackFrame;

var _require2 = require("./kernel/stackframe"),
    createStackFrame = _require2.createStackFrame;

var modulevalue = require("./runtime/values/module");

function evaluate(allocator, code) {
  // Create an empty module instance for the context
  var moduleInstance = modulevalue.createInstance(allocator, t.module(undefined, []));
  var stackFrame = createStackFrame(code, [], moduleInstance, allocator);
  var res = executeStackFrame(stackFrame);
  return res;
}
},{"./kernel/exec":7,"./kernel/stackframe":12,"./runtime/values/module":24,"@webassemblyjs/ast":29}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.castIntoStackLocalOfType = castIntoStackLocalOfType;

var _require = require("../../errors"),
    RuntimeError = _require.RuntimeError;

var i32 = require("./values/i32");

var i64 = require("./values/i64");

var f32 = require("./values/f32");

var f64 = require("./values/f64");

function castIntoStackLocalOfType(type, v) {
  var nan = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var inf = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var castFn = {
    i32: i32.createValueFromAST,
    i64: i64.createValueFromAST,
    f32: f32.createValueFromAST,
    f64: f64.createValueFromAST
  };

  if (nan === true) {
    castFn.f32 = f32.createNanFromAST;
    castFn.f64 = f64.createNanFromAST;
  }

  if (inf === true) {
    castFn.f32 = f32.createInfFromAST;
    castFn.f64 = f64.createInfFromAST;
  }

  if (typeof castFn[type] === "undefined") {
    throw new RuntimeError("Cannot cast: unsupported type " + JSON.stringify(type));
  }

  return castFn[type](v);
}
},{"../../errors":3,"./values/f32":16,"./values/f64":17,"./values/i32":20,"./values/i64":21}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFuncInstance = createFuncInstance;
exports.createGlobalInstance = createGlobalInstance;

function createFuncInstance(func, params, results) {
  var type = [params, results];
  return {
    type: type,
    code: func,
    module: null,
    isExternal: true
  };
}

function createGlobalInstance(value, type, mutability) {
  return {
    type: type,
    mutability: mutability,
    value: value
  };
}
},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInfFromAST = createInfFromAST;
exports.createNanFromAST = createNanFromAST;
exports.createValueFromAST = createValueFromAST;
exports.createValue = createValue;
exports.createValueFromArrayBuffer = createValueFromArrayBuffer;
exports.f32inf = exports.f32nan = exports.f32 = void 0;

var _number = require("./number");

var _i = require("./i32");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var type = "f32";

var f32 =
/*#__PURE__*/
function (_Float) {
  _inherits(f32, _Float);

  function f32() {
    _classCallCheck(this, f32);

    return _possibleConstructorReturn(this, _getPrototypeOf(f32).apply(this, arguments));
  }

  _createClass(f32, [{
    key: "reinterpret",
    value: function reinterpret() {
      var floatArray = new Float32Array(1);
      floatArray[0] = this._value;
      var intArray = new Int32Array(floatArray.buffer);
      return new _i.i32(intArray[0]);
    }
  }, {
    key: "add",
    value: function add(operand) {
      // If the other operand is a nan we use its implementation, otherwise the Float one.
      return operand instanceof f32nan ? // $FlowIgnore
      operand.add(this) : _number.Float.prototype.add.call(this, operand);
    }
  }, {
    key: "sub",
    value: function sub(operand) {
      // If the other operand is a nan we use its implementation, otherwise the Float one.
      return operand instanceof f32nan ? // $FlowIgnore
      operand.sub(this) : _number.Float.prototype.sub.call(this, operand);
    }
  }, {
    key: "mul",
    value: function mul(operand) {
      // If the other operand is a nan we use its implementation, otherwise the Float one.
      return operand instanceof f32nan ? // $FlowIgnore
      operand.mul(this) : _number.Float.prototype.mul.call(this, operand);
    }
  }, {
    key: "div",
    value: function div(operand) {
      // If the other operand is a nan we use its implementation, otherwise the Float one.
      return operand instanceof f32nan ? // $FlowIgnore
      operand.div(this) : _number.Float.prototype.div.call(this, operand);
    }
  }, {
    key: "toByteArray",
    value: function toByteArray() {
      var floatArray = new Float32Array(1);
      floatArray[0] = this._value;
      return (0, _number.typedArrayToArray)(new Int8Array(floatArray.buffer));
    }
  }, {
    key: "gt",
    value: function gt(operand) {
      var one = new _i.i32(1);
      var zero = new _i.i32(0);
      var z1 = this;
      var z2 = operand; // If either z1 or z2 is a NaN, then return 0.

      if (isNaN(z1._value) === true || isNaN(z2._value) === true) {
        return zero;
      } // Else if z1 and z2 are the same value, then return 0.


      if (z1.equals(z2) === true) {
        return zero;
      } // Else if z1 is positive infinity, then return 1.


      if (Math.sign(z1._value) === 1 && z1 instanceof f32inf) {
        return one;
      } // Else if z1 is negative infinity, then return 0.


      if (Math.sign(z1._value) === -1 && z1 instanceof f32inf) {
        return one;
      } // Else if z2 is positive infinity, then return 0.


      if (Math.sign(z2._value) === 1 && z2 instanceof f32inf) {
        return zero;
      } // Else if z2 is negative infinity, then return 1.


      if (Math.sign(z2._value) === -1 && z2 instanceof f32inf) {
        return one;
      } // Else if both z1 and z2 are zeroes, then return 0.


      if (z1._value === 0 && z2._value === 0) {
        return zero;
      } // Else if z1 is larger than z2, then return 1.


      if (z1._value > z2._value) {
        return one;
      } // Else return 0.


      return zero;
    }
  }], [{
    key: "fromArrayBuffer",
    value: function fromArrayBuffer(buffer, ptr) {
      var slice = buffer.slice(ptr, ptr + 4);
      var value = new Float32Array(slice);
      return new f32(value[0]);
    }
  }]);

  return f32;
}(_number.Float);

exports.f32 = f32;

var f32nan =
/*#__PURE__*/
function (_f) {
  _inherits(f32nan, _f);

  function f32nan() {
    _classCallCheck(this, f32nan);

    return _possibleConstructorReturn(this, _getPrototypeOf(f32nan).apply(this, arguments));
  }

  _createClass(f32nan, [{
    key: "reinterpret",

    /**
     * Interprets the bit representation for this nan as an integer
     * https://webassembly.github.io/spec/core/syntax/values.html#floating-point
     *
     * A 32 bit nan looks like this
     *
     * ------------------------------
     * |s|1|1|1|1|1|1|1|1|m1|...|m23|
     * ------------------------------
     *
     * The exponent is all 1's and the mantissa [m1,...m23] is non-zero ().
     *
     * We store sign and mantissa both in the _value field,
     * which is reflected by the computation below.
     */
    value: function reinterpret() {
      var result = 0; // sign bit of _value shifted to position 0

      if (this._value <= 0) {
        result = result | 0x80000000;
      } // 8-bit exponent shifted to position 1 through 8


      result = result | 0xff << 23; // 23-bit mantissa which is obtained by disregarding the sign of _value

      var mantissa = this._value <= 0 ? -this._value : this._value;
      result = result | mantissa;
      return new _i.i32(result);
    }
  }, {
    key: "add",
    value: function add() {
      // nan(z1) + x = nan(z1) a is valid execution.
      return this;
    }
  }, {
    key: "sub",
    value: function sub() {
      return this;
    }
  }, {
    key: "mul",
    value: function mul() {
      return this;
    }
  }, {
    key: "div",
    value: function div() {
      return this;
    }
  }]);

  return f32nan;
}(f32);

exports.f32nan = f32nan;

var f32inf =
/*#__PURE__*/
function (_f2) {
  _inherits(f32inf, _f2);

  function f32inf() {
    _classCallCheck(this, f32inf);

    return _possibleConstructorReturn(this, _getPrototypeOf(f32inf).apply(this, arguments));
  }

  _createClass(f32inf, [{
    key: "reinterpret",
    value: function reinterpret() {
      // Exponent is all 1's, mantissa is all zeros
      var result = 0xff << 23;

      if (this._value < 0) {
        result = result | 0x80000000;
      }

      return new _i.i32(result);
    }
  }]);

  return f32inf;
}(f32);

exports.f32inf = f32inf;

function createInfFromAST(sign) {
  return {
    type: type,
    value: new f32inf(sign)
  };
}

function createNanFromAST(payload) {
  return {
    type: type,
    value: new f32nan(payload)
  };
}

function createValueFromAST(value) {
  return {
    type: type,
    value: new f32(value)
  };
}

function createValue(value) {
  return {
    type: type,
    value: value
  };
}

function createValueFromArrayBuffer(buffer, ptr) {
  return {
    type: type,
    value: f32.fromArrayBuffer(buffer, ptr)
  };
}
},{"./i32":20,"./number":25}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInfFromAST = createInfFromAST;
exports.createNanFromAST = createNanFromAST;
exports.createValueFromAST = createValueFromAST;
exports.createValue = createValue;
exports.createValueFromArrayBuffer = createValueFromArrayBuffer;
exports.f64nan = exports.f64inf = exports.f64 = void 0;

var _long = _interopRequireDefault(require("@xtuc/long"));

var _number = require("./number");

var _i = require("./i64");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var type = "f64";

var f64 =
/*#__PURE__*/
function (_Float) {
  _inherits(f64, _Float);

  function f64() {
    _classCallCheck(this, f64);

    return _possibleConstructorReturn(this, _getPrototypeOf(f64).apply(this, arguments));
  }

  _createClass(f64, [{
    key: "reinterpret",
    value: function reinterpret() {
      var floatArray = new Float64Array(1);
      floatArray[0] = this._value;
      var lowIntArray = new Int32Array(floatArray.buffer.slice(0, 4));
      var highIntArray = new Int32Array(floatArray.buffer.slice(4, 8));
      return new _i.i64(_long.default.fromBits(lowIntArray[0], highIntArray[0]));
    }
  }, {
    key: "toByteArray",
    value: function toByteArray() {
      var floatArray = new Float64Array(1);
      floatArray[0] = this._value;
      return (0, _number.typedArrayToArray)(new Int8Array(floatArray.buffer));
    }
  }], [{
    key: "fromArrayBuffer",
    value: function fromArrayBuffer(buffer, ptr) {
      var slice = buffer.slice(ptr, ptr + 8);
      var value = new Float64Array(slice);
      return new f64(value[0]);
    }
  }]);

  return f64;
}(_number.Float);

exports.f64 = f64;

var f64inf =
/*#__PURE__*/
function (_f) {
  _inherits(f64inf, _f);

  function f64inf() {
    _classCallCheck(this, f64inf);

    return _possibleConstructorReturn(this, _getPrototypeOf(f64inf).apply(this, arguments));
  }

  _createClass(f64inf, [{
    key: "reinterpret",
    value: function reinterpret() {
      // Exponent is all 1's, mantissa is all zeros
      var upper = 0x7ff << 20;

      if (this._value < 0) {
        upper = upper | 0x80000000;
      }

      return new _i.i64(_long.default.fromBits(0, upper).toSigned());
    }
  }]);

  return f64inf;
}(f64);

exports.f64inf = f64inf;

var f64nan =
/*#__PURE__*/
function (_f2) {
  _inherits(f64nan, _f2);

  function f64nan() {
    _classCallCheck(this, f64nan);

    return _possibleConstructorReturn(this, _getPrototypeOf(f64nan).apply(this, arguments));
  }

  _createClass(f64nan, [{
    key: "reinterpret",
    value: function reinterpret() {
      var lower = 0;
      var upper = 0; // sign bit of _value shifted to position 0

      if (this._value <= 0) {
        upper = upper | 0x80000000;
      } // 11-bit exponent shifted to position 1 through 11


      upper = upper | 0x7ff << 20; // 52-bit mantissa which is obtained by disregarding the sign of _value

      var mantissa = this._value <= 0 ? -this._value : this._value;
      lower = lower | mantissa % Math.pow(2, 32);
      upper = upper | Math.floor(mantissa / Math.pow(2, 32));
      return new _i.i64(_long.default.fromBits(lower, upper));
    }
  }]);

  return f64nan;
}(f64);

exports.f64nan = f64nan;

function createInfFromAST(sign) {
  return {
    type: type,
    value: new f64inf(sign)
  };
}

function createNanFromAST(payload) {
  return {
    type: type,
    value: new f64nan(payload)
  };
}

function createValueFromAST(value) {
  return {
    type: type,
    value: new f64(value)
  };
}

function createValue(value) {
  return {
    type: type,
    value: value
  };
}

function createValueFromArrayBuffer(buffer, ptr) {
  return {
    type: type,
    value: f64.fromArrayBuffer(buffer, ptr)
  };
}
},{"./i64":21,"./number":25,"@xtuc/long":70}],18:[function(require,module,exports){
"use strict";

var _errors = require("../../../errors");

function createInstance(n, fromModule) {
  //       [param*, result*]
  var type = [[], []];

  if (n.signature.type !== "Signature") {
    throw new _errors.RuntimeError("Function signatures must be denormalised before execution");
  }

  var signature = n.signature;
  signature.params.forEach(function (param) {
    type[0].push(param.valtype);
  });
  signature.results.forEach(function (result) {
    type[1].push(result);
  });
  var code = n.body;
  return {
    type: type,
    code: code,
    module: fromModule,
    isExternal: false
  };
}

module.exports = {
  createInstance: createInstance
};
},{"../../../errors":3}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInstance = createInstance;

var _validation = require("@webassemblyjs/validation");

var _require = require("../../partial-evaluation"),
    evaluate = _require.evaluate;

var _require2 = require("../../../errors"),
    CompileError = _require2.CompileError;

function createInstance(allocator, node) {
  var value;
  var _node$globalType = node.globalType,
      valtype = _node$globalType.valtype,
      mutability = _node$globalType.mutability;

  if (node.init.length > 0 && (0, _validation.isConst)(node.init) === false) {
    throw new CompileError("constant expression required");
  } // None or multiple constant expressions in the initializer seems not possible
  // TODO(sven): find a specification reference for that
  // FIXME(sven): +1 because of the implicit end, change the order of validations


  if (node.init.length > 2 || node.init.length === 1) {
    throw new CompileError("type mismatch");
  } // Validate the type


  var resultInferedType = (0, _validation.getType)(node.init);

  if (resultInferedType != null && (0, _validation.typeEq)([node.globalType.valtype], resultInferedType) === false) {
    throw new CompileError("type mismatch");
  }

  var res = evaluate(allocator, node.init);

  if (res != null) {
    value = res.value;
  }

  return {
    type: valtype,
    mutability: mutability,
    value: value
  };
}
},{"../../../errors":3,"../../partial-evaluation":13,"@webassemblyjs/validation":54}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createValueFromAST = createValueFromAST;
exports.createValue = createValue;
exports.createValueFromArrayBuffer = createValueFromArrayBuffer;
exports.createTrue = createTrue;
exports.createFalse = createFalse;
exports.i32 = void 0;

var _long = _interopRequireDefault(require("@xtuc/long"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("../../../errors"),
    RuntimeError = _require.RuntimeError;

var bits = 32;
var type = "i32"; // the specification describes the conversion from unsigned to signed
// https://webassembly.github.io/spec/core/exec/numerics.html#aux-signed
// this function performs the inverse

var toUnsigned = function toUnsigned(a) {
  return a >>> 0;
};

var i32 =
/*#__PURE__*/
function () {
  function i32(value) {
    _classCallCheck(this, i32);

    // Integers are represented within WebAssembly as unsigned numbers. When crossing the JS <=> WebAssembly boundary
    // they are converted into a signed number.
    this._value = value | 0;
  }

  _createClass(i32, [{
    key: "add",
    value: function add(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-iadd
      return new i32(this._value + operand._value);
    }
  }, {
    key: "sub",
    value: function sub(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-isub
      return new i32(this._value - operand._value);
    }
  }, {
    key: "mul",
    value: function mul(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-imul
      return new i32(_long.default.fromNumber(this._value).mul(_long.default.fromNumber(operand._value)).mod(Math.pow(2, bits)).toNumber());
    }
  }, {
    key: "div_s",
    value: function div_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-s
      if (operand._value == 0) {
        throw new RuntimeError("integer divide by zero");
      } // as per: https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-s
      // This operator is partial. Besides division by 0, the result of −2^(N−1) / (−1) = +2^(N−1)
      // is not representable as an N-bit signed integer.


      if (this._value == -0x80000000 && operand._value == -1) {
        throw new RuntimeError("integer overflow");
      }

      return new i32(this._value / operand._value);
    }
  }, {
    key: "div_u",
    value: function div_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-idiv-u
      if (operand._value == 0) {
        throw new RuntimeError("integer divide by zero");
      }

      return new i32(toUnsigned(this._value) / toUnsigned(operand._value));
    }
  }, {
    key: "rem_s",
    value: function rem_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-irem-s
      if (operand._value == 0) {
        throw new RuntimeError("integer divide by zero");
      }

      return new i32(this._value % operand._value);
    }
  }, {
    key: "rem_u",
    value: function rem_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-irem-u
      if (operand._value == 0) {
        throw new RuntimeError("integer divide by zero");
      }

      return new i32(toUnsigned(this._value) % toUnsigned(operand._value));
    }
  }, {
    key: "shl",
    value: function shl(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-shl
      return new i32(this._value << operand._value);
    }
  }, {
    key: "shr_s",
    value: function shr_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-shr-s
      return new i32(this._value >> operand._value);
    }
  }, {
    key: "shr_u",
    value: function shr_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-shr-u
      return new i32(this._value >>> operand._value);
    }
  }, {
    key: "rotl",
    value: function rotl(rotation) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-rotl
      return new i32(this._value << rotation._value | this._value >>> bits - rotation._value);
    }
  }, {
    key: "rotr",
    value: function rotr(rotation) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-rotl
      return new i32(this._value >>> rotation._value | this._value << bits - rotation._value);
    }
  }, {
    key: "clz",
    value: function clz() {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-iclz
      if (this._value == 0) {
        return new i32(bits);
      }

      var lead = 0;
      var temp = toUnsigned(this._value);

      while ((temp & 0x80000000) == 0) {
        lead++;
        temp = temp << 1 >>> 0;
      }

      return new i32(lead);
    }
  }, {
    key: "ctz",
    value: function ctz() {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ictz
      if (this._value == 0) {
        return new i32(bits);
      }

      var lead = 0;
      var temp = toUnsigned(this._value);

      while ((temp & 0x1) == 0) {
        lead++;
        temp = temp >> 1 >>> 0;
      }

      return new i32(lead);
    }
  }, {
    key: "popcnt",
    value: function popcnt() {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ipopcnt
      var temp = toUnsigned(this._value);
      var count = 0;

      while (temp != 0) {
        if (temp & 0x80000000) {
          count++;
        }

        temp = temp << 1;
      }

      return new i32(count);
    }
  }, {
    key: "div",
    value: function div() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "and",
    value: function and(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-iand
      return new i32(this._value & operand._value);
    }
  }, {
    key: "or",
    value: function or(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ixor
      return new i32(this._value | operand._value);
    }
  }, {
    key: "xor",
    value: function xor(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ixor
      return new i32(this._value ^ operand._value);
    }
  }, {
    key: "eqz",
    value: function eqz() {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ieqz
      return new i32(this._value == 0 ? 1 : 0);
    }
  }, {
    key: "eq",
    value: function eq(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ieq
      return new i32(this._value == operand._value ? 1 : 0);
    }
  }, {
    key: "ne",
    value: function ne(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-ieq
      return new i32(this._value != operand._value ? 1 : 0);
    }
  }, {
    key: "lt_u",
    value: function lt_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-u
      return new i32(toUnsigned(this._value) < toUnsigned(operand._value) ? 1 : 0);
    }
  }, {
    key: "lt_s",
    value: function lt_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-s
      return new i32(this._value < operand._value ? 1 : 0);
    }
  }, {
    key: "le_u",
    value: function le_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-u
      return new i32(toUnsigned(this._value) <= toUnsigned(operand._value) ? 1 : 0);
    }
  }, {
    key: "le_s",
    value: function le_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-lt-s
      return new i32(this._value <= operand._value ? 1 : 0);
    }
  }, {
    key: "gt_u",
    value: function gt_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-u
      return new i32(toUnsigned(this._value) > toUnsigned(operand._value) ? 1 : 0);
    }
  }, {
    key: "gt_s",
    value: function gt_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-s
      return new i32(this._value > operand._value ? 1 : 0);
    }
  }, {
    key: "ge_u",
    value: function ge_u(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-u
      return new i32(toUnsigned(this._value) >= toUnsigned(operand._value) ? 1 : 0);
    }
  }, {
    key: "ge_s",
    value: function ge_s(operand) {
      // https://webassembly.github.io/spec/core/exec/numerics.html#op-gt-s
      return new i32(this._value >= operand._value ? 1 : 0);
    }
  }, {
    key: "equals",
    value: function equals(operand) {
      return isNaN(this._value) ? isNaN(operand._value) : this._value == operand._value;
    }
  }, {
    key: "min",
    value: function min(operand) {
      return new i32(Math.min(this._value, operand._value));
    }
  }, {
    key: "max",
    value: function max(operand) {
      return new i32(Math.max(this._value, operand._value));
    }
  }, {
    key: "abs",
    value: function abs() {
      return new i32(Math.abs(this._value));
    }
  }, {
    key: "neg",
    value: function neg() {
      return new i32(-this._value);
    }
  }, {
    key: "copysign",
    value: function copysign(operand) {
      return new i32(Math.sign(this._value) === Math.sign(operand._value) ? this._value : -this._value);
    }
  }, {
    key: "toNumber",
    value: function toNumber() {
      return this._value;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this._value + "";
    }
  }, {
    key: "isTrue",
    value: function isTrue() {
      // https://webassembly.github.io/spec/core/exec/numerics.html#boolean-interpretation
      return this._value == 1;
    }
  }, {
    key: "toByteArray",
    value: function toByteArray() {
      var byteArray = new Array(4);

      for (var offset = 0, shift = 0; offset < byteArray.length; offset++, shift += 8) {
        byteArray[offset] = this._value >>> shift & 0xff;
      }

      return byteArray;
    }
  }], [{
    key: "fromArrayBuffer",
    value: function fromArrayBuffer(buffer, ptr, extend, signed) {
      var slice = buffer.slice(ptr, ptr + 4);
      var asInt32 = new Int32Array(slice)[0]; // shift left, then shift right by the same number of bits, using
      // signed or unsigned shifts

      asInt32 <<= extend;
      return new i32(signed ? asInt32 >> extend : asInt32 >>> extend);
    }
  }]);

  return i32;
}();

exports.i32 = i32;

function createValueFromAST(value) {
  return {
    type: type,
    value: new i32(value)
  };
}

function createValue(value) {
  return {
    type: type,
    value: value
  };
}

function createValueFromArrayBuffer(buffer, ptr, extend, signed) {
  return {
    type: type,
    value: i32.fromArrayBuffer(buffer, ptr, extend, signed)
  };
}

function createTrue() {
  return new i32(1);
}

function createFalse() {
  return new i32(0);
}
},{"../../../errors":3,"@xtuc/long":70}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createValueFromAST = createValueFromAST;
exports.createValue = createValue;
exports.createValueFromArrayBuffer = createValueFromArrayBuffer;
exports.i64 = void 0;

var _long = _interopRequireDefault(require("@xtuc/long"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("../../../errors"),
    RuntimeError = _require.RuntimeError;

var type = "i64";

var i64 =
/*#__PURE__*/
function () {
  function i64(value) {
    _classCallCheck(this, i64);

    this._value = value;
  }

  _createClass(i64, [{
    key: "add",
    value: function add(operand) {
      return new i64(this._value.add(operand._value));
    }
  }, {
    key: "sub",
    value: function sub(operand) {
      return new i64(this._value.sub(operand._value));
    }
  }, {
    key: "mul",
    value: function mul(operand) {
      return new i64(this._value.mul(operand._value));
    }
  }, {
    key: "div_s",
    value: function div_s(operand) {
      return new i64(this._value.div(operand._value));
    }
  }, {
    key: "div_u",
    value: function div_u(operand) {
      return new i64(this._value.div(operand._value));
    }
  }, {
    key: "div",
    value: function div(operand) {
      return new i64(this._value.div(operand._value));
    }
  }, {
    key: "and",
    value: function and(operand) {
      return new i64(this._value.and(operand._value));
    }
  }, {
    key: "or",
    value: function or(operand) {
      return new i64(this._value.or(operand._value));
    }
  }, {
    key: "xor",
    value: function xor(operand) {
      return new i64(this._value.xor(operand._value));
    }
  }, {
    key: "equals",
    value: function equals(operand) {
      return this._value.equals(operand._value);
    }
  }, {
    key: "isZero",
    value: function isZero() {
      return this._value.low == 0 && this._value.high == 0;
    }
  }, {
    key: "abs",
    value: function abs() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "copysign",
    value: function copysign() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "max",
    value: function max() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "min",
    value: function min() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "neg",
    value: function neg() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "lt_s",
    value: function lt_s() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "lt_u",
    value: function lt_u() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "le_s",
    value: function le_s() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "le_u",
    value: function le_u() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "gt_s",
    value: function gt_s() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "gt_u",
    value: function gt_u() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "ge_s",
    value: function ge_s() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "ge_u",
    value: function ge_u() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "rem_s",
    value: function rem_s() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "rem_u",
    value: function rem_u() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "shl",
    value: function shl() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "shr_s",
    value: function shr_s() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "shr_u",
    value: function shr_u() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "rotl",
    value: function rotl() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "rotr",
    value: function rotr() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "clz",
    value: function clz() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "ctz",
    value: function ctz() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "popcnt",
    value: function popcnt() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "eqz",
    value: function eqz() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "eq",
    value: function eq() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "ne",
    value: function ne() {
      throw new RuntimeError("Unsupported operation");
    }
  }, {
    key: "toString",
    value: function toString() {
      return this._value.toString();
    }
  }, {
    key: "toNumber",
    value: function toNumber() {
      return this._value.toNumber();
    }
  }, {
    key: "isTrue",
    value: function isTrue() {
      // https://webassembly.github.io/spec/core/exec/numerics.html#boolean-interpretation
      return this.toNumber() == 1;
    }
  }, {
    key: "toByteArray",
    value: function toByteArray() {
      var byteArray = new Array(8);

      for (var offset = 0, shift = 0; offset < byteArray.length; offset++, shift += 8) {
        byteArray[offset] = this._value.shru(shift).and(0xff).toNumber();
      }

      return byteArray;
    }
  }], [{
    key: "fromArrayBuffer",
    value: function fromArrayBuffer(buffer, ptr, extend, signed) {
      var slice = buffer.slice(ptr, ptr + 8);
      var value = new Int32Array(slice);
      var longVal = new _long.default(value[0], value[1]); // shift left, then shift right by the same number of bits, using
      // signed or unsigned shifts

      longVal = longVal.shiftLeft(extend);
      return new i64(signed ? longVal.shiftRight(extend) : longVal.shiftRightUnsigned(extend));
    }
  }]);

  return i64;
}();

exports.i64 = i64;

function createValueFromAST(value) {
  if (typeof value.low === "undefined" || typeof value.high === "undefined") {
    throw new Error("i64.createValueFromAST malformed value: " + JSON.stringify(value));
  }

  return {
    type: type,
    value: new i64(new _long.default(value.low, value.high))
  };
}

function createValue(value) {
  return {
    type: type,
    value: value
  };
}

function createValueFromArrayBuffer(buffer, ptr, extend, signed) {
  return {
    type: type,
    value: i64.fromArrayBuffer(buffer, ptr, extend, signed)
  };
}
},{"../../../errors":3,"@xtuc/long":70}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createValue = createValue;
var type = "label";

function createValue(value) {
  return {
    type: type,
    value: value
  };
}
},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Memory = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("../../../errors"),
    RuntimeError = _require.RuntimeError;

var WEBASSEMBLY_PAGE_SIZE = 64 * 1024
/* 64KiB */
;

var Memory =
/*#__PURE__*/
function () {
  function Memory(descr) {
    _classCallCheck(this, Memory);

    if (_typeof(descr) !== "object") {
      throw new TypeError("MemoryDescriptor must be an object");
    }

    if (typeof descr.maximum === "number" && descr.maximum < descr.initial) {
      throw new RangeError("Initial memory can not be higher than the maximum");
    }

    if (descr.initial > 65536) {
      throw new RuntimeError("memory size must be at most 65536 pages (4GiB)");
    }

    if (typeof descr.maximum === "number") {
      this._maximumBytes = descr.maximum * WEBASSEMBLY_PAGE_SIZE;
    }

    this._initialBytes = descr.initial * WEBASSEMBLY_PAGE_SIZE;

    this._allocateInitial();
  }

  _createClass(Memory, [{
    key: "_allocateInitial",
    value: function _allocateInitial() {
      this.buffer = new ArrayBuffer(this._initialBytes);
    }
  }]);

  return Memory;
}();

exports.Memory = Memory;
},{"../../../errors":3}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInstance = createInstance;

var _ast = require("@webassemblyjs/ast");

var _nodes = require("@webassemblyjs/ast/lib/nodes");

var WebAssemblyMemory = _interopRequireWildcard(require("./memory"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _require = require("../../../errors"),
    RuntimeError = _require.RuntimeError,
    LinkError = _require.LinkError,
    CompileError = _require.CompileError;

var WebAssemblyTable = require("./table");

var func = require("./func");

var externvalue = require("./extern");

var global = require("./global");

var _require2 = require("./i32"),
    i32 = _require2.i32;
/**
 * Create Module's import instances
 *
 * > the indices of imports go before the first index of any definition
 * > contained in the module itself.
 * see https://webassembly.github.io/spec/core/syntax/modules.html#imports
 */


function instantiateImports(n, allocator, externalElements, internals, moduleInstance) {
  function getExternalElementOrThrow(key, key2) {
    if (typeof externalElements[key] === "undefined" || typeof externalElements[key][key2] === "undefined") {
      throw new CompileError("Unknown import ".concat(key, ".").concat(key2));
    }

    return externalElements[key][key2];
  }

  function handleFuncImport(node, descr) {
    var element = getExternalElementOrThrow(node.module, node.name);
    var params = descr.signature.params != null ? descr.signature.params : [];
    var results = descr.signature.results != null ? descr.signature.results : [];
    var externFuncinstance = externvalue.createFuncInstance(element, // $FlowIgnore
    params, results);
    var externFuncinstanceAddr = allocator.malloc(1
    /* sizeof externFuncinstance */
    );
    allocator.set(externFuncinstanceAddr, externFuncinstance);
    moduleInstance.funcaddrs.push(externFuncinstanceAddr);
  }

  function handleGlobalImport(node, descr) {
    // Validation: The mutability of globaltype must be const.
    if (descr.mutability === "var") {
      throw new CompileError("Mutable globals cannot be imported");
    }

    var element = getExternalElementOrThrow(node.module, node.name);
    var externglobalinstance = externvalue.createGlobalInstance(new i32(element), descr.valtype, descr.mutability);
    var addr = allocator.malloc(1
    /* size of the globalinstance struct */
    );
    allocator.set(addr, externglobalinstance);
    moduleInstance.globaladdrs.push(addr);
  }

  function handleMemoryImport(node) {
    var memoryinstance = getExternalElementOrThrow(node.module, node.name);
    var addr = allocator.malloc(1
    /* size of the memoryinstance struct */
    );
    allocator.set(addr, memoryinstance);
    moduleInstance.memaddrs.push(addr);
  }

  function handleTableImport(node) {
    var tableinstance = getExternalElementOrThrow(node.module, node.name);
    var addr = allocator.malloc(1
    /* size of the tableinstance struct */
    );
    allocator.set(addr, tableinstance);
    moduleInstance.tableaddrs.push(addr);
  }

  (0, _ast.traverse)(n, {
    ModuleImport: function (_ModuleImport) {
      function ModuleImport(_x) {
        return _ModuleImport.apply(this, arguments);
      }

      ModuleImport.toString = function () {
        return _ModuleImport.toString();
      };

      return ModuleImport;
    }(function (_ref) {
      var node = _ref.node;

      switch (node.descr.type) {
        case "FuncImportDescr":
          return handleFuncImport(node, node.descr);

        case "GlobalType":
          return handleGlobalImport(node, node.descr);

        case "Memory":
          return handleMemoryImport(node);

        case "Table":
          return handleTableImport(node);

        default:
          throw new Error("Unsupported import of type: " + node.descr.type);
      }
    })
  });
}
/**
 * write data segments to linear memory
 */


function instantiateDataSections(n, allocator, moduleInstance) {
  (0, _ast.traverse)(n, {
    Data: function (_Data) {
      function Data(_x2) {
        return _Data.apply(this, arguments);
      }

      Data.toString = function () {
        return _Data.toString();
      };

      return Data;
    }(function (_ref2) {
      var node = _ref2.node;
      var memIndex = node.memoryIndex.value;
      var memoryAddr = moduleInstance.memaddrs[memIndex];
      var memory = allocator.get(memoryAddr);
      var buffer = new Uint8Array(memory.buffer);
      var offset;

      if (node.offset.id === "const") {
        var offsetInstruction = node.offset;
        var arg = offsetInstruction.args[0];
        offset = arg.value;
      } else if (node.offset.id === "get_global") {
        var _offsetInstruction = node.offset;
        var globalIndex = _offsetInstruction.args[0].value;
        var globalAddr = moduleInstance.globaladdrs[globalIndex];
        var globalInstance = allocator.get(globalAddr);
        offset = globalInstance.value.toNumber();
      } else {
        throw new RuntimeError("data segment offsets can only be specified as constants or globals");
      }

      for (var i = 0; i < node.init.values.length; i++) {
        buffer[i + offset] = node.init.values[i];
      }
    })
  });
}
/**
 * Create Module's internal elements instances
 */


function instantiateInternals(n, allocator, internals, moduleInstance) {
  (0, _ast.traverse)(n, {
    Func: function (_Func) {
      function Func(_x3) {
        return _Func.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func.toString();
      };

      return Func;
    }(function (_ref3) {
      var node = _ref3.node;

      // Only instantiate/allocate our own functions
      if (node.isExternal === true) {
        return;
      }

      var funcinstance = func.createInstance(node, moduleInstance);
      var addr = allocator.malloc(1
      /* size of the funcinstance struct */
      );
      allocator.set(addr, funcinstance);
      moduleInstance.funcaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          internals.instantiatedFuncs[node.name.value] = {
            addr: addr
          };
        }
      }
    }),
    Table: function (_Table) {
      function Table(_x4) {
        return _Table.apply(this, arguments);
      }

      Table.toString = function () {
        return _Table.toString();
      };

      return Table;
    }(function (_ref4) {
      var node = _ref4.node;
      var initial = node.limits.min;
      var element = node.elementType;
      var tableinstance = new WebAssemblyTable.Table({
        initial: initial,
        element: element
      });
      var addr = allocator.malloc(1
      /* size of the tableinstance struct */
      );
      allocator.set(addr, tableinstance);
      moduleInstance.tableaddrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          internals.instantiatedTables[node.name.value] = {
            addr: addr
          };
        }
      }
    }),
    Elem: function (_Elem) {
      function Elem(_x5) {
        return _Elem.apply(this, arguments);
      }

      Elem.toString = function () {
        return _Elem.toString();
      };

      return Elem;
    }(function (_ref5) {
      var node = _ref5.node;
      var table;

      if (node.table.type === "NumberLiteral") {
        var addr = moduleInstance.tableaddrs[node.table.value];
        table = allocator.get(addr);
      }

      if (_typeof(table) === "object") {
        // FIXME(sven): expose the function in a HostFunc
        table.push(function () {
          throw new Error("Unsupported operation");
        });
      } else {
        throw new CompileError("Unknown table");
      }
    }),
    Memory: function (_Memory) {
      function Memory(_x6) {
        return _Memory.apply(this, arguments);
      }

      Memory.toString = function () {
        return _Memory.toString();
      };

      return Memory;
    }(function (_ref6) {
      var node = _ref6.node;

      // Module has already a memory instance (likely imported), skip this.
      if (moduleInstance.memaddrs.length !== 0) {
        return;
      }

      var _node$limits = node.limits,
          min = _node$limits.min,
          max = _node$limits.max;
      var memoryDescriptor = {
        initial: min
      };

      if (typeof max === "number") {
        memoryDescriptor.maximum = max;
      }

      var memoryinstance = new WebAssemblyMemory.Memory(memoryDescriptor);
      var addr = allocator.malloc(1
      /* size of the memoryinstance struct */
      );
      allocator.set(addr, memoryinstance);
      moduleInstance.memaddrs.push(addr);

      if (node.id != null) {
        if (node.id.type === "Identifier") {
          // $FlowIgnore
          internals.instantiatedMemories[node.id.value] = {
            addr: addr
          };
        }
      }
    }),
    Global: function (_Global) {
      function Global(_x7) {
        return _Global.apply(this, arguments);
      }

      Global.toString = function () {
        return _Global.toString();
      };

      return Global;
    }(function (_ref7) {
      var node = _ref7.node;
      var globalinstance = global.createInstance(allocator, node);
      var addr = allocator.malloc(1
      /* size of the globalinstance struct */
      );
      allocator.set(addr, globalinstance);
      moduleInstance.globaladdrs.push(addr);

      if (node.name != null) {
        if (node.name.type === "Identifier") {
          internals.instantiatedGlobals[node.name.value] = {
            addr: addr,
            type: node.globalType
          };
        }
      }
    })
  });
}
/**
 * Create Module's exports instances
 *
 * The `internals` argument reference already instantiated elements
 */


function instantiateExports(n, allocator, internals, moduleInstance) {
  function assertNotAlreadyExported(str) {
    var moduleInstanceExport = moduleInstance.exports.find(function (_ref8) {
      var name = _ref8.name;
      return name === str;
    });

    if (moduleInstanceExport !== undefined) {
      throw new CompileError("Duplicate export name");
    }
  }

  function createModuleExport(node, instantiatedItemArray, validate) {
    if ((0, _nodes.isIdentifier)(node.descr.id) === true) {
      var instantiatedItem = instantiatedItemArray[node.descr.id.value];
      validate(instantiatedItem);
      assertNotAlreadyExported(node.name);
      moduleInstance.exports.push({
        name: node.name,
        value: {
          type: node.descr.exportType,
          addr: instantiatedItem.addr
        }
      });
    } else if ((0, _nodes.isNumberLiteral)(node.descr.id) === true) {
      var keys = Object.keys(instantiatedItemArray);
      console.log("LOG", instantiatedItemArray, node.descr.id.value, keys); // $FlowIgnore

      var _instantiatedItem = instantiatedItemArray[keys[node.descr.id.value]];
      validate(_instantiatedItem);
      assertNotAlreadyExported(node.name);
      moduleInstance.exports.push({
        name: node.name,
        value: {
          type: node.descr.exportType,
          addr: _instantiatedItem.addr
        }
      });
    } else {
      throw new CompileError("Module exports must be referenced via an Identifier");
    }
  }

  (0, _ast.traverse)(n, {
    ModuleExport: function (_ModuleExport) {
      function ModuleExport(_x8) {
        return _ModuleExport.apply(this, arguments);
      }

      ModuleExport.toString = function () {
        return _ModuleExport.toString();
      };

      return ModuleExport;
    }(function (_ref9) {
      var node = _ref9.node;
      console.log("EXPORT", node);

      switch (node.descr.exportType) {
        case "Func":
          {
            createModuleExport(node, internals.instantiatedFuncs, function (instantiatedFunc) {
              if (typeof instantiatedFunc === "undefined") {
                throw new Error("unknown function");
              }
            });
            break;
          }

        case "Global":
          {
            createModuleExport(node, internals.instantiatedGlobals, function (instantiatedGlobal) {
              if (typeof instantiatedGlobal === "undefined") {
                throw new Error("unknown global");
              } else if (instantiatedGlobal.type.mutability === "var") {
                throw new CompileError("Mutable globals cannot be exported");
              } else if (instantiatedGlobal.type.valtype === "i64") {
                throw new LinkError("Export of globals of type i64 is not allowed");
              }
            });
            break;
          }

        case "Table":
          {
            createModuleExport(node, internals.instantiatedTables, function (instantiatedTable) {
              if (typeof instantiatedTable === "undefined") {
                throw new Error("unknown table");
              }
            });
            break;
          }

        case "Memory":
          {
            createModuleExport(node, internals.instantiatedMemories, function (instantiatedMemory) {
              if (typeof instantiatedMemory === "undefined") {
                throw new Error("unknown memory");
              }
            });
            break;
          }
      }
    })
  });
}

function createInstance(allocator, n) {
  var externalElements = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  // Keep a ref to the module instance
  var moduleInstance = {
    types: [],
    funcaddrs: [],
    tableaddrs: [],
    memaddrs: [],
    globaladdrs: [],
    exports: []
  };
  /**
   * Keep the function that were instantiated and re-use their addr in
   * the export wrapper
   */

  var instantiatedInternals = {
    instantiatedFuncs: {},
    instantiatedGlobals: {},
    instantiatedTables: {},
    instantiatedMemories: {}
  };
  instantiateImports(n, allocator, externalElements, instantiatedInternals, moduleInstance);
  instantiateInternals(n, allocator, instantiatedInternals, moduleInstance);
  instantiateDataSections(n, allocator, moduleInstance);
  instantiateExports(n, allocator, instantiatedInternals, moduleInstance);
  return moduleInstance;
}
},{"../../../errors":3,"./extern":15,"./func":18,"./global":19,"./i32":20,"./memory":23,"./table":26,"@webassemblyjs/ast":29,"@webassemblyjs/ast/lib/nodes":32}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typedArrayToArray = typedArrayToArray;
exports.Float = void 0;

var _errors = require("../../../errors");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Float =
/*#__PURE__*/
function () {
  function Float(value) {
    _classCallCheck(this, Float);

    this._value = value;
  }

  _createClass(Float, [{
    key: "add",
    value: function add(operand) {
      return new this.constructor(this._value + operand._value);
    }
  }, {
    key: "sub",
    value: function sub(operand) {
      return new this.constructor(this._value - operand._value);
    }
  }, {
    key: "mul",
    value: function mul(operand) {
      return new this.constructor(this._value * operand._value);
    }
  }, {
    key: "div_s",
    value: function div_s(operand) {
      return new this.constructor(this._value / operand._value);
    }
  }, {
    key: "div_u",
    value: function div_u(operand) {
      return new this.constructor(this._value / operand._value);
    }
  }, {
    key: "div",
    value: function div(operand) {
      return new this.constructor(this._value / operand._value);
    }
  }, {
    key: "and",
    value: function and(operand) {
      return new this.constructor(this._value & operand._value);
    }
  }, {
    key: "or",
    value: function or(operand) {
      return new this.constructor(this._value | operand._value);
    }
  }, {
    key: "xor",
    value: function xor(operand) {
      return new this.constructor(this._value ^ operand._value);
    }
  }, {
    key: "isZero",
    value: function isZero() {
      return this._value == 0;
    }
  }, {
    key: "equals",
    value: function equals(operand) {
      return isNaN(this._value) ? isNaN(operand._value) : this._value == operand._value;
    }
  }, {
    key: "min",
    value: function min(operand) {
      return new this.constructor(Math.min(this._value, operand._value));
    }
  }, {
    key: "max",
    value: function max(operand) {
      return new this.constructor(Math.max(this._value, operand._value));
    }
  }, {
    key: "abs",
    value: function abs() {
      return new this.constructor(Math.abs(this._value));
    }
  }, {
    key: "neg",
    value: function neg() {
      return new this.constructor(-this._value);
    }
  }, {
    key: "copysign",
    value: function copysign(operand) {
      return new this.constructor(Math.sign(this._value) === Math.sign(operand._value) ? this._value : -this._value);
    }
  }, {
    key: "reinterpret",
    value: function reinterpret() {
      throw new _errors.RuntimeError("unsupported operation");
    }
  }, {
    key: "toByteArray",
    value: function toByteArray() {
      throw new _errors.RuntimeError("unsupported operation");
    }
  }, {
    key: "toNumber",
    value: function toNumber() {
      return this._value;
    }
  }, {
    key: "isTrue",
    value: function isTrue() {
      return this._value == 1;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.toNumber().toString();
    }
  }]);

  return Float;
}();

exports.Float = Float;

function typedArrayToArray(typedArray) {
  var byteArray = new Array(typedArray.byteLength);

  for (var i = 0; i < byteArray.length; i++) {
    byteArray[i] = typedArray[i];
  }

  return byteArray;
}
},{"../../../errors":3}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Table = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DEFAULT_MAX_TABLE_ENTRY = Math.pow(2, 23);

var Table =
/*#__PURE__*/
function () {
  function Table(descr) {
    _classCallCheck(this, Table);

    if (_typeof(descr) !== "object") {
      throw new TypeError("TableDescriptor must be an object");
    }

    if (typeof descr.maximum === "number") {
      this._maximum = descr.maximum;
    } else {
      this._maximum = DEFAULT_MAX_TABLE_ENTRY;
    }

    if (typeof descr.initial === "number") {
      this._initial = descr.initial;

      if (this._initial > this._maximum) {
        throw new RangeError("Initial number can not be higher than the maximum");
      }
    }

    this._elements = Array(this._initial);
    this._offset = 0;
  }

  _createClass(Table, [{
    key: "push",
    value: function push(fn) {
      var offset = this._offset % this._maximum;
      this._elements[offset] = fn;
      this._offset = offset + 1;
    }
  }, {
    key: "get",
    value: function get(offset) {
      var element = this._elements[offset];

      if (typeof element === "undefined") {
        return null;
      } else {
        return element;
      }
    }
  }, {
    key: "length",
    get: function get() {
      return this._elements.length;
    }
  }]);

  return Table;
}();

exports.Table = Table;
},{}],27:[function(require,module,exports){
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _require = require("@webassemblyjs/wast-parser"),
    parse = _require.parse;

var _require2 = require("@webassemblyjs/wasm-parser"),
    decode = _require2.decode;

var _require3 = require("./interpreter"),
    Instance = _require3.Instance;

var _require4 = require("./interpreter/runtime/values/memory"),
    Memory = _require4.Memory;

var _require5 = require("./interpreter/runtime/values/table"),
    Table = _require5.Table;

var _require6 = require("./errors"),
    RuntimeError = _require6.RuntimeError,
    CompileError = _require6.CompileError,
    LinkError = _require6.LinkError;

var _require7 = require("./compiler/compile/module"),
    createCompiledModule = _require7.createCompiledModule,
    Module = _require7.Module;

var _require8 = require("./check-endianness"),
    checkEndianness = _require8.checkEndianness;

var _require9 = require("./interpreter/kernel/exec"),
    executeStack = _require9.executeStack;

var _require10 = require("./interpreter/kernel/memory"),
    createAllocator = _require10.createAllocator;

var WebAssembly = {
  instantiate: function instantiate(buff) {
    var importObject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return new Promise(function (resolve, reject) {
      if (checkEndianness() === false) {
        return reject(new RuntimeError("expected the system to be little-endian"));
      }

      if (buff instanceof ArrayBuffer === false && buff instanceof Uint8Array === false) {
        return reject("Module must be either an ArrayBuffer or an Uint8Array (BufferSource), " + _typeof(buff) + " given.");
      }

      var ast = decode(buff);
      var module = createCompiledModule(ast);
      resolve({
        instance: new Instance(module, importObject),
        module: module
      });
    });
  },
  compile: function compile(buff) {
    return new Promise(function (resolve) {
      var ast = decode(buff);
      resolve(createCompiledModule(ast));
    });
  },
  instantiateFromSource: function instantiateFromSource(content) {
    var importObject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var ast = parse(content);
    var module = createCompiledModule(ast);
    return new Instance(module, importObject);
  },
  executeStack: executeStack,
  createAllocator: createAllocator,
  Instance: Instance,
  Module: Module,
  Memory: Memory,
  Table: Table,
  RuntimeError: RuntimeError,
  LinkError: LinkError,
  CompileError: CompileError
};
module.exports = WebAssembly;
},{"./check-endianness":1,"./compiler/compile/module":2,"./errors":3,"./interpreter":6,"./interpreter/kernel/exec":7,"./interpreter/kernel/memory":10,"./interpreter/runtime/values/memory":23,"./interpreter/runtime/values/table":26,"@webassemblyjs/wasm-parser":61,"@webassemblyjs/wast-parser":63}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cloneNode = cloneNode;

function cloneNode(n) {
  // $FlowIgnore
  var newObj = {};

  for (var k in n) {
    newObj[k] = n[k];
  }

  return newObj;
}
},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  numberLiteralFromRaw: true,
  withLoc: true,
  withRaw: true,
  funcParam: true,
  indexLiteral: true,
  memIndexLiteral: true,
  instruction: true,
  objectInstruction: true,
  traverse: true,
  signatures: true,
  getSectionMetadata: true,
  sortSectionMetadata: true,
  orderedInsertNode: true,
  assertHasLoc: true,
  getEndOfSection: true,
  shiftSection: true,
  shiftLoc: true,
  isAnonymous: true,
  getUniqueNameGenerator: true,
  signatureForOpcode: true,
  cloneNode: true
};
Object.defineProperty(exports, "numberLiteralFromRaw", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.numberLiteralFromRaw;
  }
});
Object.defineProperty(exports, "withLoc", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.withLoc;
  }
});
Object.defineProperty(exports, "withRaw", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.withRaw;
  }
});
Object.defineProperty(exports, "funcParam", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.funcParam;
  }
});
Object.defineProperty(exports, "indexLiteral", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.indexLiteral;
  }
});
Object.defineProperty(exports, "memIndexLiteral", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.memIndexLiteral;
  }
});
Object.defineProperty(exports, "instruction", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.instruction;
  }
});
Object.defineProperty(exports, "objectInstruction", {
  enumerable: true,
  get: function get() {
    return _nodeHelpers.objectInstruction;
  }
});
Object.defineProperty(exports, "traverse", {
  enumerable: true,
  get: function get() {
    return _traverse.traverse;
  }
});
Object.defineProperty(exports, "signatures", {
  enumerable: true,
  get: function get() {
    return _signatures.signatures;
  }
});
Object.defineProperty(exports, "getSectionMetadata", {
  enumerable: true,
  get: function get() {
    return _utils.getSectionMetadata;
  }
});
Object.defineProperty(exports, "sortSectionMetadata", {
  enumerable: true,
  get: function get() {
    return _utils.sortSectionMetadata;
  }
});
Object.defineProperty(exports, "orderedInsertNode", {
  enumerable: true,
  get: function get() {
    return _utils.orderedInsertNode;
  }
});
Object.defineProperty(exports, "assertHasLoc", {
  enumerable: true,
  get: function get() {
    return _utils.assertHasLoc;
  }
});
Object.defineProperty(exports, "getEndOfSection", {
  enumerable: true,
  get: function get() {
    return _utils.getEndOfSection;
  }
});
Object.defineProperty(exports, "shiftSection", {
  enumerable: true,
  get: function get() {
    return _utils.shiftSection;
  }
});
Object.defineProperty(exports, "shiftLoc", {
  enumerable: true,
  get: function get() {
    return _utils.shiftLoc;
  }
});
Object.defineProperty(exports, "isAnonymous", {
  enumerable: true,
  get: function get() {
    return _utils.isAnonymous;
  }
});
Object.defineProperty(exports, "getUniqueNameGenerator", {
  enumerable: true,
  get: function get() {
    return _utils.getUniqueNameGenerator;
  }
});
Object.defineProperty(exports, "signatureForOpcode", {
  enumerable: true,
  get: function get() {
    return _utils.signatureForOpcode;
  }
});
Object.defineProperty(exports, "cloneNode", {
  enumerable: true,
  get: function get() {
    return _clone.cloneNode;
  }
});

var _nodes = require("./nodes");

Object.keys(_nodes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _nodes[key];
    }
  });
});

var _nodeHelpers = require("./node-helpers.js");

var _traverse = require("./traverse");

var _signatures = require("./signatures");

var _utils = require("./utils");

var _clone = require("./clone");
},{"./clone":28,"./node-helpers.js":30,"./nodes":32,"./signatures":33,"./traverse":36,"./utils":37}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.numberLiteralFromRaw = numberLiteralFromRaw;
exports.instruction = instruction;
exports.objectInstruction = objectInstruction;
exports.withLoc = withLoc;
exports.withRaw = withRaw;
exports.funcParam = funcParam;
exports.indexLiteral = indexLiteral;
exports.memIndexLiteral = memIndexLiteral;

var _wastParser = require("@webassemblyjs/wast-parser");

var _nodes = require("./nodes");

function numberLiteralFromRaw(rawValue) {
  var instructionType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "i32";
  var original = rawValue; // Remove numeric separators _

  if (typeof rawValue === "string") {
    rawValue = rawValue.replace(/_/g, "");
  }

  if (typeof rawValue === "number") {
    return (0, _nodes.numberLiteral)(rawValue, String(original));
  } else {
    switch (instructionType) {
      case "i32":
        {
          return (0, _nodes.numberLiteral)((0, _wastParser.parse32I)(rawValue), String(original));
        }

      case "u32":
        {
          return (0, _nodes.numberLiteral)((0, _wastParser.parseU32)(rawValue), String(original));
        }

      case "i64":
        {
          return (0, _nodes.longNumberLiteral)((0, _wastParser.parse64I)(rawValue), String(original));
        }

      case "f32":
        {
          return (0, _nodes.floatLiteral)((0, _wastParser.parse32F)(rawValue), (0, _wastParser.isNanLiteral)(rawValue), (0, _wastParser.isInfLiteral)(rawValue), String(original));
        }
      // f64

      default:
        {
          return (0, _nodes.floatLiteral)((0, _wastParser.parse64F)(rawValue), (0, _wastParser.isNanLiteral)(rawValue), (0, _wastParser.isInfLiteral)(rawValue), String(original));
        }
    }
  }
}

function instruction(id) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var namedArgs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return (0, _nodes.instr)(id, undefined, args, namedArgs);
}

function objectInstruction(id, object) {
  var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var namedArgs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  return (0, _nodes.instr)(id, object, args, namedArgs);
}
/**
 * Decorators
 */


function withLoc(n, end, start) {
  var loc = {
    start: start,
    end: end
  };
  n.loc = loc;
  return n;
}

function withRaw(n, raw) {
  n.raw = raw;
  return n;
}

function funcParam(valtype, id) {
  return {
    id: id,
    valtype: valtype
  };
}

function indexLiteral(value) {
  // $FlowIgnore
  var x = numberLiteralFromRaw(value, "u32");
  return x;
}

function memIndexLiteral(value) {
  // $FlowIgnore
  var x = numberLiteralFromRaw(value, "u32");
  return x;
}
},{"./nodes":32,"@webassemblyjs/wast-parser":63}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPath = createPath;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function findParent(_ref, cb) {
  var parentPath = _ref.parentPath;

  if (parentPath == null) {
    throw new Error("node is root");
  }

  var currentPath = parentPath;

  while (cb(currentPath) !== false) {
    // Hit the root node, stop
    // $FlowIgnore
    if (currentPath.parentPath == null) {
      return null;
    } // $FlowIgnore


    currentPath = currentPath.parentPath;
  }

  return currentPath.node;
}

function insertBefore(context, newNode) {
  return insert(context, newNode);
}

function insertAfter(context, newNode) {
  return insert(context, newNode, 1);
}

function insert(_ref2, newNode) {
  var node = _ref2.node,
      inList = _ref2.inList,
      parentPath = _ref2.parentPath,
      parentKey = _ref2.parentKey;
  var indexOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  if (!inList) {
    throw new Error('inList' + " error: " + ("insert can only be used for nodes that are within lists" || "unknown"));
  }

  if (!(parentPath != null)) {
    throw new Error('parentPath != null' + " error: " + ("Can not remove root node" || "unknown"));
  }

  // $FlowIgnore
  var parentList = parentPath.node[parentKey];
  var indexInList = parentList.findIndex(function (n) {
    return n === node;
  });
  parentList.splice(indexInList + indexOffset, 0, newNode);
}

function remove(_ref3) {
  var node = _ref3.node,
      parentKey = _ref3.parentKey,
      parentPath = _ref3.parentPath;

  if (!(parentPath != null)) {
    throw new Error('parentPath != null' + " error: " + ("Can not remove root node" || "unknown"));
  }

  // $FlowIgnore
  var parentNode = parentPath.node; // $FlowIgnore

  var parentProperty = parentNode[parentKey];

  if (Array.isArray(parentProperty)) {
    // $FlowIgnore
    parentNode[parentKey] = parentProperty.filter(function (n) {
      return n !== node;
    });
  } else {
    // $FlowIgnore
    delete parentNode[parentKey];
  }

  node._deleted = true;
}

function stop(context) {
  context.shouldStop = true;
}

function replaceWith(context, newNode) {
  // $FlowIgnore
  var parentNode = context.parentPath.node; // $FlowIgnore

  var parentProperty = parentNode[context.parentKey];

  if (Array.isArray(parentProperty)) {
    var indexInList = parentProperty.findIndex(function (n) {
      return n === context.node;
    });
    parentProperty.splice(indexInList, 1, newNode);
  } else {
    // $FlowIgnore
    parentNode[context.parentKey] = newNode;
  }

  context.node._deleted = true;
  context.node = newNode;
} // bind the context to the first argument of node operations


function bindNodeOperations(operations, context) {
  var keys = Object.keys(operations);
  var boundOperations = {};
  keys.forEach(function (key) {
    boundOperations[key] = operations[key].bind(null, context);
  });
  return boundOperations;
}

function createPathOperations(context) {
  // $FlowIgnore
  return bindNodeOperations({
    findParent: findParent,
    replaceWith: replaceWith,
    remove: remove,
    insertBefore: insertBefore,
    insertAfter: insertAfter,
    stop: stop
  }, context);
}

function createPath(context) {
  var path = _extends({}, context);

  Object.assign(path, createPathOperations(path));
  return path;
}
},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.module = _module;
exports.moduleMetadata = moduleMetadata;
exports.moduleNameMetadata = moduleNameMetadata;
exports.functionNameMetadata = functionNameMetadata;
exports.localNameMetadata = localNameMetadata;
exports.binaryModule = binaryModule;
exports.quoteModule = quoteModule;
exports.sectionMetadata = sectionMetadata;
exports.loopInstruction = loopInstruction;
exports.instr = instr;
exports.ifInstruction = ifInstruction;
exports.stringLiteral = stringLiteral;
exports.numberLiteral = numberLiteral;
exports.longNumberLiteral = longNumberLiteral;
exports.floatLiteral = floatLiteral;
exports.elem = elem;
exports.indexInFuncSection = indexInFuncSection;
exports.valtypeLiteral = valtypeLiteral;
exports.typeInstruction = typeInstruction;
exports.start = start;
exports.globalType = globalType;
exports.leadingComment = leadingComment;
exports.blockComment = blockComment;
exports.data = data;
exports.global = global;
exports.table = table;
exports.memory = memory;
exports.funcImportDescr = funcImportDescr;
exports.moduleImport = moduleImport;
exports.moduleExportDescr = moduleExportDescr;
exports.moduleExport = moduleExport;
exports.limit = limit;
exports.signature = signature;
exports.program = program;
exports.identifier = identifier;
exports.blockInstruction = blockInstruction;
exports.callInstruction = callInstruction;
exports.callIndirectInstruction = callIndirectInstruction;
exports.byteArray = byteArray;
exports.func = func;
exports.nodeAndUnionTypes = exports.unionTypesMap = exports.assertFunc = exports.assertByteArray = exports.assertCallIndirectInstruction = exports.assertCallInstruction = exports.assertBlockInstruction = exports.assertIdentifier = exports.assertProgram = exports.assertSignature = exports.assertLimit = exports.assertModuleExport = exports.assertModuleExportDescr = exports.assertModuleImport = exports.assertFuncImportDescr = exports.assertMemory = exports.assertTable = exports.assertGlobal = exports.assertData = exports.assertBlockComment = exports.assertLeadingComment = exports.assertGlobalType = exports.assertStart = exports.assertTypeInstruction = exports.assertValtypeLiteral = exports.assertIndexInFuncSection = exports.assertElem = exports.assertFloatLiteral = exports.assertLongNumberLiteral = exports.assertNumberLiteral = exports.assertStringLiteral = exports.assertIfInstruction = exports.assertInstr = exports.assertLoopInstruction = exports.assertSectionMetadata = exports.assertQuoteModule = exports.assertBinaryModule = exports.assertLocalNameMetadata = exports.assertFunctionNameMetadata = exports.assertModuleNameMetadata = exports.assertModuleMetadata = exports.assertModule = exports.isImportDescr = exports.isNumericLiteral = exports.isExpression = exports.isInstruction = exports.isBlock = exports.isNode = exports.isFunc = exports.isByteArray = exports.isCallIndirectInstruction = exports.isCallInstruction = exports.isBlockInstruction = exports.isIdentifier = exports.isProgram = exports.isSignature = exports.isLimit = exports.isModuleExport = exports.isModuleExportDescr = exports.isModuleImport = exports.isFuncImportDescr = exports.isMemory = exports.isTable = exports.isGlobal = exports.isData = exports.isBlockComment = exports.isLeadingComment = exports.isGlobalType = exports.isStart = exports.isTypeInstruction = exports.isValtypeLiteral = exports.isIndexInFuncSection = exports.isElem = exports.isFloatLiteral = exports.isLongNumberLiteral = exports.isNumberLiteral = exports.isStringLiteral = exports.isIfInstruction = exports.isInstr = exports.isLoopInstruction = exports.isSectionMetadata = exports.isQuoteModule = exports.isBinaryModule = exports.isLocalNameMetadata = exports.isFunctionNameMetadata = exports.isModuleNameMetadata = exports.isModuleMetadata = exports.isModule = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// THIS FILE IS AUTOGENERATED
// see scripts/generateNodeUtils.js
function isTypeOf(t) {
  return function (n) {
    return n.type === t;
  };
}

function assertTypeOf(t) {
  return function (n) {
    return function () {
      if (!(n.type === t)) {
        throw new Error('n.type === t' + " error: " + (undefined || "unknown"));
      }
    }();
  };
}

function _module(id, fields, metadata) {
  if (id !== null && id !== undefined) {
    if (!(typeof id === "string")) {
      throw new Error('typeof id === "string"' + " error: " + ("Argument id must be of type string, given: " + _typeof(id) || "unknown"));
    }
  }

  if (!(_typeof(fields) === "object" && typeof fields.length !== "undefined")) {
    throw new Error('typeof fields === "object" && typeof fields.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "Module",
    id: id,
    fields: fields
  };

  if (typeof metadata !== "undefined") {
    node.metadata = metadata;
  }

  return node;
}

function moduleMetadata(sections, functionNames, localNames) {
  if (!(_typeof(sections) === "object" && typeof sections.length !== "undefined")) {
    throw new Error('typeof sections === "object" && typeof sections.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  if (functionNames !== null && functionNames !== undefined) {
    if (!(_typeof(functionNames) === "object" && typeof functionNames.length !== "undefined")) {
      throw new Error('typeof functionNames === "object" && typeof functionNames.length !== "undefined"' + " error: " + (undefined || "unknown"));
    }
  }

  if (localNames !== null && localNames !== undefined) {
    if (!(_typeof(localNames) === "object" && typeof localNames.length !== "undefined")) {
      throw new Error('typeof localNames === "object" && typeof localNames.length !== "undefined"' + " error: " + (undefined || "unknown"));
    }
  }

  var node = {
    type: "ModuleMetadata",
    sections: sections
  };

  if (typeof functionNames !== "undefined" && functionNames.length > 0) {
    node.functionNames = functionNames;
  }

  if (typeof localNames !== "undefined" && localNames.length > 0) {
    node.localNames = localNames;
  }

  return node;
}

function moduleNameMetadata(value) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  var node = {
    type: "ModuleNameMetadata",
    value: value
  };
  return node;
}

function functionNameMetadata(value, index) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  if (!(typeof index === "number")) {
    throw new Error('typeof index === "number"' + " error: " + ("Argument index must be of type number, given: " + _typeof(index) || "unknown"));
  }

  var node = {
    type: "FunctionNameMetadata",
    value: value,
    index: index
  };
  return node;
}

function localNameMetadata(value, localIndex, functionIndex) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  if (!(typeof localIndex === "number")) {
    throw new Error('typeof localIndex === "number"' + " error: " + ("Argument localIndex must be of type number, given: " + _typeof(localIndex) || "unknown"));
  }

  if (!(typeof functionIndex === "number")) {
    throw new Error('typeof functionIndex === "number"' + " error: " + ("Argument functionIndex must be of type number, given: " + _typeof(functionIndex) || "unknown"));
  }

  var node = {
    type: "LocalNameMetadata",
    value: value,
    localIndex: localIndex,
    functionIndex: functionIndex
  };
  return node;
}

function binaryModule(id, blob) {
  if (id !== null && id !== undefined) {
    if (!(typeof id === "string")) {
      throw new Error('typeof id === "string"' + " error: " + ("Argument id must be of type string, given: " + _typeof(id) || "unknown"));
    }
  }

  if (!(_typeof(blob) === "object" && typeof blob.length !== "undefined")) {
    throw new Error('typeof blob === "object" && typeof blob.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "BinaryModule",
    id: id,
    blob: blob
  };
  return node;
}

function quoteModule(id, string) {
  if (id !== null && id !== undefined) {
    if (!(typeof id === "string")) {
      throw new Error('typeof id === "string"' + " error: " + ("Argument id must be of type string, given: " + _typeof(id) || "unknown"));
    }
  }

  if (!(_typeof(string) === "object" && typeof string.length !== "undefined")) {
    throw new Error('typeof string === "object" && typeof string.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "QuoteModule",
    id: id,
    string: string
  };
  return node;
}

function sectionMetadata(section, startOffset, size, vectorOfSize) {
  if (!(typeof startOffset === "number")) {
    throw new Error('typeof startOffset === "number"' + " error: " + ("Argument startOffset must be of type number, given: " + _typeof(startOffset) || "unknown"));
  }

  var node = {
    type: "SectionMetadata",
    section: section,
    startOffset: startOffset,
    size: size,
    vectorOfSize: vectorOfSize
  };
  return node;
}

function loopInstruction(label, resulttype, instr) {
  if (!(_typeof(instr) === "object" && typeof instr.length !== "undefined")) {
    throw new Error('typeof instr === "object" && typeof instr.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "LoopInstruction",
    id: "loop",
    label: label,
    resulttype: resulttype,
    instr: instr
  };
  return node;
}

function instr(id, object, args, namedArgs) {
  if (!(typeof id === "string")) {
    throw new Error('typeof id === "string"' + " error: " + ("Argument id must be of type string, given: " + _typeof(id) || "unknown"));
  }

  if (!(_typeof(args) === "object" && typeof args.length !== "undefined")) {
    throw new Error('typeof args === "object" && typeof args.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "Instr",
    id: id,
    args: args
  };

  if (typeof object !== "undefined") {
    node.object = object;
  }

  if (typeof namedArgs !== "undefined" && Object.keys(namedArgs).length !== 0) {
    node.namedArgs = namedArgs;
  }

  return node;
}

function ifInstruction(testLabel, test, result, consequent, alternate) {
  if (!(_typeof(test) === "object" && typeof test.length !== "undefined")) {
    throw new Error('typeof test === "object" && typeof test.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  if (!(_typeof(consequent) === "object" && typeof consequent.length !== "undefined")) {
    throw new Error('typeof consequent === "object" && typeof consequent.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  if (!(_typeof(alternate) === "object" && typeof alternate.length !== "undefined")) {
    throw new Error('typeof alternate === "object" && typeof alternate.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "IfInstruction",
    id: "if",
    testLabel: testLabel,
    test: test,
    result: result,
    consequent: consequent,
    alternate: alternate
  };
  return node;
}

function stringLiteral(value) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  var node = {
    type: "StringLiteral",
    value: value
  };
  return node;
}

function numberLiteral(value, raw) {
  if (!(typeof value === "number")) {
    throw new Error('typeof value === "number"' + " error: " + ("Argument value must be of type number, given: " + _typeof(value) || "unknown"));
  }

  if (!(typeof raw === "string")) {
    throw new Error('typeof raw === "string"' + " error: " + ("Argument raw must be of type string, given: " + _typeof(raw) || "unknown"));
  }

  var node = {
    type: "NumberLiteral",
    value: value,
    raw: raw
  };
  return node;
}

function longNumberLiteral(value, raw) {
  if (!(typeof raw === "string")) {
    throw new Error('typeof raw === "string"' + " error: " + ("Argument raw must be of type string, given: " + _typeof(raw) || "unknown"));
  }

  var node = {
    type: "LongNumberLiteral",
    value: value,
    raw: raw
  };
  return node;
}

function floatLiteral(value, nan, inf, raw) {
  if (!(typeof value === "number")) {
    throw new Error('typeof value === "number"' + " error: " + ("Argument value must be of type number, given: " + _typeof(value) || "unknown"));
  }

  if (nan !== null && nan !== undefined) {
    if (!(typeof nan === "boolean")) {
      throw new Error('typeof nan === "boolean"' + " error: " + ("Argument nan must be of type boolean, given: " + _typeof(nan) || "unknown"));
    }
  }

  if (inf !== null && inf !== undefined) {
    if (!(typeof inf === "boolean")) {
      throw new Error('typeof inf === "boolean"' + " error: " + ("Argument inf must be of type boolean, given: " + _typeof(inf) || "unknown"));
    }
  }

  if (!(typeof raw === "string")) {
    throw new Error('typeof raw === "string"' + " error: " + ("Argument raw must be of type string, given: " + _typeof(raw) || "unknown"));
  }

  var node = {
    type: "FloatLiteral",
    value: value,
    raw: raw
  };

  if (nan === true) {
    node.nan = true;
  }

  if (inf === true) {
    node.inf = true;
  }

  return node;
}

function elem(table, offset, funcs) {
  if (!(_typeof(offset) === "object" && typeof offset.length !== "undefined")) {
    throw new Error('typeof offset === "object" && typeof offset.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  if (!(_typeof(funcs) === "object" && typeof funcs.length !== "undefined")) {
    throw new Error('typeof funcs === "object" && typeof funcs.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "Elem",
    table: table,
    offset: offset,
    funcs: funcs
  };
  return node;
}

function indexInFuncSection(index) {
  var node = {
    type: "IndexInFuncSection",
    index: index
  };
  return node;
}

function valtypeLiteral(name) {
  var node = {
    type: "ValtypeLiteral",
    name: name
  };
  return node;
}

function typeInstruction(id, functype) {
  var node = {
    type: "TypeInstruction",
    id: id,
    functype: functype
  };
  return node;
}

function start(index) {
  var node = {
    type: "Start",
    index: index
  };
  return node;
}

function globalType(valtype, mutability) {
  var node = {
    type: "GlobalType",
    valtype: valtype,
    mutability: mutability
  };
  return node;
}

function leadingComment(value) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  var node = {
    type: "LeadingComment",
    value: value
  };
  return node;
}

function blockComment(value) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  var node = {
    type: "BlockComment",
    value: value
  };
  return node;
}

function data(memoryIndex, offset, init) {
  var node = {
    type: "Data",
    memoryIndex: memoryIndex,
    offset: offset,
    init: init
  };
  return node;
}

function global(globalType, init, name) {
  if (!(_typeof(init) === "object" && typeof init.length !== "undefined")) {
    throw new Error('typeof init === "object" && typeof init.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "Global",
    globalType: globalType,
    init: init,
    name: name
  };
  return node;
}

function table(elementType, limits, name, elements) {
  if (!(limits.type === "Limit")) {
    throw new Error('limits.type === "Limit"' + " error: " + ("Argument limits must be of type Limit, given: " + limits.type || "unknown"));
  }

  if (elements !== null && elements !== undefined) {
    if (!(_typeof(elements) === "object" && typeof elements.length !== "undefined")) {
      throw new Error('typeof elements === "object" && typeof elements.length !== "undefined"' + " error: " + (undefined || "unknown"));
    }
  }

  var node = {
    type: "Table",
    elementType: elementType,
    limits: limits,
    name: name
  };

  if (typeof elements !== "undefined" && elements.length > 0) {
    node.elements = elements;
  }

  return node;
}

function memory(limits, id) {
  var node = {
    type: "Memory",
    limits: limits,
    id: id
  };
  return node;
}

function funcImportDescr(id, signature) {
  var node = {
    type: "FuncImportDescr",
    id: id,
    signature: signature
  };
  return node;
}

function moduleImport(module, name, descr) {
  if (!(typeof module === "string")) {
    throw new Error('typeof module === "string"' + " error: " + ("Argument module must be of type string, given: " + _typeof(module) || "unknown"));
  }

  if (!(typeof name === "string")) {
    throw new Error('typeof name === "string"' + " error: " + ("Argument name must be of type string, given: " + _typeof(name) || "unknown"));
  }

  var node = {
    type: "ModuleImport",
    module: module,
    name: name,
    descr: descr
  };
  return node;
}

function moduleExportDescr(exportType, id) {
  var node = {
    type: "ModuleExportDescr",
    exportType: exportType,
    id: id
  };
  return node;
}

function moduleExport(name, descr) {
  if (!(typeof name === "string")) {
    throw new Error('typeof name === "string"' + " error: " + ("Argument name must be of type string, given: " + _typeof(name) || "unknown"));
  }

  var node = {
    type: "ModuleExport",
    name: name,
    descr: descr
  };
  return node;
}

function limit(min, max) {
  if (!(typeof min === "number")) {
    throw new Error('typeof min === "number"' + " error: " + ("Argument min must be of type number, given: " + _typeof(min) || "unknown"));
  }

  if (max !== null && max !== undefined) {
    if (!(typeof max === "number")) {
      throw new Error('typeof max === "number"' + " error: " + ("Argument max must be of type number, given: " + _typeof(max) || "unknown"));
    }
  }

  var node = {
    type: "Limit",
    min: min
  };

  if (typeof max !== "undefined") {
    node.max = max;
  }

  return node;
}

function signature(params, results) {
  if (!(_typeof(params) === "object" && typeof params.length !== "undefined")) {
    throw new Error('typeof params === "object" && typeof params.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  if (!(_typeof(results) === "object" && typeof results.length !== "undefined")) {
    throw new Error('typeof results === "object" && typeof results.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "Signature",
    params: params,
    results: results
  };
  return node;
}

function program(body) {
  if (!(_typeof(body) === "object" && typeof body.length !== "undefined")) {
    throw new Error('typeof body === "object" && typeof body.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "Program",
    body: body
  };
  return node;
}

function identifier(value, raw) {
  if (!(typeof value === "string")) {
    throw new Error('typeof value === "string"' + " error: " + ("Argument value must be of type string, given: " + _typeof(value) || "unknown"));
  }

  if (raw !== null && raw !== undefined) {
    if (!(typeof raw === "string")) {
      throw new Error('typeof raw === "string"' + " error: " + ("Argument raw must be of type string, given: " + _typeof(raw) || "unknown"));
    }
  }

  var node = {
    type: "Identifier",
    value: value
  };

  if (typeof raw !== "undefined") {
    node.raw = raw;
  }

  return node;
}

function blockInstruction(label, instr, result) {
  if (!(_typeof(instr) === "object" && typeof instr.length !== "undefined")) {
    throw new Error('typeof instr === "object" && typeof instr.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "BlockInstruction",
    id: "block",
    label: label,
    instr: instr,
    result: result
  };
  return node;
}

function callInstruction(index, instrArgs) {
  if (instrArgs !== null && instrArgs !== undefined) {
    if (!(_typeof(instrArgs) === "object" && typeof instrArgs.length !== "undefined")) {
      throw new Error('typeof instrArgs === "object" && typeof instrArgs.length !== "undefined"' + " error: " + (undefined || "unknown"));
    }
  }

  var node = {
    type: "CallInstruction",
    id: "call",
    index: index
  };

  if (typeof instrArgs !== "undefined" && instrArgs.length > 0) {
    node.instrArgs = instrArgs;
  }

  return node;
}

function callIndirectInstruction(signature, intrs) {
  if (intrs !== null && intrs !== undefined) {
    if (!(_typeof(intrs) === "object" && typeof intrs.length !== "undefined")) {
      throw new Error('typeof intrs === "object" && typeof intrs.length !== "undefined"' + " error: " + (undefined || "unknown"));
    }
  }

  var node = {
    type: "CallIndirectInstruction",
    id: "call_indirect",
    signature: signature
  };

  if (typeof intrs !== "undefined" && intrs.length > 0) {
    node.intrs = intrs;
  }

  return node;
}

function byteArray(values) {
  if (!(_typeof(values) === "object" && typeof values.length !== "undefined")) {
    throw new Error('typeof values === "object" && typeof values.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  var node = {
    type: "ByteArray",
    values: values
  };
  return node;
}

function func(name, signature, body, isExternal, metadata) {
  if (!(_typeof(body) === "object" && typeof body.length !== "undefined")) {
    throw new Error('typeof body === "object" && typeof body.length !== "undefined"' + " error: " + (undefined || "unknown"));
  }

  if (isExternal !== null && isExternal !== undefined) {
    if (!(typeof isExternal === "boolean")) {
      throw new Error('typeof isExternal === "boolean"' + " error: " + ("Argument isExternal must be of type boolean, given: " + _typeof(isExternal) || "unknown"));
    }
  }

  var node = {
    type: "Func",
    name: name,
    signature: signature,
    body: body
  };

  if (isExternal === true) {
    node.isExternal = true;
  }

  if (typeof metadata !== "undefined") {
    node.metadata = metadata;
  }

  return node;
}

var isModule = isTypeOf("Module");
exports.isModule = isModule;
var isModuleMetadata = isTypeOf("ModuleMetadata");
exports.isModuleMetadata = isModuleMetadata;
var isModuleNameMetadata = isTypeOf("ModuleNameMetadata");
exports.isModuleNameMetadata = isModuleNameMetadata;
var isFunctionNameMetadata = isTypeOf("FunctionNameMetadata");
exports.isFunctionNameMetadata = isFunctionNameMetadata;
var isLocalNameMetadata = isTypeOf("LocalNameMetadata");
exports.isLocalNameMetadata = isLocalNameMetadata;
var isBinaryModule = isTypeOf("BinaryModule");
exports.isBinaryModule = isBinaryModule;
var isQuoteModule = isTypeOf("QuoteModule");
exports.isQuoteModule = isQuoteModule;
var isSectionMetadata = isTypeOf("SectionMetadata");
exports.isSectionMetadata = isSectionMetadata;
var isLoopInstruction = isTypeOf("LoopInstruction");
exports.isLoopInstruction = isLoopInstruction;
var isInstr = isTypeOf("Instr");
exports.isInstr = isInstr;
var isIfInstruction = isTypeOf("IfInstruction");
exports.isIfInstruction = isIfInstruction;
var isStringLiteral = isTypeOf("StringLiteral");
exports.isStringLiteral = isStringLiteral;
var isNumberLiteral = isTypeOf("NumberLiteral");
exports.isNumberLiteral = isNumberLiteral;
var isLongNumberLiteral = isTypeOf("LongNumberLiteral");
exports.isLongNumberLiteral = isLongNumberLiteral;
var isFloatLiteral = isTypeOf("FloatLiteral");
exports.isFloatLiteral = isFloatLiteral;
var isElem = isTypeOf("Elem");
exports.isElem = isElem;
var isIndexInFuncSection = isTypeOf("IndexInFuncSection");
exports.isIndexInFuncSection = isIndexInFuncSection;
var isValtypeLiteral = isTypeOf("ValtypeLiteral");
exports.isValtypeLiteral = isValtypeLiteral;
var isTypeInstruction = isTypeOf("TypeInstruction");
exports.isTypeInstruction = isTypeInstruction;
var isStart = isTypeOf("Start");
exports.isStart = isStart;
var isGlobalType = isTypeOf("GlobalType");
exports.isGlobalType = isGlobalType;
var isLeadingComment = isTypeOf("LeadingComment");
exports.isLeadingComment = isLeadingComment;
var isBlockComment = isTypeOf("BlockComment");
exports.isBlockComment = isBlockComment;
var isData = isTypeOf("Data");
exports.isData = isData;
var isGlobal = isTypeOf("Global");
exports.isGlobal = isGlobal;
var isTable = isTypeOf("Table");
exports.isTable = isTable;
var isMemory = isTypeOf("Memory");
exports.isMemory = isMemory;
var isFuncImportDescr = isTypeOf("FuncImportDescr");
exports.isFuncImportDescr = isFuncImportDescr;
var isModuleImport = isTypeOf("ModuleImport");
exports.isModuleImport = isModuleImport;
var isModuleExportDescr = isTypeOf("ModuleExportDescr");
exports.isModuleExportDescr = isModuleExportDescr;
var isModuleExport = isTypeOf("ModuleExport");
exports.isModuleExport = isModuleExport;
var isLimit = isTypeOf("Limit");
exports.isLimit = isLimit;
var isSignature = isTypeOf("Signature");
exports.isSignature = isSignature;
var isProgram = isTypeOf("Program");
exports.isProgram = isProgram;
var isIdentifier = isTypeOf("Identifier");
exports.isIdentifier = isIdentifier;
var isBlockInstruction = isTypeOf("BlockInstruction");
exports.isBlockInstruction = isBlockInstruction;
var isCallInstruction = isTypeOf("CallInstruction");
exports.isCallInstruction = isCallInstruction;
var isCallIndirectInstruction = isTypeOf("CallIndirectInstruction");
exports.isCallIndirectInstruction = isCallIndirectInstruction;
var isByteArray = isTypeOf("ByteArray");
exports.isByteArray = isByteArray;
var isFunc = isTypeOf("Func");
exports.isFunc = isFunc;

var isNode = function isNode(node) {
  return isModule(node) || isModuleMetadata(node) || isModuleNameMetadata(node) || isFunctionNameMetadata(node) || isLocalNameMetadata(node) || isBinaryModule(node) || isQuoteModule(node) || isSectionMetadata(node) || isLoopInstruction(node) || isInstr(node) || isIfInstruction(node) || isStringLiteral(node) || isNumberLiteral(node) || isLongNumberLiteral(node) || isFloatLiteral(node) || isElem(node) || isIndexInFuncSection(node) || isValtypeLiteral(node) || isTypeInstruction(node) || isStart(node) || isGlobalType(node) || isLeadingComment(node) || isBlockComment(node) || isData(node) || isGlobal(node) || isTable(node) || isMemory(node) || isFuncImportDescr(node) || isModuleImport(node) || isModuleExportDescr(node) || isModuleExport(node) || isLimit(node) || isSignature(node) || isProgram(node) || isIdentifier(node) || isBlockInstruction(node) || isCallInstruction(node) || isCallIndirectInstruction(node) || isByteArray(node) || isFunc(node);
};

exports.isNode = isNode;

var isBlock = function isBlock(node) {
  return isLoopInstruction(node) || isBlockInstruction(node) || isFunc(node);
};

exports.isBlock = isBlock;

var isInstruction = function isInstruction(node) {
  return isLoopInstruction(node) || isInstr(node) || isIfInstruction(node) || isTypeInstruction(node) || isBlockInstruction(node) || isCallInstruction(node) || isCallIndirectInstruction(node);
};

exports.isInstruction = isInstruction;

var isExpression = function isExpression(node) {
  return isInstr(node) || isStringLiteral(node) || isNumberLiteral(node) || isLongNumberLiteral(node) || isFloatLiteral(node) || isValtypeLiteral(node) || isIdentifier(node);
};

exports.isExpression = isExpression;

var isNumericLiteral = function isNumericLiteral(node) {
  return isNumberLiteral(node) || isLongNumberLiteral(node) || isFloatLiteral(node);
};

exports.isNumericLiteral = isNumericLiteral;

var isImportDescr = function isImportDescr(node) {
  return isGlobalType(node) || isTable(node) || isMemory(node) || isFuncImportDescr(node);
};

exports.isImportDescr = isImportDescr;
var assertModule = assertTypeOf("Module");
exports.assertModule = assertModule;
var assertModuleMetadata = assertTypeOf("ModuleMetadata");
exports.assertModuleMetadata = assertModuleMetadata;
var assertModuleNameMetadata = assertTypeOf("ModuleNameMetadata");
exports.assertModuleNameMetadata = assertModuleNameMetadata;
var assertFunctionNameMetadata = assertTypeOf("FunctionNameMetadata");
exports.assertFunctionNameMetadata = assertFunctionNameMetadata;
var assertLocalNameMetadata = assertTypeOf("LocalNameMetadata");
exports.assertLocalNameMetadata = assertLocalNameMetadata;
var assertBinaryModule = assertTypeOf("BinaryModule");
exports.assertBinaryModule = assertBinaryModule;
var assertQuoteModule = assertTypeOf("QuoteModule");
exports.assertQuoteModule = assertQuoteModule;
var assertSectionMetadata = assertTypeOf("SectionMetadata");
exports.assertSectionMetadata = assertSectionMetadata;
var assertLoopInstruction = assertTypeOf("LoopInstruction");
exports.assertLoopInstruction = assertLoopInstruction;
var assertInstr = assertTypeOf("Instr");
exports.assertInstr = assertInstr;
var assertIfInstruction = assertTypeOf("IfInstruction");
exports.assertIfInstruction = assertIfInstruction;
var assertStringLiteral = assertTypeOf("StringLiteral");
exports.assertStringLiteral = assertStringLiteral;
var assertNumberLiteral = assertTypeOf("NumberLiteral");
exports.assertNumberLiteral = assertNumberLiteral;
var assertLongNumberLiteral = assertTypeOf("LongNumberLiteral");
exports.assertLongNumberLiteral = assertLongNumberLiteral;
var assertFloatLiteral = assertTypeOf("FloatLiteral");
exports.assertFloatLiteral = assertFloatLiteral;
var assertElem = assertTypeOf("Elem");
exports.assertElem = assertElem;
var assertIndexInFuncSection = assertTypeOf("IndexInFuncSection");
exports.assertIndexInFuncSection = assertIndexInFuncSection;
var assertValtypeLiteral = assertTypeOf("ValtypeLiteral");
exports.assertValtypeLiteral = assertValtypeLiteral;
var assertTypeInstruction = assertTypeOf("TypeInstruction");
exports.assertTypeInstruction = assertTypeInstruction;
var assertStart = assertTypeOf("Start");
exports.assertStart = assertStart;
var assertGlobalType = assertTypeOf("GlobalType");
exports.assertGlobalType = assertGlobalType;
var assertLeadingComment = assertTypeOf("LeadingComment");
exports.assertLeadingComment = assertLeadingComment;
var assertBlockComment = assertTypeOf("BlockComment");
exports.assertBlockComment = assertBlockComment;
var assertData = assertTypeOf("Data");
exports.assertData = assertData;
var assertGlobal = assertTypeOf("Global");
exports.assertGlobal = assertGlobal;
var assertTable = assertTypeOf("Table");
exports.assertTable = assertTable;
var assertMemory = assertTypeOf("Memory");
exports.assertMemory = assertMemory;
var assertFuncImportDescr = assertTypeOf("FuncImportDescr");
exports.assertFuncImportDescr = assertFuncImportDescr;
var assertModuleImport = assertTypeOf("ModuleImport");
exports.assertModuleImport = assertModuleImport;
var assertModuleExportDescr = assertTypeOf("ModuleExportDescr");
exports.assertModuleExportDescr = assertModuleExportDescr;
var assertModuleExport = assertTypeOf("ModuleExport");
exports.assertModuleExport = assertModuleExport;
var assertLimit = assertTypeOf("Limit");
exports.assertLimit = assertLimit;
var assertSignature = assertTypeOf("Signature");
exports.assertSignature = assertSignature;
var assertProgram = assertTypeOf("Program");
exports.assertProgram = assertProgram;
var assertIdentifier = assertTypeOf("Identifier");
exports.assertIdentifier = assertIdentifier;
var assertBlockInstruction = assertTypeOf("BlockInstruction");
exports.assertBlockInstruction = assertBlockInstruction;
var assertCallInstruction = assertTypeOf("CallInstruction");
exports.assertCallInstruction = assertCallInstruction;
var assertCallIndirectInstruction = assertTypeOf("CallIndirectInstruction");
exports.assertCallIndirectInstruction = assertCallIndirectInstruction;
var assertByteArray = assertTypeOf("ByteArray");
exports.assertByteArray = assertByteArray;
var assertFunc = assertTypeOf("Func");
exports.assertFunc = assertFunc;
var unionTypesMap = {
  Module: ["Node"],
  ModuleMetadata: ["Node"],
  ModuleNameMetadata: ["Node"],
  FunctionNameMetadata: ["Node"],
  LocalNameMetadata: ["Node"],
  BinaryModule: ["Node"],
  QuoteModule: ["Node"],
  SectionMetadata: ["Node"],
  LoopInstruction: ["Node", "Block", "Instruction"],
  Instr: ["Node", "Expression", "Instruction"],
  IfInstruction: ["Node", "Instruction"],
  StringLiteral: ["Node", "Expression"],
  NumberLiteral: ["Node", "NumericLiteral", "Expression"],
  LongNumberLiteral: ["Node", "NumericLiteral", "Expression"],
  FloatLiteral: ["Node", "NumericLiteral", "Expression"],
  Elem: ["Node"],
  IndexInFuncSection: ["Node"],
  ValtypeLiteral: ["Node", "Expression"],
  TypeInstruction: ["Node", "Instruction"],
  Start: ["Node"],
  GlobalType: ["Node", "ImportDescr"],
  LeadingComment: ["Node"],
  BlockComment: ["Node"],
  Data: ["Node"],
  Global: ["Node"],
  Table: ["Node", "ImportDescr"],
  Memory: ["Node", "ImportDescr"],
  FuncImportDescr: ["Node", "ImportDescr"],
  ModuleImport: ["Node"],
  ModuleExportDescr: ["Node"],
  ModuleExport: ["Node"],
  Limit: ["Node"],
  Signature: ["Node"],
  Program: ["Node"],
  Identifier: ["Node", "Expression"],
  BlockInstruction: ["Node", "Block", "Instruction"],
  CallInstruction: ["Node", "Instruction"],
  CallIndirectInstruction: ["Node", "Instruction"],
  ByteArray: ["Node"],
  Func: ["Node", "Block"]
};
exports.unionTypesMap = unionTypesMap;
var nodeAndUnionTypes = ["Module", "ModuleMetadata", "ModuleNameMetadata", "FunctionNameMetadata", "LocalNameMetadata", "BinaryModule", "QuoteModule", "SectionMetadata", "LoopInstruction", "Instr", "IfInstruction", "StringLiteral", "NumberLiteral", "LongNumberLiteral", "FloatLiteral", "Elem", "IndexInFuncSection", "ValtypeLiteral", "TypeInstruction", "Start", "GlobalType", "LeadingComment", "BlockComment", "Data", "Global", "Table", "Memory", "FuncImportDescr", "ModuleImport", "ModuleExportDescr", "ModuleExport", "Limit", "Signature", "Program", "Identifier", "BlockInstruction", "CallInstruction", "CallIndirectInstruction", "ByteArray", "Func", "Node", "Block", "Instruction", "Expression", "NumericLiteral", "ImportDescr"];
exports.nodeAndUnionTypes = nodeAndUnionTypes;
},{}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signatures = void 0;

function sign(input, output) {
  return [input, output];
}

var u32 = "u32";
var i32 = "i32";
var i64 = "i64";
var f32 = "f32";
var f64 = "f64";

var vector = function vector(t) {
  var vecType = [t]; // $FlowIgnore

  vecType.vector = true;
  return vecType;
};

var controlInstructions = {
  unreachable: sign([], []),
  nop: sign([], []),
  // block ?
  // loop ?
  // if ?
  // if else ?
  br: sign([u32], []),
  br_if: sign([u32], []),
  br_table: sign(vector(u32), []),
  return: sign([], []),
  call: sign([u32], []),
  call_indirect: sign([u32], [])
};
var parametricInstructions = {
  drop: sign([], []),
  select: sign([], [])
};
var variableInstructions = {
  get_local: sign([u32], []),
  set_local: sign([u32], []),
  tee_local: sign([u32], []),
  get_global: sign([u32], []),
  set_global: sign([u32], [])
};
var memoryInstructions = {
  "i32.load": sign([u32, u32], [i32]),
  "i64.load": sign([u32, u32], []),
  "f32.load": sign([u32, u32], []),
  "f64.load": sign([u32, u32], []),
  "i32.load8_s": sign([u32, u32], [i32]),
  "i32.load8_u": sign([u32, u32], [i32]),
  "i32.load16_s": sign([u32, u32], [i32]),
  "i32.load16_u": sign([u32, u32], [i32]),
  "i64.load8_s": sign([u32, u32], [i64]),
  "i64.load8_u": sign([u32, u32], [i64]),
  "i64.load16_s": sign([u32, u32], [i64]),
  "i64.load16_u": sign([u32, u32], [i64]),
  "i64.load32_s": sign([u32, u32], [i64]),
  "i64.load32_u": sign([u32, u32], [i64]),
  "i32.store": sign([u32, u32], []),
  "i64.store": sign([u32, u32], []),
  "f32.store": sign([u32, u32], []),
  "f64.store": sign([u32, u32], []),
  "i32.store8": sign([u32, u32], []),
  "i32.store16": sign([u32, u32], []),
  "i64.store8": sign([u32, u32], []),
  "i64.store16": sign([u32, u32], []),
  "i64.store32": sign([u32, u32], []),
  current_memory: sign([], []),
  grow_memory: sign([], [])
};
var numericInstructions = {
  "i32.const": sign([i32], [i32]),
  "i64.const": sign([i64], [i64]),
  "f32.const": sign([f32], [f32]),
  "f64.const": sign([f64], [f64]),
  "i32.eqz": sign([i32], [i32]),
  "i32.eq": sign([i32, i32], [i32]),
  "i32.ne": sign([i32, i32], [i32]),
  "i32.lt_s": sign([i32, i32], [i32]),
  "i32.lt_u": sign([i32, i32], [i32]),
  "i32.gt_s": sign([i32, i32], [i32]),
  "i32.gt_u": sign([i32, i32], [i32]),
  "i32.le_s": sign([i32, i32], [i32]),
  "i32.le_u": sign([i32, i32], [i32]),
  "i32.ge_s": sign([i32, i32], [i32]),
  "i32.ge_u": sign([i32, i32], [i32]),
  "i64.eqz": sign([i64], [i64]),
  "i64.eq": sign([i64, i64], [i32]),
  "i64.ne": sign([i64, i64], [i32]),
  "i64.lt_s": sign([i64, i64], [i32]),
  "i64.lt_u": sign([i64, i64], [i32]),
  "i64.gt_s": sign([i64, i64], [i32]),
  "i64.gt_u": sign([i64, i64], [i32]),
  "i64.le_s": sign([i64, i64], [i32]),
  "i64.le_u": sign([i64, i64], [i32]),
  "i64.ge_s": sign([i64, i64], [i32]),
  "i64.ge_u": sign([i64, i64], [i32]),
  "f32.eq": sign([f32, f32], [i32]),
  "f32.ne": sign([f32, f32], [i32]),
  "f32.lt": sign([f32, f32], [i32]),
  "f32.gt": sign([f32, f32], [i32]),
  "f32.le": sign([f32, f32], [i32]),
  "f32.ge": sign([f32, f32], [i32]),
  "f64.eq": sign([f64, f64], [i32]),
  "f64.ne": sign([f64, f64], [i32]),
  "f64.lt": sign([f64, f64], [i32]),
  "f64.gt": sign([f64, f64], [i32]),
  "f64.le": sign([f64, f64], [i32]),
  "f64.ge": sign([f64, f64], [i32]),
  "i32.clz": sign([i32], [i32]),
  "i32.ctz": sign([i32], [i32]),
  "i32.popcnt": sign([i32], [i32]),
  "i32.add": sign([i32, i32], [i32]),
  "i32.sub": sign([i32, i32], [i32]),
  "i32.mul": sign([i32, i32], [i32]),
  "i32.div_s": sign([i32, i32], [i32]),
  "i32.div_u": sign([i32, i32], [i32]),
  "i32.rem_s": sign([i32, i32], [i32]),
  "i32.rem_u": sign([i32, i32], [i32]),
  "i32.and": sign([i32, i32], [i32]),
  "i32.or": sign([i32, i32], [i32]),
  "i32.xor": sign([i32, i32], [i32]),
  "i32.shl": sign([i32, i32], [i32]),
  "i32.shr_s": sign([i32, i32], [i32]),
  "i32.shr_u": sign([i32, i32], [i32]),
  "i32.rotl": sign([i32, i32], [i32]),
  "i32.rotr": sign([i32, i32], [i32]),
  "i64.clz": sign([i64], [i64]),
  "i64.ctz": sign([i64], [i64]),
  "i64.popcnt": sign([i64], [i64]),
  "i64.add": sign([i64, i64], [i64]),
  "i64.sub": sign([i64, i64], [i64]),
  "i64.mul": sign([i64, i64], [i64]),
  "i64.div_s": sign([i64, i64], [i64]),
  "i64.div_u": sign([i64, i64], [i64]),
  "i64.rem_s": sign([i64, i64], [i64]),
  "i64.rem_u": sign([i64, i64], [i64]),
  "i64.and": sign([i64, i64], [i64]),
  "i64.or": sign([i64, i64], [i64]),
  "i64.xor": sign([i64, i64], [i64]),
  "i64.shl": sign([i64, i64], [i64]),
  "i64.shr_s": sign([i64, i64], [i64]),
  "i64.shr_u": sign([i64, i64], [i64]),
  "i64.rotl": sign([i64, i64], [i64]),
  "i64.rotr": sign([i64, i64], [i64]),
  "f32.abs": sign([f32], [f32]),
  "f32.neg": sign([f32], [f32]),
  "f32.ceil": sign([f32], [f32]),
  "f32.floor": sign([f32], [f32]),
  "f32.trunc": sign([f32], [f32]),
  "f32.nearest": sign([f32], [f32]),
  "f32.sqrt": sign([f32], [f32]),
  "f32.add": sign([f32, f32], [f32]),
  "f32.sub": sign([f32, f32], [f32]),
  "f32.mul": sign([f32, f32], [f32]),
  "f32.div": sign([f32, f32], [f32]),
  "f32.min": sign([f32, f32], [f32]),
  "f32.max": sign([f32, f32], [f32]),
  "f32.copysign": sign([f32, f32], [f32]),
  "f64.abs": sign([f64], [f64]),
  "f64.neg": sign([f64], [f64]),
  "f64.ceil": sign([f64], [f64]),
  "f64.floor": sign([f64], [f64]),
  "f64.trunc": sign([f64], [f64]),
  "f64.nearest": sign([f64], [f64]),
  "f64.sqrt": sign([f64], [f64]),
  "f64.add": sign([f64, f64], [f64]),
  "f64.sub": sign([f64, f64], [f64]),
  "f64.mul": sign([f64, f64], [f64]),
  "f64.div": sign([f64, f64], [f64]),
  "f64.min": sign([f64, f64], [f64]),
  "f64.max": sign([f64, f64], [f64]),
  "f64.copysign": sign([f64, f64], [f64]),
  "i32.wrap/i64": sign([i64], [i32]),
  "i32.trunc_s/f32": sign([f32], [i32]),
  "i32.trunc_u/f32": sign([f32], [i32]),
  "i32.trunc_s/f64": sign([f32], [i32]),
  "i32.trunc_u/f64": sign([f64], [i32]),
  "i64.extend_s/i32": sign([i32], [i64]),
  "i64.extend_u/i32": sign([i32], [i64]),
  "i64.trunc_s/f32": sign([f32], [i64]),
  "i64.trunc_u/f32": sign([f32], [i64]),
  "i64.trunc_s/f64": sign([f64], [i64]),
  "i64.trunc_u/f64": sign([f64], [i64]),
  "f32.convert_s/i32": sign([i32], [f32]),
  "f32.convert_u/i32": sign([i32], [f32]),
  "f32.convert_s/i64": sign([i64], [f32]),
  "f32.convert_u/i64": sign([i64], [f32]),
  "f32.demote/f64": sign([f64], [f32]),
  "f64.convert_s/i32": sign([i32], [f64]),
  "f64.convert_u/i32": sign([i32], [f64]),
  "f64.convert_s/i64": sign([i64], [f64]),
  "f64.convert_u/i64": sign([i64], [f64]),
  "f64.promote/f32": sign([f32], [f64]),
  "i32.reinterpret/f32": sign([f32], [i32]),
  "i64.reinterpret/f64": sign([f64], [i64]),
  "f32.reinterpret/i32": sign([i32], [f32]),
  "f64.reinterpret/i64": sign([i64], [f64])
};
var signatures = Object.assign({}, controlInstructions, parametricInstructions, variableInstructions, memoryInstructions, numericInstructions);
exports.signatures = signatures;
},{}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;

var t = require("../../index"); // func and call_indirect instructions can either define a signature inline, or
// reference a signature, e.g.
//
// ;; inline signature
// (func (result i64)
//   (i64.const 2)
// )
// ;; signature reference
// (type (func (result i64)))
// (func (type 0)
//   (i64.const 2))
// )
//
// this AST transform denormalises the type references, making all signatures within the module
// inline.


function transform(ast) {
  var typeInstructions = [];
  t.traverse(ast, {
    TypeInstruction: function TypeInstruction(_ref) {
      var node = _ref.node;
      typeInstructions.push(node);
    }
  });

  if (!typeInstructions.length) {
    return;
  }

  function denormalizeSignature(signature) {
    // signature referenced by identifier
    if (signature.type === "Identifier") {
      var identifier = signature;
      var typeInstruction = typeInstructions.find(function (t) {
        return t.id.type === identifier.type && t.id.value === identifier.value;
      });

      if (!typeInstruction) {
        throw new Error("A type instruction reference was not found ".concat(JSON.stringify(signature)));
      }

      return typeInstruction.functype;
    } // signature referenced by index


    if (signature.type === "NumberLiteral") {
      var signatureRef = signature;
      var _typeInstruction = typeInstructions[signatureRef.value];
      return _typeInstruction.functype;
    }

    return signature;
  }

  t.traverse(ast, {
    Func: function (_Func) {
      function Func(_x) {
        return _Func.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func.toString();
      };

      return Func;
    }(function (_ref2) {
      var node = _ref2.node;
      node.signature = denormalizeSignature(node.signature);
    }),
    CallIndirectInstruction: function CallIndirectInstruction(_ref3) {
      var node = _ref3.node;
      node.signature = denormalizeSignature(node.signature);
    }
  });
}
},{"../../index":29}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;

var _index = require("../../index");

var _helperModuleContext = require("@webassemblyjs/helper-module-context");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

// FIXME(sven): do the same with all block instructions, must be more generic here
function newUnexpectedFunction(i) {
  return new Error("unknown function at offset: " + i);
}

function transform(ast) {
  var module;
  (0, _index.traverse)(ast, {
    Module: function (_Module) {
      function Module(_x) {
        return _Module.apply(this, arguments);
      }

      Module.toString = function () {
        return _Module.toString();
      };

      return Module;
    }(function (path) {
      module = path.node;
    })
  });
  var moduleContext = (0, _helperModuleContext.moduleContextFromModuleAST)(module); // Transform the actual instruction in function bodies

  (0, _index.traverse)(ast, {
    Func: function (_Func) {
      function Func(_x2) {
        return _Func.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func.toString();
      };

      return Func;
    }(function (path) {
      transformFuncPath(path, moduleContext);
    }),
    Start: function (_Start) {
      function Start(_x3) {
        return _Start.apply(this, arguments);
      }

      Start.toString = function () {
        return _Start.toString();
      };

      return Start;
    }(function (path) {
      var index = path.node.index;

      if ((0, _index.isIdentifier)(index) === true) {
        var offsetInModule = moduleContext.getFunctionOffsetByIdentifier(index.value);

        if (typeof offsetInModule === "undefined") {
          throw newUnexpectedFunction(index.value);
        } // Replace the index Identifier
        // $FlowIgnore: reference?


        path.node.index = (0, _index.numberLiteralFromRaw)(offsetInModule);
      }
    })
  });
}

function transformFuncPath(funcPath, moduleContext) {
  var funcNode = funcPath.node;
  var signature = funcNode.signature;

  if (signature.type !== "Signature") {
    throw new Error("Function signatures must be denormalised before execution");
  }

  var params = signature.params; // Add func locals in the context

  params.forEach(function (p) {
    return moduleContext.addLocal(p.valtype);
  });
  (0, _index.traverse)(funcNode, {
    Instr: function (_Instr) {
      function Instr(_x4) {
        return _Instr.apply(this, arguments);
      }

      Instr.toString = function () {
        return _Instr.toString();
      };

      return Instr;
    }(function (instrPath) {
      var instrNode = instrPath.node;
      /**
       * Local access
       */

      if (instrNode.id === "get_local" || instrNode.id === "set_local" || instrNode.id === "tee_local") {
        var _instrNode$args = _slicedToArray(instrNode.args, 1),
            firstArg = _instrNode$args[0];

        if (firstArg.type === "Identifier") {
          var offsetInParams = params.findIndex(function (_ref) {
            var id = _ref.id;
            return id === firstArg.value;
          });

          if (offsetInParams === -1) {
            throw new Error("".concat(firstArg.value, " not found in ").concat(instrNode.id, ": not declared in func params"));
          } // Replace the Identifer node by our new NumberLiteral node


          instrNode.args[0] = (0, _index.numberLiteralFromRaw)(offsetInParams);
        }
      }
      /**
       * Global access
       */


      if (instrNode.id === "get_global" || instrNode.id === "set_global") {
        var _instrNode$args2 = _slicedToArray(instrNode.args, 1),
            _firstArg = _instrNode$args2[0];

        if ((0, _index.isIdentifier)(_firstArg) === true) {
          var globalOffset = moduleContext.getGlobalOffsetByIdentifier( // $FlowIgnore: reference?
          _firstArg.value);

          if (typeof globalOffset === "undefined") {
            // $FlowIgnore: reference?
            throw new Error("global ".concat(_firstArg.value, " not found in module"));
          } // Replace the Identifer node by our new NumberLiteral node


          instrNode.args[0] = (0, _index.numberLiteralFromRaw)(globalOffset);
        }
      }
      /**
       * Labels lookup
       */


      if (instrNode.id === "br") {
        var _instrNode$args3 = _slicedToArray(instrNode.args, 1),
            _firstArg2 = _instrNode$args3[0];

        if ((0, _index.isIdentifier)(_firstArg2) === true) {
          // if the labels is not found it is going to be replaced with -1
          // which is invalid.
          var relativeBlockCount = -1; // $FlowIgnore: reference?

          instrPath.findParent(function (_ref2) {
            var node = _ref2.node;

            if ((0, _index.isBlock)(node)) {
              relativeBlockCount++; // $FlowIgnore: reference?

              var name = node.label || node.name;

              if (_typeof(name) === "object") {
                // $FlowIgnore: isIdentifier ensures that
                if (name.value === _firstArg2.value) {
                  // Found it
                  return false;
                }
              }
            }

            if ((0, _index.isFunc)(node)) {
              return false;
            }
          }); // Replace the Identifer node by our new NumberLiteral node

          instrNode.args[0] = (0, _index.numberLiteralFromRaw)(relativeBlockCount);
        }
      }
    }),

    /**
     * Func lookup
     */
    CallInstruction: function (_CallInstruction) {
      function CallInstruction(_x5) {
        return _CallInstruction.apply(this, arguments);
      }

      CallInstruction.toString = function () {
        return _CallInstruction.toString();
      };

      return CallInstruction;
    }(function (_ref3) {
      var node = _ref3.node;
      var index = node.index;

      if ((0, _index.isIdentifier)(index) === true) {
        var offsetInModule = moduleContext.getFunctionOffsetByIdentifier(index.value);

        if (typeof offsetInModule === "undefined") {
          throw newUnexpectedFunction(index.value);
        } // Replace the index Identifier
        // $FlowIgnore: reference?


        node.index = (0, _index.numberLiteralFromRaw)(offsetInModule);
      }
    })
  });
}
},{"../../index":29,"@webassemblyjs/helper-module-context":42}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.traverse = traverse;

var _nodePath = require("./node-path");

var _nodes = require("./nodes");

// recursively walks the AST starting at the given node. The callback is invoked for
// and object that has a 'type' property.
function walk(context, callback) {
  var stop = false;

  function innerWalk(context, callback) {
    if (stop) {
      return;
    }

    var node = context.node;

    if (node._deleted === true) {
      return;
    }

    var path = (0, _nodePath.createPath)(context);
    callback(node.type, path);

    if (path.shouldStop) {
      stop = true;
      return;
    }

    Object.keys(node).forEach(function (prop) {
      var value = node[prop];

      if (value === null || value === undefined) {
        return;
      }

      var valueAsArray = Array.isArray(value) ? value : [value];
      valueAsArray.forEach(function (childNode) {
        if (typeof childNode.type === "string") {
          var childContext = {
            node: childNode,
            parentKey: prop,
            parentPath: path,
            shouldStop: false,
            inList: Array.isArray(value)
          };
          innerWalk(childContext, callback);
        }
      });
    });
  }

  innerWalk(context, callback);
}

var noop = function noop() {};

function traverse(node, visitors) {
  var before = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
  var after = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : noop;
  Object.keys(visitors).forEach(function (visitor) {
    if (!_nodes.nodeAndUnionTypes.includes(visitor)) {
      throw new Error("Unexpected visitor ".concat(visitor));
    }
  });
  var context = {
    node: node,
    inList: false,
    shouldStop: false,
    parentPath: null,
    parentKey: null
  };
  walk(context, function (type, path) {
    if (typeof visitors[type] === "function") {
      before(type, path);
      visitors[type](path);
      after(type, path);
    }

    var unionTypes = _nodes.unionTypesMap[type];

    if (!unionTypes) {
      throw new Error("Unexpected node type ".concat(type));
    }

    unionTypes.forEach(function (unionType) {
      if (typeof visitors[unionType] === "function") {
        before(unionType, path);
        visitors[unionType](path);
        after(unionType, path);
      }
    });
  });
}
},{"./node-path":31,"./nodes":32}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isAnonymous = isAnonymous;
exports.getSectionMetadata = getSectionMetadata;
exports.sortSectionMetadata = sortSectionMetadata;
exports.orderedInsertNode = orderedInsertNode;
exports.assertHasLoc = assertHasLoc;
exports.getEndOfSection = getEndOfSection;
exports.shiftLoc = shiftLoc;
exports.shiftSection = shiftSection;
exports.signatureForOpcode = signatureForOpcode;
exports.getUniqueNameGenerator = getUniqueNameGenerator;

var _signatures = require("./signatures");

var _traverse = require("./traverse");

var _helperWasmBytecode = _interopRequireWildcard(require("@webassemblyjs/helper-wasm-bytecode"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function isAnonymous(ident) {
  return ident.raw === "";
}

function getSectionMetadata(ast, name) {
  var section;
  (0, _traverse.traverse)(ast, {
    SectionMetadata: function (_SectionMetadata) {
      function SectionMetadata(_x) {
        return _SectionMetadata.apply(this, arguments);
      }

      SectionMetadata.toString = function () {
        return _SectionMetadata.toString();
      };

      return SectionMetadata;
    }(function (_ref) {
      var node = _ref.node;

      if (node.section === name) {
        section = node;
      }
    })
  });
  return section;
}

function sortSectionMetadata(m) {
  if (m.metadata == null) {
    console.warn("sortSectionMetadata: no metadata to sort");
    return;
  } // $FlowIgnore


  m.metadata.sections.sort(function (a, b) {
    var aId = _helperWasmBytecode.default.sections[a.section];
    var bId = _helperWasmBytecode.default.sections[b.section];

    if (typeof aId !== "number" || typeof bId !== "number") {
      throw new Error("Section id not found");
    }

    return aId > bId;
  });
}

function orderedInsertNode(m, n) {
  assertHasLoc(n);
  var didInsert = false;

  if (n.type === "ModuleExport") {
    m.fields.push(n);
    return;
  }

  m.fields = m.fields.reduce(function (acc, field) {
    var fieldEndCol = Infinity;

    if (field.loc != null) {
      // $FlowIgnore
      fieldEndCol = field.loc.end.column;
    } // $FlowIgnore: assertHasLoc ensures that


    if (didInsert === false && n.loc.start.column < fieldEndCol) {
      didInsert = true;
      acc.push(n);
    }

    acc.push(field);
    return acc;
  }, []); // Handles empty modules or n is the last element

  if (didInsert === false) {
    m.fields.push(n);
  }
}

function assertHasLoc(n) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error("Internal failure: node (".concat(JSON.stringify(n.type), ") has no location information"));
  }
}

function getEndOfSection(s) {
  assertHasLoc(s.size);
  return s.startOffset + s.size.value + ( // $FlowIgnore
  s.size.loc.end.column - s.size.loc.start.column);
}

function shiftLoc(node, delta) {
  // $FlowIgnore
  node.loc.start.column += delta; // $FlowIgnore

  node.loc.end.column += delta;
}

function shiftSection(ast, node, delta) {
  if (node.type !== "SectionMetadata") {
    throw new Error("Can not shift node " + JSON.stringify(node.type));
  }

  node.startOffset += delta;

  if (_typeof(node.size.loc) === "object") {
    shiftLoc(node.size, delta);
  } // Custom sections doesn't have vectorOfSize


  if (_typeof(node.vectorOfSize) === "object" && _typeof(node.vectorOfSize.loc) === "object") {
    shiftLoc(node.vectorOfSize, delta);
  }

  var sectionName = node.section; // shift node locations within that section

  (0, _traverse.traverse)(ast, {
    Node: function Node(_ref2) {
      var node = _ref2.node;
      var section = (0, _helperWasmBytecode.getSectionForNode)(node);

      if (section === sectionName && _typeof(node.loc) === "object") {
        shiftLoc(node, delta);
      }
    }
  });
}

function signatureForOpcode(object, name) {
  var opcodeName = name;

  if (object !== undefined && object !== "") {
    opcodeName = object + "." + name;
  }

  var sign = _signatures.signatures[opcodeName];

  if (sign == undefined) {
    // TODO: Uncomment this when br_table and others has been done
    //throw new Error("Invalid opcode: "+opcodeName);
    return [object, object];
  }

  return sign[0];
}

function getUniqueNameGenerator() {
  var inc = {};
  return function () {
    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "temp";

    if (!(prefix in inc)) {
      inc[prefix] = 0;
    } else {
      inc[prefix] = inc[prefix] + 1;
    }

    return prefix + "_" + inc[prefix];
  };
}
},{"./signatures":33,"./traverse":36,"@webassemblyjs/helper-wasm-bytecode":43}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parse;

function parse(input) {
  input = input.toUpperCase();
  var splitIndex = input.indexOf("P");
  var mantissa, exponent;

  if (splitIndex !== -1) {
    mantissa = input.substring(0, splitIndex);
    exponent = parseInt(input.substring(splitIndex + 1));
  } else {
    mantissa = input;
    exponent = 0;
  }

  var dotIndex = mantissa.indexOf(".");

  if (dotIndex !== -1) {
    var integerPart = parseInt(mantissa.substring(0, dotIndex), 16);
    var sign = Math.sign(integerPart);
    integerPart = sign * integerPart;
    var fractionLength = mantissa.length - dotIndex - 1;
    var fractionalPart = parseInt(mantissa.substring(dotIndex + 1), 16);
    var fraction = fractionLength > 0 ? fractionalPart / Math.pow(16, fractionLength) : 0;

    if (sign === 0) {
      if (fraction === 0) {
        mantissa = sign;
      } else {
        if (Object.is(sign, -0)) {
          mantissa = -fraction;
        } else {
          mantissa = fraction;
        }
      }
    } else {
      mantissa = sign * (integerPart + fraction);
    }
  } else {
    mantissa = parseInt(mantissa, 16);
  }

  return mantissa * (splitIndex !== -1 ? Math.pow(2, exponent) : 1);
}
},{}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LinkError = exports.CompileError = exports.RuntimeError = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RuntimeError =
/*#__PURE__*/
function (_Error) {
  _inherits(RuntimeError, _Error);

  function RuntimeError() {
    _classCallCheck(this, RuntimeError);

    return _possibleConstructorReturn(this, (RuntimeError.__proto__ || Object.getPrototypeOf(RuntimeError)).apply(this, arguments));
  }

  return RuntimeError;
}(Error);

exports.RuntimeError = RuntimeError;

var CompileError =
/*#__PURE__*/
function (_Error2) {
  _inherits(CompileError, _Error2);

  function CompileError() {
    _classCallCheck(this, CompileError);

    return _possibleConstructorReturn(this, (CompileError.__proto__ || Object.getPrototypeOf(CompileError)).apply(this, arguments));
  }

  return CompileError;
}(Error);

exports.CompileError = CompileError;

var LinkError =
/*#__PURE__*/
function (_Error3) {
  _inherits(LinkError, _Error3);

  function LinkError() {
    _classCallCheck(this, LinkError);

    return _possibleConstructorReturn(this, (LinkError.__proto__ || Object.getPrototypeOf(LinkError)).apply(this, arguments));
  }

  return LinkError;
}(Error);

exports.LinkError = LinkError;
},{}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.codeFrameFromAst = codeFrameFromAst;
exports.codeFrameFromSource = codeFrameFromSource;

var _wastPrinter = require("@webassemblyjs/wast-printer");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var SHOW_LINES_AROUND_POINTER = 5;

function repeat(char, nb) {
  return Array(nb).fill(char).join("");
} // TODO(sven): allow arbitrary ast nodes


function codeFrameFromAst(ast, loc) {
  return codeFrameFromSource((0, _wastPrinter.print)(ast), loc);
}

function codeFrameFromSource(source, loc) {
  var start = loc.start,
      end = loc.end;
  var length = 1;

  if (_typeof(end) === "object") {
    length = end.column - start.column + 1;
  }

  return source.split("\n").reduce(function (acc, line, lineNbr) {
    if (Math.abs(start.line - lineNbr) < SHOW_LINES_AROUND_POINTER) {
      acc += line + "\n";
    } // Add a new line with the pointer padded left


    if (lineNbr === start.line - 1) {
      acc += repeat(" ", start.column - 1);
      acc += repeat("^", length);
      acc += "\n";
    }

    return acc;
  }, "");
}
},{"@webassemblyjs/wast-printer":67}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeTransition = makeTransition;
exports.FSM = void 0;

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var STOP = Symbol("STOP");

function makeTransition(regex, nextState) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$n = _ref.n,
      n = _ref$n === void 0 ? 1 : _ref$n,
      allowedSeparator = _ref.allowedSeparator;

  return function (instance) {
    if (allowedSeparator) {
      if (instance.input[instance.ptr] === allowedSeparator) {
        if (regex.test(instance.input.substring(instance.ptr - 1, instance.ptr))) {
          // Consume the separator and stay in current state
          return [instance.currentState, 1];
        } else {
          return [instance.terminatingState, 0];
        }
      }
    }

    if (regex.test(instance.input.substring(instance.ptr, instance.ptr + n))) {
      return [nextState, n];
    }

    return false;
  };
}

function combineTransitions(transitions) {
  return function () {
    var match = false;
    var currentTransitions = transitions[this.currentState] || [];

    for (var i = 0; i < currentTransitions.length; ++i) {
      match = currentTransitions[i](this);

      if (match !== false) {
        break;
      }
    }

    return match || [this.terminatingState, 0];
  };
}

var FSM =
/*#__PURE__*/
function () {
  function FSM(transitions, initialState) {
    var terminatingState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : STOP;

    _classCallCheck(this, FSM);

    this.initialState = initialState;
    this.terminatingState = terminatingState;

    if (terminatingState === STOP || !transitions[terminatingState]) {
      transitions[terminatingState] = [];
    }

    this.transitionFunction = combineTransitions.call(this, transitions);
  }

  _createClass(FSM, [{
    key: "run",
    value: function run(input) {
      this.input = input;
      this.ptr = 0;
      this.currentState = this.initialState;
      var value = "";
      var eatLength, nextState;

      while (this.currentState !== this.terminatingState && this.ptr < this.input.length) {
        var _transitionFunction = this.transitionFunction();

        var _transitionFunction2 = _slicedToArray(_transitionFunction, 2);

        nextState = _transitionFunction2[0];
        eatLength = _transitionFunction2[1];
        value += this.input.substring(this.ptr, this.ptr += eatLength);
        this.currentState = nextState;
      }

      return value;
    }
  }]);

  return FSM;
}();

exports.FSM = FSM;
},{}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.moduleContextFromModuleAST = moduleContextFromModuleAST;
exports.ModuleContext = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// TODO(sven): add flow in here
function moduleContextFromModuleAST(m) {
  var moduleContext = new ModuleContext();

  if (!(m.type === "Module")) {
    throw new Error('m.type === "Module"' + " error: " + (undefined || "unknown"));
  }

  m.fields.forEach(function (field) {
    switch (field.type) {
      case "Start":
        {
          moduleContext.setStart(field.index);
        }

      case "Func":
        {
          moduleContext.addFunction(field);
          break;
        }

      case "Global":
        {
          moduleContext.defineGlobal(field);
          break;
        }

      case "ModuleImport":
        {
          switch (field.descr.type) {
            case "GlobalType":
              {
                moduleContext.importGlobal(field.descr.valtype);
                break;
              }

            case "Memory":
              {
                moduleContext.addMemory(field.descr.limits.min, field.descr.limits.max);
                break;
              }

            case "FuncImportDescr":
              {
                moduleContext.importFunction(field.descr);
                break;
              }

            case "Table":
              {
                // FIXME(sven): not implemented yet
                break;
              }

            default:
              throw new Error("Unsupported ModuleImport of type " + JSON.stringify(field.descr.type));
          }

          break;
        }

      case "Memory":
        {
          moduleContext.addMemory(field.limits.min, field.limits.max);
          break;
        }
    }
  });
  return moduleContext;
}
/**
 * Module context for type checking
 */


var ModuleContext =
/*#__PURE__*/
function () {
  function ModuleContext() {
    _classCallCheck(this, ModuleContext);

    this.funcs = [];
    this.funcsOffsetByIdentifier = [];
    this.globals = [];
    this.globalsOffsetByIdentifier = [];
    this.mems = []; // Current stack frame

    this.locals = [];
    this.labels = [];
    this.return = [];
    this.debugName = "unknown";
    this.start = null;
  }
  /**
   * Set start segment
   */


  _createClass(ModuleContext, [{
    key: "setStart",
    value: function setStart(index) {
      this.start = index.value;
    }
    /**
     * Get start function
     */

  }, {
    key: "getStart",
    value: function getStart() {
      return this.start;
    }
    /**
     * Reset the active stack frame
     */

  }, {
    key: "newContext",
    value: function newContext(debugName, expectedResult) {
      this.locals = [];
      this.labels = [expectedResult];
      this.return = expectedResult;
      this.debugName = debugName;
    }
    /**
     * Functions
     */

  }, {
    key: "addFunction",
    value: function addFunction(func
    /*: Func*/
    ) {
      // eslint-disable-next-line prefer-const
      var _ref = func.signature || {},
          _ref$params = _ref.params,
          args = _ref$params === void 0 ? [] : _ref$params,
          _ref$results = _ref.results,
          result = _ref$results === void 0 ? [] : _ref$results;

      args = args.map(function (arg) {
        return arg.valtype;
      });
      this.funcs.push({
        args: args,
        result: result
      });

      if (typeof func.name !== "undefined") {
        this.funcsOffsetByIdentifier[func.name.value] = this.funcs.length - 1;
      }
    }
  }, {
    key: "importFunction",
    value: function importFunction(funcimport) {
      // eslint-disable-next-line prefer-const
      var _funcimport$signature = funcimport.signature,
          args = _funcimport$signature.params,
          result = _funcimport$signature.results;
      args = args.map(function (arg) {
        return arg.valtype;
      });
      this.funcs.unshift({
        args: args,
        result: result
      });

      if (typeof funcimport.id !== "undefined") {
        // imports are first, we can assume their index in the array
        this.funcsOffsetByIdentifier[funcimport.id.value] = this.funcs.length - 1;
      }
    }
  }, {
    key: "hasFunction",
    value: function hasFunction(index) {
      return typeof this.getFunction(index) !== "undefined";
    }
  }, {
    key: "getFunction",
    value: function getFunction(index) {
      if (typeof index !== "number") {
        throw new Error("getFunction only supported for number index");
      }

      return this.funcs[index];
    }
  }, {
    key: "getFunctionOffsetByIdentifier",
    value: function getFunctionOffsetByIdentifier(name) {
      if (!(typeof name === "string")) {
        throw new Error('typeof name === "string"' + " error: " + (undefined || "unknown"));
      }

      return this.funcsOffsetByIdentifier[name];
    }
    /**
     * Labels
     */

  }, {
    key: "addLabel",
    value: function addLabel(result) {
      this.labels.unshift(result);
    }
  }, {
    key: "hasLabel",
    value: function hasLabel(index) {
      return this.labels.length > index && index >= 0;
    }
  }, {
    key: "getLabel",
    value: function getLabel(index) {
      return this.labels[index];
    }
  }, {
    key: "popLabel",
    value: function popLabel() {
      this.labels.shift();
    }
    /**
     * Locals
     */

  }, {
    key: "hasLocal",
    value: function hasLocal(index) {
      return typeof this.getLocal(index) !== "undefined";
    }
  }, {
    key: "getLocal",
    value: function getLocal(index) {
      return this.locals[index];
    }
  }, {
    key: "addLocal",
    value: function addLocal(type) {
      this.locals.push(type);
    }
    /**
     * Globals
     */

  }, {
    key: "hasGlobal",
    value: function hasGlobal(index) {
      return this.globals.length > index && index >= 0;
    }
  }, {
    key: "getGlobal",
    value: function getGlobal(index) {
      return this.globals[index].type;
    }
  }, {
    key: "getGlobalOffsetByIdentifier",
    value: function getGlobalOffsetByIdentifier(name) {
      if (!(typeof name === "string")) {
        throw new Error('typeof name === "string"' + " error: " + (undefined || "unknown"));
      }

      return this.globalsOffsetByIdentifier[name];
    }
  }, {
    key: "defineGlobal",
    value: function defineGlobal(global
    /*: Global*/
    ) {
      var type = global.globalType.valtype;
      var mutability = global.mutability;
      this.globals.push({
        type: type,
        mutability: mutability
      });

      if (typeof global.name !== "undefined") {
        this.globalsOffsetByIdentifier[global.name.value] = this.globals.length - 1;
      }
    }
  }, {
    key: "importGlobal",
    value: function importGlobal(type, mutability) {
      this.globals.unshift({
        type: type,
        mutability: mutability
      });
    }
  }, {
    key: "isMutableGlobal",
    value: function isMutableGlobal(index) {
      return this.globals[index].mutability === "var";
    }
    /**
     * Memories
     */

  }, {
    key: "hasMemory",
    value: function hasMemory(index) {
      return this.mems.length > index && index >= 0;
    }
  }, {
    key: "addMemory",
    value: function addMemory(min, max) {
      this.mems.push({
        min: min,
        max: max
      });
    }
  }, {
    key: "getMemory",
    value: function getMemory(index) {
      return this.mems[index];
    }
  }]);

  return ModuleContext;
}();

exports.ModuleContext = ModuleContext;
},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "getSectionForNode", {
  enumerable: true,
  get: function get() {
    return _section.getSectionForNode;
  }
});
exports.default = void 0;

var _section = require("./section");

var illegalop = "illegal";
var magicModuleHeader = [0x00, 0x61, 0x73, 0x6d];
var moduleVersion = [0x01, 0x00, 0x00, 0x00];

function invertMap(obj) {
  var keyModifierFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (k) {
    return k;
  };
  var result = {};
  var keys = Object.keys(obj);

  for (var i = 0, length = keys.length; i < length; i++) {
    result[keyModifierFn(obj[keys[i]])] = keys[i];
  }

  return result;
}

function createSymbolObject(name
/*: string */
, object
/*: string */
)
/*: Symbol*/
{
  var numberOfArgs
  /*: number*/
  = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  return {
    name: name,
    object: object,
    numberOfArgs: numberOfArgs
  };
}

function createSymbol(name
/*: string */
)
/*: Symbol*/
{
  var numberOfArgs
  /*: number*/
  = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return {
    name: name,
    numberOfArgs: numberOfArgs
  };
}

var types = {
  func: 0x60,
  result: 0x40
};
var exportTypes = {
  0x00: "Func",
  0x01: "Table",
  0x02: "Mem",
  0x03: "Global"
};
var exportTypesByName = invertMap(exportTypes);
var valtypes = {
  0x7f: "i32",
  0x7e: "i64",
  0x7d: "f32",
  0x7c: "f64"
};
var valtypesByString = invertMap(valtypes);
var tableTypes = {
  0x70: "anyfunc"
};
var blockTypes = Object.assign({}, valtypes, {
  // https://webassembly.github.io/spec/core/binary/types.html#binary-blocktype
  0x40: null,
  // https://webassembly.github.io/spec/core/binary/types.html#binary-valtype
  0x7f: "i32",
  0x7e: "i64",
  0x7d: "f32",
  0x7c: "f64"
});
var globalTypes = {
  0x00: "const",
  0x01: "var"
};
var globalTypesByString = invertMap(globalTypes);
var importTypes = {
  0x00: "func",
  0x01: "table",
  0x02: "mem",
  0x03: "global"
};
var sections = {
  custom: 0,
  type: 1,
  import: 2,
  func: 3,
  table: 4,
  memory: 5,
  global: 6,
  export: 7,
  start: 8,
  element: 9,
  code: 10,
  data: 11
};
var symbolsByByte = {
  0x00: createSymbol("unreachable"),
  0x01: createSymbol("nop"),
  0x02: createSymbol("block"),
  0x03: createSymbol("loop"),
  0x04: createSymbol("if"),
  0x05: createSymbol("else"),
  0x06: illegalop,
  0x07: illegalop,
  0x08: illegalop,
  0x09: illegalop,
  0x0a: illegalop,
  0x0b: createSymbol("end"),
  0x0c: createSymbol("br", 1),
  0x0d: createSymbol("br_if", 1),
  0x0e: createSymbol("br_table"),
  0x0f: createSymbol("return"),
  0x10: createSymbol("call", 1),
  0x11: createSymbol("call_indirect", 2),
  0x12: illegalop,
  0x13: illegalop,
  0x14: illegalop,
  0x15: illegalop,
  0x16: illegalop,
  0x17: illegalop,
  0x18: illegalop,
  0x19: illegalop,
  0x1a: createSymbol("drop"),
  0x1b: createSymbol("select"),
  0x1c: illegalop,
  0x1d: illegalop,
  0x1e: illegalop,
  0x1f: illegalop,
  0x20: createSymbol("get_local", 1),
  0x21: createSymbol("set_local", 1),
  0x22: createSymbol("tee_local", 1),
  0x23: createSymbol("get_global", 1),
  0x24: createSymbol("set_global", 1),
  0x25: illegalop,
  0x26: illegalop,
  0x27: illegalop,
  0x28: createSymbolObject("load", "u32", 1),
  0x29: createSymbolObject("load", "u64", 1),
  0x2a: createSymbolObject("load", "f32", 1),
  0x2b: createSymbolObject("load", "f64", 1),
  0x2c: createSymbolObject("load8_s", "u32", 1),
  0x2d: createSymbolObject("load8_u", "u32", 1),
  0x2e: createSymbolObject("load16_s", "u32", 1),
  0x2f: createSymbolObject("load16_u", "u32", 1),
  0x30: createSymbolObject("load8_s", "u64", 1),
  0x31: createSymbolObject("load8_u", "u64", 1),
  0x32: createSymbolObject("load16_s", "u64", 1),
  0x33: createSymbolObject("load16_u", "u64", 1),
  0x34: createSymbolObject("load32_s", "u64", 1),
  0x35: createSymbolObject("load32_u", "u64", 1),
  0x36: createSymbolObject("store", "u32", 1),
  0x37: createSymbolObject("store", "u64", 1),
  0x38: createSymbolObject("store", "f32", 1),
  0x39: createSymbolObject("store", "f64", 1),
  0x3a: createSymbolObject("store8", "u32", 1),
  0x3b: createSymbolObject("store16", "u32", 1),
  0x3c: createSymbolObject("store8", "u64", 1),
  0x3d: createSymbolObject("store16", "u64", 1),
  0x3e: createSymbolObject("store32", "u64", 1),
  0x3f: createSymbolObject("current_memory"),
  0x40: createSymbolObject("grow_memory"),
  0x41: createSymbolObject("const", "i32", 1),
  0x42: createSymbolObject("const", "i64", 1),
  0x43: createSymbolObject("const", "f32", 1),
  0x44: createSymbolObject("const", "f64", 1),
  0x45: createSymbolObject("eqz", "i32"),
  0x46: createSymbolObject("eq", "i32"),
  0x47: createSymbolObject("ne", "i32"),
  0x48: createSymbolObject("lt_s", "i32"),
  0x49: createSymbolObject("lt_u", "i32"),
  0x4a: createSymbolObject("gt_s", "i32"),
  0x4b: createSymbolObject("gt_u", "i32"),
  0x4c: createSymbolObject("le_s", "i32"),
  0x4d: createSymbolObject("le_u", "i32"),
  0x4e: createSymbolObject("ge_s", "i32"),
  0x4f: createSymbolObject("ge_u", "i32"),
  0x50: createSymbolObject("eqz", "i64"),
  0x51: createSymbolObject("eq", "i64"),
  0x52: createSymbolObject("ne", "i64"),
  0x53: createSymbolObject("lt_s", "i64"),
  0x54: createSymbolObject("lt_u", "i64"),
  0x55: createSymbolObject("gt_s", "i64"),
  0x56: createSymbolObject("gt_u", "i64"),
  0x57: createSymbolObject("le_s", "i64"),
  0x58: createSymbolObject("le_u", "i64"),
  0x59: createSymbolObject("ge_s", "i64"),
  0x5a: createSymbolObject("ge_u", "i64"),
  0x5b: createSymbolObject("eq", "f32"),
  0x5c: createSymbolObject("ne", "f32"),
  0x5d: createSymbolObject("lt", "f32"),
  0x5e: createSymbolObject("gt", "f32"),
  0x5f: createSymbolObject("le", "f32"),
  0x60: createSymbolObject("ge", "f32"),
  0x61: createSymbolObject("eq", "f64"),
  0x62: createSymbolObject("ne", "f64"),
  0x63: createSymbolObject("lt", "f64"),
  0x64: createSymbolObject("gt", "f64"),
  0x65: createSymbolObject("le", "f64"),
  0x66: createSymbolObject("ge", "f64"),
  0x67: createSymbolObject("clz", "i32"),
  0x68: createSymbolObject("ctz", "i32"),
  0x69: createSymbolObject("popcnt", "i32"),
  0x6a: createSymbolObject("add", "i32"),
  0x6b: createSymbolObject("sub", "i32"),
  0x6c: createSymbolObject("mul", "i32"),
  0x6d: createSymbolObject("div_s", "i32"),
  0x6e: createSymbolObject("div_u", "i32"),
  0x6f: createSymbolObject("rem_s", "i32"),
  0x70: createSymbolObject("rem_u", "i32"),
  0x71: createSymbolObject("and", "i32"),
  0x72: createSymbolObject("or", "i32"),
  0x73: createSymbolObject("xor", "i32"),
  0x74: createSymbolObject("shl", "i32"),
  0x75: createSymbolObject("shr_s", "i32"),
  0x76: createSymbolObject("shr_u", "i32"),
  0x77: createSymbolObject("rotl", "i32"),
  0x78: createSymbolObject("rotr", "i32"),
  0x79: createSymbolObject("clz", "i64"),
  0x7a: createSymbolObject("ctz", "i64"),
  0x7b: createSymbolObject("popcnt", "i64"),
  0x7c: createSymbolObject("add", "i64"),
  0x7d: createSymbolObject("sub", "i64"),
  0x7e: createSymbolObject("mul", "i64"),
  0x7f: createSymbolObject("div_s", "i64"),
  0x80: createSymbolObject("div_u", "i64"),
  0x81: createSymbolObject("rem_s", "i64"),
  0x82: createSymbolObject("rem_u", "i64"),
  0x83: createSymbolObject("and", "i64"),
  0x84: createSymbolObject("or", "i64"),
  0x85: createSymbolObject("xor", "i64"),
  0x86: createSymbolObject("shl", "i64"),
  0x87: createSymbolObject("shr_s", "i64"),
  0x88: createSymbolObject("shr_u", "i64"),
  0x89: createSymbolObject("rotl", "i64"),
  0x8a: createSymbolObject("rotr", "i64"),
  0x8b: createSymbolObject("abs", "f32"),
  0x8c: createSymbolObject("neg", "f32"),
  0x8d: createSymbolObject("ceil", "f32"),
  0x8e: createSymbolObject("floor", "f32"),
  0x8f: createSymbolObject("trunc", "f32"),
  0x90: createSymbolObject("nearest", "f32"),
  0x91: createSymbolObject("sqrt", "f32"),
  0x92: createSymbolObject("add", "f32"),
  0x93: createSymbolObject("sub", "f32"),
  0x94: createSymbolObject("mul", "f32"),
  0x95: createSymbolObject("div", "f32"),
  0x96: createSymbolObject("min", "f32"),
  0x97: createSymbolObject("max", "f32"),
  0x98: createSymbolObject("copysign", "f32"),
  0x99: createSymbolObject("abs", "f64"),
  0x9a: createSymbolObject("neg", "f64"),
  0x9b: createSymbolObject("ceil", "f64"),
  0x9c: createSymbolObject("floor", "f64"),
  0x9d: createSymbolObject("trunc", "f64"),
  0x9e: createSymbolObject("nearest", "f64"),
  0x9f: createSymbolObject("sqrt", "f64"),
  0xa0: createSymbolObject("add", "f64"),
  0xa1: createSymbolObject("sub", "f64"),
  0xa2: createSymbolObject("mul", "f64"),
  0xa3: createSymbolObject("div", "f64"),
  0xa4: createSymbolObject("min", "f64"),
  0xa5: createSymbolObject("max", "f64"),
  0xa6: createSymbolObject("copysign", "f64"),
  0xa7: createSymbolObject("wrap/i64", "i32"),
  0xa8: createSymbolObject("trunc_s/f32", "i32"),
  0xa9: createSymbolObject("trunc_u/f32", "i32"),
  0xaa: createSymbolObject("trunc_s/f64", "i32"),
  0xab: createSymbolObject("trunc_u/f64", "i32"),
  0xac: createSymbolObject("extend_s/i32", "i64"),
  0xad: createSymbolObject("extend_u/i32", "i64"),
  0xae: createSymbolObject("trunc_s/f32", "i64"),
  0xaf: createSymbolObject("trunc_u/f32", "i64"),
  0xb0: createSymbolObject("trunc_s/f64", "i64"),
  0xb1: createSymbolObject("trunc_u/f64", "i64"),
  0xb2: createSymbolObject("convert_s/i32", "f32"),
  0xb3: createSymbolObject("convert_u/i32", "f32"),
  0xb4: createSymbolObject("convert_s/i64", "f32"),
  0xb5: createSymbolObject("convert_u/i64", "f32"),
  0xb6: createSymbolObject("demote/f64", "f32"),
  0xb7: createSymbolObject("convert_s/i32", "f64"),
  0xb8: createSymbolObject("convert_u/i32", "f64"),
  0xb9: createSymbolObject("convert_s/i64", "f64"),
  0xba: createSymbolObject("convert_u/i64", "f64"),
  0xbb: createSymbolObject("promote/f32", "f64"),
  0xbc: createSymbolObject("reinterpret/f32", "i32"),
  0xbd: createSymbolObject("reinterpret/f64", "i64"),
  0xbe: createSymbolObject("reinterpret/i32", "f32"),
  0xbf: createSymbolObject("reinterpret/i64", "f64")
};
var symbolsByName = invertMap(symbolsByByte, function (obj) {
  if (typeof obj.object === "string") {
    return "".concat(obj.object, ".").concat(obj.name);
  }

  return obj.name;
});
var _default = {
  symbolsByByte: symbolsByByte,
  sections: sections,
  magicModuleHeader: magicModuleHeader,
  moduleVersion: moduleVersion,
  types: types,
  valtypes: valtypes,
  exportTypes: exportTypes,
  blockTypes: blockTypes,
  tableTypes: tableTypes,
  globalTypes: globalTypes,
  importTypes: importTypes,
  valtypesByString: valtypesByString,
  globalTypesByString: globalTypesByString,
  exportTypesByName: exportTypesByName,
  symbolsByName: symbolsByName
};
exports.default = _default;
},{"./section":44}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSectionForNode = getSectionForNode;

function getSectionForNode(n) {
  switch (n.type) {
    case "ModuleImport":
      return "import";

    case "CallInstruction":
    case "CallIndirectInstruction":
    case "Func":
    case "Instr":
      return "code";

    case "ModuleExport":
      return "export";

    case "Start":
      return "start";

    case "TypeInstruction":
      return "type";

    case "IndexInFuncSection":
      return "func";

    case "Global":
      return "global";
    // No section

    default:
      return;
  }
}
},{}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encodeF32 = encodeF32;
exports.encodeF64 = encodeF64;
exports.decodeF32 = decodeF32;
exports.decodeF64 = decodeF64;
exports.DOUBLE_PRECISION_MANTISSA = exports.SINGLE_PRECISION_MANTISSA = exports.NUMBER_OF_BYTE_F64 = exports.NUMBER_OF_BYTE_F32 = void 0;

var _ieee = require("@xtuc/ieee754");

var _buffer = require("@xtuc/buffer");

/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-float
 * n = 32/8
 */
var NUMBER_OF_BYTE_F32 = 4;
/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-float
 * n = 64/8
 */

exports.NUMBER_OF_BYTE_F32 = NUMBER_OF_BYTE_F32;
var NUMBER_OF_BYTE_F64 = 8;
exports.NUMBER_OF_BYTE_F64 = NUMBER_OF_BYTE_F64;
var SINGLE_PRECISION_MANTISSA = 23;
exports.SINGLE_PRECISION_MANTISSA = SINGLE_PRECISION_MANTISSA;
var DOUBLE_PRECISION_MANTISSA = 52;
exports.DOUBLE_PRECISION_MANTISSA = DOUBLE_PRECISION_MANTISSA;

function encodeF32(v) {
  var buffer = [];
  (0, _ieee.write)(buffer, v, 0, true, SINGLE_PRECISION_MANTISSA, NUMBER_OF_BYTE_F32);
  return buffer;
}

function encodeF64(v) {
  var buffer = [];
  (0, _ieee.write)(buffer, v, 0, true, DOUBLE_PRECISION_MANTISSA, NUMBER_OF_BYTE_F64);
  return buffer;
}

function decodeF32(bytes) {
  var buffer = _buffer.Buffer.from(bytes);

  return (0, _ieee.read)(buffer, 0, true, SINGLE_PRECISION_MANTISSA, NUMBER_OF_BYTE_F32);
}

function decodeF64(bytes) {
  var buffer = _buffer.Buffer.from(bytes);

  return (0, _ieee.read)(buffer, 0, true, DOUBLE_PRECISION_MANTISSA, NUMBER_OF_BYTE_F64);
}
},{"@xtuc/buffer":68,"@xtuc/ieee754":69}],46:[function(require,module,exports){
// Copyright 2012 The Obvious Corporation.

/*
 * bits: Bitwise buffer utilities. The utilities here treat a buffer
 * as a little-endian bigint, so the lowest-order bit is bit #0 of
 * `buffer[0]`, and the highest-order bit is bit #7 of
 * `buffer[buffer.length - 1]`.
 */

/*
 * Modules used
 */
"use strict";
/*
 * Exported bindings
 */

/**
 * Extracts the given number of bits from the buffer at the indicated
 * index, returning a simple number as the result. If bits are requested
 * that aren't covered by the buffer, the `defaultBit` is used as their
 * value.
 *
 * The `bitLength` must be no more than 32. The `defaultBit` if not
 * specified is taken to be `0`.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extract = extract;
exports.inject = inject;
exports.getSign = getSign;
exports.highOrder = highOrder;

function extract(buffer, bitIndex, bitLength, defaultBit) {
  if (bitLength < 0 || bitLength > 32) {
    throw new Error("Bad value for bitLength.");
  }

  if (defaultBit === undefined) {
    defaultBit = 0;
  } else if (defaultBit !== 0 && defaultBit !== 1) {
    throw new Error("Bad value for defaultBit.");
  }

  var defaultByte = defaultBit * 0xff;
  var result = 0; // All starts are inclusive. The {endByte, endBit} pair is exclusive, but
  // if endBit !== 0, then endByte is inclusive.

  var lastBit = bitIndex + bitLength;
  var startByte = Math.floor(bitIndex / 8);
  var startBit = bitIndex % 8;
  var endByte = Math.floor(lastBit / 8);
  var endBit = lastBit % 8;

  if (endBit !== 0) {
    // `(1 << endBit) - 1` is the mask of all bits up to but not including
    // the endBit.
    result = get(endByte) & (1 << endBit) - 1;
  }

  while (endByte > startByte) {
    endByte--;
    result = result << 8 | get(endByte);
  }

  result >>>= startBit;
  return result;

  function get(index) {
    var result = buffer[index];
    return result === undefined ? defaultByte : result;
  }
}
/**
 * Injects the given bits into the given buffer at the given index. Any
 * bits in the value beyond the length to set are ignored.
 */


function inject(buffer, bitIndex, bitLength, value) {
  if (bitLength < 0 || bitLength > 32) {
    throw new Error("Bad value for bitLength.");
  }

  var lastByte = Math.floor((bitIndex + bitLength - 1) / 8);

  if (bitIndex < 0 || lastByte >= buffer.length) {
    throw new Error("Index out of range.");
  } // Just keeping it simple, until / unless profiling shows that this
  // is a problem.


  var atByte = Math.floor(bitIndex / 8);
  var atBit = bitIndex % 8;

  while (bitLength > 0) {
    if (value & 1) {
      buffer[atByte] |= 1 << atBit;
    } else {
      buffer[atByte] &= ~(1 << atBit);
    }

    value >>= 1;
    bitLength--;
    atBit = (atBit + 1) % 8;

    if (atBit === 0) {
      atByte++;
    }
  }
}
/**
 * Gets the sign bit of the given buffer.
 */


function getSign(buffer) {
  return buffer[buffer.length - 1] >>> 7;
}
/**
 * Gets the zero-based bit number of the highest-order bit with the
 * given value in the given buffer.
 *
 * If the buffer consists entirely of the other bit value, then this returns
 * `-1`.
 */


function highOrder(bit, buffer) {
  var length = buffer.length;
  var fullyWrongByte = (bit ^ 1) * 0xff; // the other-bit extended to a full byte

  while (length > 0 && buffer[length - 1] === fullyWrongByte) {
    length--;
  }

  if (length === 0) {
    // Degenerate case. The buffer consists entirely of ~bit.
    return -1;
  }

  var byteToCheck = buffer[length - 1];
  var result = length * 8 - 1;

  for (var i = 7; i > 0; i--) {
    if ((byteToCheck >> i & 1) === bit) {
      break;
    }

    result--;
  }

  return result;
}
},{}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.alloc = alloc;
exports.free = free;
exports.resize = resize;
exports.readInt = readInt;
exports.readUInt = readUInt;
exports.writeInt64 = writeInt64;
exports.writeUInt64 = writeUInt64;

var _buffer = require("@xtuc/buffer");

// Copyright 2012 The Obvious Corporation.

/*
 * bufs: Buffer utilities.
 */

/*
 * Modules used
 */
"use strict";
/*
 * Module variables
 */

/** Pool of buffers, where `bufPool[x].length === x`. */


var bufPool = [];
/** Maximum length of kept temporary buffers. */

var TEMP_BUF_MAXIMUM_LENGTH = 20;
/** Minimum exactly-representable 64-bit int. */

var MIN_EXACT_INT64 = -0x8000000000000000;
/** Maximum exactly-representable 64-bit int. */

var MAX_EXACT_INT64 = 0x7ffffffffffffc00;
/** Maximum exactly-representable 64-bit uint. */

var MAX_EXACT_UINT64 = 0xfffffffffffff800;
/**
 * The int value consisting just of a 1 in bit #32 (that is, one more
 * than the maximum 32-bit unsigned value).
 */

var BIT_32 = 0x100000000;
/**
 * The int value consisting just of a 1 in bit #64 (that is, one more
 * than the maximum 64-bit unsigned value).
 */

var BIT_64 = 0x10000000000000000;
/*
 * Helper functions
 */

/**
 * Masks off all but the lowest bit set of the given number.
 */

function lowestBit(num) {
  return num & -num;
}
/**
 * Gets whether trying to add the second number to the first is lossy
 * (inexact). The first number is meant to be an accumulated result.
 */


function isLossyToAdd(accum, num) {
  if (num === 0) {
    return false;
  }

  var lowBit = lowestBit(num);
  var added = accum + lowBit;

  if (added === accum) {
    return true;
  }

  if (added - lowBit !== accum) {
    return true;
  }

  return false;
}
/*
 * Exported functions
 */

/**
 * Allocates a buffer of the given length, which is initialized
 * with all zeroes. This returns a buffer from the pool if it is
 * available, or a freshly-allocated buffer if not.
 */


function alloc(length) {
  var result = bufPool[length];

  if (result) {
    bufPool[length] = undefined;
  } else {
    result = new _buffer.Buffer(length);
  }

  result.fill(0);
  return result;
}
/**
 * Releases a buffer back to the pool.
 */


function free(buffer) {
  var length = buffer.length;

  if (length < TEMP_BUF_MAXIMUM_LENGTH) {
    bufPool[length] = buffer;
  }
}
/**
 * Resizes a buffer, returning a new buffer. Returns the argument if
 * the length wouldn't actually change. This function is only safe to
 * use if the given buffer was allocated within this module (since
 * otherwise the buffer might possibly be shared externally).
 */


function resize(buffer, length) {
  if (length === buffer.length) {
    return buffer;
  }

  var newBuf = alloc(length);
  buffer.copy(newBuf);
  free(buffer);
  return newBuf;
}
/**
 * Reads an arbitrary signed int from a buffer.
 */


function readInt(buffer) {
  var length = buffer.length;
  var positive = buffer[length - 1] < 0x80;
  var result = positive ? 0 : -1;
  var lossy = false; // Note: We can't use bit manipulation here, since that stops
  // working if the result won't fit in a 32-bit int.

  if (length < 7) {
    // Common case which can't possibly be lossy (because the result has
    // no more than 48 bits, and loss only happens with 54 or more).
    for (var i = length - 1; i >= 0; i--) {
      result = result * 0x100 + buffer[i];
    }
  } else {
    for (var _i = length - 1; _i >= 0; _i--) {
      var one = buffer[_i];
      result *= 0x100;

      if (isLossyToAdd(result, one)) {
        lossy = true;
      }

      result += one;
    }
  }

  return {
    value: result,
    lossy: lossy
  };
}
/**
 * Reads an arbitrary unsigned int from a buffer.
 */


function readUInt(buffer) {
  var length = buffer.length;
  var result = 0;
  var lossy = false; // Note: See above in re bit manipulation.

  if (length < 7) {
    // Common case which can't possibly be lossy (see above).
    for (var i = length - 1; i >= 0; i--) {
      result = result * 0x100 + buffer[i];
    }
  } else {
    for (var _i2 = length - 1; _i2 >= 0; _i2--) {
      var one = buffer[_i2];
      result *= 0x100;

      if (isLossyToAdd(result, one)) {
        lossy = true;
      }

      result += one;
    }
  }

  return {
    value: result,
    lossy: lossy
  };
}
/**
 * Writes a little-endian 64-bit signed int into a buffer.
 */


function writeInt64(value, buffer) {
  if (value < MIN_EXACT_INT64 || value > MAX_EXACT_INT64) {
    throw new Error("Value out of range.");
  }

  if (value < 0) {
    value += BIT_64;
  }

  writeUInt64(value, buffer);
}
/**
 * Writes a little-endian 64-bit unsigned int into a buffer.
 */


function writeUInt64(value, buffer) {
  if (value < 0 || value > MAX_EXACT_UINT64) {
    throw new Error("Value out of range.");
  }

  var lowWord = value % BIT_32;
  var highWord = Math.floor(value / BIT_32);
  buffer.writeUInt32LE(lowWord, 0);
  buffer.writeUInt32LE(highWord, 4);
}
},{"@xtuc/buffer":68}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeInt64 = decodeInt64;
exports.decodeUInt64 = decodeUInt64;
exports.decodeInt32 = decodeInt32;
exports.decodeUInt32 = decodeUInt32;
exports.encodeU32 = encodeU32;
exports.encodeI32 = encodeI32;
exports.encodeI64 = encodeI64;
exports.MAX_NUMBER_OF_BYTE_U64 = exports.MAX_NUMBER_OF_BYTE_U32 = void 0;

var _leb = _interopRequireDefault(require("./leb"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * According to https://webassembly.github.io/spec/core/binary/values.html#binary-int
 * max = ceil(32/7)
 */
var MAX_NUMBER_OF_BYTE_U32 = 5;
/**
 * According to https://webassembly.github.io/spec/core/binary/values.html#binary-int
 * max = ceil(64/7)
 */

exports.MAX_NUMBER_OF_BYTE_U32 = MAX_NUMBER_OF_BYTE_U32;
var MAX_NUMBER_OF_BYTE_U64 = 10;
exports.MAX_NUMBER_OF_BYTE_U64 = MAX_NUMBER_OF_BYTE_U64;

function decodeInt64(encodedBuffer, index) {
  return _leb.default.decodeInt64(encodedBuffer, index);
}

function decodeUInt64(encodedBuffer, index) {
  return _leb.default.decodeUInt64(encodedBuffer, index);
}

function decodeInt32(encodedBuffer, index) {
  return _leb.default.decodeInt32(encodedBuffer, index);
}

function decodeUInt32(encodedBuffer, index) {
  return _leb.default.decodeUInt32(encodedBuffer, index);
}

function encodeU32(v) {
  return _leb.default.encodeUInt32(v);
}

function encodeI32(v) {
  return _leb.default.encodeInt32(v);
}

function encodeI64(v) {
  return _leb.default.encodeInt64(v);
}
},{"./leb":49}],49:[function(require,module,exports){
// Copyright 2012 The Obvious Corporation.

/*
 * leb: LEB128 utilities.
 */

/*
 * Modules used
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _long = _interopRequireDefault(require("@xtuc/long"));

var bits = _interopRequireWildcard(require("./bits"));

var bufs = _interopRequireWildcard(require("./bufs"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Module variables
 */

/** The minimum possible 32-bit signed int. */
var MIN_INT32 = -0x80000000;
/** The maximum possible 32-bit signed int. */

var MAX_INT32 = 0x7fffffff;
/** The maximum possible 32-bit unsigned int. */

var MAX_UINT32 = 0xffffffff;
/** The minimum possible 64-bit signed int. */
// const MIN_INT64 = -0x8000000000000000;

/**
 * The maximum possible 64-bit signed int that is representable as a
 * JavaScript number.
 */
// const MAX_INT64 = 0x7ffffffffffffc00;

/**
 * The maximum possible 64-bit unsigned int that is representable as a
 * JavaScript number.
 */
// const MAX_UINT64 = 0xfffffffffffff800;

/*
 * Helper functions
 */

/**
 * Determines the number of bits required to encode the number
 * represented in the given buffer as a signed value. The buffer is
 * taken to represent a signed number in little-endian form.
 *
 * The number of bits to encode is the (zero-based) bit number of the
 * highest-order non-sign-matching bit, plus two. For example:
 *
 *   11111011 01110101
 *   high          low
 *
 * The sign bit here is 1 (that is, it's a negative number). The highest
 * bit number that doesn't match the sign is bit #10 (where the lowest-order
 * bit is bit #0). So, we have to encode at least 12 bits total.
 *
 * As a special degenerate case, the numbers 0 and -1 each require just one bit.
 */

function signedBitCount(buffer) {
  return bits.highOrder(bits.getSign(buffer) ^ 1, buffer) + 2;
}
/**
 * Determines the number of bits required to encode the number
 * represented in the given buffer as an unsigned value. The buffer is
 * taken to represent an unsigned number in little-endian form.
 *
 * The number of bits to encode is the (zero-based) bit number of the
 * highest-order 1 bit, plus one. For example:
 *
 *   00011000 01010011
 *   high          low
 *
 * The highest-order 1 bit here is bit #12 (where the lowest-order bit
 * is bit #0). So, we have to encode at least 13 bits total.
 *
 * As a special degenerate case, the number 0 requires 1 bit.
 */


function unsignedBitCount(buffer) {
  var result = bits.highOrder(1, buffer) + 1;
  return result ? result : 1;
}
/**
 * Common encoder for both signed and unsigned ints. This takes a
 * bigint-ish buffer, returning an LEB128-encoded buffer.
 */


function encodeBufferCommon(buffer, signed) {
  var signBit;
  var bitCount;

  if (signed) {
    signBit = bits.getSign(buffer);
    bitCount = signedBitCount(buffer);
  } else {
    signBit = 0;
    bitCount = unsignedBitCount(buffer);
  }

  var byteCount = Math.ceil(bitCount / 7);
  var result = bufs.alloc(byteCount);

  for (var i = 0; i < byteCount; i++) {
    var payload = bits.extract(buffer, i * 7, 7, signBit);
    result[i] = payload | 0x80;
  } // Mask off the top bit of the last byte, to indicate the end of the
  // encoding.


  result[byteCount - 1] &= 0x7f;
  return result;
}
/**
 * Gets the byte-length of the value encoded in the given buffer at
 * the given index.
 */


function encodedLength(encodedBuffer, index) {
  var result = 0;

  while (encodedBuffer[index + result] >= 0x80) {
    result++;
  }

  result++; // to account for the last byte

  if (index + result > encodedBuffer.length) {
    throw new Error("integer representation too long");
  }

  return result;
}
/**
 * Common decoder for both signed and unsigned ints. This takes an
 * LEB128-encoded buffer, returning a bigint-ish buffer.
 */


function decodeBufferCommon(encodedBuffer, index, signed) {
  index = index === undefined ? 0 : index;
  var length = encodedLength(encodedBuffer, index);
  var bitLength = length * 7;
  var byteLength = Math.ceil(bitLength / 8);
  var result = bufs.alloc(byteLength);
  var outIndex = 0;

  while (length > 0) {
    bits.inject(result, outIndex, 7, encodedBuffer[index]);
    outIndex += 7;
    index++;
    length--;
  }

  var signBit;
  var signByte;

  if (signed) {
    // Sign-extend the last byte.
    var lastByte = result[byteLength - 1];
    var endBit = outIndex % 8;

    if (endBit !== 0) {
      var shift = 32 - endBit; // 32 because JS bit ops work on 32-bit ints.

      lastByte = result[byteLength - 1] = lastByte << shift >> shift & 0xff;
    }

    signBit = lastByte >> 7;
    signByte = signBit * 0xff;
  } else {
    signBit = 0;
    signByte = 0;
  } // Slice off any superfluous bytes, that is, ones that add no meaningful
  // bits (because the value would be the same if they were removed).


  while (byteLength > 1 && result[byteLength - 1] === signByte && (!signed || result[byteLength - 2] >> 7 === signBit)) {
    byteLength--;
  }

  result = bufs.resize(result, byteLength);
  return {
    value: result,
    nextIndex: index
  };
}
/*
 * Exported bindings
 */


function encodeIntBuffer(buffer) {
  return encodeBufferCommon(buffer, true);
}

function decodeIntBuffer(encodedBuffer, index) {
  return decodeBufferCommon(encodedBuffer, index, true);
}

function encodeInt32(num) {
  var buf = bufs.alloc(4);
  buf.writeInt32LE(num, 0);
  var result = encodeIntBuffer(buf);
  bufs.free(buf);
  return result;
}

function decodeInt32(encodedBuffer, index) {
  var result = decodeIntBuffer(encodedBuffer, index);
  var parsed = bufs.readInt(result.value);
  var value = parsed.value;
  bufs.free(result.value);

  if (value < MIN_INT32 || value > MAX_INT32) {
    throw new Error("integer too large");
  }

  return {
    value: value,
    nextIndex: result.nextIndex
  };
}

function encodeInt64(num) {
  var buf = bufs.alloc(8);
  bufs.writeInt64(num, buf);
  var result = encodeIntBuffer(buf);
  bufs.free(buf);
  return result;
}

function decodeInt64(encodedBuffer, index) {
  var result = decodeIntBuffer(encodedBuffer, index);

  var value = _long.default.fromBytesLE(result.value, false);

  bufs.free(result.value);
  return {
    value: value,
    nextIndex: result.nextIndex,
    lossy: false
  };
}

function encodeUIntBuffer(buffer) {
  return encodeBufferCommon(buffer, false);
}

function decodeUIntBuffer(encodedBuffer, index) {
  return decodeBufferCommon(encodedBuffer, index, false);
}

function encodeUInt32(num) {
  var buf = bufs.alloc(4);
  buf.writeUInt32LE(num, 0);
  var result = encodeUIntBuffer(buf);
  bufs.free(buf);
  return result;
}

function decodeUInt32(encodedBuffer, index) {
  var result = decodeUIntBuffer(encodedBuffer, index);
  var parsed = bufs.readUInt(result.value);
  var value = parsed.value;
  bufs.free(result.value);

  if (value > MAX_UINT32) {
    throw new Error("integer too large");
  }

  return {
    value: value,
    nextIndex: result.nextIndex
  };
}

function encodeUInt64(num) {
  var buf = bufs.alloc(8);
  bufs.writeUInt64(num, buf);
  var result = encodeUIntBuffer(buf);
  bufs.free(buf);
  return result;
}

function decodeUInt64(encodedBuffer, index) {
  var result = decodeUIntBuffer(encodedBuffer, index);

  var value = _long.default.fromBytesLE(result.value, true);

  bufs.free(result.value);
  return {
    value: value,
    nextIndex: result.nextIndex,
    lossy: false
  };
}

var _default = {
  decodeInt32: decodeInt32,
  decodeInt64: decodeInt64,
  decodeIntBuffer: decodeIntBuffer,
  decodeUInt32: decodeUInt32,
  decodeUInt64: decodeUInt64,
  decodeUIntBuffer: decodeUIntBuffer,
  encodeInt32: encodeInt32,
  encodeInt64: encodeInt64,
  encodeIntBuffer: encodeIntBuffer,
  encodeUInt32: encodeUInt32,
  encodeUInt64: encodeUInt64,
  encodeUIntBuffer: encodeUIntBuffer
};
exports.default = _default;
},{"./bits":46,"./bufs":47,"@xtuc/long":70}],50:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function con(b) {
  if ((b & 0xc0) === 0x80) {
    return b & 0x3f;
  } else {
    throw new Error("invalid UTF-8 encoding");
  }
}

function code(min, n) {
  if (n < min || 0xd800 <= n && n < 0xe000 || n >= 0x10000) {
    throw new Error("invalid UTF-8 encoding");
  } else {
    return n;
  }
}

function decode(bytes) {
  return _decode(bytes).map(function (x) {
    return String.fromCharCode(x);
  }).join("");
}

function _decode(bytes) {
  if (bytes.length === 0) {
    return [];
  }
  /**
   * 1 byte
   */


  {
    var _bytes = _toArray(bytes),
        b1 = _bytes[0],
        bs = _bytes.slice(1);

    if (b1 < 0x80) {
      return [code(0x0, b1)].concat(_toConsumableArray(_decode(bs)));
    }

    if (b1 < 0xc0) {
      throw new Error("invalid UTF-8 encoding");
    }
  }
  /**
   * 2 bytes
   */

  {
    var _bytes2 = _toArray(bytes),
        _b = _bytes2[0],
        b2 = _bytes2[1],
        _bs = _bytes2.slice(2);

    if (_b < 0xe0) {
      return [code(0x80, ((_b & 0x1f) << 6) + con(b2))].concat(_toConsumableArray(_decode(_bs)));
    }
  }
  /**
   * 3 bytes
   */

  {
    var _bytes3 = _toArray(bytes),
        _b2 = _bytes3[0],
        _b3 = _bytes3[1],
        b3 = _bytes3[2],
        _bs2 = _bytes3.slice(3);

    if (_b2 < 0xf0) {
      return [code(0x800, ((_b2 & 0x0f) << 12) + (con(_b3) << 6) + con(b3))].concat(_toConsumableArray(_decode(_bs2)));
    }
  }
  /**
   * 4 bytes
   */

  {
    var _bytes4 = _toArray(bytes),
        _b4 = _bytes4[0],
        _b5 = _bytes4[1],
        _b6 = _bytes4[2],
        b4 = _bytes4[3],
        _bs3 = _bytes4.slice(4);

    if (_b4 < 0xf8) {
      return [code(0x10000, (((_b4 & 0x07) << 18) + con(_b5) << 12) + (con(_b6) << 6) + con(b4))].concat(_toConsumableArray(_decode(_bs3)));
    }
  }
  throw new Error("invalid UTF-8 encoding");
}
},{}],51:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = encode;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function con(n) {
  return 0x80 | n & 0x3f;
}

function encode(str) {
  var arr = str.split("").map(function (x) {
    return x.charCodeAt(0);
  });
  return _encode(arr);
}

function _encode(arr) {
  if (arr.length === 0) {
    return [];
  }

  var _arr = _toArray(arr),
      n = _arr[0],
      ns = _arr.slice(1);

  if (n < 0) {
    throw new Error("utf8");
  }

  if (n < 0x80) {
    return [n].concat(_toConsumableArray(_encode(ns)));
  }

  if (n < 0x800) {
    return [0xc0 | n >>> 6, con(n)].concat(_toConsumableArray(_encode(ns)));
  }

  if (n < 0x10000) {
    return [0xe0 | n >>> 12, con(n >>> 6), con(n)].concat(_toConsumableArray(_encode(ns)));
  }

  if (n < 0x110000) {
    return [0xf0 | n >>> 18, con(n >>> 12), con(n >>> 6), con(n)].concat(_toConsumableArray(_encode(ns)));
  }

  throw new Error("utf8");
}
},{}],52:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "decode", {
  enumerable: true,
  get: function get() {
    return _decoder.decode;
  }
});
Object.defineProperty(exports, "encode", {
  enumerable: true,
  get: function get() {
    return _encoder.encode;
  }
});

var _decoder = require("./decoder");

var _encoder = require("./encoder");
},{"./decoder":50,"./encoder":51}],53:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validate;

var _ast = require("@webassemblyjs/ast");

// https://webassembly.github.io/spec/core/text/modules.html#text-module
//
// imports must appear before globals, memory, tables or functions. However, imports
// may be embedded within other statetemnts, or statetemnts may be embedded within imports.
// In these cases, the ordering rule is not applied
function validate(ast) {
  var errors = [];

  function isImportInstruction(path) {
    // various instructions can be embedded within an import statement. These
    // are not subject to our order validation rule
    return path.parentPath.node.type === "ModuleImport";
  }

  var noMoreImports = false;
  (0, _ast.traverse)(ast, {
    ModuleImport: function ModuleImport(path) {
      if (noMoreImports && path.parentPath.node.type !== "Global") {
        return errors.push("imports must occur before all non-import definitions");
      }
    },
    Global: function Global(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    },
    Memory: function Memory(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    },
    Table: function Table(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    },
    Func: function Func(path) {
      if (!isImportInstruction(path)) {
        noMoreImports = true;
      }
    }
  });
  return errors;
}
},{"@webassemblyjs/ast":29}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validateAST;
Object.defineProperty(exports, "isConst", {
  enumerable: true,
  get: function get() {
    return _isConst.isConst;
  }
});
Object.defineProperty(exports, "getType", {
  enumerable: true,
  get: function get() {
    return _typeInference.getType;
  }
});
Object.defineProperty(exports, "typeEq", {
  enumerable: true,
  get: function get() {
    return _typeInference.typeEq;
  }
});
exports.stack = void 0;

var _importOrder = _interopRequireDefault(require("./import-order"));

var _typeChecker = _interopRequireDefault(require("./type-checker"));

var _isConst = require("./is-const");

var _typeInference = require("./type-inference");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function validateAST(ast) {
  var errors = [];
  errors.push.apply(errors, _toConsumableArray((0, _importOrder.default)(ast)));
  errors.push.apply(errors, _toConsumableArray((0, _typeChecker.default)(ast)));

  if (errors.length !== 0) {
    var errorMessage = "Validation errors:\n" + errors.join("\n");
    throw new Error(errorMessage);
  }
}

var stack = _typeChecker.default;
exports.stack = stack;
},{"./import-order":53,"./is-const":55,"./type-checker":56,"./type-inference":59}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isConst = isConst;

/**
 * Determine if a sequence of instructions form a constant expression
 *
 * See https://webassembly.github.io/spec/core/multipage/valid/instructions.html#valid-constant
 *
 * TODO(sven): get_global x should check the mutability of x, but we don't have
 * access to the program at this point.
 */
function isConst(instrs) {
  if (instrs.length === 0) {
    return false;
  }

  return instrs.reduce(function (acc, instr) {
    // Bailout
    if (acc === false) {
      return acc;
    }

    if (instr.id === "const") {
      return true;
    }

    if (instr.id === "get_global") {
      return true;
    } // FIXME(sven): this shoudln't be needed, we need to inject our end
    // instructions after the validations


    if (instr.id === "end") {
      return true;
    }

    return false;
  }, true);
}
},{}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validate;

var _ast = require("@webassemblyjs/ast");

var _helperModuleContext = require("@webassemblyjs/helper-module-context");

var _getType = _interopRequireDefault(require("./type-checker/get-type.js"));

var _types = require("./type-checker/types.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var errors = [];
var stopFuncCheck = false;

function checkTypes(a, b) {
  if (a === _types.ANY && b) {
    return;
  }

  if (b === _types.ANY && a) {
    return;
  } // the type u32 is equal to i32


  if (a === "u32") a = "i32";
  if (b === "u32") b = "i32"; // the type u64 is equal to i64

  if (a === "u64") a = "i64";
  if (b === "u64") b = "i64";

  if (a !== b) {
    errors.push("Expected type ".concat(a, " but got ").concat(b || "none", "."));
    stopFuncCheck = true;
  }
}

function validate(ast) {
  if (!ast.body || !ast.body[0] || !ast.body[0].fields) {
    return [];
  } // Module context


  var moduleContext = (0, _helperModuleContext.moduleContextFromModuleAST)(ast.body[0]);
  errors = []; // Simulate stack types throughout all function bodies

  (0, _ast.traverse)(ast, {
    Func: function Func(_ref) {
      var node = _ref.node;
      stopFuncCheck = false;
      var expectedResult = node.signature.results;
      moduleContext.newContext(node.name.value, expectedResult); // Parameters are local variables

      node.signature.params.forEach(function (p) {
        return moduleContext.addLocal(p.valtype);
      });
      var resultingStack = node.body.reduce(applyInstruction.bind(null, moduleContext), []);

      if (stopFuncCheck) {
        return errors;
      } // Compare the two


      checkStacks(expectedResult, resultingStack);
    }
  });
  return errors;
}

function isEmptyStack(stack) {
  // Polymorphic types are allowed in empty stack
  return stack.filter(function (t) {
    return t !== _types.POLYMORPHIC;
  }).length === 0;
}

function checkStacks(expectedStack, actualStack) {
  if (actualStack !== false) {
    var j = actualStack.length - 1;

    for (var i = 0; i < expectedStack.length; ++i) {
      var expected = expectedStack[i];
      var actual = actualStack[j];

      if (actual === _types.POLYMORPHIC || stopFuncCheck) {
        return;
      }

      checkTypes(expected, actual);
      --j;
    } // There are still types left on the resulting stack


    if (!isEmptyStack(actualStack.slice(0, j + 1))) {
      errors.push("Stack contains additional type ".concat(actualStack.slice(0, j + 1), "."));
    }
  }
}

function applyInstruction(moduleContext, stack, instruction) {
  // Return was called or a type error has occured, skip everything
  if (stack === false || stack.return) {
    return stack;
  } // Workaround for node.args which sometimes does not contain instructions (i32.const, call)


  if ((0, _ast.isInstruction)(instruction) === false) {
    return stack;
  } // Recursively evaluate all nested instructions


  if (instruction.args) {
    stack = instruction.args.reduce(applyInstruction.bind(null, moduleContext), stack);
  }

  if (instruction.instrArgs) {
    stack = instruction.instrArgs.reduce(applyInstruction.bind(null, moduleContext), stack);
  }

  if (instruction.intrs) {
    stack = instruction.intrs.reduce(applyInstruction.bind(null, moduleContext), stack);
  }

  var type = (0, _getType.default)(moduleContext, stack, instruction);

  if (type.error) {
    errors.push(type.error);
    return false;
  } // Structured control flow
  // Update context
  // Run on empty stack


  if (instruction.type === "BlockInstruction" || instruction.type === "LoopInstruction") {
    moduleContext.addLabel(type.result);
    var newStack = instruction.instr.reduce(applyInstruction.bind(null, moduleContext), []);

    if (!stopFuncCheck) {
      checkStacks(type.result, newStack);
    }

    if (newStack === false) {
      stack = false;
    } else {
      stack = _toConsumableArray(stack).concat(_toConsumableArray(newStack));
    }

    moduleContext.popLabel();
  } else if (instruction.type === "IfInstruction") {
    moduleContext.addLabel(type.result); // Condition can be nested as well

    if (instruction.test) {
      stack = instruction.test.reduce(applyInstruction.bind(null, moduleContext), stack);
    }

    var actual;

    for (var _i = 0; _i < type.args.length; ++_i) {
      var argType = type.args[_i];

      if (stack[stack.length - 1] === _types.POLYMORPHIC || stopFuncCheck) {
        return false;
      }

      actual = stack.pop();
      checkTypes(argType, actual);
    }

    var stackConsequent = instruction.consequent.reduce(applyInstruction.bind(null, moduleContext), []);
    var stackAlternate = instruction.alternate.reduce(applyInstruction.bind(null, moduleContext), []);
    var i = 0;
    var j = 0;
    var compareLengths = true;

    while (i < stackConsequent.length && j < stackAlternate.length) {
      if (stackConsequent[i] === _types.POLYMORPHIC || stackAlternate[j] === _types.POLYMORPHIC) {
        compareLengths = false;
        break;
      }

      checkTypes(stackConsequent[i], stackAlternate[j]);
      ++i;
      ++j;
    }

    while (compareLengths && i < stackConsequent.length) {
      if (stackConsequent[i] === _types.POLYMORPHIC) {
        compareLengths = false;
      }

      ++i;
    }

    while (compareLengths && j < stackConsequent.length) {
      if (stackConsequent[j] === _types.POLYMORPHIC) {
        compareLengths = false;
      }

      ++j;
    }

    if (compareLengths && stackConsequent.length !== stackAlternate.length) {
      errors.push("Type mismatch in if, got ".concat(stackConsequent, " and ").concat(stackAlternate));
    }

    checkStacks(type.result, stackConsequent);
    moduleContext.popLabel(); // Add to existing stack

    stack = _toConsumableArray(stack).concat(_toConsumableArray(stackConsequent));
  } else {
    if (stack === false) {
      return false;
    }

    var _actual;

    for (var _i2 = 0; _i2 < type.args.length; ++_i2) {
      var _argType = type.args[_i2];

      if (stack[stack.length - 1] === _types.POLYMORPHIC || stopFuncCheck) {
        return false;
      }

      _actual = stack.pop();
      checkTypes(_argType, _actual);
    }

    stack = _toConsumableArray(stack).concat(_toConsumableArray(type.result));
  }

  return stack;
}
},{"./type-checker/get-type.js":57,"./type-checker/types.js":58,"@webassemblyjs/ast":29,"@webassemblyjs/helper-module-context":42}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getType;

var _types = require("./types");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function equalResultTypes(t1, t2) {
  if (t1.length !== t2.length) {
    return false;
  }

  return t1.every(function (t, i) {
    return t === t2[i];
  });
}

function getType(moduleContext, stack, instruction) {
  var args = [];
  var result = [];
  var error;

  switch (instruction.id) {
    /**
     * This is actually not an instruction, but we parse it as such.
     * We skip over it by treating it as `nop` here.
     */
    case "local":
      {
        instruction.args.forEach(function (t) {
          return moduleContext.addLocal(t.name);
        });
        args = [];
        result = [];
        break;
      }

    case "select":
      {
        if (stack.length < 3) {
          error = "Stack contains too few arguments for select";
          break;
        }

        var first = stack[stack.length - 2];
        var second = stack[stack.length - 3];

        if (first !== second) {
          error = "Type mismatch in select";
          break;
        }

        args = ["i32", first, first];
        result = [first];
        break;
      }

    /**
     * get_global
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-get-global
     */

    case "get_global":
      {
        var index = instruction.args[0].value;

        if (!moduleContext.hasGlobal(index)) {
          error = "Module does not have global ".concat(index);
          break;
        }

        args = [];
        result = [moduleContext.getGlobal(index)];
        break;
      }

    /**
     * set_global
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-set-global
     */

    case "set_global":
      {
        var _index = instruction.args[0].value;

        if (!moduleContext.hasGlobal(_index)) {
          error = "Module does not have global ".concat(_index);
          break;
        }

        if (!moduleContext.isMutableGlobal(_index)) {
          error = "global is immutable";
          break;
        }

        args = [moduleContext.getGlobal(_index)];
        result = [];
        break;
      }

    /**
     * set_local
     *
     * @see http://webassembly.github.io/spec/core/valid/instructions.html#valid-set-local
     */

    case "set_local":
      {
        var _index2 = instruction.args[0].value;

        if (!moduleContext.hasLocal(_index2)) {
          error = "Function does not have local ".concat(_index2);
          break;
        }

        args = [moduleContext.getLocal(_index2)];
        result = [];
        break;
      }

    /**
     * tee_local
     *
     * @see http://webassembly.github.io/spec/core/valid/instructions.html#valid-tee-local
     */

    case "tee_local":
      {
        var _index3 = instruction.args[0].value;

        if (!moduleContext.hasLocal(_index3)) {
          error = "Function does not have local ".concat(_index3);
          break;
        }

        args = [moduleContext.getLocal(_index3)];
        result = [moduleContext.getLocal(_index3)];
        break;
      }

    /**
     * get_local
     *
     * @see http://webassembly.github.io/spec/core/valid/instructions.html#valid-get-local
     */

    case "get_local":
      {
        var _index4 = instruction.args[0].value;

        if (!moduleContext.hasLocal(_index4)) {
          error = "Function does not have local ".concat(_index4);
          break;
        }

        args = [];
        result = [moduleContext.getLocal(_index4)];
        break;
      }

    /**
     * block
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-block
     */

    case "block":
      {
        args = [];
        result = instruction.result ? [instruction.result] : [];
        break;
      }

    /**
     * if
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-if
     */

    case "if":
      {
        args = ["i32"];
        result = instruction.result ? [instruction.result] : [];
        break;
      }

    /**
     * nop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-nop
     */

    case "nop":
      {
        args = [];
        result = [];
        break;
      }

    /**
     * loop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-loop
     */

    case "loop":
      {
        args = [];
        result = instruction.resulttype ? [instruction.resulttype] : [];
        break;
      }

    /**
     * call
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-call
     */

    case "call":
      {
        if (!moduleContext.hasFunction(instruction.index.value)) {
          error = "Call to undefined function index ".concat(instruction.index.value, ".");
          break;
        }

        var _moduleContext$getFun = moduleContext.getFunction(instruction.index.value);

        args = _moduleContext$getFun.args;
        result = _moduleContext$getFun.result;
        break;
      }

    /**
     * const
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-const
     */

    case "const":
      {
        args = [];
        result = [instruction.object];
        break;
      }

    /**
     * drop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-const
     */

    case "drop":
      {
        args = [_types.ANY];
        result = [];
        break;
      }

    /**
     * unop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-unop
     */

    case "clz":
    case "ctz":
    case "popcnt":
    case "abs":
    case "neg":
    case "sqrt":
    case "ceil":
    case "floor":
    case "trunc":
    case "nearest":
      {
        args = [instruction.object];
        result = [instruction.object];
        break;
      }

    /**
     * binop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-binop
     */

    case "add":
    case "sub":
    case "mul":
    case "div":
    case "min":
    case "max":
    case "copysign":
    case "div_u":
    case "div_s":
    case "rem_u":
    case "rem_s":
    case "and":
    case "or":
    case "xor":
    case "shl":
    case "shr_u":
    case "shr_s":
    case "rotl":
    case "rotr":
      {
        args = [instruction.object, instruction.object];
        result = [instruction.object];
        break;
      }

    /**
     * testop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-testop
     */

    case "eqz":
      {
        args = [instruction.object];
        result = ["i32"];
        break;
      }

    /**
     * relop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-relop
     */

    case "eq":
    case "ne":
    case "lt_u":
    case "lt_s":
    case "lt":
    case "gt_u":
    case "gt_s":
    case "gt":
    case "le_u":
    case "le_s":
    case "le":
    case "ge_u":
    case "ge_s":
    case "ge":
      {
        args = [instruction.object, instruction.object];
        result = ["i32"];
        break;
      }

    /**
     * cvtop
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-cvtop
     */

    case "wrap/i64":
    case "convert_s/i64":
    case "convert_u/i64":
    case "reinterpret/i64":
      {
        args = ["i64"];
        result = [instruction.object];
        break;
      }

    case "promote/f32":
    case "trunc_u/f32":
    case "trunc_s/f32":
    case "convert_s/f32":
    case "convert_u/f32":
    case "reinterpret/f32":
      {
        args = ["f32"];
        result = [instruction.object];
        break;
      }

    case "demote/f64":
    case "trunc_u/f64":
    case "trunc_s/f64":
    case "convert_s/f64":
    case "convert_u/f64":
    case "reinterpret/f64":
      {
        args = ["f64"];
        result = [instruction.object];
        break;
      }

    case "extend_u/i32":
    case "extend_s/i32":
    case "convert_s/i32":
    case "convert_u/i32":
    case "reinterpret/i32":
      {
        args = ["i32"];
        result = [instruction.object];
        break;
      }

    /**
     * br
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-br
     */

    case "br":
      {
        var _index5 = instruction.args[0].value;

        if (!moduleContext.getLabel(_index5)) {
          error = "Label ".concat(_index5, " does not exist");
          break;
        }

        args = moduleContext.getLabel(_index5);
        result = [_types.POLYMORPHIC];
        break;
      }

    /**
     * br_if
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-br-if
     */

    case "br_if":
      {
        var _index6 = instruction.args[0].value;

        if (!moduleContext.getLabel(_index6)) {
          error = "Label ".concat(_index6, " does not exist");
          break;
        }

        args = _toConsumableArray(moduleContext.getLabel(_index6)).concat(["i32"]);
        result = moduleContext.getLabel(_index6);
        break;
      }

    /**
     * load
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-load
     */

    case "load":
    case "load8_u":
    case "load8_s":
    case "load16_u":
    case "load16_s":
    case "load32_u":
    case "load32_s":
      {
        if (!moduleContext.hasMemory(0)) {
          error = "Module does not have memory 0";
          break;
        } // TODO Alignment check


        args = ["i32"];
        result = [instruction.object];
        break;
      }

    /**
     * store
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-store
     */

    case "store":
    case "store8":
    case "store16":
    case "store32":
      {
        if (!moduleContext.hasMemory(0)) {
          error = "Module does not have memory 0";
          break;
        } // TODO Alignment check


        args = [instruction.object, "i32"];
        result = [];
        break;
      }

    /**
     * return
     */

    case "return":
      {
        args = moduleContext.return;
        result = [_types.POLYMORPHIC];
        stack.return = true;
        break;
      }

    /**
     * unreachable, trap
     */

    case "unreachable":
    case "trap":
      {
        // TODO: These should be polymorphic
        args = [];
        result = [];
        break;
      }

    /**
     * memory.size
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-memory-size
     */

    case "size":
    case "current_memory":
      {
        if (!moduleContext.hasMemory(0)) {
          error = "Module does not have memory 0";
          break;
        }

        args = [];
        result = ["i32"];
        break;
      }

    /**
     * memory.grow
     *
     * @see https://webassembly.github.io/spec/core/valid/instructions.html#valid-memory-grow
     */

    case "grow":
    case "grow_memory":
      {
        if (!moduleContext.hasMemory(0)) {
          error = "Module does not have memory 0";
          break;
        }

        args = ["i32"];
        result = ["i32"];
        break;
      }

    /**
     * br_table
     */

    case "br_table":
      {
        // TODO: Read all labels not just one
        var _index7 = instruction.args[0].value;

        if (!moduleContext.hasLabel(_index7)) {
          error = "Module does not have memory ".concat(_index7);
          break;
        }

        var t = moduleContext.getLabel(_index7);
        var validLabels = true;

        for (var i = 1; i < instruction.args.length; ++i) {
          var arg = instruction.args[i];

          if (arg.type === "Instr") {
            // No more indices, only nested instructions
            break;
          }

          var _index8 = arg.value;

          if (!moduleContext.hasLabel(_index8)) {
            error = "Module does not have memory ".concat(_index8);
            validLabels = false;
            break;
          }

          if (!equalResultTypes(moduleContext.getLabel(_index8), t)) {
            error = "br_table index ".concat(_index8, " at position ").concat(i, " has mismatching result type.");
            validLabels = false;
            break;
          }
        }

        if (!validLabels) {
          break;
        }

        args = _toConsumableArray(t).concat(["i32"]);
        result = [_types.POLYMORPHIC];
        break;
      }

    /**
     * call_indirect
     */

    case "call_indirect":
      {
        // TODO: There are more things to be checked here
        args = _toConsumableArray(instruction.signature.params.map(function (p) {
          return p.valtype;
        })).concat(["i32"]);
        result = instruction.signature.results.map(function (p) {
          return p.valtype;
        });
        break;
      }

    /**
     * Skip type checking
     */

    default:
      {
        throw new Error("Unknown instruction ".concat(instruction.id, "."));
        break;
      }
  }

  return {
    args: args,
    result: result,
    error: error
  };
}
},{"./types":58}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.POLYMORPHIC = exports.ANY = exports.i64 = exports.i32 = exports.f64 = exports.f32 = void 0;
var f32 = "f32";
exports.f32 = f32;
var f64 = "f64";
exports.f64 = f64;
var i32 = "i32";
exports.i32 = i32;
var i64 = "i64";
exports.i64 = i64;
var ANY = "ANY";
exports.ANY = ANY;
var POLYMORPHIC = "POLYMORPHIC";
exports.POLYMORPHIC = POLYMORPHIC;
},{}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeEq = typeEq;
exports.getType = getType;

var _ast = require("@webassemblyjs/ast");

function typeEq(l, r) {
  if (l.length !== r.length) {
    return false;
  }

  for (var i = 0; i < l.length; i++) {
    if (l[i] != r[i]) {
      return false;
    }
  }

  return true;
}

function getType(instrs) {
  if (instrs.length === 0) {
    return;
  } // FIXME(sven): this shoudln't be needed, we need to inject our end
  // instructions after the validations


  var last = instrs[instrs.length - 1];

  if (last.id === "end") {
    last = instrs[instrs.length - 2];
  } // It's a ObjectInstruction


  if (typeof last.object === "string") {
    // u32 are in fact i32
    // $FlowIgnore
    if (last.object === "u32") {
      // $FlowIgnore
      last.object = "i32";
    } // $FlowIgnore


    var opName = "".concat(last.object, ".").concat(last.id);
    var signature = _ast.signatures[opName];

    if (typeof signature === "undefined") {
      throw new Error("Unknow type signature for instruction: " + opName);
    }

    return signature[1];
  } // Can't infer it, need to interpreter it


  if (last.id === "get_global" || last.id === "get_local") {
    return;
  }

  if (last.type === "LoopInstruction") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    var loop = last;

    if (loop.resulttype != null) {
      return [loop.resulttype];
    }
  }

  if (last.type === "IfInstruction") {
    // $FlowIgnore: if id is `loop` we can assume it's a LoopInstruction
    var ifInstruction = last;
    var res = []; // The type is known

    if (typeof ifInstruction.result === "string") {
      res = [ifInstruction.result];
    } // Continue on the branches


    var leftType = getType(ifInstruction.consequent) || [];
    var rightType = getType(ifInstruction.alternate) || [];

    if (typeEq(leftType, res) === false || typeEq(rightType, res) === false) {
      throw new Error("type mismatch in if branches");
    }

    return res;
  }
}
},{"@webassemblyjs/ast":29}],60:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;

var _helperApiError = require("@webassemblyjs/helper-api-error");

var ieee754 = _interopRequireWildcard(require("@webassemblyjs/ieee754"));

var utf8 = _interopRequireWildcard(require("@webassemblyjs/utf8"));

var t = _interopRequireWildcard(require("@webassemblyjs/ast"));

var _buffer = require("@xtuc/buffer");

var _leb = require("@webassemblyjs/leb128");

var _helperWasmBytecode = _interopRequireDefault(require("@webassemblyjs/helper-wasm-bytecode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function toHex(n) {
  return "0x" + Number(n).toString(16);
}

function byteArrayEq(l, r) {
  if (l.length !== r.length) {
    return false;
  }

  for (var i = 0; i < l.length; i++) {
    if (l[i] !== r[i]) {
      return false;
    }
  }

  return true;
}

function decode(ab, opts) {
  var buf = new Uint8Array(ab);
  var getUniqueName = t.getUniqueNameGenerator();
  var offset = 0;

  function getPosition() {
    return {
      line: -1,
      column: offset
    };
  }

  function dump(b, msg) {
    if (opts.dump === false) return;
    var pad = "\t\t\t\t\t\t\t\t\t\t";
    var str = "";

    if (b.length < 5) {
      str = b.map(toHex).join(" ");
    } else {
      str = "...";
    }

    console.log(toHex(offset) + ":\t", str, pad, ";", msg);
  }

  function dumpSep(msg) {
    if (opts.dump === false) return;
    console.log(";", msg);
  }
  /**
   * TODO(sven): we can atually use a same structure
   * we are adding incrementally new features
   */


  var state = {
    elementsInFuncSection: [],
    elementsInExportSection: [],
    elementsInCodeSection: [],

    /**
     * Decode memory from:
     * - Memory section
     */
    memoriesInModule: [],

    /**
     * Decoded types from:
     * - Type section
     */
    typesInModule: [],

    /**
     * Decoded functions from:
     * - Function section
     * - Import section
     */
    functionsInModule: [],

    /**
     * Decoded tables from:
     * - Table section
     */
    tablesInModule: [],

    /**
     * Decoded globals from:
     * - Global section
     */
    globalsInModule: []
  };

  function isEOF() {
    return offset >= buf.length;
  }

  function eatBytes(n) {
    offset = offset + n;
  }

  function readBytesAtOffset(_offset, numberOfBytes) {
    var arr = [];

    for (var i = 0; i < numberOfBytes; i++) {
      arr.push(buf[_offset + i]);
    }

    return arr;
  }

  function readBytes(numberOfBytes) {
    return readBytesAtOffset(offset, numberOfBytes);
  }

  function readF64() {
    var bytes = readBytes(ieee754.NUMBER_OF_BYTE_F64);
    var value = ieee754.decodeF64(bytes);

    if (Math.sign(value) * value === Infinity) {
      return {
        value: Math.sign(value),
        inf: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F64
      };
    }

    if (isNaN(value)) {
      var sign = bytes[bytes.length - 1] >> 7 ? -1 : 1;
      var mantissa = 0;

      for (var i = 0; i < bytes.length - 2; ++i) {
        mantissa += bytes[i] * Math.pow(256, i);
      }

      mantissa += bytes[bytes.length - 2] % 16 * Math.pow(256, bytes.length - 2);
      return {
        value: sign * mantissa,
        nan: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F64
      };
    }

    return {
      value: value,
      nextIndex: ieee754.NUMBER_OF_BYTE_F64
    };
  }

  function readF32() {
    var bytes = readBytes(ieee754.NUMBER_OF_BYTE_F32);
    var value = ieee754.decodeF32(bytes);

    if (Math.sign(value) * value === Infinity) {
      return {
        value: Math.sign(value),
        inf: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F32
      };
    }

    if (isNaN(value)) {
      var sign = bytes[bytes.length - 1] >> 7 ? -1 : 1;
      var mantissa = 0;

      for (var i = 0; i < bytes.length - 2; ++i) {
        mantissa += bytes[i] * Math.pow(256, i);
      }

      mantissa += bytes[bytes.length - 2] % 128 * Math.pow(256, bytes.length - 2);
      return {
        value: sign * mantissa,
        nan: true,
        nextIndex: ieee754.NUMBER_OF_BYTE_F32
      };
    }

    return {
      value: value,
      nextIndex: ieee754.NUMBER_OF_BYTE_F32
    };
  }

  function readUTF8String() {
    var lenu32 = readU32(); // Don't eat any bytes. Instead, peek ahead of the current offset using
    // readBytesAtOffset below. This keeps readUTF8String neutral with respect
    // to the current offset, just like the other readX functions.

    var strlen = lenu32.value;
    dump([strlen], "string length");
    var bytes = readBytesAtOffset(offset + lenu32.nextIndex, strlen);
    var value = utf8.decode(bytes);
    return {
      value: value,
      nextIndex: strlen + lenu32.nextIndex
    };
  }
  /**
   * Decode an unsigned 32bits integer
   *
   * The length will be handled by the leb librairy, we pass the max number of
   * byte.
   */


  function readU32() {
    var bytes = readBytes(_leb.MAX_NUMBER_OF_BYTE_U32);

    var buffer = _buffer.Buffer.from(bytes);

    return (0, _leb.decodeUInt32)(buffer);
  }

  function readVaruint32() {
    // where 32 bits = max 4 bytes
    var bytes = readBytes(4);

    var buffer = _buffer.Buffer.from(bytes);

    return (0, _leb.decodeUInt32)(buffer);
  }

  function readVaruint7() {
    // where 7 bits = max 1 bytes
    var bytes = readBytes(1);

    var buffer = _buffer.Buffer.from(bytes);

    return (0, _leb.decodeUInt32)(buffer);
  }
  /**
   * Decode a signed 32bits interger
   */


  function read32() {
    var bytes = readBytes(_leb.MAX_NUMBER_OF_BYTE_U32);

    var buffer = _buffer.Buffer.from(bytes);

    return (0, _leb.decodeInt32)(buffer);
  }
  /**
   * Decode a signed 64bits integer
   */


  function read64() {
    var bytes = readBytes(_leb.MAX_NUMBER_OF_BYTE_U64);

    var buffer = _buffer.Buffer.from(bytes);

    return (0, _leb.decodeInt64)(buffer);
  }

  function readU64() {
    var bytes = readBytes(_leb.MAX_NUMBER_OF_BYTE_U64);

    var buffer = _buffer.Buffer.from(bytes);

    return (0, _leb.decodeUInt64)(buffer);
  }

  function readByte() {
    return readBytes(1)[0];
  }

  function parseModuleHeader() {
    if (isEOF() === true || offset + 4 > buf.length) {
      throw new Error("unexpected end");
    }

    var header = readBytes(4);

    if (byteArrayEq(_helperWasmBytecode.default.magicModuleHeader, header) === false) {
      throw new _helperApiError.CompileError("magic header not detected");
    }

    dump(header, "wasm magic header");
    eatBytes(4);
  }

  function parseVersion() {
    if (isEOF() === true || offset + 4 > buf.length) {
      throw new Error("unexpected end");
    }

    var version = readBytes(4);

    if (byteArrayEq(_helperWasmBytecode.default.moduleVersion, version) === false) {
      throw new _helperApiError.CompileError("unknown binary version");
    }

    dump(version, "wasm version");
    eatBytes(4);
  }

  function parseVec(cast) {
    var u32 = readU32();
    var length = u32.value;
    eatBytes(u32.nextIndex);
    dump([length], "number");

    if (length === 0) {
      return [];
    }

    var elements = [];

    for (var i = 0; i < length; i++) {
      var byte = readByte();
      eatBytes(1);
      var value = cast(byte);
      dump([byte], value);

      if (typeof value === "undefined") {
        throw new _helperApiError.CompileError("Internal failure: parseVec could not cast the value");
      }

      elements.push(value);
    }

    return elements;
  } // Type section
  // https://webassembly.github.io/spec/binary/modules.html#binary-typesec


  function parseTypeSection(numberOfTypes) {
    var typeInstructionNodes = [];
    dump([numberOfTypes], "num types");

    for (var i = 0; i < numberOfTypes; i++) {
      var startLoc = getPosition();
      dumpSep("type " + i);
      var type = readByte();
      eatBytes(1);

      if (type == _helperWasmBytecode.default.types.func) {
        dump([type], "func");
        var paramValtypes = parseVec(function (b) {
          return _helperWasmBytecode.default.valtypes[b];
        });
        var params = paramValtypes.map(function (v) {
          return t.funcParam(
          /*valtype*/
          v);
        });
        var result = parseVec(function (b) {
          return _helperWasmBytecode.default.valtypes[b];
        });
        var endLoc = getPosition();
        typeInstructionNodes.push(t.withLoc(t.typeInstruction(undefined, t.signature(params, result)), endLoc, startLoc));
        state.typesInModule.push({
          params: params,
          result: result
        });
      } else {
        throw new Error("Unsupported type: " + toHex(type));
      }
    }

    return typeInstructionNodes;
  } // Import section
  // https://webassembly.github.io/spec/binary/modules.html#binary-importsec


  function parseImportSection(numberOfImports) {
    var imports = [];

    for (var i = 0; i < numberOfImports; i++) {
      dumpSep("import header " + i);
      var startLoc = getPosition();
      /**
       * Module name
       */

      var moduleName = readUTF8String();
      eatBytes(moduleName.nextIndex);
      dump([], "module name (".concat(moduleName.value, ")"));
      /**
       * Name
       */

      var name = readUTF8String();
      eatBytes(name.nextIndex);
      dump([], "name (".concat(name.value, ")"));
      /**
       * Import descr
       */

      var descrTypeByte = readByte();
      eatBytes(1);
      var descrType = _helperWasmBytecode.default.importTypes[descrTypeByte];
      dump([descrTypeByte], "import kind");

      if (typeof descrType === "undefined") {
        throw new _helperApiError.CompileError("Unknown import description type: " + toHex(descrTypeByte));
      }

      var importDescr = void 0;

      if (descrType === "func") {
        var indexU32 = readU32();
        var typeindex = indexU32.value;
        eatBytes(indexU32.nextIndex);
        dump([typeindex], "type index");
        var signature = state.typesInModule[typeindex];

        if (typeof signature === "undefined") {
          throw new _helperApiError.CompileError("function signature not found (".concat(typeindex, ")"));
        }

        var id = getUniqueName("func");
        importDescr = t.funcImportDescr(id, t.signature(signature.params, signature.result));
        state.functionsInModule.push({
          id: t.identifier(name.value),
          signature: signature,
          isExternal: true
        });
      } else if (descrType === "global") {
        importDescr = parseGlobalType();
        var globalNode = t.global(importDescr, []);
        state.globalsInModule.push(globalNode);
      } else if (descrType === "table") {
        importDescr = parseTableType(i);
      } else if (descrType === "mem") {
        var memoryNode = parseMemoryType(0);
        state.memoriesInModule.push(memoryNode);
        importDescr = memoryNode;
      } else {
        throw new _helperApiError.CompileError("Unsupported import of type: " + descrType);
      }

      var endLoc = getPosition();
      imports.push(t.withLoc(t.moduleImport(moduleName.value, name.value, importDescr), endLoc, startLoc));
    }

    return imports;
  } // Function section
  // https://webassembly.github.io/spec/binary/modules.html#function-section


  function parseFuncSection(numberOfFunctions) {
    dump([numberOfFunctions], "num funcs");

    for (var i = 0; i < numberOfFunctions; i++) {
      var indexU32 = readU32();
      var typeindex = indexU32.value;
      eatBytes(indexU32.nextIndex);
      dump([typeindex], "type index");
      var signature = state.typesInModule[typeindex];

      if (typeof signature === "undefined") {
        throw new _helperApiError.CompileError("function signature not found (".concat(typeindex, ")"));
      } // preserve anonymous, a name might be resolved later


      var id = t.withRaw(t.identifier(getUniqueName("func")), "");
      state.functionsInModule.push({
        id: id,
        signature: signature,
        isExternal: false
      });
    }
  } // Export section
  // https://webassembly.github.io/spec/binary/modules.html#export-section


  function parseExportSection(numberOfExport) {
    dump([numberOfExport], "num exports"); // Parse vector of exports

    for (var i = 0; i < numberOfExport; i++) {
      var startLoc = getPosition();
      /**
       * Name
       */

      var name = readUTF8String();
      eatBytes(name.nextIndex);
      dump([], "export name (".concat(name.value, ")"));
      /**
       * exportdescr
       */

      var typeIndex = readByte();
      eatBytes(1);
      dump([typeIndex], "export kind");
      var indexu32 = readU32();
      var index = indexu32.value;
      eatBytes(indexu32.nextIndex);
      dump([index], "export index");
      var id = void 0,
          signature = void 0;

      if (_helperWasmBytecode.default.exportTypes[typeIndex] === "Func") {
        var func = state.functionsInModule[index];

        if (typeof func === "undefined") {
          throw new _helperApiError.CompileError("entry not found at index ".concat(index, " in function section"));
        }

        id = t.numberLiteralFromRaw(index, String(index));
        signature = func.signature;
      } else if (_helperWasmBytecode.default.exportTypes[typeIndex] === "Table") {
        var table = state.tablesInModule[index];

        if (typeof table === "undefined") {
          throw new _helperApiError.CompileError("entry not found at index ".concat(index, " in table section"));
        }

        id = t.numberLiteralFromRaw(index, String(index));
        signature = null;
      } else if (_helperWasmBytecode.default.exportTypes[typeIndex] === "Mem") {
        var memNode = state.memoriesInModule[index];

        if (typeof memNode === "undefined") {
          throw new _helperApiError.CompileError("entry not found at index ".concat(index, " in memory section"));
        }

        id = t.numberLiteralFromRaw(index, String(index));
        signature = null;
      } else if (_helperWasmBytecode.default.exportTypes[typeIndex] === "Global") {
        var global = state.globalsInModule[index];

        if (typeof global === "undefined") {
          throw new _helperApiError.CompileError("entry not found at index ".concat(index, " in global section"));
        }

        id = t.numberLiteralFromRaw(index, String(index));
        signature = null;
      } else {
        console.warn("Unsupported export type: " + toHex(typeIndex));
        return;
      }

      var endLoc = getPosition();
      state.elementsInExportSection.push({
        name: name.value,
        type: _helperWasmBytecode.default.exportTypes[typeIndex],
        signature: signature,
        id: id,
        index: index,
        endLoc: endLoc,
        startLoc: startLoc
      });
    }
  } // Code section
  // https://webassembly.github.io/spec/binary/modules.html#code-section


  function parseCodeSection(numberOfFuncs) {
    dump([numberOfFuncs], "number functions"); // Parse vector of function

    for (var i = 0; i < numberOfFuncs; i++) {
      var startLoc = getPosition();
      dumpSep("function body " + i); // the u32 size of the function code in bytes
      // Ignore it for now

      var bodySizeU32 = readU32();
      eatBytes(bodySizeU32.nextIndex);
      dump([bodySizeU32.value], "function body size");
      var code = [];
      /**
       * Parse locals
       */

      var funcLocalNumU32 = readU32();
      var funcLocalNum = funcLocalNumU32.value;
      eatBytes(funcLocalNumU32.nextIndex);
      dump([funcLocalNum], "num locals");
      var locals = [];

      for (var _i = 0; _i < funcLocalNum; _i++) {
        var localCountU32 = readU32();
        var localCount = localCountU32.value;
        eatBytes(localCountU32.nextIndex);
        dump([localCount], "num local");
        var valtypeByte = readByte();
        eatBytes(1);
        var type = _helperWasmBytecode.default.valtypes[valtypeByte];
        locals.push(type);
        dump([valtypeByte], type);

        if (typeof type === "undefined") {
          throw new _helperApiError.CompileError("Unexpected valtype: " + toHex(valtypeByte));
        }
      } // Decode instructions until the end


      parseInstructionBlock(code);
      code.unshift.apply(code, _toConsumableArray(locals.map(function (l) {
        return t.instruction("local", [t.valtypeLiteral(l)]);
      })));
      var endLoc = getPosition();
      state.elementsInCodeSection.push({
        code: code,
        locals: locals,
        endLoc: endLoc,
        startLoc: startLoc,
        bodySize: bodySizeU32.value
      });
    }
  }

  function parseInstructionBlock(code) {
    while (true) {
      var startLoc = getPosition();
      var instructionAlreadyCreated = false;
      var instructionByte = readByte();
      eatBytes(1);

      if (instructionByte === 0xfe) {
        throw new _helperApiError.CompileError("Atomic instructions are not implemented");
      }

      var instruction = _helperWasmBytecode.default.symbolsByByte[instructionByte];

      if (typeof instruction === "undefined") {
        throw new _helperApiError.CompileError("Unexpected instruction: " + toHex(instructionByte));
      }

      if (typeof instruction.object === "string") {
        dump([instructionByte], "".concat(instruction.object, ".").concat(instruction.name));
      } else {
        dump([instructionByte], instruction.name);
      }
      /**
       * End of the function
       */


      if (instruction.name === "end") {
        break;
      }

      var args = [];

      if (instruction.name === "loop") {
        var blocktypeByte = readByte();
        eatBytes(1);
        var blocktype = _helperWasmBytecode.default.blockTypes[blocktypeByte];
        dump([blocktypeByte], "blocktype");

        if (typeof blocktype === "undefined") {
          throw new _helperApiError.CompileError("Unexpected blocktype: " + toHex(blocktypeByte));
        }

        var instr = [];
        parseInstructionBlock(instr); // preserve anonymous

        var label = t.withRaw(t.identifier(getUniqueName("loop")), "");
        var loopNode = t.loopInstruction(label, blocktype, instr);
        code.push(loopNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "if") {
        var _blocktypeByte = readByte();

        eatBytes(1);
        var _blocktype = _helperWasmBytecode.default.blockTypes[_blocktypeByte];
        dump([_blocktypeByte], "blocktype");

        if (typeof _blocktype === "undefined") {
          throw new _helperApiError.CompileError("Unexpected blocktype: " + toHex(_blocktypeByte));
        }

        var testIndex = t.withRaw(t.identifier(getUniqueName("if")), "");
        var ifBody = [];
        parseInstructionBlock(ifBody); // Defaults to no alternate

        var elseIndex = 0;

        for (elseIndex = 0; elseIndex < ifBody.length; ++elseIndex) {
          var _instr = ifBody[elseIndex];

          if (_instr.type === "Instr" && _instr.id === "else") {
            break;
          }
        }

        var consequentInstr = ifBody.slice(0, elseIndex);
        var alternate = ifBody.slice(elseIndex + 1); // wast sugar

        var testInstrs = [];
        var ifNode = t.ifInstruction(testIndex, testInstrs, _blocktype, consequentInstr, alternate);
        code.push(ifNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "block") {
        var _blocktypeByte2 = readByte();

        eatBytes(1);
        var _blocktype2 = _helperWasmBytecode.default.blockTypes[_blocktypeByte2];
        dump([_blocktypeByte2], "blocktype");

        if (typeof _blocktype2 === "undefined") {
          throw new _helperApiError.CompileError("Unexpected blocktype: " + toHex(_blocktypeByte2));
        }

        var _instr2 = [];
        parseInstructionBlock(_instr2); // preserve anonymous

        var _label = t.withRaw(t.identifier(getUniqueName("block")), "");

        var blockNode = t.blockInstruction(_label, _instr2, _blocktype2);
        code.push(blockNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "call") {
        var indexu32 = readU32();
        var index = indexu32.value;
        eatBytes(indexu32.nextIndex);
        dump([index], "index");
        var callNode = t.callInstruction(t.indexLiteral(index));
        code.push(callNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "call_indirect") {
        var indexU32 = readU32();
        var typeindex = indexU32.value;
        eatBytes(indexU32.nextIndex);
        dump([typeindex], "type index");
        var signature = state.typesInModule[typeindex];

        if (typeof signature === "undefined") {
          throw new _helperApiError.CompileError("call_indirect signature not found (".concat(typeindex, ")"));
        }

        var _callNode = t.callIndirectInstruction(t.signature(signature.params, signature.result), []);

        var flagU32 = readU32();
        var flag = flagU32.value; // 0x00 - reserved byte

        eatBytes(flagU32.nextIndex);

        if (flag !== 0) {
          throw new _helperApiError.CompileError("zero flag expected");
        }

        code.push(_callNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "br_table") {
        var indicesu32 = readU32();
        var indices = indicesu32.value;
        eatBytes(indicesu32.nextIndex);
        dump([indices], "num indices");

        for (var i = 0; i <= indices; i++) {
          var _indexu = readU32();

          var _index = _indexu.value;
          eatBytes(_indexu.nextIndex);
          dump([_index], "index");
          args.push(t.numberLiteralFromRaw(_indexu.value.toString(), "u32"));
        }
      } else if (instructionByte >= 0x28 && instructionByte <= 0x40) {
        /**
         * Memory instructions
         */
        if (instruction.name === "grow_memory" || instruction.name === "current_memory") {
          var _indexU = readU32();

          var _index2 = _indexU.value;
          eatBytes(_indexU.nextIndex);

          if (_index2 !== 0) {
            throw new Error("zero flag expected");
          }

          dump([_index2], "index");
        } else {
          var aligun32 = readU32();
          var align = aligun32.value;
          eatBytes(aligun32.nextIndex);
          dump([align], "align");
          var offsetu32 = readU32();
          var _offset2 = offsetu32.value;
          eatBytes(offsetu32.nextIndex);
          dump([_offset2], "offset");
        }
      } else if (instructionByte >= 0x41 && instructionByte <= 0x44) {
        /**
         * Numeric instructions
         */
        if (instruction.object === "i32") {
          var value32 = read32();
          var value = value32.value;
          eatBytes(value32.nextIndex);
          dump([value], "i32 value");
          args.push(t.numberLiteralFromRaw(value));
        }

        if (instruction.object === "u32") {
          var valueu32 = readU32();
          var _value = valueu32.value;
          eatBytes(valueu32.nextIndex);
          dump([_value], "u32 value");
          args.push(t.numberLiteralFromRaw(_value));
        }

        if (instruction.object === "i64") {
          var value64 = read64();
          var _value2 = value64.value;
          eatBytes(value64.nextIndex);
          dump([Number(_value2.toString())], "i64 value");
          var high = _value2.high,
              low = _value2.low;
          var node = {
            type: "LongNumberLiteral",
            value: {
              high: high,
              low: low
            }
          };
          args.push(node);
        }

        if (instruction.object === "u64") {
          var valueu64 = readU64();
          var _value3 = valueu64.value;
          eatBytes(valueu64.nextIndex);
          dump([Number(_value3.toString())], "u64 value");
          var _high = _value3.high,
              _low = _value3.low;
          var _node = {
            type: "LongNumberLiteral",
            value: {
              high: _high,
              low: _low
            }
          };
          args.push(_node);
        }

        if (instruction.object === "f32") {
          var valuef32 = readF32();
          var _value4 = valuef32.value;
          eatBytes(valuef32.nextIndex);
          dump([_value4], "f32 value");
          args.push( // $FlowIgnore
          t.floatLiteral(_value4, valuef32.nan, valuef32.inf, String(_value4)));
        }

        if (instruction.object === "f64") {
          var valuef64 = readF64();
          var _value5 = valuef64.value;
          eatBytes(valuef64.nextIndex);
          dump([_value5], "f64 value");
          args.push( // $FlowIgnore
          t.floatLiteral(_value5, valuef64.nan, valuef64.inf, String(_value5)));
        }
      } else {
        for (var _i2 = 0; _i2 < instruction.numberOfArgs; _i2++) {
          var u32 = readU32();
          eatBytes(u32.nextIndex);
          dump([u32.value], "argument " + _i2);
          args.push(t.numberLiteralFromRaw(u32.value));
        }
      }

      if (instructionAlreadyCreated === false) {
        if (typeof instruction.object === "string") {
          code.push(t.objectInstruction(instruction.name, instruction.object, args));
        } else {
          var endLoc = getPosition();

          var _node2 = t.withLoc(t.instruction(instruction.name, args), endLoc, startLoc);

          code.push(_node2);
        }
      }
    }
  } // https://webassembly.github.io/spec/core/binary/types.html#limits


  function parseLimits() {
    var limitType = readByte();
    eatBytes(1);
    dump([limitType], "limit type");
    var min, max;

    if (limitType === 0x01 || limitType === 0x03 // shared limits
    ) {
        var u32min = readU32();
        min = parseInt(u32min.value);
        eatBytes(u32min.nextIndex);
        dump([min], "min");
        var u32max = readU32();
        max = parseInt(u32max.value);
        eatBytes(u32max.nextIndex);
        dump([max], "max");
      }

    if (limitType === 0x00) {
      var _u32min = readU32();

      min = parseInt(_u32min.value);
      eatBytes(_u32min.nextIndex);
      dump([min], "min");
    }

    return t.limit(min, max);
  } // https://webassembly.github.io/spec/core/binary/types.html#binary-tabletype


  function parseTableType(index) {
    var name = t.withRaw(t.identifier(getUniqueName("table")), String(index));
    var elementTypeByte = readByte();
    eatBytes(1);
    dump([elementTypeByte], "element type");
    var elementType = _helperWasmBytecode.default.tableTypes[elementTypeByte];

    if (typeof elementType === "undefined") {
      throw new _helperApiError.CompileError("Unknown element type in table: " + toHex(elementType));
    }

    var limits = parseLimits();
    return t.table(elementType, limits, name);
  } // https://webassembly.github.io/spec/binary/types.html#global-types


  function parseGlobalType() {
    var valtypeByte = readByte();
    eatBytes(1);
    var type = _helperWasmBytecode.default.valtypes[valtypeByte];
    dump([valtypeByte], type);

    if (typeof type === "undefined") {
      throw new _helperApiError.CompileError("Unknown valtype: " + toHex(valtypeByte));
    }

    var globalTypeByte = readByte();
    eatBytes(1);
    var globalType = _helperWasmBytecode.default.globalTypes[globalTypeByte];
    dump([globalTypeByte], "global type (".concat(globalType, ")"));

    if (typeof globalType === "undefined") {
      throw new _helperApiError.CompileError("Invalid mutability: " + toHex(globalTypeByte));
    }

    return t.globalType(type, globalType);
  } // function parseNameModule() {
  //   const lenu32 = readVaruint32();
  //   eatBytes(lenu32.nextIndex);
  //   console.log("len", lenu32);
  //   const strlen = lenu32.value;
  //   dump([strlen], "string length");
  //   const bytes = readBytes(strlen);
  //   eatBytes(strlen);
  //   const value = utf8.decode(bytes);
  //   return [t.moduleNameMetadata(value)];
  // }
  // this section contains an array of function names and indices


  function parseNameSectionFunctions() {
    var functionNames = [];
    var numberOfFunctionsu32 = readU32();
    var numbeOfFunctions = numberOfFunctionsu32.value;
    eatBytes(numberOfFunctionsu32.nextIndex);

    for (var i = 0; i < numbeOfFunctions; i++) {
      var indexu32 = readU32();
      var index = indexu32.value;
      eatBytes(indexu32.nextIndex);
      var name = readUTF8String();
      eatBytes(name.nextIndex);
      functionNames.push(t.functionNameMetadata(name.value, index));
    }

    return functionNames;
  }

  function parseNameSectionLocals() {
    var localNames = [];
    var numbeOfFunctionsu32 = readU32();
    var numbeOfFunctions = numbeOfFunctionsu32.value;
    eatBytes(numbeOfFunctionsu32.nextIndex);

    for (var i = 0; i < numbeOfFunctions; i++) {
      var functionIndexu32 = readU32();
      var functionIndex = functionIndexu32.value;
      eatBytes(functionIndexu32.nextIndex);
      var numLocalsu32 = readU32();
      var numLocals = numLocalsu32.value;
      eatBytes(numLocalsu32.nextIndex);

      for (var _i3 = 0; _i3 < numLocals; _i3++) {
        var localIndexu32 = readU32();
        var localIndex = localIndexu32.value;
        eatBytes(localIndexu32.nextIndex);
        var name = readUTF8String();
        eatBytes(name.nextIndex);
        localNames.push(t.localNameMetadata(name.value, localIndex, functionIndex));
      }
    }

    return localNames;
  } // this is a custom section used for name resolution
  // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#name-section


  function parseNameSection(remainingBytes) {
    var nameMetadata = [];
    var initialOffset = offset;

    while (offset - initialOffset < remainingBytes) {
      // name_type
      var sectionTypeByte = readVaruint7();
      eatBytes(sectionTypeByte.nextIndex); // name_payload_len

      var subSectionSizeInBytesu32 = readVaruint32();
      eatBytes(subSectionSizeInBytesu32.nextIndex);

      switch (sectionTypeByte.value) {
        // case 0: {
        // TODO(sven): re-enable that
        // Current status: it seems that when we decode the module's name
        // no name_payload_len is used.
        //
        // See https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#name-section
        //
        // nameMetadata.push(...parseNameModule());
        // break;
        // }
        case 1:
          {
            nameMetadata.push.apply(nameMetadata, _toConsumableArray(parseNameSectionFunctions()));
            break;
          }

        case 2:
          {
            nameMetadata.push.apply(nameMetadata, _toConsumableArray(parseNameSectionLocals()));
            break;
          }

        default:
          {
            // skip unknown subsection
            eatBytes(subSectionSizeInBytesu32.value);
          }
      }
    }

    return nameMetadata;
  }

  function parseGlobalSection(numberOfGlobals) {
    var globals = [];
    dump([numberOfGlobals], "num globals");

    for (var i = 0; i < numberOfGlobals; i++) {
      var startLoc = getPosition();
      var globalType = parseGlobalType();
      /**
       * Global expressions
       */

      var init = [];
      parseInstructionBlock(init);
      var endLoc = getPosition();
      var node = t.withLoc(t.global(globalType, init), endLoc, startLoc);
      globals.push(node);
      state.globalsInModule.push(node);
    }

    return globals;
  }

  function parseElemSection(numberOfElements) {
    var elems = [];
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
      var startLoc = getPosition();
      var tableindexu32 = readU32();
      var tableindex = tableindexu32.value;
      eatBytes(tableindexu32.nextIndex);
      dump([tableindex], "table index");
      /**
       * Parse instructions
       */

      var instr = [];
      parseInstructionBlock(instr);
      /**
       * Parse ( vector function index ) *
       */

      var indicesu32 = readU32();
      var indices = indicesu32.value;
      eatBytes(indicesu32.nextIndex);
      dump([indices], "num indices");
      var indexValues = [];

      for (var _i4 = 0; _i4 < indices; _i4++) {
        var indexu32 = readU32();
        var index = indexu32.value;
        eatBytes(indexu32.nextIndex);
        dump([index], "index");
        indexValues.push(t.indexLiteral(index));
      }

      var endLoc = getPosition();
      var elemNode = t.withLoc(t.elem(t.indexLiteral(tableindex), instr, indexValues), endLoc, startLoc);
      elems.push(elemNode);
    }

    return elems;
  } // https://webassembly.github.io/spec/core/binary/types.html#memory-types


  function parseMemoryType(i) {
    var limits = parseLimits();
    return t.memory(limits, t.indexLiteral(i));
  } // https://webassembly.github.io/spec/binary/modules.html#table-section


  function parseTableSection(numberOfElements) {
    var tables = [];
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
      var tablesNode = parseTableType(i);
      state.tablesInModule.push(tablesNode);
      tables.push(tablesNode);
    }

    return tables;
  } // https://webassembly.github.io/spec/binary/modules.html#memory-section


  function parseMemorySection(numberOfElements) {
    var memories = [];
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
      var memoryNode = parseMemoryType(i);
      state.memoriesInModule.push(memoryNode);
      memories.push(memoryNode);
    }

    return memories;
  } // https://webassembly.github.io/spec/binary/modules.html#binary-startsec


  function parseStartSection() {
    var startLoc = getPosition();
    var u32 = readU32();
    var startFuncIndex = u32.value;
    eatBytes(u32.nextIndex);
    dump([startFuncIndex], "index");
    var endLoc = getPosition();
    return t.withLoc(t.start(t.indexLiteral(startFuncIndex)), endLoc, startLoc);
  } // https://webassembly.github.io/spec/binary/modules.html#data-section


  function parseDataSection(numberOfElements) {
    var dataEntries = [];
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
      var memoryIndexu32 = readU32();
      var memoryIndex = memoryIndexu32.value;
      eatBytes(memoryIndexu32.nextIndex);
      dump([memoryIndex], "memory index");
      var instrs = [];
      parseInstructionBlock(instrs);

      if (instrs.length !== 1) {
        throw new _helperApiError.CompileError("data section offset must be a single instruction");
      }

      var bytes = parseVec(function (b) {
        return b;
      });
      dump([], "init");
      dataEntries.push(t.data(t.memIndexLiteral(memoryIndex), instrs[0], t.byteArray(bytes)));
    }

    return dataEntries;
  } // https://webassembly.github.io/spec/binary/modules.html#binary-section


  function parseSection(sectionIndex) {
    var sectionId = readByte();
    eatBytes(1);

    if (sectionId >= sectionIndex || sectionIndex === _helperWasmBytecode.default.sections.custom) {
      sectionIndex = sectionId + 1;
    } else {
      if (sectionId !== _helperWasmBytecode.default.sections.custom) throw new _helperApiError.CompileError("Unexpected section: " + toHex(sectionId));
    }

    var nextSectionIndex = sectionIndex;
    var startOffset = offset;
    var startPosition = getPosition();
    var u32 = readU32();
    var sectionSizeInBytes = u32.value;
    eatBytes(u32.nextIndex);
    var sectionSizeInBytesEndLoc = getPosition();
    var sectionSizeInBytesNode = t.withLoc(t.numberLiteralFromRaw(sectionSizeInBytes), sectionSizeInBytesEndLoc, startPosition);

    switch (sectionId) {
      case _helperWasmBytecode.default.sections.type:
        {
          dumpSep("section Type");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition = getPosition();

          var _u = readU32();

          var numberOfTypes = _u.value;
          eatBytes(_u.nextIndex);
          var endPosition = getPosition();

          var _metadata = t.sectionMetadata("type", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfTypes), endPosition, _startPosition));

          var _nodes = parseTypeSection(numberOfTypes);

          return {
            nodes: _nodes,
            metadata: _metadata,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.table:
        {
          dumpSep("section Table");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition2 = getPosition();

          var _u2 = readU32();

          var numberOfTable = _u2.value;
          eatBytes(_u2.nextIndex);

          var _endPosition = getPosition();

          dump([numberOfTable], "num tables");

          var _metadata2 = t.sectionMetadata("table", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfTable), _endPosition, _startPosition2));

          var _nodes2 = parseTableSection(numberOfTable);

          return {
            nodes: _nodes2,
            metadata: _metadata2,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.import:
        {
          dumpSep("section Import");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition3 = getPosition();

          var numberOfImportsu32 = readU32();
          var numberOfImports = numberOfImportsu32.value;
          eatBytes(numberOfImportsu32.nextIndex);

          var _endPosition2 = getPosition();

          dump([numberOfImports], "number of imports");

          var _metadata3 = t.sectionMetadata("import", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfImports), _endPosition2, _startPosition3));

          var _nodes3 = parseImportSection(numberOfImports);

          return {
            nodes: _nodes3,
            metadata: _metadata3,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.func:
        {
          dumpSep("section Function");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition4 = getPosition();

          var numberOfFunctionsu32 = readU32();
          var numberOfFunctions = numberOfFunctionsu32.value;
          eatBytes(numberOfFunctionsu32.nextIndex);

          var _endPosition3 = getPosition();

          var _metadata4 = t.sectionMetadata("func", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfFunctions), _endPosition3, _startPosition4));

          parseFuncSection(numberOfFunctions);
          var _nodes4 = [];
          return {
            nodes: _nodes4,
            metadata: _metadata4,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.export:
        {
          dumpSep("section Export");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition5 = getPosition();

          var _u3 = readU32();

          var numberOfExport = _u3.value;
          eatBytes(_u3.nextIndex);

          var _endPosition4 = getPosition();

          var _metadata5 = t.sectionMetadata("export", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfExport), _endPosition4, _startPosition5));

          parseExportSection(numberOfExport);
          var _nodes5 = [];
          return {
            nodes: _nodes5,
            metadata: _metadata5,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.code:
        {
          dumpSep("section Code");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition6 = getPosition();

          var _u4 = readU32();

          var numberOfFuncs = _u4.value;
          eatBytes(_u4.nextIndex);

          var _endPosition5 = getPosition();

          var _metadata6 = t.sectionMetadata("code", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfFuncs), _endPosition5, _startPosition6));

          if (opts.ignoreCodeSection === true) {
            var remainingBytes = sectionSizeInBytes - _u4.nextIndex;
            eatBytes(remainingBytes); // eat the entire section
          } else {
            parseCodeSection(numberOfFuncs);
          }

          var _nodes6 = [];
          return {
            nodes: _nodes6,
            metadata: _metadata6,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.start:
        {
          dumpSep("section Start");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _metadata7 = t.sectionMetadata("start", startOffset, sectionSizeInBytesNode);

          var _nodes7 = [parseStartSection()];
          return {
            nodes: _nodes7,
            metadata: _metadata7,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.element:
        {
          dumpSep("section Element");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition7 = getPosition();

          var numberOfElementsu32 = readU32();
          var numberOfElements = numberOfElementsu32.value;
          eatBytes(numberOfElementsu32.nextIndex);

          var _endPosition6 = getPosition();

          var _metadata8 = t.sectionMetadata("element", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfElements), _endPosition6, _startPosition7));

          var _nodes8 = parseElemSection(numberOfElements);

          return {
            nodes: _nodes8,
            metadata: _metadata8,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.global:
        {
          dumpSep("section Global");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition8 = getPosition();

          var numberOfGlobalsu32 = readU32();
          var numberOfGlobals = numberOfGlobalsu32.value;
          eatBytes(numberOfGlobalsu32.nextIndex);

          var _endPosition7 = getPosition();

          var _metadata9 = t.sectionMetadata("global", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(numberOfGlobals), _endPosition7, _startPosition8));

          var _nodes9 = parseGlobalSection(numberOfGlobals);

          return {
            nodes: _nodes9,
            metadata: _metadata9,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.memory:
        {
          dumpSep("section Memory");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _startPosition9 = getPosition();

          var _numberOfElementsu = readU32();

          var _numberOfElements = _numberOfElementsu.value;
          eatBytes(_numberOfElementsu.nextIndex);

          var _endPosition8 = getPosition();

          var _metadata10 = t.sectionMetadata("memory", startOffset, sectionSizeInBytesNode, t.withLoc(t.numberLiteralFromRaw(_numberOfElements), _endPosition8, _startPosition9));

          var _nodes10 = parseMemorySection(_numberOfElements);

          return {
            nodes: _nodes10,
            metadata: _metadata10,
            nextSectionIndex: nextSectionIndex
          };
        }

      case _helperWasmBytecode.default.sections.data:
        {
          dumpSep("section Data");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");

          var _metadata11 = t.sectionMetadata("data", startOffset, sectionSizeInBytesNode);

          var _startPosition10 = getPosition();

          var _numberOfElementsu2 = readU32();

          var _numberOfElements2 = _numberOfElementsu2.value;
          eatBytes(_numberOfElementsu2.nextIndex);

          var _endPosition9 = getPosition();

          _metadata11.vectorOfSize = t.withLoc(t.numberLiteralFromRaw(_numberOfElements2), _endPosition9, _startPosition10);

          if (opts.ignoreDataSection === true) {
            var _remainingBytes = sectionSizeInBytes - _numberOfElementsu2.nextIndex;

            eatBytes(_remainingBytes); // eat the entire section

            dumpSep("ignore data (" + sectionSizeInBytes + " bytes)");
            return {
              nodes: [],
              metadata: _metadata11,
              nextSectionIndex: nextSectionIndex
            };
          } else {
            var _nodes11 = parseDataSection(_numberOfElements2);

            return {
              nodes: _nodes11,
              metadata: _metadata11,
              nextSectionIndex: nextSectionIndex
            };
          }
        }

      case _helperWasmBytecode.default.sections.custom:
        {
          dumpSep("section Custom");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size");
          var _metadata12 = [t.sectionMetadata("custom", startOffset, sectionSizeInBytesNode)];
          var sectionName = readUTF8String();
          eatBytes(sectionName.nextIndex);
          dump([], "section name (".concat(sectionName.value, ")"));

          var _remainingBytes2 = sectionSizeInBytes - sectionName.nextIndex;

          if (sectionName.value === "name") {
            try {
              _metadata12.push.apply(_metadata12, _toConsumableArray(parseNameSection(_remainingBytes2)));
            } catch (e) {
              console.warn("Failed to decode custom \"name\" section @".concat(offset, "; ignoring (").concat(e.message, ")."));
              eatBytes(_remainingBytes2);
            }
          } else {
            // We don't parse the custom section
            eatBytes(_remainingBytes2);
            dumpSep("ignore custom " + JSON.stringify(sectionName.value) + " section (" + _remainingBytes2 + " bytes)");
          }

          return {
            nodes: [],
            metadata: _metadata12,
            nextSectionIndex: nextSectionIndex
          };
        }
    }

    throw new _helperApiError.CompileError("Unexpected section: " + toHex(sectionId));
  }

  parseModuleHeader();
  parseVersion();
  var moduleFields = [];
  var sectionIndex = 0;
  var moduleMetadata = {
    sections: [],
    functionNames: [],
    localNames: []
  };
  /**
   * All the generate declaration are going to be stored in our state
   */

  while (offset < buf.length) {
    var _parseSection = parseSection(sectionIndex),
        _nodes12 = _parseSection.nodes,
        _metadata13 = _parseSection.metadata,
        nextSectionIndex = _parseSection.nextSectionIndex;

    moduleFields.push.apply(moduleFields, _toConsumableArray(_nodes12));
    var metadataArray = Array.isArray(_metadata13) ? _metadata13 : [_metadata13];
    metadataArray.forEach(function (metadataItem) {
      if (metadataItem.type === "FunctionNameMetadata") {
        moduleMetadata.functionNames.push(metadataItem);
      } else if (metadataItem.type === "LocalNameMetadata") {
        moduleMetadata.localNames.push(metadataItem);
      } else {
        moduleMetadata.sections.push(metadataItem);
      }
    }); // Ignore custom section

    if (nextSectionIndex) {
      sectionIndex = nextSectionIndex;
    }
  }
  /**
   * Transform the state into AST nodes
   */


  var funcIndex = 0;
  state.functionsInModule.forEach(function (func) {
    var params = func.signature.params;
    var result = func.signature.result;
    var body = []; // External functions doesn't provide any code, can skip it here

    if (func.isExternal === true) {
      return;
    }

    var decodedElementInCodeSection = state.elementsInCodeSection[funcIndex];

    if (opts.ignoreCodeSection === false) {
      if (typeof decodedElementInCodeSection === "undefined") {
        throw new _helperApiError.CompileError("func " + toHex(funcIndex) + " code not found");
      }

      body = decodedElementInCodeSection.code;
    }

    funcIndex++;
    var funcNode = t.func(func.id, t.signature(params, result), body);

    if (func.isExternal === true) {
      funcNode.isExternal = func.isExternal;
    } // Add function position in the binary if possible


    if (opts.ignoreCodeSection === false) {
      var startLoc = decodedElementInCodeSection.startLoc,
          endLoc = decodedElementInCodeSection.endLoc,
          bodySize = decodedElementInCodeSection.bodySize;
      funcNode = t.withLoc(funcNode, endLoc, startLoc);
      funcNode.metadata = {
        bodySize: bodySize
      };
    }

    moduleFields.push(funcNode);
  });
  state.elementsInExportSection.forEach(function (moduleExport) {
    /**
     * If the export has no id, we won't be able to call it from the outside
     * so we can omit it
     */
    if (moduleExport.id != null) {
      moduleFields.push(t.withLoc(t.moduleExport(moduleExport.name, t.moduleExportDescr(moduleExport.type, moduleExport.id)), moduleExport.endLoc, moduleExport.startLoc));
    }
  });
  dumpSep("end of program");
  var module = t.module(null, moduleFields, t.moduleMetadata(moduleMetadata.sections, moduleMetadata.functionNames, moduleMetadata.localNames));
  return t.program([module]);
}
},{"@webassemblyjs/ast":29,"@webassemblyjs/helper-api-error":39,"@webassemblyjs/helper-wasm-bytecode":43,"@webassemblyjs/ieee754":45,"@webassemblyjs/leb128":48,"@webassemblyjs/utf8":52,"@xtuc/buffer":68}],61:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;

var decoder = _interopRequireWildcard(require("./decoder"));

var t = _interopRequireWildcard(require("@webassemblyjs/ast"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var defaultDecoderOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false,
  ignoreCustomNameSection: false
}; // traverses the AST, locating function name metadata, which is then
// used to update index-based identifiers with function names

function restoreFunctionNames(ast) {
  var functionNames = [];
  t.traverse(ast, {
    FunctionNameMetadata: function FunctionNameMetadata(_ref) {
      var node = _ref.node;
      functionNames.push({
        name: node.value,
        index: node.index
      });
    }
  });

  if (functionNames.length === 0) {
    return;
  }

  t.traverse(ast, {
    Func: function (_Func) {
      function Func(_x) {
        return _Func.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func.toString();
      };

      return Func;
    }(function (_ref2) {
      var node = _ref2.node;
      // $FlowIgnore
      var nodeName = node.name;
      var indexBasedFunctionName = nodeName.value;
      var index = Number(indexBasedFunctionName.replace("func_", ""));
      var functionName = functionNames.find(function (f) {
        return f.index === index;
      });

      if (functionName) {
        nodeName.value = functionName.name; // $FlowIgnore

        delete nodeName.raw;
      }
    }),
    // Also update the reference in the export
    ModuleExport: function (_ModuleExport) {
      function ModuleExport(_x2) {
        return _ModuleExport.apply(this, arguments);
      }

      ModuleExport.toString = function () {
        return _ModuleExport.toString();
      };

      return ModuleExport;
    }(function (_ref3) {
      var node = _ref3.node;

      if (node.descr.exportType === "Func") {
        // $FlowIgnore
        var nodeName = node.descr.id;
        var index = nodeName.value;
        var functionName = functionNames.find(function (f) {
          return f.index === index;
        });

        if (functionName) {
          node.descr.id = t.identifier(functionName.name);
        }
      }
    }),
    ModuleImport: function (_ModuleImport) {
      function ModuleImport(_x3) {
        return _ModuleImport.apply(this, arguments);
      }

      ModuleImport.toString = function () {
        return _ModuleImport.toString();
      };

      return ModuleImport;
    }(function (_ref4) {
      var node = _ref4.node;

      if (node.descr.type === "FuncImportDescr") {
        // $FlowIgnore
        var indexBasedFunctionName = node.descr.id;
        var index = Number(indexBasedFunctionName.replace("func_", ""));
        var functionName = functionNames.find(function (f) {
          return f.index === index;
        });

        if (functionName) {
          // $FlowIgnore
          node.descr.id = t.identifier(functionName.name);
        }
      }
    }),
    CallInstruction: function (_CallInstruction) {
      function CallInstruction(_x4) {
        return _CallInstruction.apply(this, arguments);
      }

      CallInstruction.toString = function () {
        return _CallInstruction.toString();
      };

      return CallInstruction;
    }(function (nodePath) {
      var node = nodePath.node;
      var index = node.index.value;
      var functionName = functionNames.find(function (f) {
        return f.index === index;
      });

      if (functionName) {
        node.index = t.identifier(functionName.name); // $FlowIgnore

        delete node.raw;
      }
    })
  });
}

function restoreLocalNames(ast) {
  var localNames = [];
  t.traverse(ast, {
    LocalNameMetadata: function LocalNameMetadata(_ref5) {
      var node = _ref5.node;
      localNames.push({
        name: node.value,
        localIndex: node.localIndex,
        functionIndex: node.functionIndex
      });
    }
  });

  if (localNames.length === 0) {
    return;
  }

  t.traverse(ast, {
    Func: function (_Func2) {
      function Func(_x5) {
        return _Func2.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func2.toString();
      };

      return Func;
    }(function (_ref6) {
      var node = _ref6.node;
      var signature = node.signature;

      if (signature.type !== "Signature") {
        return;
      } // $FlowIgnore


      var nodeName = node.name;
      var indexBasedFunctionName = nodeName.value;
      var functionIndex = Number(indexBasedFunctionName.replace("func_", ""));
      signature.params.forEach(function (param, paramIndex) {
        var paramName = localNames.find(function (f) {
          return f.localIndex === paramIndex && f.functionIndex === functionIndex;
        });

        if (paramName && paramName.name !== "") {
          param.id = paramName.name;
        }
      });
    })
  });
}

function restoreModuleName(ast) {
  t.traverse(ast, {
    ModuleNameMetadata: function (_ModuleNameMetadata) {
      function ModuleNameMetadata(_x6) {
        return _ModuleNameMetadata.apply(this, arguments);
      }

      ModuleNameMetadata.toString = function () {
        return _ModuleNameMetadata.toString();
      };

      return ModuleNameMetadata;
    }(function (moduleNameMetadataPath) {
      // update module
      t.traverse(ast, {
        Module: function (_Module) {
          function Module(_x7) {
            return _Module.apply(this, arguments);
          }

          Module.toString = function () {
            return _Module.toString();
          };

          return Module;
        }(function (_ref7) {
          var node = _ref7.node;
          var name = moduleNameMetadataPath.node.value; // compatiblity with wast-parser

          if (name === "") {
            name = null;
          }

          node.id = name;
        })
      });
    })
  });
}

function decode(buf, customOpts) {
  var opts = Object.assign({}, defaultDecoderOpts, customOpts);
  var ast = decoder.decode(buf, opts);

  if (opts.ignoreCustomNameSection === false) {
    restoreFunctionNames(ast);
    restoreLocalNames(ast);
    restoreModuleName(ast);
  }

  return ast;
}
},{"./decoder":60,"@webassemblyjs/ast":29}],62:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;

var _helperCodeFrame = require("@webassemblyjs/helper-code-frame");

var t = _interopRequireWildcard(require("@webassemblyjs/ast"));

var _numberLiterals = require("./number-literals");

var _stringLiterals = require("./string-literals");

var _tokenizer = require("./tokenizer");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function hasPlugin(name) {
  if (name !== "wast") throw new Error("unknow plugin");
  return true;
}

function isKeyword(token, id) {
  return token.type === _tokenizer.tokens.keyword && token.value === id;
}

function tokenToString(token) {
  if (token.type === "keyword") {
    return "keyword (".concat(token.value, ")");
  }

  return token.type;
}

function identifierFromToken(token) {
  var _token$loc = token.loc,
      end = _token$loc.end,
      start = _token$loc.start;
  return t.withLoc(t.identifier(token.value), end, start);
}

function parse(tokensList, source) {
  var current = 0;
  var getUniqueName = t.getUniqueNameGenerator();
  var state = {
    registredExportedElements: []
  }; // But this time we're going to use recursion instead of a `while` loop. So we
  // define a `walk` function.

  function walk() {
    var token = tokensList[current];

    function eatToken() {
      token = tokensList[++current];
    }

    function getEndLoc() {
      var currentToken = token;

      if (typeof currentToken === "undefined") {
        var lastToken = tokensList[tokensList.length - 1];
        currentToken = lastToken;
      }

      return currentToken.loc.end;
    }

    function getStartLoc() {
      return token.loc.start;
    }

    function eatTokenOfType(type) {
      if (token.type !== type) {
        throw new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "Assertion error: expected token of type " + type + ", given " + tokenToString(token));
      }

      eatToken();
    }

    function parseExportIndex(token) {
      if (token.type === _tokenizer.tokens.identifier) {
        var index = identifierFromToken(token);
        eatToken();
        return index;
      } else if (token.type === _tokenizer.tokens.number) {
        var _index = t.numberLiteralFromRaw(token.value);

        eatToken();
        return _index;
      } else {
        throw function () {
          return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "unknown export index" + ", given " + tokenToString(token));
        }();
      }
    }

    function lookaheadAndCheck() {
      var len = arguments.length;

      for (var i = 0; i < len; i++) {
        var tokenAhead = tokensList[current + i];
        var expectedToken = i < 0 || arguments.length <= i ? undefined : arguments[i];

        if (tokenAhead.type === "keyword") {
          if (isKeyword(tokenAhead, expectedToken) === false) {
            return false;
          }
        } else if (expectedToken !== tokenAhead.type) {
          return false;
        }
      }

      return true;
    } // TODO(sven): there is probably a better way to do this
    // can refactor it if it get out of hands


    function maybeIgnoreComment() {
      if (typeof token === "undefined") {
        // Ignore
        return;
      }

      while (token.type === _tokenizer.tokens.comment) {
        eatToken();

        if (typeof token === "undefined") {
          // Hit the end
          break;
        }
      }
    }
    /**
     * Parses a memory instruction
     *
     * WAST:
     *
     * memory:  ( memory <name>? <memory_sig> )
     *          ( memory <name>? ( export <string> ) <...> )
     *          ( memory <name>? ( import <string> <string> ) <memory_sig> )
     *          ( memory <name>? ( export <string> )* ( data <string>* )
     * memory_sig: <nat> <nat>?
     *
     */


    function parseMemory() {
      var id = t.identifier(getUniqueName("memory"));
      var limits = t.limit(0);

      if (token.type === _tokenizer.tokens.string || token.type === _tokenizer.tokens.identifier) {
        id = t.identifier(token.value);
        eatToken();
      } else {
        id = t.withRaw(id, ""); // preserve anonymous
      }
      /**
       * Maybe data
       */


      if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.data)) {
        eatToken(); // (

        eatToken(); // data
        // TODO(sven): do something with the data collected here

        var stringInitializer = token.value;
        eatTokenOfType(_tokenizer.tokens.string); // Update limits accordingly

        limits = t.limit(stringInitializer.length);
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }
      /**
       * Maybe export
       */


      if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.export)) {
        eatToken(); // (

        eatToken(); // export

        if (token.type !== _tokenizer.tokens.string) {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Expected string in export" + ", given " + tokenToString(token));
          }();
        }

        var _name = token.value;
        eatToken();
        state.registredExportedElements.push({
          exportType: "Memory",
          name: _name,
          id: id
        });
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }
      /**
       * Memory signature
       */


      if (token.type === _tokenizer.tokens.number) {
        limits = t.limit((0, _numberLiterals.parse32I)(token.value));
        eatToken();

        if (token.type === _tokenizer.tokens.number) {
          limits.max = (0, _numberLiterals.parse32I)(token.value);
          eatToken();
        }
      }

      return t.memory(limits, id);
    }
    /**
     * Parses a data section
     * https://webassembly.github.io/spec/core/text/modules.html#data-segments
     *
     * WAST:
     *
     * data:  ( data <index>? <offset> <string> )
     */


    function parseData() {
      // optional memory index
      var memidx = 0;

      if (token.type === _tokenizer.tokens.number) {
        memidx = token.value;
        eatTokenOfType(_tokenizer.tokens.number); // .
      }

      eatTokenOfType(_tokenizer.tokens.openParen);
      var offset;

      if (token.type === _tokenizer.tokens.valtype) {
        eatTokenOfType(_tokenizer.tokens.valtype); // i32

        eatTokenOfType(_tokenizer.tokens.dot); // .

        if (token.value !== "const") {
          throw new Error("constant expression required");
        }

        eatTokenOfType(_tokenizer.tokens.name); // const

        var numberLiteral = t.numberLiteralFromRaw(token.value, "i32");
        offset = t.objectInstruction("const", "i32", [numberLiteral]);
        eatToken();
        eatTokenOfType(_tokenizer.tokens.closeParen);
      } else {
        eatTokenOfType(_tokenizer.tokens.name); // get_global

        var _numberLiteral = t.numberLiteralFromRaw(token.value, "i32");

        offset = t.instruction("get_global", [_numberLiteral]);
        eatToken();
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      var byteArray = (0, _stringLiterals.parseString)(token.value);
      eatToken(); // "string"

      return t.data(t.memIndexLiteral(memidx), offset, t.byteArray(byteArray));
    }
    /**
     * Parses a table instruction
     *
     * WAST:
     *
     * table:   ( table <name>? <table_type> )
     *          ( table <name>? ( export <string> ) <...> )
     *          ( table <name>? ( import <string> <string> ) <table_type> )
     *          ( table <name>? ( export <string> )* <elem_type> ( elem <var>* ) )
     *
     * table_type:  <nat> <nat>? <elem_type>
     * elem_type: anyfunc
     *
     * elem:    ( elem <var>? (offset <instr>* ) <var>* )
     *          ( elem <var>? <expr> <var>* )
     */


    function parseTable() {
      var name = t.identifier(getUniqueName("table"));
      var limit = t.limit(0);
      var elemIndices = [];
      var elemType = "anyfunc";

      if (token.type === _tokenizer.tokens.string || token.type === _tokenizer.tokens.identifier) {
        name = identifierFromToken(token);
        eatToken();
      } else {
        name = t.withRaw(name, ""); // preserve anonymous
      }

      while (token.type !== _tokenizer.tokens.closeParen) {
        /**
         * Maybe export
         */
        if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.elem)) {
          eatToken(); // (

          eatToken(); // elem

          while (token.type === _tokenizer.tokens.identifier) {
            elemIndices.push(t.identifier(token.value));
            eatToken();
          }

          eatTokenOfType(_tokenizer.tokens.closeParen);
        } else if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.export)) {
          eatToken(); // (

          eatToken(); // export

          if (token.type !== _tokenizer.tokens.string) {
            throw function () {
              return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Expected string in export" + ", given " + tokenToString(token));
            }();
          }

          var exportName = token.value;
          eatToken();
          state.registredExportedElements.push({
            exportType: "Table",
            name: exportName,
            id: name
          });
          eatTokenOfType(_tokenizer.tokens.closeParen);
        } else if (isKeyword(token, _tokenizer.keywords.anyfunc)) {
          // It's the default value, we can ignore it
          eatToken(); // anyfunc
        } else if (token.type === _tokenizer.tokens.number) {
          /**
           * Table type
           */
          var min = parseInt(token.value);
          eatToken();

          if (token.type === _tokenizer.tokens.number) {
            var max = parseInt(token.value);
            eatToken();
            limit = t.limit(min, max);
          } else {
            limit = t.limit(min);
          }

          eatToken();
        } else {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token" + ", given " + tokenToString(token));
          }();
        }
      }

      if (elemIndices.length > 0) {
        return t.table(elemType, limit, name, elemIndices);
      } else {
        return t.table(elemType, limit, name);
      }
    }
    /**
     * Parses an import statement
     *
     * WAST:
     *
     * import:  ( import <string> <string> <imkind> )
     * imkind:  ( func <name>? <func_sig> )
     *          ( global <name>? <global_sig> )
     *          ( table <name>? <table_sig> )
     *          ( memory <name>? <memory_sig> )
     *
     * global_sig: <type> | ( mut <type> )
     */


    function parseImport() {
      if (token.type !== _tokenizer.tokens.string) {
        throw new Error("Expected a string, " + token.type + " given.");
      }

      var moduleName = token.value;
      eatToken();

      if (token.type !== _tokenizer.tokens.string) {
        throw new Error("Expected a string, " + token.type + " given.");
      }

      var name = token.value;
      eatToken();
      eatTokenOfType(_tokenizer.tokens.openParen);
      var descr;

      if (isKeyword(token, _tokenizer.keywords.func)) {
        eatToken(); // keyword

        var fnParams = [];
        var fnResult = [];
        var fnName = t.identifier(getUniqueName("func"));

        if (token.type === _tokenizer.tokens.identifier) {
          fnName = identifierFromToken(token);
          eatToken();
        }

        while (token.type === _tokenizer.tokens.openParen) {
          eatToken();

          if (lookaheadAndCheck(_tokenizer.keywords.param) === true) {
            eatToken();
            fnParams.push.apply(fnParams, _toConsumableArray(parseFuncParam()));
          } else if (lookaheadAndCheck(_tokenizer.keywords.result) === true) {
            eatToken();
            fnResult.push.apply(fnResult, _toConsumableArray(parseFuncResult()));
          } else {
            throw function () {
              return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in import of type" + ", given " + tokenToString(token));
            }();
          }

          eatTokenOfType(_tokenizer.tokens.closeParen);
        }

        if (typeof fnName === "undefined") {
          throw new Error("Imported function must have a name");
        }

        descr = t.funcImportDescr(fnName, t.signature(fnParams, fnResult));
      } else if (isKeyword(token, _tokenizer.keywords.global)) {
        eatToken(); // keyword

        if (token.type === _tokenizer.tokens.openParen) {
          eatToken(); // (

          eatTokenOfType(_tokenizer.tokens.keyword); // mut keyword

          var valtype = token.value;
          eatToken();
          descr = t.globalType(valtype, "var");
          eatTokenOfType(_tokenizer.tokens.closeParen);
        } else {
          var _valtype = token.value;
          eatTokenOfType(_tokenizer.tokens.valtype);
          descr = t.globalType(_valtype, "const");
        }
      } else if (isKeyword(token, _tokenizer.keywords.memory) === true) {
        eatToken(); // Keyword

        descr = parseMemory();
      } else if (isKeyword(token, _tokenizer.keywords.table) === true) {
        eatToken(); // Keyword

        descr = parseTable();
      } else {
        throw new Error("Unsupported import type: " + tokenToString(token));
      }

      eatTokenOfType(_tokenizer.tokens.closeParen);
      return t.moduleImport(moduleName, name, descr);
    }
    /**
     * Parses a block instruction
     *
     * WAST:
     *
     * expr: ( block <name>? <block_sig> <instr>* )
     * instr: block <name>? <block_sig> <instr>* end <name>?
     * block_sig : ( result <type>* )*
     *
     */


    function parseBlock() {
      var label = t.identifier(getUniqueName("block"));
      var blockResult = null;
      var instr = [];

      if (token.type === _tokenizer.tokens.identifier) {
        label = identifierFromToken(token);
        eatToken();
      } else {
        label = t.withRaw(label, ""); // preserve anonymous
      }

      while (token.type === _tokenizer.tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(_tokenizer.keywords.result) === true) {
          eatToken();
          blockResult = token.value;
          eatToken();
        } else if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            // Instruction
            instr.push(parseFuncInstr());
          } else {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in block body of type" + ", given " + tokenToString(token));
          }();
        }

        maybeIgnoreComment();
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      return t.blockInstruction(label, instr, blockResult);
    }
    /**
     * Parses a if instruction
     *
     * WAST:
     *
     * expr:
     * ( if <name>? <block_sig> ( then <instr>* ) ( else <instr>* )? )
     * ( if <name>? <block_sig> <expr>+ ( then <instr>* ) ( else <instr>* )? )
     *
     * instr:
     * if <name>? <block_sig> <instr>* end <name>?
     * if <name>? <block_sig> <instr>* else <name>? <instr>* end <name>?
     *
     * block_sig : ( result <type>* )*
     *
     */


    function parseIf() {
      var blockResult = null;
      var label = t.identifier(getUniqueName("if"));
      var testInstrs = [];
      var consequent = [];
      var alternate = [];

      if (token.type === _tokenizer.tokens.identifier) {
        label = identifierFromToken(token);
        eatToken();
      } else {
        label = t.withRaw(label, ""); // preserve anonymous
      }

      while (token.type === _tokenizer.tokens.openParen) {
        eatToken(); // (

        /**
         * Block signature
         */

        if (isKeyword(token, _tokenizer.keywords.result) === true) {
          eatToken();
          blockResult = token.value;
          eatTokenOfType(_tokenizer.tokens.valtype);
          eatTokenOfType(_tokenizer.tokens.closeParen);
          continue;
        }
        /**
         * Then
         */


        if (isKeyword(token, _tokenizer.keywords.then) === true) {
          eatToken(); // then

          while (token.type === _tokenizer.tokens.openParen) {
            eatToken(); // Instruction

            if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
            ) {
                consequent.push(parseFuncInstr());
              } else {
              throw function () {
                return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in consequent body of type" + ", given " + tokenToString(token));
              }();
            }

            eatTokenOfType(_tokenizer.tokens.closeParen);
          }

          eatTokenOfType(_tokenizer.tokens.closeParen);
          continue;
        }
        /**
         * Alternate
         */


        if (isKeyword(token, _tokenizer.keywords.else)) {
          eatToken(); // else

          while (token.type === _tokenizer.tokens.openParen) {
            eatToken(); // Instruction

            if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
            ) {
                alternate.push(parseFuncInstr());
              } else {
              throw function () {
                return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in alternate body of type" + ", given " + tokenToString(token));
              }();
            }

            eatTokenOfType(_tokenizer.tokens.closeParen);
          }

          eatTokenOfType(_tokenizer.tokens.closeParen);
          continue;
        }
        /**
         * Test instruction
         */


        if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            testInstrs.push(parseFuncInstr());
            eatTokenOfType(_tokenizer.tokens.closeParen);
            continue;
          }

        throw function () {
          return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in if body" + ", given " + tokenToString(token));
        }();
      }

      return t.ifInstruction(label, testInstrs, blockResult, consequent, alternate);
    }
    /**
     * Parses a loop instruction
     *
     * WAT:
     *
     * blockinstr :: 'loop' I:label rt:resulttype (in:instr*) 'end' id?
     *
     * WAST:
     *
     * instr     :: loop <name>? <block_sig> <instr>* end <name>?
     * expr      :: ( loop <name>? <block_sig> <instr>* )
     * block_sig :: ( result <type>* )*
     *
     */


    function parseLoop() {
      var label = t.identifier(getUniqueName("loop"));
      var blockResult;
      var instr = [];

      if (token.type === _tokenizer.tokens.identifier) {
        label = identifierFromToken(token);
        eatToken();
      } else {
        label = t.withRaw(label, ""); // preserve anonymous
      }

      while (token.type === _tokenizer.tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(_tokenizer.keywords.result) === true) {
          eatToken();
          blockResult = token.value;
          eatToken();
        } else if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            // Instruction
            instr.push(parseFuncInstr());
          } else {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in loop body" + ", given " + tokenToString(token));
          }();
        }

        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      return t.loopInstruction(label, blockResult, instr);
    }

    function parseCallIndirect() {
      var typeRef;
      var params = [];
      var results = [];
      var instrs = [];

      while (token.type !== _tokenizer.tokens.closeParen) {
        if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.type)) {
          eatToken(); // (

          eatToken(); // type

          typeRef = parseTypeReference();
        } else if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.param)) {
          eatToken(); // (

          eatToken(); // param

          /**
           * Params can be empty:
           * (params)`
           */

          if (token.type !== _tokenizer.tokens.closeParen) {
            params.push.apply(params, _toConsumableArray(parseFuncParam()));
          }
        } else if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.result)) {
          eatToken(); // (

          eatToken(); // result

          /**
           * Results can be empty:
           * (result)`
           */

          if (token.type !== _tokenizer.tokens.closeParen) {
            results.push.apply(results, _toConsumableArray(parseFuncResult()));
          }
        } else {
          eatTokenOfType(_tokenizer.tokens.openParen);
          instrs.push(parseFuncInstr());
        }

        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      return t.callIndirectInstruction(typeRef !== undefined ? typeRef : t.signature(params, results), instrs);
    }
    /**
     * Parses an export instruction
     *
     * WAT:
     *
     * export:  ( export <string> <exkind> )
     * exkind:  ( func <var> )
     *          ( global <var> )
     *          ( table <var> )
     *          ( memory <var> )
     * var:    <nat> | <name>
     *
     */


    function parseExport() {
      if (token.type !== _tokenizer.tokens.string) {
        throw new Error("Expected string after export, got: " + token.type);
      }

      var name = token.value;
      eatToken();
      var moduleExportDescr = parseModuleExportDescr();
      return t.moduleExport(name, moduleExportDescr);
    }

    function parseModuleExportDescr() {
      var startLoc = getStartLoc();
      var type = "";
      var index;
      eatTokenOfType(_tokenizer.tokens.openParen);

      while (token.type !== _tokenizer.tokens.closeParen) {
        if (isKeyword(token, _tokenizer.keywords.func)) {
          type = "Func";
          eatToken();
          index = parseExportIndex(token);
        } else if (isKeyword(token, _tokenizer.keywords.table)) {
          type = "Table";
          eatToken();
          index = parseExportIndex(token);
        } else if (isKeyword(token, _tokenizer.keywords.global)) {
          type = "Global";
          eatToken();
          index = parseExportIndex(token);
        } else if (isKeyword(token, _tokenizer.keywords.memory)) {
          type = "Memory";
          eatToken();
          index = parseExportIndex(token);
        }

        eatToken();
      }

      if (type === "") {
        throw new Error("Unknown export type");
      }

      if (index === undefined) {
        throw new Error("Exported function must have a name");
      }

      var node = t.moduleExportDescr(type, index);
      var endLoc = getEndLoc();
      eatTokenOfType(_tokenizer.tokens.closeParen);
      return t.withLoc(node, endLoc, startLoc);
    }

    function parseModule() {
      var name = null;
      var isBinary = false;
      var isQuote = false;
      var moduleFields = [];

      if (token.type === _tokenizer.tokens.identifier) {
        name = token.value;
        eatToken();
      }

      if (hasPlugin("wast") && token.type === _tokenizer.tokens.name && token.value === "binary") {
        eatToken();
        isBinary = true;
      }

      if (hasPlugin("wast") && token.type === _tokenizer.tokens.name && token.value === "quote") {
        eatToken();
        isQuote = true;
      }

      if (isBinary === true) {
        var blob = [];

        while (token.type === _tokenizer.tokens.string) {
          blob.push(token.value);
          eatToken();
          maybeIgnoreComment();
        }

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.binaryModule(name, blob);
      }

      if (isQuote === true) {
        var string = [];

        while (token.type === _tokenizer.tokens.string) {
          string.push(token.value);
          eatToken();
        }

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.quoteModule(name, string);
      }

      while (token.type !== _tokenizer.tokens.closeParen) {
        moduleFields.push(walk());

        if (state.registredExportedElements.length > 0) {
          state.registredExportedElements.forEach(function (decl) {
            moduleFields.push(t.moduleExport(decl.name, t.moduleExportDescr(decl.exportType, decl.id)));
          });
          state.registredExportedElements = [];
        }

        token = tokensList[current];
      }

      eatTokenOfType(_tokenizer.tokens.closeParen);
      return t.module(name, moduleFields);
    }
    /**
     * Parses the arguments of an instruction
     */


    function parseFuncInstrArguments(signature) {
      var args = [];
      var namedArgs = {};
      var signaturePtr = 0;

      while (token.type === _tokenizer.tokens.name || isKeyword(token, _tokenizer.keywords.offset)) {
        var key = token.value;
        eatToken();
        eatTokenOfType(_tokenizer.tokens.equal);
        var value = void 0;

        if (token.type === _tokenizer.tokens.number) {
          value = t.numberLiteralFromRaw(token.value);
        } else {
          throw new Error("Unexpected type for argument: " + token.type);
        }

        namedArgs[key] = value;
        eatToken();
      } // $FlowIgnore


      var signatureLength = signature.vector ? Infinity : signature.length;

      while (token.type !== _tokenizer.tokens.closeParen && ( // $FlowIgnore
      token.type === _tokenizer.tokens.openParen || signaturePtr < signatureLength)) {
        if (token.type === _tokenizer.tokens.identifier) {
          args.push(t.identifier(token.value));
          eatToken();
        } else if (token.type === _tokenizer.tokens.valtype) {
          // Handle locals
          args.push(t.valtypeLiteral(token.value));
          eatToken();
        } else if (token.type === _tokenizer.tokens.string) {
          args.push(t.stringLiteral(token.value));
          eatToken();
        } else if (token.type === _tokenizer.tokens.number) {
          args.push( // TODO(sven): refactor the type signature handling
          // https://github.com/xtuc/webassemblyjs/pull/129 is a good start
          t.numberLiteralFromRaw(token.value, // $FlowIgnore
          signature[signaturePtr] || "f64")); // $FlowIgnore

          if (!signature.vector) {
            ++signaturePtr;
          }

          eatToken();
        } else if (token.type === _tokenizer.tokens.openParen) {
          /**
           * Maybe some nested instructions
           */
          eatToken(); // Instruction

          if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
          ) {
              // $FlowIgnore
              args.push(parseFuncInstr());
            } else {
            throw function () {
              return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in nested instruction" + ", given " + tokenToString(token));
            }();
          }

          if (token.type === _tokenizer.tokens.closeParen) {
            eatToken();
          }
        } else {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in instruction argument" + ", given " + tokenToString(token));
          }();
        }
      }

      return {
        args: args,
        namedArgs: namedArgs
      };
    }
    /**
     * Parses an instruction
     *
     * WAT:
     *
     * instr      :: plaininst
     *               blockinstr
     *
     * blockinstr :: 'block' I:label rt:resulttype (in:instr*) 'end' id?
     *               'loop' I:label rt:resulttype (in:instr*) 'end' id?
     *               'if' I:label rt:resulttype (in:instr*) 'else' id? (in2:intr*) 'end' id?
     *
     * plaininst  :: 'unreachable'
     *               'nop'
     *               'br' l:labelidx
     *               'br_if' l:labelidx
     *               'br_table' l*:vec(labelidx) ln:labelidx
     *               'return'
     *               'call' x:funcidx
     *               'call_indirect' x, I:typeuse
     *
     * WAST:
     *
     * instr:
     *   <expr>
     *   <op>
     *   block <name>? <block_sig> <instr>* end <name>?
     *   loop <name>? <block_sig> <instr>* end <name>?
     *   if <name>? <block_sig> <instr>* end <name>?
     *   if <name>? <block_sig> <instr>* else <name>? <instr>* end <name>?
     *
     * expr:
     *   ( <op> )
     *   ( <op> <expr>+ )
     *   ( block <name>? <block_sig> <instr>* )
     *   ( loop <name>? <block_sig> <instr>* )
     *   ( if <name>? <block_sig> ( then <instr>* ) ( else <instr>* )? )
     *   ( if <name>? <block_sig> <expr>+ ( then <instr>* ) ( else <instr>* )? )
     *
     * op:
     *   unreachable
     *   nop
     *   br <var>
     *   br_if <var>
     *   br_table <var>+
     *   return
     *   call <var>
     *   call_indirect <func_sig>
     *   drop
     *   select
     *   get_local <var>
     *   set_local <var>
     *   tee_local <var>
     *   get_global <var>
     *   set_global <var>
     *   <type>.load((8|16|32)_<sign>)? <offset>? <align>?
     *   <type>.store(8|16|32)? <offset>? <align>?
     *   current_memory
     *   grow_memory
     *   <type>.const <value>
     *   <type>.<unop>
     *   <type>.<binop>
     *   <type>.<testop>
     *   <type>.<relop>
     *   <type>.<cvtop>/<type>
     *
     * func_type:   ( type <var> )? <param>* <result>*
     */


    function parseFuncInstr() {
      var startLoc = getStartLoc();
      maybeIgnoreComment();
      /**
       * A simple instruction
       */

      if (token.type === _tokenizer.tokens.name || token.type === _tokenizer.tokens.valtype) {
        var _name2 = token.value;
        var object;
        eatToken();

        if (token.type === _tokenizer.tokens.dot) {
          object = _name2;
          eatToken();

          if (token.type !== _tokenizer.tokens.name) {
            throw new TypeError("Unknown token: " + token.type + ", name expected");
          }

          _name2 = token.value;
          eatToken();
        }

        if (token.type === _tokenizer.tokens.closeParen) {
          var _endLoc = token.loc.end;

          if (typeof object === "undefined") {
            return t.withLoc(t.instruction(_name2), _endLoc, startLoc);
          } else {
            return t.withLoc(t.objectInstruction(_name2, object, []), _endLoc, startLoc);
          }
        }

        var signature = t.signatureForOpcode(object || "", _name2);

        var _parseFuncInstrArgume = parseFuncInstrArguments(signature),
            _args = _parseFuncInstrArgume.args,
            _namedArgs = _parseFuncInstrArgume.namedArgs;

        var endLoc = token.loc.end;

        if (typeof object === "undefined") {
          return t.withLoc(t.instruction(_name2, _args, _namedArgs), endLoc, startLoc);
        } else {
          return t.withLoc(t.objectInstruction(_name2, object, _args, _namedArgs), endLoc, startLoc);
        }
      } else if (isKeyword(token, _tokenizer.keywords.loop)) {
        /**
         * Else a instruction with a keyword (loop or block)
         */
        eatToken(); // keyword

        return parseLoop();
      } else if (isKeyword(token, _tokenizer.keywords.block)) {
        eatToken(); // keyword

        return parseBlock();
      } else if (isKeyword(token, _tokenizer.keywords.call_indirect)) {
        eatToken(); // keyword

        return parseCallIndirect();
      } else if (isKeyword(token, _tokenizer.keywords.call)) {
        eatToken(); // keyword

        var index;

        if (token.type === _tokenizer.tokens.identifier) {
          index = identifierFromToken(token);
          eatToken();
        } else if (token.type === _tokenizer.tokens.number) {
          index = t.indexLiteral(token.value);
          eatToken();
        }

        var instrArgs = []; // Nested instruction

        while (token.type === _tokenizer.tokens.openParen) {
          eatToken();
          instrArgs.push(parseFuncInstr());
          eatTokenOfType(_tokenizer.tokens.closeParen);
        }

        if (typeof index === "undefined") {
          throw new Error("Missing argument in call instruciton");
        }

        if (instrArgs.length > 0) {
          return t.callInstruction(index, instrArgs);
        } else {
          return t.callInstruction(index);
        }
      } else if (isKeyword(token, _tokenizer.keywords.if)) {
        eatToken(); // Keyword

        return parseIf();
      } else if (isKeyword(token, _tokenizer.keywords.module) && hasPlugin("wast")) {
        eatToken(); // In WAST you can have a module as an instruction's argument
        // we will cast it into a instruction to not break the flow
        // $FlowIgnore

        var module = parseModule();
        return module;
      } else {
        throw function () {
          return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected instruction in function body" + ", given " + tokenToString(token));
        }();
      }
    }
    /*
     * Parses a function
     *
     * WAT:
     *
     * functype :: ( 'func' t1:vec(param) t2:vec(result) )
     * param    :: ( 'param' id? t:valtype )
     * result   :: ( 'result' t:valtype )
     *
     * WAST:
     *
     * func     :: ( func <name>? <func_sig> <local>* <instr>* )
     *             ( func <name>? ( export <string> ) <...> )
     *             ( func <name>? ( import <string> <string> ) <func_sig> )
     * func_sig :: ( type <var> )? <param>* <result>*
     * param    :: ( param <type>* ) | ( param <name> <type> )
     * result   :: ( result <type>* )
     * local    :: ( local <type>* ) | ( local <name> <type> )
     *
     */


    function parseFunc() {
      var fnName = t.identifier(getUniqueName("func"));
      var typeRef;
      var fnBody = [];
      var fnParams = [];
      var fnResult = []; // name

      if (token.type === _tokenizer.tokens.identifier) {
        fnName = identifierFromToken(token);
        eatToken();
      } else {
        fnName = t.withRaw(fnName, ""); // preserve anonymous
      }

      maybeIgnoreComment();

      while (token.type === _tokenizer.tokens.openParen || token.type === _tokenizer.tokens.name || token.type === _tokenizer.tokens.valtype) {
        // Instructions without parens
        if (token.type === _tokenizer.tokens.name || token.type === _tokenizer.tokens.valtype) {
          fnBody.push(parseFuncInstr());
          continue;
        }

        eatToken();

        if (lookaheadAndCheck(_tokenizer.keywords.param) === true) {
          eatToken();
          fnParams.push.apply(fnParams, _toConsumableArray(parseFuncParam()));
        } else if (lookaheadAndCheck(_tokenizer.keywords.result) === true) {
          eatToken();
          fnResult.push.apply(fnResult, _toConsumableArray(parseFuncResult()));
        } else if (lookaheadAndCheck(_tokenizer.keywords.export) === true) {
          eatToken();
          parseFuncExport(fnName);
        } else if (lookaheadAndCheck(_tokenizer.keywords.type) === true) {
          eatToken();
          typeRef = parseTypeReference();
        } else if (lookaheadAndCheck(_tokenizer.tokens.name) === true || lookaheadAndCheck(_tokenizer.tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            // Instruction
            fnBody.push(parseFuncInstr());
          } else {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in func body" + ", given " + tokenToString(token));
          }();
        }

        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      return t.func(fnName, typeRef !== undefined ? typeRef : t.signature(fnParams, fnResult), fnBody);
    }
    /**
     * Parses shorthand export in func
     *
     * export :: ( export <string> )
     */


    function parseFuncExport(funcId) {
      if (token.type !== _tokenizer.tokens.string) {
        throw function () {
          return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Function export expected a string" + ", given " + tokenToString(token));
        }();
      }

      var name = token.value;
      eatToken();
      /**
       * Func export shorthand, we trait it as a syntaxic sugar.
       * A export ModuleField will be added later.
       *
       * We give the anonymous function a generated name and export it.
       */

      var id = t.identifier(funcId.value);
      state.registredExportedElements.push({
        exportType: "Func",
        name: name,
        id: id
      });
    }
    /**
     * Parses a type instruction
     *
     * WAST:
     *
     * typedef: ( type <name>? ( func <param>* <result>* ) )
     */


    function parseType() {
      var id;
      var params = [];
      var result = [];

      if (token.type === _tokenizer.tokens.identifier) {
        id = identifierFromToken(token);
        eatToken();
      }

      if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.func)) {
        eatToken(); // (

        eatToken(); // func

        if (token.type === _tokenizer.tokens.closeParen) {
          eatToken(); // function with an empty signature, we can abort here

          return t.typeInstruction(id, t.signature([], []));
        }

        if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.param)) {
          eatToken(); // (

          eatToken(); // param

          params = parseFuncParam();
          eatTokenOfType(_tokenizer.tokens.closeParen);
        }

        if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.result)) {
          eatToken(); // (

          eatToken(); // result

          result = parseFuncResult();
          eatTokenOfType(_tokenizer.tokens.closeParen);
        }

        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      return t.typeInstruction(id, t.signature(params, result));
    }
    /**
     * Parses a function result
     *
     * WAST:
     *
     * result :: ( result <type>* )
     */


    function parseFuncResult() {
      var results = [];

      while (token.type !== _tokenizer.tokens.closeParen) {
        if (token.type !== _tokenizer.tokens.valtype) {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unexpected token in func result" + ", given " + tokenToString(token));
          }();
        }

        var valtype = token.value;
        eatToken();
        results.push(valtype);
      }

      return results;
    }
    /**
     * Parses a type reference
     *
     */


    function parseTypeReference() {
      var ref;

      if (token.type === _tokenizer.tokens.identifier) {
        ref = identifierFromToken(token);
        eatToken();
      } else if (token.type === _tokenizer.tokens.number) {
        ref = t.numberLiteralFromRaw(token.value);
        eatToken();
      }

      return ref;
    }
    /**
     * Parses a global instruction
     *
     * WAST:
     *
     * global:  ( global <name>? <global_sig> <instr>* )
     *          ( global <name>? ( export <string> ) <...> )
     *          ( global <name>? ( import <string> <string> ) <global_sig> )
     *
     * global_sig: <type> | ( mut <type> )
     *
     */


    function parseGlobal() {
      var name = t.identifier(getUniqueName("global"));
      var type; // Keep informations in case of a shorthand import

      var importing = null;
      maybeIgnoreComment();

      if (token.type === _tokenizer.tokens.identifier) {
        name = identifierFromToken(token);
        eatToken();
      } else {
        name = t.withRaw(name, ""); // preserve anonymous
      }
      /**
       * maybe export
       */


      if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.export)) {
        eatToken(); // (

        eatToken(); // export

        var exportName = token.value;
        eatTokenOfType(_tokenizer.tokens.string);
        state.registredExportedElements.push({
          exportType: "Global",
          name: exportName,
          id: name
        });
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }
      /**
       * maybe import
       */


      if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.import)) {
        eatToken(); // (

        eatToken(); // import

        var moduleName = token.value;
        eatTokenOfType(_tokenizer.tokens.string);
        var _name3 = token.value;
        eatTokenOfType(_tokenizer.tokens.string);
        importing = {
          module: moduleName,
          name: _name3,
          descr: undefined
        };
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }
      /**
       * global_sig
       */


      if (token.type === _tokenizer.tokens.valtype) {
        type = t.globalType(token.value, "const");
        eatToken();
      } else if (token.type === _tokenizer.tokens.openParen) {
        eatToken(); // (

        if (isKeyword(token, _tokenizer.keywords.mut) === false) {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unsupported global type, expected mut" + ", given " + tokenToString(token));
          }();
        }

        eatToken(); // mut

        type = t.globalType(token.value, "var");
        eatToken();
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      if (type === undefined) {
        throw function () {
          return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Could not determine global type" + ", given " + tokenToString(token));
        }();
      }

      maybeIgnoreComment();
      var init = [];

      if (importing != null) {
        importing.descr = type;
        init.push(t.moduleImport(importing.module, importing.name, importing.descr));
      }
      /**
       * instr*
       */


      while (token.type === _tokenizer.tokens.openParen) {
        eatToken();
        init.push(parseFuncInstr());
        eatTokenOfType(_tokenizer.tokens.closeParen);
      }

      return t.global(type, init, name);
    }
    /**
     * Parses a function param
     *
     * WAST:
     *
     * param    :: ( param <type>* ) | ( param <name> <type> )
     */


    function parseFuncParam() {
      var params = [];
      var id;
      var valtype;

      if (token.type === _tokenizer.tokens.identifier) {
        id = token.value;
        eatToken();
      }

      if (token.type === _tokenizer.tokens.valtype) {
        valtype = token.value;
        eatToken();
        params.push({
          id: id,
          valtype: valtype
        });
        /**
         * Shorthand notation for multiple anonymous parameters
         * @see https://webassembly.github.io/spec/core/text/types.html#function-types
         * @see https://github.com/xtuc/webassemblyjs/issues/6
         */

        if (id === undefined) {
          while (token.type === _tokenizer.tokens.valtype) {
            valtype = token.value;
            eatToken();
            params.push({
              id: undefined,
              valtype: valtype
            });
          }
        }
      } else {// ignore
      }

      return params;
    }
    /**
     * Parses an element segments instruction
     *
     * WAST:
     *
     * elem:    ( elem <var>? (offset <instr>* ) <var>* )
     *          ( elem <var>? <expr> <var>* )
     *
     * var:    <nat> | <name>
     */


    function parseElem() {
      var tableIndex = t.indexLiteral(0);
      var offset = [];
      var funcs = [];

      if (token.type === _tokenizer.tokens.identifier) {
        tableIndex = identifierFromToken(token);
        eatToken();
      }

      if (token.type === _tokenizer.tokens.number) {
        tableIndex = t.indexLiteral(token.value);
        eatToken();
      }

      while (token.type !== _tokenizer.tokens.closeParen) {
        if (lookaheadAndCheck(_tokenizer.tokens.openParen, _tokenizer.keywords.offset)) {
          eatToken(); // (

          eatToken(); // offset

          while (token.type !== _tokenizer.tokens.closeParen) {
            eatTokenOfType(_tokenizer.tokens.openParen);
            offset.push(parseFuncInstr());
            eatTokenOfType(_tokenizer.tokens.closeParen);
          }

          eatTokenOfType(_tokenizer.tokens.closeParen);
        } else if (token.type === _tokenizer.tokens.identifier) {
          funcs.push(t.identifier(token.value));
          eatToken();
        } else if (token.type === _tokenizer.tokens.number) {
          funcs.push(t.indexLiteral(token.value));
          eatToken();
        } else if (token.type === _tokenizer.tokens.openParen) {
          eatToken(); // (

          offset.push(parseFuncInstr());
          eatTokenOfType(_tokenizer.tokens.closeParen);
        } else {
          throw function () {
            return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unsupported token in elem" + ", given " + tokenToString(token));
          }();
        }
      }

      return t.elem(tableIndex, offset, funcs);
    }
    /**
     * Parses the start instruction in a module
     *
     * WAST:
     *
     * start:   ( start <var> )
     * var:    <nat> | <name>
     *
     * WAT:
     * start ::= ‘(’ ‘start’  x:funcidx ‘)’
     */


    function parseStart() {
      if (token.type === _tokenizer.tokens.identifier) {
        var index = identifierFromToken(token);
        eatToken();
        return t.start(index);
      }

      if (token.type === _tokenizer.tokens.number) {
        var _index2 = t.indexLiteral(token.value);

        eatToken();
        return t.start(_index2);
      }

      throw new Error("Unknown start, token: " + tokenToString(token));
    }

    if (token.type === _tokenizer.tokens.openParen) {
      eatToken();
      var startLoc = getStartLoc();

      if (isKeyword(token, _tokenizer.keywords.export)) {
        eatToken();
        var node = parseExport();

        var _endLoc2 = getEndLoc();

        return t.withLoc(node, _endLoc2, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.loop)) {
        eatToken();

        var _node = parseLoop();

        var _endLoc3 = getEndLoc();

        return t.withLoc(_node, _endLoc3, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.func)) {
        eatToken();

        var _node2 = parseFunc();

        var _endLoc4 = getEndLoc();

        maybeIgnoreComment();
        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node2, _endLoc4, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.module)) {
        eatToken();

        var _node3 = parseModule();

        var _endLoc5 = getEndLoc();

        return t.withLoc(_node3, _endLoc5, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.import)) {
        eatToken();

        var _node4 = parseImport();

        var _endLoc6 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node4, _endLoc6, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.block)) {
        eatToken();

        var _node5 = parseBlock();

        var _endLoc7 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node5, _endLoc7, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.memory)) {
        eatToken();

        var _node6 = parseMemory();

        var _endLoc8 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node6, _endLoc8, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.data)) {
        eatToken();

        var _node7 = parseData();

        var _endLoc9 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node7, _endLoc9, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.table)) {
        eatToken();

        var _node8 = parseTable();

        var _endLoc10 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node8, _endLoc10, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.global)) {
        eatToken();

        var _node9 = parseGlobal();

        var _endLoc11 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node9, _endLoc11, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.type)) {
        eatToken();

        var _node10 = parseType();

        var _endLoc12 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node10, _endLoc12, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.start)) {
        eatToken();

        var _node11 = parseStart();

        var _endLoc13 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node11, _endLoc13, startLoc);
      }

      if (isKeyword(token, _tokenizer.keywords.elem)) {
        eatToken();

        var _node12 = parseElem();

        var _endLoc14 = getEndLoc();

        eatTokenOfType(_tokenizer.tokens.closeParen);
        return t.withLoc(_node12, _endLoc14, startLoc);
      }

      var instruction = parseFuncInstr();
      var endLoc = getEndLoc();
      maybeIgnoreComment();

      if (_typeof(instruction) === "object") {
        if (typeof token !== "undefined") {
          eatTokenOfType(_tokenizer.tokens.closeParen);
        }

        return t.withLoc(instruction, endLoc, startLoc);
      }
    }

    if (token.type === _tokenizer.tokens.comment) {
      var _startLoc = getStartLoc();

      var builder = token.opts.type === "leading" ? t.leadingComment : t.blockComment;

      var _node13 = builder(token.value);

      eatToken(); // comment

      var _endLoc15 = getEndLoc();

      return t.withLoc(_node13, _endLoc15, _startLoc);
    }

    throw function () {
      return new Error("\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, token.loc) + "\n" + "Unknown token" + ", given " + tokenToString(token));
    }();
  }

  var body = [];

  while (current < tokensList.length) {
    body.push(walk());
  }

  return t.program(body);
}
},{"./number-literals":64,"./string-literals":65,"./tokenizer":66,"@webassemblyjs/ast":29,"@webassemblyjs/helper-code-frame":40}],63:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  parse: true
};
exports.parse = parse;

var parser = _interopRequireWildcard(require("./grammar"));

var _tokenizer = require("./tokenizer");

var _numberLiterals = require("./number-literals");

Object.keys(_numberLiterals).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _numberLiterals[key];
    }
  });
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function parse(source) {
  var tokens = (0, _tokenizer.tokenize)(source); // We pass the source here to show code frames

  var ast = parser.parse(tokens, source);
  return ast;
}
},{"./grammar":62,"./number-literals":64,"./tokenizer":66}],64:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse32F = parse32F;
exports.parse64F = parse64F;
exports.parse32I = parse32I;
exports.parseU32 = parseU32;
exports.parse64I = parse64I;
exports.isInfLiteral = isInfLiteral;
exports.isNanLiteral = isNanLiteral;

var _long = _interopRequireDefault(require("@xtuc/long"));

var _floatingPointHexParser = _interopRequireDefault(require("@webassemblyjs/floating-point-hex-parser"));

var _helperApiError = require("@webassemblyjs/helper-api-error");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse32F(sourceString) {
  if (isHexLiteral(sourceString)) {
    return (0, _floatingPointHexParser.default)(sourceString);
  }

  if (isInfLiteral(sourceString)) {
    return sourceString[0] === "-" ? -1 : 1;
  }

  if (isNanLiteral(sourceString)) {
    return (sourceString[0] === "-" ? -1 : 1) * (sourceString.includes(":") ? parseInt(sourceString.substring(sourceString.indexOf(":") + 1), 16) : 0x400000);
  }

  return parseFloat(sourceString);
}

function parse64F(sourceString) {
  if (isHexLiteral(sourceString)) {
    return (0, _floatingPointHexParser.default)(sourceString);
  }

  if (isInfLiteral(sourceString)) {
    return sourceString[0] === "-" ? -1 : 1;
  }

  if (isNanLiteral(sourceString)) {
    return (sourceString[0] === "-" ? -1 : 1) * (sourceString.includes(":") ? parseInt(sourceString.substring(sourceString.indexOf(":") + 1), 16) : 0x8000000000000);
  }

  if (isHexLiteral(sourceString)) {
    return (0, _floatingPointHexParser.default)(sourceString);
  }

  return parseFloat(sourceString);
}

function parse32I(sourceString) {
  var value = 0;

  if (isHexLiteral(sourceString)) {
    value = ~~parseInt(sourceString, 16);
  } else if (isDecimalExponentLiteral(sourceString)) {
    throw new Error("This number literal format is yet to be implemented.");
  } else {
    value = parseInt(sourceString, 10);
  }

  return value;
}

function parseU32(sourceString) {
  var value = parse32I(sourceString);

  if (value < 0) {
    throw new _helperApiError.CompileError("Illegal value for u32: " + sourceString);
  }

  return value;
}

function parse64I(sourceString) {
  var long;

  if (isHexLiteral(sourceString)) {
    long = _long.default.fromString(sourceString, false, 16);
  } else if (isDecimalExponentLiteral(sourceString)) {
    throw new Error("This number literal format is yet to be implemented.");
  } else {
    long = _long.default.fromString(sourceString);
  }

  return {
    high: long.high,
    low: long.low
  };
}

var NAN_WORD = /^\+?-?nan/;
var INF_WORD = /^\+?-?inf/;

function isInfLiteral(sourceString) {
  return INF_WORD.test(sourceString.toLowerCase());
}

function isNanLiteral(sourceString) {
  return NAN_WORD.test(sourceString.toLowerCase());
}

function isDecimalExponentLiteral(sourceString) {
  return !isHexLiteral(sourceString) && sourceString.toUpperCase().includes("E");
}

function isHexLiteral(sourceString) {
  return sourceString.substring(0, 2).toUpperCase() === "0X" || sourceString.substring(0, 3).toUpperCase() === "-0X";
}
},{"@webassemblyjs/floating-point-hex-parser":38,"@webassemblyjs/helper-api-error":39,"@xtuc/long":70}],65:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseString = parseString;
// string literal characters cannot contain control codes
var CONTROL_CODES = [0, // null
7, // bell
8, // backspace
9, // horizontal
10, // line feed
11, // vertical tab
12, // form feed
13, // carriage return
26, // Control-Z
27, // escape
127 // delete
]; // escaped sequences can either be a two character hex value, or one of the
// following single character codes

function decodeControlCharacter(char) {
  switch (char) {
    case "t":
      return 0x09;

    case "n":
      return 0x0a;

    case "r":
      return 0x0d;

    case '"':
      return 0x22;

    case "′":
      return 0x27;

    case "\\":
      return 0x5c;
  }

  return -1;
}

var ESCAPE_CHAR = 92; // backslash

var QUOTE_CHAR = 34; // backslash
// parse string as per the spec:
// https://webassembly.github.io/spec/core/multipage/text/values.html#text-string

function parseString(value) {
  var byteArray = [];
  var index = 0;

  while (index < value.length) {
    var charCode = value.charCodeAt(index);

    if (CONTROL_CODES.indexOf(charCode) !== -1) {
      throw new Error("ASCII control characters are not permitted within string literals");
    }

    if (charCode === QUOTE_CHAR) {
      throw new Error("quotes are not permitted within string literals");
    }

    if (charCode === ESCAPE_CHAR) {
      var firstChar = value.substr(index + 1, 1);
      var decodedControlChar = decodeControlCharacter(firstChar);

      if (decodedControlChar !== -1) {
        // single character escaped values, e.g. \r
        byteArray.push(decodedControlChar);
        index += 2;
      } else {
        // hex escaped values, e.g. \2a
        var hexValue = value.substr(index + 1, 2);

        if (!/^[0-9A-F]{2}$/i.test(hexValue)) {
          throw new Error("invalid character encoding");
        }

        byteArray.push(parseInt(hexValue, 16));
        index += 3;
      }
    } else {
      // ASCII encoded values
      byteArray.push(charCode);
      index++;
    }
  }

  return byteArray;
}
},{}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tokenize = tokenize;
exports.tokens = exports.keywords = void 0;

var _helperFsm = require("@webassemblyjs/helper-fsm");

var _helperCodeFrame = require("@webassemblyjs/helper-code-frame");

// eslint-disable-next-line
function getCodeFrame(source, line, column) {
  var loc = {
    start: {
      line: line,
      column: column
    }
  };
  return "\n" + (0, _helperCodeFrame.codeFrameFromSource)(source, loc) + "\n";
}

var WHITESPACE = /\s/;
var PARENS = /\(|\)/;
var LETTERS = /[a-z0-9_/]/i;
var idchar = /[a-z0-9!#$%&*+./:<=>?@\\[\]^_`|~-]/i;
var valtypes = ["i32", "i64", "f32", "f64"];
var NUMBERS = /[0-9|.|_]/;
var NUMBER_KEYWORDS = /nan|inf/;

function isNewLine(char) {
  return char.charCodeAt(0) === 10 || char.charCodeAt(0) === 13;
}

function Token(type, value, start, end) {
  var opts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var token = {
    type: type,
    value: value,
    loc: {
      start: start,
      end: end
    }
  };

  if (Object.keys(opts).length > 0) {
    // $FlowIgnore
    token["opts"] = opts;
  }

  return token;
}

var tokenTypes = {
  openParen: "openParen",
  closeParen: "closeParen",
  number: "number",
  string: "string",
  name: "name",
  identifier: "identifier",
  valtype: "valtype",
  dot: "dot",
  comment: "comment",
  equal: "equal",
  keyword: "keyword"
};
var keywords = {
  module: "module",
  func: "func",
  param: "param",
  result: "result",
  export: "export",
  loop: "loop",
  block: "block",
  if: "if",
  then: "then",
  else: "else",
  call: "call",
  call_indirect: "call_indirect",
  import: "import",
  memory: "memory",
  table: "table",
  global: "global",
  anyfunc: "anyfunc",
  mut: "mut",
  data: "data",
  type: "type",
  elem: "elem",
  start: "start",
  offset: "offset"
};
exports.keywords = keywords;
var NUMERIC_SEPARATOR = "_";
/**
 * Build the FSM for number literals
 */

var numberLiteralFSM = new _helperFsm.FSM({
  START: [(0, _helperFsm.makeTransition)(/-|\+/, "AFTER_SIGN"), (0, _helperFsm.makeTransition)(/nan:0x/, "NAN_HEX", {
    n: 6
  }), (0, _helperFsm.makeTransition)(/nan|inf/, "STOP", {
    n: 3
  }), (0, _helperFsm.makeTransition)(/0x/, "HEX", {
    n: 2
  }), (0, _helperFsm.makeTransition)(/[0-9]/, "DEC"), (0, _helperFsm.makeTransition)(/\./, "DEC_FRAC")],
  AFTER_SIGN: [(0, _helperFsm.makeTransition)(/nan:0x/, "NAN_HEX", {
    n: 6
  }), (0, _helperFsm.makeTransition)(/nan|inf/, "STOP", {
    n: 3
  }), (0, _helperFsm.makeTransition)(/0x/, "HEX", {
    n: 2
  }), (0, _helperFsm.makeTransition)(/[0-9]/, "DEC"), (0, _helperFsm.makeTransition)(/\./, "DEC_FRAC")],
  DEC_FRAC: [(0, _helperFsm.makeTransition)(/[0-9]/, "DEC_FRAC", {
    allowedSeparator: NUMERIC_SEPARATOR
  }), (0, _helperFsm.makeTransition)(/e|E/, "DEC_SIGNED_EXP")],
  DEC: [(0, _helperFsm.makeTransition)(/[0-9]/, "DEC", {
    allowedSeparator: NUMERIC_SEPARATOR
  }), (0, _helperFsm.makeTransition)(/\./, "DEC_FRAC"), (0, _helperFsm.makeTransition)(/e|E/, "DEC_SIGNED_EXP")],
  DEC_SIGNED_EXP: [(0, _helperFsm.makeTransition)(/\+|-/, "DEC_EXP"), (0, _helperFsm.makeTransition)(/[0-9]/, "DEC_EXP")],
  DEC_EXP: [(0, _helperFsm.makeTransition)(/[0-9]/, "DEC_EXP", {
    allowedSeparator: NUMERIC_SEPARATOR
  })],
  HEX: [(0, _helperFsm.makeTransition)(/[0-9|A-F|a-f]/, "HEX", {
    allowedSeparator: NUMERIC_SEPARATOR
  }), (0, _helperFsm.makeTransition)(/\./, "HEX_FRAC"), (0, _helperFsm.makeTransition)(/p|P/, "HEX_SIGNED_EXP")],
  HEX_FRAC: [(0, _helperFsm.makeTransition)(/[0-9|A-F|a-f]/, "HEX_FRAC", {
    allowedSeparator: NUMERIC_SEPARATOR
  }), (0, _helperFsm.makeTransition)(/p|P|/, "HEX_SIGNED_EXP")],
  HEX_SIGNED_EXP: [(0, _helperFsm.makeTransition)(/[0-9|+|-]/, "HEX_EXP")],
  HEX_EXP: [(0, _helperFsm.makeTransition)(/[0-9]/, "HEX_EXP", {
    allowedSeparator: NUMERIC_SEPARATOR
  })],
  NAN_HEX: [(0, _helperFsm.makeTransition)(/[0-9|A-F|a-f]/, "NAN_HEX", {
    allowedSeparator: NUMERIC_SEPARATOR
  })],
  STOP: []
}, "START", "STOP");

function tokenize(input) {
  var current = 0;
  var char = input[current]; // Used by SourceLocation

  var column = 1;
  var line = 1;
  var tokens = [];
  /**
   * Creates a pushToken function for a given type
   */

  function pushToken(type) {
    return function (v) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var startColumn = opts.startColumn || column - String(v).length;
      delete opts.startColumn;
      var endColumn = opts.endColumn || startColumn + String(v).length - 1;
      delete opts.endColumn;
      var start = {
        line: line,
        column: startColumn
      };
      var end = {
        line: line,
        column: endColumn
      };
      tokens.push(Token(type, v, start, end, opts));
    };
  }
  /**
   * Functions to save newly encountered tokens
   */


  var pushCloseParenToken = pushToken(tokenTypes.closeParen);
  var pushOpenParenToken = pushToken(tokenTypes.openParen);
  var pushNumberToken = pushToken(tokenTypes.number);
  var pushValtypeToken = pushToken(tokenTypes.valtype);
  var pushNameToken = pushToken(tokenTypes.name);
  var pushIdentifierToken = pushToken(tokenTypes.identifier);
  var pushKeywordToken = pushToken(tokenTypes.keyword);
  var pushDotToken = pushToken(tokenTypes.dot);
  var pushStringToken = pushToken(tokenTypes.string);
  var pushCommentToken = pushToken(tokenTypes.comment);
  var pushEqualToken = pushToken(tokenTypes.equal);
  /**
   * Can be used to look at the next character(s).
   *
   * The default behavior `lookahead()` simply returns the next character without consuming it.
   * Letters are always returned in lowercase.
   *
   * @param {number} length How many characters to query. Default = 1
   * @param {number} offset How many characters to skip forward from current one. Default = 1
   *
   */

  function lookahead() {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    return input.substring(current + offset, current + offset + length).toLowerCase();
  }
  /**
   * Advances the cursor in the input by a certain amount
   *
   * @param {number} amount How many characters to consume. Default = 1
   */


  function eatCharacter() {
    var amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    column += amount;
    current += amount;
    char = input[current];
  }

  while (current < input.length) {
    // ;;
    if (char === ";" && lookahead() === ";") {
      var startColumn = column;
      eatCharacter(2);
      var text = "";

      while (!isNewLine(char)) {
        text += char;
        eatCharacter();

        if (char === undefined) {
          break;
        }
      }

      var endColumn = column;
      pushCommentToken(text, {
        type: "leading",
        startColumn: startColumn,
        endColumn: endColumn
      });
      continue;
    } // (;


    if (char === "(" && lookahead() === ";") {
      var _startColumn = column;
      eatCharacter(2);
      var _text = ""; // ;)

      while (true) {
        char = input[current];

        if (char === ";" && lookahead() === ")") {
          eatCharacter(2);
          break;
        }

        _text += char;
        eatCharacter();

        if (isNewLine(char)) {
          line++;
          column = 0;
        }
      }

      var _endColumn = column;
      pushCommentToken(_text, {
        type: "block",
        startColumn: _startColumn,
        endColumn: _endColumn
      });
      continue;
    }

    if (char === "(") {
      pushOpenParenToken(char);
      eatCharacter();
      continue;
    }

    if (char === "=") {
      pushEqualToken(char);
      eatCharacter();
      continue;
    }

    if (char === ")") {
      pushCloseParenToken(char);
      eatCharacter();
      continue;
    }

    if (isNewLine(char)) {
      line++;
      eatCharacter();
      column = 0;
      continue;
    }

    if (WHITESPACE.test(char)) {
      eatCharacter();
      continue;
    }

    if (char === "$") {
      var _startColumn2 = column;
      eatCharacter();
      var value = "";

      while (idchar.test(char)) {
        value += char;
        eatCharacter();
      }

      var _endColumn2 = column;
      pushIdentifierToken(value, {
        startColumn: _startColumn2,
        endColumn: _endColumn2
      });
      continue;
    }

    if (NUMBERS.test(char) || NUMBER_KEYWORDS.test(lookahead(3, 0)) || char === "-" || char === "+") {
      var _startColumn3 = column;

      var _value = numberLiteralFSM.run(input.slice(current));

      if (_value === "") {
        throw new Error(getCodeFrame(input, line, column) + "Unexpected character " + JSON.stringify(char));
      }

      pushNumberToken(_value, {
        startColumn: _startColumn3
      });
      eatCharacter(_value.length);

      if (char && !PARENS.test(char) && !WHITESPACE.test(char)) {
        throw new Error(getCodeFrame(input, line, column) + "Unexpected character " + JSON.stringify(char));
      }

      continue;
    }

    if (char === '"') {
      var _startColumn4 = column;
      var _value2 = "";
      eatCharacter(); // "

      while (char !== '"') {
        if (isNewLine(char)) {
          throw new Error(getCodeFrame(input, line, column) + "Unexpected character " + JSON.stringify(char));
        }

        _value2 += char;
        eatCharacter(); // char
      }

      eatCharacter(); // "

      var _endColumn3 = column;
      pushStringToken(_value2, {
        startColumn: _startColumn4,
        endColumn: _endColumn3
      });
      continue;
    }

    if (LETTERS.test(char)) {
      var _value3 = "";
      var _startColumn5 = column;

      while (char && LETTERS.test(char)) {
        _value3 += char;
        eatCharacter();
      }
      /*
       * Handle MemberAccess
       */


      if (char === ".") {
        var dotStartColumn = column;

        if (valtypes.indexOf(_value3) !== -1) {
          pushValtypeToken(_value3, {
            startColumn: _startColumn5
          });
        } else {
          pushNameToken(_value3);
        }

        eatCharacter();
        _value3 = "";
        var nameStartColumn = column;

        while (LETTERS.test(char)) {
          _value3 += char;
          eatCharacter();
        }

        pushDotToken(".", {
          startColumn: dotStartColumn
        });
        pushNameToken(_value3, {
          startColumn: nameStartColumn
        });
        continue;
      }
      /*
       * Handle keywords
       */
      // $FlowIgnore


      if (typeof keywords[_value3] === "string") {
        pushKeywordToken(_value3, {
          startColumn: _startColumn5
        });
        continue;
      }
      /*
       * Handle types
       */


      if (valtypes.indexOf(_value3) !== -1) {
        pushValtypeToken(_value3, {
          startColumn: _startColumn5
        });
        continue;
      }
      /*
       * Handle literals
       */


      pushNameToken(_value3, {
        startColumn: _startColumn5
      });
      continue;
    }

    throw new Error(getCodeFrame(input, line, column) + "Unexpected character " + JSON.stringify(char));
  }

  return tokens;
}

var tokens = tokenTypes;
exports.tokens = tokens;
},{"@webassemblyjs/helper-code-frame":40,"@webassemblyjs/helper-fsm":41}],67:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.print = print;

var _ast = require("@webassemblyjs/ast");

var _long = _interopRequireDefault(require("@xtuc/long"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

var compact = false;
var space = " ";

var quote = function quote(str) {
  return "\"".concat(str, "\"");
};

function indent(nb) {
  return Array(nb).fill(space + space).join("");
} // TODO(sven): allow arbitrary ast nodes


function print(n) {
  if (n.type === "Program") {
    return printProgram(n, 0);
  } else {
    throw new Error("Unsupported node in print of type: " + String(n.type));
  }
}

function printProgram(n, depth) {
  return n.body.reduce(function (acc, child) {
    if (child.type === "Module") {
      acc += printModule(child, depth + 1);
    }

    if (child.type === "Func") {
      acc += printFunc(child, depth + 1);
    }

    if (child.type === "BlockComment") {
      acc += printBlockComment(child);
    }

    if (child.type === "LeadingComment") {
      acc += printLeadingComment(child);
    }

    if (compact === false) {
      acc += "\n";
    }

    return acc;
  }, "");
}

function printTypeInstruction(n) {
  var out = "";
  out += "(";
  out += "type";
  out += space;

  if (n.id != null) {
    out += printIndex(n.id);
    out += space;
  }

  out += "(";
  out += "func";
  n.functype.params.forEach(function (param) {
    out += space;
    out += "(";
    out += "param";
    out += space;
    out += printFuncParam(param);
    out += ")";
  });
  n.functype.results.forEach(function (result) {
    out += space;
    out += "(";
    out += "result";
    out += space;
    out += result;
    out += ")";
  });
  out += ")"; // func

  out += ")";
  return out;
}

function printModule(n, depth) {
  var out = "(";
  out += "module";

  if (typeof n.id === "string") {
    out += space;
    out += n.id;
  }

  if (compact === false) {
    out += "\n";
  } else {
    out += space;
  }

  n.fields.forEach(function (field) {
    if (compact === false) {
      out += indent(depth);
    }

    switch (field.type) {
      case "Func":
        {
          out += printFunc(field, depth + 1);
          break;
        }

      case "TypeInstruction":
        {
          out += printTypeInstruction(field);
          break;
        }

      case "Table":
        {
          out += printTable(field);
          break;
        }

      case "Global":
        {
          out += printGlobal(field, depth + 1);
          break;
        }

      case "ModuleExport":
        {
          out += printModuleExport(field);
          break;
        }

      case "ModuleImport":
        {
          out += printModuleImport(field);
          break;
        }

      case "Memory":
        {
          out += printMemory(field);
          break;
        }

      case "BlockComment":
        {
          out += printBlockComment(field);
          break;
        }

      case "LeadingComment":
        {
          out += printLeadingComment(field);
          break;
        }

      case "Start":
        {
          out += printStart(field);
          break;
        }

      case "Elem":
        {
          out += printElem(field, depth);
          break;
        }

      case "Data":
        {
          out += printData(field, depth);
          break;
        }

      default:
        throw new Error("Unsupported node in printModule: " + String(field.type));
    }

    if (compact === false) {
      out += "\n";
    }
  });
  out += ")";
  return out;
}

function printData(n, depth) {
  var out = "";
  out += "(";
  out += "data";
  out += space;
  out += printIndex(n.memoryIndex);
  out += space;
  out += printInstruction(n.offset, depth);
  out += space;
  var value = "";
  n.init.values.forEach(function (byte) {
    value += String.fromCharCode(byte);
  }); // Avoid non-displayable characters

  out += JSON.stringify(value);
  out += ")";
  return out;
}

function printElem(n, depth) {
  var out = "";
  out += "(";
  out += "elem";
  out += space;
  out += printIndex(n.table);

  var _n$offset = _slicedToArray(n.offset, 1),
      firstOffset = _n$offset[0];

  out += space;
  out += "(";
  out += "offset";
  out += space;
  out += printInstruction(firstOffset, depth);
  out += ")";
  n.funcs.forEach(function (func) {
    out += space;
    out += printIndex(func);
  });
  out += ")";
  return out;
}

function printStart(n) {
  var out = "";
  out += "(";
  out += "start";
  out += space;
  out += printIndex(n.index);
  out += ")";
  return out;
}

function printLeadingComment(n) {
  // Don't print leading comments in compact mode
  if (compact === true) {
    return "";
  }

  var out = "";
  out += ";;";
  out += n.value;
  out += "\n";
  return out;
}

function printBlockComment(n) {
  // Don't print block comments in compact mode
  if (compact === true) {
    return "";
  }

  var out = "";
  out += "(;";
  out += n.value;
  out += ";)";
  out += "\n";
  return out;
}

function printSignature(n) {
  var out = "";
  n.params.forEach(function (param) {
    out += space;
    out += "(";
    out += "param";
    out += space;
    out += printFuncParam(param);
    out += ")";
  });
  n.results.forEach(function (result) {
    out += space;
    out += "(";
    out += "result";
    out += space;
    out += result;
    out += ")";
  });
  return out;
}

function printModuleImportDescr(n) {
  var out = "";

  if (n.type === "FuncImportDescr") {
    out += "(";
    out += "func";

    if ((0, _ast.isAnonymous)(n.id) === false) {
      out += space;
      out += printIdentifier(n.id);
    }

    out += printSignature(n.signature);
    out += ")";
  }

  if (n.type === "GlobalType") {
    out += "(";
    out += "global";
    out += space;
    out += printGlobalType(n);
    out += ")";
  }

  if (n.type === "Table") {
    out += printTable(n);
  }

  return out;
}

function printModuleImport(n) {
  var out = "";
  out += "(";
  out += "import";
  out += space;
  out += quote(n.module);
  out += space;
  out += quote(n.name);
  out += space;
  out += printModuleImportDescr(n.descr);
  out += ")";
  return out;
}

function printGlobalType(n) {
  var out = "";

  if (n.mutability === "var") {
    out += "(";
    out += "mut";
    out += space;
    out += n.valtype;
    out += ")";
  } else {
    out += n.valtype;
  }

  return out;
}

function printGlobal(n, depth) {
  var out = "";
  out += "(";
  out += "global";
  out += space;

  if (n.name != null && (0, _ast.isAnonymous)(n.name) === false) {
    out += printIdentifier(n.name);
    out += space;
  }

  out += printGlobalType(n.globalType);
  out += space;
  n.init.forEach(function (i) {
    out += printInstruction(i, depth + 1);
  });
  out += ")";
  return out;
}

function printTable(n) {
  var out = "";
  out += "(";
  out += "table";
  out += space;

  if (n.name != null && (0, _ast.isAnonymous)(n.name) === false) {
    out += printIdentifier(n.name);
    out += space;
  }

  out += printLimit(n.limits);
  out += space;
  out += n.elementType;
  out += ")";
  return out;
}

function printFuncParam(n) {
  var out = "";

  if (typeof n.id === "string") {
    out += "$" + n.id;
    out += space;
  }

  out += n.valtype;
  return out;
}

function printFunc(n, depth) {
  var out = "";
  out += "(";
  out += "func";

  if (n.name != null) {
    if (n.name.type === "Identifier" && (0, _ast.isAnonymous)(n.name) === false) {
      out += space;
      out += printIdentifier(n.name);
    }
  }

  if (n.signature.type === "Signature") {
    out += printSignature(n.signature);
  } else {
    var index = n.signature;
    out += space;
    out += "(";
    out += "type";
    out += space;
    out += printIndex(index);
    out += ")";
  }

  if (n.body.length > 0) {
    if (compact === false) {
      out += "\n";
    }

    n.body.forEach(function (i) {
      out += indent(depth);
      out += printInstruction(i, depth);

      if (compact === false) {
        out += "\n";
      }
    });
    out += indent(depth - 1) + ")";
  } else {
    out += ")";
  }

  return out;
}

function printInstruction(n, depth) {
  switch (n.type) {
    case "Instr":
      // $FlowIgnore
      return printGenericInstruction(n, depth + 1);

    case "BlockInstruction":
      // $FlowIgnore
      return printBlockInstruction(n, depth + 1);

    case "IfInstruction":
      // $FlowIgnore
      return printIfInstruction(n, depth + 1);

    case "CallInstruction":
      // $FlowIgnore
      return printCallInstruction(n, depth + 1);

    case "CallIndirectInstruction":
      // $FlowIgnore
      return printCallIndirectIntruction(n, depth + 1);

    case "LoopInstruction":
      // $FlowIgnore
      return printLoopInstruction(n, depth + 1);

    default:
      throw new Error("Unsupported instruction: " + JSON.stringify(n.type));
  }
}

function printCallIndirectIntruction(n, depth) {
  var out = "";
  out += "(";
  out += "call_indirect";

  if (n.signature.type === "Signature") {
    out += printSignature(n.signature);
  } else if (n.signature.type === "Identifier") {
    out += space;
    out += "(";
    out += "type";
    out += space;
    out += printIdentifier(n.signature);
    out += ")";
  } else {
    throw new Error("CallIndirectInstruction: unsupported signature " + JSON.stringify(n.signature.type));
  }

  out += space;

  if (n.intrs != null) {
    // $FlowIgnore
    n.intrs.forEach(function (i, index) {
      // $FlowIgnore
      out += printInstruction(i, depth + 1); // $FlowIgnore

      if (index !== n.intrs.length - 1) {
        out += space;
      }
    });
  }

  out += ")";
  return out;
}

function printLoopInstruction(n, depth) {
  var out = "";
  out += "(";
  out += "loop";

  if (n.label != null && (0, _ast.isAnonymous)(n.label) === false) {
    out += space;
    out += printIdentifier(n.label);
  }

  if (typeof n.resulttype === "string") {
    out += space;
    out += "(";
    out += "result";
    out += space;
    out += n.resulttype;
    out += ")";
  }

  if (n.instr.length > 0) {
    n.instr.forEach(function (e) {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(e, depth + 1);
    });

    if (compact === false) {
      out += "\n";
      out += indent(depth - 1);
    }
  }

  out += ")";
  return out;
}

function printCallInstruction(n, depth) {
  var out = "";
  out += "(";
  out += "call";
  out += space;
  out += printIndex(n.index);

  if (_typeof(n.instrArgs) === "object") {
    // $FlowIgnore
    n.instrArgs.forEach(function (arg) {
      out += space;
      out += printFuncInstructionArg(arg, depth + 1);
    });
  }

  out += ")";
  return out;
}

function printIfInstruction(n, depth) {
  var out = "";
  out += "(";
  out += "if";

  if (n.testLabel != null && (0, _ast.isAnonymous)(n.testLabel) === false) {
    out += space;
    out += printIdentifier(n.testLabel);
  }

  if (typeof n.result === "string") {
    out += space;
    out += "(";
    out += "result";
    out += space;
    out += n.result;
    out += ")";
  }

  if (n.test.length > 0) {
    out += space;
    n.test.forEach(function (i) {
      out += printInstruction(i, depth + 1);
    });
  }

  if (n.consequent.length > 0) {
    if (compact === false) {
      out += "\n";
    }

    out += indent(depth);
    out += "(";
    out += "then";
    depth++;
    n.consequent.forEach(function (i) {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(i, depth + 1);
    });
    depth--;

    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += ")";
  } else {
    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += "(";
    out += "then";
    out += ")";
  }

  if (n.alternate.length > 0) {
    if (compact === false) {
      out += "\n";
    }

    out += indent(depth);
    out += "(";
    out += "else";
    depth++;
    n.alternate.forEach(function (i) {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(i, depth + 1);
    });
    depth--;

    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += ")";
  } else {
    if (compact === false) {
      out += "\n";
      out += indent(depth);
    }

    out += "(";
    out += "else";
    out += ")";
  }

  if (compact === false) {
    out += "\n";
    out += indent(depth - 1);
  }

  out += ")";
  return out;
}

function printBlockInstruction(n, depth) {
  var out = "";
  out += "(";
  out += "block";

  if (n.label != null && (0, _ast.isAnonymous)(n.label) === false) {
    out += space;
    out += printIdentifier(n.label);
  }

  if (typeof n.result === "string") {
    out += space;
    out += "(";
    out += "result";
    out += space;
    out += n.result;
    out += ")";
  }

  if (n.instr.length > 0) {
    n.instr.forEach(function (i) {
      if (compact === false) {
        out += "\n";
      }

      out += indent(depth);
      out += printInstruction(i, depth + 1);
    });

    if (compact === false) {
      out += "\n";
    }

    out += indent(depth - 1);
    out += ")";
  } else {
    out += ")";
  }

  return out;
}

function printGenericInstruction(n, depth) {
  var out = "";
  out += "(";

  if (typeof n.object === "string") {
    out += n.object;
    out += ".";
  }

  out += n.id;
  n.args.forEach(function (arg) {
    out += space;
    out += printFuncInstructionArg(arg, depth + 1);
  });
  out += ")";
  return out;
}

function printLongNumberLiteral(n) {
  if (typeof n.raw === "string") {
    return n.raw;
  }

  var _n$value = n.value,
      low = _n$value.low,
      high = _n$value.high;
  var v = new _long.default(low, high);
  return v.toString();
}

function printFloatLiteral(n) {
  if (typeof n.raw === "string") {
    return n.raw;
  }

  return String(n.value);
}

function printFuncInstructionArg(n, depth) {
  var out = "";

  if (n.type === "NumberLiteral") {
    out += printNumberLiteral(n);
  }

  if (n.type === "LongNumberLiteral") {
    out += printLongNumberLiteral(n);
  }

  if (n.type === "Identifier" && (0, _ast.isAnonymous)(n) === false) {
    out += printIdentifier(n);
  }

  if (n.type === "ValtypeLiteral") {
    out += n.name;
  }

  if (n.type === "FloatLiteral") {
    out += printFloatLiteral(n);
  }

  if ((0, _ast.isInstruction)(n)) {
    out += printInstruction(n, depth + 1);
  }

  return out;
}

function printNumberLiteral(n) {
  if (typeof n.raw === "string") {
    return n.raw;
  }

  return String(n.value);
}

function printModuleExport(n) {
  var out = "";
  out += "(";
  out += "export";
  out += space;
  out += quote(n.name);

  if (n.descr.exportType === "Func") {
    out += space;
    out += "(";
    out += "func";
    out += space;
    out += printIndex(n.descr.id);
    out += ")";
  } else if (n.descr.exportType === "Global") {
    out += space;
    out += "(";
    out += "global";
    out += space;
    out += printIndex(n.descr.id);
    out += ")";
  } else if (n.descr.exportType === "Mem") {
    out += space;
    out += "(";
    out += "memory";
    out += space;
    out += printIndex(n.descr.id);
    out += ")";
  } else if (n.descr.exportType === "Table") {
    out += space;
    out += "(";
    out += "table";
    out += space;
    out += printIndex(n.descr.id);
    out += ")";
  } else {
    throw new Error("printModuleExport: unknown type: " + n.descr.exportType);
  }

  out += ")";
  return out;
}

function printIdentifier(n) {
  return "$" + n.value;
}

function printIndex(n) {
  if (n.type === "Identifier") {
    return printIdentifier(n);
  } else if (n.type === "NumberLiteral") {
    return printNumberLiteral(n);
  } else {
    throw new Error("Unsupported index: " + n.type);
  }
}

function printMemory(n) {
  var out = "";
  out += "(";
  out += "memory";

  if (n.id != null) {
    out += space;
    out += printIndex(n.id);
    out += space;
  }

  out += printLimit(n.limits);
  out += ")";
  return out;
}

function printLimit(n) {
  var out = "";
  out += n.min + "";

  if (n.max != null) {
    out += space;
    out += String(n.max);
  }

  return out;
}
},{"@webassemblyjs/ast":29,"@xtuc/long":70}],68:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

/* eslint-disable no-proto */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Buffer = Buffer;
exports.SlowBuffer = SlowBuffer;
exports.kMaxLength = exports.INSPECT_MAX_BYTES = void 0;

var _ieee = require("@xtuc/ieee754");

const INSPECT_MAX_BYTES = 50;
exports.INSPECT_MAX_BYTES = INSPECT_MAX_BYTES;
var K_MAX_LENGTH = 0x7fffffff;
const kMaxLength = K_MAX_LENGTH;
/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */

exports.kMaxLength = kMaxLength;
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
  console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
}

function typedArraySupport() {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1);
    arr.__proto__ = {
      __proto__: Uint8Array.prototype,
      foo: function () {
        return 42;
      }
    };
    return arr.foo() === 42;
  } catch (e) {
    return false;
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.buffer;
  }
});
Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.byteOffset;
  }
});

function createBuffer(length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"');
  } // Return an augmented `Uint8Array` instance


  var buf = new Uint8Array(length);
  buf.__proto__ = Buffer.prototype;
  return buf;
}
/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */


function Buffer(arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError('The "string" argument must be of type string. Received type number');
    }

    return allocUnsafe(arg);
  }

  return from(arg, encodingOrOffset, length);
} // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97


if (typeof Symbol !== 'undefined' && Symbol.species != null && Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  });
}

Buffer.poolSize = 8192; // not used by this implementation

function from(value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset);
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value);
  }

  if (value == null) {
    throw TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
  }

  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }

  if (typeof value === 'number') {
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  }

  var valueOf = value.valueOf && value.valueOf();

  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length);
  }

  var b = fromObject(value);
  if (b) return b;

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
}
/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/


Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
}; // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148


Buffer.prototype.__proto__ = Uint8Array.prototype;
Buffer.__proto__ = Uint8Array;

function assertSize(size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number');
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"');
  }
}

function alloc(size, fill, encoding) {
  assertSize(size);

  if (size <= 0) {
    return createBuffer(size);
  }

  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  }

  return createBuffer(size);
}
/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/


Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding);
};

function allocUnsafe(size) {
  assertSize(size);
  return createBuffer(size < 0 ? 0 : checked(size) | 0);
}
/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */


Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */


Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size);
};

function fromString(string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding);
  }

  var length = byteLength(string, encoding) | 0;
  var buf = createBuffer(length);
  var actual = buf.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual);
  }

  return buf;
}

function fromArrayLike(array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  var buf = createBuffer(length);

  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255;
  }

  return buf;
}

function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds');
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds');
  }

  var buf;

  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array);
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset);
  } else {
    buf = new Uint8Array(array, byteOffset, length);
  } // Return an augmented `Uint8Array` instance


  buf.__proto__ = Buffer.prototype;
  return buf;
}

function fromObject(obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0;
    var buf = createBuffer(len);

    if (buf.length === 0) {
      return buf;
    }

    obj.copy(buf, 0, 0, len);
    return buf;
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0);
    }

    return fromArrayLike(obj);
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data);
  }
}

function checked(length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
  }

  return length | 0;
}

function SlowBuffer(length) {
  if (+length != length) {
    // eslint-disable-line eqeqeq
    length = 0;
  }

  return Buffer.alloc(+length);
}

Buffer.isBuffer = function isBuffer(b) {
  return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
};

Buffer.compare = function compare(a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);

  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  }

  if (a === b) return 0;
  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};

Buffer.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true;

    default:
      return false;
  }
};

Buffer.concat = function concat(list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }

  if (list.length === 0) {
    return Buffer.alloc(0);
  }

  var i;

  if (length === undefined) {
    length = 0;

    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;

  for (i = 0; i < list.length; ++i) {
    var buf = list[i];

    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf);
    }

    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    buf.copy(buffer, pos);
    pos += buf.length;
  }

  return buffer;
};

function byteLength(string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length;
  }

  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength;
  }

  if (typeof string !== 'string') {
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + typeof string);
  }

  var len = string.length;
  var mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len === 0) return 0; // Use a for loop to avoid recursion

  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len;

      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length;

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2;

      case 'hex':
        return len >>> 1;

      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
        }

        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}

Buffer.byteLength = byteLength;

function slowToString(encoding, start, end) {
  var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.
  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

  if (start === undefined || start < 0) {
    start = 0;
  } // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.


  if (start > this.length) {
    return '';
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return '';
  } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return '';
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end);

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end);

      case 'ascii':
        return asciiSlice(this, start, end);

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
} // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154


Buffer.prototype._isBuffer = true;

function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16() {
  var len = this.length;

  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits');
  }

  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }

  return this;
};

Buffer.prototype.swap32 = function swap32() {
  var len = this.length;

  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits');
  }

  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }

  return this;
};

Buffer.prototype.swap64 = function swap64() {
  var len = this.length;

  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits');
  }

  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }

  return this;
};

Buffer.prototype.toString = function toString() {
  var length = this.length;
  if (length === 0) return '';
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};

Buffer.prototype.toLocaleString = Buffer.prototype.toString;

Buffer.prototype.equals = function equals(b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
  if (this === b) return true;
  return Buffer.compare(this, b) === 0;
};

Buffer.prototype.inspect = function inspect() {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
  if (this.length > max) str += ' ... ';
  return '<Buffer ' + str + '>';
};

Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength);
  }

  if (!Buffer.isBuffer(target)) {
    throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + typeof target);
  }

  if (start === undefined) {
    start = 0;
  }

  if (end === undefined) {
    end = target ? target.length : 0;
  }

  if (thisStart === undefined) {
    thisStart = 0;
  }

  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index');
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }

  if (thisStart >= thisEnd) {
    return -1;
  }

  if (start >= end) {
    return 1;
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }

  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
}; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf


function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1; // Normalize byteOffset

  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }

  byteOffset = +byteOffset; // Coerce to Number.

  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : buffer.length - 1;
  } // Normalize byteOffset: negative offsets start from the end of the buffer


  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

  if (byteOffset >= buffer.length) {
    if (dir) return -1;else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;else return -1;
  } // Normalize val


  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  } // Finally, search either indexOf (if dir is true) or lastIndexOf


  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1;
    }

    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]

    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }

    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }

  throw new TypeError('val must be string, number or Buffer');
}

function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();

    if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }

      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read(buf, i) {
    if (indexSize === 1) {
      return buf[i];
    } else {
      return buf.readUInt16BE(i * indexSize);
    }
  }

  var i;

  if (dir) {
    var foundIndex = -1;

    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

    for (i = byteOffset; i >= 0; i--) {
      var found = true;

      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break;
        }
      }

      if (found) return i;
    }
  }

  return -1;
}

Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};

Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};

Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};

function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;

  if (!length) {
    length = remaining;
  } else {
    length = Number(length);

    if (length > remaining) {
      length = remaining;
    }
  }

  var strLen = string.length;

  if (length > strLen / 2) {
    length = strLen / 2;
  }

  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (numberIsNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }

  return i;
}

function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}

function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}

function latin1Write(buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length);
}

function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}

Buffer.prototype.write = function write(string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0; // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0; // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0;

    if (isFinite(length)) {
      length = length >>> 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  } else {
    throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds');
  }

  if (!encoding) encoding = 'utf8';
  var loweredCase = false;

  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length);

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length);

      case 'ascii':
        return asciiWrite(this, string, offset, length);

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length);

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length);

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON() {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};

function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;

  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }

          break;

        case 2:
          secondByte = buf[i + 1];

          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }

          break;

        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];

          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }

      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res);
} // Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety


var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;

  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
  } // Decode in chunks to avoid "call stack size exceeded".


  var res = '';
  var i = 0;

  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }

  return res;
}

function asciiSlice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }

  return ret;
}

function latin1Slice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }

  return ret;
}

function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = '';

  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }

  return out;
}

function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';

  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }

  return res;
}

Buffer.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;
  var newBuf = this.subarray(start, end); // Return an augmented `Uint8Array` instance

  newBuf.__proto__ = Buffer.prototype;
  return newBuf;
};
/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */


function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}

Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val;
};

Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;

  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val;
};

Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};

Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};

Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};

Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
};

Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};

Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;

  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];

  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }

  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};

Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return this[offset];
  return (0xff - this[offset] + 1) * -1;
};

Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};

Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};

Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};

Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (0, _ieee.read)(this, offset, true, 23, 4);
};

Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (0, _ieee.read)(this, offset, false, 23, 4);
};

Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return (0, _ieee.read)(this, offset, true, 52, 8);
};

Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return (0, _ieee.read)(this, offset, false, 52, 8);
};

function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
}

Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;

  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset + 3] = value >>> 24;
  this[offset + 2] = value >>> 16;
  this[offset + 1] = value >>> 8;
  this[offset] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;

  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;

  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }

    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }

  return offset + byteLength;
};

Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = value & 0xff;
  return offset + 1;
};

Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};

Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};

Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  this[offset + 2] = value >>> 16;
  this[offset + 3] = value >>> 24;
  return offset + 4;
};

Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};

function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
  if (offset < 0) throw new RangeError('Index out of range');
}

function writeFloat(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  (0, _ieee.write)(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}

Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};

Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};

function writeDouble(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;

  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  (0, _ieee.write)(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
}; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


Buffer.prototype.copy = function copy(target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds');
  }

  if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
  if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

  if (end > this.length) end = this.length;

  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end);
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  }

  return len;
}; // Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])


Buffer.prototype.fill = function fill(val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }

    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string');
    }

    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding);
    }

    if (val.length === 1) {
      var code = val.charCodeAt(0);

      if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code;
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  } // Invalid ranges are not set to a default, so can range check early.


  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index');
  }

  if (end <= start) {
    return this;
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;

  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
    var len = bytes.length;

    if (len === 0) {
      throw new TypeError('The value "' + val + '" is invalid for argument "value"');
    }

    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this;
}; // HELPER FUNCTIONS
// ================


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i); // is surrogate component

    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } // valid lead


        leadSurrogate = codePoint;
        continue;
      } // 2 leads in a row


      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      } // valid surrogate pair


      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null; // encode utf8

    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }

  return bytes;
}

function asciiToBytes(str) {
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }

  return byteArray;
}

function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];

  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray;
}

function blitBuffer(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }

  return i;
} // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166


function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}

function numberIsNaN(obj) {
  // For IE11 support
  return obj !== obj; // eslint-disable-line no-self-compare
}

},{"@xtuc/ieee754":69}],69:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.read = read;
exports.write = write;

function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;

  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;

  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }

  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}

function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);

    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }

    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }

    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = e << mLen | m;
  eLen += mLen;

  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

},{}],70:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Long;

/**
 * wasm optimizations, to do native i64 multiplication and divide
 */
var wasm = null;

try {
  wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])), {}).exports;
} catch (e) {} // no wasm support :(

/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 *  See the from* functions below for more convenient ways of constructing Longs.
 * @exports Long
 * @class A Long class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @constructor
 */


function Long(low, high, unsigned) {
  /**
   * The low 32 bits as a signed value.
   * @type {number}
   */
  this.low = low | 0;
  /**
   * The high 32 bits as a signed value.
   * @type {number}
   */

  this.high = high | 0;
  /**
   * Whether unsigned or not.
   * @type {boolean}
   */

  this.unsigned = !!unsigned;
} // The internal representation of a long is the two given signed, 32-bit values.
// We use 32-bit pieces because these are the size of integers on which
// Javascript performs bit-operations.  For operations like addition and
// multiplication, we split each number into 16 bit pieces, which can easily be
// multiplied within Javascript's floating-point representation without overflow
// or change in sign.
//
// In the algorithms below, we frequently reduce the negative case to the
// positive case by negating the input(s) and then post-processing the result.
// Note that we must ALWAYS check specially whether those values are MIN_VALUE
// (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
// a positive number, it overflows back into a negative).  Not handling this
// case would often result in infinite recursion.
//
// Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
// methods on which they depend.

/**
 * An indicator used to reliably determine if an object is a Long or not.
 * @type {boolean}
 * @const
 * @private
 */


Long.prototype.__isLong__;
Object.defineProperty(Long.prototype, "__isLong__", {
  value: true
});
/**
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 * @inner
 */

function isLong(obj) {
  return (obj && obj["__isLong__"]) === true;
}
/**
 * Tests if the specified object is a Long.
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 */


Long.isLong = isLong;
/**
 * A cache of the Long representations of small integer values.
 * @type {!Object}
 * @inner
 */

var INT_CACHE = {};
/**
 * A cache of the Long representations of small unsigned integer values.
 * @type {!Object}
 * @inner
 */

var UINT_CACHE = {};
/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromInt(value, unsigned) {
  var obj, cachedObj, cache;

  if (unsigned) {
    value >>>= 0;

    if (cache = 0 <= value && value < 256) {
      cachedObj = UINT_CACHE[value];
      if (cachedObj) return cachedObj;
    }

    obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
    if (cache) UINT_CACHE[value] = obj;
    return obj;
  } else {
    value |= 0;

    if (cache = -128 <= value && value < 128) {
      cachedObj = INT_CACHE[value];
      if (cachedObj) return cachedObj;
    }

    obj = fromBits(value, value < 0 ? -1 : 0, false);
    if (cache) INT_CACHE[value] = obj;
    return obj;
  }
}
/**
 * Returns a Long representing the given 32 bit integer value.
 * @function
 * @param {number} value The 32 bit integer in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */


Long.fromInt = fromInt;
/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromNumber(value, unsigned) {
  if (isNaN(value)) return unsigned ? UZERO : ZERO;

  if (unsigned) {
    if (value < 0) return UZERO;
    if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
  } else {
    if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
    if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
  }

  if (value < 0) return fromNumber(-value, unsigned).neg();
  return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
}
/**
 * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
 * @function
 * @param {number} value The number in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */


Long.fromNumber = fromNumber;
/**
 * @param {number} lowBits
 * @param {number} highBits
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromBits(lowBits, highBits, unsigned) {
  return new Long(lowBits, highBits, unsigned);
}
/**
 * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
 *  assumed to use 32 bits.
 * @function
 * @param {number} lowBits The low 32 bits
 * @param {number} highBits The high 32 bits
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */


Long.fromBits = fromBits;
/**
 * @function
 * @param {number} base
 * @param {number} exponent
 * @returns {number}
 * @inner
 */

var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

/**
 * @param {string} str
 * @param {(boolean|number)=} unsigned
 * @param {number=} radix
 * @returns {!Long}
 * @inner
 */

function fromString(str, unsigned, radix) {
  if (str.length === 0) throw Error('empty string');
  if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity") return ZERO;

  if (typeof unsigned === 'number') {
    // For goog.math.long compatibility
    radix = unsigned, unsigned = false;
  } else {
    unsigned = !!unsigned;
  }

  radix = radix || 10;
  if (radix < 2 || 36 < radix) throw RangeError('radix');
  var p;
  if ((p = str.indexOf('-')) > 0) throw Error('interior hyphen');else if (p === 0) {
    return fromString(str.substring(1), unsigned, radix).neg();
  } // Do several (8) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.

  var radixToPower = fromNumber(pow_dbl(radix, 8));
  var result = ZERO;

  for (var i = 0; i < str.length; i += 8) {
    var size = Math.min(8, str.length - i),
        value = parseInt(str.substring(i, i + size), radix);

    if (size < 8) {
      var power = fromNumber(pow_dbl(radix, size));
      result = result.mul(power).add(fromNumber(value));
    } else {
      result = result.mul(radixToPower);
      result = result.add(fromNumber(value));
    }
  }

  result.unsigned = unsigned;
  return result;
}
/**
 * Returns a Long representation of the given string, written using the specified radix.
 * @function
 * @param {string} str The textual representation of the Long
 * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to signed
 * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
 * @returns {!Long} The corresponding Long value
 */


Long.fromString = fromString;
/**
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromValue(val, unsigned) {
  if (typeof val === 'number') return fromNumber(val, unsigned);
  if (typeof val === 'string') return fromString(val, unsigned); // Throws for non-objects, converts non-instanceof Long:

  return fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
}
/**
 * Converts the specified value to a Long using the appropriate from* function for its type.
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long}
 */


Long.fromValue = fromValue; // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
// no runtime penalty for these.

/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_16_DBL = 1 << 16;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_24_DBL = 1 << 24;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
/**
 * @type {!Long}
 * @const
 * @inner
 */

var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
/**
 * @type {!Long}
 * @inner
 */

var ZERO = fromInt(0);
/**
 * Signed zero.
 * @type {!Long}
 */

Long.ZERO = ZERO;
/**
 * @type {!Long}
 * @inner
 */

var UZERO = fromInt(0, true);
/**
 * Unsigned zero.
 * @type {!Long}
 */

Long.UZERO = UZERO;
/**
 * @type {!Long}
 * @inner
 */

var ONE = fromInt(1);
/**
 * Signed one.
 * @type {!Long}
 */

Long.ONE = ONE;
/**
 * @type {!Long}
 * @inner
 */

var UONE = fromInt(1, true);
/**
 * Unsigned one.
 * @type {!Long}
 */

Long.UONE = UONE;
/**
 * @type {!Long}
 * @inner
 */

var NEG_ONE = fromInt(-1);
/**
 * Signed negative one.
 * @type {!Long}
 */

Long.NEG_ONE = NEG_ONE;
/**
 * @type {!Long}
 * @inner
 */

var MAX_VALUE = fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
/**
 * Maximum signed value.
 * @type {!Long}
 */

Long.MAX_VALUE = MAX_VALUE;
/**
 * @type {!Long}
 * @inner
 */

var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);
/**
 * Maximum unsigned value.
 * @type {!Long}
 */

Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
/**
 * @type {!Long}
 * @inner
 */

var MIN_VALUE = fromBits(0, 0x80000000 | 0, false);
/**
 * Minimum signed value.
 * @type {!Long}
 */

Long.MIN_VALUE = MIN_VALUE;
/**
 * @alias Long.prototype
 * @inner
 */

var LongPrototype = Long.prototype;
/**
 * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
 * @this {!Long}
 * @returns {number}
 */

LongPrototype.toInt = function toInt() {
  return this.unsigned ? this.low >>> 0 : this.low;
};
/**
 * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
 * @this {!Long}
 * @returns {number}
 */


LongPrototype.toNumber = function toNumber() {
  if (this.unsigned) return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
  return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
};
/**
 * Converts the Long to a string written in the specified radix.
 * @this {!Long}
 * @param {number=} radix Radix (2-36), defaults to 10
 * @returns {string}
 * @override
 * @throws {RangeError} If `radix` is out of range
 */


LongPrototype.toString = function toString(radix) {
  radix = radix || 10;
  if (radix < 2 || 36 < radix) throw RangeError('radix');
  if (this.isZero()) return '0';

  if (this.isNegative()) {
    // Unsigned Longs are never negative
    if (this.eq(MIN_VALUE)) {
      // We need to change the Long value before it can be negated, so we remove
      // the bottom-most digit in this base and then recurse to do the rest.
      var radixLong = fromNumber(radix),
          div = this.div(radixLong),
          rem1 = div.mul(radixLong).sub(this);
      return div.toString(radix) + rem1.toInt().toString(radix);
    } else return '-' + this.neg().toString(radix);
  } // Do several (6) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.


  var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
      rem = this;
  var result = '';

  while (true) {
    var remDiv = rem.div(radixToPower),
        intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
        digits = intval.toString(radix);
    rem = remDiv;
    if (rem.isZero()) return digits + result;else {
      while (digits.length < 6) digits = '0' + digits;

      result = '' + digits + result;
    }
  }
};
/**
 * Gets the high 32 bits as a signed integer.
 * @this {!Long}
 * @returns {number} Signed high bits
 */


LongPrototype.getHighBits = function getHighBits() {
  return this.high;
};
/**
 * Gets the high 32 bits as an unsigned integer.
 * @this {!Long}
 * @returns {number} Unsigned high bits
 */


LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
  return this.high >>> 0;
};
/**
 * Gets the low 32 bits as a signed integer.
 * @this {!Long}
 * @returns {number} Signed low bits
 */


LongPrototype.getLowBits = function getLowBits() {
  return this.low;
};
/**
 * Gets the low 32 bits as an unsigned integer.
 * @this {!Long}
 * @returns {number} Unsigned low bits
 */


LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
  return this.low >>> 0;
};
/**
 * Gets the number of bits needed to represent the absolute value of this Long.
 * @this {!Long}
 * @returns {number}
 */


LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
  if (this.isNegative()) // Unsigned Longs are never negative
    return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
  var val = this.high != 0 ? this.high : this.low;

  for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;

  return this.high != 0 ? bit + 33 : bit + 1;
};
/**
 * Tests if this Long's value equals zero.
 * @this {!Long}
 * @returns {boolean}
 */


LongPrototype.isZero = function isZero() {
  return this.high === 0 && this.low === 0;
};
/**
 * Tests if this Long's value equals zero. This is an alias of {@link Long#isZero}.
 * @returns {boolean}
 */


LongPrototype.eqz = LongPrototype.isZero;
/**
 * Tests if this Long's value is negative.
 * @this {!Long}
 * @returns {boolean}
 */

LongPrototype.isNegative = function isNegative() {
  return !this.unsigned && this.high < 0;
};
/**
 * Tests if this Long's value is positive.
 * @this {!Long}
 * @returns {boolean}
 */


LongPrototype.isPositive = function isPositive() {
  return this.unsigned || this.high >= 0;
};
/**
 * Tests if this Long's value is odd.
 * @this {!Long}
 * @returns {boolean}
 */


LongPrototype.isOdd = function isOdd() {
  return (this.low & 1) === 1;
};
/**
 * Tests if this Long's value is even.
 * @this {!Long}
 * @returns {boolean}
 */


LongPrototype.isEven = function isEven() {
  return (this.low & 1) === 0;
};
/**
 * Tests if this Long's value equals the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.equals = function equals(other) {
  if (!isLong(other)) other = fromValue(other);
  if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
  return this.high === other.high && this.low === other.low;
};
/**
 * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.eq = LongPrototype.equals;
/**
 * Tests if this Long's value differs from the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.notEquals = function notEquals(other) {
  return !this.eq(
  /* validates */
  other);
};
/**
 * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.neq = LongPrototype.notEquals;
/**
 * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.ne = LongPrototype.notEquals;
/**
 * Tests if this Long's value is less than the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.lessThan = function lessThan(other) {
  return this.comp(
  /* validates */
  other) < 0;
};
/**
 * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.lt = LongPrototype.lessThan;
/**
 * Tests if this Long's value is less than or equal the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
  return this.comp(
  /* validates */
  other) <= 0;
};
/**
 * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.lte = LongPrototype.lessThanOrEqual;
/**
 * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.le = LongPrototype.lessThanOrEqual;
/**
 * Tests if this Long's value is greater than the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.greaterThan = function greaterThan(other) {
  return this.comp(
  /* validates */
  other) > 0;
};
/**
 * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.gt = LongPrototype.greaterThan;
/**
 * Tests if this Long's value is greater than or equal the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
  return this.comp(
  /* validates */
  other) >= 0;
};
/**
 * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.gte = LongPrototype.greaterThanOrEqual;
/**
 * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.ge = LongPrototype.greaterThanOrEqual;
/**
 * Compares this Long's value with the specified's.
 * @this {!Long}
 * @param {!Long|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */

LongPrototype.compare = function compare(other) {
  if (!isLong(other)) other = fromValue(other);
  if (this.eq(other)) return 0;
  var thisNeg = this.isNegative(),
      otherNeg = other.isNegative();
  if (thisNeg && !otherNeg) return -1;
  if (!thisNeg && otherNeg) return 1; // At this point the sign bits are the same

  if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1; // Both are positive if at least one is unsigned

  return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
};
/**
 * Compares this Long's value with the specified's. This is an alias of {@link Long#compare}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */


LongPrototype.comp = LongPrototype.compare;
/**
 * Negates this Long's value.
 * @this {!Long}
 * @returns {!Long} Negated Long
 */

LongPrototype.negate = function negate() {
  if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
  return this.not().add(ONE);
};
/**
 * Negates this Long's value. This is an alias of {@link Long#negate}.
 * @function
 * @returns {!Long} Negated Long
 */


LongPrototype.neg = LongPrototype.negate;
/**
 * Returns the sum of this and the specified Long.
 * @this {!Long}
 * @param {!Long|number|string} addend Addend
 * @returns {!Long} Sum
 */

LongPrototype.add = function add(addend) {
  if (!isLong(addend)) addend = fromValue(addend); // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

  var a48 = this.high >>> 16;
  var a32 = this.high & 0xFFFF;
  var a16 = this.low >>> 16;
  var a00 = this.low & 0xFFFF;
  var b48 = addend.high >>> 16;
  var b32 = addend.high & 0xFFFF;
  var b16 = addend.low >>> 16;
  var b00 = addend.low & 0xFFFF;
  var c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
  c00 += a00 + b00;
  c16 += c00 >>> 16;
  c00 &= 0xFFFF;
  c16 += a16 + b16;
  c32 += c16 >>> 16;
  c16 &= 0xFFFF;
  c32 += a32 + b32;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c48 += a48 + b48;
  c48 &= 0xFFFF;
  return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
};
/**
 * Returns the difference of this and the specified Long.
 * @this {!Long}
 * @param {!Long|number|string} subtrahend Subtrahend
 * @returns {!Long} Difference
 */


LongPrototype.subtract = function subtract(subtrahend) {
  if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
  return this.add(subtrahend.neg());
};
/**
 * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
 * @function
 * @param {!Long|number|string} subtrahend Subtrahend
 * @returns {!Long} Difference
 */


LongPrototype.sub = LongPrototype.subtract;
/**
 * Returns the product of this and the specified Long.
 * @this {!Long}
 * @param {!Long|number|string} multiplier Multiplier
 * @returns {!Long} Product
 */

LongPrototype.multiply = function multiply(multiplier) {
  if (this.isZero()) return ZERO;
  if (!isLong(multiplier)) multiplier = fromValue(multiplier); // use wasm support if present

  if (wasm) {
    var low = wasm["mul"](this.low, this.high, multiplier.low, multiplier.high);
    return fromBits(low, wasm["get_high"](), this.unsigned);
  }

  if (multiplier.isZero()) return ZERO;
  if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
  if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;

  if (this.isNegative()) {
    if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());else return this.neg().mul(multiplier).neg();
  } else if (multiplier.isNegative()) return this.mul(multiplier.neg()).neg(); // If both longs are small, use float multiplication


  if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24)) return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned); // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
  // We can skip products that would overflow.

  var a48 = this.high >>> 16;
  var a32 = this.high & 0xFFFF;
  var a16 = this.low >>> 16;
  var a00 = this.low & 0xFFFF;
  var b48 = multiplier.high >>> 16;
  var b32 = multiplier.high & 0xFFFF;
  var b16 = multiplier.low >>> 16;
  var b00 = multiplier.low & 0xFFFF;
  var c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
  c00 += a00 * b00;
  c16 += c00 >>> 16;
  c00 &= 0xFFFF;
  c16 += a16 * b00;
  c32 += c16 >>> 16;
  c16 &= 0xFFFF;
  c16 += a00 * b16;
  c32 += c16 >>> 16;
  c16 &= 0xFFFF;
  c32 += a32 * b00;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c32 += a16 * b16;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c32 += a00 * b32;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
  c48 &= 0xFFFF;
  return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
};
/**
 * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
 * @function
 * @param {!Long|number|string} multiplier Multiplier
 * @returns {!Long} Product
 */


LongPrototype.mul = LongPrototype.multiply;
/**
 * Returns this Long divided by the specified. The result is signed if this Long is signed or
 *  unsigned if this Long is unsigned.
 * @this {!Long}
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Quotient
 */

LongPrototype.divide = function divide(divisor) {
  if (!isLong(divisor)) divisor = fromValue(divisor);
  if (divisor.isZero()) throw Error('division by zero'); // use wasm support if present

  if (wasm) {
    // guard against signed division overflow: the largest
    // negative number / -1 would be 1 larger than the largest
    // positive number, due to two's complement.
    if (!this.unsigned && this.high === -0x80000000 && divisor.low === -1 && divisor.high === -1) {
      // be consistent with non-wasm code path
      return this;
    }

    var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(this.low, this.high, divisor.low, divisor.high);
    return fromBits(low, wasm["get_high"](), this.unsigned);
  }

  if (this.isZero()) return this.unsigned ? UZERO : ZERO;
  var approx, rem, res;

  if (!this.unsigned) {
    // This section is only relevant for signed longs and is derived from the
    // closure library as a whole.
    if (this.eq(MIN_VALUE)) {
      if (divisor.eq(ONE) || divisor.eq(NEG_ONE)) return MIN_VALUE; // recall that -MIN_VALUE == MIN_VALUE
      else if (divisor.eq(MIN_VALUE)) return ONE;else {
          // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
          var halfThis = this.shr(1);
          approx = halfThis.div(divisor).shl(1);

          if (approx.eq(ZERO)) {
            return divisor.isNegative() ? ONE : NEG_ONE;
          } else {
            rem = this.sub(divisor.mul(approx));
            res = approx.add(rem.div(divisor));
            return res;
          }
        }
    } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;

    if (this.isNegative()) {
      if (divisor.isNegative()) return this.neg().div(divisor.neg());
      return this.neg().div(divisor).neg();
    } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();

    res = ZERO;
  } else {
    // The algorithm below has not been made for unsigned longs. It's therefore
    // required to take special care of the MSB prior to running it.
    if (!divisor.unsigned) divisor = divisor.toUnsigned();
    if (divisor.gt(this)) return UZERO;
    if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
      return UONE;
    res = UZERO;
  } // Repeat the following until the remainder is less than other:  find a
  // floating-point that approximates remainder / other *from below*, add this
  // into the result, and subtract it from the remainder.  It is critical that
  // the approximate value is less than or equal to the real value so that the
  // remainder never becomes negative.


  rem = this;

  while (rem.gte(divisor)) {
    // Approximate the result of division. This may be a little greater or
    // smaller than the actual value.
    approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber())); // We will tweak the approximate result by changing it in the 48-th digit or
    // the smallest non-fractional digit, whichever is larger.

    var log2 = Math.ceil(Math.log(approx) / Math.LN2),
        delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48),
        // Decrease the approximation until it is smaller than the remainder.  Note
    // that if it is too large, the product overflows and is negative.
    approxRes = fromNumber(approx),
        approxRem = approxRes.mul(divisor);

    while (approxRem.isNegative() || approxRem.gt(rem)) {
      approx -= delta;
      approxRes = fromNumber(approx, this.unsigned);
      approxRem = approxRes.mul(divisor);
    } // We know the answer can't be zero... and actually, zero would cause
    // infinite recursion since we would make no progress.


    if (approxRes.isZero()) approxRes = ONE;
    res = res.add(approxRes);
    rem = rem.sub(approxRem);
  }

  return res;
};
/**
 * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Quotient
 */


LongPrototype.div = LongPrototype.divide;
/**
 * Returns this Long modulo the specified.
 * @this {!Long}
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */

LongPrototype.modulo = function modulo(divisor) {
  if (!isLong(divisor)) divisor = fromValue(divisor); // use wasm support if present

  if (wasm) {
    var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(this.low, this.high, divisor.low, divisor.high);
    return fromBits(low, wasm["get_high"](), this.unsigned);
  }

  return this.sub(this.div(divisor).mul(divisor));
};
/**
 * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */


LongPrototype.mod = LongPrototype.modulo;
/**
 * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */

LongPrototype.rem = LongPrototype.modulo;
/**
 * Returns the bitwise NOT of this Long.
 * @this {!Long}
 * @returns {!Long}
 */

LongPrototype.not = function not() {
  return fromBits(~this.low, ~this.high, this.unsigned);
};
/**
 * Returns the bitwise AND of this Long and the specified.
 * @this {!Long}
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */


LongPrototype.and = function and(other) {
  if (!isLong(other)) other = fromValue(other);
  return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
};
/**
 * Returns the bitwise OR of this Long and the specified.
 * @this {!Long}
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */


LongPrototype.or = function or(other) {
  if (!isLong(other)) other = fromValue(other);
  return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
};
/**
 * Returns the bitwise XOR of this Long and the given one.
 * @this {!Long}
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */


LongPrototype.xor = function xor(other) {
  if (!isLong(other)) other = fromValue(other);
  return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
};
/**
 * Returns this Long with bits shifted to the left by the given amount.
 * @this {!Long}
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shiftLeft = function shiftLeft(numBits) {
  if (isLong(numBits)) numBits = numBits.toInt();
  if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);else return fromBits(0, this.low << numBits - 32, this.unsigned);
};
/**
 * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shl = LongPrototype.shiftLeft;
/**
 * Returns this Long with bits arithmetically shifted to the right by the given amount.
 * @this {!Long}
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */

LongPrototype.shiftRight = function shiftRight(numBits) {
  if (isLong(numBits)) numBits = numBits.toInt();
  if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);else return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
};
/**
 * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shr = LongPrototype.shiftRight;
/**
 * Returns this Long with bits logically shifted to the right by the given amount.
 * @this {!Long}
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */

LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
  if (isLong(numBits)) numBits = numBits.toInt();
  numBits &= 63;
  if (numBits === 0) return this;else {
    var high = this.high;

    if (numBits < 32) {
      var low = this.low;
      return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
    } else if (numBits === 32) return fromBits(high, 0, this.unsigned);else return fromBits(high >>> numBits - 32, 0, this.unsigned);
  }
};
/**
 * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shru = LongPrototype.shiftRightUnsigned;
/**
 * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */

LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
/**
 * Converts this Long to signed.
 * @this {!Long}
 * @returns {!Long} Signed long
 */

LongPrototype.toSigned = function toSigned() {
  if (!this.unsigned) return this;
  return fromBits(this.low, this.high, false);
};
/**
 * Converts this Long to unsigned.
 * @this {!Long}
 * @returns {!Long} Unsigned long
 */


LongPrototype.toUnsigned = function toUnsigned() {
  if (this.unsigned) return this;
  return fromBits(this.low, this.high, true);
};
/**
 * Converts this Long to its byte representation.
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @this {!Long}
 * @returns {!Array.<number>} Byte representation
 */


LongPrototype.toBytes = function toBytes(le) {
  return le ? this.toBytesLE() : this.toBytesBE();
};
/**
 * Converts this Long to its little endian byte representation.
 * @this {!Long}
 * @returns {!Array.<number>} Little endian byte representation
 */


LongPrototype.toBytesLE = function toBytesLE() {
  var hi = this.high,
      lo = this.low;
  return [lo & 0xff, lo >>> 8 & 0xff, lo >>> 16 & 0xff, lo >>> 24, hi & 0xff, hi >>> 8 & 0xff, hi >>> 16 & 0xff, hi >>> 24];
};
/**
 * Converts this Long to its big endian byte representation.
 * @this {!Long}
 * @returns {!Array.<number>} Big endian byte representation
 */


LongPrototype.toBytesBE = function toBytesBE() {
  var hi = this.high,
      lo = this.low;
  return [hi >>> 24, hi >>> 16 & 0xff, hi >>> 8 & 0xff, hi & 0xff, lo >>> 24, lo >>> 16 & 0xff, lo >>> 8 & 0xff, lo & 0xff];
};
/**
 * Creates a Long from its byte representation.
 * @param {!Array.<number>} bytes Byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @returns {Long} The corresponding Long value
 */


Long.fromBytes = function fromBytes(bytes, unsigned, le) {
  return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
};
/**
 * Creates a Long from its little endian byte representation.
 * @param {!Array.<number>} bytes Little endian byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {Long} The corresponding Long value
 */


Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
  return new Long(bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24, bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24, unsigned);
};
/**
 * Creates a Long from its big endian byte representation.
 * @param {!Array.<number>} bytes Big endian byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {Long} The corresponding Long value
 */


Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
  return new Long(bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7], bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], unsigned);
};

},{}]},{},[27])(27)
});
