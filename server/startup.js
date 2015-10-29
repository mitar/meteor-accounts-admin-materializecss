Meteor.startup(function() {
	// create an admin role if it doesn't exist
	if (Meteor.roles.find({name: 'admin'}).count() < 1 ) {
    console.log("creating admin role");
		Roles.createRole('admin');
	}
  if (RolesTree) {
    var subordinateRoles = RolesTree.getAllSubordinatesAsArray("admin");
    _.each(subordinateRoles, function(thisRole) {
      if (Meteor.roles.find({name: thisRole}).count() < 1 ) {
        console.log("creating " + thisRole + " role");
        Roles.createRole(thisRole);
      }
    })
  }
});