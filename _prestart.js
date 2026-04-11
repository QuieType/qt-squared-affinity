

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
