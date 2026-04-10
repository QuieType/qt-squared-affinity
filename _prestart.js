

//adds a block that can slide and teleport
ig.module('game.feature.puzzle.entities.wave-sliding-block')
    .requires('impact.base.actor-entity', 'impact.base.entity', 'impact.feature.effect.effect-sheet')
    .defines(() => {
        const b = Vec2.create()
        const a = {}
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
                    const d = Vec2.assign(b, this.moveDir)
                    Vec2.length(d, 400 * ig.system.tick)
                    let c = ig.game.physics.initTraceResult(a)
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
                    d = Vec2.assign(b, this.moveDir/* || {x:0, y:0}*/)
                    c = ig.game.physics.initTraceResult(a)
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
//craete a lorry respawner that isn't tied to player position
ig.module('game.feature.puzzle.entities.lorry-extended')
    .requires('impact.base.entity', 'impact.feature.effect.effect-sheet', 'impact.base.actor-entity', 'game.feature.puzzle.entities.lorry')
    .defines(() => {
        ig.ENTITY.LorryQt = ig.ENTITY.Lorry.extend({
            resetPos(a, e) {
                this.coll.type = "NPBLOCK"
                const f = this.getAlignedPos(ig.ENTITY_ALIGN.TOP, b)
                d.spawnFixed('lorryDisappear', f.x, f.y, f.z)
                this.setPos(a.x, a.y, a.z)
                this.grabRail(e)
                this.setMove(false, true)
                this.pauseTimer = this.slowDownAccel = this.currentSpeed = this.animState.alpha = 0
                d.spawnOnTarget('lorryAppear', this, {
                    align: 'TOP',
                })
                this.coll.type = "BLOCK"
            },
        })
        ig.ENTITY.LorryRespawnerQt = ig.AnimatedEntity.extend({
            lorrySrc: null,
            lorry: null,
            initDir: Vec2.create(),
            lastAlpha: 0,
            _wm: new ig.Config({
                spawnable: true,
                attributes: {
                    spawnCondition: {
                        _type: 'VarCondition',
                        _info: 'Condition for Enemy to spawn',
                        _popup: true,
                    },
                    lorryEntity: {
                        _type: 'Entity',
                        _info: 'The lorry entity to be respawned at this point',
                    },
                    initDir: {
                        _type: 'String',
                        _info: 'The initial direction of the platform',
                        _select: ig.ActorEntity.FACE4,
                    },
                },
                drawBox: true,
                boxColor: 'rgba(0,255,255, 0.5)',
            }),
            init(a, b, d, g) {
                this.parent(a, b, d, g)
                this.coll.type = ig.COLLTYPE.NONE
                this.coll.setSize(32, 32, 0)
                ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE4[g.initDir], this.initDir)
                this.lorrySrc = g.lorryEntity
                this.lastAlpha = 0
            },
            fetchLorry() {
                if ((this.lorry = ig.Event.getEntity(this.lorrySrc)) && this.lorry.lorryType) {
                    const a = ig.mapStyle.get('lorry')
                    const b = this.lorry.lorryType
                    if (b) {
                        const d = this.coll
                        const g = b.size.x - this.coll.size.x
                        const h = b.size.y - this.coll.size.y
                        d.setSize(b.size.x, b.size.y, 0)
                        this.initAnimations({
                            sheet: {
                                src: a.sheet,
                                width: b.gfx.w - 2,
                                height: b.gfx.h - 2,
                                offX: a.lorryX + b.gfx.x + 1,
                                offY: a.lorryY + b.gfx.y + 1 + b.gfx.h * 2,
                            },
                            renderMode: 'lighter',
                            SUB: [
                                {
                                    name: 'default',
                                    time: 1,
                                    frames: [0],
                                    repeat: false,
                                },
                            ],
                        })
                        this.setPos(d.pos.x - g / 2, d.pos.y - h / 2, d.pos.z)
                    }
                }
            },
            //generally, I don't use ai while programming. I was having a very difficult time understanding the syntax of this function, so I used it. for the sake of transparency, here's the chat https://chatgpt.com/share/69d96da3-e74c-83ea-824e-61fc2a09b4f5.
            update() {
                this.lorry || this.fetchLorry()
                if (this.lorry) {
                    var a = 1
                    const b = ig.game.playerEntity
                    ig.EntityTools.getGroundEntity(b) == this.lorry && (a = 0)
                    let d = ig.CollTools.getGroundDistance(this.coll, this.lorry.coll)
                    !this.lorry.moving && d > 48 && (d = 200)
                    d < 48 ? (a = 0) : d < 200 && (a = a * ((d - 48) / 152))
                    var a = KEY_SPLINES.EASE_OUT.get(a)
                    const g = ig.system.tick * 10
                    this.lastAlpha = g * a + this.lastAlpha * (1 - g)
                    this.animState.alpha = this.lastAlpha
                    this.animState.scaleX = this.lastAlpha
                    this.animState.scaleY = this.lastAlpha
                    a = ig.CollTools.getGroundDistance(b.coll, this.coll)
                    if (ig.EntityTools.getGroundEntity(b) == this.lorry) {
                        this.lorry.resetPos(this.coll.pos, this.initDir)
                        d = b.coll
                        this.lorry.coll.intersectsWith(d.pos.x, d.pos.y, d.pos.z, d.size.x, d.size.y, d.size.z) &&
                            b.setPos(d.pos.x, d.pos.y, d.pos.z + this.lorry.coll.size.z)
                    }
                }
                this.parent()
            },
        })
    })