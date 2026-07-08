
//adds a block that can both slide and teleport.
const temp_Vec2 = Vec2.create()
const temp_obj = {}
ig.ENTITY.WaveSlidingBlock = ig.ENTITY.WavePushPullBlock.extend({
    init(x_, y_, z_, settings) {
        this.parent(x_, y_, z_, settings);
        this.pushPullable = null
        this.initAnimations({
            sheet: {
                src: "media/entity/style/qt-cold-dng-puzzle.png", //there's a proper way to do this, but it isn't working :(
                width: 32,
                height: 64,
                offX: 224,
                offY: 192,
            },
            aboveZ: 1,
            wallY: 0.1,
            SUB: [
                {
                    name: 'default',
                    time: 1,
                    frames: [0],
                    repeat: false,
                },
                {
                    name: 'phasing',
                    time: 1,
                    frames: [0],
                    repeat: false,
                    renderMode: 'lighter',
                },
                {
                    name: 'moveV',
                    time: 0.03,
                    frames: [0, 0],
                    framesGfxOffset: [0, 0, 0, 0],
                    repeat: true,
                },
                {
                    name: 'moveH',
                    time: 0.03,
                    frames: [0, 0],
                    framesGfxOffset: [0, 0, 0, 0],
                    repeat: true,
                },
            ],
        })
    },
    moving: false,
    moveDir: Vec2.create(),
    bombSnap: true,
    squishRespawn: true,
    effects: {
        sheet: new ig.EffectSheet('puzzle.sliding-block'),
        handle: null,
    },
    //START KLUDGE
    show(noShowFx)/*: void*/ {
        ig.game.showEntity(this)
        if (this.effects.hideHandle) {
            this.effects.hideHandle.stop()
            this.effects.hideHandle = null
        }
        if (!noShowFx) {
            this.animState.alpha = 0
            ig.game.effects.teleport.spawnOnTarget('showQuick', this)
        }
        },
    onHideRequest() {
        this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget('hideQuick', this, {
            align: ig.ENTITY_ALIGN.CENTER,
            callback: this,
        })
    },
    update()/*: void*/ {
        if (this.moving) {
            const d = Vec2.assign(temp_Vec2, this.moveDir)
            Vec2.length(d, 400 * ig.system.tick)
            let c = ig.game.physics.initTraceResult(temp_obj)
            if (ig.game.traceEntity(c, this, d.x, d.y, 0, 0, 1, ig.COLLTYPE.IGNORE, null, null, 1)) {
                Vec2.mulF(d, c.dist)
                this.moving = false
                this.effects.handle && this.effects.handle.stop()
                this.coll.vel.z = 0
            }
            c = this.coll
            this.setPos(c.pos.x + d.x, c.pos.y + d.y, c.pos.z, true)
        }
        this.updateAnim()
        this.coll.update()
    },
    deferredUpdate: null,
    onInteraction: null,
    onInteractionEnd: null,
    onKill(levelChange/*?: boolean*/)/*: void*/ {
        if (!ig.ENTITY_KILL_CALL) throw Error('Called Entity .onKill() outside of ig.game.kill(). If you got this error, please let @quietype00 know on discord. Make sure to screenshot or record the error logs and installed mods, and a save file would be nice too.')
        ig.ENTITY_KILL_CALL--
        this._killed = true
        this.coll._killed = true
    },
    resetPos: null,
    //qt_b: Vec2.assign(),
    ballHit(d/*: ig.BallLike*/)/*: boolean*/ {
        if (this.phased) return false
        let c = d.getHitCenter(this)
        let e = false
        !d.isBall && !d.attackInfo.hasHint('BOMB') && (e = true)
        d.isBall && !d.attackInfo.hasHint('CHARGED') && (e = true)
        if (this.moving || e) {
            sc.combat.showHitEffect(this, c, sc.ATTACK_TYPE.NONE, d.getElement(), true, false, true)
            return true
        }
        if (d.getElement() != sc.ELEMENT.WAVE) {
            Vec2.flip(ig.ActorEntity.getFaceVec(d.getCollideSide(this), this.moveDir))
            d = Vec2.assign(temp_Vec2, this.moveDir/* || {x:0, y:0}*/)
            c = ig.game.physics.initTraceResult(temp_obj)
            if (ig.game.traceEntity(c, this, d.x, d.y, 0, 0, 0, ig.COLLTYPE.IGNORE)) this.effects.sheet.spawnOnTarget('blocked', this)
            else {
                this.moving = true
                this.effects.handle = this.effects.sheet.spawnOnTarget('slide', this, {
                    duration: -1,
                })
            }
            return true
        }
        if (!((d.isBall && d.attackInfo.hasHint('CHARGED')) || d instanceof sc.CompressedWaveEntity))
            return false
        this.phased = true
        d.addEntityAttached(this)
        this.setCurrentAnim('phasing')
        return false
    },
    onMagnetStart() {
        if (!this.magnet) return false
        this.magnet = true
        this.coll.setType(ig.COLLTYPE.NPBLOCK)
        return true
    },
    onMagnetEnd(b) {
        this.magnet = false
        b && this.effects.sheet.spawnOnTarget('boxThud', this)
    }
    //END KLUDGE
})

    //add invisible steamPipe types for the inside of walls
sc.STEAM_PIPE_TYPES.INVISHORIZONTAL = {
    gfx: {
        x: 1118,
        y: 0,
    },
    scaleX: true,
    size: {
        x: 16,
        y: 12,
        z: 5,
    },
    renderHeight: 4,
    points: [
        {
            x: 0,
            y: 0.5,
        },
        {
            x: 1,
            y: 0.5,
        },
    ],
}
sc.STEAM_PIPE_TYPES.INVISVERTICAL = {
    gfx: {
        x: 1118,
        y: 16,
    },
    scaleY: true,
    size: {
        x: 16,
        y: 16,
        z: 5,
    },
    renderHeight: 0,
    points: [
        {
            x: 0.5,
            y: 0,
        },
        {
            x: 0.5,
            y: 1,
        },
    ],
}
sc.STEAM_PIPE_TYPES.INVISCURVE_SE = {
    gfx: {
        x: 1118,
        y: 0,
    },
    size: {
        x: 16,
        y: 12,
        z: 5,
    },
    renderHeight: 4,
    points: [
        {
            x: 1,
            y: 0.5,
        },
        {
            x: 0.5,
            y: 1,
        },
    ],
}
sc.STEAM_PIPE_TYPES.INVISCURVE_SW = {
    gfx: {
        x: 1118,
        y: 0,
    },
    size: {
        x: 16,
        y: 12,
        z: 5,
    },
    renderHeight: 4,
    points: [
        {
            x: 0,
            y: 0.5,
        },
        {
            x: 0.5,
            y: 1,
        },
    ],
}
sc.STEAM_PIPE_TYPES.INVISCURVE_NE = {
    gfx: {
        x: 1118,
        y: 16,
    },
    size: {
        x: 16,
        y: 16,
        z: 5,
    },
    renderHeight: 0,
    points: [
        {
            x: 0.5,
            y: 0,
        },
        {
            x: 1,
            y: 0.5,
        },
    ],
}
sc.STEAM_PIPE_TYPES.INVISCURVE_NW = {
    gfx: {
        x: 1118,
        y: 16,
    },
    size: {
        x: 16,
        y: 16,
        z: 5,
    },
    renderHeight: 0,
    points: [
        {
            x: 0.5,
            y: 0,
        },
        {
            x: 0,
            y: 0.5,
        },
    ],
}

//an element pole that can be part of multiple groups
//POLE TODO:
//  Ball continues after a dest is triggered
//  onCancel() poles error when another different-element ball hits them after they already triggered a dest

const Vec3_temp = Vec3.create()
var EL = {}
EL[sc.ELEMENT.HEAT] = 'flame'
EL[sc.ELEMENT.COLD] = 'ice'
EL[sc.ELEMENT.SHOCK] = 'shock'
EL[sc.ELEMENT.WAVE] = 'wave'

//an object containing all the group data and functions to process it.
sc.ElementPoleGroupsMulti = {
    groups: {},
    registerDest(dest, b) { //register a dest object into a group
        if (dest.group) {
            const g = this.getGroup(dest.group)
            g.dests[dest.element] = dest
            if (b) {
                g.currentDest = dest
                for (let d = (g.hitCount = g.poles.length); d--; ) g.poles[d].onDestInit(dest.element)
            }
        }
    },
    registerPole(pole) { //takes an ElementPole object
        for (const g of pole.groups) { //for every group in groups
            const group = this.getGroup(g) //get a reference to the group array
            group.poles.push(pole) //push a reference to the ElementPole into the array
            if (group.currentDest) { //if the group already has a destination that a [different] pole is trying to trigger
                group.hitCount = group.poles.length //make sure this groups hitCount is set to the amount of poles in the group
                pole.onDestInit(group.currentDest.element) //?
            }
        }
    },
    getGroup(group/*: string*/)/*: ElementPoleGroupsMulti.Group*/ {
        this.groups[group] || //if there is no group, make a blank one,
            (this.groups[group] = {
                dests: {},
                poles: [],
                currentBall: null,
                currentDest: null,
                hitCount: 0,
            })
        return this.groups[group] //and then return it
    },
    deleteGroup(group) {
        group && delete this.groups[group]
    },
    onPoleHit(pole/*: ig.ENTITY.ElementPole*/, ball/*: ig.ENTITY.Ball*/, alreadyHit/*: boolean*/)/*: boolean*/ {
        if (pole.active) {
            var element = ball.getElement()
            if (!element) return false
            if (!pole.groups) return true
            for (let tmp of pole.groups) { //For each group in groups,
                let e = this.getGroup(tmp);
                let dest = e.dests[element] || null //set element to be the element of the ball //ai was used here briefly. see https://chatgpt.com/share/6a41a7b8-ae54-83ea-8d16-70bbb4b8a842
                if ((e.currentBall && e.currentBall != ball && !alreadyHit) || (e.currentDest && e.currentDest != dest)) { //if the group is already charging but with a different ball, 
                    this.onGroupChargeCancel(pole, ball) //cancel charging up the pole
                    alreadyHit = false //and set AlreadyHit to false, because you have to hit them all with the same ball. Potential source of noTriggerOnCancel bug?
                }
                if (dest && !dest.isOn()) { //if the dest has an element, and that dest is off,
                    if (alreadyHit || e.hitCount >= e.poles.length) return true //if the pole was alreadyHit, or if the group's hitCount is larger than the length of the number of poles in the group, let the ball continue on it's way normally and return.
                    e.currentBall = ball //if not, set the currectBall of the group to the ball that just hit the pole
                    e.currentDest = dest //and set the current destination to the element.
                    e.hitCount++ //and increase the the groups temporary hitCount
                    let done = e.hitCount == e.poles.length //if the hitCount equals the number of poles in the group, set ball to true.
                    dest.onPoleHit(pole, done, e.poles) //call onPoleHit for the pole, ball (now a boolean), and group.poles
                    if (done) { //if the hitCount equals the number of poles in the group (ie trigger the dest on)
                        for (let p = e.poles.length; p--; ) { //for the amount of poles in the group
                            let otherPole = e.poles[p] //set already hit to each pole in group.poles
                            if (pole != otherPole) otherPole.onComplete() //if the last (current) pole hit isn't the one we're dealing with, set the one we're dealing with COMPLETE! Yay!
                        }
                    }
                }
            }
            return true
        }
    },
    //this now returns an array, one for each group
    getChargeState(b) { //Get the charge states of each of the groups that a torch belongs to
        if (!b.groups) return [chargeStateTypes.TMP] //if the torch belongs to no groups, return an array of one temporary charge
        let chargeState = [];
        for (const g of b.groups) { //for each group that the torch belongs to,
            const q = this.getGroup(g); //fetch that group,
            chargeState.push(!q.currentDest ? chargeStateTypes.TMP : q.hitCount < q.poles.length ? chargeStateTypes.PENDING : chargeStateTypes.GROUP) //if the group has no current dest, meaning the element used is not in the group, set the charge state to TMP. If the group's hitcount is less than the amount of poles in it, return a.PENDING (this means the group still has poles to go). If not, return a.GROUP (the group is done!)
        }
        return chargeState //return the array of chargestates
    },
    onFinalizeGroup(dest) { 
        dest = this.getGroup(dest.group)
        dest.currentBall = null
        for (let b = dest.poles.length; b--; ) dest.poles[b].onFinalize()
    },
    onCancelCheck(dest/*: ig.ENTITY.ElementPole*/)/*: boolean*/ { //
        dest = this.getGroup(dest.group)
        if (dest.hitCount == dest.poles.length) return false
        if (dest.currentBall._killed) {
            dest.currentBall = null
            dest.hitCount = 0
            for (let b = dest.poles.length; b--; ) dest.poles[b].onCancel()
            return true
        }
        return false
    },
    onGroupChargeCancel(currentPole, ball) {
        if (!currentPole.groups) return null
        for (const tmp of currentPole.groups) {
            let b = this.getGroup(tmp)
            if (tmp.currentBall != ball) {
                for (let c = b.poles.length; c--; ) {
                    const p = b.poles[c]
                    let isInThisGroup = false
                    //if (p != currentPole) p.onCancel() //old
                    for (let g of p.groups)
                        for (let d in this.getGroup(g).dests)
                            if (d.currentBall == ball)
                                isInThisGroup = true
                    if (!isInThisGroup && p != currentPole) p.onCancel()
                }
            }
            if (b.currentDest) {
                b.currentDest.onCancel()
                b.currentDest = null
                b.hitCount = 0
                b.currentBall = null
            }
        }
    },
}
sc.TERMO_POLE_TYPE_MULTI = {}
sc.TERMO_POLE_TYPE_MULTI.LONG = {
    size: {
        x: 16,
        y: 16,
        z: 48,
    },
    src: {
        x: 0,
        y: 144,
    },
    changeHeight: 32,
}
sc.TERMO_POLE_TYPE_MULTI.LONG_64 = {
    size: {
        x: 16,
        y: 16,
        z: 80,
    },
    src: {
        x: 80,
        y: 144,
    },
    changeHeight: 64,
}
sc.TERMO_POLE_TYPE_MULTI.SHORT = {
    size: {
        x: 16,
        y: 16,
        z: 16,
    },
    src: {
        x: 0,
        y: 208,
    },
}

var chargeStateTypes = {
    NONE: {
        timed: false,
    },
    TMP: {
        timed: true,
        blink: true,
    },
    PENDING: {
        timed: false,
        blink: true,
    },
    GROUP: {
        timed: false,
    },
    DISCHARGE: {
        timed: true,
    },
}

let d = null
ig.ENTITY.ElementPoleMulti = ig.AnimatedEntity.extend({
    data: null,
    gfx: null,
    groups/*: changed to an array of group objects */: [],
    charge/*: ElementPole.Charge*/: {
        state: chargeStateTypes.NONE,
        element/*: sc.ELEMENT*/: 0,
        prevElement: 0,
        timer: 0,
        lightHandles: [],
    },
    effects: {
        sheet: new ig.EffectSheet('puzzle.thermo-pole'),
        handle: null,
        hideHandle: null,
    },
    //change wm initialization for clarity. This may never matter.
    _wm/*: ig.Config*/: new ig.Config({
        spawnable: true,
        attributes: {
            poleType: {
                _type: 'String',
                _info: 'Type of Pole',
                _select: sc.TERMO_POLE_TYPE_MULTI,
            },
            groups: {
                _type: 'Array',
                _info: 'Groups of ThermoPoleDest this pole belongs to',
            },
            spawnCondition: {
                _type: 'VarCondition',
                _info: 'Condition for prop to appear',
                _popup: true,
            },
        },
    }),
    init(x_/*: number*/, y_/*: number*/, z_/*: number*/, settings/*: ig.ENTITY.ElementPole.Settings*/)/*: ElementPole*/ {
        this.parent(x_, y_, z_, settings)
        this.coll.type = ig.COLLTYPE.VIRTUAL
        this.coll.zGravityFactor = 1e3
        this.groups = settings.groups
        if (settings.spawnCondition) {
            d || (d = new ig.VarCondition())
            d.setCondition(settings.spawnCondition)
            this.active = d.evaluate()
        } else this.active = true
        this.data = sc.TERMO_POLE_TYPE_MULTI[settings.poleType] || sc.TERMO_POLE_TYPE_MULTI.SHORT
        this.coll.setSize(this.data.size.x, this.data.size.y, this.data.size.z)
        Vec2.assignC(this.coll.padding, 4, 4)
        if ((x_ = ig.mapStyle.get('puzzle2'))) this.gfx = new ig.Image(x_.sheet)
        this.charge.timer = new ig.WeightTimer(false)
        sc.ElementPoleGroupsMulti.registerPole(this)
    },
    onKill(levelChange/*?: boolean*/)/*: void*/ {
        for (const g of this.groups) sc.ElementPoleGroupsMulti.deleteGroup(g)
        this.gfx && this.gfx.decreaseRef()
        this.parent(levelChange)
    },
    show(noShowFx/*?: boolean*/)/*: void*/ {
        this.parent(noShowFx)
        if (this.effects.hideHandle) {
            this.effects.hideHandle.stop()
            this.effects.hideHandle = null
        }
        if (!noShowFx) {
            this.animState.alpha = 0
            ig.game.effects.teleport.spawnOnTarget('showDefault', this, {})
        }
        this.active = true
    },
    onHideRequest() {
        this.active = false
        this.charge.state != chargeStateTypes.NONE && this.discharge(true)
        this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget('hideDefault', this, {
            callback: this,
        })
    },
    onEffectEvent(a) {
        if (a == this.effects.hideHandle && a.isDone()) {
            this.effects.hideHandle = null
            this.hide()
        }
    },
    initSprites()/*: void*/ {
        this.setSpriteCount(3)
    },
    update()/*: void*/ {
        if (this.charge.state != chargeStateTypes.NONE) {
            this.charge.timer.tick()
            if (this.charge.state.timed && this.charge.timer.done())
                this.charge.state == chargeStateTypes.DISCHARGE ? (this.charge.state = chargeStateTypes.NONE) : this.discharge()
        }
        this.parent()
    },
    updateSprites()/*: void*/ {
        if (this.gfx) {
            let b = this.data.src
            var c = this.sprites[0]
            let d = this.coll.size.y + this.coll.size.z
            c.setEntityDefault(this, 16, d, 'NO_EXPAND', 1, null, this.gfx, b.x, b.y)
            c.setAlpha(this.animState.alpha)
            var c = this.sprites[1]
            const e = this.sprites[2]
            if (this.charge.state == chargeStateTypes.DISCHARGE) {
                var f = this.charge.prevElement * 16
                c.setEntityDefault(this, 16, d, 'NO_EXPAND', 1, null, this.gfx, b.x + f, b.y)
                d = c.size.y + c.size.z
                b = Math.round(this.charge.timer.get() * d)
                c.setGfxCut(b, 0)
                c.setAlpha(this.animState.alpha)
                c.renderMode = 'lighter'
                e.setInvisible()
            } else if (this.charge.element) {
                var f = this.charge.element * 16
                let l = this.charge.timer.getTimePassed()
                let o = 0.3
                let m = 4
                if (this.charge.state.blink) {
                    o = 0.5
                    m = 8
                }
                l = (1 - o + (o / 2) * Math.sin(Math.PI * 2 * l * m)) * (4 * l * m).limit(0, 1)
                c.setGfxCut(0, 0)
                c.setEntityDefault(this, 16, d, 'NO_EXPAND', 1, null, this.gfx, b.x + f, b.y)
                c.renderMode = 'lighter'
                c.setAlpha(Math.min(l * 2, 1) * this.animState.alpha)
                if (l > 0.5) {
                    e.setEntityDefault(this, 16, d, 'NO_EXPAND', 1, null, this.gfx, b.x + f, b.y)
                    e.renderMode = 'lighter'
                    e.setAlpha(l * 2 - 1)
                } else e.setInvisible()
            } else {
                c.setInvisible()
                e.setInvisible()
            }
            this.animState.updateSpriteColor(this)
        }
    },
    chargeElement(a, b, c, d) {
        if (this.active) {
            this.charge.prevElement = this.charge.element
            this.charge.element = a
            !d && (c != this.charge.state || this.charge.prevElement != this.charge.element) && this.showEffect(a, b, c)
            this.charge.timer.set(8, ig.TIMER_MODE.ONCE)
            this.charge.state = c
            if (!this.charge.lightHandles.length)
                if (this.data.changeHeight) {
                    this.addLight(4 - this.data.changeHeight / 2)
                    this.addLight(4 + this.data.changeHeight / 2)
                } else this.addLight(4)
        }
    },
    resetTimer(b) {
        this.charge.state == chargeStateTypes.TMP && this.charge.timer.setRemainingTime(b)
    },
    addLight(a) {
        if (this.active) {
            const b = new ig.LightHandle(this, ig.LIGHT_SIZE.XL, 0.1, 0.3, -1, 1, false)
            b.setOffset(0, 0, a)
            ig.light.addLightHandle(b)
            this.charge.lightHandles.push(b)
        }
    },
    discharge(b) {
        this.effects.handle && this.effects.handle.stop()
        b || this.effects.sheet.spawnOnTarget('discharge', this)
        this.effects.handle = null
        this.charge.timer.set(0.5, ig.TIMER_MODE.ONCE)
        this.charge.prevElement = this.charge.element
        this.charge.element = 0
        this.charge.state = chargeStateTypes.DISCHARGE
        for (b = this.charge.lightHandles.length; b--; ) this.charge.lightHandles[b].stop()
        this.charge.lightHandles.length = 0
    },
    showEffect(b, c, d) {
        c = `${EL[b]}Circle${c ? 'Down' : 'Up'}`
        this.effects.sheet.spawnOnTarget(c, this, {
            offset: {
                z: 12,
            },
        })
        if (d == chargeStateTypes.TMP) {
            this.effects.handle && this.effects.handle.stop()
            c = `${EL[b]}Temp`
            this.effects.handle = this.effects.sheet.spawnOnTarget(c, this, {
                offset: {
                    x: 1,
                    z: this.data.changeHeight ? 12 + this.data.changeHeight : 12,
                },
                duration: -1,
            })
        }
    },
    ballHit(ballLike)/*: boolean*/ { //returning true causes the ball to continue, returning false ends the ball
        if (this.active) { //if the pole is active
            if (!ballLike.isBall || ballLike.party != sc.COMBATANT_PARTY.PLAYER) return false //if the thing that hit the pole wasn't a ball, or if a monster/party member threw it, just go through the torch
            const element = ballLike.getElement() //element refers to the element of the ball sent
            if (!sc.ElementPoleGroupsMulti.onPoleHit(this, ballLike, this.charge.element == element)) { //call onPoleHit(). If it returns false, 
                sc.combat.showHitEffect(this, ballLike.getHitCenter(this), sc.ATTACK_TYPE.NONE, ballLike.getElement(), false, false, true) //make the ball hit as if a wall was hit
                return true //and end the ball. otherwise,
            }
            var e = false 
            this.charge.state != chargeStateTypes.TMP && ballLike.cleanDirection(0.015) //if the chargestate of the ball doesn't equal a.TEMP, I think cleanDirection makes the ball continue straight as shot correction
            if (this.data.changeHeight) { //if this is the type of torch that changes the ball's height,
                var e = ballLike.coll.pos.z > this.coll.pos.z + this.coll.size.z / 2 //if the ball is more than halfway up the torch, set e to true. otherwise, set it to false
                const f = ig.CollTools.getCenterXYAlignedPos(Vec3_temp, ballLike.coll, this.coll) //get the coords of the ball should it be in the exact centre of the torch
                f.z = e ? this.coll.pos.z + 12 : this.coll.pos.z + this.data.changeHeight + 12 //set f.z to the bottom or top of the torch
                ballLike.grabPoint(f, 0.5)
            }
            var chargeStates = sc.ElementPoleGroupsMulti.getChargeState(this)
            //old function
            //for (const cs of chargeStates) { //for each group associated with this pole, regarding their chargestate, 
            //    this.chargeElement(element, e, cs) //TODO: ooookay. we can't just charge the torch with every random chargestate. Instead, getChargeState will hafta return an object of {element: chargeState}. then, we can go this.chargeElement(element, e, cs[element]) No, that can't work, bc groups can have more than one dest. We need to instead look through the chargestates and find the 'strictest' one, then apply that. I don't want to think about how though.
            //}
            let currentCS = chargeStateTypes.TMP
            for (const cs of chargeStates) {
                if (cs == currentCS) continue
                else if (currentCS == chargeStateTypes.TMP && (cs == chargeStateTypes.PENDING || cs == chargeStateTypes.GROUP)) currentCS = cs
                else if (currentCS == chargeStateTypes.PENDING && cs == chargeStateTypes.GROUP) currentCS = cs
            }
            this.chargeElement(element, e, currentCS)
            if (this.charge.element != this.charge.prevElement) {
                if (this.charge.state == chargeStateTypes.GROUP) return true
                ballLike.timer < 0.2 && ballLike.resetTime(0.2)
            }
            ballLike.addIgnore(this)
            return false
        }
    },
    onComplete() {
        this.effects.handle && this.effects.handle.stop()
        this.effects.handle = null
        this.chargeElement(this.charge.element, false, chargeStateTypes.GROUP)
    },
    onDestInit(b) {
        this.chargeElement(b, false, chargeStateTypes.GROUP, true)
    },
    onFinalize() {},
    onCancel() {
        if (this.charge.element) this.discharge()
    },
    isBallAdjust()/*: boolean*/ {
        if (this.active) return this.data.changeHeight
    },
    doBallAdjust(pos/*: Vec3*/, dir/*: Vec2*/, size/*: Vec3*/, maxBounce/*: number*/)/*: number*/ {
        if (size.x != Constants.BALL_SIZE) return 0
        dir = pos.z > this.coll.pos.z + this.coll.size.z / 2
        this.getCenter(pos)
        pos.z = dir ? this.coll.pos.z + 12 : this.coll.pos.z + this.data.changeHeight + 12
        return maxBounce
    },
    isBallDestroyer()/*: boolean*/ {
        return false
    },
})
//the destinations for multipoles
const c = {
    OFF: 1,
    CHARGING: 2,
    ON: 3,
}
ig.ENTITY.ElementPoleDestMulti = ig.AnimatedEntity.extend({
    group: null,
    element: null,
    state: c.OFF,
    _wm: new ig.Config({
        spawnable: true,
        attributes: {
            group: {
                _type: 'String',
                _info: 'Group of ThermoPoleDest this pole belongs to',
            },
            element: {
                _type: 'String',
                _info: 'Element of Destination',
                _select: ['HEAT', 'COLD', 'SHOCK', 'WAVE'],
            },
            variable: {
                _type: 'VarName',
                _info: 'Variable to be se to true when switch is activated',
            },
            activeTime: {
                _type: 'Number',
                _info: 'If >0: only keep switch active for said amount of time',
            },
        },
    }),
    effects: {
        sheet: new ig.EffectSheet('puzzle.thermo-pole'),
        handle: null,
        lightHandle: null,
    },
    init(a, b, d, e) {
        this.parent(a, b, d, e)
        this.coll.type = ig.COLLTYPE.VIRTUAL
        this.coll.setSize(16, 16, 0)
        this.coll.zGravityFactor = 1e3
        this.group = e.group
        this.element = sc.ELEMENT[e.element] || sc.ELEMENT.HEAT
        this.variable = e.variable
        this.activeTime = e.activeTime
        a = ig.mapStyle.get('puzzle2')
        this.initAnimations({
            sheet: {
                src: a.sheet,
                width: 16,
                height: 16,
                offX: 0,
                offY: 240,
            },
            SUB: [
                {
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    SUB: [
                        {
                            name: 'off',
                        },
                        {
                            name: 'tmpOn',
                        },
                        {
                            name: 'tmpOnEnd',
                        },
                        {
                            name: 'on',
                        },
                    ],
                },
                {
                    tileOffset: this.element * 2 - 1,
                    repeat: true,
                    SUB: [
                        {
                            name: 'off',
                            time: 0.3,
                            frames: [0, 0, 0, 0],
                            framesGfxOffset: [0, 1, 0, 0, 0, -1, 0, 0],
                        },
                        {
                            name: 'tmpOn',
                            time: 0.1,
                            frames: [1, 1, 1, 1],
                            framesAlpha: [1, 0.66, 0.33, 0.66, 1],
                        },
                        {
                            name: 'tmpOnEnd',
                            time: 0.033,
                            frames: [1, 1, 1, 1],
                            framesAlpha: [1, 0.5, 0.25, 0.5, 1],
                        },
                        {
                            name: 'on',
                            time: 0.1,
                            frames: [1, 1, 1, 1],
                            framesAlpha: [1, 0.9, 0.8, 0.9, 1],
                        },
                    ],
                },
            ],
        })
        if ((a = ig.vars.get(this.variable))) { //I hate this. As lea would succincly put it: Whyyyy?
            this.turnOnGfx()
            this.state = c.ON
        }
        sc.ElementPoleGroupsMulti.registerDest(this, a) //I think e is settings, so a is settings.variable, ie the variable that gets made true if the dest is triggered
    },
    onKill(a) {
        this.timer && this.turnOff()
        sc.ElementPoleGroupsMulti.deleteGroup(this.group)
        this.parent(a)
    },
    update() {
        if (this.timer) {
            this.timer = this.timer - ig.system.tick
            this.timer <= 1 && this.currentAnim != 'tmpOnEnd' && this.setCurrentAnim('tmpOnEnd')
            if (this.timer <= 0) {
                this.timer = 0
                sc.ElementPoleGroupsMulti.onGroupChargeCancel(this) //This line MUST be fixed to use timed multi-group poles
                this.turnOff()
            }
        }
        if (this.state == c.CHARGING && sc.ElementPoleGroupsMulti.onCancelCheck(this)) {
            this.state = c.IDLE
            this.setCurrentAnim('off', true)
        }
        this.parent()
    },
    isOn() {
        return this.state == c.ON
    },
    onPoleHit(pole, isDone, allPoles) {
        const f = `${EL[this.element]}Charge`
        this.state = isDone ? c.ON : c.CHARGING
        pole.effects.handle && pole.effects.handle.stop()
        if (isDone)
            for (let p = allPoles.length; p--; ) {
                const k = this.effects.sheet.spawnOnTarget(f, this, {
                    target2: allPoles[p],
                    target2Align: ig.ENTITY_ALIGN.TOP,
                })
                if (allPoles[p] == pole) {
                    k.setCallback(this)
                    this.effects.handle = k
                }
            }
        else
            pole.effects.handle = this.effects.sheet.spawnOnTarget(`${f}Prepare`, this, {
                target2: pole,
                target2Align: ig.ENTITY_ALIGN.TOP,
                duration: -1,
            })
    },
    onEffectEvent(a) {
        a.state == ig.EFFECT_STATE.POST_LOOP && this.turnOn()
    },
    onCancel() {
        this.turnOff()
    },
    turnOn() {
        this.effects.handle = null
        sc.ElementPoleGroupsMulti.onFinalizeGroup(this)
        this.effects.sheet.spawnOnTarget(`${EL[this.element]}Activate`, this)
        ig.vars.set(this.variable, true)
        this.turnOnGfx()
    },
    turnOnGfx() {
        if (!this.effects.lightHandle) {
            const a = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false)
            a.setOffset(0, 0, 0)
            ig.light.addLightHandle(a)
            this.effects.lightHandle = a
        }
        if (this.activeTime) {
            this.timer = this.activeTime / sc.options.get('assist-puzzle-speed')
            this.setCurrentAnim('tmpOn', true)
        } else this.setCurrentAnim('on', true)
    },
    turnOff() {
        this.effects.lightHandle && this.effects.lightHandle.stop()
        this.effects.lightHandle = null
        ig.vars.set(this.variable, false)
        this.effects.handle && this.effects.handle.setCallback(null)
        this.effects.handle = null
        this.timer = 0
        this.state = c.OFF
        this.setCurrentAnim('off', true)
    },
})


ig.ACTION_STEP.SHOW_RANDOM_ANIMATION = ig.ActionStepBase.extend({
    randAnims/*: string[]*/: null,
    _wm/*: ig.Config*/: new ig.Config({
        attributes: {
            wait: {
                _type: 'Boolean',
                _info: 'Wait for animation to be finished',
            },
            randAnims: {
                _type: 'EntityAnimArray',
                _info: 'A list of animations. One of them will be shown randomly',
            },
        },
    }),
    init(settings/*: ig.ACTION_STEP.SHOW_RANDOM_ANIMATION.Settings*/)/*: SHOW_RANDOM_ANIMATION*/ {
        this.randAnims = settings.randAnims
        this.wait = settings.wait || false
    },
    start(target/*: ig.ActorEntity*/)/*: void*/ {
        const b = this.randAnims[Math.floor(Math.random() * this.randAnims.length)]
        target.setCurrentAnim(b, true, null, true)
        target.animationFixed = true
    },
})