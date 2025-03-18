const autoBind = require("auto-bind");
const ORDER_STATUS = require("../common/constants/order.const");

class FiniteStateMachine{
    #transitions;

    constructor(){
        autoBind(this);
        this.#transitions = this.#defineTransitions();
        Object.freeze(this.#transitions);
    }

    transition(currentState, event){
        if(event === ORDER_STATUS.CANCELED){
            const cancelTransition = this.#transitions[event].find((transition)=> transition.from === currentState)
            if(cancelTransition){
                return cancelTransition.to;
            }else{
                throw new Error(`Invalid cancel transition from ${currentState}`);
            }
        }else{
            const transition = this.#transitions[event];
            if(transition && transition.from === currentState){
                return transition.to;
            }else{
                throw new Error(`Invalid transition from ${currentState} with event ${event}`);
            }
        }
    }

    getNextState(currentState){
        return Object.values(this.#transitions).find((transition)=> transition.from === currentState)?.to;
    }

    #defineTransitions(){
        return {
            [ORDER_STATUS.PAYED] : {from: ORDER_STATUS.PENDING, to: ORDER_STATUS.PAYED},
            [ORDER_STATUS.IN_PROCESS] : {from: ORDER_STATUS.PAYED, to: ORDER_STATUS.IN_PROCESS},
            [ORDER_STATUS.PACKET] : {from: ORDER_STATUS.IN_PROCESS, to: ORDER_STATUS.PACKET },
            [ORDER_STATUS.SHIPPING] : {from: ORDER_STATUS.PACKET, to: ORDER_STATUS.SHIPPING },
            [ORDER_STATUS.DELIVERED] : {from: ORDER_STATUS.SHIPPING, to: ORDER_STATUS.DELIVERED },
            [ORDER_STATUS.CANCELED] : [
                {from: ORDER_STATUS.PAYED, to: ORDER_STATUS.CANCELED},
                {from: ORDER_STATUS.IN_PROCESS, to: ORDER_STATUS.CANCELED },
                {from: ORDER_STATUS.PACKET, to: ORDER_STATUS.CANCELED },
                {from: ORDER_STATUS.SHIPPING, to: ORDER_STATUS.CANCELED },
            ]
        }
    }
}

module.exports = new FiniteStateMachine();