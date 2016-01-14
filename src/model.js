var uuid = require('uuid'),
    _ = require('lodash');

module.exports = function() {
  var self = this;

  self.sources = sources;
  self.destinations = destinations;
  self.edges = edges;
  self.findItem = function(graph, id) { return byId(graph.items, id); };
  self.deleteItem = deleteItem;
  self.systems = _.partialRight(sources, 'system');
  self.children = function(graph, item) {
    return _.select(graph.items||[], 'parentId', item.id);
  };
  self.rootItems = function(graph) {
    return _.select(graph.items, function(item) { return !item.parentId; });
  };
  self.save = save;

  function save(graph, type, item) {
    graph.items = graph.items || [];
    graph.edges = graph.edges || [];

    var addTo = graph.edges;
    if(type && type !== 'connection'){
      addTo = graph.items;
      item.type = type;
    }
    else {
      item.sourceId = item.source.id;
      item.destinationId = item.destination.id;
      delete item.source;
      delete item.destination;
    }
    var result = findOrCreate(addTo, item);
    graph.lastModified = new Date();
    return result;
  }

  function sources(graph, type) {
    var items = graph.items || [];
    return type ? _.select(items, 'type', type) : items;
  }

  function deleteItem(graph, item) {
    if(item.type){
      graph.items = _.reject(graph.items || [], 'id', item.id);
      var edgesToDelete = edges(graph, item);
      graph.edges = (graph.edges || [])
        .filter(function(edge) { return !_.includes(edgesToDelete, edge); });
    }
    else{
      graph.edges = _.reject(graph.edges, 'id', item.id);
    }
    graph.lastModified = new Date();
  }

  function edges(graph, itemOrId) {
    var result = graph.edges || [],
        id = idFor(itemOrId);

    if(!id){ return result; }

    return result.filter(function(edge) {
      return edge.sourceId === id || edge.destinationId === id;
    });
  }

  var eligibleTypes = {
    actor: ['system'],
    system: ['system', 'actor']
  };

  function destinations(graph, sourceItemOrId) {
    if(!sourceItemOrId) return [];

    var item = itemFor(graph, sourceItemOrId),
        destTypes = eligibleTypes[item.type];

    return (graph.items || [])
      .filter(function(candidate) {
        return candidate.id !== item.id
          && _.includes(destTypes, candidate.type);
      });

    return _(graph.items || [])
      .filter('type', {type: destTypes})
      .reject('id', item.id)
      .value();
  }

  function findOrCreate(collection, item) {
    var match = byId(collection, item.id);
    if(match){
      return _.assign(match, item);
    }else{
      _.assign(item, { id: item.id || uuid.v4() });
      collection.push(item);
      return item;
    }
  }

  function byId(collection, itemOrId) {
    var id = idFor(itemOrId);
    return collection && id ? _.find(collection, 'id', id) : null;
  }

  function idFor(itemOrId) {
    return _.isString(itemOrId)
      ? itemOrId
      : (itemOrId && itemOrId.id);
  }

  function itemFor(graph, itemOrId) {
    return _.isString(itemOrId)
      ? byId(graph.items, itemOrId)
      : itemOrId;
  }
};
