/**
 * Helpers for roles hierarchy
 */

/**
 * return true if the provided role name can be administered by the current user.
 */
UI.registerHelper('isAtLeastRoleInHierarchy', function (roleName) {
  if (!Meteor.user()) {
    return false; // not logged in.
  }
  var rolesICanAccess = Meteor.user().roles || [];

  if (RolesTree) {
    rolesICanAccess = _.union(rolesICanAccess, RolesTree.getAllMySubordinatesAsArray(Meteor.userId()));
  }
  return _.contains(rolesICanAccess, roleName); // return true if we can access the provided role name

});