Package.describe({
	summary: "A fork of cunneen:accounts-admin-materializecss to manage students",
  version: "0.2.16"
});

Package.on_use(function (api, where) {
  api.versionsFrom("METEOR@0.9.0");
	api.use('standard-app-packages', ['client', 'server']);
	api.use("alanning:roles@1.2.8", ['client', 'server']);

  api.add_files('libs/role_hierarchy.js', ['client', 'server']);
	api.add_files('libs/user_query.js', ['client', 'server']);

	api.add_files('client/startup.js', 'client');
  api.add_files('client/roles_hierarchy_helpers.js', 'client');
	api.add_files('client/accounts_admin.html', 'client');
	api.add_files('client/accounts_admin.js', 'client');
	api.add_files('client/delete_account_modal.html', 'client');
	api.add_files('client/delete_account_modal.js', 'client');
	api.add_files('client/info_account_modal.html', 'client');
	api.add_files('client/info_account_modal.js', 'client');
	api.add_files('client/update_account_modal.html', 'client');
	api.add_files('client/update_account_modal.js', 'client');
	api.add_files('client/update_roles_modal.html', 'client');
	api.add_files('client/update_roles_modal.js', 'client');

	api.add_files('style/style.css', 'client');

	api.add_files('server/startup.js', 'server');
	api.add_files('server/publish.js', 'server');
	api.add_files('server/methods.js', 'server');
  api.export('RolesTree', ['client', 'server']);
});
