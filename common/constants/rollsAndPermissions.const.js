const PERMISSIONS = Object.freeze({
    PRODUCT_CREATE: 'product:create',
    PRODUCT_EDIT: 'product:edit',
    PRODUCT_REMOVE: 'product:remove',
    ORDER_MANAGE: 'order:manage',
    ORDER_VIEW: 'order:view',
    ORDER_CUSTOMER: 'order:customer',
    USER_MANAGE: 'user:manage',
    ROLE_MANAGE: 'role:manage',
    PACKET_MANAGE: 'packet:manage',
    SHIPPING_MANAGE: 'shipping:manage',
    DELIVERY_MANAGE: 'delivery:manage'
})


const ROLES = Object.freeze({
    ADMIN: 'Admin',
    PRODUCT_MANAGER: 'Product Manager',
    ORDER_MANAGER: 'Order Manager',
    USER_MANAGER: 'User Manager',
    CUSTOMER: 'Customer',
    PACKET_MANAGER: 'Packet Manager',
    SHIPPING_MANAGER: 'Shipping Manager',
    DELIVERY_MANAGER: 'Delivery Manager'
});

module.exports = {
    PERMISSIONS,
    ROLES
}