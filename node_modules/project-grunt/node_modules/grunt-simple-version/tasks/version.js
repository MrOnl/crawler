module.exports = function(grunt)
{
	var _ = require('lodash'),
		path = require('path'),
		fs = require('fs'),
		semver = require('semver');

	grunt.registerTask('version', 'Change the current project version', function(n){

		var files = this.options(),
			packageFile = 'package.json',
			packageData = {},
			current = '0.0.1';


		if (fs.existsSync(packageFile))
		{
			packageData = grunt.file.readJSON(packageFile);
			if (!packageData.version)
			{
				grunt.fail.warn('package.json must contain a "version" key');
				packageData.version = current; // set default
			}
			current = packageData.version;
		}
		else
		{
			packageData.version = current;
			writeJSON(packageFile, packageData);
		}

		if (!n)
		{
			grunt.log.ok("Current version: " + current);
			grunt.fail.fatal("Attempting to change the version number, needs " + 
				"to be the semantic versioning number (e.g. 1.0.0) or either " +
				"major, minor or patch.");
		}

		// Valid types of preleases
		var types = ['major', 'minor', 'patch'];

		// The version to set to
		var version;

		// For semver format, replace the version
		if (n === "current")
		{
			grunt.log.ok('Current version: ' + current);
			return;
		}
		else if (semver.valid(n))
		{
			if (n == current)
			{
				grunt.fail.warn("Supplied version the same as the current version");
			}
			version = n;
		}
		else if (types.indexOf(n) > -1)
		{
			version = semver.inc(current, n);
		}
		else
		{
			grunt.fail.fatal("Argument on version task is not valid");
		}

		if (!semver.lt(current, version))
		{
			grunt.fail.warn("Attempting to revert to a lesser version (from " +
				current + " to " + version + ")");
		}

		grunt.log.ok("Version updated to " + version);

		packageData.version = version;
		writeJSON(packageFile, packageData);

		_.each(files, function(selection, filename){

			var filePath = path.resolve(process.cwd(), filename);

			if (!fs.existsSync(filePath))
			{
				grunt.fail.warn("The file to version '" + filename + "' doesn't exist");
				return;
			}
			updateVersion(filename, filePath, selection, version);
		});
	});

	/**
	*  Update a version for a given file
	*  @method  updateVersion
	*  @private
	*  @param {string} file The name of the file to change
	*  @param  {string} filePath  The full path to the file
	*  @param  {*} selection Either string or function to do the replacement
	*  @param {string} version The current version number
	*/
	function updateVersion(file, filePath, selection, version)
	{
		var data;
		var isJSON = /\.json$/i;

		// Recursive to do multiple selections/replacements 
		if (Array.isArray(selection))
		{
			_.each(selection, function(select){
				updateVersion(file, filePath, select, version);
			});
			return;
		}

		// Convenience method for doing href and src replacements
		if (selection === 'cache-bust')
		{
			selection = cacheBust;
		}

		// The name of the json file property
		if (_.isString(selection))
		{
			if (!isJSON.test(filePath))
			{
				grunt.fail.warn("Attempting to update a version on a non-JSON file");
				return;
			}
			data = grunt.file.readJSON(filePath);

			var parent = data;
			var children = selection.split('.');
			var lastIndex = children.length - 1;
			for(var i = 0, part; i < lastIndex; i++)
			{
				child = children[i];
				if (!parent[child])
				{
					parent[child] = {};
				}
				parent = parent[child];
			}
			parent[children[lastIndex]] = version;
			writeJSON(filePath, data);
			grunt.log.ok('Updated version in ' + file);
		}
		// Substitution plugin
		else if (_.isFunction(selection))
		{
			if (isJSON.test(file))
			{
				// function with json
				data = selection(grunt.file.readJSON(filePath), version);
				writeJSON(filePath, data);
			}
			else
			{
				// Format a file
				data = grunt.file.read(filePath);
				data = selection(data, version);
				grunt.file.write(filePath, data);
			}
			grunt.log.ok('Updated version in ' + file);
		}
		else
		{
			grunt.fail.warn("Cannot version with selection " + selection);
		}
	}

	/**
	*  Convenience method for updating src and CSS's href with
	*  the cache busting "?v=*.*.*" query string
	*  @method  cacheBust
	*  @private
	*  @param  {string} contents The contents of the file
	*  @param  {string} version  The current version
	*  @return {string}          The updated string
	*/
	function cacheBust(contents, version)
	{
		return contents.replace(
				/src\=(\"|\')([^\?\n\r\"\']+)(\?v\=[a-z0-9\.\-]*)?(\"|\')/ig, 
				'src="$2?v='+version+'"'
			)
			.replace(
				/href\=(\"|\')([^\?\n\r\"\']+\.css)(\?v\=[a-z0-9\.\-]*)?(\"|\')/ig, 
				'href="$2?v='+version+'"'
			);
	}

	/**
	*  Write JSON to a local project file
	*  @method  writeJSON
	*  @private
	*  @param  {string} file Local project file
	*  @param  {object} data The javascript object
	*/
	function writeJSON(file, data)
	{
		grunt.file.write(file, JSON.stringify(data, null, "\t"));
	}
};