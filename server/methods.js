Meteor.methods({
	deleteUser: function(userId) {
		check(userId, String);

		var user = Meteor.user();
    if (RolesTree) {
      if (!user || (!Roles.userIsInRole(user, ['admin']) && !RolesTree.isUserCanAdministerUser(user._id,userId))) {
        throw new Meteor.Error(401, "You don't have privileges to delete user.");
      }
    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to delete a user.");
    }
		if (user._id == userId)
			throw new Meteor.Error(422, 'You can\'t delete yourself.');

		// remove the user
		Meteor.users.remove(userId);
	},

	addUserRole: function(userId, role) {
		check(userId, String);
		check(role, String);

		var user = Meteor.user();
    if (RolesTree) {
      if (!user || (!Roles.userIsInRole(user, ['admin']) && !RolesTree.isUserCanAdministerRole(user._id, role))) {
        throw new Meteor.Error(401, "You don't have privileges to assign role " + role + " to users.");
      }
    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to update a user.");
    }
		if (user._id == userId)
			throw new Meteor.Error(422, 'You can\'t update yourself.');

		// handle invalid role
		if (Meteor.roles.find({name: role}).count() < 1 )
			throw new Meteor.Error(422, 'Role ' + role + ' does not exist.');

		// handle user already has role
		if (Roles.userIsInRole(userId, role))
			throw new Meteor.Error(422, 'Account already has the role ' + role);

		// add the user to the role
		Roles.addUsersToRoles(userId, role);
	},

	removeUserRole: function(userId, role) {
		check(userId, String);
		check(role, String);

		var user = Meteor.user();
    if (RolesTree) {
      if (!user || (!RolesTree.isUserCanAdministerRole(user._id, role) && !Roles.userIsInRole(user, ['admin'])) ) {
        throw new Meteor.Error(401, "You don't have privileges to remove role " + role + " from users.");
      }

      // If we *do* remove this role from this user, will they still exist in the hierarchy that we can administer?
      var remainingRoles = _.without(Roles.getRolesForUser(userId), role);

      // is there one role remaining that we can administer? We don't want the user to "disappear" from our hierarchy
      var oneRemaining = _.find(remainingRoles, function (remainingRole) {
        return RolesTree.isUserCanAdministerRole(user._id, remainingRole);
      });

      if (!oneRemaining) {
        throw new Meteor.Error('last-manageable-role', "Last Manageable Role","Add another role before removing " + role + " from this user.");
      }

    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to update a user.");
    }
		if (user._id == userId)
			throw new Meteor.Error(422, 'You can\'t update yourself.');

		// handle invalid role
		if (Meteor.roles.find({name: role}).count() < 1 )
			throw new Meteor.Error(422, 'Role ' + role + ' does not exist.');

		// handle user already has role
		if (!Roles.userIsInRole(userId, role))
			throw new Meteor.Error(422, 'Account does not have the role ' + role);

		Roles.removeUsersFromRoles(userId, role);
	},

	addRole: function(role) {
		check(role, String);

		var user = Meteor.user();
		if (!user || !Roles.userIsInRole(user, ['admin']))
			throw new Meteor.Error(401, "You need to be an admin to add a role.");

		// handle existing role
		if (Meteor.roles.find({name: role}).count() > 0 )
			throw new Meteor.Error(422, 'Role ' + role + ' already exists.');

		Roles.createRole(role);
	},

	removeRole: function(role) {
		check(role, String);

		var user = Meteor.user();
		if (!user || !Roles.userIsInRole(user, ['admin']))
			throw new Meteor.Error(401, "You need to be an admin to remove a role.");

		// handle non-existing role
		if (Meteor.roles.find({name: role}).count() < 1 )
			throw new Meteor.Error(422, 'Role ' + role + ' does not exist.');

		if (role === 'admin')
			throw new Meteor.Error(422, 'Cannot delete role admin');

		// remove the role from all users who currently have the role
		// if successfull remove the role
		Meteor.users.update(
			{roles: role },
			{$pull: {roles: role }},
			{multi: true},
			function(error) {
				if (error) {
					throw new Meteor.Error(422, error);
				} else {
					Roles.deleteRole(role);
				}
			}
		);
	},

	updateUserInfo: function(id, property, value) {
		check(id, String);
		check(property, String);
		check(value, String);

		var user = Meteor.user();
    if (!user || (!RolesTree.isUserCanAdministerUser(user._id,id) && !Roles.userIsInRole(user, ['admin']))) {
      throw new Meteor.Error(401, "You don't have privileges to update this user.");
    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to update a user.");
    }
		if (property !== 'profile.name')
			throw new Meteor.Error(422, "Only 'name' is supported.");

		obj = {};
		obj[property] = value;
		Meteor.users.update({_id: id}, {$set: obj});

	}
});