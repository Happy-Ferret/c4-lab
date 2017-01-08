import SParse from 's-expression'
import md5 from 'md5'

// TODO: DEAR GOD TESTS
class Parser {

    constructor() {
        this.idMap = {}
        this.pathMap = {}
        this.edges = []
        this.items = []
    }

    parse(text) {
        const tokens = SParse('(' + text + ')')
        if (tokens instanceof SParse.SyntaxError) {
            throw tokens
        }
        this.buildIR(tokens)
        for (const e of this.edges) {
            this.postProcessEdge(e)
        }

        return {
            edges: this.edges,
            items: this.items,
            roots: this.items
                .filter(x => !x.parentId)
                .map(x => x.id),
            idMap: this.idMap,
            pathMap: this.pathMap
        }
    }

    buildIR(tokens, parent) {
        return tokens.map(x => this.buildIRNode(x, parent))
    }

    buildIRNode([type, ...rest], parent) {

        const node = type in this
            ? this[type](rest, parent)
            : this.item(rest, parent);

        if(/system|container/i.test(type)) node.canExpand = true

        return Object.assign(node, { type: type.toLowerCase() });
    }

    item([opts, ...children], parent) {
        const [name, ...kwargs] = opts
        const path = this.pathToNode(name, parent)
        const node = {
            name,
            id: md5(path),
            path
        }
        if(parent) node.parentId = parent.id
        this.idMap[node.id] = node
        this.pathMap[node.path] = node.id
        Object.assign(node, this.parseKeywordArgs(kwargs, /description|tech/))
        this.items.push(node)
        node.children = this.buildIR(children, node)
        return node;
    }

    edge(input, parent) {
        const edge = Object.assign(
            { sourceId: parent.id },
            this.parseKeywordArgs(input, /description|to|tech/))
        this.edges.push(edge)
        return edge
    }

    pathToNode(name, parent) {
        return parent
            ? this.idMap[parent.id].path + '/' + name
            : name
    }

    parseKeywordArgs(kwargs, allowed = /.*/) {
        if (kwargs.length === 0) return {};

        const [keyword, value, ...rest] = kwargs;
        const key = keyword.substring(1).toLowerCase();

        return Object.assign(
            allowed.test(key) ? { [key]: value } : {},
            this.parseKeywordArgs(rest, allowed));
    }

    postProcessEdge(edge) {
        edge.destinationId = this.pathMap[edge.to]
        edge.id = md5(edge.sourceId + edge.destinationId)
    }
}

export const parse = text => new Parser().parse(text)
export const SyntaxError = SParse.SyntaxError