filteredUserQuery = function (userId, filter, rolesCriteria, profileFilterCriteria) {
  var queryCriteria = [];
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
  }
  // TODO: configurable limit and paginiation
  //var queryLimit = 25;
  if (!!filter) { // we have a filter
    // TODO: passing to regex directly could be dangerous
    var filterClause = {
      $or: [
        {'username': {$regex: filter, $options: 'i'}},
        {'profile.name': {$regex: filter, $options: 'i'}},
        {'emails.address': {$regex: filter, $options: 'i'}}
      ]
    };
    queryCriteria.push(filterClause);
  };

  // convert queryCriteria from array of clauses to the actual clause
  if (queryCriteria.length > 1) { // more than one, so "AND" the clauses together.
    queryCriteria = {$or: [{_id: userId},{$and: queryCriteria}]};
  } else if (queryCriteria.length === 1){
    // there's only one clause
    queryCriteria = {$or: [{_id: userId},queryCriteria[0]]};
  } else {
    queryCriteria = {};
  }

  //console.log("finding users with query criteria: " + JSON.stringify(queryCriteria));
  var users = Meteor.users.find(queryCriteria, {sort: {'profile.name': 1, 'username': 1, emails: 1}});
  return users;
};