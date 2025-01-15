import { _decorator, Component, Node, Vec2 } from 'cc';
import { BloxorzTerrain } from './BloxorzTerrain';
import { BloxorzBlock } from './BloxorzBlock';
import { BloxorzMove } from './BloxorzMove';
import { BloxorzNode } from './BloxorzNode';
const { ccclass, property } = _decorator;

type HeuristicFunction = 'Euclidean' | 'Chebyshev';

@ccclass('AStarSolver')
export class AStarSolver extends Component {

    private readonly hFunc: HeuristicFunction;
    private static readonly heuristicFunctions: HeuristicFunction[] = ['Euclidean', 'Chebyshev'];

    constructor(hFunc: HeuristicFunction = 'Chebyshev') {
        super();
        if (!AStarSolver.heuristicFunctions.some(h => h === hFunc)) {
            throw new Error("Heuristic Function can be either 'Euclidean' or 'Chebyshev'");
        }
        this.hFunc = hFunc;
    }

    solve(terrain: BloxorzTerrain): BloxorzMove[] {
        const openList: BloxorzNode[] = [];  // Initialize open list
        const closedList: BloxorzNode[] = []; // Initialize closed list

        const startPos = terrain.getStart();
        if (!startPos) throw new Error("Start position not found");
        
        const startBloxorzBlock = new BloxorzBlock(startPos, startPos);
        const startNode = new BloxorzNode(
            startBloxorzBlock,
            null,
            null,
             0,
            0,
            0
        );

        const goalPos = terrain.getGoal();
        if (!goalPos) throw new Error("Goal position not found");
        
        const goalBloxorzBlock = new BloxorzBlock(goalPos, goalPos);

        openList.push(startNode);

        while (openList.length > 0) {
            // Get the current node
            let currentNode = openList[0];
            let currentIndex = 0;

            for (let i = 0; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }

            openList.splice(currentIndex, 1);
            closedList.push(currentNode);

            if (terrain.done(currentNode.block)) {
                const path: (BloxorzMove | null)[] = [];
                let current: BloxorzNode | null = currentNode;
                
                // BackTrack Moves
                while (current !== null) {
                    path.push(current.move);
                    current = current.parent;
                }
                
                // Return reversed order of Moves (excluding the initial null)
                return path.reverse().filter((move): move is BloxorzMove => move !== null);
            }

            const children = this.getChildren(currentNode, terrain);

            for (const child of children) {
                // continue if child is on the closed list
                if (closedList.some(node => node === child)) {
                    continue;
                }

                // Create the f, g, and h values
                child.g = currentNode.g + 1;

                // Using Euclidean distance as heuristic function
                if (this.hFunc === 'Euclidean') {
                    child.h = Math.sqrt(
                        Math.pow(child.block.p2.x - goalBloxorzBlock.p2.x, 2) + 
                        Math.pow(child.block.p2.z - goalBloxorzBlock.p2.z, 2)
                    );
                }

                // Using Chebyshev distance as heuristic function
                if (this.hFunc === 'Chebyshev') {
                    const hn1 = Math.max(
                        Math.abs(child.block.p1.x - goalBloxorzBlock.p1.x),
                        Math.abs(child.block.p1.z - goalBloxorzBlock.p1.z)
                    );
                    const hn2 = Math.max(
                        Math.abs(child.block.p2.x - goalBloxorzBlock.p2.x),
                        Math.abs(child.block.p2.z - goalBloxorzBlock.p2.z)
                    );
                    child.h = Math.max(hn1, hn2);
                }

                child.f = child.g + child.h;

                // Child is already in the open list
                const openNode = openList.find(node => node === child);
                if (openNode && child.g > openNode.g) {
                    continue;
                }

                // Add the child to the open list
                openList.push(child);
            }
        }

        return []; // Return empty array if no solution found
    }

    private getChildren(currentNode: BloxorzNode, terrain: BloxorzTerrain): BloxorzNode[] {
        const legalNeighbours = terrain.legalNeighbors(currentNode.block);
        return legalNeighbours.map(({ block, move }) => 
            new BloxorzNode(
                block,
                move,
                currentNode,
                0,
                0,
                0
            )
        );
    }
}


