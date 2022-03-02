module.exports = function (grunt) {
	"use strict";

	// Load grunt tasks automatically
	require("load-grunt-tasks")(grunt);

	// Project configuration.
	grunt.initConfig({
		config: {
			src: "src",
			dist: "dist",
		},

		pkg: require("./package"),

		meta: {
			banner:
				"/*\n" +
				" * <%= pkg.name %> - v<%= pkg.version %> | (c) <%= grunt.template.today('yyyy') %> | <%= pkg.license %> license\n" +
				" * Repository: <%= pkg.repository.url %>\n" +
				" * Description: <%= pkg.description %>\n" +
				" * Demo: <%= pkg.homepage %>\n" +
				" */\n",
		},

		// Watches files for changes and runs tasks based on the changed files
		watch: {
			concat: {
				files: "<%= config.src %>/{,*/}*.js",
				tasks: ["concat:dist", "uglify:dist"],
			},
		},

		// Prepend a banner to the files
		concat: {
			options: {
				banner: "<%= meta.banner %>",
			},
			dist: {
				src: "<%= config.src %>/<%= pkg.name %>.js",
				dest: "<%= config.dist %>/<%= pkg.name %>.js",
			},
		},

		// Generate a minified version
		uglify: {
			options: {
				banner: "<%= meta.banner %>",
			},
			dist: {
				src: ["<%= config.dist %>/<%= pkg.name %>.js"],
				dest: "<%= config.dist %>/<%= pkg.name %>.min.js",
			},
		},

		// Generate css files
		sass: {
			dist: {
				options: {
					outputStyle: "expanded",
				},
				files: {
					"<%= config.dist %>/<%= pkg.name %>-core.css": "<%= config.src %>/<%= pkg.name %>-core.scss",
				},
			},
		},

		// Increment version
		bump: {
			options: {
				files: ["package.json"],
				updateConfigs: ["pkg"],
				commitMessage: "released v%VERSION%",
				commitFiles: ["package.json", "dist"],
				createTag: false,
				push: false,
				pushTo: "origin master",
			},
		},
	});

	// Build task
	grunt.registerTask("build", ["sass:dist", "concat:dist", "uglify:dist"]);

	// Release task
	grunt.registerTask("release", ["bump-only", "build", "bump-commit"]);
};
