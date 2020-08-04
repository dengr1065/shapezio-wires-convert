const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = require("lz-string");
const Rusha = require("rusha");

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

    const hash = rawData.substr(0, 40);
    const json = rawData.substr(40);

    const hashBuilder = Rusha.createHash();
    hashBuilder.update(json + salt);
    const actualHash = hashBuilder.digest("hex");

    if (hash != actualHash) {
        throw new DecompressError("Hash mismatch.");
    }

    const obj = JSON.parse(json);
    const savegame = decompressObject(obj);

    savegame.dump.entities.forEach(entity => {
        if (entity.components.ItemAcceptor) {
            entity.components.ItemAcceptor.slots.forEach(slot => {
                slot.layer = "regular";
            });
            entity.components.ItemAcceptor.beltUnderlays.forEach(underlay => {
                underlay.layer = "regular";
            })
        }
        if (entity.components.ItemEjector) {
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
