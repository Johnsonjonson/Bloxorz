import { _decorator, Component, Node, Vec2 } from 'cc';
import { BloxorzTerrain } from './BloxorzTerrain';
import { BloxorzBlock } from './BloxorzBlock';
import { BloxorzMove } from './BloxorzMove';
import { BloxorzNode } from './BloxorzNode';
import { BloxorzPosition } from './BloxorzPosition';
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
        const openList: BloxorzNode[] = [];
        const closedSet: Set<string> = new Set();

        const startPos = terrain.getStart();
        if (!startPos) throw new Error("Start position not found");
        
        const startBlock = new BloxorzBlock(startPos, startPos);
        const startNode = new BloxorzNode(
            startBlock,
            null,
            null,
            0,
            0,
            0,
            new Set<number>()
        );

        const goalPos = terrain.getGoal();
        if (!goalPos) throw new Error("Goal position not found");

        openList.push(startNode);

        while (openList.length > 0) {
            const currentNode = openList.reduce((min, node) => 
                node.f < min.f ? node : min, openList[0]);
            
            openList.splice(openList.indexOf(currentNode), 1);
            
            const stateKey = this.getStateKey(
                currentNode.block, 
                currentNode.triggeredGroups,
                currentNode.block.isStanding()
            );
            
            if (closedSet.has(stateKey)) continue;
            closedSet.add(stateKey);

            if (terrain.done(currentNode.block)) {
                return this.reconstructPath(currentNode);
            }

            const moves = [BloxorzMove.Left, BloxorzMove.Right, BloxorzMove.Up, BloxorzMove.Down];
            
            for (const move of moves) {
                let nextBlock: BloxorzBlock;
                switch (move) {
                    case BloxorzMove.Left:
                        nextBlock = currentNode.block.left();
                        break;
                    case BloxorzMove.Right:
                        nextBlock = currentNode.block.right();
                        break;
                    case BloxorzMove.Up:
                        nextBlock = currentNode.block.up();
                        break;
                    case BloxorzMove.Down:
                        nextBlock = currentNode.block.down();
                        break;
                }

                const newTriggeredGroups = new Set(currentNode.triggeredGroups);
                const { valid, newTriggers } = terrain.checkMove(nextBlock);
                
                if (!valid) continue;
                
                if (nextBlock.isStanding()) {
                    newTriggers.forEach(groupNum => newTriggeredGroups.add(groupNum));
                }

                const newNode = new BloxorzNode(
                    nextBlock,
                    move,
                    currentNode,
                    0,
                    currentNode.g + 1,
                    this.calculateHeuristic(nextBlock, goalPos),
                    newTriggeredGroups
                );
                
                newNode.f = newNode.g + newNode.h;

                const newStateKey = this.getStateKey(
                    nextBlock, 
                    newTriggeredGroups,
                    nextBlock.isStanding()
                );
                
                const existingBetter = openList.some(node => 
                    this.getStateKey(
                        node.block, 
                        node.triggeredGroups,
                        node.block.isStanding()
                    ) === newStateKey 
                    && node.g <= newNode.g
                );

                if (!existingBetter && !closedSet.has(newStateKey)) {
                    openList.push(newNode);
                }
            }
        }

        return [];
    }

    private getStateKey(
        block: BloxorzBlock, 
        triggeredGroups: Set<number>, 
        isStanding: boolean
    ): string {
        const blockKey = `${block.p1.x},${block.p1.z},${block.p2.x},${block.p2.z}`;
        const standingKey = isStanding ? 'S' : 'L';
        const triggeredKey = Array.from(triggeredGroups).sort().join(',');
        return `${blockKey}:${standingKey}:${triggeredKey}`;
    }

    private calculateHeuristic(block: BloxorzBlock, goal: BloxorzPosition): number {
        const dx1 = Math.abs(block.p1.x - goal.x);
        const dz1 = Math.abs(block.p1.z - goal.z);
        const dx2 = Math.abs(block.p2.x - goal.x);
        const dz2 = Math.abs(block.p2.z - goal.z);
        
        const standingPenalty = block.isStanding() ? 0 : 1;
        
        return Math.min(dx1 + dz1, dx2 + dz2) + standingPenalty;
    }

    private reconstructPath(node: BloxorzNode): BloxorzMove[] {
        const path: BloxorzMove[] = [];
        let current: BloxorzNode | null = node;
        
        while (current && current.move !== null) {
            path.unshift(current.move);
            current = current.parent;
        }
        
        return path;
    }
}


