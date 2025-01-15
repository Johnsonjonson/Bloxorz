import { _decorator } from 'cc';
import { BloxorzBlock } from './BloxorzBlock';
import { BloxorzMove } from './BloxorzMove';
const { ccclass, property } = _decorator;

@ccclass('BloxorzNode')
export class BloxorzNode{
    block: BloxorzBlock;
    move: any;
    parent: any;
    f: number;
    g: number;
    h: number;


    constructor(block:BloxorzBlock,move:BloxorzMove,parent:any,f=0,g=0,h=0){
        this.block = block;
        this.move = move;
        this.parent = parent;
        this.f = f;
        this.g = g;
        this.h = h;
    }


}


