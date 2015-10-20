(function(){

	// Import classes
	var NodeWebkitApp = include('cloudkid.NodeWebkitApp');

	/**
	*  Node Webkit Application
	*  @class ULFC
	*  @extends cloudkid.NodeWebkitApp
	*/
	var ULFC = function()
	{
		NodeWebkitApp.call(this);

		if (APP)
		{
			// Create the standard OSX menu
			if (process.platform === "darwin")
			{	
				var gui = require('nw.gui');
				var menu = new gui.Menu({ type: 'menubar' });
				menu.createMacBuiltin("ULFC");
				gui.Window.get().menu = menu;
			}
		}

		// Show the window
		this.main.show();
	};

	// Reference to the prototype
	var p = extend(ULFC, NodeWebkitApp);

	/**
	*  Called when the application is quit. Should do any cleanup here to be safe.
	*  @method close
	*/
	p.close = function()
	{
	};

	// Create the application
	$(function(){ window.app = new ULFC(); });

}());
