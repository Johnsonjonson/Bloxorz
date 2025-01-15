import { _decorator, Component, Input, input, KeyCode, Node, Quat, tween, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
enum BlockState {
    HorizontalX, // 平躺（沿 X 轴）
    HorizontalZ, // 平躺（沿 Z 轴）
    Vertical,    // 竖直
}

@ccclass('RoleCtr')
export class RoleCtr extends Component {
    private isMoving: boolean = false; // 是否正在移动
    private moveDistance: number = 1; // 每次移动的格子距离

    private rotationQuat: Quat = new Quat(); // 用于存储父节点的旋转

    private blockState: BlockState = BlockState.Vertical; // 初始状态为平躺（X 轴方向）
    // 初始化地图数据
    onLoad() {
        // input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.resetPlayerScaleAndPosition(); // 确保初始状态正确
    }

    onKeyDown(event) {
        // console.log("onKeyDown    keyCode = ",event.keyCode,KeyCode.ESCAPE,KeyCode.MOBILE_BACK)
        if(event.keyCode == KeyCode.KEY_W) {
            this.flip(new Vec3(0, 0,-1)); // 向上翻滚
        }else if(event.keyCode == KeyCode.KEY_S) {
            this.flip(new Vec3(0,0, 1)); // 向下翻滚
        }else if(event.keyCode == KeyCode.KEY_A) {
            this.flip(new Vec3(-1, 0,0)); // 向左翻滚
        }else if(event.keyCode == KeyCode.KEY_D) {
            this.flip(new Vec3(1, 0,0)); // 向右翻滚
        }
    }

    start() {
    }

    /**
     * 竖直状态：scale = (1, 2, 1)（假设高度为 2）。
       水平 X 状态：scale = (2, 1, 1)。
       水平 Z 状态：scale = (1, 1, 2)。
     * @param direction 
     * @returns 
     */
    flip(direction: Vec3) {
        if (this.isMoving) return;

        this.isMoving = true;

        let pivot = this.node.position.clone(); // 当前父节点的位置（旋转锚点）
        let rotationAxis = new Vec3(0, 0, 0); // 旋转轴
        let newState: BlockState = this.blockState;
        console.log("flip    direction = ",direction,this.blockState)
        switch (this.blockState) {
            case BlockState.HorizontalX:
                if (direction.x !== 0) {
                    // 水平 X 状态，左右翻转
                    pivot.x += direction.x * this.moveDistance * 1.5;
                    pivot.y = 1;
                    rotationAxis = new Vec3(0, 0, -direction.x); // 绕 Z 轴旋转
                    newState = BlockState.Vertical;
                } else if (direction.z !== 0) {
                    // console.log("水平 X 状态，上下翻转   ")
                    // 水平 X 状态，上下翻转a
                    pivot.z += direction.z * this.moveDistance;
                    pivot.y = 0.5;
                    rotationAxis = new Vec3(direction.z, 0, 0); // 绕 X 轴旋转
                    newState = BlockState.HorizontalX;
                }
                break;

            case BlockState.HorizontalZ:
                if (direction.z !== 0) {
                    // 水平 Z 状态，上下翻转
                    pivot.z += direction.z * this.moveDistance * 1.5;
                    pivot.y = 1;
                    rotationAxis = new Vec3(direction.z,0 , 0); // 绕 X 轴旋转
                    newState = BlockState.Vertical;
                } else if (direction.x !== 0) {
                    // 水平 Z 状态，左右翻转
                    pivot.x += direction.x * this.moveDistance;
                    pivot.y = 0.5;
                    rotationAxis = new Vec3(0, 0, -direction.x); // 绕 Z 轴旋转
                    newState = BlockState.HorizontalZ;
                }
                break;

            case BlockState.Vertical:
                if (direction.x !== 0) {
                    // 竖直状态，左右翻转
                    pivot.x += direction.x * this.moveDistance * 1.5;
                    pivot.y = 0.5;
                    rotationAxis = new Vec3(0, 0, -direction.x); // 绕 Z 轴旋转
                    newState = BlockState.HorizontalX;
                } else if (direction.z !== 0) {
                    // 竖直状态，上下翻转
                    pivot.z += direction.z * this.moveDistance * 1.5;
                    pivot.y = 0.5;
                    rotationAxis = new Vec3(direction.z, 0, 0); // 绕 X 轴旋转
                    newState = BlockState.HorizontalZ;
                }
                break;
        }
       

        let eulerAngles1 = this.node.eulerAngles.clone();
        let tor = eulerAngles1.add(rotationAxis.multiplyScalar(90)); 
        //动画处理
        tween(this.node)
        .to(0.4, {
            eulerAngles: tor,
            // rotation: targetRotation, // 旋转 90°
            position : pivot,
        })
        .call(() => {
            this.isMoving = false; // 动画完成，允许下一次输入
            this.blockState = newState; // 更新状态d
            this.resetPlayerScaleAndPosition()
            // console.log("flip    direction =  2222 ",this.blockState)
                // 将子节点位置重置到父节点中心
                // this.player.setPosition(Vec3.ZERO);

                // this.checkBounds(); // 检测是否越界
                // this.checkWinCondition(); // 检测是否完成目标
            })
            .start();
    }

    private resetPlayerScaleAndPosition() {
        // 根据当前状态调整 Player 的 scale 和 position
        switch (this.blockState) {
            case BlockState.Vertical:
                // 竖直状态：高度为 2，宽度和深度为 1
                this.node.setScale(1, 2, 1);
                break;

            case BlockState.HorizontalX:
                // 水平 X 状态：宽度为 2，高度和深度为 1
                this.node.setScale(2, 1, 1);
                break;

            case BlockState.HorizontalZ:
                // 水平 Z 状态：深度为 2，宽度和高度为 1
                this.node.setScale(1, 1, 2);
                break;
        }

        // 重置子节点的 rotation
        this.node.setRotationFromEuler(0, 0, 0);
    }

    private checkBounds() {
        const pos = this.node.position;
        if (pos.x < 0 || pos.z < 0 || pos.x > 10 || pos.z > 10) {
            console.log("失败！方块掉出地图！");
            this.resetGame();
        }
    }

    private checkWinCondition() {
        const goalPos = new Vec3(5, 0, 5); // 假设目标位置为 [5, 0, 5]
        if (
            this.node.position.equals(goalPos) &&
            this.blockState === BlockState.Vertical // 必须竖直站立
        ) {
            console.log("恭喜你完成了关卡！");
        }
    }

    private resetGame() {
        this.node.setPosition(new Vec3(0, 0, 0));
        this.node.setRotationFromEuler(new Vec3(0, 0, 0));
        this.blockState = BlockState.Vertical; // 恢复初始状态
    }

    getIsMoving() {
        return this.isMoving;
    }
}


