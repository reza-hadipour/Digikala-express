const PERMISSIONS = {
    PRODUCT_CREATE: 'product:create',
    PRODUCT_EDIT: 'product:edit',
    PRODUCT_REMOVE: 'product:remove',
    ORDER_MANAGE: 'order:manage',
    USER_MANAGE: 'user:manage',
    ROLE_MANAGE: 'role:manage'
}

Object.freeze(PERMISSIONS);

module.exports = PERMISSIONS;