import { _decorator, Component, error, EventTouch, Input, input, instantiate, KeyCode, log, Node, Prefab, resources, TextAsset, tween, Vec3 } from 'cc';
import { BloxorzTerrain } from './BloxorzTerrain';
import { RoleCtr2 } from './RoleCtr2';
import { RoleCtr } from './RoleCtr';
import { BloxorzBlock } from './BloxorzBlock';
import { AStarSolver } from './AStarSolver';
import { BloxorzMove } from './BloxorzMove';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    @property(Node)
    private groundNode: Node = null;

    @property(Node)
    private blockNode: Node = null;

    bloxorzBlock: BloxorzBlock;
    bloxorzTerrain: any;
    level: number;

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event) {
        let roleCtr = this.blockNode.getComponent(RoleCtr)
        if (roleCtr.getIsMoving()) {
            return
        }
        console.log("onKeyDown    keyCode = ",event.keyCode,KeyCode.ESCAPE,KeyCode.MOBILE_BACK)
        if(event.keyCode == KeyCode.KEY_W) {
            let nextBlock = this.bloxorzBlock.up()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(0, 0,-1)); // 向上翻滚
            }
        }else if(event.keyCode == KeyCode.KEY_S) {
            let nextBlock = this.bloxorzBlock.down()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(0,0, 1)); // 向下翻滚
            }
        }else if(event.keyCode == KeyCode.KEY_A) {
            let nextBlock = this.bloxorzBlock.left()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(-1, 0,0)); // 向左翻滚
            }
        }else if(event.keyCode == KeyCode.KEY_D) {
            let nextBlock = this.bloxorzBlock.right()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(1, 0,0)); // 向右翻滚
            }
        }
        log("=================================move",this.bloxorzBlock)
        tween(this.blockNode).delay(0.5).call(
            () => {
                if (this.bloxorzTerrain.done(this.bloxorzBlock)){
                    this.level ++
                    this.updateTerrain()
                    log("done!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                }
            }
        ).start()
        
    }

    start() {
        this.level = 6;
        this.updateTerrain();
    }

    async updateTerrain() {
        let level = this.level.toString()
        this.bloxorzTerrain = this.groundNode.getComponent(BloxorzTerrain)

        await this.bloxorzTerrain.parseTerrain("levels/level" + level);
        let startPos = this.bloxorzTerrain.getStart()
        log("startPos", startPos);
        this.blockNode.setPosition(startPos.z, 1, startPos.x);


        // 添加测试代码
        const solver = new AStarSolver();
        const solution = solver.solve(this.bloxorzTerrain);
        console.log("Solution:", solution);
        if (solution.length > 0) {
            console.log("Found solution with", solution.length, "moves:");
            solution.forEach((move, index) => {
                console.log(`Step ${index + 1}: ${BloxorzMove[move]}`);
            });
        } else {
            console.log("No solution found!");
        }


        this.bloxorzBlock = new BloxorzBlock(startPos, startPos)

        tween(this.blockNode).delay(0.5).call(
            () => {
                this.blockNode.setPosition(startPos.z, 1, startPos.x);
            }
        ).start()
        log("================================= init ",this.bloxorzBlock)


        // this.bloxorzTerrain = this.groundNode.getComponent(BloxorzTerrain);
        // await this.bloxorzTerrain.parseTerrain("levels/level01");
        // let startPos = this.bloxorzTerrain.getStart();
        
        // // 调整方块的初始位置，使用相同的坐标转换逻辑
        // const height = this.bloxorzTerrain.getMap().length;
        // const width = this.bloxorzTerrain.getMap()[0].length;
        // const transformedX = startPos.y - width / 2;
        // const transformedZ = height - 1 - startPos.x;
        
        // this.blockNode.setPosition(transformedX, 1, transformedZ);
        // this.bloxorzBlock = new BloxorzBlock(startPos, startPos);
    }

    update(deltaTime: number) {
        
    }
}


