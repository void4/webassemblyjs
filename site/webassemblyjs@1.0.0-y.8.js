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

var _ast = require("@webassemblyjs/ast");

var _wastIdentifierToIndex = require("@webassemblyjs/ast/lib/transform/wast-identifier-to-index");

var _validation = _interopRequireDefault(require("../validation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("../../errors"),
    CompileError = _require.CompileError;

var Module = function Module(ast, exports, imports, start) {
  _classCallCheck(this, Module);

  (0, _validation.default)(ast);
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

  (0, _wastIdentifierToIndex.transform)(ast);
  (0, _ast.traverse)(ast, {
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

      if (node.descr.type === "Func") {
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
  return new Module(ast, exports, imports, start);
}
},{"../../errors":8,"../validation":4,"@webassemblyjs/ast":35,"@webassemblyjs/ast/lib/transform/wast-identifier-to-index":37}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validate;

var _ast = require("@webassemblyjs/ast");

var _require = require("./type-inference"),
    getType = _require.getType,
    typeEq = _require.typeEq;

function validate(ast) {
  var errors = [];
  (0, _ast.traverse)(ast, {
    Func: function (_Func) {
      function Func(_x) {
        return _Func.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func.toString();
      };

      return Func;
    }(function (_ref) {
      var node = _ref.node;
      // Since only one return is allowed at the moment, we don't need to check
      // them all.
      var resultType = node.result;
      var inferedResultType = getType(node.body); // Type is unknown, we can not verify the result type

      if (typeof inferedResultType === "undefined") {
        return;
      } // $FlowIgnore


      if (typeEq(resultType, inferedResultType) === false) {
        var name = "anonymous";

        if (node.name != null) {
          name = node.name.value;
        }

        errors.push("- Type mismatch: function '".concat(name, "' expected result type ").concat(JSON.stringify(resultType), ",") + " but ".concat(JSON.stringify(inferedResultType), " given."));
        return;
      }
    })
  });
  return errors;
}
},{"./type-inference":7,"@webassemblyjs/ast":35}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validateAST;

var _funcResultType = _interopRequireDefault(require("./func-result-type"));

var _mutGlobal = _interopRequireDefault(require("./mut-global"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function validateAST(ast) {
  var errors = [];
  errors.push.apply(errors, _toConsumableArray((0, _funcResultType.default)(ast)));
  errors.push.apply(errors, _toConsumableArray((0, _mutGlobal.default)(ast)));

  if (errors.length !== 0) {
    var errorMessage = "Validation errors:\n" + errors.join("\n");
    throw new Error(errorMessage);
  }
}
},{"./func-result-type":3,"./mut-global":6}],5:[function(require,module,exports){
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
    }

    return false;
  }, true);
}
},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validate;

var _ast = require("@webassemblyjs/ast");

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function validate(ast) {
  var errors = [];
  var globalsInProgramMutability = [];
  (0, _ast.traverse)(ast, {
    Global: function (_Global) {
      function Global(_x) {
        return _Global.apply(this, arguments);
      }

      Global.toString = function () {
        return _Global.toString();
      };

      return Global;
    }(function (_ref) {
      var node = _ref.node;
      globalsInProgramMutability.push(node.globalType.mutability);
    })
  });
  (0, _ast.traverse)(ast, {
    Instr: function Instr(_ref2) {
      var node = _ref2.node;

      if (node.id === "set_global") {
        var _node$args = _slicedToArray(node.args, 1),
            index = _node$args[0]; // $FlowIgnore: it's a NumberLiteral because of set_global


        var mutability = globalsInProgramMutability[index.value];

        if (mutability !== "var") {
          return errors.push("global is immutable");
        }
      }
    }
  });
  return errors;
}
},{"@webassemblyjs/ast":35}],7:[function(require,module,exports){
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
  }

  var last = instrs[instrs.length - 1]; // It's a ObjectInstruction

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
},{"@webassemblyjs/ast":35}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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
  Instance: Instance,
  Module: Module,
  Memory: Memory,
  Table: Table,
  RuntimeError: RuntimeError,
  LinkError: LinkError,
  CompileError: CompileError
};
module.exports = WebAssembly;
},{"./check-endianness":1,"./compiler/compile/module":2,"./errors":8,"./interpreter":12,"./interpreter/runtime/values/memory":29,"./interpreter/runtime/values/table":32,"@webassemblyjs/wasm-parser":43,"@webassemblyjs/wast-parser":46}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHostfunc = createHostfunc;
exports.executeStackFrameAndGetResult = executeStackFrameAndGetResult;

var _errors = require("../errors");

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
  var checkForI64InSignature = _ref.checkForI64InSignature;
  return function hostfunc() {
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
    var stackFrame = createStackFrame(funcinst.code, argsWithType, funcinst.module, allocator); // 2. Enter the block instr∗ with label

    stackFrame.values.push(label.createValue(exportinst.name));
    stackFrame.labels.push({
      value: funcinst,
      arity: funcinstArgs.length,
      id: t.identifier(exportinst.name)
    }); // function trace(depth, blockpc, i, frame) {
    //   function ident() {
    //     let out = "";
    //     for (let i = 0; i < depth; i++) {
    //       out += "\t|";
    //     }
    //     return out;
    //   }
    //   console.log(
    //     ident(),
    //     `-------------- blockpc: ${blockpc} - depth: ${depth} --------------`
    //   );
    //   console.log(ident(), "instruction:", i.id);
    //   console.log(ident(), "unwind reason:", frame._unwindReason);
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

    return executeStackFrameAndGetResult(stackFrame);
  };
}

function executeStackFrameAndGetResult(stackFrame) {
  try {
    var res = executeStackFrame(stackFrame);

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
},{"../errors":8,"./kernel/exec":13,"./kernel/signals":17,"./kernel/stackframe":18,"./runtime/castIntoStackLocalOfType":20,"./runtime/values/label":28,"@webassemblyjs/ast":35}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Instance = void 0;

var _ast = require("@webassemblyjs/ast");

var _module = require("../compiler/compile/module");

var _errors = require("../errors");

var _hostFunc = require("./host-func");

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

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
      checkForI64InSignature: true
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

        _this.exports[exportinst.name] = globalinst.value.toNumber();
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

      (0, _hostFunc.executeStackFrameAndGetResult)(stackFrame);
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
},{"../compiler/compile/module":2,"../errors":8,"./host-func":10,"./import-object":11,"./kernel/memory":16,"./kernel/stackframe":18,"./runtime/values/module":30,"@webassemblyjs/ast":35}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeStackFrame = executeStackFrame;

var _memory2 = require("../runtime/values/memory");

var _errors = require("../../errors");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
    createTrap = _require4.createTrap; // TODO(sven): can remove asserts call at compile to gain perf in prod


function assert(cond) {
  if (!cond) {
    throw new _errors.RuntimeError("Assertion error");
  }
}

function assertStackDepth(depth) {
  if (depth >= 300) {
    throw new _errors.RuntimeError("Maximum call stack depth reached");
  }
}

function executeStackFrame(frame) {
  var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  function createAndExecuteChildStackFrame(instrs) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        passCurrentContext = _ref.passCurrentContext;

    var childStackFrame = stackframe.createChildStackFrame(frame, instrs);

    if (passCurrentContext === true) {
      childStackFrame.values = frame.values;
      childStackFrame.labels = frame.labels;
    }

    var res = executeStackFrame(childStackFrame, depth + 1);
    pushResult(res);
  }

  function getLocalByIndex(index) {
    var local = frame.locals[index];

    if (typeof local === "undefined") {
      throw newRuntimeError("Assertion error: no local value at index " + index);
    }

    frame.values.push(local);
  }

  function setLocalByIndex(index, value) {
    assert(typeof index === "number");
    frame.locals[index] = value;
  }

  function pushResult(res) {
    if (typeof res === "undefined") {
      return;
    }

    frame.values.push(res);
  }

  function popArrayOfValTypes(types) {
    assertNItemsOnStack(frame.values, types.length);
    return types.map(function (type) {
      return pop1OfType(type);
    });
  }

  function pop1OfType(type) {
    assertNItemsOnStack(frame.values, 1);
    var v = frame.values.pop();

    if (typeof type === "string" && v.type !== type) {
      throw newRuntimeError("Internal failure: expected value of type " + type + " on top of the stack, type given: " + v.type);
    }

    return v;
  }

  function pop1() {
    assertNItemsOnStack(frame.values, 1);
    return frame.values.pop();
  }

  function pop2(type1, type2) {
    assertNItemsOnStack(frame.values, 2);
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

  assertStackDepth(depth);

  while (frame._pc < frame.code.length) {
    var instruction = frame.code[frame._pc];

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
              frame.labels.push({
                value: func,
                arity: func.params.length,
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
          var n = instruction.args[0];

          if (typeof n === "undefined") {
            throw newRuntimeError("const requires one argument, none given.");
          }

          if (n.type !== "NumberLiteral" && n.type !== "LongNumberLiteral" && n.type !== "FloatLiteral") {
            throw newRuntimeError("const: unsupported value of type: " + n.type);
          }

          pushResult(castIntoStackLocalOfType(instruction.object, n.value));
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
          assert(_typeof(loop.instr) === "object" && typeof loop.instr.length !== "undefined"); // 2. Enter the block instr∗ with label

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
          assertNItemsOnStack(frame.values, 1); // 2. Pop the value valval from the stack.

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
            assert(typeof frame.originatingModule !== "undefined"); // 2. Assert: due to validation, F.module.funcaddrs[x] exists.

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
                resultType = _subroutine$type[1];

            var args = popArrayOfValTypes(argTypes);

            if (subroutine.isExternal === false) {
              createAndExecuteChildStackFrame(subroutine.code);
            } else {
              var res = subroutine.code(args.map(function (arg) {
                return arg.value;
              }));

              if (typeof res !== "undefined") {
                pushResult(castIntoStackLocalOfType(resultType, res));
              }
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

            assert(_typeof(block.instr) === "object" && typeof block.instr.length !== "undefined");

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

      case "br_if":
        {
          var _instruction$args = _slicedToArray(instruction.args, 1),
              _label3 = _instruction$args[0]; // 1. Assert: due to validation, a value of type i32 is on the top of the stack.
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
          var _instruction$args2 = _slicedToArray(instruction.args, 1),
              valtype = _instruction$args2[0];

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
            createAndExecuteChildStackFrame([_init], {
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
            createAndExecuteChildStackFrame([_init2], {
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
          var _instruction$args3 = _slicedToArray(instruction.args, 2),
              _index4 = _instruction$args3[0],
              right = _instruction$args3[1]; // Interpret right branch first if it's a child instruction


          if (typeof right !== "undefined") {
            createAndExecuteChildStackFrame([right], {
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
            createAndExecuteChildStackFrame(_args, {
              passCurrentContext: true
            });
          } // Abort execution and return the first item on the stack


          return pop1();
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

          var _instruction$args4 = _slicedToArray(instruction.args, 2),
              left = _instruction$args4[0],
              _right = _instruction$args4[1]; // Interpret left branch first if it's a child instruction


          if (typeof left !== "undefined") {
            createAndExecuteChildStackFrame([left], {
              passCurrentContext: true
            });
          } // Interpret right branch first if it's a child instruction


          if (typeof _right !== "undefined") {
            createAndExecuteChildStackFrame([_right], {
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

          var _instruction$args5 = _slicedToArray(instruction.args, 1),
              operand = _instruction$args5[0]; // Interpret argument first if it's a child instruction


          if (typeof operand !== "undefined") {
            createAndExecuteChildStackFrame([operand], {
              passCurrentContext: true
            });
          }

          var _c4 = pop1OfType(opType);

          pushResult(unopFn(_c4, instruction.id));
          break;
        }
    }

    if (typeof frame.trace === "function") {
      frame.trace(depth, frame._pc, instruction, frame);
    }

    frame._pc++;
  } // Return the item on top of the values/stack;


  if (frame.values.length > 0) {
    var _res4 = pop1();

    if (_res4.type !== "label") {
      return _res4;
    } else {
      // Push label back
      pushResult(_res4);
    }
  }
}

function assertNItemsOnStack(stack, numberOfItem) {
  if (stack.length < numberOfItem) {
    throw new _errors.RuntimeError("Assertion error: expected " + numberOfItem + " on the stack, found " + stack.length);
  }
}
},{"../../errors":8,"../runtime/castIntoStackLocalOfType":20,"../runtime/values/f32":22,"../runtime/values/f64":23,"../runtime/values/i32":26,"../runtime/values/i64":27,"../runtime/values/label":28,"../runtime/values/memory":29,"./instruction/binop":14,"./instruction/unop":15,"./signals":17,"./stackframe":18}],14:[function(require,module,exports){
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
},{"../../runtime/values/f32":22,"../../runtime/values/f64":23,"../../runtime/values/i32":26,"../../runtime/values/i64":27}],15:[function(require,module,exports){
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
},{"../../runtime/values/f32":22,"../../runtime/values/f64":23,"../../runtime/values/i32":26,"../../runtime/values/i64":27}],16:[function(require,module,exports){
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
    malloc: malloc,
    free: free,
    get: get,
    set: set
  };
}
},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTrap = createTrap;
exports.ExecutionHasBeenTrapped = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ExecutionHasBeenTrapped =
/*#__PURE__*/
function (_Error) {
  _inherits(ExecutionHasBeenTrapped, _Error);

  function ExecutionHasBeenTrapped() {
    _classCallCheck(this, ExecutionHasBeenTrapped);

    return _possibleConstructorReturn(this, (ExecutionHasBeenTrapped.__proto__ || Object.getPrototypeOf(ExecutionHasBeenTrapped)).apply(this, arguments));
  }

  return ExecutionHasBeenTrapped;
}(Error);
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
},{}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{"./kernel/exec":13,"./kernel/stackframe":18,"./runtime/values/module":30,"@webassemblyjs/ast":35}],20:[function(require,module,exports){
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
},{"../../errors":8,"./values/f32":22,"./values/f64":23,"./values/i32":26,"./values/i64":27}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var type = "f32";

var f32 =
/*#__PURE__*/
function (_Float) {
  _inherits(f32, _Float);

  function f32() {
    _classCallCheck(this, f32);

    return _possibleConstructorReturn(this, (f32.__proto__ || Object.getPrototypeOf(f32)).apply(this, arguments));
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

    return _possibleConstructorReturn(this, (f32nan.__proto__ || Object.getPrototypeOf(f32nan)).apply(this, arguments));
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

    return _possibleConstructorReturn(this, (f32inf.__proto__ || Object.getPrototypeOf(f32inf)).apply(this, arguments));
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
},{"./i32":26,"./number":31}],23:[function(require,module,exports){
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

var _long = _interopRequireDefault(require("long"));

var _number = require("./number");

var _i = require("./i64");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var type = "f64";

var f64 =
/*#__PURE__*/
function (_Float) {
  _inherits(f64, _Float);

  function f64() {
    _classCallCheck(this, f64);

    return _possibleConstructorReturn(this, (f64.__proto__ || Object.getPrototypeOf(f64)).apply(this, arguments));
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

    return _possibleConstructorReturn(this, (f64inf.__proto__ || Object.getPrototypeOf(f64inf)).apply(this, arguments));
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

    return _possibleConstructorReturn(this, (f64nan.__proto__ || Object.getPrototypeOf(f64nan)).apply(this, arguments));
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
},{"./i64":27,"./number":31,"long":63}],24:[function(require,module,exports){
function createInstance(n, fromModule) {
  //       [param*, result*]
  var type = [[], []];
  n.params.forEach(function (param) {
    type[0].push(param.valtype);
  });
  n.result.forEach(function (result) {
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
},{}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInstance = createInstance;

var _isConst = require("../../../compiler/validation/is-const");

var _typeInference = require("../../../compiler/validation/type-inference");

var _require = require("../../partial-evaluation"),
    evaluate = _require.evaluate;

var _require2 = require("../../../errors"),
    CompileError = _require2.CompileError;

function createInstance(allocator, node) {
  var value;
  var _node$globalType = node.globalType,
      valtype = _node$globalType.valtype,
      mutability = _node$globalType.mutability;

  if (node.init.length > 0 && (0, _isConst.isConst)(node.init) === false) {
    throw new CompileError("constant expression required");
  } // None or multiple constant expressions in the initializer seems not possible
  // TODO(sven): find a specification reference for that


  if (node.init.length > 1 || node.init.length === 0) {
    throw new CompileError("type mismatch");
  } // Validate the type


  var resultInferedType = (0, _typeInference.getType)(node.init);

  if (resultInferedType != null && (0, _typeInference.typeEq)([node.globalType.valtype], resultInferedType) === false) {
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
},{"../../../compiler/validation/is-const":5,"../../../compiler/validation/type-inference":7,"../../../errors":8,"../../partial-evaluation":19}],26:[function(require,module,exports){
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Long = require("long");

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
      return new i32(Long.fromNumber(this._value).mul(Long.fromNumber(operand._value)).mod(Math.pow(2, bits)).toNumber());
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
},{"../../../errors":8,"long":63}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createValueFromAST = createValueFromAST;
exports.createValue = createValue;
exports.createValueFromArrayBuffer = createValueFromArrayBuffer;
exports.i64 = void 0;

var _long = _interopRequireDefault(require("long"));

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
},{"../../../errors":8,"long":63}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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
},{"../../../errors":8}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createInstance = createInstance;

var _ast = require("@webassemblyjs/ast");

var _memory = require("./memory");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _require = require("../../../errors"),
    RuntimeError = _require.RuntimeError,
    LinkError = _require.LinkError,
    CompileError = _require.CompileError;

var _require2 = require("./table"),
    _Table = _require2.Table;

var func = require("./func");

var externvalue = require("./extern");

var global = require("./global");

var _require3 = require("./i32"),
    i32 = _require3.i32;
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
    var params = descr.params != null ? descr.params : [];
    var results = descr.results != null ? descr.results : [];
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
          // $FlowIgnore
          return handleFuncImport(node, node.descr);

        case "GlobalType":
          // $FlowIgnore
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
          internals.instantiatedFuncs[node.name.value] = addr;
        }
      }
    }),
    Table: function Table(_ref4) {
      var node = _ref4.node;
      // $FlowIgnore: see type Table in src/types/AST.js
      var initial = node.limits.min; // $FlowIgnore: see type Table in src/types/AST.js

      var element = node.elementType;
      var tableinstance = new _Table({
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
          // $FlowIgnore
          internals.instantiatedTables[node.name.value] = addr;
        }
      }
    },
    Elem: function (_Elem) {
      function Elem(_x4) {
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
    Memory: function Memory(_ref6) {
      var node = _ref6.node;

      // Module has already a memory instance (likely imported), skip this.
      if (moduleInstance.memaddrs.length !== 0) {
        return;
      } // $FlowIgnore: see type Memory in src/types/AST.js


      var _node$limits = node.limits,
          min = _node$limits.min,
          max = _node$limits.max;
      var memoryDescriptor = {
        initial: min,
        maximum: max
      };
      var memoryinstance = new _memory.Memory(memoryDescriptor);
      var addr = allocator.malloc(1
      /* size of the memoryinstance struct */
      );
      allocator.set(addr, memoryinstance);
      moduleInstance.memaddrs.push(addr);

      if (node.id != null) {
        if (node.id.type === "Identifier") {
          // $FlowIgnore
          internals.instantiatedMemories[node.id.value] = addr;
        }
      }
    },
    Global: function (_Global) {
      function Global(_x5) {
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

  (0, _ast.traverse)(n, {
    ModuleExport: function (_ModuleExport) {
      function ModuleExport(_x6) {
        return _ModuleExport.apply(this, arguments);
      }

      ModuleExport.toString = function () {
        return _ModuleExport.toString();
      };

      return ModuleExport;
    }(function (_ref9) {
      var node = _ref9.node;

      if (node.descr.type === "Func") {
        // Referenced by its index in the module.funcaddrs
        if (node.descr.id.type === "NumberLiteral") {
          var index = node.descr.id.value;
          var funcinstaddr = moduleInstance.funcaddrs[index];

          if (funcinstaddr === undefined) {
            throw new CompileError("Unknown function");
          }

          var externalVal = {
            type: node.descr.type,
            addr: funcinstaddr
          };
          assertNotAlreadyExported(node.name);
          moduleInstance.exports.push(createModuleExportIntance(node.name, externalVal));
        } // Referenced by its identifier


        if (node.descr.id.type === "Identifier") {
          var instantiatedFuncAddr = internals.instantiatedFuncs[node.descr.id.value];

          if (typeof instantiatedFuncAddr === "undefined") {
            throw new Error("Cannot create exportinst: function " + node.descr.id.value + " was not declared or instantiated");
          }

          var _externalVal = {
            type: node.descr.type,
            addr: instantiatedFuncAddr
          };
          assertNotAlreadyExported(node.name);
          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal));
        }
      }

      if (node.descr.type === "Global") {
        // Referenced by its index in the module.globaladdrs
        if (node.descr.id.type === "NumberLiteral") {
          var _index = node.descr.id.value;
          var globalinstaddr = moduleInstance.globaladdrs[_index];

          if (globalinstaddr === undefined) {
            throw new CompileError("Unknown global");
          }

          var globalinst = allocator.get(globalinstaddr);

          if (globalinst.mutability === "var") {
            throw new CompileError("Mutable globals cannot be exported");
          }

          var _externalVal2 = {
            type: node.descr.type,
            addr: globalinstaddr
          };
          assertNotAlreadyExported(node.name);
          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal2));
        } // Referenced by its identifier


        if (node.descr.id.type === "Identifier") {
          var instantiatedGlobal = internals.instantiatedGlobals[node.descr.id.value];

          if (instantiatedGlobal.type.mutability === "var") {
            throw new CompileError("Mutable globals cannot be exported");
          }

          if (instantiatedGlobal.type.valtype === "i64") {
            throw new LinkError("Export of globals of type i64 is not allowed");
          }

          var _externalVal3 = {
            type: node.descr.type,
            addr: instantiatedGlobal.addr
          };
          assertNotAlreadyExported(node.name);
          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal3));
        }
      }

      if (node.descr.type === "Table") {
        // Referenced by its identifier
        if (node.descr.id.type === "Identifier") {
          var instantiatedTable = internals.instantiatedTables[node.descr.id.value];
          var _externalVal4 = {
            type: node.descr.type,
            addr: instantiatedTable
          };
          assertNotAlreadyExported(node.name);
          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal4));
        } // Referenced by its index in the module.tableaddrs


        if (node.descr.id.type === "NumberLiteral") {
          var _index2 = node.descr.id.value;
          var tableinstaddr = moduleInstance.tableaddrs[_index2];
          var _externalVal5 = {
            type: node.descr.type,
            addr: tableinstaddr
          };
          assertNotAlreadyExported(node.name);

          if (tableinstaddr === undefined) {
            throw new CompileError("Unknown table");
          }

          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal5));
        }
      }

      if (node.descr.type === "Memory") {
        // Referenced by its identifier
        if (node.descr.id.type === "Identifier") {
          var instantiatedMemory = internals.instantiatedMemories[node.descr.id.value];
          var _externalVal6 = {
            type: node.descr.type,
            addr: instantiatedMemory
          };
          assertNotAlreadyExported(node.name);
          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal6));
        } // Referenced by its index in the module.memaddrs


        if (node.descr.id.type === "NumberLiteral") {
          var _index3 = node.descr.id.value;
          var meminstaddr = moduleInstance.memaddrs[_index3];
          var _externalVal7 = {
            type: node.descr.type,
            addr: meminstaddr
          };
          assertNotAlreadyExported(node.name);

          if (meminstaddr === undefined) {
            throw new CompileError("Unknown memory");
          }

          moduleInstance.exports.push(createModuleExportIntance(node.name, _externalVal7));
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

function createModuleExportIntance(name, value) {
  return {
    name: name,
    value: value
  };
}
},{"../../../errors":8,"./extern":21,"./func":24,"./global":25,"./i32":26,"./memory":29,"./table":32,"@webassemblyjs/ast":35}],31:[function(require,module,exports){
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
},{"../../../errors":8}],32:[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
(function (process){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.codeFrameColumns = codeFrameColumns;
exports.default = _default;

function _highlight() {
  const data = _interopRequireWildcard(require("@babel/highlight"));

  _highlight = function () {
    return data;
  };

  return data;
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

let deprecationWarningShown = false;

function getDefs(chalk) {
  return {
    gutter: chalk.grey,
    marker: chalk.red.bold,
    message: chalk.red.bold
  };
}

const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;

function getMarkerLines(loc, source, opts) {
  const startLoc = Object.assign({
    column: 0,
    line: -1
  }, loc.start);
  const endLoc = Object.assign({}, startLoc, loc.end);
  const {
    linesAbove = 2,
    linesBelow = 3
  } = opts || {};
  const startLine = startLoc.line;
  const startColumn = startLoc.column;
  const endLine = endLoc.line;
  const endColumn = endLoc.column;
  let start = Math.max(startLine - (linesAbove + 1), 0);
  let end = Math.min(source.length, endLine + linesBelow);

  if (startLine === -1) {
    start = 0;
  }

  if (endLine === -1) {
    end = source.length;
  }

  const lineDiff = endLine - startLine;
  const markerLines = {};

  if (lineDiff) {
    for (let i = 0; i <= lineDiff; i++) {
      const lineNumber = i + startLine;

      if (!startColumn) {
        markerLines[lineNumber] = true;
      } else if (i === 0) {
        const sourceLength = source[lineNumber - 1].length;
        markerLines[lineNumber] = [startColumn, sourceLength - startColumn];
      } else if (i === lineDiff) {
        markerLines[lineNumber] = [0, endColumn];
      } else {
        const sourceLength = source[lineNumber - i].length;
        markerLines[lineNumber] = [0, sourceLength];
      }
    }
  } else {
    if (startColumn === endColumn) {
      if (startColumn) {
        markerLines[startLine] = [startColumn, 0];
      } else {
        markerLines[startLine] = true;
      }
    } else {
      markerLines[startLine] = [startColumn, endColumn - startColumn];
    }
  }

  return {
    start,
    end,
    markerLines
  };
}

function codeFrameColumns(rawLines, loc, opts = {}) {
  const highlighted = (opts.highlightCode || opts.forceColor) && (0, _highlight().shouldHighlight)(opts);
  const chalk = (0, _highlight().getChalk)(opts);
  const defs = getDefs(chalk);

  const maybeHighlight = (chalkFn, string) => {
    return highlighted ? chalkFn(string) : string;
  };

  if (highlighted) rawLines = (0, _highlight().default)(rawLines, opts);
  const lines = rawLines.split(NEWLINE);
  const {
    start,
    end,
    markerLines
  } = getMarkerLines(loc, lines, opts);
  const hasColumns = loc.start && typeof loc.start.column === "number";
  const numberMaxWidth = String(end).length;
  let frame = lines.slice(start, end).map((line, index) => {
    const number = start + 1 + index;
    const paddedNumber = ` ${number}`.slice(-numberMaxWidth);
    const gutter = ` ${paddedNumber} | `;
    const hasMarker = markerLines[number];
    const lastMarkerLine = !markerLines[number + 1];

    if (hasMarker) {
      let markerLine = "";

      if (Array.isArray(hasMarker)) {
        const markerSpacing = line.slice(0, Math.max(hasMarker[0] - 1, 0)).replace(/[^\t]/g, " ");
        const numberOfMarkers = hasMarker[1] || 1;
        markerLine = ["\n ", maybeHighlight(defs.gutter, gutter.replace(/\d/g, " ")), markerSpacing, maybeHighlight(defs.marker, "^").repeat(numberOfMarkers)].join("");

        if (lastMarkerLine && opts.message) {
          markerLine += " " + maybeHighlight(defs.message, opts.message);
        }
      }

      return [maybeHighlight(defs.marker, ">"), maybeHighlight(defs.gutter, gutter), line, markerLine].join("");
    } else {
      return ` ${maybeHighlight(defs.gutter, gutter)}${line}`;
    }
  }).join("\n");

  if (opts.message && !hasColumns) {
    frame = `${" ".repeat(numberMaxWidth + 1)}${opts.message}\n${frame}`;
  }

  if (highlighted) {
    return chalk.reset(frame);
  } else {
    return frame;
  }
}

function _default(rawLines, lineNumber, colNumber, opts = {}) {
  if (!deprecationWarningShown) {
    deprecationWarningShown = true;
    const message = "Passing lineNumber and colNumber is deprecated to @babel/code-frame. Please use `codeFrameColumns`.";

    if (process.emitWarning) {
      process.emitWarning(message, "DeprecationWarning");
    } else {
      const deprecationError = new Error(message);
      deprecationError.name = "DeprecationWarning";
      console.warn(new Error(message));
    }
  }

  colNumber = Math.max(colNumber, 0);
  const location = {
    start: {
      column: colNumber,
      line: lineNumber
    }
  };
  return codeFrameColumns(rawLines, location, opts);
}
}).call(this,require('_process'))
},{"@babel/highlight":34,"_process":70}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldHighlight = shouldHighlight;
exports.getChalk = getChalk;
exports.default = highlight;

function _jsTokens() {
  const data = _interopRequireWildcard(require("js-tokens"));

  _jsTokens = function () {
    return data;
  };

  return data;
}

function _esutils() {
  const data = _interopRequireDefault(require("esutils"));

  _esutils = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(require("chalk"));

  _chalk = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function getDefs(chalk) {
  return {
    keyword: chalk.cyan,
    capitalized: chalk.yellow,
    jsx_tag: chalk.yellow,
    punctuator: chalk.yellow,
    number: chalk.magenta,
    string: chalk.green,
    regex: chalk.magenta,
    comment: chalk.grey,
    invalid: chalk.white.bgRed.bold
  };
}

const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
const JSX_TAG = /^[a-z][\w-]*$/i;
const BRACKET = /^[()[\]{}]$/;

function getTokenType(match) {
  const [offset, text] = match.slice(-2);
  const token = (0, _jsTokens().matchToToken)(match);

  if (token.type === "name") {
    if (_esutils().default.keyword.isReservedWordES6(token.value)) {
      return "keyword";
    }

    if (JSX_TAG.test(token.value) && (text[offset - 1] === "<" || text.substr(offset - 2, 2) == "</")) {
      return "jsx_tag";
    }

    if (token.value[0] !== token.value[0].toLowerCase()) {
      return "capitalized";
    }
  }

  if (token.type === "punctuator" && BRACKET.test(token.value)) {
    return "bracket";
  }

  if (token.type === "invalid" && (token.value === "@" || token.value === "#")) {
    return "punctuator";
  }

  return token.type;
}

function highlightTokens(defs, text) {
  return text.replace(_jsTokens().default, function (...args) {
    const type = getTokenType(args);
    const colorize = defs[type];

    if (colorize) {
      return args[0].split(NEWLINE).map(str => colorize(str)).join("\n");
    } else {
      return args[0];
    }
  });
}

function shouldHighlight(options) {
  return _chalk().default.supportsColor || options.forceColor;
}

function getChalk(options) {
  let chalk = _chalk().default;

  if (options.forceColor) {
    chalk = new (_chalk().default.constructor)({
      enabled: true,
      level: 1
    });
  }

  return chalk;
}

function highlight(code, options = {}) {
  if (shouldHighlight(options)) {
    const chalk = getChalk(options);
    const defs = getDefs(chalk);
    return highlightTokens(defs, code);
  } else {
    return code;
  }
}
},{"chalk":51,"esutils":61,"js-tokens":62}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signature = signature;
exports.identifier = identifier;
exports.valtype = valtype;
exports.stringLiteral = stringLiteral;
exports.program = program;
exports.module = _module;
exports.binaryModule = binaryModule;
exports.quoteModule = quoteModule;
exports.moduleExport = moduleExport;
exports.func = func;
exports.objectInstruction = objectInstruction;
exports.instruction = instruction;
exports.loopInstruction = loopInstruction;
exports.blockInstruction = blockInstruction;
exports.numberLiteral = numberLiteral;
exports.callInstruction = callInstruction;
exports.ifInstruction = ifInstruction;
exports.withLoc = withLoc;
exports.moduleImport = moduleImport;
exports.globalImportDescr = globalImportDescr;
exports.funcParam = funcParam;
exports.funcImportDescr = funcImportDescr;
exports.table = table;
exports.limits = limits;
exports.memory = memory;
exports.data = data;
exports.global = global;
exports.globalType = globalType;
exports.byteArray = byteArray;
exports.leadingComment = leadingComment;
exports.blockComment = blockComment;
exports.indexLiteral = indexLiteral;
exports.memIndexLiteral = memIndexLiteral;
exports.typeInstructionFunc = typeInstructionFunc;
exports.callIndirectInstruction = callIndirectInstruction;
exports.start = start;
exports.elem = elem;
Object.defineProperty(exports, "traverse", {
  enumerable: true,
  get: function () {
    return _traverse.traverse;
  }
});
Object.defineProperty(exports, "signatures", {
  enumerable: true,
  get: function () {
    return _signatures.signatures;
  }
});

var _traverse = require("./traverse");

var _signatures = require("./signatures");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _require = require("@webassemblyjs/wast-parser/lib/number-literals"),
    parse32F = _require.parse32F,
    parse64F = _require.parse64F,
    parse32I = _require.parse32I,
    parse64I = _require.parse64I,
    parseU32 = _require.parseU32,
    isNanLiteral = _require.isNanLiteral,
    isInfLiteral = _require.isInfLiteral;

var _require2 = require("./signatures"),
    signatures = _require2.signatures;

function assert(cond) {
  if (!cond) {
    throw new Error("assertion error");
  }
}

function signature(object, name) {
  var opcodeName = name;

  if (object !== undefined && object !== "") {
    opcodeName = object + "." + name;
  }

  var sign = signatures[opcodeName];

  if (sign == undefined) {
    // TODO: Uncomment this when br_table and others has been done
    //throw new Error("Invalid opcode: "+opcodeName);
    return [object, object];
  }

  return sign[0];
}

function identifier(value) {
  return {
    type: "Identifier",
    value: value
  };
}

function valtype(name) {
  return {
    type: "ValtypeLiteral",
    name: name
  };
}

function stringLiteral(value) {
  return {
    type: "StringLiteral",
    value: value
  };
}

function program(body) {
  return {
    type: "Program",
    body: body
  };
}

function _module(id, fields) {
  if (id != null) {
    assert(typeof id === "string");
  }

  assert(_typeof(fields) === "object" && typeof fields.length !== "undefined");
  return {
    type: "Module",
    id: id,
    fields: fields
  };
}

function binaryModule(id, blob) {
  return {
    type: "BinaryModule",
    blob: blob,
    id: id,
    fields: []
  };
}

function quoteModule(id, string) {
  return {
    type: "QuoteModule",
    string: string,
    id: id,
    fields: []
  };
}

function moduleExport(name, type, id) {
  return {
    type: "ModuleExport",
    name: name,
    descr: {
      type: type,
      id: id
    }
  };
}

function func(name, params, result, body) {
  assert(_typeof(params) === "object" && typeof params.length !== "undefined");
  assert(_typeof(result) === "object" && typeof result.length !== "undefined");
  assert(_typeof(body) === "object" && typeof body.length !== "undefined");
  assert(typeof name !== "string");
  return {
    type: "Func",
    name: name,
    params: params,
    result: result,
    body: body
  };
}

function objectInstruction(id, object) {
  var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var namedArgs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  assert(_typeof(args) === "object" && typeof args.length !== "undefined");
  assert(typeof object === "string");
  var n = {
    type: "Instr",
    id: id,
    object: object,
    args: args
  };

  if (Object.keys(namedArgs).length !== 0) {
    n.namedArgs = namedArgs;
  }

  return n;
}

function instruction(id) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var namedArgs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  assert(_typeof(args) === "object" && typeof args.length !== "undefined");
  assert(id !== "block");
  assert(id !== "if");
  assert(id !== "loop");
  var n = {
    type: "Instr",
    id: id,
    args: args
  };

  if (Object.keys(namedArgs).length !== 0) {
    n.namedArgs = namedArgs;
  }

  return n;
}

function loopInstruction(label, resulttype, instr) {
  assert(label !== null);
  assert(_typeof(instr) === "object" && typeof instr.length !== "undefined");
  return {
    type: "LoopInstruction",
    id: "loop",
    label: label,
    resulttype: resulttype,
    instr: instr
  };
}

function blockInstruction(label, instr, result) {
  assert(typeof label !== "undefined");
  assert(typeof label.type === "string");
  assert(_typeof(instr) === "object" && typeof instr.length !== "undefined");
  return {
    type: "BlockInstruction",
    id: "block",
    label: label,
    instr: instr,
    result: result
  };
}

function numberLiteral(rawValue) {
  var instructionType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "i32";
  var value;
  var nan = false;
  var inf = false;
  var type = "NumberLiteral";

  if (typeof rawValue === "number") {
    value = rawValue;
  } else {
    switch (instructionType) {
      case "i32":
        {
          value = parse32I(rawValue);
          break;
        }

      case "u32":
        {
          value = parseU32(rawValue);
          break;
        }

      case "i64":
        {
          type = "LongNumberLiteral";
          value = parse64I(rawValue);
          break;
        }

      case "f32":
        {
          type = "FloatLiteral";
          value = parse32F(rawValue);
          nan = isNanLiteral(rawValue);
          inf = isInfLiteral(rawValue);
          break;
        }
      // f64

      default:
        {
          type = "FloatLiteral";
          value = parse64F(rawValue);
          nan = isNanLiteral(rawValue);
          inf = isInfLiteral(rawValue);
          break;
        }
    }
  } // This is a hack to avoid rewriting all tests to have a "isnan: false" field
  // $FlowIgnore: this is correct, but flow doesn't like mutations like this


  var x = {
    type: type,
    value: value
  };

  if (nan === true) {
    // $FlowIgnore
    x.nan = true;
  }

  if (inf === true) {
    // $FlowIgnore
    x.inf = true;
  }

  return x;
}

function callInstruction(index, instrArgs) {
  assert(typeof index.type === "string");
  var n = {
    type: "CallInstruction",
    id: "call",
    index: index
  };

  if (_typeof(instrArgs) === "object") {
    n.instrArgs = instrArgs;
  }

  return n;
}

function ifInstruction(testLabel, result, test, consequent, alternate) {
  assert(typeof testLabel.type === "string");
  return {
    type: "IfInstruction",
    id: "if",
    testLabel: testLabel,
    test: test,
    result: result,
    consequent: consequent,
    alternate: alternate
  };
}

function withLoc(n, end, start) {
  var loc = {
    start: start,
    end: end
  };
  n.loc = loc;
  return n;
}
/**
 * Import
 */


function moduleImport(module, name, descr) {
  return {
    type: "ModuleImport",
    module: module,
    name: name,
    descr: descr
  };
}

function globalImportDescr(valtype, mutability) {
  return {
    type: "GlobalType",
    valtype: valtype,
    mutability: mutability
  };
}

function funcParam(valtype, id) {
  return {
    valtype: valtype,
    id: id
  };
}

function funcImportDescr(id) {
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var results = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  assert(_typeof(params) === "object" && typeof params.length !== "undefined");
  assert(_typeof(results) === "object" && typeof results.length !== "undefined");
  return {
    type: "FuncImportDescr",
    id: id,
    params: params,
    results: results
  };
}

function table(elementType, limits, name, elements) {
  var n = {
    type: "Table",
    elementType: elementType,
    limits: limits,
    name: name
  };

  if (_typeof(elements) === "object") {
    n.elements = elements;
  }

  return n;
}

function limits(min, max) {
  return {
    type: "Limit",
    min: min,
    max: max
  };
}

function memory(limits, id) {
  return {
    type: "Memory",
    limits: limits,
    id: id
  };
}

function data(memoryIndex, offset, init) {
  return {
    type: "Data",
    memoryIndex: memoryIndex,
    offset: offset,
    init: init
  };
}

function global(globalType, init, name) {
  return {
    type: "Global",
    globalType: globalType,
    init: init,
    name: name
  };
}

function globalType(valtype, mutability) {
  return {
    type: "GlobalType",
    valtype: valtype,
    mutability: mutability
  };
}

function byteArray(values) {
  return {
    type: "Bytes",
    values: values
  };
}

function leadingComment(value) {
  return {
    type: "LeadingComment",
    value: value
  };
}

function blockComment(value) {
  return {
    type: "BlockComment",
    value: value
  };
}

function indexLiteral(value) {
  // $FlowIgnore
  var x = numberLiteral(value, "u32");
  return x;
}

function memIndexLiteral(value) {
  // $FlowIgnore
  var x = numberLiteral(value, "u32");
  return x;
}

function typeInstructionFunc() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var id = arguments.length > 2 ? arguments[2] : undefined;
  return {
    type: "TypeInstruction",
    id: id,
    functype: {
      params: params,
      result: result
    }
  };
}

function callIndirectInstruction(params, results, intrs) {
  return {
    type: "CallIndirectInstruction",
    params: params,
    results: results,
    intrs: intrs
  };
}

function start(index) {
  return {
    type: "Start",
    index: index
  };
}

function elem() {
  var table = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : indexLiteral(0);
  var offset = arguments.length > 1 ? arguments[1] : undefined;
  var funcs = arguments.length > 2 ? arguments[2] : undefined;
  return {
    type: "Elem",
    table: table,
    offset: offset,
    funcs: funcs
  };
}
},{"./signatures":36,"./traverse":38,"@webassemblyjs/wast-parser/lib/number-literals":47}],36:[function(require,module,exports){
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
var controlInstructions = {
  unreachable: sign([], []),
  nop: sign([], []),
  // block ?
  // loop ?
  // if ?
  // if else ?
  br: sign([u32], []),
  br_if: sign([u32], []),
  // br_table: [], (vector representation ?)
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
},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;

var _index = require("../../index");

function _sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return _sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

// FIXME(sven): do the same with all block instructions, must be more generic here
var t = require("../../index");

function transform(ast) {
  var functionsInProgram = [];
  var globalsInProgram = []; // First collect the indices of all the functions in the Program

  (0, _index.traverse)(ast, {
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
      functionsInProgram.push(t.identifier(node.name));
    }),
    Global: function (_Global) {
      function Global(_x2) {
        return _Global.apply(this, arguments);
      }

      Global.toString = function () {
        return _Global.toString();
      };

      return Global;
    }(function (_ref2) {
      var node = _ref2.node;

      if (node.name != null) {
        globalsInProgram.push(node.name);
      }
    }),
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

      if (node.name == null) {
        return;
      }

      functionsInProgram.push(node.name);
    })
  }); // Transform the actual instruction in function bodies

  (0, _index.traverse)(ast, {
    Func: function (_Func2) {
      function Func(_x4) {
        return _Func2.apply(this, arguments);
      }

      Func.toString = function () {
        return _Func2.toString();
      };

      return Func;
    }(function (path) {
      transformFuncPath(path, functionsInProgram, globalsInProgram);
    }),
    Start: function (_Start) {
      function Start(_x5) {
        return _Start.apply(this, arguments);
      }

      Start.toString = function () {
        return _Start.toString();
      };

      return Start;
    }(function (path) {
      var index = path.node.index;
      var offsetInFunctionsInProgram = functionsInProgram.findIndex(function (_ref4) {
        var value = _ref4.value;
        return value === index.value;
      });

      if (offsetInFunctionsInProgram === -1) {
        throw new Error("unknown function");
      }

      var indexNode = t.indexLiteral(offsetInFunctionsInProgram); // Replace the index Identifier

      path.node.index = indexNode;
    })
  });
}

function transformFuncPath(funcPath, functionsInProgram, globalsInProgram) {
  var funcNode = funcPath.node;
  var params = funcNode.params;
  (0, _index.traverse)(funcNode, {
    Instr: function Instr(instrPath) {
      var instrNode = instrPath.node;

      if (instrNode.id === "get_local" || instrNode.id === "set_local" || instrNode.id === "tee_local") {
        var _instrNode$args = _slicedToArray(instrNode.args, 1),
            firstArg = _instrNode$args[0];

        if (firstArg.type === "Identifier") {
          var offsetInParams = params.findIndex(function (_ref5) {
            var id = _ref5.id;
            return id === firstArg.value;
          });

          if (offsetInParams === -1) {
            throw new Error("".concat(firstArg.value, " not found in ").concat(instrNode.id, ": not declared in func params"));
          }

          var indexNode = t.indexLiteral(offsetInParams); // Replace the Identifer node by our new NumberLiteral node

          instrNode.args[0] = indexNode;
        }
      }

      if (instrNode.id === "get_global" || instrNode.id === "set_global") {
        var _instrNode$args2 = _slicedToArray(instrNode.args, 1),
            _firstArg = _instrNode$args2[0];

        if (_firstArg.type === "Identifier") {
          var offsetInGlobalsInProgram = globalsInProgram.findIndex(function (_ref6) {
            var value = _ref6.value;
            return value === _firstArg.value;
          });

          if (offsetInGlobalsInProgram === -1) {
            throw new Error("global ".concat(_firstArg.value, " not found in module"));
          }

          var _indexNode = t.indexLiteral(offsetInGlobalsInProgram); // Replace the Identifer node by our new NumberLiteral node


          instrNode.args[0] = _indexNode;
        }
      }
    },
    CallInstruction: function (_CallInstruction) {
      function CallInstruction(_x6) {
        return _CallInstruction.apply(this, arguments);
      }

      CallInstruction.toString = function () {
        return _CallInstruction.toString();
      };

      return CallInstruction;
    }(function (_ref7) {
      var node = _ref7.node;
      var index = node.index;

      if (index.type === "Identifier") {
        var offsetInFunctionsInProgram = functionsInProgram.findIndex(function (_ref8) {
          var value = _ref8.value;
          return value === index.value;
        });

        if (offsetInFunctionsInProgram === -1) {
          throw new Error("".concat(index.value, " not found in CallInstruction: not declared in Program"));
        }

        var indexNode = t.indexLiteral(offsetInFunctionsInProgram); // Replace the index Identifier

        node.index = indexNode;
      }
    })
  });
}
},{"../../index":35}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.traverse = traverse;

function createPath(node) {
  return {
    node: node
  };
}

function walk(n, cb) {
  if (n.type === "Program") {
    cb(n.type, createPath(n)); // $FlowIgnore

    n.body.forEach(function (x) {
      return walk(x, cb);
    });
  }

  if (n.type === "Module") {
    cb(n.type, createPath(n));

    if (typeof n.fields !== "undefined") {
      // $FlowIgnore
      n.fields.forEach(function (x) {
        return walk(x, cb);
      });
    }
  }

  if (n.type === "ModuleExport") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Start") {
    cb(n.type, createPath(n)); // $FlowIgnore

    walk(n.index, cb);
  }

  if (n.type === "Data") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Identifier") {
    cb(n.type, createPath(n));
  }

  if (n.type === "ModuleImport") {
    cb(n.type, createPath(n)); // $FlowIgnore

    cb(n.descr.type, createPath(n.descr));
  }

  if (n.type === "Global") {
    cb(n.type, createPath(n));

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb);
    }
  }

  if (n.type === "Table") {
    cb(n.type, createPath(n));

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb);
    }
  }

  if (n.type === "IfInstruction") {
    cb(n.type, createPath(n)); // $FlowIgnore

    n.test.forEach(function (x) {
      return walk(x, cb);
    }); // $FlowIgnore

    walk(n.testLabel, cb); // $FlowIgnore

    n.consequent.forEach(function (x) {
      return walk(x, cb);
    }); // $FlowIgnore

    n.alternate.forEach(function (x) {
      return walk(x, cb);
    });
  }

  if (n.type === "Memory") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Elem") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Instr") {
    cb(n.type, createPath(n)); // $FlowIgnore

    n.args.forEach(function (x) {
      return walk(x, cb);
    });
  }

  if (n.type === "CallInstruction") {
    cb(n.type, createPath(n)); // $FlowIgnore

    walk(n.index, cb);
  }

  if (n.type === "LoopInstruction") {
    cb(n.type, createPath(n));

    if (n.label != null) {
      // $FlowIgnore
      walk(n.label, cb);
    } // $FlowIgnore


    n.instr.forEach(function (x) {
      return walk(x, cb);
    });
  }

  if (n.type === "BlockInstruction") {
    cb(n.type, createPath(n));

    if (n.label != null) {
      // $FlowIgnore
      walk(n.label, cb);
    } // $FlowIgnore


    n.instr.forEach(function (x) {
      return walk(x, cb);
    });
  }

  if (n.type === "IfInstruction") {
    cb(n.type, createPath(n)); // $FlowIgnore

    walk(n.testLabel, cb); // $FlowIgnore

    n.consequent.forEach(function (x) {
      return walk(x, cb);
    }); // $FlowIgnore

    n.alternate.forEach(function (x) {
      return walk(x, cb);
    });
  }

  if (n.type === "Func") {
    cb(n.type, createPath(n)); // $FlowIgnore

    n.body.forEach(function (x) {
      return walk(x, cb);
    });

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb);
    }
  }
}

function traverse(n, visitor) {
  walk(n, function (type, path) {
    if (typeof visitor[type] === "function") {
      visitor[type](path);
    }
  });
}
},{}],39:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeUInt64 = decodeUInt64;
exports.decodeInt64 = decodeInt64;
exports.decodeInt32 = decodeInt32;
exports.decodeUInt32 = decodeUInt32;
exports.MAX_NUMBER_OF_BYTE_U64 = exports.MAX_NUMBER_OF_BYTE_U32 = void 0;

/**
 * Initial implementation from https://github.com/brodybits/leb
 *
 * See licence in /docs/thirdparty-licenses.txt
 *
 * Changes made by the xtuc/webassemblyjs contributors:
 * - refactor: move alls functions into one file and remove the unused functions
 * - feat: added some constants
 */

/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-int
 * max = ceil(32/7)
 */
var MAX_NUMBER_OF_BYTE_U32 = 5;
/**
 * According to https://webassembly.github.io/spec/binary/values.html#binary-int
 * max = ceil(64/7)
 */

exports.MAX_NUMBER_OF_BYTE_U32 = MAX_NUMBER_OF_BYTE_U32;
var MAX_NUMBER_OF_BYTE_U64 = 10;
/** Maximum length of kept temporary buffers. */

exports.MAX_NUMBER_OF_BYTE_U64 = MAX_NUMBER_OF_BYTE_U64;
var TEMP_BUF_MAXIMUM_LENGTH = 20;
/** Pool of buffers, where `bufPool[x].length === x`. */

var bufPool = [];

function decodeBufferCommon(encodedBuffer, index, signed) {
  index = index === undefined ? 0 : index;
  var length = encodedLength(encodedBuffer, index);
  var bitLength = length * 7;
  var byteLength = Math.ceil(bitLength / 8);
  var result = bufAlloc(byteLength);
  var outIndex = 0;

  while (length > 0) {
    bitsInject(result, outIndex, 7, encodedBuffer[index]);
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

  result = bufResize(result, byteLength);
  return {
    value: result,
    nextIndex: index
  };
}
/**
 * Injects the given bits into the given buffer at the given index. Any
 * bits in the value beyond the length to set are ignored.
 */


function bitsInject(buffer, bitIndex, bitLength, value) {
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
 * Resizes a buffer, returning a new buffer. Returns the argument if
 * the length wouldn't actually change. This function is only safe to
 * use if the given buffer was allocated within this module (since
 * otherwise the buffer might possibly be shared externally).
 */


function bufResize(buffer, length) {
  if (length === buffer.length) {
    return buffer;
  }

  var newBuf = bufAlloc(length);
  buffer.copy(newBuf);
  bufFree(buffer);
  return newBuf;
}
/**
 * Allocates a buffer of the given length, which is initialized
 * with all zeroes. This returns a buffer from the pool if it is
 * available, or a freshly-allocated buffer if not.
 */


function bufAlloc(length) {
  var result = bufPool[length];

  if (result) {
    bufPool[length] = undefined;
  } else {
    result = new Buffer(length);
  }

  result.fill(0);
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
    throw new Error("Bogus encoding");
  }

  return result;
}
/**
 * Releases a buffer back to the pool.
 */


function bufFree(buffer) {
  var length = buffer.length;

  if (length < TEMP_BUF_MAXIMUM_LENGTH) {
    bufPool[length] = buffer;
  }
}

function decodeUInt64(encodedBuffer, index) {
  var result = decodeBufferCommon(encodedBuffer, index, false);
  var parsed = bufReadUInt(result.value);
  var value = parsed.value;
  bufFree(result.value);
  return {
    value: value,
    nextIndex: result.nextIndex,
    lossy: parsed.lossy
  };
}

function decodeInt64(encodedBuffer, index) {
  var result = decodeBufferCommon(encodedBuffer, index, true);
  var parsed = bufReadInt(result.value);
  var value = parsed.value;
  bufFree(result.value);
  return {
    value: value,
    nextIndex: result.nextIndex,
    lossy: parsed.lossy
  };
}

function decodeInt32(encodedBuffer, index) {
  var result = decodeBufferCommon(encodedBuffer, index, true);
  var parsed = bufReadInt(result.value);
  var value = parsed.value;
  bufFree(result.value);
  return {
    value: value,
    nextIndex: result.nextIndex
  };
}

function decodeUInt32(encodedBuffer, index) {
  var result = decodeBufferCommon(encodedBuffer, index, false);
  var parsed = bufReadUInt(result.value);
  var value = parsed.value;
  bufFree(result.value);
  return {
    value: value,
    nextIndex: result.nextIndex
  };
}
/**
 * Reads an arbitrary unsigned int from a buffer.
 */


function bufReadUInt(buffer) {
  var length = buffer.length;
  var result = 0;
  var lossy = false; // Note: See above in re bit manipulation.

  if (length < 7) {
    // Common case which can't possibly be lossy (see above).
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
 * Reads an arbitrary signed int from a buffer.
 */


function bufReadInt(buffer) {
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
/**
 * Masks off all but the lowest bit set of the given number.
 */


function lowestBit(num) {
  return num & -num;
}
}).call(this,require("buffer").Buffer)
},{"buffer":68}],40:[function(require,module,exports){
var illegalop = "illegal";
var magicModuleHeader = [0x00, 0x61, 0x73, 0x6d];
var moduleVersion = [0x01, 0x00, 0x00, 0x00];

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
var valtypes = {
  0x7f: "i32",
  0x7e: "i64",
  0x7d: "f32",
  0x7c: "f64"
};
var limitHasMaximum = {
  0x00: false,
  0x01: true
};
var tableTypes = {
  0x70: "anyfunc"
};
var blockTypes = Object.assign({}, valtypes, {
  0x40: null
});
var globalTypes = {
  0x00: "const",
  0x01: "var"
};
var importTypes = {
  0x00: "func",
  0x01: "table",
  0x02: "mem",
  0x03: "global"
};
var sections = {
  customSection: 0,
  typeSection: 1,
  importSection: 2,
  funcSection: 3,
  tableSection: 4,
  memorySection: 5,
  globalSection: 6,
  exportSection: 7,
  startSection: 8,
  elemSection: 9,
  codeSection: 10,
  dataSection: 11
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
module.exports = {
  symbolsByByte: symbolsByByte,
  sections: sections,
  magicModuleHeader: magicModuleHeader,
  moduleVersion: moduleVersion,
  types: types,
  valtypes: valtypes,
  exportTypes: exportTypes,
  blockTypes: blockTypes,
  limitHasMaximum: limitHasMaximum,
  tableTypes: tableTypes,
  globalTypes: globalTypes,
  importTypes: importTypes
};
},{}],41:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;

var _errors = require("webassemblyjs/lib/errors");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var t = require("@webassemblyjs/ast");

var _require = require("./constants"),
    importTypes = _require.importTypes,
    symbolsByByte = _require.symbolsByByte,
    blockTypes = _require.blockTypes,
    tableTypes = _require.tableTypes,
    globalTypes = _require.globalTypes,
    limitHasMaximum = _require.limitHasMaximum,
    exportTypes = _require.exportTypes,
    types = _require.types,
    magicModuleHeader = _require.magicModuleHeader,
    valtypes = _require.valtypes,
    moduleVersion = _require.moduleVersion,
    sections = _require.sections;

var _require2 = require("./LEB128"),
    decodeInt32 = _require2.decodeInt32,
    decodeUInt32 = _require2.decodeUInt32,
    MAX_NUMBER_OF_BYTE_U32 = _require2.MAX_NUMBER_OF_BYTE_U32,
    decodeInt64 = _require2.decodeInt64,
    decodeUInt64 = _require2.decodeUInt64,
    MAX_NUMBER_OF_BYTE_U64 = _require2.MAX_NUMBER_OF_BYTE_U64;

var ieee754 = require("./ieee754");

var _require3 = require("./utf8"),
    utf8ArrayToStr = _require3.utf8ArrayToStr;
/**
 * FIXME(sven): we can't do that because number > 2**53 will fail here
 * because they cannot be represented in js.
 */


function badI32ToI64Conversion(value) {
  return {
    high: value < 0 ? -1 : 0,
    low: value >>> 0
  };
}

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

function decode(ab) {
  var printDump = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var buf = new Uint8Array(ab);
  var inc = 0;

  function getUniqueName() {
    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "temp";
    inc++;
    return prefix + "_" + inc;
  }

  var offset = 0;

  function dump(b, msg) {
    if (!printDump) return;
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
    if (!printDump) return;
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
    functionsInModule: []
  };

  function isEOF() {
    return offset >= buf.length;
  }

  function eatBytes(n) {
    offset = offset + n;
  }

  function readBytes(numberOfBytes) {
    var arr = [];

    for (var i = 0; i < numberOfBytes; i++) {
      arr.push(buf[offset + i]);
    }

    return arr;
  }

  function readF64() {
    var bytes = readBytes(ieee754.NUMBER_OF_BYTE_F64);
    var buffer = Buffer.from(bytes);
    var value = ieee754.decode(buffer, 0, true, ieee754.SINGLE_PRECISION_MANTISSA, ieee754.NUMBER_OF_BYTE_F64);
    return {
      value: value,
      nextIndex: ieee754.NUMBER_OF_BYTE_F64
    };
  }

  function readF32() {
    var bytes = readBytes(ieee754.NUMBER_OF_BYTE_F32);
    var buffer = Buffer.from(bytes);
    var value = ieee754.decode(buffer, 0, true, ieee754.SINGLE_PRECISION_MANTISSA, ieee754.NUMBER_OF_BYTE_F32);
    return {
      value: value,
      nextIndex: ieee754.NUMBER_OF_BYTE_F32
    };
  }

  function readUTF8String() {
    var lenu32 = readU32();
    var len = lenu32.value;
    dump([len], "string length");
    eatBytes(lenu32.nextIndex);
    var bytes = readBytes(len);
    var value = utf8ArrayToStr(bytes);
    return {
      value: value,
      nextIndex: len
    };
  }
  /**
   * Decode an unsigned 32bits integer
   *
   * The length will be handled by the leb librairy, we pass the max number of
   * byte.
   */


  function readU32() {
    var bytes = readBytes(MAX_NUMBER_OF_BYTE_U32);
    var buffer = Buffer.from(bytes);
    return decodeUInt32(buffer);
  }
  /**
   * Decode a signed 32bits interger
   */


  function read32() {
    var bytes = readBytes(MAX_NUMBER_OF_BYTE_U32);
    var buffer = Buffer.from(bytes);
    return decodeInt32(buffer);
  }
  /**
   * Decode a signed 64bits integer
   */


  function read64() {
    var bytes = readBytes(MAX_NUMBER_OF_BYTE_U64);
    var buffer = Buffer.from(bytes);
    return decodeInt64(buffer);
  }

  function readU64() {
    var bytes = readBytes(MAX_NUMBER_OF_BYTE_U64);
    var buffer = Buffer.from(bytes);
    return decodeUInt64(buffer);
  }

  function readByte() {
    return readBytes(1)[0];
  }

  function parseModuleHeader() {
    if (isEOF() === true || offset + 4 > buf.length) {
      throw new Error("unexpected end");
    }

    var header = readBytes(4);

    if (byteArrayEq(magicModuleHeader, header) === false) {
      throw new _errors.CompileError("magic header not detected");
    }

    dump(header, "wasm magic header");
    eatBytes(4);
  }

  function parseVersion() {
    if (isEOF() === true || offset + 4 > buf.length) {
      throw new Error("unexpected end");
    }

    var version = readBytes(4);

    if (byteArrayEq(moduleVersion, version) === false) {
      throw new _errors.CompileError("unknown binary version");
    }

    dump(version, "wasm version");
    eatBytes(4);
  }

  function parseVec(cast) {
    // Int on 1byte
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
        throw new _errors.CompileError("Internal failure: parseVec could not cast the value");
      }

      elements.push(value);
    }

    return elements;
  } // Type section
  // https://webassembly.github.io/spec/binary/modules.html#binary-typesec


  function parseTypeSection(numberOfTypes) {
    dump([numberOfTypes], "num types");

    for (var i = 0; i < numberOfTypes; i++) {
      dumpSep("type " + i);
      var type = readByte();
      eatBytes(1);

      if (type == types.func) {
        dump([type], "func");
        var paramValtypes = parseVec(function (b) {
          return valtypes[b];
        });
        var params = paramValtypes.map(function (v) {
          return t.funcParam(v);
        });
        var result = parseVec(function (b) {
          return valtypes[b];
        });
        state.typesInModule.push({
          params: params,
          result: result
        });
      } else {
        throw new Error("Unsupported type: " + toHex(type));
      }
    }
  } // Import section
  // https://webassembly.github.io/spec/binary/modules.html#binary-importsec


  function parseImportSection() {
    var imports = [];
    var numberOfImportsu32 = readU32();
    var numberOfImports = numberOfImportsu32.value;
    eatBytes(numberOfImportsu32.nextIndex);

    for (var i = 0; i < numberOfImports; i++) {
      dumpSep("import header " + i);
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
      var descrType = importTypes[descrTypeByte];
      dump([descrTypeByte], "import kind");

      if (typeof descrType === "undefined") {
        throw new _errors.CompileError("Unknown import description type: " + toHex(descrTypeByte));
      }

      var importDescr = void 0;

      if (descrType === "func") {
        var indexU32 = readU32();
        var typeindex = indexU32.value;
        eatBytes(indexU32.nextIndex);
        dump([typeindex], "type index");
        var signature = state.typesInModule[typeindex];

        if (typeof signature === "undefined") {
          throw new _errors.CompileError("function signature not found in type section");
        }

        var id = t.identifier("".concat(moduleName.value, ".").concat(name.value));
        importDescr = t.funcImportDescr(id, signature.params, signature.result);
        state.functionsInModule.push({
          id: t.identifier(name.value),
          signature: signature,
          isExternal: true
        });
      } else if (descrType === "global") {
        importDescr = parseGlobalType();
      } else if (descrType === "table") {
        importDescr = parseTableType();
      } else if (descrType === "mem") {
        var memoryNode = parseMemoryType(0);
        state.memoriesInModule.push(memoryNode);
        importDescr = memoryNode;
      } else {
        throw new _errors.CompileError("Unsupported import of type: " + descrType);
      }

      imports.push(t.moduleImport(moduleName.value, name.value, importDescr));
    }

    return imports;
  } // Function section
  // https://webassembly.github.io/spec/binary/modules.html#function-section


  function parseFuncSection() {
    var numberOfFunctionsu32 = readU32();
    var numberOfFunctions = numberOfFunctionsu32.value;
    eatBytes(numberOfFunctionsu32.nextIndex);

    for (var i = 0; i < numberOfFunctions; i++) {
      var indexU32 = readU32();
      var typeindex = indexU32.value;
      eatBytes(indexU32.nextIndex);
      dump([typeindex], "type index");
      var signature = state.typesInModule[typeindex];

      if (typeof signature === "undefined") {
        throw new _errors.CompileError("function signature not found");
      }

      var id = t.identifier(getUniqueName("func"));
      state.functionsInModule.push({
        id: id,
        signature: signature,
        isExternal: false
      });
    }
  } // Export section
  // https://webassembly.github.io/spec/binary/modules.html#export-section


  function parseExportSection() {
    var u32 = readU32();
    var numberOfExport = u32.value;
    eatBytes(u32.nextIndex);
    dump([numberOfExport], "num exports"); // Parse vector of exports

    for (var i = 0; i < numberOfExport; i++) {
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

      if (exportTypes[typeIndex] === "Func") {
        var func = state.functionsInModule[index];

        if (typeof func === "undefined") {
          throw new _errors.CompileError("entry not found at index ".concat(index, " in function section"));
        }

        id = func.id;
        signature = func.signature;
      } else if (exportTypes[typeIndex] === "Table") {
        console.warn("Unsupported export type table");
        return;
      } else if (exportTypes[typeIndex] === "Mem") {
        var memNode = state.memoriesInModule[index];

        if (typeof memNode === "undefined") {
          throw new _errors.CompileError("entry not found at index ".concat(index, " in memory section"));
        }

        if (memNode.id != null) {
          id = t.identifier(memNode.id.value + "");
        } else {
          id = t.identifier(getUniqueName("memory"));
        }

        signature = null;
      } else {
        console.warn("Unsupported export type: " + toHex(typeIndex));
        return;
      }

      state.elementsInExportSection.push({
        name: name.value,
        type: exportTypes[typeIndex],
        signature: signature,
        id: id,
        index: index
      });
    }
  } // Code section
  // https://webassembly.github.io/spec/binary/modules.html#code-section


  function parseCodeSection() {
    var u32 = readU32();
    var numberOfFuncs = u32.value;
    eatBytes(u32.nextIndex);
    dump([numberOfFuncs], "number functions"); // Parse vector of function

    for (var i = 0; i < numberOfFuncs; i++) {
      dumpSep("function body " + i); // the u32 size of the function code in bytes
      // Ignore it for now

      var bodySizeU32 = readU32();
      eatBytes(bodySizeU32.nextIndex);
      dump([0x0], "function body size (guess)");
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
        var type = valtypes[valtypeByte];
        dump([valtypeByte], type);

        if (typeof type === "undefined") {
          throw new _errors.CompileError("Unexpected valtype: " + toHex(valtypeByte));
        }
      } // Decode instructions until the end


      parseInstructionBlock(code);
      state.elementsInCodeSection.push({
        code: code,
        locals: locals
      });
    }
  }

  function parseInstructionBlock(code) {
    while (true) {
      var instructionAlreadyCreated = false;
      var instructionByte = readByte();
      eatBytes(1);
      var instruction = symbolsByByte[instructionByte];

      if (typeof instruction.object === "string") {
        dump([instructionByte], "".concat(instruction.object, ".").concat(instruction.name));
      } else {
        dump([instructionByte], instruction.name);
      }

      if (typeof instruction === "undefined") {
        throw new _errors.CompileError("Unexpected instruction: " + toHex(instructionByte));
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
        var blocktype = blockTypes[blocktypeByte];
        dump([blocktypeByte], "blocktype");

        if (typeof blocktype === "undefined") {
          throw new _errors.CompileError("Unexpected blocktype: " + toHex(blocktypeByte));
        }

        var instr = [];
        parseInstructionBlock(instr);
        var label = t.identifier(getUniqueName("loop"));
        var loopNode = t.loopInstruction(label, blocktype, instr);
        code.push(loopNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "if") {
        var _blocktypeByte = readByte();

        eatBytes(1);
        var _blocktype = blockTypes[_blocktypeByte];
        dump([_blocktypeByte], "blocktype");

        if (typeof _blocktype === "undefined") {
          throw new _errors.CompileError("Unexpected blocktype: " + toHex(_blocktypeByte));
        }

        var consequentInstr = [];
        parseInstructionBlock(consequentInstr); // FIXME(sven): handle the second block via the byte in between

        var alternate = []; // FIXME(sven): where is that stored?

        var testIndex = t.identifier(getUniqueName("ifindex"));
        var testInstrs = [];
        var ifNode = t.ifInstruction(testIndex, _blocktype, testInstrs, consequentInstr, alternate);
        code.push(ifNode);
        instructionAlreadyCreated = true;
      } else if (instruction.name === "block") {
        var _blocktypeByte2 = readByte();

        eatBytes(1);
        var _blocktype2 = blockTypes[_blocktypeByte2];
        dump([_blocktypeByte2], "blocktype");

        if (typeof _blocktype2 === "undefined") {
          throw new _errors.CompileError("Unexpected blocktype: " + toHex(_blocktypeByte2));
        }

        var _instr = [];
        parseInstructionBlock(_instr);

        var _label = t.identifier(getUniqueName()); // FIXME(sven): result type is ignored?


        var blockNode = t.blockInstruction(_label, _instr);
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
      } else if (instruction.name === "br_table") {
        var indicesu32 = readU32();
        var indices = indicesu32.value;
        eatBytes(indicesu32.nextIndex);
        dump([indices], "num indices");

        for (var i = 0; i < indices; i++) {
          var _indexu = readU32();

          var _index = _indexu.value;
          eatBytes(_indexu.nextIndex);
          dump([_index], "index");
        }

        var labelIndexu32 = readU32();
        var labelIndex = labelIndexu32.value;
        eatBytes(labelIndexu32.nextIndex);
        dump([labelIndex], "label index");
      } else if (instructionByte >= 0x28 && instructionByte <= 0x40) {
        /**
         * Memory instructions
         */
        var aligun32 = readU32();
        var align = aligun32.value;
        eatBytes(aligun32.nextIndex);
        dump([align], "align");
        var offsetu32 = readU32();
        var _offset = offsetu32.value;
        eatBytes(offsetu32.nextIndex);
        dump([_offset], "offset");
      } else if (instructionByte >= 0x41 && instructionByte <= 0x44) {
        /**
         * Numeric instructions
         */
        if (instruction.object === "i32") {
          var value32 = read32();
          var value = value32.value;
          eatBytes(value32.nextIndex);
          dump([value], "value");
          args.push(t.numberLiteral(value));
        }

        if (instruction.object === "u32") {
          var valueu32 = readU32();
          var _value = valueu32.value;
          eatBytes(valueu32.nextIndex);
          dump([_value], "value");
          args.push(t.numberLiteral(_value));
        }

        if (instruction.object === "i64") {
          var value64 = read64();
          var _value2 = value64.value;
          eatBytes(value64.nextIndex);
          dump([_value2], "value");
          var node = {
            type: "LongNumberLiteral",
            value: badI32ToI64Conversion(_value2)
          };
          args.push(node);
        }

        if (instruction.object === "u64") {
          var valueu64 = readU64();
          var _value3 = valueu64.value;
          eatBytes(valueu64.nextIndex);
          dump([_value3], "value");
          args.push(t.numberLiteral(_value3));
        }

        if (instruction.object === "f32") {
          var valuef32 = readF32();
          var _value4 = valuef32.value;
          eatBytes(valuef32.nextIndex);
          dump([_value4], "value");
          args.push(t.numberLiteral(_value4));
        }

        if (instruction.object === "f64") {
          var valuef64 = readF64();
          var _value5 = valuef64.value;
          eatBytes(valuef64.nextIndex);
          dump([_value5], "value");
          args.push(t.numberLiteral(_value5));
        }
      } else {
        for (var _i2 = 0; _i2 < instruction.numberOfArgs; _i2++) {
          var u32 = readU32();
          eatBytes(u32.nextIndex);
          dump([u32.value], "argument " + _i2);
          args.push(t.numberLiteral(u32.value));
        }
      }

      if (instructionAlreadyCreated === false) {
        if (typeof instruction.object === "string") {
          code.push( // $FlowIgnore
          t.objectInstruction(instruction.name, instruction.object, args));
        } else {
          code.push(t.instruction(instruction.name, args));
        }
      }
    }
  } // https://webassembly.github.io/spec/core/binary/types.html#binary-tabletype


  function parseTableType() {
    var elementTypeByte = readByte();
    eatBytes(1);
    dump([elementTypeByte], "element type");
    var elementType = tableTypes[elementTypeByte];

    if (typeof elementType === "undefined") {
      throw new _errors.CompileError("Unknown element type in table: " + toHex(elementType));
    }

    var limitType = readByte();
    eatBytes(1);
    var min, max;

    if (limitHasMaximum[limitType] === true) {
      var u32min = readU32();
      min = u32min.value;
      eatBytes(u32min.nextIndex);
      dump([min], "min");
      var u32max = readU32();
      max = u32max.value;
      eatBytes(u32max.nextIndex);
      dump([max], "max");
    } else {
      var _u32min = readU32();

      min = _u32min.value;
      eatBytes(_u32min.nextIndex);
      dump([min], "min");
    }

    return t.table(elementType, t.limits(min, max));
  } // https://webassembly.github.io/spec/binary/modules.html#binary-tablesec


  function parseTableSection() {
    var tables = [];
    var u32 = readU32();
    var numberOfTable = u32.value;
    eatBytes(u32.nextIndex);
    dump([numberOfTable], "num tables");

    for (var i = 0; i < numberOfTable; i++) {
      var tableNode = parseTableType();
      tables.push(tableNode);
    }

    return tables;
  } // https://webassembly.github.io/spec/binary/types.html#global-types


  function parseGlobalType() {
    var valtypeByte = readByte();
    eatBytes(1);
    var type = valtypes[valtypeByte];
    dump([valtypeByte], type);

    if (typeof type === "undefined") {
      throw new _errors.CompileError("Unknown valtype: " + toHex(valtypeByte));
    }

    var globalTypeByte = readByte();
    eatBytes(1);
    var globalType = globalTypes[globalTypeByte];
    dump([globalTypeByte], "global type (".concat(globalType, ")"));

    if (typeof globalType === "undefined") {
      throw new _errors.CompileError("Invalid mutability: " + toHex(globalTypeByte));
    }

    return t.globalType(type, globalType);
  }

  function parseGlobalSection() {
    var globals = [];
    var numberOfGlobalsu32 = readU32();
    var numberOfGlobals = numberOfGlobalsu32.value;
    eatBytes(numberOfGlobalsu32.nextIndex);
    dump([numberOfGlobals], "num globals");

    for (var i = 0; i < numberOfGlobals; i++) {
      var globalType = parseGlobalType();
      /**
       * Global expressions
       */

      var init = [];
      parseInstructionBlock(init);
      globals.push(t.global(globalType, init));
    }

    return globals;
  }

  function parseElemSection() {
    var elems = [];
    var numberOfElementsu32 = readU32();
    var numberOfElements = numberOfElementsu32.value;
    eatBytes(numberOfElementsu32.nextIndex);
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
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

      for (var _i3 = 0; _i3 < indices; _i3++) {
        var indexu32 = readU32();
        var index = indexu32.value;
        eatBytes(indexu32.nextIndex);
        dump([index], "index");
        indexValues.push(t.indexLiteral(index));
      }

      elems.push(t.elem(t.indexLiteral(tableindex), instr, indexValues));
    }

    return elems;
  } // https://webassembly.github.io/spec/core/binary/types.html#memory-types


  function parseMemoryType(i) {
    var limitType = readByte();
    eatBytes(1);
    var min, max;

    if (limitHasMaximum[limitType] === true) {
      var u32min = readU32();
      min = u32min.value;
      eatBytes(u32min.nextIndex);
      dump([min], "min");
      var u32max = readU32();
      max = u32max.value;
      eatBytes(u32max.nextIndex);
      dump([max], "max");
    } else {
      var _u32min2 = readU32();

      min = _u32min2.value;
      eatBytes(_u32min2.nextIndex);
      dump([min], "min");
    }

    return t.memory(t.limits(min, max), t.indexLiteral(i));
  } // https://webassembly.github.io/spec/binary/modules.html#memory-section


  function parseMemorySection() {
    var memories = [];
    var numberOfElementsu32 = readU32();
    var numberOfElements = numberOfElementsu32.value;
    eatBytes(numberOfElementsu32.nextIndex);
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
      var memoryNode = parseMemoryType(i);
      state.memoriesInModule.push(memoryNode);
      memories.push(memoryNode);
    }

    return memories;
  } // https://webassembly.github.io/spec/binary/modules.html#binary-startsec


  function parseStartSection() {
    var u32 = readU32();
    var startFuncIndex = u32.value;
    eatBytes(u32.nextIndex);
    dump([startFuncIndex], "index");
    return t.start(t.indexLiteral(startFuncIndex));
  } // https://webassembly.github.io/spec/binary/modules.html#data-section


  function parseDataSection() {
    var dataEntries = [];
    var numberOfElementsu32 = readU32();
    var numberOfElements = numberOfElementsu32.value;
    eatBytes(numberOfElementsu32.nextIndex);
    dump([numberOfElements], "num elements");

    for (var i = 0; i < numberOfElements; i++) {
      var memoryIndexu32 = readU32();
      var memoryIndex = memoryIndexu32.value;
      eatBytes(memoryIndexu32.nextIndex);
      dump([memoryIndex], "memory index");
      var instrs = [];
      parseInstructionBlock(instrs);

      if (instrs.length !== 1) {
        throw new _errors.CompileError("data section offset must be a single instruction");
      }

      var bytes = parseVec(function (b) {
        return b;
      }); // FIXME(sven): the Go binary can store > 100kb of data here
      // my testing suite doesn't handle that.
      // Disabling for now.

      bytes = [];
      dump([], "init");
      dataEntries.push(t.data(t.memIndexLiteral(memoryIndex), instrs[0], t.byteArray(bytes)));
    }

    return dataEntries;
  } // https://webassembly.github.io/spec/binary/modules.html#binary-section


  function parseSection() {
    var sectionId = readByte();
    eatBytes(1);
    var u32 = readU32();
    var sectionSizeInBytes = u32.value;
    eatBytes(u32.nextIndex);

    switch (sectionId) {
      case sections.typeSection:
        {
          dumpSep("section Type");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");

          var _u = readU32();

          var numberOfTypes = _u.value;
          eatBytes(_u.nextIndex);
          parseTypeSection(numberOfTypes);
          break;
        }

      case sections.tableSection:
        {
          dumpSep("section Table");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return parseTableSection();
        }

      case sections.importSection:
        {
          dumpSep("section Import");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return parseImportSection();
        }

      case sections.funcSection:
        {
          dumpSep("section Function");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          parseFuncSection();
          break;
        }

      case sections.exportSection:
        {
          dumpSep("section Export");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          parseExportSection();
          break;
        }

      case sections.codeSection:
        {
          dumpSep("section Code");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          parseCodeSection();
          break;
        }

      case sections.startSection:
        {
          dumpSep("section Start");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return [parseStartSection()];
        }

      case sections.elemSection:
        {
          dumpSep("section Element");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return parseElemSection();
        }

      case sections.globalSection:
        {
          dumpSep("section Global");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return parseGlobalSection();
        }

      case sections.memorySection:
        {
          dumpSep("section Memory");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return parseMemorySection();
        }

      case sections.dataSection:
        {
          dumpSep("section Data");
          dump([sectionId], "section code");
          dump([0x0], "section size (ignore)");
          return parseDataSection();
        }

      case sections.customSection:
        {
          dumpSep("section Custom");
          dump([sectionId], "section code");
          dump([sectionSizeInBytes], "section size"); // We don't need to parse it, just eat all the bytes

          eatBytes(sectionSizeInBytes);
          break;
        }

      default:
        {
          throw new _errors.CompileError("Unexpected section: " + JSON.stringify(sectionId));
        }
    }

    return [];
  }

  parseModuleHeader();
  parseVersion();
  var moduleFields = [];
  /**
   * All the generate declaration are going to be stored in our state
   */

  while (offset < buf.length) {
    var nodes = parseSection();
    moduleFields.push.apply(moduleFields, _toConsumableArray(nodes));
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
    body = decodedElementInCodeSection.code;
    funcIndex++;
    var funcNode = t.func(func.id, params, result, body);

    if (func.isExternal === true) {
      funcNode.isExternal = func.isExternal;
    }

    moduleFields.push(funcNode);
  });
  state.elementsInExportSection.forEach(function (moduleExport) {
    /**
     * If the export has no id, we won't be able to call it from the outside
     * so we can omit it
     */
    if (moduleExport.id != null) {
      moduleFields.push(t.moduleExport(moduleExport.name, moduleExport.type, moduleExport.id));
    }
  });
  dumpSep("end of program");
  var module = t.module(null, moduleFields);
  return t.program([module]);
}
}).call(this,require("buffer").Buffer)
},{"./LEB128":39,"./constants":40,"./ieee754":42,"./utf8":44,"@webassemblyjs/ast":35,"buffer":68,"webassemblyjs/lib/errors":66}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;
exports.DOUBLE_PRECISION_MANTISSA = exports.SINGLE_PRECISION_MANTISSA = exports.NUMBER_OF_BYTE_F64 = exports.NUMBER_OF_BYTE_F32 = void 0;

/**
 * Initial implementation from https://github.com/feross/ieee754
 */

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
var SINGLE_PRECISION_MANTISSA = 1 + 23;
exports.SINGLE_PRECISION_MANTISSA = SINGLE_PRECISION_MANTISSA;
var DOUBLE_PRECISION_MANTISSA = 1 + 52;
exports.DOUBLE_PRECISION_MANTISSA = DOUBLE_PRECISION_MANTISSA;

function decode(buffer, offset, isLE, mLen, nBytes) {
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
},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;

var decoder = _interopRequireWildcard(require("./decoder"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function decode(buf) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      dump = _ref.dump;

  return decoder.decode(buf, dump);
}
},{"./decoder":41}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utf8ArrayToStr = utf8ArrayToStr;

// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt

/* utf.js - UTF-8 <=> UTF-16 convertion
 *
 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */
function utf8ArrayToStr(array) {
  var out, i, c;
  var char2, char3;
  out = "";
  var len = array.length;
  i = 0;

  while (i < len) {
    c = array[i++];

    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;

      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode((c & 0x1f) << 6 | char2 & 0x3f);
        break;

      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode((c & 0x0f) << 12 | (char2 & 0x3f) << 6 | (char3 & 0x3f) << 0);
        break;
    }
  }

  return out;
}
},{}],45:[function(require,module,exports){
(function (process){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;

var _numberLiterals = require("./number-literals");

var _stringLiterals = require("./string-literals");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var t = require("@webassemblyjs/ast");

var _require = require("./tokenizer"),
    tokens = _require.tokens,
    keywords = _require.keywords;

var _require2 = require("@babel/code-frame"),
    codeFrameColumns = _require2.codeFrameColumns;

function hasPlugin(name) {
  if (name !== "wast") throw new Error("unknow plugin");
  return true;
}

function isKeyword(token, id) {
  return token.type === tokens.keyword && token.value === id;
}

function showCodeFrame(source, loc) {
  var out = codeFrameColumns(source, loc);
  process.stdout.write(out + "\n");
}

function tokenToString(token) {
  if (token.type === "keyword") {
    return "keyword (".concat(token.value, ")");
  }

  return token.type;
}

function parse(tokensList, source) {
  var current = 0;
  var inc = 0;

  function getUniqueName() {
    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "temp";
    inc++;
    return prefix + "_" + inc;
  }

  var state = {
    registredExportedElements: [],
    registredImportedElements: []
  }; // But this time we're going to use recursion instead of a `while` loop. So we
  // define a `walk` function.

  function walk() {
    var token = tokensList[current];

    function eatToken() {
      token = tokensList[++current];
    }

    function eatTokenOfType(type) {
      if (token.type !== type) {
        showCodeFrame(source, token.loc);
        throw new Error("Assertion error: expected token of type " + type + ", given " + tokenToString(token));
      }

      eatToken();
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
      if (token.type === tokens.comment) {
        eatToken();
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
      var limits = t.limits(0);

      if (token.type === tokens.string || token.type === tokens.identifier) {
        id = t.identifier(token.value);
        eatToken();
      }
      /**
       * Maybe data
       */


      if (lookaheadAndCheck(tokens.openParen, keywords.data)) {
        eatToken(); // (

        eatToken(); // data
        // TODO(sven): do something with the data collected here

        var stringInitializer = token.value;
        eatTokenOfType(tokens.string); // Update limits accordingly

        limits = t.limits(stringInitializer.length);
        eatTokenOfType(tokens.closeParen);
      }
      /**
       * Maybe export
       */


      if (lookaheadAndCheck(tokens.openParen, keywords.export)) {
        eatToken(); // (

        eatToken(); // export

        if (token.type !== tokens.string) {
          showCodeFrame(source, token.loc);
          throw new Error("Expected string in export, given " + token.type);
        }

        var _name = token.value;
        eatToken();
        state.registredExportedElements.push({
          type: "Memory",
          name: _name,
          id: id
        });
        eatTokenOfType(tokens.closeParen);
      }
      /**
       * Memory signature
       */


      if (token.type === tokens.number) {
        limits = t.limits((0, _numberLiterals.parse32I)(token.value));
        eatToken();

        if (token.type === tokens.number) {
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

      if (token.type === tokens.number) {
        memidx = token.value;
        eatTokenOfType(tokens.number); // .
      }

      eatTokenOfType(tokens.openParen);
      var offset;

      if (token.type === tokens.valtype) {
        eatTokenOfType(tokens.valtype); // i32

        eatTokenOfType(tokens.dot); // .

        if (token.value !== "const") {
          throw new Error("constant expression required");
        }

        eatTokenOfType(tokens.name); // const

        var numberLiteral = t.numberLiteral(token.value, "i32");
        offset = t.instruction("const", [numberLiteral]);
        eatToken();
        eatTokenOfType(tokens.closeParen);
      } else {
        eatTokenOfType(tokens.name); // get_global

        var _numberLiteral = t.numberLiteral(token.value, "i32");

        offset = t.instruction("get_global", [_numberLiteral]);
        eatToken();
        eatTokenOfType(tokens.closeParen);
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
      var name = t.identifier(getUniqueName());
      var limit = t.limits(0);
      var elemIndices = [];
      var elemType = "anyfunc";

      if (token.type === tokens.string || token.type === tokens.identifier) {
        name = t.identifier(token.value);
        eatToken();
      }

      while (token.type !== tokens.closeParen) {
        /**
         * Maybe export
         */
        if (lookaheadAndCheck(tokens.openParen, keywords.elem)) {
          eatToken(); // (

          eatToken(); // elem

          while (token.type === tokens.identifier) {
            elemIndices.push(t.identifier(token.value));
            eatToken();
          }

          eatTokenOfType(tokens.closeParen);
        } else if (lookaheadAndCheck(tokens.openParen, keywords.export)) {
          eatToken(); // (

          eatToken(); // export

          if (token.type !== tokens.string) {
            showCodeFrame(source, token.loc);
            throw new Error("Expected string in export, given " + token.type);
          }

          var exportName = token.value;
          eatToken();
          state.registredExportedElements.push({
            type: "Table",
            name: exportName,
            id: name
          });
          eatTokenOfType(tokens.closeParen);
        } else if (isKeyword(token, keywords.anyfunc)) {
          // It's the default value, we can ignore it
          eatToken(); // anyfunc
        } else if (token.type === tokens.number) {
          /**
           * Table type
           */
          var min = token.value;
          eatToken();

          if (token.type === tokens.number) {
            var max = token.value;
            eatToken();
            limit = t.limits(min, max);
          } else {
            limit = t.limits(min);
          }

          eatToken();
        } else {
          showCodeFrame(source, token.loc);
          throw new Error("Unexpected token of type " + tokenToString(token));
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
      if (token.type !== tokens.string) {
        throw new Error("Expected a string, " + token.type + " given.");
      }

      var moduleName = token.value;
      eatToken();

      if (token.type !== tokens.string) {
        throw new Error("Expected a string, " + token.type + " given.");
      }

      var funcName = token.value;
      eatToken();
      eatTokenOfType(tokens.openParen);
      var descr;

      if (isKeyword(token, keywords.func)) {
        eatToken(); // keyword

        var fnParams = [];
        var fnResult = [];

        if (token.type === tokens.identifier) {
          funcName = token.value;
          eatToken();
        }

        while (token.type === tokens.openParen) {
          eatToken();

          if (lookaheadAndCheck(keywords.param) === true) {
            eatToken();
            fnParams.push.apply(fnParams, _toConsumableArray(parseFuncParam()));
          } else if (lookaheadAndCheck(keywords.result) === true) {
            eatToken();
            fnResult.push.apply(fnResult, _toConsumableArray(parseFuncResult()));
          } else {
            showCodeFrame(source, token.loc);
            throw new Error("Unexpected token in import of type: " + token.type);
          }

          eatTokenOfType(tokens.closeParen);
        }

        if (typeof funcName === "undefined") {
          throw new Error("Imported function must have a name");
        }

        descr = t.funcImportDescr(t.identifier(funcName), fnParams, fnResult);
      } else if (isKeyword(token, keywords.global)) {
        eatToken(); // keyword

        if (token.type === tokens.openParen) {
          eatToken(); // (

          eatTokenOfType(tokens.keyword); // mut keyword

          var valtype = token.value;
          eatToken();
          descr = t.globalImportDescr(valtype, "var");
          eatTokenOfType(tokens.closeParen);
        } else {
          var _valtype = token.value;
          eatTokenOfType(tokens.valtype);
          descr = t.globalImportDescr(_valtype, "const");
        }
      } else if (isKeyword(token, keywords.memory) === true) {
        eatToken(); // Keyword

        descr = parseMemory();
      } else if (isKeyword(token, keywords.table) === true) {
        eatToken(); // Keyword

        descr = parseTable();
      } else {
        throw new Error("Unsupported import type: " + tokenToString(token));
      }

      eatTokenOfType(tokens.closeParen);
      eatTokenOfType(tokens.closeParen);
      return t.moduleImport(moduleName, funcName, descr);
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
      var blockResult;
      var instr = [];

      if (token.type === tokens.identifier) {
        label = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();
          blockResult = token.value;
          eatToken();
        } else if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            // Instruction
            instr.push(parseFuncInstr());
          } else {
          showCodeFrame(source, token.loc);
          throw new Error("Unexpected token in block body of type: " + token.type);
        }

        eatTokenOfType(tokens.closeParen);
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
      var blockResult;
      var label = t.identifier(getUniqueName("if"));
      var testInstrs = [];
      var consequent = [];
      var alternate = [];

      if (token.type === tokens.identifier) {
        label = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken(); // (

        /**
         * Block signature
         */

        if (isKeyword(token, keywords.result) === true) {
          eatToken();
          blockResult = token.value;
          eatTokenOfType(tokens.valtype);
          eatTokenOfType(tokens.closeParen);
          continue;
        }
        /**
         * Then
         */


        if (isKeyword(token, keywords.then) === true) {
          eatToken(); // then

          while (token.type === tokens.openParen) {
            eatToken(); // Instruction

            if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
            ) {
                consequent.push(parseFuncInstr());
              } else {
              showCodeFrame(source, token.loc);
              throw new Error("Unexpected token in consequent body of type: " + token.type);
            }

            eatTokenOfType(tokens.closeParen);
          }

          eatTokenOfType(tokens.closeParen);
          continue;
        }
        /**
         * Alternate
         */


        if (isKeyword(token, keywords.else)) {
          eatToken(); // else

          while (token.type === tokens.openParen) {
            eatToken(); // Instruction

            if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
            ) {
                alternate.push(parseFuncInstr());
              } else {
              showCodeFrame(source, token.loc);
              throw new Error("Unexpected token in alternate body of type: " + token.type);
            }

            eatTokenOfType(tokens.closeParen);
          }

          eatTokenOfType(tokens.closeParen);
          continue;
        }
        /**
         * Test instruction
         */


        if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            testInstrs.push(parseFuncInstr());
            eatTokenOfType(tokens.closeParen);
            continue;
          }
      }

      return t.ifInstruction(label, blockResult, testInstrs, consequent, alternate);
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

      if (token.type === tokens.identifier) {
        label = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();
          blockResult = token.value;
          eatToken();
        } else if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            // Instruction
            instr.push(parseFuncInstr());
          } else {
          showCodeFrame(source, token.loc);
          throw new Error("Unexpected token in loop body of type: " + token.type);
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.loopInstruction(label, blockResult, instr);
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
      if (token.type !== tokens.string) {
        throw new Error("Expected string after export, got: " + token.type);
      }

      var name = token.value;
      eatToken();
      var type = "";
      var index;

      if (token.type === tokens.openParen) {
        eatToken();

        while (token.type !== tokens.closeParen) {
          if (isKeyword(token, keywords.func)) {
            type = "Func";
            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          if (isKeyword(token, keywords.table)) {
            type = "Table";
            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          if (isKeyword(token, keywords.global)) {
            type = "Global";
            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          if (isKeyword(token, keywords.memory)) {
            type = "Memory";
            eatToken();

            if (token.type === tokens.identifier) {
              index = t.identifier(token.value);
              eatToken();
            }

            if (token.type === tokens.number) {
              index = t.indexLiteral(token.value);
              eatToken();
            }
          }

          eatToken();
        }
      }

      if (type === "") {
        throw new Error("Unknown export type");
      }

      if (index === undefined) {
        throw new Error("Exported function must have a name");
      }

      eatTokenOfType(tokens.closeParen);
      return t.moduleExport(name, type, index);
    }

    function parseModule() {
      var name = null;
      var isBinary = false;
      var isQuote = false;
      var moduleFields = [];

      if (token.type === tokens.identifier) {
        name = token.value;
        eatToken();
      }

      if (hasPlugin("wast") && token.type === tokens.name && token.value === "binary") {
        eatToken();
        isBinary = true;
      }

      if (hasPlugin("wast") && token.type === tokens.name && token.value === "quote") {
        eatToken();
        isQuote = true;
      }

      if (isBinary === true) {
        var blob = [];

        while (token.type === tokens.string) {
          blob.push(token.value);
          eatToken();
          maybeIgnoreComment();
        }

        eatTokenOfType(tokens.closeParen);
        return t.binaryModule(name, blob);
      }

      if (isQuote === true) {
        var string = [];

        while (token.type === tokens.string) {
          string.push(token.value);
          eatToken();
        }

        eatTokenOfType(tokens.closeParen);
        return t.quoteModule(name, string);
      }

      while (token.type !== tokens.closeParen) {
        moduleFields.push(walk());

        if (state.registredExportedElements.length > 0) {
          state.registredExportedElements.forEach(function (decl) {
            moduleFields.push(t.moduleExport(decl.name, decl.type, decl.id));
          });
          state.registredExportedElements = [];
        }

        if (state.registredImportedElements.length > 0) {
          state.registredImportedElements.forEach(function (decl) {
            moduleFields.push(t.moduleImport(decl.module, decl.name, decl.descr));
          });
          state.registredImportedElements = [];
        }

        token = tokensList[current];
      }

      eatTokenOfType(tokens.closeParen);
      return t.module(name, moduleFields);
    }
    /**
     * Parses the arguments of an instruction
     */


    function parseFuncInstrArguments(signature) {
      var args = [];
      var namedArgs = {};
      var signaturePtr = 0;

      while (token.type === tokens.name || isKeyword(token, keywords.offset)) {
        var key = token.value;
        eatToken();
        eatTokenOfType(tokens.equal);
        var value = void 0;

        if (token.type === tokens.number) {
          value = t.numberLiteral(token.value);
        } else {
          throw new Error("Unexpected type for argument: " + token.type);
        }

        namedArgs[key] = value;
        eatToken();
      }

      while (token.type !== tokens.closeParen) {
        if (token.type === tokens.identifier) {
          args.push(t.identifier(token.value));
          eatToken();
        } // Handle locals


        if (token.type === tokens.valtype) {
          args.push(t.valtype(token.value));
          eatToken();
        }

        if (token.type === tokens.string) {
          args.push(t.stringLiteral(token.value));
          eatToken();
        }

        if (token.type === tokens.number) {
          args.push( // TODO(sven): refactor the type signature handling
          // https://github.com/xtuc/webassemblyjs/pull/129 is a good start
          // $FlowIgnore
          t.numberLiteral(token.value, signature[signaturePtr++] || "f64"));
          eatToken();
        }
        /**
         * Maybe some nested instructions
         */


        if (token.type === tokens.openParen) {
          eatToken(); // Instruction

          if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
          ) {
              args.push(parseFuncInstr());
            } else {
            showCodeFrame(source, token.loc);
            throw new Error("Unexpected token in nested instruction of type: " + token.type);
          }

          if (token.type === tokens.closeParen) {
            eatToken();
          }
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
      /**
       * A simple instruction
       */
      if (token.type === tokens.name || token.type === tokens.valtype) {
        var _name2 = token.value;
        var object;
        eatToken();

        if (token.type === tokens.dot) {
          object = _name2;
          eatToken();

          if (token.type !== tokens.name) {
            throw new TypeError("Unknown token: " + token.type + ", name expected");
          }

          _name2 = token.value;
          eatToken();
        }

        if (token.type === tokens.closeParen) {
          if (typeof object === "undefined") {
            return t.instruction(_name2);
          } else {
            return t.objectInstruction(_name2, object, []);
          }
        }

        var signature = t.signature(object || "", _name2);

        var _parseFuncInstrArgume = parseFuncInstrArguments(signature),
            _args = _parseFuncInstrArgume.args,
            _namedArgs = _parseFuncInstrArgume.namedArgs;

        if (typeof object === "undefined") {
          return t.instruction(_name2, _args, _namedArgs);
        } else {
          return t.objectInstruction(_name2, object, _args, _namedArgs);
        }
      } else if (isKeyword(token, keywords.loop)) {
        /**
         * Else a instruction with a keyword (loop or block)
         */
        eatToken(); // keyword

        return parseLoop();
      } else if (isKeyword(token, keywords.block)) {
        eatToken(); // keyword

        return parseBlock();
      } else if (isKeyword(token, keywords.call_indirect)) {
        eatToken(); // keyword

        var params = [];
        var results = [];
        var instrs = [];

        while (token.type !== tokens.closeParen) {
          if (lookaheadAndCheck(tokens.openParen, keywords.type)) {
            eatToken(); // (

            eatToken(); // type
            // TODO(sven): replace this with parseType in https://github.com/xtuc/webassemblyjs/pull/158

            eatToken(); // whatever
          } else if (lookaheadAndCheck(tokens.openParen, keywords.param)) {
            eatToken(); // (

            eatToken(); // param

            /**
             * Params can be empty:
             * (params)`
             */

            if (token.type !== tokens.closeParen) {
              params.push.apply(params, _toConsumableArray(parseFuncParam()));
            }
          } else if (lookaheadAndCheck(tokens.openParen, keywords.result)) {
            eatToken(); // (

            eatToken(); // result

            /**
             * Results can be empty:
             * (result)`
             */

            if (token.type !== tokens.closeParen) {
              results.push.apply(results, _toConsumableArray(parseFuncResult()));
            }
          } else {
            eatTokenOfType(tokens.openParen);
            instrs.push(parseFuncInstr());
          }

          eatTokenOfType(tokens.closeParen);
        }

        return t.callIndirectInstruction(params, results, instrs);
      } else if (isKeyword(token, keywords.call)) {
        eatToken(); // keyword

        var index;

        if (token.type === tokens.identifier) {
          index = t.identifier(token.value);
          eatToken();
        } else if (token.type === tokens.number) {
          index = t.indexLiteral(token.value);
          eatToken();
        }

        var instrArgs = []; // Nested instruction

        while (token.type === tokens.openParen) {
          eatToken();
          instrArgs.push(parseFuncInstr());
          eatTokenOfType(tokens.closeParen);
        }

        if (typeof index === "undefined") {
          throw new Error("Missing argument in call instruciton");
        }

        if (instrArgs.length > 0) {
          return t.callInstruction(index, instrArgs);
        } else {
          return t.callInstruction(index);
        }
      } else if (isKeyword(token, keywords.if)) {
        eatToken(); // Keyword

        return parseIf();
      } else if (isKeyword(token, keywords.module) && hasPlugin("wast")) {
        eatToken(); // In WAST you can have a module as an instruction's argument
        // we will cast it into a instruction to not break the flow
        // $FlowIgnore

        var _module = parseModule();

        return _module;
      } else {
        showCodeFrame(source, token.loc);
        throw new Error("Unexpected instruction in function body: " + tokenToString(token));
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
      var fnBody = [];
      var fnParams = [];
      var fnResult = []; // name

      if (token.type === tokens.identifier) {
        fnName = t.identifier(token.value);
        eatToken();
      }

      while (token.type === tokens.openParen) {
        eatToken();

        if (lookaheadAndCheck(keywords.param) === true) {
          eatToken();
          fnParams.push.apply(fnParams, _toConsumableArray(parseFuncParam()));
        } else if (lookaheadAndCheck(keywords.result) === true) {
          eatToken();
          fnResult.push.apply(fnResult, _toConsumableArray(parseFuncResult()));
        } else if (lookaheadAndCheck(keywords.export) === true) {
          eatToken();
          parseFuncExport(fnName);
        } else if (lookaheadAndCheck(tokens.name) === true || lookaheadAndCheck(tokens.valtype) === true || token.type === "keyword" // is any keyword
        ) {
            // Instruction
            fnBody.push(parseFuncInstr());
          } else {
          showCodeFrame(source, token.loc);
          throw new Error("Unexpected token in func body of type: " + token.type);
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.func(fnName, fnParams, fnResult, fnBody);
    }
    /**
     * Parses shorthand export in func
     *
     * export :: ( export <string> )
     */


    function parseFuncExport(funcId) {
      if (token.type !== tokens.string) {
        throw new Error("Function export expected a string, " + token.type + " given");
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
        type: "Func",
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

      if (token.type === tokens.identifier) {
        id = t.identifier(token.value);
        eatToken();
      }

      if (lookaheadAndCheck(tokens.openParen, keywords.func)) {
        eatToken(); // (

        eatToken(); // func

        if (token.type === tokens.closeParen) {
          eatToken(); // function with an empty signature, we can abort here

          return t.typeInstructionFunc([], [], id);
        }

        if (lookaheadAndCheck(tokens.openParen, keywords.param)) {
          eatToken(); // (

          eatToken(); // param

          params = parseFuncParam();
          eatTokenOfType(tokens.closeParen);
        }

        if (lookaheadAndCheck(tokens.openParen, keywords.result)) {
          eatToken(); // (

          eatToken(); // param

          result = parseFuncResult();
          eatTokenOfType(tokens.closeParen);
        }

        eatTokenOfType(tokens.closeParen);
      }

      return t.typeInstructionFunc(params, result, id);
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

      if (token.type !== tokens.valtype) {
        showCodeFrame(source, token.loc);
        throw new Error("Unexpected token in func result: " + token.type);
      }

      var valtype = token.value;
      eatToken();
      results.push(valtype);
      return results;
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

      if (token.type === tokens.identifier) {
        name = t.identifier(token.value);
        eatToken();
      }
      /**
       * maybe export
       */


      if (lookaheadAndCheck(tokens.openParen, keywords.export)) {
        eatToken(); // (

        eatToken(); // export

        var exportName = token.value;
        eatTokenOfType(tokens.string);
        state.registredExportedElements.push({
          type: "Global",
          name: exportName,
          id: name
        });
        eatTokenOfType(tokens.closeParen);
      }
      /**
       * maybe import
       */


      if (lookaheadAndCheck(tokens.openParen, keywords.import)) {
        eatToken(); // (

        eatToken(); // import

        var moduleName = token.value;
        eatTokenOfType(tokens.string);
        var _name3 = token.value;
        eatTokenOfType(tokens.string);
        importing = {
          module: moduleName,
          name: _name3,
          descr: undefined
        };
        eatTokenOfType(tokens.closeParen);
      }
      /**
       * global_sig
       */


      if (token.type === tokens.valtype) {
        type = t.globalImportDescr(token.value, "const");
        eatToken();
      } else if (token.type === tokens.openParen) {
        eatToken(); // (

        if (isKeyword(token, keywords.mut) === false) {
          showCodeFrame(source, token.loc);
          throw new Error("Unsupported global type, expected mut");
        }

        eatToken(); // mut

        type = t.globalType(token.value, "var");
        eatToken();
        eatTokenOfType(tokens.closeParen);
      }

      if (type === undefined) {
        showCodeFrame(source, token.loc);
        throw new TypeError("Could not determine global type");
      }

      if (importing != null) {
        importing.descr = type; // $FlowIgnore: the type is correct but Flow doesn't like the mutation above

        state.registredImportedElements.push(importing);
      }

      maybeIgnoreComment();
      var init = [];
      /**
       * instr*
       */

      while (token.type === tokens.openParen) {
        eatToken();
        init.push(parseFuncInstr());
        eatTokenOfType(tokens.closeParen);
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

      if (token.type === tokens.identifier) {
        id = token.value;
        eatToken();
      }

      if (token.type === tokens.valtype) {
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
          while (token.type === tokens.valtype) {
            valtype = token.value;
            eatToken();
            params.push({
              id: undefined,
              valtype: valtype
            });
          }
        }
      } else {
        throw new Error("Function param has no valtype");
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
      var tableIndex;
      var offset = [];
      var funcs = [];

      if (token.type === tokens.identifier) {
        tableIndex = t.identifier(token.value);
        eatToken();
      }

      if (token.type === tokens.number) {
        tableIndex = t.indexLiteral(token.value);
        eatToken();
      }

      while (token.type !== tokens.closeParen) {
        if (lookaheadAndCheck(tokens.openParen, keywords.offset)) {
          eatToken(); // (

          eatToken(); // offset

          while (token.type !== tokens.closeParen) {
            eatTokenOfType(tokens.openParen);
            offset.push(parseFuncInstr());
            eatTokenOfType(tokens.closeParen);
          }

          eatTokenOfType(tokens.closeParen);
        } else if (token.type === tokens.identifier) {
          funcs.push(t.identifier(token.value));
          eatToken();
        } else if (token.type === tokens.number) {
          funcs.push(t.indexLiteral(token.value));
          eatToken();
        } else if (token.type === tokens.openParen) {
          eatToken(); // (

          offset.push(parseFuncInstr());
          eatTokenOfType(tokens.closeParen);
        } else {
          showCodeFrame(source, token.loc);
          throw new Error("Unsupported token in elem: " + tokenToString(token));
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
      if (token.type === tokens.identifier) {
        var index = t.identifier(token.value);
        eatToken();
        return t.start(index);
      }

      if (token.type === tokens.number) {
        var _index = t.indexLiteral(token.value);

        eatToken();
        return t.start(_index);
      }

      throw new Error("Unknown start, token: " + tokenToString(token));
    }

    if (token.type === tokens.openParen) {
      eatToken();

      if (isKeyword(token, keywords.export)) {
        eatToken();
        return parseExport();
      }

      if (isKeyword(token, keywords.loop)) {
        eatToken();
        return parseLoop();
      }

      if (isKeyword(token, keywords.func)) {
        eatToken();
        var node = parseFunc();
        eatTokenOfType(tokens.closeParen);
        return node;
      }

      if (isKeyword(token, keywords.module)) {
        eatToken();
        return parseModule();
      }

      if (isKeyword(token, keywords.import)) {
        eatToken();
        return parseImport();
      }

      if (isKeyword(token, keywords.block)) {
        eatToken();

        var _node = parseBlock();

        eatTokenOfType(tokens.closeParen);
        return _node;
      }

      if (isKeyword(token, keywords.memory)) {
        eatToken();

        var _node2 = parseMemory();

        eatTokenOfType(tokens.closeParen);
        return _node2;
      }

      if (isKeyword(token, keywords.data)) {
        eatToken();

        var _node3 = parseData();

        eatTokenOfType(tokens.closeParen);
        return _node3;
      }

      if (isKeyword(token, keywords.table)) {
        eatToken();

        var _node4 = parseTable();

        eatTokenOfType(tokens.closeParen);
        return _node4;
      }

      if (isKeyword(token, keywords.global)) {
        eatToken();

        var _node5 = parseGlobal();

        eatTokenOfType(tokens.closeParen);
        return _node5;
      }

      if (isKeyword(token, keywords.type)) {
        eatToken();

        var _node6 = parseType();

        eatTokenOfType(tokens.closeParen);
        return _node6;
      }

      if (isKeyword(token, keywords.start)) {
        eatToken();

        var _node7 = parseStart();

        eatTokenOfType(tokens.closeParen);
        return _node7;
      }

      if (isKeyword(token, keywords.elem)) {
        eatToken();

        var _node8 = parseElem();

        eatTokenOfType(tokens.closeParen);
        return _node8;
      }

      var instruction = parseFuncInstr();

      if (_typeof(instruction) === "object") {
        eatTokenOfType(tokens.closeParen);
        return instruction;
      }
    }

    if (token.type === tokens.comment) {
      var builder = token.opts.type === "leading" ? t.leadingComment : t.blockComment;

      var _node9 = builder(token.value);

      eatToken();
      return _node9;
    }

    showCodeFrame(source, token.loc);
    throw new TypeError("Unknown token: " + token.type);
  }

  var body = [];

  while (current < tokensList.length) {
    body.push(walk());
  }

  return t.program(body);
}
}).call(this,require('_process'))
},{"./number-literals":47,"./string-literals":48,"./tokenizer":49,"@babel/code-frame":33,"@webassemblyjs/ast":35,"_process":70}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;

var parser = _interopRequireWildcard(require("./grammar"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var _require = require("./tokenizer"),
    tokenize = _require.tokenize;

function parse(source) {
  var tokens = tokenize(source); // We pass the source here to show code frames

  var ast = parser.parse(tokens, source);
  return ast;
}
},{"./grammar":45,"./tokenizer":49}],47:[function(require,module,exports){
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

var Long = require("long");

var parseHexFloat = require("webassembly-floating-point-hex-parser");

var _require = require("webassemblyjs/lib/errors"),
    CompileError = _require.CompileError;

function parse32F(sourceString) {
  if (isHexLiteral(sourceString)) {
    return parseHexFloat(sourceString);
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
    return parseHexFloat(sourceString);
  }

  if (isInfLiteral(sourceString)) {
    return 0;
  }

  if (isNanLiteral(sourceString)) {
    return sourceString.length > 3 ? parseInt(sourceString.substring(4), 16) : 0x400000;
  }

  if (isHexLiteral(sourceString)) {
    return parseHexFloat(sourceString);
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
    throw new CompileError("Illegal value for u32: " + sourceString);
  }

  return value;
}

function parse64I(sourceString) {
  var long;

  if (isHexLiteral(sourceString)) {
    long = Long.fromString(sourceString, false, 16);
  } else if (isDecimalExponentLiteral(sourceString)) {
    throw new Error("This number literal format is yet to be implemented.");
  } else {
    long = Long.fromString(sourceString);
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
},{"long":63,"webassembly-floating-point-hex-parser":65,"webassemblyjs/lib/errors":66}],48:[function(require,module,exports){
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
},{}],49:[function(require,module,exports){
(function (process){
var _require = require("@babel/code-frame"),
    codeFrameColumns = _require.codeFrameColumns;

function showCodeFrame(source, line, column) {
  var loc = {
    start: {
      line: line,
      column: column
    }
  };
  var out = codeFrameColumns(source, loc);
  process.stdout.write(out + "\n");
}

var WHITESPACE = /\s/;
var LETTERS = /[a-z0-9_/]/i;
var idchar = /[a-z0-9!#$%&*+./:<=>?@\\[\]^_`|~-]/i;
var valtypes = ["i32", "i64", "f32", "f64"];
var NUMBERS = /[0-9|.|_]/;
var NUMBER_KEYWORDS = /nan|inf/;
var HEX_NUMBERS = /[0-9|A-F|a-f|_|.|p|P|-]/;

function isNewLine(char) {
  return char.charCodeAt(0) === 10 || char.charCodeAt(0) === 13;
}

function Token(type, value, line, column) {
  var opts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  var token = {
    type: type,
    value: value,
    loc: {
      start: {
        line: line,
        column: column
      }
    }
  };

  if (Object.keys(opts).length > 0) {
    // $FlowIgnore
    token["opts"] = opts;
  }

  return token;
}

function createToken(type) {
  return function (v, line, col) {
    var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    return Token(type, v, line, col, opts);
  };
}

var tokens = {
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
var CloseParenToken = createToken(tokens.closeParen);
var OpenParenToken = createToken(tokens.openParen);
var NumberToken = createToken(tokens.number);
var ValtypeToken = createToken(tokens.valtype);
var NameToken = createToken(tokens.name);
var IdentifierToken = createToken(tokens.identifier);
var KeywordToken = createToken(tokens.keyword);
var DotToken = createToken(tokens.dot);
var StringToken = createToken(tokens.string);
var CommentToken = createToken(tokens.comment);
var EqualToken = createToken(tokens.equal);

function tokenize(input) {
  var current = 0; // Used by SourceLocation

  var column = 1;
  var line = 1;
  var tokens = [];

  function eatToken() {
    column++;
    current++;
  }

  while (current < input.length) {
    var char = input[current]; // ;;

    if (char === ";" && input[current + 1] === ";") {
      eatToken();
      eatToken();
      char = input[current];
      var text = "";

      while (!isNewLine(char)) {
        text += char;
        char = input[++current];

        if (char === undefined) {
          break;
        }
      } // Shift by the length of the string


      column += text.length;
      tokens.push(CommentToken(text, line, column, {
        type: "leading"
      }));
      continue;
    } // (;


    if (char === "(" && input[current + 1] === ";") {
      eatToken(); // (

      eatToken(); // ;

      char = input[current];
      var _text = ""; // ;)

      while (true) {
        char = input[current];

        if (char === ";" && input[current + 1] === ")") {
          eatToken(); // ;

          eatToken(); // )

          break;
        }

        _text += char;

        if (isNewLine(char)) {
          line++;
          column = 0;
        } else {
          column++;
        }

        eatToken();
      }

      tokens.push(CommentToken(_text, line, column, {
        type: "block"
      }));
      continue;
    }

    if (char === "(") {
      tokens.push(OpenParenToken(char, line, column));
      eatToken();
      continue;
    }

    if (char === "=") {
      tokens.push(EqualToken(char, line, column));
      eatToken();
      continue;
    }

    if (char === ")") {
      tokens.push(CloseParenToken(char, line, column));
      eatToken();
      continue;
    }

    if (isNewLine(char)) {
      line++;
      eatToken();
      column = 0;
      continue;
    }

    if (WHITESPACE.test(char)) {
      eatToken();
      continue;
    }

    if (char === "$") {
      char = input[++current];
      var value = "";

      while (idchar.test(char)) {
        value += char;
        char = input[++current];
      } // Shift by the length of the string


      column += value.length;
      tokens.push(IdentifierToken(value, line, column));
      continue;
    }

    if (NUMBERS.test(char) || NUMBER_KEYWORDS.test(input.substring(current, current + 3)) || char === "-") {
      var _value = "";

      if (char === "-") {
        _value += char;
        char = input[++current];
      }

      if (NUMBER_KEYWORDS.test(input.substring(current, current + 3))) {
        var tokenLength = 3;

        if (input.substring(current, current + 4) === "nan:") {
          tokenLength = 4;
        } else if (input.substring(current, current + 3) === "nan") {
          tokenLength = 3;
        }

        _value += input.substring(current, current + tokenLength);
        char = input[current += tokenLength];
      }

      var numberLiterals = NUMBERS;

      if (char === "0" && input[current + 1].toUpperCase() === "X") {
        _value += "0x";
        numberLiterals = HEX_NUMBERS;
        char = input[current += 2];
      }

      while (numberLiterals.test(char) || input[current - 1] === "p" && char === "+") {
        if (char !== "_") {
          _value += char;
        }

        char = input[++current];
      } // Shift by the length of the string


      column += _value.length;
      tokens.push(NumberToken(_value, line, column));
      continue;
    }

    if (char === '"') {
      var _value2 = "";
      char = input[++current];

      while (char !== '"') {
        if (isNewLine(char)) {
          throw new Error("Unterminated string constant");
        }

        _value2 += char;
        char = input[++current];
      } // Shift by the length of the string


      column += _value2.length;
      eatToken();
      tokens.push(StringToken(_value2, line, column));
      continue;
    }

    if (LETTERS.test(char)) {
      var _value3 = "";

      while (LETTERS.test(char)) {
        _value3 += char;
        char = input[++current];
      } // Shift by the length of the string


      column += _value3.length;
      /*
       * Handle MemberAccess
       */

      if (char === ".") {
        if (valtypes.indexOf(_value3) !== -1) {
          tokens.push(ValtypeToken(_value3, line, column));
        } else {
          tokens.push(NameToken(_value3, line, column));
        }

        _value3 = "";
        char = input[++current];

        while (LETTERS.test(char)) {
          _value3 += char;
          char = input[++current];
        } // Shift by the length of the string


        column += _value3.length;
        tokens.push(DotToken(".", line, column));
        tokens.push(NameToken(_value3, line, column));
        continue;
      }
      /*
       * Handle keywords
       */
      // $FlowIgnore


      if (typeof keywords[_value3] === "string") {
        tokens.push(KeywordToken(_value3, line, column)); // Shift by the length of the string

        column += _value3.length;
        continue;
      }
      /*
       * Handle types
       */


      if (valtypes.indexOf(_value3) !== -1) {
        tokens.push(ValtypeToken(_value3, line, column)); // Shift by the length of the string

        column += _value3.length;
        continue;
      }
      /*
       * Handle literals
       */


      tokens.push(NameToken(_value3, line, column)); // Shift by the length of the string

      column += _value3.length;
      continue;
    }

    showCodeFrame(input, line, column);
    throw new TypeError("Unknown char: " + char);
  }

  return tokens;
}

module.exports = {
  tokenize: tokenize,
  tokens: tokens,
  keywords: keywords
};
}).call(this,require('_process'))
},{"@babel/code-frame":33,"_process":70}],50:[function(require,module,exports){
'use strict';
const colorConvert = require('color-convert');

const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{"color-convert":54}],51:[function(require,module,exports){
(function (process){
'use strict';
const escapeStringRegexp = require('escape-string-regexp');
const ansiStyles = require('ansi-styles');
const stdoutColor = require('supports-color').stdout;

const template = require('./templates.js');

const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return template(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript

}).call(this,require('_process'))
},{"./templates.js":52,"_process":70,"ansi-styles":50,"escape-string-regexp":57,"supports-color":64}],52:[function(require,module,exports){
'use strict';
const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

module.exports = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};

},{}],53:[function(require,module,exports){
/* MIT license */
var cssKeywords = require('color-name');

// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in cssKeywords) {
	if (cssKeywords.hasOwnProperty(key)) {
		reverseKeywords[cssKeywords[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var rdif;
	var gdif;
	var bdif;
	var h;
	var s;

	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var v = Math.max(r, g, b);
	var diff = v - Math.min(r, g, b);
	var diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}
		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in cssKeywords) {
		if (cssKeywords.hasOwnProperty(keyword)) {
			var value = cssKeywords[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return cssKeywords[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};

},{"color-name":56}],54:[function(require,module,exports){
var conversions = require('./conversions');
var route = require('./route');

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

module.exports = convert;

},{"./conversions":53,"./route":55}],55:[function(require,module,exports){
var conversions = require('./conversions');

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

module.exports = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};


},{"./conversions":53}],56:[function(require,module,exports){
module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};
},{}],57:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],58:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
        case 'IfStatement':
            if (node.alternate != null) {
                return node.alternate;
            }
            return node.consequent;

        case 'LabeledStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'WhileStatement':
        case 'WithStatement':
            return node.body;
        }
        return null;
    }

    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null)  {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    module.exports = {
        isExpression: isExpression,
        isStatement: isStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,

        trailingStatement: trailingStatement
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],59:[function(require,module,exports){
/*
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    ES6Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39;  // 0..9
    }

    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
            0x61 <= ch && ch <= 0x66 ||     // a..f
            0x41 <= ch && ch <= 0x46;       // A..F
    }

    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37;  // 0..7
    }

    // 7.2 White Space

    NON_ASCII_WHITESPACES = [
        0x1680, 0x180E,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];

    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }

    // 7.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }

    IDENTIFIER_START = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    IDENTIFIER_PART = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch >= 0x30 && ch <= 0x39 ||  // 0..9
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStartES5: isIdentifierStartES5,
        isIdentifierPartES5: isIdentifierPartES5,
        isIdentifierStartES6: isIdentifierStartES6,
        isIdentifierPartES6: isIdentifierPartES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],60:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var code = require('./code');

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isReservedWordES5(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
    }

    function isReservedWordES6(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierNameES5(id) {
        var i, iz, ch;

        if (id.length === 0) { return false; }

        ch = id.charCodeAt(0);
        if (!code.isIdentifierStartES5(ch)) {
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code.isIdentifierPartES5(ch)) {
                return false;
            }
        }
        return true;
    }

    function decodeUtf16(lead, trail) {
        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
    }

    function isIdentifierNameES6(id) {
        var i, iz, ch, lowCh, check;

        if (id.length === 0) { return false; }

        check = code.isIdentifierStartES6;
        for (i = 0, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (0xD800 <= ch && ch <= 0xDBFF) {
                ++i;
                if (i >= iz) { return false; }
                lowCh = id.charCodeAt(i);
                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                    return false;
                }
                ch = decodeUtf16(ch, lowCh);
            }
            if (!check(ch)) {
                return false;
            }
            check = code.isIdentifierPartES6;
        }
        return true;
    }

    function isIdentifierES5(id, strict) {
        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
    }

    function isIdentifierES6(id, strict) {
        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isReservedWordES5: isReservedWordES5,
        isReservedWordES6: isReservedWordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierNameES5: isIdentifierNameES5,
        isIdentifierNameES6: isIdentifierNameES6,
        isIdentifierES5: isIdentifierES5,
        isIdentifierES6: isIdentifierES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./code":59}],61:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {
    'use strict';

    exports.ast = require('./ast');
    exports.code = require('./code');
    exports.keyword = require('./keyword');
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./ast":58,"./code":59,"./keyword":60}],62:[function(require,module,exports){
// Copyright 2014, 2015, 2016, 2017 Simon Lydell
// License: MIT. (See LICENSE.)

Object.defineProperty(exports, "__esModule", {
  value: true
})

// This regex comes from regex.coffee, and is inserted here by generate-index.js
// (run `npm run build`).
exports.default = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g

exports.matchToToken = function(match) {
  var token = {type: "invalid", value: match[0]}
       if (match[ 1]) token.type = "string" , token.closed = !!(match[3] || match[4])
  else if (match[ 5]) token.type = "comment"
  else if (match[ 6]) token.type = "comment", token.closed = !!match[7]
  else if (match[ 8]) token.type = "regex"
  else if (match[ 9]) token.type = "number"
  else if (match[10]) token.type = "name"
  else if (match[11]) token.type = "punctuator"
  else if (match[12]) token.type = "whitespace"
  return token
}

},{}],63:[function(require,module,exports){
/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>
 Copyright 2009 The Closure Library Authors. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS-IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license long.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/long.js for details
 */
(function(global, factory) {

    /* AMD */ if (typeof define === 'function' && define["amd"])
        define([], factory);
    /* CommonJS */ else if (typeof require === 'function' && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
    /* Global */ else
        (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();

})(this, function() {
    "use strict";

    /**
     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
     *  See the from* functions below for more convenient ways of constructing Longs.
     * @exports Long
     * @class A Long class for representing a 64 bit two's-complement integer value.
     * @param {number} low The low (signed) 32 bits of the long
     * @param {number} high The high (signed) 32 bits of the long
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
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
    }

    // The internal representation of a long is the two given signed, 32-bit values.
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
        value: true,
        enumerable: false,
        configurable: false
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
            if (cache = (0 <= value && value < 256)) {
                cachedObj = UINT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
            if (cache)
                UINT_CACHE[value] = obj;
            return obj;
        } else {
            value |= 0;
            if (cache = (-128 <= value && value < 128)) {
                cachedObj = INT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = fromBits(value, value < 0 ? -1 : 0, false);
            if (cache)
                INT_CACHE[value] = obj;
            return obj;
        }
    }

    /**
     * Returns a Long representing the given 32 bit integer value.
     * @function
     * @param {number} value The 32 bit integer in question
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
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
        if (isNaN(value) || !isFinite(value))
            return unsigned ? UZERO : ZERO;
        if (unsigned) {
            if (value < 0)
                return UZERO;
            if (value >= TWO_PWR_64_DBL)
                return MAX_UNSIGNED_VALUE;
        } else {
            if (value <= -TWO_PWR_63_DBL)
                return MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL)
                return MAX_VALUE;
        }
        if (value < 0)
            return fromNumber(-value, unsigned).neg();
        return fromBits((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
    }

    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     * @function
     * @param {number} value The number in question
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
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
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
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
        if (str.length === 0)
            throw Error('empty string');
        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
            return ZERO;
        if (typeof unsigned === 'number') {
            // For goog.math.long compatibility
            radix = unsigned,
            unsigned = false;
        } else {
            unsigned = !! unsigned;
        }
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');

        var p;
        if ((p = str.indexOf('-')) > 0)
            throw Error('interior hyphen');
        else if (p === 0) {
            return fromString(str.substring(1), unsigned, radix).neg();
        }

        // Do several (8) digits each time through the loop, so as to
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
     * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
     * @returns {!Long} The corresponding Long value
     */
    Long.fromString = fromString;

    /**
     * @function
     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
     * @returns {!Long}
     * @inner
     */
    function fromValue(val) {
        if (val /* is compatible */ instanceof Long)
            return val;
        if (typeof val === 'number')
            return fromNumber(val);
        if (typeof val === 'string')
            return fromString(val);
        // Throws for non-objects, converts non-instanceof Long:
        return fromBits(val.low, val.high, val.unsigned);
    }

    /**
     * Converts the specified value to a Long.
     * @function
     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
     * @returns {!Long}
     */
    Long.fromValue = fromValue;

    // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
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
    var MAX_VALUE = fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);

    /**
     * Maximum signed value.
     * @type {!Long}
     */
    Long.MAX_VALUE = MAX_VALUE;

    /**
     * @type {!Long}
     * @inner
     */
    var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);

    /**
     * Maximum unsigned value.
     * @type {!Long}
     */
    Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;

    /**
     * @type {!Long}
     * @inner
     */
    var MIN_VALUE = fromBits(0, 0x80000000|0, false);

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
     * @returns {number}
     */
    LongPrototype.toInt = function toInt() {
        return this.unsigned ? this.low >>> 0 : this.low;
    };

    /**
     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
     * @returns {number}
     */
    LongPrototype.toNumber = function toNumber() {
        if (this.unsigned)
            return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };

    /**
     * Converts the Long to a string written in the specified radix.
     * @param {number=} radix Radix (2-36), defaults to 10
     * @returns {string}
     * @override
     * @throws {RangeError} If `radix` is out of range
     */
    LongPrototype.toString = function toString(radix) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        if (this.isZero())
            return '0';
        if (this.isNegative()) { // Unsigned Longs are never negative
            if (this.eq(MIN_VALUE)) {
                // We need to change the Long value before it can be negated, so we remove
                // the bottom-most digit in this base and then recurse to do the rest.
                var radixLong = fromNumber(radix),
                    div = this.div(radixLong),
                    rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            } else
                return '-' + this.neg().toString(radix);
        }

        // Do several (6) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
            rem = this;
        var result = '';
        while (true) {
            var remDiv = rem.div(radixToPower),
                intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
                digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero())
                return digits + result;
            else {
                while (digits.length < 6)
                    digits = '0' + digits;
                result = '' + digits + result;
            }
        }
    };

    /**
     * Gets the high 32 bits as a signed integer.
     * @returns {number} Signed high bits
     */
    LongPrototype.getHighBits = function getHighBits() {
        return this.high;
    };

    /**
     * Gets the high 32 bits as an unsigned integer.
     * @returns {number} Unsigned high bits
     */
    LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
        return this.high >>> 0;
    };

    /**
     * Gets the low 32 bits as a signed integer.
     * @returns {number} Signed low bits
     */
    LongPrototype.getLowBits = function getLowBits() {
        return this.low;
    };

    /**
     * Gets the low 32 bits as an unsigned integer.
     * @returns {number} Unsigned low bits
     */
    LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
        return this.low >>> 0;
    };

    /**
     * Gets the number of bits needed to represent the absolute value of this Long.
     * @returns {number}
     */
    LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
        if (this.isNegative()) // Unsigned Longs are never negative
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        var val = this.high != 0 ? this.high : this.low;
        for (var bit = 31; bit > 0; bit--)
            if ((val & (1 << bit)) != 0)
                break;
        return this.high != 0 ? bit + 33 : bit + 1;
    };

    /**
     * Tests if this Long's value equals zero.
     * @returns {boolean}
     */
    LongPrototype.isZero = function isZero() {
        return this.high === 0 && this.low === 0;
    };

    /**
     * Tests if this Long's value is negative.
     * @returns {boolean}
     */
    LongPrototype.isNegative = function isNegative() {
        return !this.unsigned && this.high < 0;
    };

    /**
     * Tests if this Long's value is positive.
     * @returns {boolean}
     */
    LongPrototype.isPositive = function isPositive() {
        return this.unsigned || this.high >= 0;
    };

    /**
     * Tests if this Long's value is odd.
     * @returns {boolean}
     */
    LongPrototype.isOdd = function isOdd() {
        return (this.low & 1) === 1;
    };

    /**
     * Tests if this Long's value is even.
     * @returns {boolean}
     */
    LongPrototype.isEven = function isEven() {
        return (this.low & 1) === 0;
    };

    /**
     * Tests if this Long's value equals the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.equals = function equals(other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
            return false;
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
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.notEquals = function notEquals(other) {
        return !this.eq(/* validates */ other);
    };

    /**
     * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.neq = LongPrototype.notEquals;

    /**
     * Tests if this Long's value is less than the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lessThan = function lessThan(other) {
        return this.comp(/* validates */ other) < 0;
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
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
        return this.comp(/* validates */ other) <= 0;
    };

    /**
     * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.lte = LongPrototype.lessThanOrEqual;

    /**
     * Tests if this Long's value is greater than the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.greaterThan = function greaterThan(other) {
        return this.comp(/* validates */ other) > 0;
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
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
        return this.comp(/* validates */ other) >= 0;
    };

    /**
     * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     */
    LongPrototype.gte = LongPrototype.greaterThanOrEqual;

    /**
     * Compares this Long's value with the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
     *  if the given one is greater
     */
    LongPrototype.compare = function compare(other) {
        if (!isLong(other))
            other = fromValue(other);
        if (this.eq(other))
            return 0;
        var thisNeg = this.isNegative(),
            otherNeg = other.isNegative();
        if (thisNeg && !otherNeg)
            return -1;
        if (!thisNeg && otherNeg)
            return 1;
        // At this point the sign bits are the same
        if (!this.unsigned)
            return this.sub(other).isNegative() ? -1 : 1;
        // Both are positive if at least one is unsigned
        return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
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
     * @returns {!Long} Negated Long
     */
    LongPrototype.negate = function negate() {
        if (!this.unsigned && this.eq(MIN_VALUE))
            return MIN_VALUE;
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
     * @param {!Long|number|string} addend Addend
     * @returns {!Long} Sum
     */
    LongPrototype.add = function add(addend) {
        if (!isLong(addend))
            addend = fromValue(addend);

        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
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
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };

    /**
     * Returns the difference of this and the specified Long.
     * @param {!Long|number|string} subtrahend Subtrahend
     * @returns {!Long} Difference
     */
    LongPrototype.subtract = function subtract(subtrahend) {
        if (!isLong(subtrahend))
            subtrahend = fromValue(subtrahend);
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
     * @param {!Long|number|string} multiplier Multiplier
     * @returns {!Long} Product
     */
    LongPrototype.multiply = function multiply(multiplier) {
        if (this.isZero())
            return ZERO;
        if (!isLong(multiplier))
            multiplier = fromValue(multiplier);
        if (multiplier.isZero())
            return ZERO;
        if (this.eq(MIN_VALUE))
            return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE))
            return this.isOdd() ? MIN_VALUE : ZERO;

        if (this.isNegative()) {
            if (multiplier.isNegative())
                return this.neg().mul(multiplier.neg());
            else
                return this.neg().mul(multiplier).neg();
        } else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();

        // If both longs are small, use float multiplication
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
        // We can skip products that would overflow.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
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
        return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
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
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Quotient
     */
    LongPrototype.divide = function divide(divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
        if (divisor.isZero())
            throw Error('division by zero');
        if (this.isZero())
            return this.unsigned ? UZERO : ZERO;
        var approx, rem, res;
        if (!this.unsigned) {
            // This section is only relevant for signed longs and is derived from the
            // closure library as a whole.
            if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                    return MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
                else if (divisor.eq(MIN_VALUE))
                    return ONE;
                else {
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
            } else if (divisor.eq(MIN_VALUE))
                return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
                if (divisor.isNegative())
                    return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            } else if (divisor.isNegative())
                return this.div(divisor.neg()).neg();
            res = ZERO;
        } else {
            // The algorithm below has not been made for unsigned longs. It's therefore
            // required to take special care of the MSB prior to running it.
            if (!divisor.unsigned)
                divisor = divisor.toUnsigned();
            if (divisor.gt(this))
                return UZERO;
            if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
                return UONE;
            res = UZERO;
        }

        // Repeat the following until the remainder is less than other:  find a
        // floating-point that approximates remainder / other *from below*, add this
        // into the result, and subtract it from the remainder.  It is critical that
        // the approximate value is less than or equal to the real value so that the
        // remainder never becomes negative.
        rem = this;
        while (rem.gte(divisor)) {
            // Approximate the result of division. This may be a little greater or
            // smaller than the actual value.
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

            // We will tweak the approximate result by changing it in the 48-th digit or
            // the smallest non-fractional digit, whichever is larger.
            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
                delta = (log2 <= 48) ? 1 : pow_dbl(2, log2 - 48),

            // Decrease the approximation until it is smaller than the remainder.  Note
            // that if it is too large, the product overflows and is negative.
                approxRes = fromNumber(approx),
                approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }

            // We know the answer can't be zero... and actually, zero would cause
            // infinite recursion since we would make no progress.
            if (approxRes.isZero())
                approxRes = ONE;

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
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Remainder
     */
    LongPrototype.modulo = function modulo(divisor) {
        if (!isLong(divisor))
            divisor = fromValue(divisor);
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
     * Returns the bitwise NOT of this Long.
     * @returns {!Long}
     */
    LongPrototype.not = function not() {
        return fromBits(~this.low, ~this.high, this.unsigned);
    };

    /**
     * Returns the bitwise AND of this Long and the specified.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     */
    LongPrototype.and = function and(other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    };

    /**
     * Returns the bitwise OR of this Long and the specified.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     */
    LongPrototype.or = function or(other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    };

    /**
     * Returns the bitwise XOR of this Long and the given one.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     */
    LongPrototype.xor = function xor(other) {
        if (!isLong(other))
            other = fromValue(other);
        return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shiftLeft = function shiftLeft(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
        else
            return fromBits(0, this.low << (numBits - 32), this.unsigned);
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
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shiftRight = function shiftRight(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
        else
            return fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
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
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     */
    LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
        if (isLong(numBits))
            numBits = numBits.toInt();
        numBits &= 63;
        if (numBits === 0)
            return this;
        else {
            var high = this.high;
            if (numBits < 32) {
                var low = this.low;
                return fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
            } else if (numBits === 32)
                return fromBits(high, 0, this.unsigned);
            else
                return fromBits(high >>> (numBits - 32), 0, this.unsigned);
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
     * Converts this Long to signed.
     * @returns {!Long} Signed long
     */
    LongPrototype.toSigned = function toSigned() {
        if (!this.unsigned)
            return this;
        return fromBits(this.low, this.high, false);
    };

    /**
     * Converts this Long to unsigned.
     * @returns {!Long} Unsigned long
     */
    LongPrototype.toUnsigned = function toUnsigned() {
        if (this.unsigned)
            return this;
        return fromBits(this.low, this.high, true);
    };

    /**
     * Converts this Long to its byte representation.
     * @param {boolean=} le Whether little or big endian, defaults to big endian
     * @returns {!Array.<number>} Byte representation
     */
    LongPrototype.toBytes = function(le) {
        return le ? this.toBytesLE() : this.toBytesBE();
    }

    /**
     * Converts this Long to its little endian byte representation.
     * @returns {!Array.<number>} Little endian byte representation
     */
    LongPrototype.toBytesLE = function() {
        var hi = this.high,
            lo = this.low;
        return [
             lo         & 0xff,
            (lo >>>  8) & 0xff,
            (lo >>> 16) & 0xff,
            (lo >>> 24) & 0xff,
             hi         & 0xff,
            (hi >>>  8) & 0xff,
            (hi >>> 16) & 0xff,
            (hi >>> 24) & 0xff
        ];
    }

    /**
     * Converts this Long to its big endian byte representation.
     * @returns {!Array.<number>} Big endian byte representation
     */
    LongPrototype.toBytesBE = function() {
        var hi = this.high,
            lo = this.low;
        return [
            (hi >>> 24) & 0xff,
            (hi >>> 16) & 0xff,
            (hi >>>  8) & 0xff,
             hi         & 0xff,
            (lo >>> 24) & 0xff,
            (lo >>> 16) & 0xff,
            (lo >>>  8) & 0xff,
             lo         & 0xff
        ];
    }

    return Long;
});

},{}],64:[function(require,module,exports){
'use strict';
module.exports = {
	stdout: false,
	stderr: false
};

},{}],65:[function(require,module,exports){
'use strict';function parse(a){var b=Math.pow;a=a.toUpperCase();var c,d,e=a.indexOf('P');-1===e?(c=a,d=0):(c=a.substring(0,e),d=parseInt(a.substring(e+1)));var f=c.indexOf('.');if(-1!==f){var g=parseInt(c.substring(0,f),16),h=Math.sign(g);g=h*g;var i=c.length-f-1,j=parseInt(c.substring(f+1),16),k=0<i?j/b(16,i):0;c=0===h?0==k?h:Object.is(h,-0)?-k:k:h*(g+k)}else c=parseInt(c,16);return c*(-1===e?1:b(2,d))}module.exports=parse;
},{}],66:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],67:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],68:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

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
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
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

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
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
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":67,"ieee754":69}],69:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],70:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[9])(9)
});
