var _ = require('lodash'),
    actorTemplate = require('./actorEditor.html'),
    systemTemplate = require('./systemEditor.html'),
    connectionTemplate = require('./connectionEditor.html'),
    containerTemplate = require('./containerEditor.html')
;

// @ngInject
module.exports = function($uibModal, model) {
  var self = this,
      modalSettings = {
        actor: makeSettings(actorTemplate),
        system: makeSettings(systemTemplate),
        connection: makeSettings(connectionTemplate, connectionConfig),
        container: makeSettings(containerTemplate, containerConfig)
      }
  ;

  self.openModal = openModal;

  function openModal(type, graph, item) {
    var settings = modalSettings[type || 'connection'];

    var modal = $uibModal.open({
      template: settings.template,
      controller: function() {
        var vm = this;
        vm.item = _.clone(item || {});
        vm.cancel = function() { modal.dismiss('cancel'); };
        vm.ok = function() { modal.close(vm.item); };
        if(settings.configFn) { settings.configFn(vm, graph, vm.item); }
      },
      controllerAs: 'vm'
    });
    return modal.result
      .then(model.save.bind(model, graph, type));
  }

  function containerConfig(vm, graph, item) {
    vm.systems = model.systems(graph);
    item.parent = model.findItem(graph, item.parentId);
  }

  function connectionConfig(vm, graph, item) {
    vm.sources = model.sources(graph);
    vm.destinations = model.destinations.bind(model, graph);
    vm.isDescriptionRequired = true;

    item.source = _.find(vm.sources, 'id', item.parentId)
      || _.find(vm.sources, 'id', item.sourceId);

    item.destination = model.findItem(graph, item.destinationId);

    vm.sourceName = function(source) {
      if(source.type) return source.name;

      return model.findItem(graph, source.sourceId).name + ' -> '
        + source.description + ' -> '
        + model.findItem(graph, source.destinationId).name;
    };
    vm.sourceSelected = function(source) {
      vm.isDescriptionRequired = !model.isConnection(source.type);
    };
  }

  function makeSettings(template, configFn) {
    return {template: template, configFn: configFn};
  }

};
