module.exports = function replacer(tree, nodeToReplace, replacement, parseFn) {
  const { startIndex, endIndex } = nodeToReplace;
  const startOffset = tree.rootNode.text.slice(0, startIndex).length;
  const endOffset = tree.rootNode.text.slice(0, endIndex).length;
  const newText =
    tree.rootNode.text.slice(0, startOffset) +
    replacement +
    tree.rootNode.text.slice(endOffset);
  return parseFn(newText);
};
