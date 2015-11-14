/**
 * Filter the Meteor.users that this user can see. All criteria is "AND"-ed together.
 * @param {string} userId - the ID of the current user for whom to publish the data
 * @param {string} searchFilterString - string (e.g. from Session) that gets OR-ed to other criteria to search on username, profile.name and emails.
 * @param {object} searchFilterObject - object (e.g. from Session) that gets OR-ed to other criteria for custom search.
 * @param {object} fields - projection object i.e. the set of fields from Meteor.user to publish.
 * @param {array} rolesCriteria - an array of roles (strings), to filter by Meteor.user.roles
 * @param {object} profileFilterCriteria - object with fixed query criteria e.g. to filter users based on profile properties
 * @returns {*} - the MongoDB cursor for matching users
 */
filteredUserQuery = function (userId, searchFilterString, searchFilterObject, fields, rolesCriteria, profileFilterCriteria) {
  var queryCriteria = [];
  fields = fields || {
      "_id":1,
      "username": 1,
      "profile.name": 1,
      "roles": 1,
      "emails": 1
  };
  if (!RolesTree) {
    // if not an admin user don't show any other user
    if (!Roles.userIsInRole(userId, ['admin']))
      return Meteor.users.find(userId);
  } else {
    // add the roles clause
    if (rolesCriteria) {
      queryCriteria.push(rolesCriteria);
    }
    // add the profile clause
    if (profileFilterCriteria) {
      queryCriteria.push(profileFilterCriteria);
    }
    // add the custom criteria
    if (searchFilterObject) {
      queryCriteria.push(searchFilterObject)
    }
  }
  // TODO: configurable limit and paginiation
  //var queryLimit = 25;
  if (!!searchFilterString) { // we have a filter
    // TODO: passing to regex directly could be dangerous
    var filterClause = {
      $or: [
        {'username': {$regex: searchFilterString, $options: 'i'}},
        {'profile.name': {$regex: searchFilterString, $options: 'i'}},
        {'emails.address': {$regex: searchFilterString, $options: 'i'}}
      ]
    };
    queryCriteria.push(filterClause);
  };

  // convert queryCriteria from array of clauses to the actual clause
  if (queryCriteria.length > 1) { // more than one, so "AND" the clauses together.
    queryCriteria = {$or: [{_id: userId},{$and: queryCriteria}]}; // I can see myself.
  } else if (queryCriteria.length === 1){
    // there's only one clause
    queryCriteria = {$or: [{_id: userId},queryCriteria[0]]}; // I can see myself.
  } else {
    queryCriteria = {}; // there's no criteria.
  }

  //console.log(" ============ finding users with query criteria: " + JSON.stringify(queryCriteria) + "; fields:  " + JSON.stringify(fields));
  var users = Meteor.users.find(queryCriteria, {sort: {'profile.name': 1, 'username': 1, emails: 1},
    fields: fields
  });

  //console.log(" ============ found users: ===============");
  //console.log(JSON.stringify(users.fetch()));
  return users;
};

/**
 * Copy the given user's profile properties (as specified in RolesTree) as query criteria.
 * @param {object} meteorUser - the user whose profile to copy
 * @param {object} profileFilterCriteria - existing profileFilterCriteria. Note that if any properties are already specified, they may
 *  get overwritten.
 * @returns {*} the query criteria to ensure only users with the same profile property values will be returned.
 */
copyProfileCriteriaFromUser = function(meteorUser, profileFilterCriteria) {
  if (meteorUser && RolesTree) {
    var rolesArray = Roles.getRolesForUser(meteorUser._id);
    for (var roleIndex in rolesArray) {
      if (meteorUser.profile && rolesArray.hasOwnProperty(roleIndex)) {
        // find this role in the hierarchy
        var thisRole = RolesTree.findRoleInHierarchy(rolesArray[roleIndex]);
        // copy the profile filters
        if (thisRole && thisRole.profileFilters) { // it might not be in our hierarchy

          // loop through the profile filters (if any)
          for (var filterIndex in thisRole.profileFilters) {
            if (thisRole.profileFilters.hasOwnProperty(filterIndex)) {
              var thisProfileFilter = thisRole.profileFilters[filterIndex];
              // a profile filter is an array of property names to copy from the user's profile
              if (meteorUser.profile.hasOwnProperty(thisProfileFilter)) {
                // OK let's copy it to our criteria
                profileFilterCriteria = profileFilterCriteria || {}; // initialize if needed.
                profileFilterCriteria["profile." + thisProfileFilter] = meteorUser.profile[thisProfileFilter];
              }
            }
          }
        }
      }
    }
  }
  return profileFilterCriteria;
};