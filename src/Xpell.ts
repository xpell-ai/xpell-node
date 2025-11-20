/**
 * Xpell - Real-Time User Interface Platform
 * Typescript Edition   
 *      
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version
 * 3 of the License, or (at your option) any later version.
 *
 *
 */



/** interface */
import { XCommand, XCommandData } from "./XCommand.js"
import { XUtils, FPSCalc } from "./XUtils.js"
import { XLogger as _xlog } from "./XLogger.js"
import XData from "./XData.js"
import XParser from "./XParser.js"
import XModule from "./XModule.js"
import { XEventManager as XEM } from "./XEventManager.js"









// class XpellMainModule extends XModule {



//     constructor(data) {
//         const defaults = {name:"xpell"}
//         super(data,defaults)
//     }

//     _info(xcmd:XCommand) {
//         _xlog.log("Xpell Engine V:" + Xpell.version)
//     }

//     _loadModule(xcmd:XCommand) {
//         _xlog.log(xcmd.params["name"])
//     }
// }

/**
 * @class  Xpell main engine
 */
export class XpellEngine {
    _version: string
    _engine_id: string
    _frame_number: number
    #fps_calc: FPSCalc
    _fps: number = 1
    #_modules: { [name: string]: any } = {}
    parser: typeof XParser
    private _interval: NodeJS.Timeout | undefined
    #_verbose: boolean = true

    constructor() {
        this._version = "0.0.1"
        this._engine_id = XUtils.guid()
        this._frame_number = 0
        this.#fps_calc = new FPSCalc()
        this.parser = XParser
        this.#_modules = {}
        XEM.fire("xpell-init")
        _xlog.enabled = this.#_verbose
        //this.load()
    }


    /**
     * Enable Xpell logs to console
     * @deprecated
     */
    verbose() {
        _xlog.enabled = true
    }

    get _verbose() {
        return this.#_verbose
    }

    set _verbose(v: boolean) {
        this.#_verbose = v
        _xlog.enabled = v
    }


    /**
     * Loads Xpell module into the engine
     * @param {XModule} xModule 
     */
    loadModule(xModule: XModule): void {
        this.addModule(xModule)
        if (!xModule._loaded) xModule.load()
        else _xlog.log("Module " + xModule._name + " already loaded")
    }

    /**
     * Add module to the engine but not load it
     * @param xModule 
     */
    addModule(xModule: XModule): void {
        if (this.#_modules.hasOwnProperty(xModule._name)) {
            _xlog.log("Module " + xModule._name + " already added")
        } else {
            this.#_modules[<any>xModule._name] = xModule;
        }
    }

    /**
     * Loads multiple module at ones
     * @param {Array<XModule>} xModulesArray 
     */
    loadModules(xModulesArray: Array<XModule>): void {
        xModulesArray.forEach((mod) => this.loadModule(mod))
    }


    /**
     * Display information about the Xpell engine to the console
     */
    info() {
        _xlog.log("Xpell information:\n- Engine Id: " + this._engine_id + "\n- Version " + this._version)
    }


    /**
    * Run textual xCommand -
    * @param {cmd} - text command
    */

    run(stringXCommand: string) {
        if (stringXCommand?.length > 2) {
            let scmd = XParser.parse(stringXCommand)
            return this.execute(scmd)
        } else {
            throw "Unable to parse Xpell command"
        }
    }

    /**
     * Execute Xpell Command 
     * @param {XCommand} 
     */
    execute(xcmd: XCommand | XCommandData): any {
        if (xcmd && xcmd._module && this.#_modules[xcmd._module]) {
            return this.#_modules[xcmd._module].execute(xcmd)
        } else {
            throw "Xpell module " + xcmd._module + " not loaded"
        }
    }


    /**
    * Takes code JSON and sequentially executes the commands
    * xequal: sets the value of _v1 to the value of the result of _v2 which is a xpell command
    * return: returns the value of _v1
    * equal: sets the value of _v1 to the value of _v2
    * @param code Json object
    * @example  
    *   code = [{
            _condition: "params._description", //Condition checks only for existence for now
            _operation: [{
                _type: "xequal",
                _v1: "params._context",                
                _v2: "aime-utils-manager sentensize _input_text:params._description"
            },{
                _type: "equal",
                _v1: "params._c",                
                _v2: "params._context"
            },{
                _type: "equal",
                _v1: "p",                
                _v2: "f"
            },{
                _type: "return",
                _v1: "params",
            }],
        }]
    */
    async executeSequence(code: any, params: any) {
        // console.log("code", code);
        // console.log("params", params);

        if (code) {
            for (let i = 0; i < code.length; ++i) {
                let block = code[i]
                // console.log("block", block);
                let condition
                let operation
                let v
                let invert = false
                let condition_result = true
                if (block._condition) {
                    condition_result = false
                    condition = block._condition
                    if (condition.startsWith("!")) {
                        condition = condition.substr(1)
                        invert = true
                    }

                    if (condition.startsWith("params.")) {
                        v = condition.split(".")[1]
                    } else {
                        v = condition
                    }

                    if (params[v]) {
                        condition_result = true
                    }
                    
                    if (invert) {
                        condition_result = !condition_result
                    }


                }
                // console.log("condition", condition_result);
                
                operation = block._operation
                for (let k = 0; k < operation.length; ++k) {
                    if (!condition_result) {
                        continue
                    }
                    let op = operation[k]
                    // console.log("op ",k ," ", op);

                    if (op._type === "xequal") {
                        const s = op._v1.split(".")
                        const s2 = op._v2.split(".")
                        let parsed: any = XParser.parse(op._v2)
                        if (parsed._params) {
                            Object.keys(parsed._params).forEach((key) => {
                                if (parsed._params[key].startsWith("params.")) {
                                    parsed._params[key] = params[parsed._params[key].split(".")[1]]
                                } else if (parsed._params[key] === "params") {
                                    parsed._params[key] = params
                                }
                            })
                        }
                        // console.log("parsed", parsed);
                        
                        if (op._v1 === "params") {
                            params = await this.execute(parsed)
                        } else if (s.length > 1) {
                            params[s[1]] = await this.execute(parsed)
                        } else {
                            params[op._v1] = await this.execute(parsed)
                        }
                    } else if (op._type === "return") {
                        if (op._v1 === "params") {
                            return params
                        }
                        if (op._v1.startsWith("params.")) {
                            return params[op._v1.split(".")[1]]
                        } else {
                            return params[op._v1]
                        }
                    } else if (op._type === "equal") {
                        if(Array.isArray(op._v2)){                            
                            if(op._v1.startsWith("params.")){
                                params[op._v1.split(".")[1]] = op._v2
                            } else {
                                params[op._v1] = op._v2
                            }
                        } else {
                            if (op._v1 === "params") {
                                params = op._v2
                            } else if (op._v1.startsWith("params.")) {
                                if (op._v2.startsWith("params.")) {
                                    params[op._v1.split(".")[1]] = params[op._v2.split(".")[1]]
                                } else {
                                    params[op._v1.split(".")[1]] = op._v2
                                }
                            } else {
                                if (op._v2.startsWith("params.")) {
                                    params[op._v1] = params[op._v2.split(".")[1]]
                                } else {                                
                                    params[op._v1] = op._v2
                                }
                            }
                        }

                    } else if (op._type === "remove") {
                        if (op._v1.startsWith("params.")) {
                            delete params[op._v1.split(".")[1]]
                        } else {
                            delete params[op._v1]
                        }
                    }

                }



            }
        }

    }


    /**
     * Main onFrame method
     * calls all the sub-modules onFrame methods (if implemented)
     */
    async onFrame(): Promise<void> {
        this._frame_number++
        Object.keys(this.#_modules).forEach(mod => {
            if (this.#_modules[mod].onFrame && typeof this.#_modules[mod].onFrame === 'function') {
                this.#_modules[mod].onFrame(this._frame_number)
            }
        })
        XData._o["frame-number"] = this._frame_number
        XData._o["fps"] = this.#fps_calc.calc()
        // _xlog.log("Frame: " + this._frame_number + " FPS: " + XData._o["fps"])





    }


    /**
     * Gets Xpell module by name
     * @param {string} moduleName - name of the loaded module
     * @returns {XModule}
     */
    getModule(moduleName: string): XModule {
        return this.#_modules[moduleName]
    }

    /**
     * Start Xpell engine for web browsers using requestAnimationFrame
     */
    start() {
        _xlog.log("Starting Xpell")
        this._interval = setInterval(() => { Xpell.onFrame() }, 1000 / this._fps)
    }

    /**
     * Stop Xpell engine
     */
    stop() {
        clearInterval(this._interval)
    }



}

/**
 * Xpell Engine instance
 * @public Xpell Engine instance
 */
export const Xpell = new XpellEngine()

export default Xpell



/**
 * Xpell - Real-Time User Interface Platform
 * Typescript Edition
 * Library Entry Point
 * 
 * @description Universal User Interface (UI) Engine for Javascript supporting devices & browsers
 * @author Fridman Fridman <fridman.tamir@gmail.com>
 * @since  22/07/2022
 * @Copyright Fridman Tamir 2022, all right reserved
 *
 *      This program is free software; you can redistribute it and/or
 *		modify it under the terms of the GNU General Public License
 *		as published by the Free Software Foundation; either version
 *		3 of the License, or (at your option) any later version.
 *
 */

export { Xpell as _x }
export { XUtils, XUtils as _xu } from "./XUtils.js"
export { XData, XData as _xd, type XDataObject, type XDataVariable, _XData } from "./XData.js"
export { XParser } from "./XParser.js"
export { XCommand, type XCommandData } from "./XCommand.js"
export { XLogger, XLogger as _xlog, _XLogger } from "./XLogger.js"
export {
    XModule,
    type XModuleData,
    // GenericModule
} from "./XModule.js"
export {
    XObject,
    XObjectPack,
    type IXData,
    type IXObjectData,
    type XDataXporterHandler,
    type XObjectData,
    type XObjectOnEventIndex,
    type XObjectOnEventHandler
} from "./XObject.js"
export { XObjectManager } from "./XObjectManager.js"
export { XEventManager, XEventManager as _xem, type XEventListener, type XEvent, type XEventListenerOptions, _XEventManager } from "./XEventManager.js"
export { type XNanoCommandPack, type XNanoCommand } from "./XNanoCommands.js"
export {Wormholes, WormholeEvents} from "./Wormholes.js"
