# Grunt Simple Version 

[![Dependency Status](https://david-dm.org/SpringRoll/grunt-simple-version.svg?style=flat)](https://david-dm.org/SpringRoll/grunt-simple-version) [![Build Status](https://travis-ci.org/SpringRoll/grunt-simple-version.svg)](https://travis-ci.org/SpringRoll/grunt-simple-version) [![npm version](https://badge.fury.io/js/grunt-simple-version.svg)](http://badge.fury.io/js/grunt-simple-version)

Easily update the version across your project. By default this updates the version field in **package.json**. Uses [Semantic Versioning](http://semver.org) format. 

## Requirements

* Install [Node JS](http://nodejs.org/)
* Install [Grunt](http://gruntjs.com/getting-started) `npm install -g grunt-cli`

## Tasks Setup

Sample **Gruntfile.js** below. The version can take an optional map of file names as the options for files to update (other than **package.json**). For updating JSON files, the value is the name of the field to change. For instance, in this example **bower.json** has a field called `version`.

```js
module.exports = function(grunt)
{
	grunt.loadNpmTasks('grunt-simple-version');

	grunt.initConfig({
		version: {
			options : {
				'bower.json' : 'version'
			}
		}
	});
};
```

## Tasks Setup Examples

### Nested-Field Update (JSON-only)

The target field property on a JSON file can also be nested using a dot-syntax style address. The example below would update a `version` field on a `meta` object.

```js
grunt.initConfig({
	version : {
		options : {
			'info.json' : 'meta.version'
		}
	}
});
```

### Cache-Busting Update (HTML-only)

Providing a value of `cache-bust` to an HTML file will append any src or CSS href properties with the version number. For instance, `<script src="main.js"></script>` would become `<script src="main.js?v=1.0.0"></script>`. This will help invalid the browser cache for linked assets.

```js
grunt.initConfig({
	version : {
		options : {
			'deploy/index.html' : 'cache-bust'
		}
	}
});
```

### Replacement Update

A replacement function can be used to replace the version in the contents of a file. The function takes two arguments, the contents of the file and the version number to update to. The function must return an update string with the contents of the file.

```js
grunt.initConfig({
	version : {
		options : {
			'deploy/index.html' : function(content, version) {
				return content.replace(
					/\<\!\-\- Version .* \-\-\>/,
					'<!-- Version ' + version + ' -->'
				);
			}
		}
	}
});
```

### Multiple Updates

The target field also supports multiple options (fields, nested-fields, functions, `cache-bust`) for a single file. The example below would update two fields in the JSON file with the version and do a dynamic function replacement. 

```js
grunt.initConfig({
	version : {
		options : {
			'project.json' : [
				'version', 
				'meta.version', 
				function(content, version){
					content.description = "Current build version " + version;			
				}
			]
		}
	}
});
```

## Usage

Ways to set the version across the project:

```bash
# Return the current version
grunt version:current

# Set a specific version
grunt version:1.0.0-rc

# Bump the patch version e.g., 1.0.1 => 1.0.2
grunt version:patch

# Bump the patch version e.g., 1.2.1 => 1.3.0
grunt version:minor

# Bump the patch version e.g., 1.3.0 => 2.0.0
grunt version:major
```
