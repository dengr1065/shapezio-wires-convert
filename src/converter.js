const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = require("lz-string");
const crc32 = require("crc/crc32").default;
const spriteToCode = require("./building_codes");

const CRC_PREFIX = "32".padEnd(32, "-");
class DecompressError extends Error { }

/**
 * @param {Buffer} save
 */
function convertSavegame(save) {
    const { decompressObject } = require("../data/compressor");
    const salt = require("../data/salt").file;

    if (save[0] != 0x01) {
        throw new DecompressError("Invalid savegame mark.");
    }

    const savegameString = save.toString("utf-8", 1);
    const rawData = decompressFromEncodedURIComponent(savegameString);

    if (!rawData) {
        throw new DecompressError("Could not decompress savegame.");
    }

    const json = rawData.startsWith(CRC_PREFIX) ?
        rawData.substr(8) :
        rawData.substr(40);

    crc32()
    const obj = JSON.parse(json);
    const savegame = decompressObject(obj);

    savegame.dump.entities.forEach(entity => {
        entity.components.Unremovable = undefined;
        entity.components.Hub = undefined;

        if (entity.components.StaticMapEntity) {
            const mapEntity = entity.components.StaticMapEntity;
            mapEntity.code = spriteToCode[mapEntity.spriteKey];

            mapEntity.tileSize = undefined;
            mapEntity.spriteKey = undefined;
            mapEntity.blueprintSpriteKey = undefined;
            mapEntity.silhouetteColor = undefined;
        }

        if (entity.components.Belt) {
            entity.components.ItemAcceptor = undefined;
            entity.components.ItemEjector = undefined;
        }

        if (entity.components.ItemAcceptor) {
            entity.components.ItemAcceptor.slots.forEach(slot => {
                slot.layer = "regular";
            });

            if (entity.components.ItemAcceptor.beltUnderlays.length > 0) {
                const underlays = entity.components.ItemAcceptor.beltUnderlays;
                entity.components.ItemAcceptor.animated = undefined;
                entity.components.ItemAcceptor.beltUnderlays = undefined;

                entity.components.BeltUnderlays = {
                    underlays: underlays.map(u => {
                        u.layer = undefined;
                        return u;
                    })
                };
            }
        }
        if (entity.components.ItemEjector) {
            entity.components.ItemEjector.instantEject = undefined;

            entity.components.ItemEjector.slots.forEach(slot => {
                slot.layer = "regular";
            });
        }
        entity.layer = "regular";
    });

    savegame.lastUpdate = Date.now();

    const converted = JSON.stringify(savegame);
    const newHash = Rusha.createHash();
    newHash.update(converted + salt);

    const compressed = compressToEncodedURIComponent(newHash.digest("hex") + converted);
    return Buffer.concat([Buffer.of(0x01), Buffer.from(compressed, "utf-8")]);
}

module.exports = convertSavegame;
