'use strict';

var React = require('react'),
    App = require('./app');

// No delay on clicks. https://www.npmjs.com/package/react-tap-event-plugin
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

React.render(<App />, document.body);
