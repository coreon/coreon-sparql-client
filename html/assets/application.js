// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better
// to create separate JavaScript files as needed.
//
//= require lib/require
//= require_self

requirejs.config({ //this initiates the configuration
    paths: {
        jquery: 'assets/lib/jquery-2.2.0.min',
        underscore: 'assets/lib/underscore',
        bootstrap: 'assets/lib/bootstrap',
        "mdc":"https://unpkg.com/material-components-web@5.1.0/dist/material-components-web.min",
        "elg/common": "assets/elg/common",
        // use sample-fetcher from gui-ie to support samples in S3 storage
        "elg/sample-fetcher": "/dev/gui-ie/assets/elg/sample-fetcher",
    }
});


