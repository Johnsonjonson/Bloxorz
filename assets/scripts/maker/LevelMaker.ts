import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LevelMaker')
export class LevelMaker extends Component {

    @property(Prefab)
    private backgroundPrefab: Prefab = null;
    @property(Prefab)
    private targetPrefab: Prefab = null;
    @property(Prefab)
    private emptyPrefab: Prefab = null;

    @property(Node)
    private groundNode: Node = null;

    @property(Node)
    private blockNode: Node = null;
    
    start() {
        for (let i = -20; i <= 30; i++) {
            for (let j = -15; j <= 18; j++) {
                let node = instantiate(this.emptyPrefab);
                node.parent = this.groundNode;
                node.setPosition(i,-1, j );
            }
        }
        this.blockNode.setPosition(0, 1, 0);
    }

    update(deltaTime: number) {
        
    }
}


