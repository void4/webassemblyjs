// @flow

import { encodeNode } from "@webassemblyjs/wasm-gen";
import { getSectionMetadata } from "@webassemblyjs/ast";
import {
  resizeSectionByteSize,
  resizeSectionVecSize,
  createEmptySection,
  getSectionForNode
} from "@webassemblyjs/helper-wasm-section";
import { overrideBytesInBuffer } from "@webassemblyjs/helper-buffer";

function assertNodeHasLoc(n: Node) {
  if (n.loc == null || n.loc.start == null || n.loc.end == null) {
    throw new Error(
      `Internal failure: can not replace node (${JSON.stringify(
        n.type
      )}) without loc information`
    );
  }
}

export function applyToNodeToUpdate(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  nodes.forEach(node => {
    assertNodeHasLoc(node);

    const sectionName = getSectionForNode(node);
    const replacementByteArray = encodeNode(node);

    /**
     * Replace new node as bytes
     */
    uint8Buffer = overrideBytesInBuffer(
      uint8Buffer,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.start.column,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.end.column,
      replacementByteArray
    );

    /**
     * Update section size
     */
    const deltaBytes =
      replacementByteArray.length -
      // $FlowIgnore: assertNodeHasLoc ensures that
      (node.loc.end.column - node.loc.start.column);

    uint8Buffer = resizeSectionByteSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaBytes
    );

    // Update new node end position
    // $FlowIgnore: assertNodeHasLoc ensures that
    node.loc.end.column = node.loc.start.column + replacementByteArray.length;
  });

  return uint8Buffer;
}

export function applyToNodeToDelete(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  const deltaElements = -1; // since we removed an element

  nodes.forEach(node => {
    assertNodeHasLoc(node);

    const sectionName = getSectionForNode(node);

    // replacement is nothing
    const replacement = [];

    uint8Buffer = overrideBytesInBuffer(
      uint8Buffer,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.start.column,
      // $FlowIgnore: assertNodeHasLoc ensures that
      node.loc.end.column,
      replacement
    );

    /**
     * Update section
     */
    // $FlowIgnore: assertNodeHasLoc ensures that
    const deltaBytes = -(node.loc.end.column - node.loc.start.column);

    uint8Buffer = resizeSectionByteSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaBytes
    );

    uint8Buffer = resizeSectionVecSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaElements
    );
  });

  return uint8Buffer;
}

export function applyToNodeToAdd(
  ast: Program,
  uint8Buffer: Uint8Array,
  nodes: Array<Node>
) {
  const deltaElements = +1; // since we added an element

  nodes.forEach(node => {
    const sectionName = getSectionForNode(node);

    let sectionMetadata = getSectionMetadata(ast, sectionName);

    // Section doesn't exists, we create an empty one
    if (typeof sectionMetadata === "undefined") {
      const res = createEmptySection(ast, uint8Buffer, sectionName);

      uint8Buffer = res.uint8Buffer;
      sectionMetadata = res.sectionMetadata;
    }

    /**
     * Add nodes
     */
    const newByteArray = encodeNode(node);

    // start at the end of the section
    const start = sectionMetadata.startOffset + sectionMetadata.size + 1;

    const end = start;

    uint8Buffer = overrideBytesInBuffer(uint8Buffer, start, end, newByteArray);

    const deltaBytes = newByteArray.length;

    /**
     * Update section
     */
    uint8Buffer = resizeSectionByteSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaBytes
    );

    uint8Buffer = resizeSectionVecSize(
      ast,
      uint8Buffer,
      sectionName,
      deltaElements
    );
  });

  return uint8Buffer;
}