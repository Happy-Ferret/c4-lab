var angular = require('angular'),
    util = require('../util'),
    moduleName = 'c4-lab.editors',
    component = util.component;
;

angular.module(moduleName, ['focus-if', 'ui.router'])
  .directive('c4LabItemEditor', component(require('./itemEditor.html'),
                                          require('./itemEditor.controller.js'),
                                         { item: '='}))
  .run(loadTemplates);

// @ngInject
function loadTemplates($templateCache) {
  $templateCache.put('connectionForm.html', require('./connectionForm.html'));
  $templateCache.put('actorForm.html', require('./actorForm.html'));
  $templateCache.put('systemForm.html', require('./systemForm.html'));
  $templateCache.put('containerForm.html', require('./containerForm.html'));
}

module.exports = moduleName;