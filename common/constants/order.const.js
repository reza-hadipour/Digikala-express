const ORDER_STATUS = {
    PENDING: "pending",
    PAYED: "payed",
    IN_PROCESS: "inProcess",
    PACKET: "packet",
    SHIPPING: "shipping",
    DELIVERED: "delivered",
    CANCELED: "canceled",
    }

Object.freeze(ORDER_STATUS)

module.exports = ORDER_STATUS