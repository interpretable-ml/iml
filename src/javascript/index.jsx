import React from 'react';
import ReactDom from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import SimpleListVisualizer from './visualizers/SimpleListVisualizer';
import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

// Save some globals for the inline scripts to access
window.IML = {
  SimpleListVisualizer: SimpleListVisualizer,
  React: React,
  ReactDom: ReactDom
};
