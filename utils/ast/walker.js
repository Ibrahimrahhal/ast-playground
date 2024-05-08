module.exports = function walker(root, nodeType, stopLevel, currentLevel = 0) {
  const nodes = [];

  let typeToCheckAgainst =
    nodeType instanceof Array
      ? nodeType
      : nodeType instanceof Object
        ? Object.values(nodeType)
        : [nodeType];

  if (typeToCheckAgainst.includes(root.type)) {
    nodes.push(root);
  }
  if (root.children && (stopLevel === undefined || currentLevel < stopLevel)) {
    root.children.forEach((child) => {
      nodes.push(...walker(child, nodeType, stopLevel, currentLevel + 1));
    });
  }
  return nodes;
};
