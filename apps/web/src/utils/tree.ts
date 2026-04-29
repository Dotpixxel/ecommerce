export interface BaseNode {
	id: string;
	parentId: string | null;
	order: number;
}

export type TreeNode<T extends BaseNode> = T & {
	children: TreeNode<T>[];
};

/**
 * Transforms a flat list of nodes into a hierarchical tree structure.
 */
export function buildTree<T extends BaseNode>(nodes: T[]): TreeNode<T>[] {
	const map = new Map<string, TreeNode<T>>();
	const roots: TreeNode<T>[] = [];

	// First pass: create nodes and add children array
	for (const node of nodes) {
		map.set(node.id, { ...node, children: [] });
	}

	// Second pass: connect children to parents
	for (const node of nodes) {
		const treeNode = map.get(node.id);
		if (!treeNode) continue;

		if (node.parentId && map.has(node.parentId)) {
			const parent = map.get(node.parentId);
			if (parent) {
				parent.children.push(treeNode);
			}
		} else {
			roots.push(treeNode);
		}
	}

	// Sort each level by order
	const sortNodes = (nodes: TreeNode<T>[]) => {
		nodes.sort((a, b) => a.order - b.order);
		for (const node of nodes) {
			if (node.children.length > 0) {
				sortNodes(node.children);
			}
		}
	};

	sortNodes(roots);
	return roots;
}
