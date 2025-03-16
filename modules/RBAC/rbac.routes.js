const { guard: can } = require('../../middlewares/guard.middleware');
const { createPermission, createRole, assignPermissionToRole, showRoles, showPermissions, assignRoleToUser, removePermissionFromRole } = require('./rbac.service');
const PERMISSIONS = require('../../common/constants/permissions.const');
const { createRolePermissionValidator, assignRemovePermissionToRoleValidator, assignRoleToUserValidator } = require('./rbac.validator');
const { validation } = require('../../middlewares/validation.middleware');

const router = require('express').Router();

router.post('/role', createRolePermissionValidator(), validation ,can(PERMISSIONS.ROLE_MANAGE), createRole)
router.get('/roles', showRoles)

router.post('/permission', createRolePermissionValidator(), validation ,can(PERMISSIONS.ROLE_MANAGE), createPermission)
router.get('/permissions', showPermissions)

router.post('/assignPermission', assignRemovePermissionToRoleValidator(), validation, can(PERMISSIONS.ROLE_MANAGE), assignPermissionToRole)
router.post('/removePermission', assignRemovePermissionToRoleValidator(), validation, can(PERMISSIONS.ROLE_MANAGE), removePermissionFromRole)

router.post('/assignRole', assignRoleToUserValidator(), validation, can(PERMISSIONS.ROLE_MANAGE), assignRoleToUser)


module.exports = {
    RbacRouter : router
}