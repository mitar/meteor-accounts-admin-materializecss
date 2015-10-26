/**
 * Create a new role hierarchy
 * @param {object} jsTree - a tree structure matching the structure: <pre>{roleName:"foo",children[{roleName:"fooChild",children:[]}]}</pre>
 */
RolesHierarchy = function (jsTree) {
  this.roleName = jsTree.roleName;
  if (jsTree.subordinates) {
    var children = [];
    _.each(jsTree.subordinates, function (thisChild) {
      children.push(new RolesHierarchy(thisChild));
    });
    this.subordinates = children;
  }
};
/**
 * Find a role in the hierarchy by name
 * @param {string} roleName - the name of the role to find
 * @returns {*} -
 */
RolesHierarchy.prototype.findRoleInHierarchy = function (roleName) {
  // is it this one?
  if (this.roleName === roleName) {
    return this;
  }
  // is it one of the immediate children of this one?
  return _.find(this.subordinates, function (thisChild) {
    return thisChild.findRoleInHierarchy(roleName);
  });

};
/**
 * Return true if the senior role has a subordinate role of the given subordinateRoleName
 * @param {string} seniorRoleName - the name of the senior role
 * @param {string} subordinateRoleName - the name of the subordinate role
 * @returns {object} - the role of the subordinate, or false if not found.
 */
RolesHierarchy.prototype.getRoleSubordinate = function (seniorRoleName, subordinateRoleName) {
  // find the senior role in the hierarchy
  var seniorRole = this.findRoleInHierarchy(seniorRoleName);
  // see if the senior role has a subordinate matching the subordinate role
  var subordinateRole = seniorRole.findRoleInHierarchy(subordinateRoleName);
  return subordinateRole;

};

/**
 * Get the names of subordinate roles as an array
 * @param {string} seniorRoleName - the name of the senior role
 * @returns {array} - the subordinate roles if any.
 */
RolesHierarchy.prototype.getAllSubordinatesAsArray = function (seniorRoleName) {

  // find the senior role in the hierarchy
  var seniorRole = this.findRoleInHierarchy(seniorRoleName);

  var subordinateRoles = [];
  if (seniorRole.subordinates && seniorRole.subordinates.length > 0) {
    // add each subordinate's role name and it's subordinates' names.
    _.each(seniorRole.subordinates, function(thisRole) {
      subordinateRoles.push(thisRole.roleName);

      subordinateRoles.push(thisRole.getAllSubordinatesAsArray(thisRole.roleName));
    });
    subordinateRoles = _.flatten(subordinateRoles);
  }
  return subordinateRoles;
};



// client and server
// if roles hierarchy is defined
if (Meteor.settings &&
  Meteor.settings.public &&
  Meteor.settings.public.accountsAdmin &&
  Meteor.settings.public.accountsAdmin.rolesHierarchy) {

  // build our roles
  RolesTree = new RolesHierarchy(Meteor.settings.public.accountsAdmin.rolesHierarchy);
}
