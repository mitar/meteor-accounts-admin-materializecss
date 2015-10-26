# Accounts Admin UI (MaterializeCSS)

A roles based account management system using [materialize css](http://materializecss.com/) for Meteor.

This is a fork of the [Bootstrap version](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3).

## Screenshots

List users:
![list users](https://cloud.githubusercontent.com/assets/1751645/10537096/33cee48c-7422-11e5-9384-e0267e496335.png)

Update users:
![update user](https://cloud.githubusercontent.com/assets/1751645/10537097/33cf7d84-7422-11e5-90c9-31c92099e71c.png)

New role:
![new role](https://cloud.githubusercontent.com/assets/1751645/10537095/33cc7ec2-7422-11e5-91c4-a35c8a2b7052.png)

**Table of Contents**

- [TODO](#todo)
- [History](#history)
- [Quick Start](#quick-start)
- [Iron Router Integration](#iron-router-integration)
- [Roles Hierarchy](#roles-hierarchy)
- [Contributing](#contributing)

## TODO

- ~~Implement UI to create/remove roles (currently done at Meteor.startup)~~ DONE
- Configurable fields
- Implement pagination (currently relies on search to find users)
- Write tests
- User impersonation (for admins)

## History

**Latest Version:** 0.2.11
- Add Roles hierarchy functionality.

**Latest Version:** 0.2.10
- sort by name, username and then email.
- add display of username

**Version:** 0.2.9
- Use event handlers to trigger modals, rather than a single event binding (which prevented modals being triggered for newly-inserted DOM elements)

**Version:** 0.2.8
- Update readme with screenshots
- Fix minor UI bug with placeholder overlapping username

**Version:** 0.2.7
- materializecss port (forked from upstream here)
- meteor 0.9.0 package format updates

**Version:** 0.2.6
- Remove hard dependency to bootstrap-3 (so less-bootstrap-3 or similar can be used). (Thanks to [@johnm](https://github.com/johnm))
- Documentation updates
- Fixes [Issue #18](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3/issues/18)

**Version:** 0.2.5

- Bump roles version; v1.2.8 is Blaze-compatible (thanks to [@alanning](https://github.com/alanning)!)

**Version:** 0.2.4

- Support [changes made in Meteor 0.8.0-rc0](https://github.com/meteor/meteor/issues/1930)
- Fixes [Issue #7](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3/issues/7)
- Update to bootstrap-3.1.1

**Version:** 0.2.3

- Now supports changing usernames from admin interface (thanks to [@djkmiles](https://github.com/djkmiles)!)

**Version:** 0.2.2

- Fixed bugs due to fallout from removing bootstrap-modal

**Version:** 0.2.1

- Removed dependency to bootstrap-modal

**Version:** 0.2.0

- Added UI to create/remove roles

**Version:** 0.1.0

- Created a basic UI to find users, delete users, and modify roles.

## Quick Start

Set up a simple admin page

```sh
$ mrt create app
$ cd app
$ mrt add bootstrap-3		# or mrt add less-bootstrap-3
$ mrt add accounts-password
$ mrt add roles
$ mrt add accounts-ui-bootstrap-3
$ mrt add accounts-admin-ui-bootstrap-3
$ mrt remove autopublish
$ mrt remove insecure
```

**app.js**
```javascript
if (Meteor.isServer) {
	Meteor.startup(function () {
		// bootstrap the admin user if they exist -- You'll be replacing the id later
		if (Meteor.users.findOne("your_admin_user_id"))
			Roles.addUsersToRoles("your_admin_user_id", ['admin']);

		// create a couple of roles if they don't already exist (THESE ARE NOT NEEDED -- just for the demo)
		if(!Meteor.roles.findOne({name: "secret"}))
            Roles.createRole("secret");

        if(!Meteor.roles.findOne({name: "double-secret"}))
            Roles.createRole("double-secret");
	});
}

if (Meteor.isClient) {
	Template.adminTemplate.helpers({
		// check if user is an admin
		isAdminUser: function() {
			return Roles.userIsInRole(Meteor.user(), ['admin']);
		}
	})
}
```

**app.html**
```html
<head>
  <title>Accounts Admin</title>
</head>

<body>
	<div class="navbar navbar-default" role="navigation">
        <div class="navbar-header">
            <div class="navbar-header">
                <a class="navbar-brand" href="/">Accounts Admin</a>
            </div>
        </div>
        <div class="navbar-collapse collapse">
            <ul class="nav navbar-nav">  
            </ul>
            <ul class="nav navbar-nav navbar-right">
            {{> loginButtons }}
            </ul>
        </div>
    </div>
    <div class="container">
		{{> adminTemplate}}
	</div>
</body>

<template name="adminTemplate">
	{{#if isAdminUser}}
		{{> accountsAdmin}}
	{{else}}
		Must be admin to see this...
	{{/if}}
</template>
```

After you edit app.js and app.html you need to create a new user and then set the 'admin' role to that user.

1. Go to [http://localhost:3000](http://localhost:3000) and click on the "Sign In / Up" and create your user there.
2. In the browser console grab the user id from the user you just created Meteor.userId()
3. Copy the user id and paste it into to "your_admin_user_id" in app.js created above.
4. Restart meteor 

At this point you should see the UI.  Signout and add a few more users so you can play with the roles. You can add and 
remove roles all through the UI.

## Iron Router Integration

This tool plays nice with Iron Router package, add to following configuration to your router.
Or take a look at this [working example](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3-demo).

**router.js**
```javascript
Router.configure({
	layoutTemplate: 'layout'
});

Router.map(function() {
	this.route('home', {
		path: '/',
		template: 'home'
	});

	this.route('admin', {
		path:'/admin',
		template: 'accountsAdmin',
		onBeforeAction: function() {
			if (Meteor.loggingIn()) {
                this.render(this.loadingTemplate);
            } else if(!Roles.userIsInRole(Meteor.user(), ['admin'])) {
                console.log('redirecting');
                this.redirect('/');
            }
		}
	});
});
```

## Roles Hierarchy

In your settings.json, you can define a hierarchy of roles:

```json
{
  "public": {
    "accountsAdmin" : {
      "rolesHierarchy": {
        "roleName": "admin",
        "subordinates": [
          {
            "roleName": "user-admin",
            "subordinates": [
              {
                "roleName": "teacher",
                "subordinates": [
                  {"roleName": "student"}
                ]
              }
            ]}
        ]
      }
    }
  }
}
```

A global object, RolesTree, allows you to query the hierarchy. E.g.

```js
if (RolesTree.getRoleSubordinate("admin","student")) {
  console.log("admin has a student subordinate");
}

// ["user-admin","teacher","student"]
console.log(JSON.stringify(RolesTree.getAllSubordinatesAsArray("admin")));
```

## Contributing

If you've got a change you think would benefit the community send me a pull request.

**Contributors**
- [@djkmiles](https://github.com/djkmiles)
- [@alanning](https://github.com/alanning)
- [@johnm](https://github.com/johnm)