

import Wormholes, { WormholeEvents } from "./Wormholes.js"
import { XCommand, XCommandData, XModule, XObject, XObjectPack, _x, _xem, _xd, XObjectData } from "./Xpell.js"
import { XModuleData } from "./Xpell.js"
//display Xpell engine info
_x._verbose = true





_x.start()



export class myMod extends XModule {

    constructor(data: XModuleData) {
        super(data)
    }    
    
    
    async _f1(xcmd:any){
        const a = parseInt (xcmd._params.a)
        const b =  parseInt(xcmd._params.b)
        return a+b
    }


    _f2(xcmd:XCommand){
        console.log("f2");
        
    }
}

const m = new myMod({_name:"my-mod"})

_x.loadModule(m)



// const res = await _x.execute({
//     _module:"my-mod",
//     _op:"f1",
//     _params:{
//         a:1,
//         b:2
//     }
// })

const res = await _x.execute({
    _module:"my-mod",
    _op:"f1",
    _params:{
        a:1,
        b:2
    }
})

// console.log(res);




const wormholeUrl = "ws://localhost:3030/"
const getEnvironmentNameMessage = {
    _module: "xenvironment",
    _op: "get-name"
}



const usetAuth = {
    _module: "user-manager",
    _op: "auth",
    _params: {
        email: "admin",
        password: "admin"
    }
}



_xem.on(WormholeEvents.WormholeOpen, async (data:any) => {
    console.log("connection acquired")
    
    const res = await Wormholes.sendSync(getEnvironmentNameMessage,true)
    console.log(res)
})

Wormholes.open(wormholeUrl)


// gm.importObjectPack(XObjectPack)

// const xobj: XObjectData = {
//     _type: "object",
//     _id: "my-x-obj",
//     _on_create: (x) => {
//         console.log(x._id + " Created")

//     },
//     _data_source: "my-data-source",
//     _on_data: (x, data) => {
//         console.log(data);

//         if (!x["_ds_cnt"]) x["_ds_cnt"] = 1
//         else x["_ds_cnt"]++

//         if (x["_ds_cnt"] > 3) {
//             x.emptyDataSource()
//             delete x["_ds_cnt"]
//             // setTimeout(()=>{
//             //     _xd._o["my-data-source"] = "i came back mother fuckers " + Date.now()
//             // },1000)
//         }

//     },
//     _on: {
//         "xem-test": (x, data) => {
//             console.log("event to " + x._id, data);
//         },
//     },
//     _once:{
//         "xem-shut": (x, data) => {
//             // gm.remove(x._id)
//             console.log("event one,shut to " + x._id, data);
//         }
//     },
//     _children: [
//         { _type: "object", id: "obj2" }
//     ]
// }
// const xo = gm.create(xobj)
// // console.log(xo.toXData());

// // const listener = _xem.once("xem-test",(xevent)=>{
// //     console.log("Event  " , xevent)
// // })


// // const listener2 = _xem.on("xem-test",(xevent)=>{
// //     console.log("listenre2   " , xevent)
// //     console.log("XData  " , _xd._o["my-var"],_xd._o["o1"]);

// // })



// // console.log("Listener id: " + listener);

// // _xem.removeListener(listener)
// // _xem.fire("xem-test","duck-off2")

// _xem.fire("xem-shut","duck-off")
// _xd._o["my-data-source"] = "inconceivable"
// _xem.fire("xem-test","duck-off2")