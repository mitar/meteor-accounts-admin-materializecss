/**
 * Create a new role hierarchy
 * @param {object} jsTree - a tree structure matching the structure: <pre>{roleName:"foo",children[{roleName:"fooChild",children:[]}]}</pre>
 */
RolesHierarchy = function (jsTree) {
  this.roleName = jsTree.roleName;
  if (jsTree.subordinates) {
    var children = [];
    for (var thisChild in jsTree.subordinates) {
      if (jsTree.subordinates.hasOwnProperty(thisChild)) {
        children.push(new RolesHierarchy(jsTree.subordinates[thisChild]));
      }
    }
    this.subordinates = children;
  }
  this.defaultNewUserRoles = jsTree.defaultNewUserRoles;
  this.profileFilters = jsTree.profileFilters;
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
  if (this.subordinates) {
    for (var thisChild in this.subordinates) {
      if (this.subordinates.hasOwnProperty(thisChild)) {
        return this.subordinates[thisChild].findRoleInHierarchy(roleName);
      }
    }
  }
  return false;


};
/**
 * Return the subordinate role of the given seniorRoleName
 * @param {string} seniorRoleName - the name of the senior role
 * @param {string} subordinateRoleName - the name of the subordinate role
 * @returns {object} - the role of the subordinate, or false if not found.
 */
RolesHierarchy.prototype.getRoleSubordinate = function (seniorRoleName, subordinateRoleName) {
  // find the senior role in the hierarchy
  var seniorRole = this.findRoleInHierarchy(seniorRoleName);
  // see if the senior role has a subordinate matching the subordinate role
  return seniorRole.findRoleInHierarchy(subordinateRoleName);

};

/**
 * Get the names of subordinate roles as an array
 * @param {string} seniorRoleName - the name of the senior role
 * @returns {Array} - the subordinate roles if any.
 */
RolesHierarchy.prototype.getAllSubordinatesAsArray = function (seniorRoleName) {

  // find the senior role in the hierarchy
  var seniorRole = this.findRoleInHierarchy(seniorRoleName);

  var subordinateRoles = [];
  if (seniorRole.subordinates && seniorRole.subordinates.length > 0) {
    // add each subordinate's role name and it's subordinates' names.
    for (var thisRole in seniorRole.subordinates)
      if (seniorRole.subordinates.hasOwnProperty(thisRole)) {
        // add our subordinate's name
        subordinateRoles.push(seniorRole.subordinates[thisRole].roleName);
        // add our subordinate's subordinates' names.
        subordinateRoles.push(seniorRole.subordinates[thisRole].getAllSubordinatesAsArray(seniorRole.subordinates[thisRole].roleName));
      }
    subordinateRoles = _.flatten(subordinateRoles);
  }
  return subordinateRoles;
};

/**
 * Get an array of all of the role names that the current user can administer
 * @param myUserId the userID of the current user
 * @returns {Array} an array of role names that the current user can administer
 */
RolesHierarchy.prototype.getAllMySubordinatesAsArray = function (myUserId) {
  var rolesICanAdminister = [];

  var myUserObj;
  myUserObj = Meteor.users.findOne(myUserId);


  // I might have a few roles.
  if (myUserObj) {
    var myRoles = myUserObj.roles || [];
    // for each role I have, add the subordinate roles to the list of roles I can administer.
    for(var thisRole in myRoles) {
      if (myRoles.hasOwnProperty(thisRole)) {
        // add this role
        var thisRoleObjInHierarchy = this.findRoleInHierarchy(myRoles[thisRole]);
        if (thisRoleObjInHierarchy) {
          // add all of the subordinate role names from the hierarchy
          rolesICanAdminister = _.union(rolesICanAdminister, thisRoleObjInHierarchy.getAllSubordinatesAsArray(myRoles[thisRole]));
        } // role not in hierarchy. That's OK, but we don't know anything about it.
      }
    }
  }

  return rolesICanAdminister;
};

/**
 * returns true if the given userId can administer the given role.
 * @param userId meteor userId of the user we're checking
 * @param roleName
 */
RolesHierarchy.prototype.isUserCanAdministerRole = function(userId, roleName) {
  var allSubordinateRoles = RolesTree.getAllMySubordinatesAsArray(userId);
  return _.contains(allSubordinateRoles, roleName);
};

/**
 * returns true if the given adminId can administer the given userId.
 * @param adminId the meteor userId of the user we're checking
 * @param subordinateId the meteor userid of the subordinate to check
 */
RolesHierarchy.prototype.isUserCanAdministerUser= function(adminId, subordinateId) {
  var allAdminSubordinateRoles = RolesTree.getAllMySubordinatesAsArray(adminId);
  var subordinateUserRoles = [];
  var subordinateObj = Meteor.users.findOne(subordinateId);
  if (subordinateObj) {
    subordinateUserRoles = subordinateObj.roles;
  }

  for(var subordinateRoleIndex in subordinateUserRoles) {
    if (subordinateUserRoles.hasOwnProperty(subordinateRoleIndex)) {
      if (_.contains(allAdminSubordinateRoles, subordinateUserRoles[subordinateRoleIndex])) {
        return true;
      }
    }
  }

  return false;
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
