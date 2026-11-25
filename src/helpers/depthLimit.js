const { GraphQLError, Kind } = require('graphql')

// Validation rule rejecting operations nested deeper than `max` selection levels
module.exports = function depthLimit(max) {
  return (context) => {
    const fragments = {}
    for (const def of context.getDocument().definitions) {
      if (def.kind === Kind.FRAGMENT_DEFINITION) fragments[def.name.value] = def
    }

    const depthOf = (selectionSet, depth, seen) => {
      if (!selectionSet) return depth
      let deepest = depth
      for (const sel of selectionSet.selections) {
        if (sel.kind === Kind.FIELD) {
          deepest = Math.max(deepest, sel.selectionSet ? depthOf(sel.selectionSet, depth + 1, seen) : depth)
        } else if (sel.kind === Kind.INLINE_FRAGMENT) {
          deepest = Math.max(deepest, depthOf(sel.selectionSet, depth, seen))
        } else if (sel.kind === Kind.FRAGMENT_SPREAD) {
          const name = sel.name.value
          if (seen.has(name) || !fragments[name]) continue
          deepest = Math.max(deepest, depthOf(fragments[name].selectionSet, depth, new Set([...seen, name])))
        }
      }
      return deepest
    }

    return {
      OperationDefinition(node) {
        const depth = depthOf(node.selectionSet, 1, new Set())
        if (depth > max) {
          context.reportError(new GraphQLError(`Query is too deep (${depth} levels, max ${max})`, { nodes: [node] }))
        }
      }
    }
  }
}
