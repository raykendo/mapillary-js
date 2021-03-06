/// <reference path="../../typings/index.d.ts" />

import * as when from "when";

import {IAPINavIm, APIv2} from "../../src/API";
import {TilesService} from "../../src/Graph";
import {TileFactory} from "../helper/TileFactory.spec";

describe("TilesService", () => {
    let tilesService: TilesService;
    let apiV2: APIv2;

    beforeEach(() => {
        apiV2 = new APIv2("clientId");
        tilesService = new TilesService(apiV2);
    });

    it("exists", () => {
        expect(tilesService).toBeDefined();
    });

    it("cache im tile", (done) => {
        let key: string = "key";
        let h: string = "h";

        spyOn(apiV2.nav, "im").and.callFake(() => {
            let result: IAPINavIm = {
                hs: [h],
                ims: [{key: key}],
                ss: [],
            };

            return when(result);
        });

        tilesService.cachedTiles$.subscribe((tilesCache: {[key: string]: boolean}) => {
            expect(tilesCache[h]).toBe(true);
            done();
        });

        tilesService.cacheIm$.next(key);
    });

    it("cache h tile", (done) => {
        let key: string = "key";
        let h: string = "h";

        spyOn(apiV2.nav, "h").and.callFake(() => {
            let result: IAPINavIm = {
                hs: [h],
                ims: [{key: key}],
                ss: [],
            };

            return when(result);
        });

        tilesService.cachedTiles$.subscribe((tilesCache: {[key: string]: boolean}) => {
            expect(tilesCache[h]).toBe(true);
            done();
        });

        tilesService.cacheH$.next(h);
    });

    it("cache generated h tile", (done) => {
        let tileFactory: TileFactory = new TileFactory();
        let hash: string = tileFactory.createHash({ col: 0, row: 0, size: 1 });

        spyOn(apiV2.nav, "h").and.callFake((h: string) => {
            let tile: IAPINavIm = tileFactory.create(h);

            return when(tile);
        });

        tilesService.cachedTiles$.subscribe((tilesCache: {[key: string]: boolean}) => {
            expect(tilesCache[hash]).toBe(true);
            done();
        });

        tilesService.cacheH$.next(hash);
    });
});
