/*! namespace 1.2.0 */
/**
*  Static class for namespacing objects and adding
*  classes to it.
*  @class namespace
*  @static
*/
(function(window){
	
	// The namespace function already exists
	if ("namespace" in window) return;
	
	/**
	*  Create the namespace and assing to the window
	*
	*  @example
		var SpriteUtils = function(){};
		namespace('springroll').SpriteUtils = SpriteUtils;
	*
	*  @constructor
	*  @method namespace
	*  @param {string} namespaceString Name space, for instance 'springroll.utils'
	*  @return {object} The namespace object attached to the current window
	*/
	window.namespace = function(namespaceString) {
		var parts = namespaceString.split('.'),
			parent = window,
			currentPart = '';

		for(var i = 0, length = parts.length; i < length; i++)
		{
			currentPart = parts[i];
			parent[currentPart] = parent[currentPart] || {};
			parent = parent[currentPart];
		}
		return parent;
	};
	
}(window));
/**
*  Used to include required classes by name
*  @class include
*  @static
*/
(function(window, undefined){
	
	// The include function already exists
	if ("include" in window) return;
	
	/**
	*  Import a class
	*
	*  @example
		var Application = include('cloudkid.Application');
	*
	*  @constructor
	*  @method include
	*  @param {string} namespaceString Name space, for instance 'cloudkid.Application'
	*  @param {Boolean} [required=true] If the class we're trying to include is required.
	* 		For classes that aren't found and are required, an error is thrown.
	*  @return {object|function} The object attached at the given namespace
	*/
	window.include = function(namespaceString, required)
	{
		var parts = namespaceString.split('.'),
			parent = window,
			currentPart = '';
		
		required = required !== undefined ? !!required : true;

		for(var i = 0, length = parts.length; i < length; i++)
		{
			currentPart = parts[i];
			if (!parent[currentPart])
			{
				if (!required)
				{
					return null;
				}
				if (true)
				{
					throw "Unable to include '" + namespaceString + "' because the code is not included or the class needs to loaded sooner.";
				}
				else
				{
					throw "Unable to include '" + namespaceString + "'";
				}
			}
			parent = parent[currentPart];
		}
		return parent;
	};
	
}(window));
/**
*  Use to do class inheritence
*  @class extend
*  @static
*/
(function(window){
	
	// The extend function already exists
	if ("extend" in window) return;

	/**
	*  Extend prototype
	*
	*  @example
		var p = extend(MyClass, ParentClass);
	*
	*  @constructor
	*  @method extend
	*  @param {function} subClass The reference to the class
	*  @param {function|String} superClass The parent reference or full classname
	*  @return {object} Reference to the subClass's prototype
	*/
	window.extend = function(subClass, superClass)
	{
		if (typeof superClass == "string")
		{
			superClass = window.include(superClass);
		}
		subClass.prototype = Object.create(
			superClass.prototype
		);
		return subClass.prototype;
	};

}(window));