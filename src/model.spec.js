var Model = require('./model'),
    _ = require('lodash'),
    exporter = require('./exporter/json'),
    sampleC4 = require('./exporter/c4-lab.json')
;


describe('model', function() {
  var model, graph, c4LabGraph;

  beforeEach(function() {
    model = new Model();
    graph = {};
    c4LabGraph = exporter.fromJson(sampleC4);
    c4LabGraph.github = model.findItem(c4LabGraph, '803dfe63-eb75-4720-8587-86313d48bed1');
    c4LabGraph.c4Lab = model.findItem(c4LabGraph, '10cffdf2-901e-4072-8150-a059a836967d');
    c4LabGraph.devs = model.findItem(c4LabGraph, 'b9815283-4bea-4124-afc7-018c347ea1a2');
    c4LabGraph.c4Lab.UI = model.findItem(c4LabGraph, '119c4954-fb15-4b65-ad79-2945425991a6');
  });

  describe('sources', function() {
    var actor, system;

    beforeEach(function() {
      actor = model.save(graph, 'actor', {});
      system = model.save(graph, 'system', {});
    });

    it('returns empty if no items or edges', function() {
      expect(model.sources({})).toEqual([]);
    });

    it('returns top-level actors and systems', function() {
      var r = model.sources(graph);
      expect(r.length).toBe(2);
    });

    it('ignore top level connections when there are no children', function() {
      model.save(graph, 'connection', {source: actor, destination: system});

      var r = model.sources(graph);
      expect(r.length).toBe(2);
    });

    it('includes top-level connections when children exist, but ignores the single child', function() {
      var conn = model.save(graph, 'connection', {source: actor, destination: system}),
          kid = model.save(graph, 'container', {parentId: system.id});

      var r = model.sources(graph);
      expect(r.length).toBe(3);
      expect(r).toContain(conn);
      expect(r).not.toContain(kid);
    });

    it('includes siblings', function() {
      var kid = model.save(graph, 'container', {parentId: system.id}),
          kid2 = model.save(graph, 'container', {parentId: system.id});

      var r = model.sources(graph);
      expect(r.length).toBe(4);
      expect(r).toContain(kid);
      expect(r).toContain(kid2);
    });
  });

  describe('save', function() {
    'actor system container component'.split(' ')
      .map(function(t) {
        it('handles `'+t+'` nodes', function() {
          var item = {name: 'whatever'};
          model.save(graph, t, item);
          expect(item.id).toBeDefined();
          expect(item.type).toBe(t);
          expect(graph.items[0]).toBe(item);
        });
      });

    it('handles connections', function() {
      var item = {
        name: 'whatever',
        source: {id:1, type:'system'},
        destination: {id: 2, type:'actor'}
      };

      model.save(graph, 'connection', item);

      expect(item.id).toBeDefined();
      expect(item.sourceId).toBeDefined();
      expect(item.destinationId).toBeDefined();
      expect(item.source).toBeUndefined();
      expect(item.destination).toBeUndefined();
      expect(graph.edges[0]).toBe(item);
    });

    it('assumes no type means connection', function() {
      var item = {name: 'whatever', source: {id:1}, destination: {id: 2}};

      model.save(graph, undefined, item);

      expect(graph.edges[0]).toBe(item);
    });

    it('updates an existing item by id', function() {
      var actor = {name: 'foo'};
      model.save(graph, 'actor', actor);
      var copy = _.clone(actor);
      copy.name += 'asdf';
      model.save(graph, 'actor', copy);
      expect(actor).toEqual(copy);
      expect(graph.items.length).toBe(1);
    });


  });

  it('finds children', function() {
    var system = {name: 'sys'};
    model.save(graph, 'system', system);
    var container = {name: 'foo', parentId: system.id};
    model.save(graph, 'container', container);

    expect(model.children(graph, system)).toEqual([container]);
  });

  describe('deleteItem', function() {
    it('removes the item', function() {
      var actor = {name: 'test'};
      model.save(graph, 'actor', actor);
      expect(graph.items.length).toBe(1);
      model.deleteItem(graph, actor);
      expect(graph.items.length).toBe(0);
    });

    it('updates lastModified', function() {
      var actor = {name: 'test'};
      model.save(graph, 'actor', actor);
      delete graph.lastModified;
      model.deleteItem(graph, actor);
      expect(graph.lastModified).toBeDefined();
    });

    it('removes related connections to a source', function() {
      model.deleteItem(c4LabGraph, c4LabGraph.devs);
      expect(c4LabGraph.edges.length).toBe(3);
    });

    it('removes related connections to a destination', function() {
      model.deleteItem(c4LabGraph, c4LabGraph.c4Lab);
      expect(c4LabGraph.edges.length).toBe(2);
    });

  });

  describe('destinations', function() {
    it('returns eligible items', function() {
      var dests = model.destinations(c4LabGraph, c4LabGraph.c4Lab.id);
      expect(dests.length).toBe(3);
      expect(_.pluck(dests, 'id')).not.toContain(c4LabGraph.c4Lab.id);
    });

    it('returns empty list with no input', function() {
      var dests = model.destinations(c4LabGraph, undefined);
      expect(dests.length).toBe(0);
    });

    it('restricts types, actor-to-system', function() {
      var dests = model.destinations(c4LabGraph, c4LabGraph.devs);
      expect(dests.length).toBe(3);
      var types = _(dests).pluck('type').uniq().value();
      expect(types).toEqual(['system']);
    });

    it('returns children if given a connection', function() {
      var conn = model.save(c4LabGraph,'connection',
                            {source:c4LabGraph.github, destination: c4LabGraph.c4Lab}),
          dests = model.destinations(c4LabGraph, conn);

      expect(dests).toEqual([c4LabGraph.c4Lab.UI]);
    });

    it('returns siblings if given a child', function() {
      var child = model.save(c4LabGraph, 'container', {parent: c4LabGraph.c4Lab }),
          dests = model.destinations(c4LabGraph, child);

      expect(dests.length).toBe(4);
      expect(dests).toContain(c4LabGraph.c4Lab.UI);
      expect(dests).not.toContain(c4LabGraph.c4Lab);
      expect(dests).not.toContain(child);
    });
  });

  describe('edges', function() {
    it('can find by id', function() {
      var edges = model.edges(c4LabGraph, c4LabGraph.github.id);
      expect(edges.length).toBe(3);
    });

    it('can find by item', function() {
      var edges = model.edges(c4LabGraph, c4LabGraph.github);
      expect(edges.length).toBe(3);
    });

    it('returns all if no criteria is passed', function() {
      var edges = model.edges(c4LabGraph);
      expect(edges).toBe(c4LabGraph.edges);
    });

  });
});
